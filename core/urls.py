from django.urls import path
from rest_framework.routers import DefaultRouter

from core.views import CrawlRequestView, CrawlResultView, UsageAPIView

router = DefaultRouter()
router.register(r'crawl-requests', CrawlRequestView, basename='crawl-requests')
router.register(r'crawl-requests/(?P<crawl_request_uuid>[0-9a-fA-F-]{36})/results', CrawlResultView,
                basename='crawl-results')

urlpatterns = [
    path('usage/', UsageAPIView.as_view(), name='usage'),
    *router.urls
]
