from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

from common.encryption import encrypt_key, decrypt_key
from llm import consts
from llm.models import ProviderConfig, ProviderConfigModel
from llm.services import ProviderConfigService, ModelAvailabilityService


class ProviderConfigSerializer(serializers.ModelSerializer):
    """Serializer for provider configuration."""

    is_global = serializers.SerializerMethodField()
    provider_name = serializers.ChoiceField(
        choices=consts.LLM_PROVIDER_CHOICES,
    )
    api_key = serializers.CharField(
        write_only=True,
        required=False,
        allow_null=True,
    )
    base_url = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
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
        print(config)
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
            self.test_provider_config(
                provider_name=self.instance.provider_name,
                api_key=api_key,
                base_url=base_url,
            )
        return attrs


class TestProviderConfigSerializer(serializers.Serializer):
    """Serializer for testing provider configuration."""

    provider_name = serializers.ChoiceField(choices=consts.LLM_PROVIDER_CHOICES)
    api_key = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, default=None
    )
    base_url = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, default=None
    )


class ModelConfigSerializer(serializers.Serializer):
    key = serializers.CharField()
    label = serializers.CharField()
    model_type = serializers.CharField()
    features = serializers.ListField(child=serializers.CharField())
    model_properties = serializers.DictField()
    parameters_schema = serializers.DictField()


class ListProviderConfigSerializer(serializers.ModelSerializer):
    """
    Serializer for listing provider configs with available models.
    Uses ModelAvailabilityService to filter out inactive models and include custom models.
    """

    available_llm_models = serializers.SerializerMethodField()
    available_embedding_models = serializers.SerializerMethodField()
    available_reranker_models = serializers.SerializerMethodField()

    class Meta:
        model = ProviderConfig
        fields = [
            "uuid",
            "title",
            "provider_name",
            "is_global",
            "available_llm_models",
            "available_embedding_models",
            "available_reranker_models",
        ]
        read_only_fields = ["uuid"]

    def get_available_llm_models(self, obj: ProviderConfig):
        # Get only active models (respecting exclusions and including custom models)
        models = ModelAvailabilityService.get_available_models(
            obj, consts.MODEL_TYPE_LLM
        )
        return ProviderModelSerializer(models, many=True).data

    def get_available_embedding_models(self, obj: ProviderConfig):
        # Get only active models (respecting exclusions and including custom models)
        models = ModelAvailabilityService.get_available_models(
            obj, consts.MODEL_TYPE_EMBEDDING
        )
        return ProviderModelSerializer(models, many=True).data

    def get_available_reranker_models(self, obj: ProviderConfig):
        # Get only active models (respecting exclusions and including custom models)
        models = ModelAvailabilityService.get_available_models(
            obj, consts.MODEL_TYPE_RERANKER
        )
        return ProviderModelSerializer(models, many=True).data


class ProviderModelSerializer(serializers.Serializer):
    """Serializer for model with availability status."""

    key = serializers.CharField()
    label = serializers.CharField()
    model_type = serializers.CharField()
    features = serializers.ListField(child=serializers.CharField())
    model_properties = serializers.DictField()
    parameters_schema = serializers.DictField()
    is_active = serializers.BooleanField()
    is_custom = serializers.BooleanField()


class ProviderConfigDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for provider config with all models and their status."""

    is_global = serializers.SerializerMethodField()
    llm_models = serializers.SerializerMethodField()
    embedding_models = serializers.SerializerMethodField()
    reranker_models = serializers.SerializerMethodField()
    custom_models = serializers.SerializerMethodField()

    class Meta:
        model = ProviderConfig
        fields = [
            "uuid",
            "title",
            "provider_name",
            "base_url",
            "is_global",
            "llm_models",
            "embedding_models",
            "reranker_models",
            "custom_models",
        ]
        read_only_fields = ["uuid", "is_global"]

    def get_is_global(self, obj):
        return obj.is_global

    def get_llm_models(self, obj: ProviderConfig):
        models = ModelAvailabilityService.get_all_models_for_provider(
            obj, consts.MODEL_TYPE_LLM, include_inactive=True
        )
        return ProviderModelSerializer(models, many=True).data

    def get_embedding_models(self, obj: ProviderConfig):
        models = ModelAvailabilityService.get_all_models_for_provider(
            obj, consts.MODEL_TYPE_EMBEDDING, include_inactive=True
        )
        return ProviderModelSerializer(models, many=True).data

    def get_reranker_models(self, obj: ProviderConfig):
        models = ModelAvailabilityService.get_all_models_for_provider(
            obj, consts.MODEL_TYPE_RERANKER, include_inactive=True
        )
        return ProviderModelSerializer(models, many=True).data

    def get_custom_models(self, obj: ProviderConfig):
        """Get all custom models grouped by type."""
        custom_models = ProviderConfigModel.objects.filter(
            provider_config=obj, is_custom=True
        )
        return ProviderConfigModelSerializer(custom_models, many=True).data


class ProviderConfigModelSerializer(serializers.ModelSerializer):
    """Serializer for ProviderConfigModel."""

    label = serializers.SerializerMethodField()

    class Meta:
        model = ProviderConfigModel
        fields = [
            "uuid",
            "model_key",
            "model_type",
            "is_active",
            "is_custom",
            "label",
            "custom_config",
        ]
        read_only_fields = ["uuid", "is_custom"]

    def get_label(self, obj):
        return obj.label


class SetModelStatusSerializer(serializers.Serializer):
    """Serializer for setting model active status."""

    model_key = serializers.CharField()
    model_type = serializers.ChoiceField(choices=consts.MODEL_TYPE_CHOICES)
    is_active = serializers.BooleanField()


class CreateCustomModelSerializer(serializers.Serializer):
    """Serializer for creating a custom model."""

    model_key = serializers.CharField(max_length=255)
    model_type = serializers.ChoiceField(choices=consts.MODEL_TYPE_CHOICES)
    label = serializers.CharField(max_length=255)
    features = serializers.ListField(
        child=serializers.CharField(), required=False, default=list
    )
    model_properties = serializers.DictField(required=False, default=dict)
    parameters_schema = serializers.DictField(required=False, default=dict)

    def validate_model_key(self, value):
        provider_config = self.context.get("provider_config")
        model_type = self.initial_data.get("model_type")

        if provider_config and model_type:
            # Check if model already exists
            exists = ProviderConfigModel.objects.filter(
                provider_config=provider_config, model_key=value, model_type=model_type
            ).exists()
            if exists:
                raise serializers.ValidationError(
                    _("A model with this key already exists for this provider config.")
                )
        return value


class UpdateCustomModelSerializer(serializers.Serializer):
    """Serializer for updating a custom model."""

    label = serializers.CharField(max_length=255, required=False)
    is_active = serializers.BooleanField(required=False)
    features = serializers.ListField(child=serializers.CharField(), required=False)
    model_properties = serializers.DictField(required=False)
    parameters_schema = serializers.DictField(required=False)
