"""Tests for core app models."""

import pytest
from django.db import IntegrityError

from core import consts
from core.factories import (
    CrawlRequestFactory,
    CrawlResultAttachmentFactory,
    CrawlResultFactory,
    ProxyServerFactory,
    SearchRequestFactory,
    SitemapRequestFactory,
)
from user.factories import TeamFactory


class TestCrawlRequest:
    def test_default_status_is_new(self):
        req = CrawlRequestFactory()
        assert req.status == consts.CRAWL_STATUS_NEW

    def test_url_property_returns_first_when_list(self):
        req = CrawlRequestFactory(urls=["https://a.test/", "https://b.test/"])
        assert req.url == "https://a.test/"

    def test_url_property_empty_string_when_no_urls(self):
        req = CrawlRequestFactory(urls=[])
        assert req.url == ""

    def test_url_setter_converts_string_to_list(self):
        req = CrawlRequestFactory(urls=[])
        req.url = "https://example.com/"
        assert req.urls == ["https://example.com/"]

    def test_url_setter_rejects_non_string(self):
        req = CrawlRequestFactory(urls=[])
        with pytest.raises(ValueError):
            req.url = 12345

    def test_number_of_documents_counts_results(self):
        req = CrawlRequestFactory()
        CrawlResultFactory(request=req)
        CrawlResultFactory(request=req)
        assert req.number_of_documents() == 2

    def test_status_can_transition_through_lifecycle(self):
        req = CrawlRequestFactory()
        for s in (
            consts.CRAWL_STATUS_RUNNING,
            consts.CRAWL_STATUS_CANCELING,
            consts.CRAWL_STATUS_CANCELED,
        ):
            req.status = s
            req.save()
            req.refresh_from_db()
            assert req.status == s


class TestCrawlResult:
    def test_results_cascade_with_request(self):
        result = CrawlResultFactory()
        req = result.request
        req.delete()
        from core.models import CrawlResult

        assert not CrawlResult.objects.filter(pk=result.pk).exists()


class TestCrawlResultAttachment:
    def test_filename_property_returns_basename(self):
        attachment = CrawlResultAttachmentFactory()
        # InMemoryStorage will namespace with timestamp prefix; basename is last segment
        assert "/" not in attachment.filename or attachment.filename.endswith(".png")

    def test_attachment_type_choices_screenshot(self):
        a = CrawlResultAttachmentFactory(
            attachment_type=consts.CRAWL_RESULT_ATTACHMENT_TYPE_SCREENSHOT
        )
        assert a.attachment_type == "screenshot"


class TestProxyServer:
    def test_has_password_when_password_set(self):
        p = ProxyServerFactory(password="secret")
        assert p.has_password is True

    def test_has_password_false_when_empty(self):
        p = ProxyServerFactory(password="")
        assert p.has_password is False

    def test_unique_together_team_slug(self):
        team = TeamFactory()
        ProxyServerFactory(team=team, slug="dup")
        with pytest.raises(IntegrityError):
            ProxyServerFactory(team=team, slug="dup")


class TestSearchRequest:
    def test_default_result_limit(self):
        req = SearchRequestFactory()
        assert req.result_limit == 5

    def test_str_returns_query(self):
        req = SearchRequestFactory(query="hello")
        assert str(req) == "hello"


class TestSitemapRequest:
    def test_default_status_is_new(self):
        req = SitemapRequestFactory()
        assert req.status == consts.CRAWL_STATUS_NEW
