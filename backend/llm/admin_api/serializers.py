from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

from common.encryption import encrypt_key, decrypt_key
from llm import consts
from llm.models import LLMModel, ProviderConfig, EmbeddingModel
from llm.services import ProviderConfigService


class LLMModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = LLMModel
        fields = [
            "uuid",
            "name",
            "key",
            "provider_name",
            "visibility_level",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at"]


class ProviderConfigSerializer(serializers.ModelSerializer):
    """Serializer for provider configuration."""

    is_global = serializers.SerializerMethodField()
    provider_name = serializers.ChoiceField(
        choices=consts.LLM_PROVIDER_WITHOUT_WATERCRAWL_CHOICES,
    )
    api_key = serializers.CharField(
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ProviderConfig
        fields = [
            "uuid",
            "title",
            "provider_name",
            "api_key",
            "base_url",
            "is_global",
        ]
        read_only_fields = ["uuid", "is_global"]

    def validate(self, attrs):
        provider_name = attrs.get("provider_name")
        config = consts.LLM_PROVIDER_INFORMATION[provider_name]
        if config["api_key"] == consts.OPTION_REQUIRED and not attrs.get("api_key"):
            raise serializers.ValidationError({"api_key": _("API key is required")})
        if config["base_url"] == consts.OPTION_REQUIRED and not attrs.get("base_url"):
            raise serializers.ValidationError({"base_url": _("Base URL is required")})
        self.test_provider_config(
            provider_name=provider_name,
            api_key=attrs.get("api_key"),
            base_url=attrs.get("base_url"),
        )
        return attrs

    def get_is_global(self, obj):
        return obj.is_global

    def test_provider_config(self, provider_name, api_key, base_url):
        if not ProviderConfigService.test_provider_config(
            provider_name=provider_name, api_key=api_key, base_url=base_url
        ):
            raise serializers.ValidationError(
                {
                    "api_key": _("Invalid API key or base URL. Test failed"),
                    "base_url": _("Invalid API key or base URL. Test failed"),
                }
            )

    def save(self, **kwargs):
        if "api_key" in self.validated_data:
            if not self.validated_data["api_key"]:
                self.validated_data["api_key"] = None
            else:
                self.validated_data["api_key"] = encrypt_key(
                    self.validated_data["api_key"]
                )
        return super().save(**kwargs)


class UpdateProviderConfigSerializer(ProviderConfigSerializer):
    provider_name = serializers.CharField(read_only=True)

    def validate(self, attrs):
        if "api_key" in attrs or "base_url" in attrs:
            base_url = (
                self.instance.base_url if "base_url" not in attrs else attrs["base_url"]
            )
            api_key = (
                decrypt_key(self.instance.api_key)
                if "api_key" not in attrs
                else attrs["api_key"]
            )
            print(api_key)
            self.test_provider_config(
                provider_name=self.instance.provider_name,
                api_key=api_key,
                base_url=base_url,
            )
        return attrs


class EmbeddingModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmbeddingModel
        fields = [
            "uuid",
            "name",
            "key",
            "description",
            "dimensions",
            "max_input_length",
            "truncate",
            "visibility_level",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at"]


class TestProviderConfigSerializer(serializers.Serializer):
    provider_name = serializers.ChoiceField(choices=consts.LLM_PROVIDER_CHOICES)
    api_key = serializers.CharField()
    base_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        if not ProviderConfigService.test_provider_config(**attrs):
            raise serializers.ValidationError("Test failed")
        return attrs
