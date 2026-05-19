"""Tests for plan/services.py: SubscriptionService, UsageHistoryService, StripeService."""

import datetime
from decimal import Decimal

from django.utils import timezone

from core.factories import CrawlRequestFactory
from plan import consts
from plan.factories import PlanFactory, SubscriptionFactory
from plan.models import Subscription, SubscriptionPayment
from plan.services import (
    StripeService,
    SubscriptionService,
    TeamPlanUnlimitedService,
    UsageHistoryService,
)
from user.factories import TeamFactory, TeamMemberFactory, UserFactory


# --- SubscriptionService ----------------------------------------------------


class TestSubscriptionService:
    def test_create_subscription_initializes_credits(self):
        team = TeamFactory()
        plan = PlanFactory(page_credit=500, daily_page_credit=50)
        svc = SubscriptionService.create_subscription(
            team=team,
            plan=plan,
            status=consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE,
            stripe_subscription_id="sub_x",
        )
        assert svc.subscription.remain_page_credit == 500
        assert svc.subscription.remain_daily_page_credit == 50

    def test_create_subscription_idempotent_via_stripe_id(self):
        team = TeamFactory()
        plan = PlanFactory()
        SubscriptionService.create_subscription(
            team=team,
            plan=plan,
            status=consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE,
            stripe_subscription_id="sub_same",
        )
        SubscriptionService.create_subscription(
            team=team,
            plan=plan,
            status=consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE,
            stripe_subscription_id="sub_same",
        )
        assert (
            Subscription.objects.filter(stripe_subscription_id="sub_same").count() == 1
        )

    def test_get_current_subscription_returns_active(self):
        team = TeamFactory()
        SubscriptionFactory(
            team=team, status=consts.STRIPE_SUBSCRIPTION_STATUS_CANCELED
        )
        active = SubscriptionFactory(
            team=team, status=consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE
        )
        assert SubscriptionService.get_current_subscription(team) == active

    def test_get_current_subscription_none_when_no_active(self):
        team = TeamFactory()
        SubscriptionFactory(
            team=team, status=consts.STRIPE_SUBSCRIPTION_STATUS_CANCELED
        )
        assert SubscriptionService.get_current_subscription(team) is None

    def test_updated_subscription_carryover_used_credits_on_upgrade(self):
        team = TeamFactory()
        old_plan = PlanFactory(page_credit=100, daily_page_credit=10, is_default=False)
        new_plan = PlanFactory(page_credit=1000, daily_page_credit=100)
        sub = SubscriptionFactory(
            team=team,
            plan=old_plan,
            stripe_subscription_id="sub_up",
            remain_page_credit=60,  # used 40 of 100
            remain_daily_page_credit=8,  # used 2 of 10
            status=consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE,
        )
        SubscriptionService.updated_subscription(
            team=team,
            plan=new_plan,
            stripe_subscription_id="sub_up",
            status=consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE,
            current_period_start_at=1700000000,
            current_period_end_at=1702592000,
        )
        sub.refresh_from_db()
        # used_credit (40) carries over: new remaining = 1000 - 40
        assert sub.remain_page_credit == 1000 - 40
        assert sub.remain_daily_page_credit == 100 - 2

    def test_updated_subscription_resets_on_upgrade_from_default(self):
        team = TeamFactory()
        free = PlanFactory(page_credit=100, daily_page_credit=10, is_default=True)
        paid = PlanFactory(page_credit=1000, daily_page_credit=100)
        sub = SubscriptionFactory(
            team=team,
            plan=free,
            stripe_subscription_id="sub_free_upgrade",
            remain_page_credit=20,
            remain_daily_page_credit=3,
            status=consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE,
        )
        SubscriptionService.updated_subscription(
            team=team,
            plan=paid,
            stripe_subscription_id="sub_free_upgrade",
            status=consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE,
            current_period_start_at=1700000000,
            current_period_end_at=1702592000,
        )
        sub.refresh_from_db()
        # full reset to paid plan credits
        assert sub.remain_page_credit == 1000
        assert sub.remain_daily_page_credit == 100

    def test_updated_subscription_resets_on_new_period(self):
        team = TeamFactory()
        plan = PlanFactory(page_credit=500, daily_page_credit=50)
        sub = SubscriptionFactory(
            team=team,
            plan=plan,
            stripe_subscription_id="sub_period",
            remain_page_credit=100,
            remain_daily_page_credit=10,
            current_period_start_at=timezone.now() - datetime.timedelta(days=30),
            status=consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE,
        )
        SubscriptionService.updated_subscription(
            team=team,
            plan=plan,
            stripe_subscription_id="sub_period",
            status=consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE,
            current_period_start_at=int(timezone.now().timestamp()),
            current_period_end_at=int(
                (timezone.now() + datetime.timedelta(days=30)).timestamp()
            ),
        )
        sub.refresh_from_db()
        assert sub.remain_page_credit == 500
        assert sub.remain_daily_page_credit == 50

    def test_reset_daily_page_credit(self):
        sub = SubscriptionFactory(remain_daily_page_credit=0)
        SubscriptionService(sub).reset_daily_page_credit()
        sub.refresh_from_db()
        assert sub.remain_daily_page_credit == sub.plan.daily_page_credit

    def test_add_payment_persists(self):
        sub = SubscriptionFactory()
        SubscriptionService(sub).add_payment(
            amount=Decimal("9.99"), stripe_payment_id="pi_x", status="paid"
        )
        assert (
            SubscriptionPayment.objects.filter(
                subscription=sub, stripe_payment_id="pi_x"
            ).count()
            == 1
        )


