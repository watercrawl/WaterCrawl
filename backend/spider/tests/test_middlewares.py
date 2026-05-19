"""Tests for spider downloader middlewares."""

from unittest.mock import MagicMock

import pytest
from scrapy.exceptions import IgnoreRequest

from spider.middlewares import LimitRequestsMiddleware


class TestLimitRequestsMiddleware:
    def _make_request(self, url):
        r = MagicMock()
        r.url = url
        return r

    def test_spider_opened_resets_counter(self):
        mw = LimitRequestsMiddleware(max_requests=3)
        mw.dispatched = 99
        mw.spider_opened(MagicMock())
        assert mw.dispatched == 0

    def test_process_request_counts_requests(self):
        mw = LimitRequestsMiddleware(max_requests=3)
        mw.spider_opened(MagicMock())
        for _ in range(3):
            mw.process_request(self._make_request("https://example.com/"), None)
        assert mw.dispatched == 3

    def test_robots_txt_does_not_count(self):
        mw = LimitRequestsMiddleware(max_requests=1)
        mw.spider_opened(MagicMock())
        mw.process_request(self._make_request("https://example.com/robots.txt"), None)
        mw.process_request(self._make_request("https://example.com/robot.txt"), None)
        assert mw.dispatched == 0

    def test_raises_ignore_request_at_limit(self):
        mw = LimitRequestsMiddleware(max_requests=1)
        mw.spider_opened(MagicMock())
        mw.process_request(self._make_request("https://example.com/a"), None)
        with pytest.raises(IgnoreRequest):
            mw.process_request(self._make_request("https://example.com/b"), None)

    def test_process_response_passthrough(self):
        mw = LimitRequestsMiddleware(max_requests=1)
        resp = MagicMock()
        assert mw.process_response(MagicMock(), resp, MagicMock()) is resp

    def test_process_exception_returns_none(self):
        mw = LimitRequestsMiddleware(max_requests=1)
        assert mw.process_exception(MagicMock(), Exception(), MagicMock()) is None
