from rest_framework import serializers

from common.encryption import encrypt_key
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
    class Meta:
        model = ProviderConfig
        fields = [
            "uuid",
            "title",
            "provider_name",
            "api_key",
            "base_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at"]
        extra_kwargs = {
            "api_key": {"write_only": True},
            "base_url": {"write_only": True},
        }

    def validate(self, attrs):
        if not self.instance or "api_key" in attrs:
            if not ProviderConfigService.test_provider_config(
                provider_name=attrs["provider_name"]
                if "provider_name" in attrs
                else self.instance.provider_name,
                api_key=attrs["api_key"],
                base_url=attrs["base_url"]
                if "base_url" in attrs
                else self.instance.base_url,
            ):
                raise serializers.ValidationError("Test failed")
        return attrs

    def save(self, **kwargs):
        if "api_key" in self.validated_data:
            if not self.validated_data["api_key"]:
                self.validated_data["api_key"] = None
            else:
                self.validated_data["api_key"] = encrypt_key(
                    self.validated_data["api_key"]
                )
        return super().save(**kwargs)


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
