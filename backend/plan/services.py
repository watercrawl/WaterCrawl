import datetime
import json
from abc import ABC, abstractmethod
import stripe
from django.db.transaction import atomic

from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from core.models import CrawlRequest, SearchRequest
from plan import consts
from plan.models import (
    Plan,
    Subscription,
    SubscriptionPayment,
    StripeWebhookHistory,
    UsageHistory,
)
from plan.utils import calculate_number_of_search_credits
from user.models import Team


class TeamPlanAbstractService(ABC):
    def __init__(self, team: Team):
        self.team = team

    @property
    @abstractmethod
    def plan_name(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def status(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def plan_page_credit(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def plan_daily_page_credit(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def plan_number_users(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def remain_number_users(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def remaining_page_credit(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def remaining_daily_page_credit(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def max_depth(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def crawl_max_limit(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def max_concurrent_crawl(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def start_at(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def current_period_start_at(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def current_period_end_at(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def cancel_at(self):
        raise NotImplementedError

    @property
    @abstractmethod
    def is_default(self):
        raise NotImplementedError

    @abstractmethod
    def balance_page_credit(self, amount: int):
        """Amount can be positive or negative"""
        raise NotImplementedError


class TeamPlanUnlimitedService(TeamPlanAbstractService):
    @property
    def plan_name(self):
        return _("Unlimited")

    @property
    def status(self):
        return consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE

    @property
    def plan_page_credit(self):
        return -1

    @property
    def plan_daily_page_credit(self):
        return -1

    @property
    def plan_number_users(self):
        return -1

    @property
    def remain_number_users(self):
        return -1

    @property
    def remaining_page_credit(self):
        return -1

    @property
    def remaining_daily_page_credit(self):
        return -1

    @property
    def max_depth(self):
        return settings.MAX_CRAWL_DEPTH

    @property
    def crawl_max_limit(self):
        return -1

    @property
    def max_concurrent_crawl(self):
        return -1

    @property
    def start_at(self):
        return None

    @property
    def current_period_start_at(self):
        return None

    @property
    def current_period_end_at(self):
        return None

    @property
    def cancel_at(self):
        return None

    @property
    def is_default(self):
        return False

    def balance_page_credit(self, amount: int):
        pass


class TeamPlanEnterpriseService(TeamPlanAbstractService, ABC):
    def __init__(self, team: Team):
        super().__init__(team)
        self.subscription = self.__get_subscription()

    def __get_subscription(self):
        current = SubscriptionService.get_current_subscription(self.team)
        if current:
            return current

        raise PermissionDenied(_("You have no active subscription"))

    @property
    def plan_name(self):
        return self.subscription.plan.name

    @property
    def status(self):
        return self.subscription.status

    @property
    def plan_page_credit(self):
        return self.subscription.plan.page_credit

    @property
    def plan_daily_page_credit(self):
        return self.subscription.plan.daily_page_credit

    @property
    def plan_number_users(self):
        return self.subscription.plan.number_of_users

    @property
    def remain_number_users(self):
        remain = self.subscription.plan.number_of_users - self.team.team_members.count()
        return 0 if remain < 0 else remain

    @property
    def remaining_page_credit(self):
        if self.subscription.plan.page_credit == -1:
            return -1
        return self.subscription.remain_page_credit

    @property
    def remaining_daily_page_credit(self):
        if self.subscription.plan.daily_page_credit == -1:
            return -1
        return self.subscription.remain_daily_page_credit

    @property
    def max_depth(self):
        return self.subscription.plan.crawl_max_depth

    @property
    def crawl_max_limit(self):
        return self.subscription.plan.crawl_max_limit

    @property
    def max_concurrent_crawl(self):
        return self.subscription.plan.max_concurrent_crawl

    @property
    def start_at(self):
        return self.subscription.start_at

    @property
    def current_period_start_at(self):
        return self.subscription.current_period_start_at

    @property
    def current_period_end_at(self):
        return self.subscription.current_period_end_at

    @property
    def cancel_at(self):
        return self.subscription.cancel_at

    @property
    def is_default(self):
        return self.subscription.plan.is_default

    @atomic
    def balance_page_credit(self, amount: int):
        if amount == 0 or (
            self.remaining_page_credit == -1 and self.remaining_daily_page_credit == -1
        ):
            return

        subscription = Subscription.objects.select_for_update().get(
            pk=self.subscription.pk
        )

        if self.remaining_page_credit != -1:
            subscription.remain_page_credit -= amount

        if self.remaining_daily_page_credit != -1:
            subscription.remain_daily_page_credit -= amount

        subscription.save(
            update_fields=["remain_page_credit", "remain_daily_page_credit"]
        )


TeamPlanService = (
    TeamPlanEnterpriseService
    if settings.IS_ENTERPRISE_MODE_ACTIVE
    else TeamPlanUnlimitedService
)


##### Subscription


class SubscriptionService:
    def __init__(self, subscription: Subscription):
        self.subscription = subscription

    @classmethod
    def get_current_subscription(cls, team: Team):
        return team.subscriptions.filter(
            status=consts.STRIPE_SUBSCRIPTION_STATUS_ACTIVE
        ).first()

    @classmethod
    def convert_timestamp_to_datetime(cls, timestamp):
        return (
            timezone.make_aware(
                datetime.datetime.fromtimestamp(timestamp),
                timezone.get_current_timezone(),
            )
            if timestamp
            else None
        )

    @classmethod
    def create_subscription(
        cls,
        team,
        plan,
        status,
        stripe_subscription_id,
        start_at=None,
        current_period_start_at=None,
        current_period_end_at=None,
    ):
        subscription, created = Subscription.objects.update_or_create(
            stripe_subscription_id=stripe_subscription_id,
            defaults=dict(
                team=team,
                plan=plan,
                start_at=cls.convert_timestamp_to_datetime(start_at),
                current_period_start_at=cls.convert_timestamp_to_datetime(
                    current_period_start_at
                ),
                current_period_end_at=cls.convert_timestamp_to_datetime(
                    current_period_end_at
                ),
                remain_page_credit=plan.page_credit,
                remain_daily_page_credit=plan.daily_page_credit,
                status=status,
            ),
        )

        return cls(subscription)

    @classmethod
    @atomic
    def updated_subscription(
        cls,
        team: Team,
        plan: Plan,
        stripe_subscription_id: str,
        status: str,
        current_period_start_at,
        current_period_end_at,
        cancel_at=None,
    ):
        subscription = (
            Subscription.objects.select_for_update()
            .filter(team=team, stripe_subscription_id=stripe_subscription_id)
            .first()
        )  # type: Subscription

        old_plan = subscription.plan
        subscription.plan = plan

        if old_plan != plan:
            # if upgrade from freemium we have to reset the page credit
            if old_plan.is_default:
                subscription.remain_daily_page_credit = plan.daily_page_credit
                subscription.remain_page_credit = plan.page_credit

            # if upgrade to upper plan we have to balance the page credit
            else:
                used_page_credit = (
                    old_plan.page_credit - subscription.remain_page_credit
                )
                subscription.remain_page_credit = plan.page_credit - used_page_credit

                used_daily_page_credit = (
                    old_plan.daily_page_credit - subscription.remain_daily_page_credit
                )
                subscription.remain_daily_page_credit = (
                    plan.daily_page_credit - used_daily_page_credit
                )

        # New period started we have to reset the page credit
        elif (
            cls.convert_timestamp_to_datetime(current_period_start_at)
            != subscription.current_period_start_at
        ):
            subscription.remain_daily_page_credit = plan.daily_page_credit
            subscription.remain_page_credit = plan.page_credit

        subscription.status = status
        subscription.current_period_start_at = cls.convert_timestamp_to_datetime(
            current_period_start_at
        )
        subscription.current_period_end_at = cls.convert_timestamp_to_datetime(
            current_period_end_at
        )
        subscription.cancel_at = cls.convert_timestamp_to_datetime(cancel_at)

        subscription.save()

        return cls(subscription)

    def reset_daily_page_credit(self, commit=True):
        self.subscription.remain_daily_page_credit = (
            self.subscription.plan.daily_page_credit
        )
        if commit:
            self.subscription.save()
        return self

    def reset_page_credit(self, commit=True):
        self.subscription.remain_page_credit = self.subscription.plan.page_credit
        if commit:
            self.subscription.save()

        return self

    @classmethod
    def make_by_stripe_subscription_id(cls, subscription_id) -> "SubscriptionService":
        return cls(Subscription.objects.get(stripe_subscription_id=subscription_id))

    def add_payment(self, amount, stripe_payment_id, status):
        SubscriptionPayment.objects.create(
            subscription=self.subscription,
            amount=amount,
            stripe_payment_id=stripe_payment_id,
            status=status,
        )


class StripeService:
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY
        self.client = stripe

    def get_or_create_customer(self, team: Team):
        if team.stripe_customer_id:
            return self.client.Customer.retrieve(team.stripe_customer_id)

        customer = self.client.Customer.create(
            name=team.name, email=team.owner.email, metadata={"team_id": str(team.uuid)}
        )

        team.stripe_customer_id = customer.id
        team.save()

        return customer

    def get_return_url(self, state=None, path="stripe-callback/"):
        if state:
            return f"{settings.FRONTEND_URL}/{path}?state={state}"
        return f"{settings.FRONTEND_URL}/{path}"

    def handle_webhook_event(self, event_data, save_history=True):
        """Handle Stripe webhook events for subscription management."""
        if save_history:
            StripeWebhookHistory.objects.create(data=event_data)

        event_type = event_data["type"]

        if event_type == "checkout.session.completed":
            self._handle_checkout_session_completed(event_data)
        elif event_type == "customer.subscription.created":
            self._handle_subscription_created(event_data)
        elif event_type == "customer.subscription.updated":
            self._handle_subscription_updated(event_data)
        elif event_type == "customer.subscription.deleted":
            self._handle_subscription_updated(event_data)
        elif event_type == "invoice.payment_succeeded":
            self._handle_payment_succeeded(event_data)
        elif event_type == "invoice.payment_failed":
            self._handle_payment_failed(event_data)

    def _handle_checkout_session_completed(self, event_data):
        pass

    def __pre_process_webhook(self, event_data):
        subscription = event_data["data"]["object"]
        # Find order by subscription ID
        price_id = subscription["items"]["data"][0]["price"]["id"]

        plan = Plan.objects.get(stripe_price_id=price_id)
        team = Team.objects.get(stripe_customer_id=subscription["customer"])

        return team, plan, subscription

    def _handle_subscription_created(self, event_data):
        team, plan, subscription = self.__pre_process_webhook(event_data)
        if plan.is_default:
            return
        SubscriptionService.create_subscription(
            team=team,
            plan=plan,
            status=subscription["status"],
            stripe_subscription_id=subscription["id"],
            start_at=subscription["start_date"],
            current_period_start_at=subscription["current_period_start"],
            current_period_end_at=subscription["current_period_end"],
        )

    def _handle_subscription_updated(self, event_data):
        team, plan, subscription = self.__pre_process_webhook(event_data)
        SubscriptionService.updated_subscription(
            team=team,
            plan=plan,
            stripe_subscription_id=subscription["id"],
            status=subscription["status"],
            current_period_start_at=subscription["current_period_start"],
            current_period_end_at=subscription["current_period_end"],
            cancel_at=subscription["cancel_at"],
        )

    def _handle_payment_succeeded(self, event_data):
        invoice = event_data["data"]["object"]

        service = SubscriptionService.make_by_stripe_subscription_id(
            invoice["subscription"]
        )

        service.add_payment(
            amount=invoice["total"] / 100,
            stripe_payment_id=invoice["payment_intent"],
            status=invoice["status"],
        )

    def _handle_payment_failed(self, event_data):
        invoice = event_data["data"]["object"]

        service = SubscriptionService.make_by_stripe_subscription_id(
            invoice["subscription"]
        )

        service.add_payment(
            amount=invoice["total"] / 100,
            stripe_payment_id=invoice["payment_intent"],
            status=invoice["status"],
        )

    def start_payment(self, plan: Plan, team: Team):
        existing_subscription = SubscriptionService.get_current_subscription(team)

        if not existing_subscription:
            return self.create_session(plan, team)

        if existing_subscription.plan.price > plan.price:
            raise PermissionDenied(_("You can't downgrade your plan."))

        current = self.client.Subscription.retrieve(
            existing_subscription.stripe_subscription_id
        )

        return self.start_customer_portal(
            team,
            flow_data={
                "type": "subscription_update_confirm",
                "subscription_update_confirm": {
                    "subscription": current.id,
                    "items": [
                        {
                            "id": current["items"]["data"][0]["id"],
                            "price": plan.stripe_price_id,
                            "quantity": 1,
                        }
                    ],
                },
            },
            cancel_url=self.get_return_url("payment-cancel"),
            success_url=self.get_return_url("payment-success"),
        )

    def create_session(self, plan: Plan, team: Team):
        customer = self.get_or_create_customer(team)
        try:
            session = self.client.checkout.Session.create(
                customer=customer.id,
                mode="subscription",
                success_url=self.get_return_url("payment-success"),
                cancel_url=self.get_return_url("payment-cancel"),
                line_items=[{"price": plan.stripe_price_id, "quantity": 1}],
                metadata={"plan_id": str(plan.uuid), "team_id": str(team.uuid)},
                allow_promotion_codes=True,
            )

            return session.url
        except Exception as e:
            raise ValidationError(f"Failed to create checkout session: {str(e)}")

    def start_freemium_plan(self, plan: Plan, current_team: Team):
        existing_subscription = SubscriptionService.get_current_subscription(
            current_team
        )
        if existing_subscription:
            raise PermissionDenied(_("Team already has an active subscription."))

        customer = self.get_or_create_customer(current_team)
        subscription = self.client.Subscription.create(
            customer=customer.id, items=[{"price": plan.stripe_price_id, "quantity": 1}]
        )

        SubscriptionService.create_subscription(
            team=current_team,
            plan=plan,
            status=subscription["status"],
            stripe_subscription_id=subscription["id"],
            start_at=subscription["start_date"],
            current_period_start_at=subscription["current_period_start"],
            current_period_end_at=subscription["current_period_end"],
        )

    def start_customer_portal(
        self, team: Team, flow_data=None, cancel_url=None, success_url=None
    ):
        customer = self.get_or_create_customer(team)
        if flow_data:
            flow_data["after_completion"] = {
                "type": "redirect",
                "redirect": {"return_url": success_url},
            }
        session = self.client.billing_portal.Session.create(
            return_url=cancel_url, customer=customer.id, flow_data=flow_data
        )
        return session.url

    def cancel_subscription(self, team: Team):
        existing_subscription = SubscriptionService.get_current_subscription(team)
        if not existing_subscription:
            raise PermissionDenied(_("Team does not have an active subscription."))

        if existing_subscription.plan.is_default:
            raise PermissionDenied(_("You cannot cancel freemium plan."))

        subscription = self.client.Subscription.retrieve(
            existing_subscription.stripe_subscription_id
        )

        return self.start_customer_portal(
            team,
            flow_data={
                "type": "subscription_cancel",
                "subscription_cancel": {"subscription": subscription.id},
            },
            cancel_url=self.get_return_url(path="dashboard/settings#billing"),
            success_url=self.get_return_url(path="dashboard/settings#billing"),
        )

    def manage_subscription(self, team: Team):
        return self.start_customer_portal(
            team,
            flow_data=None,
            cancel_url=self.get_return_url(path="dashboard/settings#billing"),
            success_url=self.get_return_url(path="dashboard/settings#billing"),
        )

    def cancel_subscription_immediately(self, team: Team):
        existing_subscription = SubscriptionService.get_current_subscription(team)
        if not existing_subscription:
            raise PermissionDenied(_("Team does not have an active subscription."))

        if existing_subscription.plan.is_default:
            raise PermissionDenied(_("You cannot cancel freemium plan."))

        subscription = self.client.Subscription.retrieve(
            existing_subscription.stripe_subscription_id
        )
        subscription = subscription.delete()

        SubscriptionService.updated_subscription(
            team=team,
            plan=existing_subscription.plan,
            stripe_subscription_id=subscription.id,
            status=subscription["status"],
            current_period_start_at=subscription["current_period_start"],
            current_period_end_at=subscription["current_period_end"],
            cancel_at=subscription["cancel_at"],
        )

    def renew_subscription(self, team: Team):
        existing_subscription = SubscriptionService.get_current_subscription(team)
        if not existing_subscription:
            raise PermissionDenied(_("Team does not have an active subscription."))

        if existing_subscription.plan.is_default:
            raise PermissionDenied(_("You cannot renew freemium plan."))

        if not existing_subscription.cancel_at:
            raise PermissionDenied(_("This plan is already active."))

        subscription = self.client.Subscription.retrieve(
            existing_subscription.stripe_subscription_id
        )

        subscription = self.client.Subscription.modify(
            subscription.id, cancel_at_period_end=False
        )
        SubscriptionService.updated_subscription(
            team=team,
            plan=existing_subscription.plan,
            stripe_subscription_id=subscription.id,
            status=subscription["status"],
            current_period_start_at=subscription["current_period_start"],
            current_period_end_at=subscription["current_period_end"],
            cancel_at=subscription["cancel_at"],
        )


class UsageHistoryService:
    def __init__(self, team: Team):
        self.team = team
        self.team_plan_service = TeamPlanService(team)

    def create(self, crawl_request: CrawlRequest):
        usage_history = UsageHistory.objects.create(
            team=self.team,
            crawl_request=crawl_request,
            requested_page_credit=crawl_request.options.get("spider_options", {}).get(
                "page_limit", 1
            ),
            used_page_credit=0,
        )
        self.team_plan_service.balance_page_credit(usage_history.requested_page_credit)

        return usage_history

    def create_search(self, search: SearchRequest):
        usage_history = UsageHistory.objects.create(
            team=self.team,
            search_request=search,
            requested_page_credit=calculate_number_of_search_credits(
                search.result_limit, search.search_options["depth"]
            ),
            used_page_credit=0,
        )
        self.team_plan_service.balance_page_credit(usage_history.requested_page_credit)

        return usage_history

    def update_used_page_credit(self, crawl_request: CrawlRequest):
        try:
            usage_history = self.team.usage_histories.get(crawl_request=crawl_request)
        except UsageHistory.DoesNotExist:
            usage_history = self.create(crawl_request)

        actual_documents = crawl_request.number_of_documents()
        usage_diff = actual_documents - usage_history.requested_page_credit
        self.team_plan_service.balance_page_credit(usage_diff)

        usage_history.used_page_credit = actual_documents
        usage_history.save()

    def revert_page_credit(self, crawl_request: CrawlRequest):
        try:
            usage_history = self.team.usage_histories.get(crawl_request=crawl_request)
        except UsageHistory.DoesNotExist:
            usage_history = self.create(crawl_request)

        self.team_plan_service.balance_page_credit(usage_history.requested_page_credit)
        usage_history.used_page_credit = 0
        usage_history.save()

    def update_used_search_credit(self, search_request: SearchRequest):
        try:
            usage_history = self.team.usage_histories.get(search_request=search_request)
        except UsageHistory.DoesNotExist:
            usage_history = self.create_search(search_request)

        actual_documents = (
            len(json.load(search_request.result)) if search_request.result else 0
        )
        usage_diff = actual_documents - usage_history.requested_page_credit
        self.team_plan_service.balance_page_credit(usage_diff)

        usage_history.used_page_credit = actual_documents
        usage_history.save()

    def revert_search_credit(self, instance):
        try:
            usage_history = self.team.usage_histories.get(search_request=instance)
        except UsageHistory.DoesNotExist:
            usage_history = self.create_search(instance)

        self.team_plan_service.balance_page_credit(usage_history.requested_page_credit)
        usage_history.used_page_credit = 0
        usage_history.save()
