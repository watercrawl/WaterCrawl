"""Regression tests for the Scrapy 2.14 spider pipeline silent-drop bug.

The bug: when ``SpiderPipeline.process_item`` was decorated with
``@sync_to_async``, every attribute access on the bound method returned a fresh
``functools.partial`` from asgiref. Scrapy 2.14's ``MiddlewareManager`` accesses
the method twice (once to append to ``self.methods["process_item"]``, once to
call ``_check_mw_method_spider_arg``). Because the two partials weren't equal,
the second access landed in ``_mw_methods_requiring_spider`` while the first
was the one Scrapy iterated. The set membership check then missed and Scrapy
called the method without the ``spider`` argument, the underlying sync
function raised ``TypeError``, and the item was silently dropped.

These tests guard the fix in ``spider/pipelines.py``.
"""

from unittest.mock import MagicMock

import pytest
from asgiref.sync import sync_to_async

from spider.items import LinkItem, ScrapedItem
from spider.pipelines import SiteScrapperPipeline, SpiderPipeline


class TestSpiderPipelineRegression:
    """Direct regression checks against the descriptor identity bug."""

    def test_process_item_is_a_stable_bound_method(self):
        """A real async def method returns the same object on each access."""
        pipe = SpiderPipeline()
        a = pipe.process_item
        b = pipe.process_item
        assert a == b
        assert hash(a) == hash(b)

    def test_sync_to_async_descriptor_does_NOT_return_stable_method(self):
        """Document the asgiref behaviour that originally caused the bug.

        If this assertion ever flips, asgiref has changed its descriptor
        behaviour and the workaround in pipelines.py may no longer be needed.
        """

        class Broken:
            @sync_to_async
            def process_item(self, item, spider):
                return item

        broken = Broken()
        assert broken.process_item != broken.process_item

    @pytest.mark.asyncio
    async def test_process_item_dispatches_scraped_item_to_add_scraped_item(self):
        from spider.spiders.scraper import SiteScrapper

        # Build a minimal spider-like object whose crawler_service.add_scraped_item
        # is a mock. We don't instantiate the real Scrapy spider here because that
        # would require the crawler boilerplate.
        spider = MagicMock(spec=SiteScrapper)
        spider.crawler_service = MagicMock()
        spider.crawler_service.add_scraped_item = MagicMock()

        item = ScrapedItem()
        item["url"] = "https://example.com/"
        await SpiderPipeline().process_item(item, spider)

        spider.crawler_service.add_scraped_item.assert_called_once_with(item)

    @pytest.mark.asyncio
    async def test_process_item_returns_item(self):
        spider = MagicMock()
        item = LinkItem()
        item["url"] = "https://example.com/"
        returned = await SpiderPipeline().process_item(item, spider)
        assert returned is item

    @pytest.mark.asyncio
    async def test_process_item_ignores_unmatched_spider_type(self):
        # spider isn't a SiteScrapper / SearchScrapper / SitemapScrapper
        spider = MagicMock()
        spider.crawler_service = MagicMock()
        item = ScrapedItem()
        item["url"] = "https://example.com/"
        await SpiderPipeline().process_item(item, spider)
        spider.crawler_service.add_scraped_item.assert_not_called()


class TestSiteScrapperPipeline:
    def test_make_url_hash_normalizes_trailing_slash_and_fragment(self):
        a = SiteScrapperPipeline.make_url_hash("https://example.com/x")
        b = SiteScrapperPipeline.make_url_hash("https://example.com/x/")
        c = SiteScrapperPipeline.make_url_hash("https://example.com/x#section")
        assert a == b == c

    def test_process_item_dedupes_urls(self):
        pipe = SiteScrapperPipeline()
        a = LinkItem()
        a["url"] = "https://example.com/x"
        a["title"] = "Title A"

        b = LinkItem()
        b["url"] = "https://example.com/x/"  # same after normalization
        b["title"] = "Title B (different)"

        pipe.process_item(a, MagicMock())
        pipe.process_item(b, MagicMock())
        assert len(pipe.url_map) == 1

    def test_process_item_keeps_shorter_title_on_duplicate(self):
        pipe = SiteScrapperPipeline()
        a = LinkItem()
        a["url"] = "https://example.com/x"
        a["title"] = "Very Long Original Title"
        b = LinkItem()
        b["url"] = "https://example.com/x"
        b["title"] = "Short"
        pipe.process_item(a, MagicMock())
        pipe.process_item(b, MagicMock())
        assert next(iter(pipe.url_map.values()))["title"] == "Short"

    def test_process_item_skips_empty_url_or_title(self):
        pipe = SiteScrapperPipeline()
        a = LinkItem()
        a["url"] = ""
        a["title"] = "no url"
        pipe.process_item(a, MagicMock())
        assert pipe.url_map == {}

    def test_process_item_ignores_non_linkitem(self):
        pipe = SiteScrapperPipeline()
        item = ScrapedItem()
        item["url"] = "https://example.com/x"
        pipe.process_item(item, MagicMock())
        assert pipe.url_map == {}

    def test_normalize_title_strips_invisible_chars_and_truncates(self):
        pipe = SiteScrapperPipeline()
        # zero-width space in input
        title = "Hello​World " + "x" * 200
        out = pipe._normalize_title(title)
        assert "​" not in out
        assert len(out) <= pipe.title_max_length

    @pytest.mark.asyncio
    async def test_save_sitemap_noop_when_empty(self):
        pipe = SiteScrapperPipeline()
        spider = MagicMock()
        await pipe.save_sitemap(spider)
        spider.crawler_service.add_sitemap.assert_not_called()

    @pytest.mark.asyncio
    async def test_save_sitemap_writes_collected_urls(self):
        pipe = SiteScrapperPipeline()
        item = LinkItem()
        item["url"] = "https://example.com/x"
        item["title"] = "X"
        pipe.process_item(item, MagicMock())

        spider = MagicMock()
        spider.crawler_service = MagicMock()
        await pipe.save_sitemap(spider)
        spider.crawler_service.add_sitemap.assert_called_once()
