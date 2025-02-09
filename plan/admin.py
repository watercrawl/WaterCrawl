from django.contrib import admin
from .models import Plan, PlanFeature, Subscription, SubscriptionPayment, StripeWebhookHistory


class PlanFeatureInline(admin.TabularInline):
    model = PlanFeature
    extra = 1
    readonly_fields = ('created_at', 'updated_at')


class SubscriptionPaymentInline(admin.TabularInline):
    model = SubscriptionPayment
    extra = 1
    readonly_fields = ('created_at', 'updated_at')
    fields = ('amount', 'stripe_payment_id', 'created_at', 'updated_at')


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'group', 'is_default', 'is_active', 'order')
    list_filter = ('group', 'is_default', 'is_active')
    list_editable = ['is_default', 'is_active', 'order']
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [PlanFeatureInline]
    fieldsets = (
        (None, {
            'fields': (
                'name', 'label', 'group', 'description', 'price_before_discount', 'price', 'is_default', 'is_active')
        }),
        ('Stripe Configuration', {
            'fields': ('stripe_price_id',)
        }),
        ('Plan Limits', {
            'fields': ('number_of_users', 'page_credit', 'daily_page_credit',
                       'crawl_max_depth', 'crawl_max_limit', 'max_concurrent_crawl')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        })
    )


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        'team', 'plan', 'remain_page_credit', 'remain_daily_page_credit', 'status', 'start_at', 'current_period_end_at', 'cancel_at')
    list_filter = ('status', 'plan')
    search_fields = ('team__name', 'plan__name', 'stripe_subscription_id')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [SubscriptionPaymentInline]
    fieldsets = (
        (None, {
            'fields': ('team', 'plan', 'status')
        }),
        ('Credits', {
            'fields': ('remain_page_credit', 'remain_daily_page_credit')
        }),
        ('Subscription Details', {
            'fields': (
                'stripe_subscription_id', 'start_at', 'current_period_start_at', 'current_period_end_at', 'cancel_at'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        })
    )


@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = ('subscription', 'amount', 'created_at')
    list_filter = ('subscription__plan',)
    search_fields = ('subscription__team__name', 'subscription__plan__name', 'stripe_payment_id')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('subscription', 'amount')
        }),
        ('Payment Details', {
            'fields': ('stripe_payment_id',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        })
    )


@admin.register(StripeWebhookHistory)
class StripeWebhookHistoryAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 20
    fieldsets = (
        (None, {
            'fields': ('data',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        })
    )
