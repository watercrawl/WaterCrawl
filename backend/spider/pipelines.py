from asgiref.sync import sync_to_async

from .helpers import HtmlFilter, HtmlToMarkdown
from .items import ScrapedItem
from .spiders.scraper import SiteScrapper


class SpiderPipeline:
    @sync_to_async
    def process_item(self, item: ScrapedItem, spider: SiteScrapper):
        spider.crawler_service.add_scraped_item(item)
        return item


class MarkdownPipeline:
    def process_item(self, item: ScrapedItem, spider: SiteScrapper):
        item["markdown"] = HtmlToMarkdown(item["filtered_html"]).convert_to_markdown()
        return item


class HTMLFilterPipeline:
    def process_item(self, item: ScrapedItem, spider: SiteScrapper):
        item["filtered_html"] = HtmlFilter(
            item["html"], spider.helpers.get_html_filter_options()
        ).filter_html()
        return item
