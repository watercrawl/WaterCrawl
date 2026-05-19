"""Factory Boy factories for the core app."""

import factory
from factory.django import DjangoModelFactory

from core import consts
from core.models import (
    CrawlRequest,
    CrawlResult,
    CrawlResultAttachment,
    ProxyServer,
    SearchRequest,
    SitemapRequest,
)


class CrawlRequestFactory(DjangoModelFactory):
    class Meta:
        model = CrawlRequest

    team = factory.SubFactory("user.factories.TeamFactory")
    urls = factory.LazyFunction(lambda: ["https://example.com/"])
    crawl_type = consts.CRAWL_TYPE_SINGLE
    status = consts.CRAWL_STATUS_NEW
    options = factory.LazyFunction(dict)


class CrawlResultFactory(DjangoModelFactory):
    class Meta:
        model = CrawlResult

    request = factory.SubFactory(CrawlRequestFactory)
    url = "https://example.com/page"
    result = factory.django.FileField(filename="result.json", data=b"{}")


class CrawlResultAttachmentFactory(DjangoModelFactory):
    class Meta:
        model = CrawlResultAttachment

    crawl_result = factory.SubFactory(CrawlResultFactory)
    attachment_type = consts.CRAWL_RESULT_ATTACHMENT_TYPE_SCREENSHOT
    attachment = factory.django.FileField(filename="screenshot.png", data=b"PNG")


class SearchRequestFactory(DjangoModelFactory):
    class Meta:
        model = SearchRequest

    team = factory.SubFactory("user.factories.TeamFactory")
    query = "watercrawl"
    search_options = factory.LazyFunction(dict)
    result_limit = 5
    status = consts.CRAWL_STATUS_NEW


class SitemapRequestFactory(DjangoModelFactory):
    class Meta:
        model = SitemapRequest

    team = factory.SubFactory("user.factories.TeamFactory")
    url = "https://example.com"
    options = factory.LazyFunction(dict)
    status = consts.CRAWL_STATUS_NEW


class ProxyServerFactory(DjangoModelFactory):
    class Meta:
        model = ProxyServer

    name = factory.Sequence(lambda n: f"Proxy {n}")
    slug = factory.Sequence(lambda n: f"proxy-{n}")
    category = consts.PROXY_CATEGORY_GENERAL
    proxy_type = consts.PROXY_TYPE_HTTP
    host = "proxy.example.com"
    port = 8080
    team = factory.SubFactory("user.factories.TeamFactory")
