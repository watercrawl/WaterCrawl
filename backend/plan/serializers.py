from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from plan.models import Plan, PlanFeature, Subscription, UsageHistory
from user.models import TeamAPIKey


class PlanFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanFeature
        fields = [
            "title",
            "help_text",
            "icon",
        ]


class PlanSerializer(serializers.ModelSerializer):
    features = PlanFeatureSerializer(many=True)

    class Meta:
        model = Plan
        fields = [
            "uuid",
            "name",
            "label",
            "group",
            "description",
            "price_before_discount",
            "price",
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
            "is_default",
            "features",
        ]


class StripeWebhookSerializer(serializers.Serializer):
    type = serializers.CharField()
    data = serializers.JSONField()


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer()

    class Meta:
        model = Subscription
        fields = [
            "uuid",
            "plan",
            "status",
            "remain_page_credit",
            "remain_daily_page_credit",
            "start_at",
            "current_period_start_at",
            "current_period_end_at",
            "cancel_at",
            "created_at",
            "updated_at",
        ]


class StartSubscriptionSerializer(serializers.Serializer):
    plan_uuid = serializers.UUIDField()

    def validate_plan_uuid(self, value):
        plan = Plan.objects.filter(uuid=value, is_active=True).first()
        if not plan:
            raise serializers.ValidationError(_("Plan not found"))
        return plan

    class Meta:
        fields = ["plan_uuid"]


class TeamPlanSerializer(serializers.Serializer):
    plan_name = serializers.CharField()
    status = serializers.CharField()
    plan_page_credit = serializers.IntegerField()
    plan_daily_page_credit = serializers.IntegerField()
    plan_number_users = serializers.IntegerField()
    remain_number_users = serializers.IntegerField()
    remaining_page_credit = serializers.IntegerField()
    remaining_daily_page_credit = serializers.IntegerField()
    max_depth = serializers.IntegerField()
    max_concurrent_crawl = serializers.IntegerField()
    number_of_knowledge_bases = serializers.IntegerField()
    number_of_agents = serializers.IntegerField()
    number_of_each_knowledge_base_documents = serializers.IntegerField()
    knowledge_base_retrival_rate_limit = serializers.CharField()
    agent_rate_limit = serializers.CharField()
    start_at = serializers.DateTimeField()
    current_period_start_at = serializers.DateTimeField()
    current_period_end_at = serializers.DateTimeField()
    cancel_at = serializers.DateTimeField()
    is_default = serializers.BooleanField()


class TeamAPIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamAPIKey
        fields = ["uuid", "name"]


class UsageHistorySerializer(serializers.ModelSerializer):
    content_type = serializers.SerializerMethodField()
    team_api_key = TeamAPIKeySerializer()

    class Meta:
        model = UsageHistory
        fields = [
            "uuid",
            "content_type",
            "content_id",
            "requested_page_credit",
            "used_page_credit",
            "team_api_key",
            "created_at",
            "updated_at",
        ]

    def get_content_type(self, obj: UsageHistory):
        return "{}.{}".format(obj.content_type.app_label, obj.content_type.model)
