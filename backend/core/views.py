from datetime import timedelta

from django.http import StreamingHttpResponse
from django.utils.translation import gettext_lazy as _
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiResponse
from rest_framework import mixins
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet, ReadOnlyModelViewSet

from common.services import EventStreamResponse
from core import serializers, consts, docs
from core.models import CrawlRequest
from core.services import (
    CrawlerService,
    ReportService,
    PluginService,
    SitemapService,
    CrawlPupSupService,
    SearchPupSupService,
)
from core.tasks import run_spider, run_search
from user.decorators import setup_current_team
from user.permissions import IsAuthenticatedTeam


@extend_schema_view(
    create=extend_schema(
        summary=_("Start a new crawl request"),
        description=docs.CRAWL_REQUEST_CREATE,
        tags=["Crawl Requests"],
    ),
    list=extend_schema(
        summary=_("List crawl requests"),
        description=docs.CRAWL_REQUEST_LIST,
        parameters=docs.CRAWL_REQUEST_LIST_PARAMETERS,
        tags=["Crawl Requests"],
    ),
    retrieve=extend_schema(
        summary=_("Get crawl request"),
        description=docs.CRAWL_REQUEST_RETRIEVE,
        tags=["Crawl Requests"],
    ),
    destroy=extend_schema(
        summary=_("Cancel a running crawl"),
        description=docs.CRAWL_REQUEST_DESTROY,
        tags=["Crawl Requests"],
    ),
    download=extend_schema(
        summary=_("Download crawl result"),
        description=docs.CRAWL_REQUEST_DOWNLOAD,
        parameters=docs.CRAWL_REQUEST_DOWNLOAD_PARAMETERS,
        tags=["Crawl Requests"],
        responses={200: OpenApiTypes.OBJECT},
    ),
    check_status=extend_schema(
        summary=_("Check crawl status"),
        description=docs.CRAWL_REQUEST_CHECK_STATUS,
        parameters=docs.CRAWL_REQUEST_CHECK_STATUS_PARAMETERS,
        tags=["Crawl Requests"],
        request=None,
        responses={
            200: OpenApiResponse(
                response=OpenApiTypes.STR,
            )
        },
    ),
    graph=extend_schema(
        summary=_("Get sitemap graph"),
        description=docs.CRAWL_REQUEST_GRAPH,
        tags=["Crawl Requests"],
        responses={200: OpenApiTypes.OBJECT},
    ),
    markdown=extend_schema(
        summary=_("Get markdown report"),
        description=docs.CRAWL_REQUEST_MARKDOWN,
        tags=["Crawl Requests"],
        responses={200: OpenApiTypes.STR},
    ),
)
@setup_current_team
class CrawlRequestView(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    permission_classes = [IsAuthenticatedTeam]
    serializer_class = serializers.CrawlRequestSerializer
    filterset_fields = ["uuid", "url", "status", "created_at"]

    def get_queryset(self):
        return self.request.current_team.crawl_requests.order_by("-created_at").all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["team"] = self.request.current_team
        return context

    def perform_create(self, serializer):
        instance = serializer.save(team=self.request.current_team)
        run_spider.apply_async(
            kwargs={"crawl_request_pk": instance.pk}, task_id=str(instance.uuid)
        )

    def perform_destroy(self, instance: CrawlRequest):
        if instance.status != consts.CRAWL_STATUS_RUNNING:
            raise PermissionDenied(_("Only running crawl requests can be deleted"))
        CrawlerService(instance).stop()

    @action(detail=True, methods=["get"], url_path="download", url_name="download")
    def download(self, request, **kwargs):
        obj = self.get_object()
        service = CrawlerService(obj)

        output_format = request.query_params.get("output_format", "json")
        if output_format not in ["markdown", "json"]:
            raise PermissionDenied(_("Invalid output format"))

        file_name = (
            obj.url.replace("https://", "").replace("http://", "").replace("/", "_")
        )
        return StreamingHttpResponse(
            service.download_zip(output_format),
            content_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="{file_name}.zip"'},
        )

    @action(detail=True, methods=["get"], url_path="status", url_name="status")
    def check_status(self, request, **kwargs):
        obj = self.get_object()
        service = CrawlPupSupService(obj)
        prefetched = request.query_params.get("prefetched", "False") in [
            "true",
            "True",
            "1",
        ]
        return EventStreamResponse(
            service.check_status(prefetched),
        )

    @action(
        detail=True, methods=["get"], url_path="sitemap/graph", url_name="sitemap-graph"
    )
    def graph(self, request, **kwargs):
        obj = self.get_object()  # type: CrawlRequest
        if not obj.sitemap:
            raise NotFound(_("Sitemap for this crawl request does not exist"))
        service = SitemapService(obj)
        return Response(service.to_graph())

    @action(
        detail=True,
        methods=["get"],
        url_path="sitemap/markdown",
        url_name="sitemap-markdown",
    )
    def markdown(self, request, **kwargs):
        obj = self.get_object()  # type: CrawlRequest
        if not obj.sitemap:
            raise NotFound(_("Sitemap for this crawl request does not exist"))
        service = SitemapService(obj)
        return Response(
            service.to_markdown(),
            headers={
                "Content-Type": "text/markdown",
                "Content-Disposition": f'attachment; filename="sitemap-{obj.uuid}.md"',
            },
        )


@extend_schema_view(
    list=extend_schema(
        summary=_("List crawl results"),
        description=docs.CRAWL_RESULT_LIST,
        parameters=docs.CRAWL_RESULTS_PARAMETERS,
        tags=["Crawl Results"],
    ),
    retrieve=extend_schema(
        summary=_("Get crawl result"),
        description=docs.CRAWL_RESULT_RETRIEVE,
        tags=["Crawl Results"],
    ),
)
@setup_current_team
class CrawlResultView(ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticatedTeam]
    serializer_class = serializers.CrawlResultSerializer
    filterset_fields = ["url", "created_at"]

    def get_queryset(self):
        crawl_request = self.request.current_team.crawl_requests.get(
            pk=self.kwargs["crawl_request_uuid"]
        )  # type: CrawlRequest
        return (
            crawl_request.results.prefetch_related("attachments")
            .order_by("created_at")
            .all()
        )

    def get_serializer_class(self):
        if self.request.query_params.get("prefetched", "False") in [
            "true",
            "True",
            "1",
        ]:
            return serializers.FullCrawlResultSerializer

        return super().get_serializer_class()


@extend_schema_view(
    get=extend_schema(
        summary=_("Usage Report"), description=docs.USAGE_REPORT, tags=["Reports"]
    )
)
@setup_current_team
class UsageAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAuthenticatedTeam]
    serializer_class = serializers.ReportSerializer

    def get(self, request):
        service = ReportService(
            request.current_team,
            timedelta(days=30),
        )
        return Response(serializers.ReportSerializer(service).data)


