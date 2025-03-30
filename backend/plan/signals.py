from django.conf import settings
from django.db import models
from django.dispatch import receiver

from core.models import CrawlRequest
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
