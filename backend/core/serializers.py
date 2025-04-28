import json

from rest_framework import serializers

from core import consts
from core.models import CrawlRequest, CrawlResult, CrawlResultAttachment, SearchRequest
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
        required=False, allow_null=True, default=None
    )
    locale = serializers.CharField(required=False, default="en-US")
    extra_headers = serializers.JSONField(required=False, default=dict)
    actions = ActionSerializer(required=False, many=True, default=[])


class SpiderOptionSerializer(serializers.Serializer):
    max_depth = serializers.IntegerField(default=1, required=False)
    page_limit = serializers.IntegerField(default=1, required=False)
    allowed_domains = serializers.ListField(
        child=serializers.CharField(), required=False, default=[]
    )
    exclude_paths = serializers.ListField(
        child=serializers.CharField(), required=False, default=[]
    )
    include_paths = serializers.ListField(
        child=serializers.CharField(), required=False, default=[]
    )


class CrawlOptionSerializer(serializers.Serializer):
    spider_options = SpiderOptionSerializer()
    page_options = PageOptionSerializer()
    plugin_options = serializers.JSONField(required=False)


class CrawlRequestSerializer(serializers.ModelSerializer):
    options = CrawlOptionSerializer()

    class Meta:
        model = CrawlRequest
        fields = [
            "uuid",
            "url",
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
            "status",
            "created_at",
            "updated_at",
            "number_of_documents",
            "duration",
            "sitemap",
        ]

    def validate(self, attrs):
        return PlanLimitValidator(self.context["team"]).validate_crawl_request(attrs)


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
