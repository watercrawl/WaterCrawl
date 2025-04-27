from typing import Iterable

from scrapy import Request, Spider, signals

from core import consts
from core.services import SearchService
from spider import settings
from spider.items import SearchResult


class SearchScrapper(Spider):
    name = None
    allowed_domains = []

    custom_settings = {
        "ROBOTSTXT_OBEY": False,
    }

    def __init__(self, search_request_uuid, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.search_service: SearchService = SearchService.make_with_pk(
            search_request_uuid
        )
        self.helpers = self.search_service.config_helpers
        self.plugin_validators = {}
        self.results = dict()
        self.init_plugins()

    @classmethod
    def from_crawler(cls, crawler, *args, **kwargs):
        spider = super().from_crawler(crawler, *args, **kwargs)
        crawler.signals.connect(spider.spider_closed, signal=signals.spider_closed)
        return spider

    def spider_closed(self, spider):
        # This will be called automatically when the spider is about to close
        # The yielded item will be processed by the pipelines
        self.crawler.engine.scraper.itemproc.process_item(
            SearchResult(
                results=[
                    {
                        "url": item["url"],
                        "title": item["advanced_title"] or item["title"],
                        "description": item["advanced_description"]
                        or item["description"],
                        "order": item["order"],
                        "depth": self.helpers.depth
                        if item["advanced_title"] or item["advanced_description"]
                        else consts.SEARCH_DEPTH_BASIC,
                    }
                    for item in sorted(self.results.values(), key=lambda x: x["order"])
                ]
            ),
            spider,
        )

    def init_plugins(self):
        for plugin in settings.PLUGINS:
            # todo: define how we want to use plugins in search
            self.plugin_validators[plugin.plugin_key()] = None

    def start_requests(self) -> Iterable[Request]:
        yield Request(
            url=self.helpers.search_url,
            callback=self.parse,
            meta={"download_timeout": 3},
        )

    def append_result(self, url, title, description):
        if url not in self.results:
            self.results[url] = {
                "url": url,
                "title": title,
                "advanced_title": None,
                "description": description,
                "advanced_description": None,
                "order": len(self.results),
            }
            return True

        if len(self.results[url]["title"]) < len(title):
            self.results[url]["title"] = title

        if len(self.results[url]["description"]) < len(description):
            self.results[url]["description"] = description

        return False

    def advanced_search(self, url, title, description, is_new=True):
        if not self.helpers.advanced_search:
            return

        yield Request(
            url=url,
            callback=self.parse_advanced,
            meta={
                "url": url,
                "title": title,
                "description": description,
                "skip_playwright": False if self.helpers.is_ultimate else True,
            },
        )

    def parse_advanced(self, response):
        page_description = response.xpath("//meta[@name='description']/@content").get()
        page_title = response.xpath("//title/text()").get()

        if page_title:
            self.results[response.meta["url"]]["advanced_title"] = page_title

        if page_description:
            self.results[response.meta["url"]]["advanced_description"] = (
                page_description
            )


class GoogleSearchScrapper(SearchScrapper):
    name = "GoogleSearchScrapper"
    allowed_domains = []

    def parse(self, response, **kwargs):
        for result in response.css("#search a"):
            if result.css(".fl"):
                continue

            url = result.css("a::attr(href)").get()
            if not url or url.startswith("/search") or url.startswith("#"):
                continue

            description = "".join(
                result.xpath("ancestor::div[5]")
                .css(".VwiC3b")
                .xpath(".//text()")
                .getall()
            )
            if not description:
                description = "".join(
                    result.xpath("ancestor::div[7]")
                    .css(".VwiC3b")
                    .xpath(".//text()")
                    .getall()
                )

            title = (
                result.css("h3").xpath(".//text()").get()
                or result.xpath(".//text()").get()
                or ""
            )

            if not title and not description:
                continue

            if self.append_result(
                url=url,
                title=title,
                description=description,
            ):
                yield from self.advanced_search(
                    url=url,
                    title=title,
                    description=description,
                )

            if len(self.results) >= self.search_service.search_request.result_limit:
                # If we've reached the result limit, finalize and stop
                return

        next_page = response.css("a#pnnext::attr(href)").get()
        if not next_page:
            # If there's no next page, finalize
            return

        yield response.follow(next_page, callback=self.parse)
