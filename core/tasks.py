from celery.app import shared_task

from core.services import CrawlerService


@shared_task
def run_spider(crawl_request_pk: str):
    service = CrawlerService.make_with_pk(crawl_request_pk)
    service.run()
