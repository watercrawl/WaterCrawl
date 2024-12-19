from drf_spectacular.utils import extend_schema_view, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from common import serializers
from common.services import FrontendSettingService


@extend_schema_view(
    get=extend_schema(
        summary="Frontend Setting",
        description="Retrieve the frontend setting.",
        responses={200: serializers.SettingSerializer},
    )
)
class SettingAPIView(APIView):
    permission_classes = []
    authentication_classes = []
    serializer_class = serializers.SettingSerializer

    def get(self, request):
        return Response(
            data=serializers.SettingSerializer(FrontendSettingService()).data
        )
