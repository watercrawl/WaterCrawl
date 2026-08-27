import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from scrapy.http import HtmlResponse, Request

from spider.middlewares import CamofoxMiddleware


class TestCamofoxMiddleware:
    def _make_crawler(self, camofox_url="http://camofox:9377", enabled=True):
        crawler = MagicMock()
        crawler.settings.getbool.return_value = enabled
        crawler.settings.get.side_effect = lambda key, default=None: {
            "CAMOFOX_URL": camofox_url,
            "CAMOFOX_API_KEY": "test-key",
        }.get(key, default)
        crawler.spider.helpers.wait_time = 500
        crawler.spider.helpers.timeout = 30000
        crawler.spider.pubsub_service = MagicMock()
        crawler.spider.logger = MagicMock()
        return crawler

    def _make_middleware(self, camofox_url="http://camofox:9377", enabled=True):
        crawler = self._make_crawler(camofox_url, enabled)
        return CamofoxMiddleware.from_crawler(crawler), crawler

    def test_from_crawler_returns_instance(self):
        mw, _ = self._make_middleware()
        assert isinstance(mw, CamofoxMiddleware)
        assert mw.camofox_url == "http://camofox:9377"

    def test_disabled_when_camofox_url_is_none(self):
        mw, crawler = self._make_middleware(camofox_url=None)
        request = Request(url="https://example.com")
        result = asyncio.run(mw.process_request(request, crawler.spider))
        assert result is None

    def test_skip_playwright_meta_returns_early(self):
        mw, crawler = self._make_middleware()
        request = Request(url="https://example.com", meta={"skip_playwright": True})
        result = asyncio.run(mw.process_request(request, crawler.spider))
        assert result is None

    @patch("spider.middlewares.httpx.AsyncClient")
    def test_successful_crawl_returns_html_response(self, mock_client_cls):
        mock_client = AsyncMock()
        mock_client_cls.return_value.__aenter__.return_value = mock_client

        mock_tab_resp = MagicMock()
        mock_tab_resp.json.return_value = {"tabId": "tab-123"}
        mock_tab_resp.raise_for_status = MagicMock()

        mock_eval_resp = MagicMock()
        mock_eval_resp.json.return_value = {"ok": True, "result": "<html><body>Hello</body></html>"}
        mock_eval_resp.raise_for_status = MagicMock()

        async def post_side_effect(url, **kwargs):
            if "/tabs/" in url and "/evaluate" in url:
                return mock_eval_resp
            if url.endswith("/tabs"):
                return mock_tab_resp
            return MagicMock()

        mock_client.post = AsyncMock(side_effect=post_side_effect)
        mock_client.delete = AsyncMock()

        mw, crawler = self._make_middleware()
        request = Request(url="https://example.com")
        result = asyncio.run(mw.process_request(request, crawler.spider))

        assert isinstance(result, HtmlResponse)
        assert result.body == b"<html><body>Hello</body></html>"
        assert result.status == 200
        assert result.request is request

        mock_client.delete.assert_called_once()

    @patch("spider.middlewares.httpx.AsyncClient")
    def test_camofox_unreachable_returns_none(self, mock_client_cls):
        mock_client = AsyncMock()
        mock_client_cls.return_value.__aenter__.return_value = mock_client

        import httpx
        mock_client.post.side_effect = httpx.ConnectError("Connection refused")

        mw, crawler = self._make_middleware()
        request = Request(url="https://example.com")
        result = asyncio.run(mw.process_request(request, crawler.spider))

        assert result is None
        crawler.spider.pubsub_service.send_feed.assert_called_once()

    @patch("spider.middlewares.httpx.AsyncClient")
    def test_camofox_timeout_returns_none(self, mock_client_cls):
        mock_client = AsyncMock()
        mock_client_cls.return_value.__aenter__.return_value = mock_client

        import httpx
        mock_client.post.side_effect = httpx.TimeoutException("timed out")

        mw, crawler = self._make_middleware()
        request = Request(url="https://example.com")
        result = asyncio.run(mw.process_request(request, crawler.spider))

        assert result is None
        crawler.spider.pubsub_service.send_feed.assert_called_once()

    @patch("spider.middlewares.httpx.AsyncClient")
    def test_evaluate_failure_still_cleans_up_tab(self, mock_client_cls):
        mock_client = AsyncMock()
        mock_client_cls.return_value.__aenter__.return_value = mock_client

        mock_tab_resp = MagicMock()
        mock_tab_resp.json.return_value = {"tabId": "tab-456"}
        mock_tab_resp.raise_for_status = MagicMock()

        async def post_side_effect(url, **kwargs):
            if "/evaluate" in url:
                raise Exception("eval failed")
            return mock_tab_resp

        mock_client.post = AsyncMock(side_effect=post_side_effect)
        mock_client.delete = AsyncMock()

        mw, crawler = self._make_middleware()
        request = Request(url="https://example.com")
        result = asyncio.run(mw.process_request(request, crawler.spider))

        assert isinstance(result, HtmlResponse)
        assert result.body == b""
        mock_client.delete.assert_called_once()

    def test_auth_header_omitted_when_no_api_key(self):
        crawler = self._make_crawler(camofox_url="http://camofox:9377")
        crawler.settings.get.side_effect = lambda key, default=None: {
            "CAMOFOX_URL": "http://camofox:9377",
            "CAMOFOX_API_KEY": None,
        }.get(key, default)
        mw = CamofoxMiddleware.from_crawler(crawler)

        request = Request(url="https://example.com")

        with patch("spider.middlewares.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client_cls.return_value.__aenter__.return_value = mock_client

            mock_tab = MagicMock()
            mock_tab.json.return_value = {"tabId": "tab-789"}
            mock_tab.raise_for_status = MagicMock()

            mock_eval = MagicMock()
            mock_eval.json.return_value = {"ok": True, "result": "<html></html>"}
            mock_eval.raise_for_status = MagicMock()

            async def post_side(url, **kwargs):
                if "/evaluate" in url:
                    return mock_eval
                return mock_tab

            mock_client.post = AsyncMock(side_effect=post_side)
            mock_client.delete = AsyncMock()

            asyncio.run(mw.process_request(request, crawler.spider))

            post_calls = [c for c in mock_client.post.call_args_list if "/tabs" in c.args[0] and "/evaluate" not in c.args[0]]
            if post_calls:
                assert "Authorization" not in post_calls[0].kwargs["headers"]
