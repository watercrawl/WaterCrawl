"""Regression markers for the Scrapy 2.14 upgrade fixes.

These tests guard the spider/settings.py module-load behaviour that we baked
in to unblock the upgrade. If either invariant regresses, real crawl runs will
start failing again silently.
"""

import os


def test_django_allow_async_unsafe_is_enabled():
    """Required because Scrapy 2.14 calls spider.__init__ inside the asyncio
    event loop, where Django would otherwise refuse the sync ORM lookups our
    spider constructors do."""
    # Importing the module triggers the setdefault call.
    import importlib

    importlib.import_module("spider.settings")
    assert os.environ.get("DJANGO_ALLOW_ASYNC_UNSAFE") == "true"


def test_scheduler_priority_queue_pinned_to_scrapy_priority_queue():
    """Scrapy 2.14 changed the default to DownloaderAwarePriorityQueue, which
    raises a ValueError if CONCURRENT_REQUESTS_PER_IP is set. We always set it,
    so we have to pin the previous default."""
    import spider.settings as spider_settings

    assert (
        spider_settings.SCHEDULER_PRIORITY_QUEUE == "scrapy.pqueues.ScrapyPriorityQueue"
    )


def test_twisted_reactor_uses_asyncio_selector():
    import spider.settings as spider_settings

    assert (
        spider_settings.TWISTED_REACTOR
        == "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
    )
