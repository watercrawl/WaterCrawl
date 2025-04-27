from django.db import models
from django.utils.translation import gettext_lazy as _

from common.models import BaseModel
from plan import consts


class Plan(BaseModel):
    name = models.CharField(_("name"), max_length=100)
    label = models.CharField(_("Label"), max_length=100, null=True, blank=True)
    group = models.CharField(
        _("Group"), max_length=100, choices=consts.PLAN_GROUP_CHOICES
    )
    description = models.TextField(_("Description"))
    price_before_discount = models.DecimalField(
        _("Price before discount"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    price = models.DecimalField(_("Price"), max_digits=10, decimal_places=2)
    stripe_price_id = models.CharField(
        _("Stripe price id"),
    )
    number_of_users = models.IntegerField(
        _("Number of users"),
        help_text=_("Number of users that can be added to the team."),
        default=1,
    )
    page_credit = models.IntegerField(
        _("Page credit"),
        help_text=_("Number of pages that can be crawled in plan duration."),
        default=1000,
    )
    daily_page_credit = models.IntegerField(
        _("Daily page credit"),
        help_text=_(
            "Number of pages that can be crawled per day. resets at midnight. -1 for unlimited"
        ),
        default=100,
    )
    crawl_max_depth = models.IntegerField(
        _("Crawl max depth"), help_text=_("Max depth of crawling."), default=3
    )
    crawl_max_limit = models.IntegerField(
        _("Crawl max limit"), help_text=_("Max number of pages to crawl."), default=100
    )
    max_concurrent_crawl = models.IntegerField(
        _("Max concurrent crawl"),
        help_text=_("Max Number of concurrent crawling."),
        default=1,
    )
    is_default = models.BooleanField(_("Is default"), default=False)
    order = models.PositiveIntegerField(_("Order"), default=0)
    is_active = models.BooleanField(_("Is active"), default=True)

    class Meta:
        verbose_name = _("Plan")
        verbose_name_plural = _("Plans")
        ordering = ["order"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_default:
            Plan.objects.all().update(is_default=False)
        super(Plan, self).save(*args, **kwargs)


class PlanFeature(BaseModel):
    plan = models.ForeignKey("Plan", on_delete=models.CASCADE, related_name="features")
    order = models.PositiveIntegerField(_("Order"), default=0)
    icon = models.CharField(
        _("Icon"),
        max_length=100,
        choices=consts.PLAN_FEATURE_ICON_CHOICES,
        null=True,
        blank=True,
    )
    title = models.CharField(
        _("Title"),
        max_length=100,
    )
    help_text = models.TextField(_("Help text"), null=True, blank=True)

    class Meta:
        verbose_name = _("Plan Feature")
        verbose_name_plural = _("Plan Features")
        ordering = ["order"]

    def __str__(self):
        return self.title


class Subscription(BaseModel):
    team = models.ForeignKey(
        "user.Team",
        verbose_name=_("Team"),
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    stripe_subscription_id = models.CharField(
        _("Stripe subscription id"), max_length=255
    )
    plan = models.ForeignKey(
        "Plan",
        verbose_name=_("Plan"),
        on_delete=models.RESTRICT,
        related_name="subscriptions",
    )
    remain_page_credit = models.IntegerField(_("Remain page credit"), default=0)
    remain_daily_page_credit = models.IntegerField(
        _("Remain daily page credit"), default=0
    )

    start_at = models.DateTimeField(_("Start datetime"), null=True, blank=True)
    current_period_start_at = models.DateTimeField(
        _("Current period start datetime"), null=True, blank=True
    )
    current_period_end_at = models.DateTimeField(
        _("Current period end datetime"), null=True, blank=True
    )
    cancel_at = models.DateTimeField(_("Canceled at"), null=True, blank=True)
    # reset_daily_page_credit_at = models.DateTimeField(
    #     _('reset daily page credit at')
    # )
    status = models.CharField(_("Status"), max_length=255)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Subscription")
        verbose_name_plural = _("Subscriptions")

    def __str__(self):
        return f"{self.team.name} - {self.plan.name}"


class SubscriptionPayment(BaseModel):
    subscription = models.ForeignKey(
        "Subscription", on_delete=models.CASCADE, related_name="payments"
    )
    amount = models.DecimalField(_("Amount"), max_digits=10, decimal_places=2)
    stripe_payment_id = models.CharField(
        _("Stripe payment id"), max_length=255, null=True, blank=True
    )
    status = models.CharField(_("Status"), max_length=255)

    # payment_method = models.CharField(
    #     _('Payment method'),
    #     max_length=255
    # )

    class Meta:
        verbose_name = _("Subscription Payment")
        verbose_name_plural = _("Subscription Payments")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subscription.team.name} - {self.subscription.plan.name}"


class StripeWebhookHistory(BaseModel):
    data = models.JSONField(_("Data"))

    class Meta:
        verbose_name = _("Stripe webhook history")
        verbose_name_plural = _("Stripe webhook histories")
        ordering = ["-created_at"]

    def __str__(self):
        return self.data["type"] if "type" in self.data else f"Unknown {self.uuid}"


class UsageHistory(BaseModel):
    team = models.ForeignKey(
        "user.Team",
        verbose_name=_("Team"),
        on_delete=models.RESTRICT,
        related_name="usage_histories",
    )
    crawl_request = models.OneToOneField(
        "core.CrawlRequest",
        verbose_name=_("Crawl request"),
        on_delete=models.RESTRICT,
        related_name="usage_history",
        null=True,
    )
    search_request = models.OneToOneField(
        "core.SearchRequest",
        verbose_name=_("Search request"),
        on_delete=models.RESTRICT,
        related_name="usage_history",
        null=True,
    )
    requested_page_credit = models.PositiveIntegerField(
        _("Requested page credit"),
    )
    used_page_credit = models.PositiveIntegerField(
        _("Actual page credit used"),
    )

    class Meta:
        verbose_name = _("Usage History")
        verbose_name_plural = _("Usage Histories")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.team.name} - {self.crawl_request.url if self.crawl_request else self.search_request.query}"
