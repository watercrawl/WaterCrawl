from itertools import chain

from adrf.viewsets import ViewSet
from django.utils.translation import gettext_lazy as _
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from llm import consts
from llm.admin_api import serializers
from llm.models import ProviderConfig, ProviderConfigModel
from llm.models_config.config import ModelConfigLoader, ModelType
from llm.services import ProviderService, ModelAvailabilityService
from llm.serializers import (
    ProviderConfigDetailSerializer,
    ProviderConfigModelSerializer,
    SetModelStatusSerializer,
    CreateCustomModelSerializer,
    UpdateCustomModelSerializer,
)
from user.permissions import IsSuperUser


@extend_schema_view(
    list=extend_schema(
        summary=_("List provider configs"),
        description=_("List provider configs"),
        tags=["Admin Provider Configurations"],
    ),
    create=extend_schema(
        summary=_("Create provider config"),
        description=_("Create provider config"),
        tags=["Admin Provider Configurations"],
    ),
    retrieve=extend_schema(
        summary=_("Get provider config"),
        description=_("Get provider config"),
        tags=["Admin Provider Configurations"],
    ),
    update=extend_schema(
        summary=_("Update provider config"),
        description=_("Update provider config"),
        tags=["Admin Provider Configurations"],
    ),
    partial_update=extend_schema(
        summary=_("Update provider config"),
        description=_("Update provider config"),
        tags=["Admin Provider Configurations"],
    ),
    destroy=extend_schema(
        summary=_("Delete provider config"),
        description=_("Delete provider config"),
        tags=["Admin Provider Configurations"],
    ),
    sync_embeddings=extend_schema(
        summary=_("Sync embeddings"),
        description=_("Sync embeddings"),
        tags=["Admin Provider Configurations"],
        request=None,
        responses={204: None},
    ),
    sync_llm_models=extend_schema(
        summary=_("Sync LLM models"),
        description=_("Sync LLM models"),
        tags=["Admin Provider Configurations"],
        request=None,
        responses={204: None},
    ),
    test_config=extend_schema(
        summary=_("Test config"),
        description=_("Test config"),
        tags=["Admin Provider Configurations"],
        request=serializers.TestProviderConfigSerializer,
        responses={204: None},
    ),
    providers=extend_schema(
        summary=_("List providers"),
        description=_("List providers"),
        tags=["Admin Provider Configurations"],
        request=None,
        responses={
            200: OpenApiResponse(
                description=_("List of available providers"),
                response={
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "key": {"type": "string"},
                            "title": {"type": "string"},
                            "api_key": {"type": "string"},
                            "base_url": {"type": "string"},
                            "default_base_url": {"type": "string"},
                        },
                        "required": ["key", "title", "api_key", "base_url"],
                    },
                },
            )
        },
    ),
)
class ProviderConfigAdminApiView(ModelViewSet):
    permission_classes = (IsSuperUser,)
    serializer_class = serializers.ProviderConfigSerializer
    queryset = ProviderConfig.objects.none()

    def get_serializer_class(self):
        if self.action in ["update", "partial_update"]:
            return serializers.UpdateProviderConfigSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        return ProviderConfig.objects.filter(team=None)

    def perform_create(self, serializer):
        super().perform_create(serializer)

    @action(
        detail=True,
        methods=["post"],
        url_path="sync-embeddings",
        url_name="sync-embeddings",
        serializer_class=None,
    )
    def sync_embeddings(self, request, pk=None):
        provider_config: ProviderConfig = self.get_object()
        ModelConfigLoader.invalidate_provider_cache(provider_config.provider_name)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=True,
        methods=["post"],
        url_path="sync-llm-models",
        url_name="sync-llm-models",
        serializer_class=None,
    )
    def sync_llm_models(self, request, pk=None):
        provider_config: ProviderConfig = self.get_object()
        ModelConfigLoader.invalidate_provider_cache(provider_config.provider_name)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=["post"],
        url_path="test-config",
        url_name="test-config",
    )
    def test_config(self, request):
        serializer = serializers.TestProviderConfigSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=["get"],
        url_path="providers",
        url_name="providers",
    )
    def providers(self, request):
        return Response(ProviderService.get_available_providers())


