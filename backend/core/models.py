from django.db import models
from django.utils.translation import gettext_lazy as _

from common.models import BaseModel
from core import consts
from core.utils import (
    generate_crawl_result_file_path,
    generate_crawl_result_attachment_path,
    generate_crawl_request_sitemap_path,
    search_result_file_path,
    sitemap_result_file_path,
)


class CrawlRequest(BaseModel):
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("team"),
        related_name="crawl_requests",
    )
    # url = models.URLField(_("url"), max_length=255)
    urls = models.JSONField(_("urls"), default=list)
    crawl_type = models.CharField(
        _("crawl type"),
        max_length=255,
        choices=consts.CRAWL_TYPE_CHOICES,
        default=consts.CRAWL_TYPE_SINGLE,
    )
    status = models.CharField(
        _("status"),
        max_length=255,
        choices=consts.CRAWL_STATUS_CHOICES,
        default=consts.CRAWL_STATUS_NEW,
    )
    options = models.JSONField(_("options"), default=dict)
    duration = models.DurationField(_("duration"), null=True)
    sitemap = models.FileField(
        _("sitemap"),
        max_length=255,
        upload_to=generate_crawl_request_sitemap_path,
        null=True,
        blank=True,
    )

    @property
    def url(self):
        if self.urls:
            return self.urls[0] if isinstance(self.urls, list) else self.urls
        return ""

    @url.setter
    def url(self, value):
        if isinstance(value, str):
            self.urls = [value]
        else:
            raise ValueError(_("URL must be a string."))

    def number_of_documents(self):
        return self.results.count()

    class Meta:
        verbose_name = _("Crawl Request")
        verbose_name_plural = _("Crawl Requests")


class CrawlResult(BaseModel):
    request = models.ForeignKey(
        CrawlRequest,
        verbose_name=_("Crawl Request"),
        on_delete=models.CASCADE,
        related_name="results",
    )
    url = models.URLField(_("URL"), max_length=2048)
    result = models.FileField(
        _("Result"),
        upload_to=generate_crawl_result_file_path,
    )

    class Meta:
        verbose_name = _("Crawl Result")
        verbose_name_plural = _("Crawl Results")


class CrawlResultAttachment(BaseModel):
    crawl_result = models.ForeignKey(
        CrawlResult,
        verbose_name=_("Crawl Result"),
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    attachment_type = models.CharField(
        _("Attachment Type"),
        max_length=255,
        choices=consts.CRAWL_RESULT_ATTACHMENT_TYPE_CHOICES,
    )
    attachment = models.FileField(
        _("Attachment"), max_length=511, upload_to=generate_crawl_result_attachment_path
    )

    class Meta:
        verbose_name = _("Crawl Result Attachment")
        verbose_name_plural = _("Crawl Result Attachments")

    def __str__(self):
        return self.attachment.name

    @property
    def filename(self):
        return self.attachment.name.split("/")[-1]


class SearchRequest(BaseModel):
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("team"),
        related_name="search_requests",
    )
    query = models.CharField(_("Query"), max_length=255)
    search_options = models.JSONField(_("Search Options"), default=dict)
    result_limit = models.PositiveIntegerField(_("Result Limit"), default=5)
    duration = models.DurationField(_("Duration"), null=True)
    status = models.CharField(
        _("Status"),
        max_length=255,
        choices=consts.CRAWL_STATUS_CHOICES,
        default=consts.CRAWL_STATUS_NEW,
    )
    result = models.FileField(
        _("Result"),
        max_length=255,
        upload_to=search_result_file_path,
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.query

    class Meta:
        verbose_name = _("Search Request")
        verbose_name_plural = _("Search Requests")


class ProxyServer(BaseModel):
    name = models.CharField(_("Name"), max_length=255)
    slug = models.SlugField(_("Key"), max_length=255)
    is_default = models.BooleanField(_("Is Default"), default=False)
    category = models.CharField(
        _("Proxy Category"),
        max_length=255,
        choices=consts.PROXY_CATEGORY_CHOICES,
        default=consts.PROXY_CATEGORY_GENERAL,
    )
    proxy_type = models.CharField(
        _("Proxy Type"),
        max_length=255,
        choices=consts.PROXY_TYPE_CHOICES,
        default=consts.PROXY_TYPE_HTTP,
    )
    host = models.CharField(
        _("Host"),
        max_length=255,
    )
    port = models.PositiveIntegerField(_("Port"), default=0)
    username = models.CharField(_("Username"), max_length=255, null=True, blank=True)
    password = models.TextField(_("Password"), null=True, blank=True)
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("team"),
        related_name="proxy_servers",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _("Proxy Server")
        verbose_name_plural = _("Proxy Servers")
        unique_together = ("team", "slug")
        ordering = ["team", "name"]

    @property
    def has_password(self):
        return bool(self.password)


class SitemapRequest(BaseModel):
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("team"),
        related_name="sitemap_requests",
    )
    url = models.URLField(_("URL"), max_length=255)
    options = models.JSONField(_("Options"), default=dict)
    status = models.CharField(
        _("Status"),
        max_length=255,
        choices=consts.CRAWL_STATUS_CHOICES,
        default=consts.CRAWL_STATUS_NEW,
    )
    duration = models.DurationField(_("Duration"), null=True)
    result = models.FileField(
        _("Result"),
        max_length=255,
        upload_to=sitemap_result_file_path,
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _("Sitemap Request")
        verbose_name_plural = _("Sitemap Requests")
