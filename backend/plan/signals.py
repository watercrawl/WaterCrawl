from django.conf import settings
from django.db import models
from django.dispatch import receiver

from core.models import CrawlRequest, SearchRequest, SitemapRequest
from core import consts as core_consts
from plan.services import UsageHistoryService


@receiver(models.signals.post_save, sender=CrawlRequest)
def update_crawl_request(sender, instance: CrawlRequest, **kwargs):
    if not settings.CAPTURE_USAGE_HISTORY:
        return

    if instance.status == core_consts.CRAWL_STATUS_NEW:
        UsageHistoryService(instance.team).create(instance)

    if instance.status in [
        core_consts.CRAWL_STATUS_CANCELED,
        core_consts.CRAWL_STATUS_FINISHED,
    ]:
        UsageHistoryService(instance.team).update_used_page_credit(instance)

    if instance.status == core_consts.CRAWL_STATUS_FAILED:
        UsageHistoryService(instance.team).revert_page_credit(instance)


@receiver(models.signals.post_save, sender=SearchRequest)
def update_search_request(sender, instance: SearchRequest, **kwargs):
    if not settings.CAPTURE_USAGE_HISTORY:
        return

    if instance.status == core_consts.CRAWL_STATUS_NEW:
        UsageHistoryService(instance.team).create_search(instance)

    if instance.status in [
        core_consts.CRAWL_STATUS_CANCELED,
        core_consts.CRAWL_STATUS_FINISHED,
    ]:
        UsageHistoryService(instance.team).update_used_search_credit(instance)

    if instance.status == core_consts.CRAWL_STATUS_FAILED:
        UsageHistoryService(instance.team).revert_search_credit(instance)


@receiver(models.signals.post_save, sender=SitemapRequest)
def update_sitemap_request(sender, instance: SitemapRequest, **kwargs):
    if not settings.CAPTURE_USAGE_HISTORY:
        return

    if instance.status == core_consts.CRAWL_STATUS_NEW:
        UsageHistoryService(instance.team).create_sitemap(instance)

    if instance.status == core_consts.CRAWL_STATUS_FAILED:
        UsageHistoryService(instance.team).revert_sitemap_credit(instance)
