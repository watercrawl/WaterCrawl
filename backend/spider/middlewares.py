import traceback

import httpx
from scrapy.http import HtmlResponse

from core.services import CrawlHelpers, BasePubSupService


class PlaywrightMiddleware:
    def __init__(
        self,
        helpers: CrawlHelpers,
        pubsub_service: BasePubSupService,
        playwright_server: str,
        playwright_api_key: str = None,
    ):
        self.helpers = helpers
        self.pubsub_service = pubsub_service
        self.playwright_server = playwright_server
        self.playwright_api_key = playwright_api_key
        self.is_active = bool(helpers.wait_time > 0)

    @classmethod
    def from_crawler(cls, crawler):
        # Initialize the middleware
        playwright_server = crawler.settings.get("PLAYWRIGHT_SERVER")
        playwright_api_key = crawler.settings.get("PLAYWRIGHT_API_KEY")
        return cls(
            helpers=crawler.spider.helpers,
            pubsub_service=crawler.spider.pubsub_service,
            playwright_server=playwright_server,
            playwright_api_key=playwright_api_key,
        )

    async def process_request(self, request, spider):
        if not self.is_active:
            self.pubsub_service.send_feed(
                "Playwright middleware is not active", 
                feed_type="warning"
            )
            return
        spider_ignore_rendering = getattr(getattr(spider, 'helpers', None), 'ignore_rendering', False)    
        if request.meta.get('skip_playwright', False) or spider_ignore_rendering:
            reason = 'skip_playwright' if request.meta.get('skip_playwright') else 'ignore_rendering'
            spider.logger.debug(f"Skipping Playwright rendering for {request.url} - {reason} is True")
            return

        # Check if the URL is a JavaScript file
        if not self.playwright_server:
            spider.logger.info("Playwright server is not configured")
            self.pubsub_service.send_feed(
                "Playwright server is not configured", feed_type="error"
            )
            return

        if "skip_playwright" in request.meta and request.meta["skip_playwright"]:
            spider.logger.info("Skipping Playwright for request: %s", request.url)
            return

        payload = {
            "url": request.url,
            "block_media": False,
            "wait_after_load": self.helpers.wait_time,
            "timeout": self.helpers.timeout,
            "user_agent": request.headers.get("User-Agent", b"").decode("utf-8"),
            "accept_cookies_selector": self.helpers.accept_cookies_selector,
            "locale": self.helpers.locale,
            "extra_headers": self.helpers.extra_headers,
            "actions": self.helpers.actions,
        }
        proxy = request.meta.get("proxy_object", None)
        if proxy:
            payload["proxy"] = proxy
        headers = {
            "X-Api-Key": self.playwright_api_key,
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.playwright_server + "/html",
                    headers=headers,
                    json=payload,
                    timeout=self.helpers.timeout
                    / 1000,  # Convert ms to seconds if needed
                )
                if response.status_code == 500:
                    error_data = response.json()
                    raise Exception(error_data.get("error", error_data))

                response.raise_for_status()

                data = response.json()

                if data["status_code"] > 299:
                    self.pubsub_service.send_feed(
                        f"Playwright request failed for {request.url}: {data.get('error', 'Unknown error')}",
                        feed_type="error",
                    )
                    raise None

                request.meta["playwright"] = True
                request.meta["attachments"] = [
                    {
                        "content": attachment["content"],
                        "type": attachment["type"],
                        "filename": "Screenshot.{}".format(
                            "png" if attachment["type"] == "screenshot" else "pdf"
                        ),
                    }
                    for attachment in data.get("attachments", [])
                ]
                return HtmlResponse(
                    url=request.url,
                    body=data["html"],
                    status=data["status_code"],
                    request=request,
                    encoding="utf-8",
                )
            except httpx.RequestError as e:
                spider.logger.error(f"Error processing request: {e}")
                # print traceback
                traceback.print_exc()

                self.pubsub_service.send_feed(
                    f"Failed to process request {request.url}. "
                    "This may be due to a network issue or the server being unavailable.",
                    feed_type="error",
                )

                return None