# --- UsageHistoryService (with TeamPlanUnlimitedService default) ------------


class TestUsageHistoryService:
    def test_create_persists_with_requested_credit_from_options(self):
        team = TeamFactory()
        req = CrawlRequestFactory(
            team=team, options={"spider_options": {"page_limit": 25}}
        )
        usage = UsageHistoryService(team).create(req)
        assert usage.requested_page_credit == 25
        assert usage.used_page_credit == 0
        assert usage.crawl_request == req

    def test_create_defaults_to_one_when_no_page_limit(self):
        team = TeamFactory()
        req = CrawlRequestFactory(team=team, options={})
        usage = UsageHistoryService(team).create(req)
        assert usage.requested_page_credit == 1

    def test_update_used_page_credit_idempotent_on_re_capture(self):
        team = TeamFactory()
        req = CrawlRequestFactory(team=team)
        svc = UsageHistoryService(team)
        u1 = svc.create(req)
        svc.update_used_page_credit(req)
        u1.refresh_from_db()
        assert u1.used_page_credit == 0


# --- TeamPlanUnlimitedService (default in test settings) --------------------


class TestTeamPlanUnlimitedService:
    def test_unlimited_remainings_are_minus_one(self):
        team = TeamFactory()
        svc = TeamPlanUnlimitedService(team)
        assert svc.remaining_page_credit == -1
        assert svc.remaining_daily_page_credit == -1
        assert svc.plan_page_credit == -1

    def test_balance_is_noop(self):
        team = TeamFactory()
        TeamPlanUnlimitedService(team).balance_page_credit(10)  # no exception


# --- StripeService (mocked) -------------------------------------------------


class TestStripeService:
    def test_get_or_create_customer_creates_when_missing(self, mock_stripe):
        team = TeamFactory()
        user = UserFactory()
        TeamMemberFactory(team=team, user=user, is_owner=True)
        svc = StripeService()
        customer = svc.get_or_create_customer(team)
        assert customer.id == "cus_test_123"
        team.refresh_from_db()
        assert team.stripe_customer_id == "cus_test_123"

    def test_get_or_create_customer_retrieves_when_present(self, mock_stripe):
        team = TeamFactory(stripe_customer_id="cus_existing")
        StripeService().get_or_create_customer(team)
        # retrieve was called rather than create
        import stripe

        stripe.Customer.retrieve.assert_called_with("cus_existing")

    def test_handle_webhook_event_saves_history(self, mock_stripe):
        event = {"type": "customer.subscription.foo", "data": {}}
        StripeService().handle_webhook_event(event, save_history=True)
        from plan.models import StripeWebhookHistory

        assert StripeWebhookHistory.objects.filter(
            data__type="customer.subscription.foo"
        ).exists()
