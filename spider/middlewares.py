import httpx
from scrapy.http import HtmlResponse

from core.services import CrawlHelpers


class PlaywrightMiddleware:

    def __init__(self, helpers: CrawlHelpers, playwright_server: str, playwright_api_key: str = None):
        self.helpers = helpers
        self.playwright_server = playwright_server
        self.playwright_api_key = playwright_api_key
        self.is_active = bool(self.helpers.wait_time > 0)

    @classmethod
    def from_crawler(cls, crawler):
        # Initialize the middleware
        playwright_server = crawler.settings.get('PLAYWRIGHT_SERVER')
        playwright_api_key = crawler.settings.get('PLAYWRIGHT_API_KEY')
        return cls(
            helpers=crawler.spider.helpers,
            playwright_server=playwright_server,
            playwright_api_key=playwright_api_key
        )

    async def process_request(self, request, spider):
        if not self.is_active:
            return

        # Check if the URL is a JavaScript file
        if not self.playwright_server:
            spider.logger.info("Playwright server is not configured")
            return None

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
        proxy = request.meta.get("proxy")
        if proxy:
            payload["proxy"] = proxy
        headers = {
            'X-Api-Key': self.playwright_api_key,
            'Content-Type': 'application/json',
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.playwright_server + '/html',
                    headers=headers,
                    json=payload,
                    timeout=self.helpers.timeout / 1000  # Convert ms to seconds if needed
                )
                response.raise_for_status()

                data = response.json()

                request.meta['playwright'] = True
                request.meta['attachments'] = [{
                    'content': attachment['content'],
                    'type': attachment['type'],
                    'filename': 'Screenshot.{}'.format('png' if attachment['type'] == 'screenshot' else 'pdf')
                } for attachment in data.get('attachments', [])]
                return HtmlResponse(
                    url=request.url,
                    body=data['html'],
                    status=data['status_code'],
                    request=request,
                    encoding="utf-8",
                )
            except httpx.RequestError as e:
                spider.logger.error(f"Error processing request: {e}")
                return None
