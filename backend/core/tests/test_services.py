"""Tests for core app services and helpers."""

import json
import subprocess

import pytest

from common.encryption import encrypt_key
from core import consts
from core.factories import (
    CrawlRequestFactory,
    ProxyServerFactory,
    SearchRequestFactory,
    SitemapRequestFactory,
)
from core.models import CrawlResult
from core.services import (
    CrawlerService,
    CrawlHelpers,
    ProxyService,
    SearchHelpers,
    SitemapHelpers,
)
from user.factories import TeamFactory


# --- CrawlHelpers.is_allowed_path -------------------------------------------


def _make_helpers(**spider_options):
    req = CrawlRequestFactory(
        urls=["https://example.com/"],
        options={"spider_options": spider_options} if spider_options else {},
    )
    return CrawlHelpers(req)


class TestCrawlHelpersAllowedPath:
    def test_default_allows_root(self):
        h = _make_helpers()
        assert h.is_allowed_path("https://example.com/some/page") is True

    def test_disallows_mailto(self):
        h = _make_helpers()
        assert h.is_allowed_path("mailto:foo@example.com") is False

    def test_disallows_tel(self):
        h = _make_helpers()
        assert h.is_allowed_path("tel:+15551234567") is False

    def test_disallows_file_types(self):
        h = _make_helpers()
        assert h.is_allowed_path("https://example.com/doc.pdf") is False
        assert h.is_allowed_path("https://example.com/doc.docx") is False
        assert h.is_allowed_path("https://example.com/image.png") is False

    def test_disallows_off_domain(self):
        h = _make_helpers()
        assert h.is_allowed_path("https://evil.test/page") is False

    def test_allows_subdomain_by_default(self):
        h = _make_helpers()
        assert h.is_allowed_path("https://blog.example.com/post") is True

    def test_strips_www_prefix_in_allowed_domains(self):
        req = CrawlRequestFactory(urls=["https://www.example.com/"])
        h = CrawlHelpers(req)
        assert h.is_allowed_path("https://example.com/x") is True

    def test_include_paths_required_when_set(self):
        h = _make_helpers(include_paths=["/blog/*"])
        assert h.is_allowed_path("https://example.com/blog/post") is True
        assert h.is_allowed_path("https://example.com/about") is False

    def test_exclude_paths_filtered_out(self):
        h = _make_helpers(exclude_paths=["/admin/*"])
        assert h.is_allowed_path("https://example.com/admin/dashboard") is False
        assert h.is_allowed_path("https://example.com/blog") is True

    def test_include_and_exclude_combined(self):
        h = _make_helpers(include_paths=["/blog/*"], exclude_paths=["/blog/private/*"])
        assert h.is_allowed_path("https://example.com/blog/public") is True
        assert h.is_allowed_path("https://example.com/blog/private/x") is False
        assert h.is_allowed_path("https://example.com/about") is False


class TestCrawlHelpersSettings:
    def test_default_max_depth_and_concurrent(self):
        h = _make_helpers()
        s = h.get_spider_settings()
        assert "-s" in s
        assert any("DEPTH_LIMIT=100" in x for x in s)
        # MAX_REQUESTS defaults to page_limit=1
        assert any("MAX_REQUESTS=1" in x for x in s)

    def test_options_drive_settings(self):
        h = _make_helpers(max_depth=5, page_limit=50)
        s = h.get_spider_settings()
        assert any("DEPTH_LIMIT=5" in x for x in s)
        assert any("MAX_REQUESTS=50" in x for x in s)

    def test_page_options_with_defaults(self):
        h = _make_helpers()
        assert h.wait_time == 0
        assert h.timeout == 15000
        assert h.locale == "en-US"
        assert h.include_html is False
        assert h.only_main_content is True


# --- SitemapHelpers ---------------------------------------------------------


