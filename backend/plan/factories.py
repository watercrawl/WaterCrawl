"""Factory Boy factories for the plan app."""

from decimal import Decimal

import factory
from django.utils import timezone
from factory.django import DjangoModelFactory

from plan import consts
from plan.models import (
    Plan,
    PlanFeature,
    StripeWebhookHistory,
    Subscription,
    SubscriptionPayment,
    UsageHistory,
)


class PlanFactory(DjangoModelFactory):
    class Meta:
        model = Plan

    name = factory.Sequence(lambda n: f"Plan {n}")
    group = consts.PLAN_GROUP_MONTHLY
    description = "Test plan"
    price = Decimal("0")
    stripe_price_id = factory.Sequence(lambda n: f"price_{n}")
    number_of_users = 1
    page_credit = 1000
    daily_page_credit = 100
    crawl_max_depth = 3
    crawl_max_limit = 100
    max_concurrent_crawl = 1
    is_default = False
    is_active = True


class PlanFeatureFactory(DjangoModelFactory):
    class Meta:
        model = PlanFeature

    plan = factory.SubFactory(PlanFactory)
    title = "Sample feature"


class SubscriptionFactory(DjangoModelFactory):
    class Meta:
        model = Subscription

    team = factory.SubFactory("user.factories.TeamFactory")
    plan = factory.SubFactory(PlanFactory)
    stripe_subscription_id = factory.Sequence(lambda n: f"sub_test_{n}")
    status = consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE
    remain_page_credit = 1000
    remain_daily_page_credit = 100
    start_at = factory.LazyFunction(timezone.now)
    current_period_start_at = factory.LazyFunction(timezone.now)
    current_period_end_at = factory.LazyAttribute(
        lambda o: o.current_period_start_at + timezone.timedelta(days=30)
    )


class SubscriptionPaymentFactory(DjangoModelFactory):
    class Meta:
        model = SubscriptionPayment

    subscription = factory.SubFactory(SubscriptionFactory)
    amount = Decimal("9.99")
    status = "paid"
    stripe_payment_id = factory.Sequence(lambda n: f"pi_test_{n}")


class StripeWebhookHistoryFactory(DjangoModelFactory):
    class Meta:
        model = StripeWebhookHistory

    data = factory.LazyFunction(lambda: {"type": "test.event"})


class UsageHistoryFactory(DjangoModelFactory):
    class Meta:
        model = UsageHistory

    team = factory.SubFactory("user.factories.TeamFactory")
    requested_page_credit = 10
    used_page_credit = 8
