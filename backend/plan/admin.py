from django.contrib import admin
from django.utils.translation import gettext as _
from .models import (
    Plan,
    PlanFeature,
    Subscription,
    SubscriptionPayment,
    StripeWebhookHistory,
    UsageHistory,
)


class PlanFeatureInline(admin.TabularInline):
    model = PlanFeature
    extra = 1
    readonly_fields = ("created_at", "updated_at")


class SubscriptionPaymentInline(admin.TabularInline):
    model = SubscriptionPayment
    extra = 1
    readonly_fields = ("created_at", "updated_at")
    fields = ("amount", "stripe_payment_id", "created_at", "updated_at")


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "group", "is_default", "is_active", "order")
    list_filter = ("group", "is_default", "is_active")
    list_editable = ["is_default", "is_active", "order"]
    search_fields = ("name", "description")
    readonly_fields = ("created_at", "updated_at")
    inlines = [PlanFeatureInline]
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "name",
                    "label",
                    "group",
                    "description",
                    "price_before_discount",
                    "price",
                    "is_default",
                    "is_active",
                )
            },
        ),
        (_("Stripe Configuration"), {"fields": ("stripe_price_id",)}),
        (
            _("Plan Limits"),
            {
                "fields": (
                    "number_of_users",
                    "page_credit",
                    "daily_page_credit",
                    "crawl_max_depth",
                    "crawl_max_limit",
                    "max_concurrent_crawl",
                    "number_of_knowledge_bases",
                    "number_of_agents",
                    "number_of_each_knowledge_base_documents",
                    "knowledge_base_retrival_rate_limit",
                    "agent_rate_limit",
                )
            },
        ),
        (_("Timestamps"), {"fields": ("created_at", "updated_at")}),
    )


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        "team",
        "plan",
        "remain_page_credit",
        "remain_daily_page_credit",
        "status",
        "start_at",
        "current_period_end_at",
        "cancel_at",
    )
    list_filter = ("status", "plan")
    search_fields = ("team__name", "plan__name", "stripe_subscription_id")
    readonly_fields = ("created_at", "updated_at")
    inlines = [SubscriptionPaymentInline]
    fieldsets = (
        (None, {"fields": ("team", "plan", "status")}),
        (_("Credits"), {"fields": ("remain_page_credit", "remain_daily_page_credit")}),
        (
            _("Subscription Details"),
            {
                "fields": (
                    "stripe_subscription_id",
                    "start_at",
                    "current_period_start_at",
                    "current_period_end_at",
                    "cancel_at",
                )
            },
        ),
        (_("Timestamps"), {"fields": ("created_at", "updated_at")}),
    )


@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = ("subscription", "amount", "created_at")
    list_filter = ("subscription__plan",)
    search_fields = (
        "subscription__team__name",
        "subscription__plan__name",
        "stripe_payment_id",
    )
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("subscription", "amount")}),
        (_("Payment Details"), {"fields": ("stripe_payment_id",)}),
        (_("Timestamps"), {"fields": ("created_at", "updated_at")}),
    )


@admin.register(StripeWebhookHistory)
class StripeWebhookHistoryAdmin(admin.ModelAdmin):
    list_display = ("__str__", "created_at", "updated_at")
    readonly_fields = ("created_at", "updated_at")
    list_per_page = 20
    fieldsets = (
        (None, {"fields": ("data",)}),
        (_("Timestamps"), {"fields": ("created_at", "updated_at")}),
    )


@admin.register(UsageHistory)
class UsageHistoryAdmin(admin.ModelAdmin):
    list_display = ("__str__", "content", "created_at", "updated_at")
    readonly_fields = ("created_at", "updated_at")
    list_per_page = 20
