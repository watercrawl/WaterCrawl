from typing import Iterable

from scrapy import Request, Spider

from core.services import CrawlerService
from spider import settings
from spider.items import ScrapedItem


class SiteScrapper(Spider):
    name = 'SiteScrapper'
    allowed_domains = []

    def __init__(self, crawl_request_uuid, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.crawler_service = CrawlerService.make_with_pk(crawl_request_uuid)
        self.helpers = self.crawler_service.config_helpers
        self.plugin_validators = {}
        self.init_plugins()

    def init_plugins(self):
        for plugin in settings.PLUGINS:
            validator = plugin.make_input_validator(self.crawler_service.crawl_request.options)
            self.plugin_validators[validator.plugin.plugin_key()] = validator

    def start_requests(self) -> Iterable[Request]:
        yield Request(
            url=self.crawler_service.crawl_request.url,
            callback=self.parse,
        )

    def parse(self, response, **kwargs):
        links = response.css('a::attr(href)').getall()
        result_links = []
        for link in links:
            link = link if link.startswith('http') else response.urljoin(link)
            if not self.helpers.is_allowed_path(link):
                continue
            result_links.append(
                link
            )
            yield response.follow(link, callback=self.parse)

        yield self.__process_response(response, sorted(set(result_links)))

    def __process_response(self, response, links=None):
        # Create a dictionary to store all meta tag data
        meta_data = {}

        # Loop over all <meta> tags and extract their attributes
        for meta_tag in response.xpath("//meta"):
            # Get the 'name' and 'property' attributes, and their 'content'
            name = meta_tag.xpath("@name").get()
            property = meta_tag.xpath("@property").get()
            content = meta_tag.xpath("@content").get()

            if name:
                meta_data[name] = content  # Store by 'name'
            elif property:
                meta_data[property] = content  # Store by 'property'

        item = ScrapedItem()
        item['url'] = response.url
        item['links'] = links or []
        item['metadata'] = meta_data
        item['html'] = response.text
        item['crawl_request_uuid'] = self.crawler_service.crawl_request.uuid
        item['attachments'] = response.meta['attachments'] if 'attachments' in response.meta else []
        return item
