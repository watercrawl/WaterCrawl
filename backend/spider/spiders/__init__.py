# This package will contain the spiders of your Scrapy project
#
# Please refer to the documentation for information on how to create and manage
# your spiders.

import sentry_sdk
from scrapy import Spider


class SentryCaptureSpider(Spider):
    """Base spider that captures unhandled exceptions to Sentry during init."""

    @classmethod
    def from_crawler(cls, crawler, *args, **kwargs):
        try:
            return super().from_crawler(crawler, *args, **kwargs)
        except Exception:
            sentry_sdk.capture_exception()
            sentry_sdk.flush(timeout=2)
            raise
