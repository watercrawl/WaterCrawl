from rest_framework import mixins
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.utils.translation import gettext_lazy as _
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.viewsets import GenericViewSet

from user import serializers
from .decorators import setup_current_team
from user.services import TeamService, UserService
from .models import TeamMember
from .permissions import IsAuthenticatedTeam


@extend_schema_view(
    post=extend_schema(
        summary='Register a new user',
        description='Register a new user',
    )
)
class RegisterView(APIView):
    permission_classes = []
    serializer_class = serializers.RegisterSerializer

    def post(self, request):
        serializer = serializers.RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            status=status.HTTP_201_CREATED,
            data=serializer.data
        )


class LogingView(APIView):
    permission_classes = []
    serializer_class = serializers.LoginSerializer

    def post(self, request):
        serializer = serializers.LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = UserService(serializer.validated_data['user']).get_jwt_token()

        return Response(
            status=status.HTTP_200_OK,
            data={
                'refresh': str(token),
                'access': str(token.access_token)
            }
        )


@extend_schema_view(
    get=extend_schema(
        summary='Get user profile',
        description='Get the current user profile',
    ),
    patch=extend_schema(
        summary='Update user profile',
        description='Update user profile',
    ),
)
class ProfileView(APIView):
    permission_classes = [
        IsAuthenticated
    ]
    serializer_class = serializers.ProfileSerializer

    def get(self, request):
        return Response(
            data=serializers.ProfileSerializer(request.user).data
        )

    def patch(self, request):
        serializer = serializers.ProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            status=status.HTTP_200_OK,
            data=serializer.data
        )


@extend_schema_view(
    create=extend_schema(
        summary='Create a new team',
        description='Create a new team',
    ),
    retrieve=extend_schema(
        summary='Get a team',
        description='Get a team',
    ),
    update=extend_schema(
        summary='Update a team',
        description='Update a team',
    ),
    list=extend_schema(
        summary='List teams',
        description='List teams',
    ),
    current=extend_schema(
        summary='Get the current team',
        description='Get the current team',
        responses={200: serializers.TeamSerializer},
    ),
    invite=extend_schema(
        summary='Invite a user to the current team',
        description='Invite a user to the current team',
        request=serializers.InviteSerializer,
        responses={204: None},
    ),
)
@setup_current_team
class TeamViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.ListModelMixin,
    GenericViewSet
):
    permission_classes = [
        IsAuthenticated,
        IsAuthenticatedTeam
    ]
    serializer_class = serializers.TeamSerializer
    pagination_class = None

    def get_queryset(self):
        return self.request.user.teams.all()

    def perform_create(self, serializer):
        service = TeamService.create_team(self.request.user, serializer.validated_data['name'])
        serializer.instance = service.team

    @action(detail=False, methods=['get'], url_path='current', url_name='current')
    def current(self, request):
        return Response(
            data=serializers.TeamSerializer(request.current_team).data
        )

    @action(detail=False, methods=['post'], url_path='current/invite', url_name='invite')
    def invite(self, request):
        serializer = serializers.InviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        TeamService(request.current_team).invite(serializer.validated_data['email'])
        return Response(status=status.HTTP_200_OK)


@setup_current_team
class APIKeyViewSet(
    mixins.DestroyModelMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    GenericViewSet
):
    permission_classes = [
        IsAuthenticated,
        IsAuthenticatedTeam
    ]
    serializer_class = serializers.APIKeySerializer

    def get_queryset(self):
        return self.request.current_team.api_keys.all()

    def perform_create(self, serializer):
        serializer.save(team=self.request.current_team)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)


@setup_current_team
class CurrentTeamMembersView(
    mixins.ListModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet
):
    permission_classes = [
        IsAuthenticated,
        IsAuthenticatedTeam
    ]
    serializer_class = serializers.TeamMemberSerializer

    def get_queryset(self):
        return self.request.current_team.team_members.all()

    def perform_destroy(self, instance: TeamMember):
        print(instance, instance.is_owner, type(instance))
        if instance.is_owner:
            raise PermissionDenied(_('You can not delete the owner of the team'))
        instance.delete()
