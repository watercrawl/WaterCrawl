from rest_framework import serializers


class SettingSerializer(serializers.Serializer):
    is_enterprise_mode_active = serializers.BooleanField()
    github_client_id = serializers.CharField()
    google_client_id = serializers.CharField()
    is_signup_active = serializers.BooleanField()
    is_login_active = serializers.BooleanField()
    is_google_login_active = serializers.BooleanField()
    is_github_login_active = serializers.BooleanField()
    api_version = serializers.CharField()
    policy_url = serializers.CharField()
    terms_url = serializers.CharField()
    policy_update_at = serializers.DateTimeField()
    terms_update_at = serializers.DateTimeField()
    google_analytics_id = serializers.CharField()
    is_installed = serializers.BooleanField()
    is_search_configured = serializers.BooleanField()
    max_crawl_concurrency = serializers.IntegerField()
