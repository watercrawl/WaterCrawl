"""Tests for plan models."""

import pytest

from plan.factories import (
    PlanFactory,
    StripeWebhookHistoryFactory,
    SubscriptionFactory,
    SubscriptionPaymentFactory,
    UsageHistoryFactory,
)
from core.factories import CrawlRequestFactory, SearchRequestFactory


class TestPlan:
    def test_save_unsets_other_defaults_when_marking_default(self):
        first = PlanFactory(is_default=True)
        second = PlanFactory(is_default=True)
        first.refresh_from_db()
        # only the most-recently saved default may remain True
        assert second.is_default is True
        assert first.is_default is False

    def test_save_does_not_unset_others_when_not_default(self):
        d = PlanFactory(is_default=True)
        PlanFactory(is_default=False)
        d.refresh_from_db()
        assert d.is_default is True

    def test_default_ordering_by_order(self):
        from plan.models import Plan

        PlanFactory(order=2)
        PlanFactory(order=1)
        ordered = list(Plan.objects.values_list("order", flat=True))
        assert ordered == sorted(ordered)


class TestSubscription:
    def test_str_contains_team_and_plan_name(self):
        sub = SubscriptionFactory()
        s = str(sub)
        assert sub.team.name in s
        assert sub.plan.name in s


class TestSubscriptionPayment:
    def test_str_combines_team_and_plan(self):
        payment = SubscriptionPaymentFactory()
        s = str(payment)
        assert payment.subscription.team.name in s


class TestStripeWebhookHistory:
    def test_str_uses_type_field(self):
        wh = StripeWebhookHistoryFactory(data={"type": "customer.subscription.created"})
        assert str(wh) == "customer.subscription.created"

    def test_str_fallback_unknown(self):
        wh = StripeWebhookHistoryFactory(data={"id": "evt_x"})
        assert "Unknown" in str(wh)


class TestUsageHistory:
    def test_one_to_one_constraint_for_crawl_request(self):
        from django.db import IntegrityError

        req = CrawlRequestFactory()
        UsageHistoryFactory(crawl_request=req)
        with pytest.raises(IntegrityError):
            UsageHistoryFactory(crawl_request=req)

    def test_str_for_crawl_request(self):
        req = CrawlRequestFactory(urls=["https://example.com/x"])
        usage = UsageHistoryFactory(crawl_request=req)
        assert "CRAWL" in str(usage)

    def test_str_for_search_request(self):
        search = SearchRequestFactory(query="abc")
        usage = UsageHistoryFactory(search_request=search)
        assert "SEARCH" in str(usage)