@extend_schema_view(
    get=extend_schema(
        summary=_("Plugin Form"), description=docs.PLUGIN_LIST, tags=["Plugins"]
    )
)
@setup_current_team
class PluginAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAuthenticatedTeam]

    def get(self, request):
        return Response(PluginService.get_plugin_form_jsonschema())


@extend_schema_view(
    list=extend_schema(
        summary=_("List search requests"),
        description=docs.SEARCH_REQUEST_LIST,
        tags=["Search Requests"],
    ),
    retrieve=extend_schema(
        summary=_("Get search request"),
        parameters=docs.CRAWL_REQUEST_CHECK_STATUS_PARAMETERS,
        description=docs.SEARCH_REQUEST_RETRIEVE,
        tags=["Search Requests"],
    ),
    create=extend_schema(
        summary=_("Create search request"),
        description=docs.SEARCH_REQUEST_CREATE,
        tags=["Search Requests"],
    ),
    destroy=extend_schema(
        summary=_("Delete search request"),
        description=docs.SEARCH_REQUEST_DELETE,
        tags=["Search Requests"],
    ),
    check_status=extend_schema(
        summary=_("Check search request status"),
        parameters=docs.CRAWL_REQUEST_CHECK_STATUS_PARAMETERS,
        description=docs.SEARCH_REQUEST_CHECK_STATUS,
        tags=["Search Requests"],
    ),
)
@setup_current_team
class SearchRequestAPIView(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    permission_classes = [IsAuthenticatedTeam]
    serializer_class = serializers.SearchRequestSerializer

    def get_serializer_class(self):
        if self.request.query_params.get("prefetched", "False") in [
            "true",
            "True",
            "1",
        ]:
            return serializers.FullSearchResultSerializer

        return super().get_serializer_class()

    def get_queryset(self):
        return self.request.current_team.search_requests.order_by("-created_at").all()

    def perform_create(self, serializer):
        instance = serializer.save(team=self.request.current_team)
        run_search.apply_async(args=[instance.pk], task_id=str(instance.uuid))

    def perform_destroy(self, instance: CrawlRequest):
        if instance.status != consts.CRAWL_STATUS_RUNNING:
            raise PermissionDenied(_("Only running crawl requests can be deleted"))
        CrawlerService(instance).stop()

    @action(
        detail=True,
        methods=["get"],
        url_path="status",
        url_name="status",
    )
    def check_status(self, request, **kwargs):
        obj = self.get_object()  # type: SearchRequest
        service = SearchPupSupService(obj)
        prefetched = request.query_params.get("prefetched", "False") in [
            "true",
            "True",
            "1",
        ]
        return EventStreamResponse(
            service.check_status(prefetched=prefetched),
        )
