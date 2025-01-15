from rest_framework import serializers


class SettingSerializer(serializers.Serializer):
    github_client_id = serializers.CharField()
    google_client_id = serializers.CharField()
    is_signup_active = serializers.BooleanField()
    is_login_active = serializers.BooleanField()
    is_google_login_active = serializers.BooleanField()
    is_github_login_active = serializers.BooleanField()
    api_version = serializers.CharField()
