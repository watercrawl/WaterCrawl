"""Tests for core serializers."""

from unittest.mock import MagicMock

import pytest

from common.encryption import decrypt_key
from core.factories import ProxyServerFactory
from core.serializers import (
    BatchCrawlRequestSerializer,
    CrawlRequestSerializer,
    ProxyServerSerializer,
)
from user.factories import TeamFactory


@pytest.fixture
def plan_validator_passthrough(mocker):
    """Bypass plan-credit validation so we can isolate serializer behaviour."""

    def passthrough(attrs):
        return attrs

    validator = MagicMock()
    validator.validate_crawl_request.side_effect = passthrough
    validator.validate_batch_crawl_request.side_effect = passthrough
    mocker.patch("core.serializers.PlanLimitValidator", return_value=validator)
    return validator


class TestCrawlRequestSerializer:
    def test_single_url_normalized_into_list(self, plan_validator_passthrough):
        team = TeamFactory()
        s = CrawlRequestSerializer(
            data={
                "url": "https://example.com/",
                "options": {
                    "spider_options": {},
                    "page_options": {},
                },
            },
            context={"team": team},
        )
        assert s.is_valid(), s.errors
        assert s.validated_data["urls"] == ["https://example.com/"]
        assert s.validated_data["crawl_type"] == "single"

    def test_invalid_url_rejected(self, plan_validator_passthrough):
        team = TeamFactory()
        s = CrawlRequestSerializer(
            data={
                "url": "not-a-url",
                "options": {"spider_options": {}, "page_options": {}},
            },
            context={"team": team},
        )
        assert s.is_valid() is False
        assert "url" in s.errors


class TestBatchCrawlRequestSerializer:
    def test_batch_overrides_max_depth_and_page_limit(self, plan_validator_passthrough):
        team = TeamFactory()
        s = BatchCrawlRequestSerializer(
            data={
                "urls": ["https://a.test/", "https://b.test/"],
                "options": {
                    "spider_options": {},
                    "page_options": {},
                },
            },
            context={"team": team},
        )
        assert s.is_valid(), s.errors
        spider_opts = s.validated_data["options"]["spider_options"]
        assert spider_opts["max_depth"] == 0
        assert spider_opts["page_limit"] == 2
        assert sorted(spider_opts["allowed_domains"]) == ["a.test", "b.test"]
        assert s.validated_data["crawl_type"] == "batch"

    def test_batch_requires_at_least_one_url(self, plan_validator_passthrough):
        team = TeamFactory()
        s = BatchCrawlRequestSerializer(
            data={
                "urls": [],
                "options": {"spider_options": {}, "page_options": {}},
            },
            context={"team": team},
        )
        assert s.is_valid() is False
        assert "urls" in s.errors


class TestProxyServerSerializer:
    def test_password_encrypted_on_save(self):
        team = TeamFactory()
        s = ProxyServerSerializer(
            data={
                "name": "P",
                "slug": "p-1",
                "proxy_type": "http",
                "host": "proxy.test",
                "port": 8080,
                "password": "supersecret",
            },
            context={"team": team},
        )
        assert s.is_valid(), s.errors
        instance = s.save(team=team)
        assert instance.password != "supersecret"
        assert decrypt_key(instance.password) == "supersecret"

    def test_empty_password_stored_as_null(self):
        team = TeamFactory()
        s = ProxyServerSerializer(
            data={
                "name": "P",
                "slug": "p-1",
                "proxy_type": "http",
                "host": "proxy.test",
                "port": 8080,
                "password": "",
            },
            context={"team": team},
        )
        assert s.is_valid(), s.errors
        instance = s.save(team=team)
        assert instance.password is None

    def test_validate_slug_rejects_duplicate_within_team(self):
        team = TeamFactory()
        ProxyServerFactory(team=team, slug="dup")
        s = ProxyServerSerializer(
            data={
                "name": "P",
                "slug": "dup",
                "proxy_type": "http",
                "host": "h",
                "port": 1,
            },
            context={"team": team},
        )
        assert s.is_valid() is False
        assert "slug" in s.errors
