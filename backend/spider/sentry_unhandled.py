import sentry_sdk

from scrapy import signals
from scrapy.exceptions import (
    IgnoreRequest,
    CloseSpider,
    DropItem,
)
from scrapy.spidermiddlewares.httperror import HttpError
from twisted.internet.error import DNSLookupError, TimeoutError, TCPTimedOutError
from twisted.web._newclient import ResponseNeverReceived


IGNORED_EXCEPTIONS = (
    HttpError,  # HTTP 4xx / 5xx
    IgnoreRequest,  # intentional skips
    DropItem,  # pipelines
    CloseSpider,  # control flow
    DNSLookupError,  # infra noise
    TimeoutError,
    TCPTimedOutError,
    ResponseNeverReceived,
)


class SentryUnhandledExtension:
    @classmethod
    def from_crawler(cls, crawler):
        ext = cls()
        crawler.signals.connect(ext.spider_error, signal=signals.spider_error)
        return ext

    def spider_error(self, failure, response, spider):
        exc = failure.value

        # 1. Ignore known / expected exceptions
        if isinstance(exc, IGNORED_EXCEPTIONS):
            return

        # 2. Capture everything else (this is what you want)
        with sentry_sdk.push_scope() as scope:
            scope.set_tag("spider", spider.name)

            if response:
                scope.set_extra("url", response.url)
                scope.set_extra("status", response.status)

            scope.set_extra("exception_type", type(exc).__name__)

            sentry_sdk.capture_exception(exc)
            sentry_sdk.flush(timeout=2)
