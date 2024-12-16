from django.db import models
from django.utils.translation import gettext_lazy as _

from common.models import BaseModel
from core import consts
from core.utils import generate_crawl_result_file_path


class CrawlRequest(BaseModel):
    team = models.ForeignKey(
        'user.Team',
        on_delete=models.CASCADE,
        verbose_name=_('team'),
        related_name='crawl_requests',
    )
    url = models.URLField(
        _('url'),
        max_length=255
    )
    status = models.CharField(
        _('status'),
        max_length=255,
        choices=consts.CRAWL_STATUS_CHOICES,
        default=consts.CRAWL_STATUS_NEW,
    )
    options = models.JSONField(
        _('options'),
        default=dict
    )

    def number_of_documents(self):
        return self.results.count()

    class Meta:
        verbose_name = _('Crawl Request')
        verbose_name_plural = _('Crawl Requests')


class CrawlResult(BaseModel):
    request = models.ForeignKey(
        CrawlRequest,
        on_delete=models.CASCADE,
        related_name='results',
    )
    url = models.URLField(
        _('url'),
        max_length=255
    )
    result = models.FileField(
        _('result'),
        upload_to=generate_crawl_result_file_path,
    )

    class Meta:
        verbose_name = _('Crawl Result')
        verbose_name_plural = _('Crawl Results')
