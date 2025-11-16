import json
from urllib.parse import urlparse

from django.conf import settings
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from common.encryption import encrypt_key, decrypt_key
from core import consts
from core.models import (
    CrawlRequest,
    CrawlResult,
    CrawlResultAttachment,
    SearchRequest,
    ProxyServer,
    SitemapRequest,
)
from core.services import ProxyService
from plan.validators import PlanLimitValidator


class ActionSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["screenshot", "pdf"])


class PageOptionSerializer(serializers.Serializer):
    exclude_tags = serializers.ListField(
        required=False, child=serializers.CharField(), default=[]
    )
    include_tags = serializers.ListField(
        required=False, child=serializers.CharField(), default=[]
    )
    wait_time = serializers.IntegerField(
        default=100,
    )
    include_html = serializers.BooleanField(default=False)
    only_main_content = serializers.BooleanField(default=True)
    include_links = serializers.BooleanField(default=False)
    timeout = serializers.IntegerField(
        required=False,
        default=15000,
    )
    accept_cookies_selector = serializers.CharField(
        required=False, allow_null=True, allow_blank=True, default=None
    )
    locale = serializers.CharField(
        required=False, allow_null=True, allow_blank=True, default="en-US"
    )
    extra_headers = serializers.JSONField(required=False, default=dict)
    actions = ActionSerializer(required=False, many=True, default=[])
    ignore_rendering = serializers.BooleanField(required=False, default=False)


class SpiderOptionSerializer(serializers.Serializer):
    max_depth = serializers.IntegerField(default=1, required=False, min_value=1)
    page_limit = serializers.IntegerField(default=1, required=False, min_value=1)
    concurrent_requests = serializers.IntegerField(
        default=settings.SCRAPY_CONCURRENT_REQUESTS,
        required=False,
        allow_null=True,
        min_value=1,
        max_value=settings.SCRAPY_CONCURRENT_REQUESTS,
    )
    allowed_domains = serializers.ListField(
        child=serializers.CharField(), required=False, default=[]
    )
    exclude_paths = serializers.ListField(
        child=serializers.CharField(), required=False, default=[]
    )
    include_paths = serializers.ListField(
        child=serializers.CharField(), required=False, default=[]
    )
    proxy_server = serializers.CharField(required=False, allow_null=True, default=None)

    def validate_proxy_server(self, value):
        if (
            value
            and not ProxyService.get_team_proxies(self.context["team"])
            .filter(slug=value)
            .exists()
        ):
            raise serializers.ValidationError(_("Proxy server does not exist"))
        return value


class CrawlOptionSerializer(serializers.Serializer):
    spider_options = SpiderOptionSerializer()
    page_options = PageOptionSerializer()
    plugin_options = serializers.JSONField(required=False, default={})


class CrawlRequestSerializer(serializers.ModelSerializer):
    options = CrawlOptionSerializer()
    url = serializers.URLField()
    urls = serializers.ListField(child=serializers.URLField(), read_only=True)

    class Meta:
        model = CrawlRequest
        fields = [
            "uuid",
            "url",
            "urls",
            "crawl_type",
            "status",
            "options",
            "created_at",
            "updated_at",
            "duration",
            "number_of_documents",
            "sitemap",
        ]
        read_only_fields = [
            "uuid",
            "urls",
            "crawl_type",
            "status",
            "created_at",
            "updated_at",
            "number_of_documents",
            "duration",
            "sitemap",
        ]

    def validate(self, attrs):
        attrs["urls"] = [attrs.pop("url")]
        attrs["crawl_type"] = consts.CRAWL_TYPE_SINGLE
        return PlanLimitValidator(self.context["team"]).validate_crawl_request(attrs)


class BatchSpiderOptionSerializer(SpiderOptionSerializer):
    max_depth = serializers.HiddenField(default=1)
    page_limit = serializers.HiddenField(default=0)
    allowed_domains = serializers.HiddenField(default=[])
    exclude_paths = serializers.HiddenField(default=[])
    include_paths = serializers.HiddenField(default=[])


class BatchCrawlOptionSerializer(CrawlOptionSerializer):
    spider_options = BatchSpiderOptionSerializer()


class BatchCrawlRequestSerializer(serializers.ModelSerializer):
    urls = serializers.ListField(
        child=serializers.URLField(), allow_empty=False, min_length=1
    )
    options = BatchCrawlOptionSerializer()

    class Meta:
        model = CrawlRequest
        fields = [
            "uuid",
            "urls",
            "status",
            "options",
            "created_at",
            "updated_at",
            "duration",
        ]
        read_only_fields = [
            "uuid",
            "status",
            "created_at",
            "updated_at",
            "duration",
        ]

    def validate(self, attrs):
        attrs["options"]["spider_options"] = {
            **attrs["options"]["spider_options"],
            "max_depth": 0,
            "page_limit": len(attrs["urls"]),
            "allowed_domains": [urlparse(url).netloc for url in attrs["urls"]],
        }
        attrs["crawl_type"] = consts.CRAWL_TYPE_BATCH
        return PlanLimitValidator(self.context["team"]).validate_batch_crawl_request(
            attrs
        )


class CrawlResultAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrawlResultAttachment
        fields = ["uuid", "attachment", "attachment_type", "filename"]
        read_only_fields = ["uuid", "attachment", "attachment_type", "filename"]


class CrawlResultSerializer(serializers.ModelSerializer):
    attachments = CrawlResultAttachmentSerializer(many=True)

    class Meta:
        model = CrawlResult
        fields = [
            "uuid",
            "url",
            "result",
            "attachments",
            "created_at",
            "updated_at",
        ]


class FullCrawlResultSerializer(CrawlResultSerializer):
    result = serializers.SerializerMethodField()

    def get_result(self, obj):
        return json.load(obj.result)