class TestSitemapHelpers:
    def test_base_url_and_domain(self):
        req = SitemapRequestFactory(url="https://www.example.com/sub/path")
        h = SitemapHelpers(req)
        assert h.base_url == "https://www.example.com"
        assert h.domain == "example.com"  # www stripped

    def test_is_allowed_domain_strict(self):
        req = SitemapRequestFactory(
            url="https://example.com/", options={"include_subdomains": False}
        )
        h = SitemapHelpers(req)
        assert h.is_allowed_domain("https://example.com/x") is True
        assert h.is_allowed_domain("https://sub.example.com/x") is False

    def test_is_allowed_domain_includes_subdomains_by_default(self):
        req = SitemapRequestFactory(url="https://example.com/")
        h = SitemapHelpers(req)
        assert h.is_allowed_domain("https://sub.example.com/x") is True

    def test_search_query_when_no_search(self):
        req = SitemapRequestFactory(url="https://example.com/")
        h = SitemapHelpers(req)
        assert h.search_query == "site:example.com"

    def test_search_query_with_search_value(self):
        req = SitemapRequestFactory(
            url="https://example.com/", options={"search": "Pricing"}
        )
        h = SitemapHelpers(req)
        assert h.search_query == "site:example.com pricing"


# --- SearchHelpers ----------------------------------------------------------


class TestSearchHelpers:
    def test_advanced_search_for_non_basic(self):
        req = SearchRequestFactory(
            search_options={"depth": consts.SEARCH_DEPTH_ADVANCED}
        )
        h = SearchHelpers(req)
        assert h.advanced_search is True
        assert h.is_ultimate is False

    def test_basic_search_is_not_advanced(self):
        req = SearchRequestFactory(search_options={"depth": consts.SEARCH_DEPTH_BASIC})
        h = SearchHelpers(req)
        assert h.advanced_search is False

    def test_time_range_any_returns_none(self):
        req = SearchRequestFactory(
            search_options={"time_renge": consts.SEARCH_TIME_RENGE_ANY}
        )
        h = SearchHelpers(req)
        assert h.time_range is None

    def test_time_range_week(self):
        req = SearchRequestFactory(
            search_options={"time_renge": consts.SEARCH_TIME_RENGE_WEEK}
        )
        h = SearchHelpers(req)
        assert h.time_range == consts.SEARCH_TIME_RENGE_WEEK


# --- ProxyService -----------------------------------------------------------


class TestProxyService:
    def test_get_proxy_for_crawl_request_returns_default(self):
        team = TeamFactory()
        ProxyServerFactory(team=team, is_default=True, slug="def")
        req = CrawlRequestFactory(team=team)
        svc = ProxyService.get_proxy_for_crawl_request(req)
        assert svc is not None

    def test_get_proxy_for_crawl_request_by_slug(self):
        team = TeamFactory()
        proxy = ProxyServerFactory(team=team, slug="named")
        req = CrawlRequestFactory(
            team=team, options={"spider_options": {"proxy_server": "named"}}
        )
        svc = ProxyService.get_proxy_for_crawl_request(req)
        assert svc is not None
        assert svc.proxy_server == proxy

    def test_get_proxy_returns_none_when_no_proxies(self):
        req = CrawlRequestFactory()
        assert ProxyService.get_proxy_for_crawl_request(req) is None

    def test_proxy_object_decrypts_password(self):
        proxy = ProxyServerFactory(
            username="u",
            password=encrypt_key("supersecret"),
        )
        svc = ProxyService(proxy)
        obj = svc.get_proxy_object()
        assert obj["password"] == "supersecret"
        assert obj["username"] == "u"

    def test_proxy_object_handles_missing_password(self):
        proxy = ProxyServerFactory(password="")
        svc = ProxyService(proxy)
        obj = svc.get_proxy_object()
        assert obj["password"] is None

    def test_proxy_url_with_userpass(self):
        proxy = ProxyServerFactory(
            host="p.test",
            port=1080,
            proxy_type=consts.PROXY_TYPE_SOCKS5,
            username="u",
            password=encrypt_key("secret"),
        )
        url = ProxyService(proxy).get_proxy_url()
        assert url == "socks5://u:secret@p.test:1080"


# --- CrawlerService ---------------------------------------------------------


