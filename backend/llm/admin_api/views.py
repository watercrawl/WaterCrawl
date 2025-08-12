from django.utils.translation import gettext_lazy as _
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from llm.admin_api import serializers
from llm.admin_api.services import ProviderConfigAdminService
from llm.models import LLMModel, ProviderConfig, EmbeddingModel
from llm.services import ProviderService
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
                        },
                        "required": ["key", "title"],
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

    def get_queryset(self):
        return ProviderConfig.objects.filter(team=None)

    def perform_create(self, serializer):
        super().perform_create(serializer)
        ProviderConfigAdminService(serializer.instance).sync_if_needed()

    @action(
        detail=True,
        methods=["post"],
        url_path="sync-embeddings",
        url_name="sync-embeddings",
        serializer_class=None,
    )
    def sync_embeddings(self, request, pk=None):
        provider_config = self.get_object()
        ProviderConfigAdminService(provider_config).sync_provider_embeddings()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=True,
        methods=["post"],
        url_path="sync-llm-models",
        url_name="sync-llm-models",
        serializer_class=None,
    )
    def sync_llm_models(self, request, pk=None):
        provider_config = self.get_object()
        ProviderConfigAdminService(provider_config).sync_llm_models()
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
    create=extend_schema(
        summary=_("Create LLM model"),
        description=_("Create LLM model"),
        tags=["Admin LLM Models"],
    ),
    retrieve=extend_schema(
        summary=_("Get LLM model"),
        description=_("Get LLM model"),
        tags=["Admin LLM Models"],
    ),
    update=extend_schema(
        summary=_("Update LLM model"),
        description=_("Update LLM model"),
        tags=["Admin LLM Models"],
    ),
    partial_update=extend_schema(
        summary=_("Update LLM model"),
        description=_("Update LLM model"),
        tags=["Admin LLM Models"],
    ),
    destroy=extend_schema(
        summary=_("Delete LLM model"),
        description=_("Delete LLM model"),
        tags=["Admin LLM Models"],
    ),
)
class LLMModelAdminApiView(ModelViewSet):
    permission_classes = (IsSuperUser,)
    serializer_class = serializers.LLMModelSerializer
    queryset = LLMModel.objects.all()
    filterset_fields = ["name", "key", "visibility_level", "provider_name"]


@extend_schema_view(
    list=extend_schema(
        summary=_("List provider embeddings"),
        description=_("List provider embeddings"),
        tags=["Admin Provider Embeddings"],
    ),
    create=extend_schema(
        summary=_("Create provider embedding"),
        description=_("Create provider embedding"),
        tags=["Admin Provider Embeddings"],
    ),
    retrieve=extend_schema(
        summary=_("Get provider embedding"),
        description=_("Get provider embedding"),
        tags=["Admin Provider Embeddings"],
    ),
    update=extend_schema(
        summary=_("Update provider embedding"),
        description=_("Update provider embedding"),
        tags=["Admin Provider Embeddings"],
    ),
    partial_update=extend_schema(
        summary=_("Update provider embedding"),
        description=_("Update provider embedding"),
        tags=["Admin Provider Embeddings"],
    ),
    destroy=extend_schema(
        summary=_("Delete provider embedding"),
        description=_("Delete provider embedding"),
        tags=["Admin Provider Embeddings"],
    ),
)
class EmbeddingModelAdminApiView(ModelViewSet):
    permission_classes = (IsSuperUser,)
    serializer_class = serializers.EmbeddingModelSerializer
    queryset = EmbeddingModel.objects.all()
    filterset_fields = ["name", "key", "visibility_level", "provider_name"]
