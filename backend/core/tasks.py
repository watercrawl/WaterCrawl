from celery.app import shared_task

from core.services import CrawlerService, SearchService


@shared_task
def run_spider(crawl_request_pk: str):
    service = CrawlerService.make_with_pk(crawl_request_pk)
    service.run()


@shared_task
def run_search(search_request_uuid):
    service = SearchService.make_with_pk(search_request_uuid)
    service.run()
