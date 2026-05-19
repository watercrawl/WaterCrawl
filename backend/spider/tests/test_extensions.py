"""Tests for spider extensions."""

from unittest.mock import MagicMock

from spider.extensions import StopAfterRequestsExtension


class TestStopAfterRequestsExtension:
    def _response(self, status=200, url="https://example.com/"):
        r = MagicMock()
        r.status = status
        r.url = url
        return r

    def _request(self):
        return MagicMock()

    def _spider(self):
        s = MagicMock()
        s.crawler = MagicMock()
        s.crawler.engine = MagicMock()
        return s

    def test_increments_only_on_200_non_robots(self):
        ext = StopAfterRequestsExtension(max_requests=5)
        spider = self._spider()
        ext.request_scheduled(self._response(200), self._request(), spider)
        ext.request_scheduled(
            self._response(200, "https://example.com/robots.txt"),
            self._request(),
            spider,
        )
        ext.request_scheduled(self._response(500), self._request(), spider)
        assert ext.request_count == 1

    def test_closes_spider_when_threshold_reached(self):
        ext = StopAfterRequestsExtension(max_requests=2)
        spider = self._spider()
        ext.request_scheduled(self._response(200), self._request(), spider)
        ext.request_scheduled(self._response(200), self._request(), spider)
        # second call hits >= max_requests -> triggers close_spider
        spider.crawler.engine.close_spider.assert_called_once()
        args, _ = spider.crawler.engine.close_spider.call_args
        assert args[1] == "max_response_received"

    def test_does_not_close_below_threshold(self):
        ext = StopAfterRequestsExtension(max_requests=5)
        spider = self._spider()
        for _ in range(3):
            ext.request_scheduled(self._response(200), self._request(), spider)
        spider.crawler.engine.close_spider.assert_not_called()
