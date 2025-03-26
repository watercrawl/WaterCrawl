from scrapy import signals, Request, Spider
from scrapy.http import Response


class StopAfterRequestsExtension:
    def __init__(self, max_requests):
        self.max_requests = max_requests
        self.request_count = 0

    @classmethod
    def from_crawler(cls, crawler):
        # Instantiate the extension with the setting value
        ext = cls(max_requests=crawler.settings.getint('MAX_REQUESTS', 100))

        # Connect signals
        crawler.signals.connect(ext.request_scheduled, signal=signals.response_received)
        return ext

    def request_scheduled(self, response: Response, request: Request, spider: Spider):
        if response.status == 200 and 'robot.txt' not in response.url and 'robots.txt' not in response.url:
            self.request_count += 1

        if self.request_count >= self.max_requests:
            spider.crawler.engine.close_spider(spider, 'max_response_received')
