from celery import shared_task

from plan import consts
from plan.models import Subscription
from plan.services import SubscriptionService


@shared_task
def reset_daily_page_credits():
    active_subscriptions = Subscription.objects.filter(
        status=consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE
    ).all()

    for subscription in active_subscriptions:
        SubscriptionService(subscription).reset_daily_page_credit()