@extend_schema_view(
    list=extend_schema(
        summary=_("List LLM models"),
        description=_("List LLM models"),
        tags=["Admin LLM Models"],
    ),
    retrieve=extend_schema(
        summary=_("Get LLM model"),
        description=_("Get LLM model"),
        tags=["Admin LLM Models"],
    ),
)
class LLMModelAdminApiView(ViewSet):
    permission_classes = (IsSuperUser,)
    serializer_class = serializers.ModelConfigSerializer

    def list(self, request, provider_name):
        if provider_name not in chain(*consts.LLM_PROVIDER_CHOICES):
            raise NotFound(_("Provider not found"))

        list_models = ModelConfigLoader.load_all_models(provider_name, ModelType.LLM)
        serializer = serializers.ModelConfigSerializer(list_models, many=True)

        return Response(serializer.data)

    def retrieve(self, request, provider_name, model_name):
        if provider_name not in chain(*consts.LLM_PROVIDER_CHOICES):
            raise NotFound(_("Provider not found"))

        model = ModelConfigLoader(provider_name, ModelType.LLM, model_name).load()
        serializer = serializers.ModelConfigSerializer(model)

        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary=_("List provider embeddings"),
        description=_("List provider embeddings"),
        tags=["Admin Provider Embeddings"],
    ),
    retrieve=extend_schema(
        summary=_("Get provider embedding"),
        description=_("Get provider embedding"),
        tags=["Admin Provider Embeddings"],
    ),
)
class EmbeddingModelAdminApiView(ViewSet):
    permission_classes = (IsSuperUser,)
    serializer_class = serializers.ModelConfigSerializer

    def list(self, request, provider_name):
        if provider_name not in chain(*consts.LLM_PROVIDER_CHOICES):
            raise NotFound(_("Provider not found"))
        list_models = ModelConfigLoader.load_all_models(
            provider_name, ModelType.EMBEDDING
        )
        serializer = serializers.ModelConfigSerializer(list_models, many=True)

        return Response(serializer.data)

    def retrieve(self, request, provider_name, model_name):
        if provider_name not in chain(*consts.LLM_PROVIDER_CHOICES):
            raise NotFound(_("Provider not found"))
        model = ModelConfigLoader(provider_name, ModelType.EMBEDDING, model_name).load()
        serializer = serializers.ModelConfigSerializer(model)

        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary=_("List provider config models"),
        description=_("Get all models for a provider config with their status."),
        tags=["Admin Provider Config Models"],
    ),
    retrieve=extend_schema(
        summary=_("Get provider config model"),
        description=_("Get a specific model configuration."),
        tags=["Admin Provider Config Models"],
    ),
    create=extend_schema(
        summary=_("Create custom model"),
        description=_("Create a custom user-defined model for this provider config."),
        tags=["Admin Provider Config Models"],
        request=CreateCustomModelSerializer,
        responses={"201": ProviderConfigModelSerializer},
    ),
    partial_update=extend_schema(
        summary=_("Update custom model"),
        description=_("Update a custom user-defined model."),
        tags=["Admin Provider Config Models"],
        request=UpdateCustomModelSerializer,
        responses={"200": ProviderConfigModelSerializer},
    ),
    destroy=extend_schema(
        summary=_("Delete custom model"),
        description=_("Delete a custom user-defined model."),
        tags=["Admin Provider Config Models"],
        responses={"204": None},
    ),
)
class ProviderConfigModelAdminViewSet(ModelViewSet):
    """Admin API endpoint for managing models within a global provider configuration."""

    permission_classes = (IsSuperUser,)
    serializer_class = ProviderConfigModelSerializer
    queryset = ProviderConfigModel.objects.none()
    http_method_names = ["get", "post", "patch", "delete"]

    def get_provider_config(self):
        """Get the parent provider config (global only)."""
        provider_config_pk = self.kwargs.get("provider_config_pk")
        try:
            return ProviderConfig.objects.get(pk=provider_config_pk, team=None)
        except ProviderConfig.DoesNotExist:
            raise NotFound(_("Global provider config not found"))

    def get_queryset(self):
        provider_config = self.get_provider_config()
        return ProviderConfigModel.objects.filter(provider_config=provider_config)

    def get_serializer_class(self):
        if self.action == "create":
            return CreateCustomModelSerializer
        if self.action in ["update", "partial_update"]:
            return UpdateCustomModelSerializer
        if self.action == "list":
            return ProviderConfigDetailSerializer
        return super().get_serializer_class()

    def list(self, request, *args, **kwargs):
        """Get provider config with all models and their status."""
        provider_config = self.get_provider_config()
        serializer = ProviderConfigDetailSerializer(provider_config)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create a custom user-defined model."""
        provider_config = self.get_provider_config()
        serializer = CreateCustomModelSerializer(
            data=request.data, context={"provider_config": provider_config}
        )
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        custom_model = ModelAvailabilityService.create_custom_model(
            provider_config=provider_config,
            model_type=data["model_type"],
            model_key=data["model_key"],
            label=data["label"],
            config={
                "features": data.get("features", []),
                "model_properties": data.get("model_properties", {}),
                "parameters_schema": data.get("parameters_schema", {}),
            },
        )

        return Response(
            ProviderConfigModelSerializer(custom_model).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        """Update a custom user-defined model."""
        provider_config = self.get_provider_config()
        pk = self.kwargs.get("pk")

        try:
            custom_model = ProviderConfigModel.objects.get(
                uuid=pk, provider_config=provider_config, is_custom=True
            )
        except ProviderConfigModel.DoesNotExist:
            raise NotFound(_("Custom model not found"))

        serializer = UpdateCustomModelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        config = {}
        if "features" in data:
            config["features"] = data["features"]
        if "model_properties" in data:
            config["model_properties"] = data["model_properties"]
        if "parameters_schema" in data:
            config["parameters_schema"] = data["parameters_schema"]

        updated_model = ModelAvailabilityService.update_custom_model(
            provider_config_model=custom_model,
            label=data.get("label"),
            config=config if config else None,
            is_active=data.get("is_active"),
        )

        return Response(
            ProviderConfigModelSerializer(updated_model).data, status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        """Delete a custom user-defined model."""
        provider_config = self.get_provider_config()
        pk = self.kwargs.get("pk")

        try:
            custom_model = ProviderConfigModel.objects.get(
                uuid=pk, provider_config=provider_config, is_custom=True
            )
        except ProviderConfigModel.DoesNotExist:
            raise NotFound(_("Custom model not found"))

        ModelAvailabilityService.delete_custom_model(custom_model)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @extend_schema(
        summary=_("Set model status"),
        description=_("Activate or deactivate a model for this provider config."),
        tags=["Admin Provider Config Models"],
        request=SetModelStatusSerializer,
        responses={"200": ProviderConfigModelSerializer},
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="set-status",
        url_name="set-status",
        serializer_class=SetModelStatusSerializer,
    )
    def set_status(self, request, *args, **kwargs):
        """Set the active status for a model."""
        provider_config = self.get_provider_config()
        serializer = SetModelStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        model_status = ModelAvailabilityService.set_model_status(
            provider_config=provider_config,
            model_type=serializer.validated_data["model_type"],
            model_key=serializer.validated_data["model_key"],
            is_active=serializer.validated_data["is_active"],
        )

        return Response(
            ProviderConfigModelSerializer(model_status).data, status=status.HTTP_200_OK
        )
