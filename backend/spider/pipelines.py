import hashlib
import re

from asgiref.sync import sync_to_async
import logging

from scrapy import signals

from .helpers import HtmlFilter, HtmlToMarkdown
from .items import ScrapedItem, LinkItem, SearchResult, SitemapResult
from .spiders.google_search import SearchScrapper
from .spiders.scraper import SiteScrapper
from .spiders.sitemap import SitemapScrapper


class SpiderPipeline:
    @sync_to_async
    def process_item(self, item: ScrapedItem, spider):
        if isinstance(item, ScrapedItem) and isinstance(spider, SiteScrapper):
            """
            spider # type: SiteScrapper
            """
            spider.crawler_service.add_scraped_item(item)
        elif isinstance(item, SearchResult) and isinstance(spider, SearchScrapper):
            """
            spider # type: SearchScrapper
            """
            spider.search_service.add_search_result(item)

        elif isinstance(item, SitemapResult) and isinstance(spider, SitemapScrapper):
            """
            spider # type: SitemapScrapper
            """
            spider.sitemap_request_service.add_sitemap_result(item)


class SiteScrapperPipeline:
    """
    Pipeline for processing scraped links from websites.

    This pipeline processes LinkItem objects, deduplicates URLs, and stores
    the most concise title for each URL. Results are saved to a configurable
    output file when the spider closes.
    """

    def __init__(self):
        """Initialize the pipeline with configuration settings."""
        self.url_map = {}
        self.title_max_length = 100
        self.logger = logging.getLogger(__name__)
        self.processed_count = 0
        self.duplicate_count = 0

    @classmethod
    def from_crawler(cls, crawler, *args, **kwargs):
        pipeline = cls()
        crawler.signals.connect(pipeline.save_sitemap, signal=signals.spider_closed)
        return pipeline

    @classmethod
    def make_url_hash(cls, url):
        url = url.split("#")[0]
        url = url.strip()
        if url.endswith("/"):
            url = url[:-1]
        return hashlib.md5(url.encode()).hexdigest()

    def process_item(self, item, spider):
        """
        Process each scraped item.

        Args:
            item: The LinkItem being processed
            spider: The spider that scraped the item

        Returns:
            The processed item
        """
        if not isinstance(item, LinkItem):
            return item

        try:
            # Normalize URL and title
            url = self._normalize_url(item.get("url", ""))
            title = self._normalize_title(item.get("title", ""))
            url_hash = self.make_url_hash(url)

            if not url or not title:
                self.logger.debug(f"Skipping item with empty URL or title: {item}")
                return item

            if url_hash not in self.url_map:
                self.url_map[url_hash] = {
                    "url": url,
                    "title": title,
                }
                self.processed_count += 1
                if self.processed_count % 100 == 0:
                    self.logger.info(f"Processed {self.processed_count} unique URLs")
            else:
                # Keep the shorter, more concise title
                if len(self.url_map[url_hash]["title"]) > len(title) > 0:
                    self.logger.debug(f"Updating title for {url}")
                    self.url_map[url_hash]["title"] = title
                self.duplicate_count += 1

            return item
        except Exception as e:
            self.logger.error(f"Error processing item {item}: {str(e)}")
            return item

    async def save_sitemap(self, spider: SiteScrapper):
        """
        Called when the spider closes. Saves collected data to output file.

        Args:
            spider: The Spider instance that closed
        """

        if not self.url_map:
            return

        await sync_to_async(spider.crawler_service.add_sitemap)(
            list(self.url_map.values())
        )

    def _normalize_url(self, url):
        """
        Normalize URL by removing fragments and extra whitespace.

        Args:
            url: The URL to normalize

        Returns:
            Normalized URL string
        """
        if not url:
            return ""

        url = url.strip()
        # Remove URL fragments
        url = url.split("#")[0]

        return url

    def _remove_invisible_chars(self, text):
        pattern = r"[\u200B\u200C\u200D\uFEFF\u2060\u180E\u00A0\u202F\u2061\u2062\u2063\u2064]"
        return re.sub(pattern, "", text)

    def _normalize_title(self, title):
        """
        Normalize title by removing extra whitespace and limiting length.

        Args:
            title: The title to normalize

        Returns:
            Normalized title string
        """
        if not title:
            return ""

        title = self._remove_invisible_chars(title)

        # Clean up title
        title = title.strip()

        # Limit title length
        return title[: self.title_max_length] if title else ""

    def _check_unique(self, url):
        if url.endswith("/") and url[:-1] in self.url_map:
            return False
        return url not in self.url_map


class MarkdownPipeline:
    def process_item(self, item: ScrapedItem, spider: SiteScrapper):
        if not isinstance(item, ScrapedItem):
            return item
        item["markdown"] = HtmlToMarkdown(item["filtered_html"]).convert_to_markdown()
        return item


class HTMLFilterPipeline:
    def process_item(self, item: ScrapedItem, spider: SiteScrapper):
        if not isinstance(item, ScrapedItem):
            return item
        item["filtered_html"] = HtmlFilter(
            item["html"], spider.helpers.get_html_filter_options()
        ).filter_html()
        return item
