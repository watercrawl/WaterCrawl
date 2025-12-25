import logging

from django.utils.translation import gettext_lazy as _
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets, mixins
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.mixins import (
    ListModelMixin,
    RetrieveModelMixin,
    CreateModelMixin,
    UpdateModelMixin,
    DestroyModelMixin,
)
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from knowledge_base import serializers, consts
from knowledge_base.models import (
    KnowledgeBase,
    KnowledgeBaseDocument,
    KnowledgeBaseChunk,
    RetrievalSetting,
)
from knowledge_base.vector_stores.retriever import Retriever
from knowledge_base.services import KnowledgeBaseDocumentService, KnowledgeBaseService
from knowledge_base.tasks import (
    process_document,
    after_create_knowledge_base,
    after_delete_knowledge_base,
    crawl_documents,
)
from knowledge_base.tools.summarizers import ContextAwareEnhancerService
from plan.throttle import (
    KnowledgeBaseRetrivalRateThrottle,
    SummaryEnhancementRateThrottle,
)

from user.decorators import setup_current_team
from user.permissions import IsAuthenticatedTeam

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(
        summary=_("List knowledge bases"),
        description=_("List all knowledge bases for the current team."),
        tags=["Knowledge Bases"],
    ),
    retrieve=extend_schema(
        summary=_("Get knowledge base details"),
        description=_("Get details for a specific knowledge base."),
        responses={
            200: serializers.KnowledgeBaseDetailSerializer,
        },
        tags=["Knowledge Bases"],
    ),
    create=extend_schema(
        summary=_("Create knowledge base"),
        description=_("Create a new knowledge base for the current team."),
        request=serializers.KnowledgeBaseDetailSerializer,
        responses={
            201: serializers.KnowledgeBaseDetailSerializer,
        },
        tags=["Knowledge Bases"],
    ),
    update=extend_schema(
        summary=_("Update knowledge base"),
        description=_("Update an existing knowledge base."),
        tags=["Knowledge Bases"],
    ),
    partial_update=extend_schema(
        summary=_("Partially update knowledge base"),
        description=_("Partially update an existing knowledge base."),
        tags=["Knowledge Bases"],
    ),
    destroy=extend_schema(
        summary=_("Delete knowledge base"),
        description=_("Delete an existing knowledge base."),
        tags=["Knowledge Bases"],
    ),
    context_aware_enhancer=extend_schema(
        summary=_("Enhance knowledge base context aware text"),
        description=_("Enhance documents using context-aware summarization."),
        request=serializers.ContextAwareEnhancerSerializer,
        responses={"200": serializers.EnhancedContentSerializer},
        tags=["Knowledge Bases"],
    ),
    query=extend_schema(
        summary=_("Query knowledge base"),
        description=_("Execute a query against the knowledge base."),
        request=serializers.QueryKnowledgeBaseSerializer,
        responses={"200": "Query results"},
        tags=["Knowledge Bases"],
    ),
)
@setup_current_team
class KnowledgeBaseViewSet(
    ListModelMixin,
    RetrieveModelMixin,
    CreateModelMixin,
    UpdateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    """API endpoint for knowledge bases."""

    serializer_class = serializers.KnowledgeBaseSerializer
    permission_classes = [IsAuthenticatedTeam]
    queryset = KnowledgeBase.objects.none()
    lookup_field = "uuid"

    def get_queryset(self):
        """Return knowledge bases for the current team."""
        return KnowledgeBase.objects.filter(team=self.request.current_team)

    def get_serializer_class(self):
        if self.action == "query":
            return serializers.QueryKnowledgeBaseSerializer
        if self.action in ["list", "retrieve", "create"]:
            return serializers.KnowledgeBaseDetailSerializer
        return super().get_serializer_class()

    def get_serializer_context(self):
        """Add current team to serializer context."""
        context = super().get_serializer_context()
        context["team"] = self.request.current_team
        return context

    def perform_create(self, serializer):
        """Create a new knowledge base."""
        # Extract initial retrieval setting data before saving
        initial_retrieval_setting_data = serializer.validated_data.pop(
            "initial_retrieval_setting"
        )

        knowledge_base = serializer.save(team=self.request.current_team)

        initial_retrieval_setting_data.pop("is_default", None)

        RetrievalSetting.objects.create(
            knowledge_base=knowledge_base,
            is_default=True,
            **initial_retrieval_setting_data,
        )

        after_create_knowledge_base.delay(serializer.instance.uuid)

    def perform_destroy(self, instance):
        """Delete a knowledge base."""
        KnowledgeBaseService(instance).set_deleted()
        after_delete_knowledge_base.delay(instance.uuid)

    @action(
        detail=False,
        methods=["post"],
        url_path="context-aware-enhancer",
        name="context-aware-enhancer",
        throttle_classes=[SummaryEnhancementRateThrottle],
    )
    def context_aware_enhancer(self, request):
        """Enhance documents using context-aware summarization."""
        serializer = serializers.ContextAwareEnhancerSerializer(
            data=request.data,
            context={"team": self.request.current_team},
        )
        serializer.is_valid(raise_exception=True)
        service = ContextAwareEnhancerService(
            llm_model_key=serializer.validated_data["llm_model_key"],
            provider_config=serializer.validated_data["provider_config"],
            llm_config=serializer.validated_data["llm_model_config"],
        )
        result = service.enhance_context(serializer.validated_data["content"])
        return Response(serializers.EnhancedContentSerializer({"content": result}).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="query",
        serializer_class=serializers.QueryKnowledgeBaseSerializer,
        throttle_classes=[KnowledgeBaseRetrivalRateThrottle],
    )
    def query(self, request, uuid=None):
        """Query the knowledge base."""
        knowledge_base = self.get_object()
        serializer = serializers.QueryKnowledgeBaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get retrieval setting (from request or use default)
        retrieval_setting = None
        retrieval_setting_id = serializer.validated_data.get("retrieval_setting_id")
        if retrieval_setting_id:
            from knowledge_base.models import RetrievalSetting

            retrieval_setting = RetrievalSetting.objects.filter(
                knowledge_base=knowledge_base, uuid=retrieval_setting_id
            ).first()

        # Create retriever and search
        retriever = Retriever(knowledge_base, retrieval_setting)
        results = retriever.retrieve(
            query=serializer.validated_data["query"],
        )
        return Response([result.model_dump() for result in results])


@extend_schema_view(
    list=extend_schema(
        summary=_("List documents"),
        description=_("List all documents for a knowledge base."),
        responses={
            200: serializers.KnowledgeBaseDocumentSerializer(many=True),
        },
        tags=["Knowledge Bases"],
    ),
    retrieve=extend_schema(
        summary=_("Get document details"),
        description=_("Get details for a specific document."),
        tags=["Knowledge Bases"],
    ),
    create=extend_schema(
        summary=_("Create document"),
        description=_("Create a new document for a knowledge base."),
        tags=["Knowledge Bases"],
    ),
    update=extend_schema(
        summary=_("Update document"),
        description=_("Update an existing document."),
        tags=["Knowledge Bases"],
    ),
    partial_update=extend_schema(
        summary=_("Partially update document"),
        description=_("Partially update an existing document."),
        tags=["Knowledge Bases"],
    ),
    destroy=extend_schema(
        summary=_("Delete document"),
        description=_("Delete an existing document."),
        tags=["Knowledge Bases"],
    ),
    from_urls=extend_schema(
        summary=_("Process URLs"),
        description=_("Process a list of URLs and add them to the knowledge base."),
        request=serializers.FillKnowledgeBaseFromUrlsSerializer,
        responses={
            204: None,
        },
        tags=["Knowledge Bases"],
    ),
    from_crawl_results=extend_schema(
        summary=_("Process crawl results"),
        description=_("Process crawl results and add them to the knowledge base."),
        request=serializers.FillKnowledgeBaseFromCrawlResultsSerializer,
        responses={
            204: None,
        },
        tags=["Knowledge Bases"],
    ),
    from_crawl_request=extend_schema(
        summary=_("Process crawl request"),
        description=_("Process a crawl request and add it to the knowledge base."),
        request=serializers.FillKnowledgeBaseFromCrawlRequestsSerializer,
        responses={
            204: None,
        },
        tags=["Knowledge Bases"],
    ),
    from_files=extend_schema(
        summary=_("Process files"),
        description=_("Process a list of files and add them to the knowledge base."),
        request=serializers.FillKnowledgeBaseFromFileSerializer,
        responses={
            204: None,
        },
        tags=["Knowledge Bases"],
    ),
    retry_indexing=extend_schema(
        summary=_("Retry document"),
        description=_("Retry a failed document. to index it again."),
        tags=["Knowledge Bases"],
    ),
)
@setup_current_team
class KnowledgeBaseDocumentViewSet(
    ListModelMixin,
    RetrieveModelMixin,
    CreateModelMixin,
    UpdateModelMixin,
    DestroyModelMixin,
    GenericViewSet,
):
    """API endpoint for knowledge base documents."""

    serializer_class = serializers.KnowledgeBaseDocumentDetailSerializer
    permission_classes = [IsAuthenticatedTeam]
    queryset = KnowledgeBaseDocument.objects.none()
    lookup_field = "uuid"

    def get_serializer_class(self):
        if self.action == "list":
            return serializers.KnowledgeBaseDocumentSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        """Return documents for the team's knowledge bases."""
        # If knowledge_base_uuid is provided in the URL, filter by that knowledge base
        knowledge_base_uuid = self.kwargs.get("knowledge_base_uuid")
        knowledge_base = self.request.current_team.knowledge_bases.get(
            pk=knowledge_base_uuid
        )
        return knowledge_base.documents.order_by("-created_at")

    def perform_create(self, serializer):
        """Create a new document."""
        service = self.get_knowledge_base_service()
        if not service.can_add_documents():
            raise PermissionDenied(
                _("You cannot add documents to this knowledge base.")
            )
        serializer.save(knowledge_base_id=self.kwargs.get("knowledge_base_uuid"))
        process_document.delay(serializer.instance.uuid)

    def perform_destroy(self, instance):
        """Delete a document."""
        service = KnowledgeBaseDocumentService(instance)
        service.remove_from_vector_store()
        instance.delete()

    def perform_update(self, serializer):
        """Update a document."""
        service = KnowledgeBaseDocumentService(serializer.instance)
        service.reindex_to_vector_store()
        serializer.save()

    def get_knowledge_base_service(self) -> KnowledgeBaseService:
        """Get the knowledge base UUID from the URL kwargs."""
        return KnowledgeBaseService.make_by_team_and_uuid(
            self.request.current_team, self.kwargs.get("knowledge_base_uuid")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["team"] = self.request.current_team
        context["knowledge_base"] = self.get_knowledge_base_service().knowledge_base
        return context

    @action(
        detail=False,
        methods=["post"],
        url_path="from-urls",
        name="from-urls",
        serializer_class=serializers.FillKnowledgeBaseFromUrlsSerializer,
    )
    def from_urls(self, request, **kwargs):
        """Process a document."""
        service = self.get_knowledge_base_service()
        if not service.can_add_documents():
            raise PermissionDenied(
                _("You cannot add documents to this knowledge base.")
            )

        serializer = serializers.FillKnowledgeBaseFromUrlsSerializer(
            data=request.data,
            context={
                "team": self.request.current_team,
                "knowledge_base": service.knowledge_base,
            },
        )
        serializer.is_valid(raise_exception=True)

        objs = service.add_urls(serializer.validated_data["urls"])

        crawl_documents.delay([obj.uuid for obj in objs])

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=["post"],
        url_path="from-crawl-results",
        name="from-crawl-results",
    )
    def from_crawl_results(self, request, **kwargs):
        service = self.get_knowledge_base_service()
        if not service.can_add_documents():
            raise PermissionDenied(
                _("You cannot add documents to this knowledge base.")
            )

        serializer = serializers.FillKnowledgeBaseFromCrawlResultsSerializer(
            data=request.data,
            context={
                "team": self.request.current_team,
                "knowledge_base": service.knowledge_base,
            },
        )
        serializer.is_valid(raise_exception=True)

        crawl_results = serializer.validated_data["crawl_result_uuids"]

        objs = service.add_crawl_results(crawl_results)
        for obj in objs:
            process_document.delay(str(obj.uuid))

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=["post"],
        url_path="from-crawl-request",
        name="from-crawl-request",
        serializer_class=serializers.FillKnowledgeBaseFromCrawlResultsSerializer,
    )
    def from_crawl_request(self, request, **kwargs):
        """Process documents from a crawl request."""
        service = self.get_knowledge_base_service()
        if not service.can_add_documents():
            raise PermissionDenied(
                _("You cannot add documents to this knowledge base.")
            )

        serializer = serializers.FillKnowledgeBaseFromCrawlRequestsSerializer(
            data=request.data,
            context={
                "team": self.request.current_team,
                "knowledge_base": service.knowledge_base,
            },
        )
        serializer.is_valid(raise_exception=True)

        crawl_request = serializer.validated_data["crawl_request_uuid"]
        objs = service.add_crawl_request(crawl_request)

        for obj in objs:
            process_document.delay(str(obj.uuid))

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=["post"],
        url_path="from-files",
        name="from-files",
    )
    def from_files(self, request, **kwargs):
        """Process a document."""
        knowledge_base = self.get_knowledge_base_service()
        if not knowledge_base.can_add_documents():
            raise PermissionDenied(
                _("You cannot add documents to this knowledge base.")
            )

        serializer = serializers.FillKnowledgeBaseFromFileSerializer(
            data=request.data,
            context={
                "team": self.request.current_team,
                "knowledge_base": knowledge_base.knowledge_base,
            },
        )
        serializer.is_valid(raise_exception=True)

        objs = knowledge_base.add_files(serializer.validated_data["files"])

        for obj in objs:
            process_document.delay(str(obj.uuid))

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=True,
        methods=["post"],
        url_path="retry-indexing",
        name="retry-indexing",
    )
    def retry_indexing(self, request, **kwargs):
        """Retry processing a document."""
        document = self.get_object()
        if document.status != consts.DOCUMENT_STATUS_FAILED:
            raise PermissionDenied(_("You can only retry just failed documents."))
        if not self.get_knowledge_base_service().can_add_documents():
            raise PermissionDenied(_("You cannot make changes to this knowledge base."))
        KnowledgeBaseDocumentService(document).set_processing()
        process_document.delay(str(document.uuid))
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(
        summary=_("List document chunks"),
        description=_("List all chunks for a document."),
        tags=["Knowledge Bases"],
    )
)
@setup_current_team
class KnowledgeBaseChunkViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """ViewSet for knowledge base chunks."""

    serializer_class = serializers.KnowledgeBaseChunkSerializer
    filterset_fields = ["document"]

    def get_queryset(self):
        knowledge_base_uuid = self.kwargs.get("knowledge_base_uuid")
        document_uuid = self.kwargs.get("document_uuid")
        return KnowledgeBaseChunk.objects.filter(
            document_id=document_uuid,
            document__knowledge_base_id=knowledge_base_uuid,
        )


