from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from plan.models import Plan, PlanFeature, Subscription


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
    start_at = serializers.DateTimeField()
    current_period_start_at = serializers.DateTimeField()
    current_period_end_at = serializers.DateTimeField()
    cancel_at = serializers.DateTimeField()
    is_default = serializers.BooleanField()
