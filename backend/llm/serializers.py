from rest_framework import serializers

from common.encryption import encrypt_key
from llm import consts
from llm.models import ProviderConfig, LLMModel, EmbeddingModel


class LLMModelSerializer(serializers.ModelSerializer):
    """Serializer for language models."""

    class Meta:
        model = LLMModel
        fields = [
            "uuid",
            "name",
            "min_temperature",
            "max_temperature",
            "default_temperature",
        ]
        read_only_fields = ["uuid"]


class EmbeddingModelSerializer(serializers.ModelSerializer):
    """Serializer for provider embedding models."""

    class Meta:
        model = EmbeddingModel
        fields = [
            "uuid",
            "name",
            "description",
            "dimensions",
            "max_input_length",
            "truncate",
        ]
        read_only_fields = ["uuid"]


class ProviderConfigSerializer(serializers.ModelSerializer):
    """Serializer for provider configuration."""

    is_global = serializers.SerializerMethodField()
    provider_name = serializers.ChoiceField(
        choices=consts.LLM_PROVIDER_WITHOUT_WATERCRAWL_CHOICES
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

    def get_is_global(self, obj):
        return obj.is_global

    def save(self, **kwargs):
        if "api_key" in self.validated_data:
            if not self.validated_data["api_key"]:
                self.validated_data["api_key"] = None
            else:
                self.validated_data["api_key"] = encrypt_key(
                    self.validated_data["api_key"]
                )
        return super().save(**kwargs)


class TestProviderConfigSerializer(serializers.Serializer):
    """Serializer for testing provider configuration."""

    provider_name = serializers.ChoiceField(
        choices=consts.LLM_PROVIDER_WITHOUT_WATERCRAWL_CHOICES
    )
    api_key = serializers.CharField()
    base_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class ListProviderConfigSerializer(serializers.ModelSerializer):
    available_llm_models = LLMModelSerializer(many=True, read_only=True)
    available_embedding_models = EmbeddingModelSerializer(many=True, read_only=True)

    class Meta:
        model = ProviderConfig
        fields = [
            "uuid",
            "title",
            "provider_name",
            "is_global",
            "available_llm_models",
            "available_embedding_models",
        ]
        read_only_fields = ["uuid"]
