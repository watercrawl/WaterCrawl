from django.urls import path
from rest_framework.routers import DefaultRouter

from plan.views import PlanViewSet, StripeWebhookView, SubscriptionViewSet

router = DefaultRouter()

router.register(r'plans', PlanViewSet, basename='plan')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('webhook/stripe/', StripeWebhookView.as_view(), name='stripe-webhook'),
    *router.urls
]