class ReportDateChartSerializer(serializers.Serializer):
    date = serializers.DateField()
    count = serializers.IntegerField()


class ReportSerializer(serializers.Serializer):
    total_crawls = serializers.IntegerField()
    total_documents = serializers.IntegerField()
    finished_crawls = serializers.IntegerField()
    crawl_history = ReportDateChartSerializer(many=True)
    document_history = ReportDateChartSerializer(many=True)


class SearchOptionsSerializer(serializers.Serializer):
    language = serializers.CharField(
        required=False, max_length=8, allow_null=True, default=None
    )
    country = serializers.CharField(
        required=False, max_length=8, allow_null=True, default=None
    )
    time_renge = serializers.ChoiceField(
        required=False,
        choices=consts.SEARCH_TIME_RENGE_CHOICES,
        default=consts.SEARCH_TIME_RENGE_ANY,
    )
    search_type = serializers.ChoiceField(
        required=False,
        choices=consts.SEARCH_TYPE_CHOICES,
        default=consts.SEARCH_TYPE_WEB,
    )
    depth = serializers.ChoiceField(
        required=False,
        choices=consts.SEARCH_DEPTH_CHOICES,
        default=consts.SEARCH_DEPTH_BASIC,
    )


class SearchRequestSerializer(serializers.ModelSerializer):
    search_options = SearchOptionsSerializer()
    result_limit = serializers.IntegerField(default=5, min_value=1, max_value=20)

    class Meta:
        model = SearchRequest
        fields = [
            "uuid",
            "query",
            "search_options",
            "result_limit",
            "duration",
            "status",
            "result",
            "created_at",
        ]
        read_only_fields = [
            "uuid",
            "duration",
            "status",
            "result",
            "created_at",
        ]

    def validate(self, attrs):
        return PlanLimitValidator(self.context["team"]).validate_search_request(attrs)


class FullSearchResultSerializer(SearchRequestSerializer):
    result = serializers.SerializerMethodField()

    def get_result(self, obj):
        if not obj.result:
            return None
        return json.load(obj.result)

    class Meta(SearchRequestSerializer.Meta):
        fields = SearchRequestSerializer.Meta.fields + ["result"]


class ProxyServerSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        required=False,
        write_only=True,
        allow_blank=True,
        allow_null=True,
        max_length=128,
        style={"input_type": "password"},
    )

    class Meta:
        model = ProxyServer
        fields = [
            "name",
            "slug",
            "is_default",
            "proxy_type",
            "host",
            "port",
            "username",
            "password",
            "has_password",
            "created_at",
            "updated_at",
        ]

    def validate_slug(self, value):
        team = self.context["team"]
        query = ProxyServer.objects.filter(team=team, slug=value)
        if self.instance is not None:
            query = query.exclude(pk=self.instance.pk)
        if query.exists():
            raise serializers.ValidationError(
                "Proxy Server with this slug already exists"
            )
        return value

    def save(self, **kwargs):
        if "password" in self.validated_data:
            password = self.validated_data["password"]
            if not password:
                self.validated_data["password"] = None
            else:
                self.validated_data["password"] = encrypt_key(password)

        return super().save(**kwargs)


class ListAllProxyServerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProxyServer
        fields = ["name", "slug", "category"]


class TestProxySerializer(serializers.Serializer):
    slug = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    host = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    port = serializers.IntegerField(required=False, allow_null=True)
    proxy_type = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    username = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    password = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def validate(self, attrs):
        team = self.context["team"]
        if "slug" in attrs and attrs["slug"]:
            proxy = ProxyServer.objects.filter(team=team, slug=attrs["slug"]).first()
            if not proxy:
                raise serializers.ValidationError(
                    {"slug": _("Proxy server does not exist")}
                )
            attrs.pop("slug")

            if "host" not in attrs:
                attrs["host"] = proxy.host
            if "port" not in attrs:
                attrs["port"] = proxy.port
            if "username" not in attrs:
                attrs["username"] = proxy.username
            if "password" not in attrs:
                attrs["password"] = (
                    decrypt_key(proxy.password) if proxy.has_password else None
                )
            if "proxy_type" not in attrs:
                attrs["proxy_type"] = proxy.proxy_type

        errors = {}
        for key in ["host", "port", "proxy_type"]:
            if key not in attrs or not attrs[key]:
                errors[key] = [_("This field is required")]
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class SitemapRequestOptionSerializer(serializers.Serializer):
    include_subdomains = serializers.BooleanField(default=True)
    ignore_sitemap_xml = serializers.BooleanField(default=False)
    search = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    include_paths = serializers.ListField(
        child=serializers.CharField(), required=False, default=[]
    )
    exclude_paths = serializers.ListField(
        child=serializers.CharField(), required=False, default=[]
    )
    proxy_server = serializers.CharField(required=False, allow_null=True, default=None)

    def validate_proxy_server(self, value):
        if (
            value
            and not ProxyService.get_team_proxies(self.context["team"])
            .filter(slug=value)
            .exists()
        ):
            raise serializers.ValidationError(_("Proxy server does not exist"))
        return value


class SitemapRequestSerializer(serializers.ModelSerializer):
    options = SitemapRequestOptionSerializer()

    class Meta:
        model = SitemapRequest
        fields = [
            "uuid",
            "url",
            "status",
            "options",
            "duration",
            "result",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "uuid",
            "status",
            "duration",
            "result",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        return PlanLimitValidator(self.context["team"]).validate_sitemap_request(attrs)


class FullSitemapRequestSerializer(SitemapRequestSerializer):
    result = serializers.SerializerMethodField()

    def get_result(self, obj):
        if not obj.result:
            return None
        return json.load(obj.result)
