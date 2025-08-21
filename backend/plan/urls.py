from django.urls import path
from rest_framework.routers import DefaultRouter

from plan.views import (
    PlanViewSet,
    StripeWebhookView,
    SubscriptionViewSet,
    CreditUsageHistoryView,
)

router = DefaultRouter()

router.register(r"plans", PlanViewSet, basename="plan")
router.register(r"subscriptions", SubscriptionViewSet, basename="subscription")
router.register(r"usage-histories", CreditUsageHistoryView, basename="usage-history")

urlpatterns = [
    path("webhook/stripe/", StripeWebhookView.as_view(), name="stripe-webhook"),
    *router.urls,
]
