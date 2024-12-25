from datetime import timedelta

from django.http import HttpResponse, StreamingHttpResponse
from django.utils.translation import gettext_lazy as _
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiParameter, OpenApiResponse
from rest_framework import mixins
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet, ReadOnlyModelViewSet

from common.services import EventStreamResponse
from core import serializers, consts
from core.models import CrawlRequest, CrawlResult
from core.services import CrawlerService, ReportService, PluginService
from core.tasks import run_spider
from user.decorators import setup_current_team
from user.permissions import IsAuthenticatedTeam


@extend_schema_view(
    create=extend_schema(
        summary='Start a new crawl request',
        description='Start a new crawl request'
    ),
    list=extend_schema(
        summary='List crawl requests',
        description='List crawl requests'
    ),
    retrieve=extend_schema(
        summary='Get crawl request',
        description='Get crawl request'
    ),
    destroy=extend_schema(
        summary='Cancel a running crawl',
        description='Cancel a running crawl'
    ),
    download=extend_schema(
        summary='Download a crawl result',
        description='Download a crawl result',
        responses={200: OpenApiTypes.OBJECT}
    ),
    check_status=extend_schema(
        summary='Check crawl status',
        description='This endpoint uses server-sent events and send the result every 1 second'
                    'each message contains type and data. the type can be result or state.'
                    'data contains the will be a crawl result or a crawl request.',
        request=None,
        responses={
            200: OpenApiResponse(
                response=OpenApiTypes.STR,
            )
        }
    )
)
@setup_current_team
class CrawlRequestView(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet
):
    permission_classes = [
        IsAuthenticatedTeam
    ]
    serializer_class = serializers.CrawlRequestSerializer

    def get_queryset(self):
        return self.request.current_team.crawl_requests.order_by('-created_at').all()

    def perform_create(self, serializer):
        instance = serializer.save(team=self.request.current_team)
        run_spider.apply_async(
            kwargs={
                'crawl_request_pk': instance.pk
            },
            task_id=str(instance.uuid)
        )

    def perform_destroy(self, instance: CrawlRequest):
        if instance.status != consts.CRAWL_STATUS_RUNNING:
            raise PermissionDenied(
                _('Only running crawl requests can be deleted')
            )
        CrawlerService(instance).stop()

    @action(detail=True, methods=['get'], url_path='download', url_name='download')
    def download(self, request, **kwargs):
        obj = self.get_object()
        service = CrawlerService(obj)

        return StreamingHttpResponse(
            service.download(),
            content_type='application/json',
            headers={
                'Content-Disposition': f'attachment; filename="{obj.uuid}.json"'
            }
        )

    @action(detail=True, methods=['get'], url_path='status', url_name='status')
    def check_status(self, request, **kwargs):
        obj = self.get_object()
        service = CrawlerService(obj)
        return EventStreamResponse(
            service.check_status(),
        )


@extend_schema_view(
    list=extend_schema(
        summary='List crawl results',
        description='List crawl results',
    ),
    retrieve=extend_schema(
        summary='Get crawl result',
        description='Get crawl result'
    )
)
@setup_current_team
class CrawlResultView(ReadOnlyModelViewSet):
    permission_classes = [
        IsAuthenticatedTeam
    ]
    serializer_class = serializers.CrawlResultSerializer

    def get_queryset(self):
        crawl_request = self.request.current_team.crawl_requests.get(
            pk=self.kwargs['crawl_request_uuid']
        )  # type: CrawlRequest
        return crawl_request.results.order_by('created_at').all()


@extend_schema_view(
    get=extend_schema(
        summary='Usage Report',
        description='Get usage report for the last 30 days'
    )
)
@setup_current_team
class UsageAPIView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAuthenticatedTeam
    ]
    serializer_class = serializers.ReportSerializer

    def get(self, request):
        service = ReportService(request.current_team, timedelta(days=30), )
        return Response(serializers.ReportSerializer(service).data)


@setup_current_team
class PluginAPIView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAuthenticatedTeam
    ]

    def get(self, request):
        return Response(
            PluginService.get_plugin_form_jsonschema()
        )