@extend_schema_view(
    list=extend_schema(
        summary=_("List retrieval settings"),
        description=_("List all retrieval settings for a knowledge base."),
        tags=["Knowledge Bases"],
    ),
    retrieve=extend_schema(
        summary=_("Get retrieval setting"),
        description=_("Get details for a specific retrieval setting."),
        tags=["Knowledge Bases"],
    ),
    create=extend_schema(
        summary=_("Create retrieval setting"),
        description=_("Create a new retrieval setting for a knowledge base."),
        tags=["Knowledge Bases"],
    ),
    update=extend_schema(
        summary=_("Update retrieval setting"),
        description=_("Update an existing retrieval setting."),
        tags=["Knowledge Bases"],
    ),
    partial_update=extend_schema(
        summary=_("Partially update retrieval setting"),
        description=_("Partially update an existing retrieval setting."),
        tags=["Knowledge Bases"],
    ),
    destroy=extend_schema(
        summary=_("Delete retrieval setting"),
        description=_("Delete an existing retrieval setting."),
        tags=["Knowledge Bases"],
    ),
)
@setup_current_team
class RetrievalSettingViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """ViewSet for retrieval settings."""

    serializer_class = serializers.RetrievalSettingSerializer
    pagination_class = None  # Disable pagination for retrieval settings

    def get_queryset(self):
        knowledge_base_uuid = self.kwargs.get("knowledge_base_pk")
        return RetrievalSetting.objects.filter(
            knowledge_base__uuid=knowledge_base_uuid,
            knowledge_base__team=self.request.current_team,
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["team"] = self.request.current_team
        context["knowledge_base"] = KnowledgeBase.objects.get(
            team=self.request.current_team, uuid=self.kwargs["knowledge_base_pk"]
        )
        return context

    def perform_create(self, serializer):
        knowledge_base_uuid = self.kwargs.get("knowledge_base_pk")
        knowledge_base = KnowledgeBase.objects.get(
            uuid=knowledge_base_uuid, team=self.request.current_team
        )
        serializer.save(knowledge_base=knowledge_base)
