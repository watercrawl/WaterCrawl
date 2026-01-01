from django.utils.translation import gettext_lazy as _
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from llm import serializers
from llm.models import ProviderConfig, ProviderConfigModel
from llm.services import (
    ProviderConfigService,
    ProviderService,
    ModelAvailabilityService,
)
from user.decorators import setup_current_team
from user.permissions import IsAuthenticatedTeam


@extend_schema_view(
    list=extend_schema(
        summary=_("List team provider configs"),
        description=_("Get all provider configurations for the current team."),
        tags=["Provider Configurations"],
    ),
    create=extend_schema(
        summary=_("Create provider config"),
        description=_("Create a new provider configuration for the current team."),
        tags=["Provider Configurations"],
    ),
    retrieve=extend_schema(
        summary=_("Get provider config"),
        description=_(
            "Get detailed information about a specific provider configuration."
        ),
        tags=["Provider Configurations"],
    ),
    destroy=extend_schema(
        summary=_("Delete provider config"),
        description=_("Delete a provider configuration."),
        tags=["Provider Configurations"],
    ),
    partial_update=extend_schema(
        summary=_("Update provider config"),
        description=_("Update a provider configuration."),
        tags=["Provider Configurations"],
    ),
    update=extend_schema(
        summary=_("Update provider config"),
        description=_("Update a provider configuration."),
        tags=["Provider Configurations"],
    ),
    provider_list=extend_schema(
        summary=_("List available providers"),
        description=_("Get a list of available LLM providers."),
        tags=["Provider Configurations"],
        # responses={"200": },
    ),
    list_all=extend_schema(
        summary=_("List all provider configs (Global and Team-specific)"),
        description=_(
            "Get all available provider configurations including global and team-specific ones."
        ),
        tags=["Provider Configurations"],
        responses={"200": serializers.ListProviderConfigSerializer(many=True)},
    ),
    test_config=extend_schema(
        summary=_("Test provider config"),
        description=_("Test a provider configuration without saving it."),
        tags=["Provider Configurations"],
        request=serializers.TestProviderConfigSerializer,
        responses={
            "204": None,
        },
    ),
    get_models=extend_schema(
        summary=_("Get provider models"),
        description=_("Get all models supported by a specific provider."),
        tags=["Providers"],
    ),
    get_embedding_models=extend_schema(
        summary=_("Get provider embedding models"),
        description=_("Get all embedding models supported by a specific provider."),
        tags=["Providers"],
    ),
    providers=extend_schema(
        summary=_("List available providers"),
        description=_("Get a list of available LLM providers."),
        tags=["Provider Configurations"],
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
@setup_current_team
class ProviderConfigViewSet(ModelViewSet):
    """API endpoint for provider configurations.

    Manage team-specific provider configurations for various LLM services.
    """

    permission_classes = [IsAuthenticated, IsAuthenticatedTeam]
    serializer_class = serializers.ProviderConfigSerializer
    queryset = ProviderConfig.objects.none()

    def get_serializer_class(self):
        if self.action in ["update", "partial_update"]:
            return serializers.UpdateProviderConfigSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        return self.request.current_team.provider_configs.order_by("created_at").all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["team"] = self.request.current_team
        return context

    def perform_create(self, serializer):
        serializer.save(team=self.request.current_team)

    @action(
        detail=False,
        methods=["get"],
        url_path="providers",
        url_name="providers",
    )
    def providers(self, request, **kwargs):
        """List all available providers."""
        return Response(ProviderService.get_available_providers())

    @action(
        detail=False,
        methods=["get"],
        url_path="list-all",
        url_name="list-all",
        permission_classes=[IsAuthenticatedTeam],
        pagination_class=None,
        serializer_class=serializers.ListProviderConfigSerializer,
    )
    def list_all(self, request, **kwargs):
        """List all available provider configurations (global and team-specific)."""
        data = ProviderConfigService.get_team_provider_configs(request.current_team)

        serializer = serializers.ListProviderConfigSerializer(data, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["post"],
        url_path="test-config",
        url_name="test-config",
    )
    def test_config(self, request, **kwargs):
        """Test a provider configuration without saving it."""
        serializer = serializers.TestProviderConfigSerializer(
            data=request.data, context={"team": request.current_team}
        )
        serializer.is_valid(raise_exception=True)
        result = ProviderConfigService.test_provider_config(**serializer.validated_data)
        if result:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            raise ValidationError(_("Test failed"))


@extend_schema_view(
    list=extend_schema(
        summary=_("List provider config models"),
        description=_("Get all models for a provider config with their status."),
        tags=["Provider Config Models"],
    ),
    retrieve=extend_schema(
        summary=_("Get provider config model"),
        description=_("Get a specific model configuration."),
        tags=["Provider Config Models"],
    ),
    create=extend_schema(
        summary=_("Create custom model"),
        description=_("Create a custom user-defined model for this provider config."),
        tags=["Provider Config Models"],
        request=serializers.CreateCustomModelSerializer,
        responses={"201": serializers.ProviderConfigModelSerializer},
    ),
    partial_update=extend_schema(
        summary=_("Update custom model"),
        description=_("Update a custom user-defined model."),
        tags=["Provider Config Models"],
        request=serializers.UpdateCustomModelSerializer,
        responses={"200": serializers.ProviderConfigModelSerializer},
    ),
    destroy=extend_schema(
        summary=_("Delete custom model"),
        description=_("Delete a custom user-defined model."),
        tags=["Provider Config Models"],
        responses={"204": None},
    ),
)
@setup_current_team
class ProviderConfigModelViewSet(ModelViewSet):
    """API endpoint for managing models within a provider configuration.

    Allows listing all models, toggling status, and CRUD for custom models.
    """

    permission_classes = [IsAuthenticated, IsAuthenticatedTeam]
    serializer_class = serializers.ProviderConfigModelSerializer
    queryset = ProviderConfigModel.objects.none()
    http_method_names = ["get", "post", "patch", "delete"]

    def get_provider_config(self):
        """Get the parent provider config."""
        provider_config_pk = self.kwargs.get("provider_config_pk")
        try:
            return self.request.current_team.provider_configs.get(pk=provider_config_pk)
        except ProviderConfig.DoesNotExist:
            # Also check global configs
            try:
                return ProviderConfig.objects.get(pk=provider_config_pk, team=None)
            except ProviderConfig.DoesNotExist:
                raise NotFound(_("Provider config not found"))

    def get_queryset(self):
        provider_config = self.get_provider_config()
        return ProviderConfigModel.objects.filter(provider_config=provider_config)

    def get_serializer_class(self):
        if self.action == "create":
            return serializers.CreateCustomModelSerializer
        if self.action in ["update", "partial_update"]:
            return serializers.UpdateCustomModelSerializer
        if self.action == "list":
            return serializers.ProviderConfigDetailSerializer
        return super().get_serializer_class()

    def list(self, request, *args, **kwargs):
        """Get provider config with all models and their status."""
        provider_config = self.get_provider_config()
        serializer = serializers.ProviderConfigDetailSerializer(provider_config)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create a custom user-defined model."""
        provider_config = self.get_provider_config()
        serializer = serializers.CreateCustomModelSerializer(
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
            serializers.ProviderConfigModelSerializer(custom_model).data,
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

        serializer = serializers.UpdateCustomModelSerializer(data=request.data)
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
            serializers.ProviderConfigModelSerializer(updated_model).data,
            status=status.HTTP_200_OK,
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
        tags=["Provider Config Models"],
        request=serializers.SetModelStatusSerializer,
        responses={"200": serializers.ProviderConfigModelSerializer},
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="set-status",
        url_name="set-status",
        serializer_class=serializers.SetModelStatusSerializer,
    )
    def set_status(self, request, *args, **kwargs):
        """Set the active status for a model."""
        provider_config = self.get_provider_config()
        serializer = serializers.SetModelStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        model_status = ModelAvailabilityService.set_model_status(
            provider_config=provider_config,
            model_type=serializer.validated_data["model_type"],
            model_key=serializer.validated_data["model_key"],
            is_active=serializer.validated_data["is_active"],
        )

        return Response(
            serializers.ProviderConfigModelSerializer(model_status).data,
            status=status.HTTP_200_OK,
        )
