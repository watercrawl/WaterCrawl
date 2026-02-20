from typing import Iterable

from scrapy import Request, signals

from spider.spiders import SentryCaptureSpider

from core import consts
from core.services import SearchService, BasePubSupService
from spider import settings
from spider.items import SearchResult


class SearchScrapper(SentryCaptureSpider):
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
        self.pubsub_service: BasePubSupService = self.search_service.pubsub_service
        self.plugin_validators = {}
        self.results = dict()
        self.init_plugins()

    @classmethod
    def from_crawler(cls, crawler, *args, **kwargs):
        spider = super().from_crawler(crawler, *args, **kwargs)
        crawler.signals.connect(spider.spider_closed, signal=signals.spider_closed)
        return spider

    def spider_closed(self, spider, reason):
        # This will be called automatically when the spider is about to close
        # The yielded item will be processed by the pipelines
        self.pubsub_service.send_feed(
            f"Search completed with {len(self.results)} result(s). Stopped due to: {reason}.",
            feed_type="info",
        )
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

        self.pubsub_service.send_feed(
            f"Performing advanced search for URL: {url}", feed_type="info"
        )

        yield Request(
            url=url,
            callback=self.parse_advanced,
            errback=self.search_error,
            meta={
                "url": url,
                "title": title,
                "description": description,
                "skip_playwright": False if self.helpers.is_ultimate else True,
            },
        )

    def search_error(self, failure):
        self.pubsub_service.send_feed(
            f"Error occurred while searching/scraping: {failure.value}",
            feed_type="error",
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


class GoogleCustomSearchScrapper(SearchScrapper):
    name = "GoogleCustomSearchScrapper"
    allowed_domains = []

    def make_url(self, start=None):
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": settings.GOOGLE_API_KEY,
            "cx": settings.GOOGLE_CSE_ID,
            "q": self.helpers.search_query,
            "hl": self.helpers.language,
            "gl": self.helpers.country,
            "start": start,
            "dateRestrict": self.helpers.time_range[0]
            if self.helpers.time_range
            else None,
        }

        url = f"{url}?{'&'.join([f'{key}={value}' for key, value in params.items() if value])}"
        return url

    def start_requests(self) -> Iterable[Request]:
        self.pubsub_service.send_feed(
            f"Starting Search for query: {self.helpers.search_query}", feed_type="info"
        )
        yield Request(
            url=self.make_url(),
            callback=self.parse_json,
            errback=self.search_error,
            meta={"skip_playwright": True},
        )

    def parse_json(self, response):
        data = response.json()

        for item in data["items"]:
            url = item["link"]
            title = item["title"]
            description = item["snippet"]

            if "pagemap" in item:
                if "metatags" in item["pagemap"]:
                    if "og:title" in item["pagemap"]["metatags"][0]:
                        title = item["pagemap"]["metatags"][0]["og:title"]
                    if "og:description" in item["pagemap"]["metatags"][0]:
                        description = item["pagemap"]["metatags"][0]["og:description"]

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

        if "queries" in data and "nextPage" in data["queries"]:
            self.pubsub_service.send_feed(
                "Fetching next page of results", feed_type="info"
            )
            yield Request(
                url=self.make_url(start=data["queries"]["nextPage"][0]["startIndex"]),
                callback=self.parse_json,
                errback=self.search_error,
                meta={"skip_playwright": True},
            )
