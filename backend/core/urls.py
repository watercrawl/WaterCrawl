from django.urls import path
from rest_framework.routers import DefaultRouter

from core.views import (
    CrawlRequestView,
    CrawlResultView,
    UsageAPIView,
    PluginAPIView,
    SearchRequestAPIView,
    ProxyServerView,
    SitemapRequestView,
)

router = DefaultRouter()
router.register(r"crawl-requests", CrawlRequestView, basename="crawl-requests")
router.register(
    r"crawl-requests/(?P<crawl_request_uuid>[0-9a-fA-F-]{36})/results",
    CrawlResultView,
    basename="crawl-results",
)
router.register(r"search", SearchRequestAPIView, basename="search")

router.register(r"sitemaps", SitemapRequestView, basename="sitemap")

router.register(r"proxy-servers", ProxyServerView, basename="proxy-servers")

urlpatterns = [
    path("usage/", UsageAPIView.as_view(), name="usage"),
    path("plugins/schema", PluginAPIView.as_view(), name="plugin-schema"),
    *router.urls,
]
