from drf_spectacular.utils import extend_schema_view, extend_schema
from drf_spectacular.views import SpectacularAPIView
from drf_spectacular.generators import SchemaGenerator
from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response
from rest_framework.views import APIView

from common import serializers, docs
from common.services import FrontendSettingService
from user.permissions import IsAuthenticatedTeam


@extend_schema_view(
    get=extend_schema(
        summary="Frontend Setting",
        description="Retrieve the frontend setting.",
        tags=["Common"],
        responses={200: serializers.SettingSerializer},
    ),
)
class SettingAPIView(APIView):
    permission_classes = []
    authentication_classes = []
    serializer_class = serializers.SettingSerializer

    def get(self, request):
        return Response(
            data=serializers.SettingSerializer(FrontendSettingService()).data
        )


class CustomSchemaGenerator(SchemaGenerator):

    def get_schema(self, request=None, public=False):
        schema = super().get_schema(request, public)
        
        # Add custom documentation
        schema['info']['description'] = docs.API_DESCRIPTION
        
        # Add security scheme for API Key
        schema['components']['securitySchemes'] = {
            'ApiKeyAuth': {
                'type': 'apiKey',
                'in': 'header',
                'name': 'X-API-Key',
                'description': docs.API_KEY_DESCRIPTION
            }
        }
        
        for path in schema['paths'].values():
            for operation in path.values():
                if isinstance(operation, dict):
                    operation['security'] = [{'ApiKeyAuth': []}]
        
      
        return schema

    def _get_paths_and_endpoints(self):
        """
        Generate (path, method, view) given (path, method, callback) for paths.
        """
        view_endpoints = []
        for path, path_regex, method, callback in self.endpoints:
            view = self.create_view(callback, method)
            path = self.coerce_path(path, method, view)
            # Filter and return APIs that only require API key authentication
            if IsAuthenticatedTeam in view.permission_classes and IsAuthenticated not in view.permission_classes:
                view_endpoints.append((path, path_regex, method, view))
        return view_endpoints


class TeamSchemaView(SpectacularAPIView):
    generator_class = CustomSchemaGenerator
    
    def get_customizations(self):
        return {
            'theme': {
                'colors': {
                    'primary': {
                        'main': '#1976d2'  # Blue color for the theme
                    }
                }
            }
        }
