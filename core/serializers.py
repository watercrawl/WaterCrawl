from rest_framework import serializers

from core.models import CrawlRequest, CrawlResult, CrawlResultAttachment


class ActionSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=['screenshot', 'pdf'])


class PageOptionSerializer(serializers.Serializer):
    exclude_tags = serializers.ListField(
        required=False,
        child=serializers.CharField(),
        default=[]
    )
    include_tags = serializers.ListField(
        required=False,
        child=serializers.CharField(),
        default=[]
    )
    wait_time = serializers.IntegerField(
        default=100,
    )
    include_html = serializers.BooleanField(
        default=False
    )
    only_main_content = serializers.BooleanField(
        default=True
    )
    include_links = serializers.BooleanField(
        default=False
    )
    timeout = serializers.IntegerField(
        required=False,
        default=15000,
    )
    accept_cookies_selector = serializers.CharField(
        required=False,
        default=None
    )
    locale = serializers.CharField(
        required=False,
        default='en-US'
    )
    extra_headers = serializers.JSONField(
        required=False,
        default=dict
    )
    actions = ActionSerializer(
        required=False,
        many=True,
        default=[]
    )


class SpiderOptionSerializer(serializers.Serializer):
    max_depth = serializers.IntegerField(
        default=1,
        required=False
    )
    page_limit = serializers.IntegerField(
        default=1,
        required=False
    )
    allowed_domains = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=[]
    )
    exclude_paths = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=[]
    )
    include_paths = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=[]
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
            'uuid',
            'url',
            'status',
            'options',
            'created_at',
            'updated_at',
            'duration',
            'number_of_documents',
        ]
        read_only_fields = [
            'uuid',
            'status',
            'created_at',
            'updated_at',
            'number_of_documents',
            'duration',
        ]


class CrawlResultAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CrawlResultAttachment
        fields = [
            'uuid',
            'attachment',
            'attachment_type',
            'filename'
        ]
        read_only_fields = [
            'uuid',
            'attachment',
            'attachment_type',
            'filename'
        ]


class CrawlResultSerializer(serializers.ModelSerializer):
    attachments = CrawlResultAttachmentSerializer(many=True)

    class Meta:
        model = CrawlResult
        fields = [
            'uuid',
            'url',
            'result',
            'attachments',
            'created_at',
            'updated_at',
        ]


class ReportDateChartSerializer(serializers.Serializer):
    date = serializers.DateField()
    count = serializers.IntegerField()


class ReportSerializer(serializers.Serializer):
    total_crawls = serializers.IntegerField()
    total_documents = serializers.IntegerField()
    finished_crawls = serializers.IntegerField()
    crawl_history = ReportDateChartSerializer(many=True)
    document_history = ReportDateChartSerializer(many=True)
