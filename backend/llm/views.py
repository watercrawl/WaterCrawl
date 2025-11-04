from django.utils.translation import gettext_lazy as _
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from llm import serializers
from llm.models import ProviderConfig
from llm.services import ProviderConfigService, ProviderService
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
        serializer_class=serializers.TestProviderConfigSerializer,
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