class TestCrawlerService:
    def test_make_with_pk(self):
        req = CrawlRequestFactory()
        svc = CrawlerService.make_with_pk(req.pk)
        assert svc.crawl_request == req

    def test_make_with_urls_dedupes_and_sets_options(self):
        team = TeamFactory()
        svc = CrawlerService.make_with_urls(
            urls=["https://a.test", "https://a.test", "https://b.test"],
            team=team,
        )
        assert sorted(svc.crawl_request.urls) == ["https://a.test", "https://b.test"]
        assert svc.crawl_request.options["spider_options"]["max_depth"] == 0
        assert "page_options" in svc.crawl_request.options

    def test_make_with_urls_raises_without_urls(self):
        team = TeamFactory()
        with pytest.raises(ValueError):
            CrawlerService.make_with_urls(urls=[], team=team)

    def test_run_success_marks_finished(self, mocker):
        req = CrawlRequestFactory()
        mocker.patch.object(
            subprocess,
            "run",
            return_value=mocker.MagicMock(returncode=0, stdout="", stderr=""),
        )
        CrawlerService(req).run()
        req.refresh_from_db()
        assert req.status == consts.CRAWL_STATUS_FINISHED
        assert req.duration is not None

    def test_run_failure_marks_failed_and_reraises(self, mocker):
        req = CrawlRequestFactory()
        mocker.patch.object(
            subprocess,
            "run",
            side_effect=subprocess.CalledProcessError(
                returncode=1, cmd=["scrapy"], output="", stderr="boom"
            ),
        )
        with pytest.raises(subprocess.CalledProcessError):
            CrawlerService(req).run()
        req.refresh_from_db()
        assert req.status == consts.CRAWL_STATUS_FAILED

    def test_run_builds_correct_subprocess_args(self, mocker):
        req = CrawlRequestFactory(
            options={"spider_options": {"max_depth": 2, "page_limit": 5}}
        )
        run_mock = mocker.patch.object(
            subprocess,
            "run",
            return_value=mocker.MagicMock(returncode=0, stdout="", stderr=""),
        )
        CrawlerService(req).run()
        args = run_mock.call_args[0][0]
        assert args[0] == "scrapy"
        assert args[1] == "crawl"
        assert args[2] == "SiteScrapper"
        assert f"crawl_request_uuid={req.pk}" in args
        assert any("DEPTH_LIMIT=2" in x for x in args)
        assert any("MAX_REQUESTS=5" in x for x in args)

    def test_add_scraped_item_creates_result(self, mocker):
        req = CrawlRequestFactory()
        svc = CrawlerService(req)
        mocker.patch.object(svc, "get_file_content", return_value={"foo": "bar"})

        item = {
            "url": "https://example.com/page",
            "attachments": [],
        }
        svc.add_scraped_item(item)
        assert CrawlResult.objects.filter(request=req).count() == 1
        result = CrawlResult.objects.get(request=req)
        assert result.url == "https://example.com/page"

    def test_add_scraped_item_persists_attachments(self, mocker):
        import base64

        req = CrawlRequestFactory()
        svc = CrawlerService(req)
        mocker.patch.object(svc, "get_file_content", return_value={})

        png = base64.b64encode(b"PNGDATA").decode()
        item = {
            "url": "https://example.com/p",
            "attachments": [
                {
                    "type": consts.CRAWL_RESULT_ATTACHMENT_TYPE_SCREENSHOT,
                    "content": png,
                    "filename": "ss.png",
                }
            ],
        }
        svc.add_scraped_item(item)
        result = CrawlResult.objects.get(request=req)
        assert result.attachments.count() == 1
        assert (
            result.attachments.first().attachment_type
            == consts.CRAWL_RESULT_ATTACHMENT_TYPE_SCREENSHOT
        )

    def test_add_sitemap_writes_file_to_request(self):
        req = CrawlRequestFactory()
        svc = CrawlerService(req)
        svc.add_sitemap([{"url": "https://example.com", "title": "Home"}])
        req.refresh_from_db()
        assert req.sitemap
        with req.sitemap.open("rb") as f:
            assert json.loads(f.read())[0]["url"] == "https://example.com"
