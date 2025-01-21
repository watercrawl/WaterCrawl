from rest_framework import mixins
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.utils.translation import gettext_lazy as _
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.viewsets import GenericViewSet
from rest_framework_simplejwt.views import (
    TokenRefreshView as BaseTokenRefreshView,
    TokenVerifyView as BaseTokenVerifyView
)

from user import serializers
from .decorators import setup_current_team
from user.services import TeamService, UserService, oauth_service_factory, ForgotPasswordService, TeamInvitationService, \
    VerificationService
from .models import TeamMember, TeamInvitation
from .permissions import IsAuthenticatedTeam, CanSignup, CanLogin
from .tasks import send_forget_password_email, send_invitation_email, send_verification_email


@extend_schema_view(
    post=extend_schema(
        summary='Register a new user',
        description='Register a new user',
        tags=['Auth'],
        request=serializers.RegisterSerializer,
        responses={201: serializers.RegisterSerializer},
    )
)
class RegisterView(APIView):
    permission_classes = [
        CanSignup
    ]
    serializer_class = serializers.RegisterSerializer
    authentication_classes = []

    def post(self, request):
        serializer = serializers.RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        send_verification_email.delay(instance.pk)
        return Response(
            status=status.HTTP_201_CREATED,
            data=serializer.data
        )


@extend_schema_view(
    post=extend_schema(
        summary='Authenticate using email and password',
        description='Authenticate using email and password',
        tags=['Auth'],
        responses={
            200: {
                "type": "object",
                "properties": {"refresh": {"type": "string"}, "access": {"type": "string"}}
            }
        },
    )
)
class LogingView(APIView):
    permission_classes = [
        CanLogin
    ]
    serializer_class = serializers.LoginSerializer
    authentication_classes = []

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
    post=extend_schema(
        summary='Authenticate using OAuth',
        description='Authenticate using OAuth',
        tags=['Auth'],
        responses={200: {
            "type": "object",
            "properties": {"refresh": {"type": "string"}, "access": {"type": "string"}}
        }},
    )
)
class OauthAPIView(APIView):
    serializer_class = serializers.OauthSerializer
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = serializers.OauthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = oauth_service_factory(serializer.validated_data['provider'])
        user_service = service.authenticate(
            token=serializer.validated_data['token']
        )
        if not user_service:
            raise ValidationError({'token': _('Invalid token')})

        VerificationService(user_service.user).verify_email()
        token = user_service.get_jwt_token()

        return Response(
            status=status.HTTP_200_OK,
            data={
                'refresh': str(token),
                'access': str(token.access_token)
            }
        )


@extend_schema_view(
    post=extend_schema(
        summary='Send a forgot password email',
        description='Send a forgot password email',
        tags=['Auth'],
        request=serializers.ForgotPasswordSerializer,
        responses={204: None},
    ),
)
class ForgotPasswordView(APIView):
    permission_classes = []
    authentication_classes = []
    serializer_class = serializers.ForgotPasswordSerializer

    def post(self, request):
        serializer = serializers.ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        send_forget_password_email.delay(serializer.validated_data['email'])
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    get=extend_schema(
        summary='Verify reset password token',
        description='Verify reset password token',
        tags=['Auth'],
        request=None,
        responses={204: None},
    ),
    post=extend_schema(
        summary='Reset password',
        description='Reset password',
        tags=['Auth'],
        request=serializers.ResetPasswordSerializer,
        responses={204: None},
    ),
)
class ResetPasswordView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request, token):
        # the following line will raise an exception if the token is invalid or expired
        ForgotPasswordService.make_with_reset_password_token(token)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def post(self, request, token):
        # the following line will raise an exception if the token is invalid or expired
        service = ForgotPasswordService.make_with_reset_password_token(token)

        serializer = serializers.ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service.reset_password(serializer.validated_data['password'])
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    get=extend_schema(
        summary='Verify email',
        description='Verify email',
        tags=['Auth'],
        request=None,
        responses={200: {
            "type": "object",
            "properties": {"refresh": {"type": "string"}, "access": {"type": "string"}}
        }},
    ),
)
class VerifyEmailView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request, token):
        # the following line will raise an exception if the token is invalid or expired
        verification_service = VerificationService.make_with_verification_token(token).verify_email()
        user_service = UserService(verification_service.user)
        token = user_service.get_jwt_token()
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
        tags=['Profile'],
    ),
    patch=extend_schema(
        summary='Update user profile',
        description='Update user profile',
        tags=['Profile'],
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
    list=extend_schema(
        summary='Get my invitations',
        description='Get my invitations',
        tags=['Profile'],
    ),
    accept=extend_schema(
        summary='Accept an invitation',
        description='Accept an invitation',
        tags=['Profile'],
        responses={204: None},
    ),
)
class MyInvitationsView(
    mixins.ListModelMixin,
    GenericViewSet
):
    permission_classes = [
        IsAuthenticated
    ]
    serializer_class = serializers.MyTeamInvitationSerializer
    pagination_class = None

    def get_queryset(self):
        return TeamInvitation.objects.filter(
            email=self.request.user.email,
            activated=False
        )

    @action(detail=True, methods=['post'], url_path='accept', url_name='accept')
    def accept(self, request, *args, **kwargs):
        invitation = self.get_object()
        TeamInvitationService(invitation).accept_invitation(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    create=extend_schema(
        summary='Create a new team',
        description='Create a new team',
        tags=['Team'],
    ),
    retrieve=extend_schema(
        summary='Get a team',
        description='Get a team',
        tags=['Team'],
    ),
    update=extend_schema(
        summary='Update a team',
        description='Update a team',
        tags=['Team'],
    ),
    list=extend_schema(
        summary='List teams',
        description='List teams',
        tags=['Team'],
    ),
    current=extend_schema(
        summary='Get/Update the current team',
        description='Get the current team',
        responses={200: serializers.TeamSerializer},
        tags=['Team'],
    ),
    invite=extend_schema(
        summary='Invite a user to the current team',
        description='Invite a user to the current team',
        request=serializers.TeamInvitationSerializer,
        responses={204: None},
        tags=['Team'],
    ),
    invitations=extend_schema(
        summary='List invitations to the current team',
        description='List invitations to the current team',
        responses={200: serializers.TeamInvitationSerializer(many=True)},
        tags=['Team'],
    ),
)
@setup_current_team
class TeamViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
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

    @action(detail=False, methods=['get', 'patch'], url_path='current', url_name='current')
    def current(self, request):
        if request.method == 'GET':
            return Response(
                data=serializers.TeamSerializer(request.current_team).data
            )

        serializer = serializers.TeamSerializer(request.current_team, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            data=serializer.data
        )

    @action(detail=False, methods=['post'], url_path='current/invite', url_name='invite')
    def invite(self, request):
        serializer = serializers.TeamInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invitation = TeamService(request.current_team).invite(serializer.validated_data['email'])

        send_invitation_email.delay(str(invitation.pk))
        return Response(status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='current/invitations', url_name='invitations')
    def invitations(self, request):
        return Response(
            data=serializers.TeamInvitationSerializer(
                request.current_team.invitations.filter(
                    activated=False
                ).all(),
                many=True
            ).data
        )


@extend_schema_view(
    create=extend_schema(
        summary='Create a new API key',
        description='Create a new API key',
        tags=['API Key'],
    ),
    list=extend_schema(
        summary='List API keys',
        description='List API keys',
        tags=['API Key'],
    ),
    destroy=extend_schema(
        summary='Delete an API key',
        description='Delete an API key',
        tags=['API Key'],
    ),
)
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


@extend_schema_view(
    list=extend_schema(
        summary='List team members',
        description='List team members',
        tags=['Team'],
    ),
    destroy=extend_schema(
        summary='Delete a team member',
        description='Delete a team member',
        tags=['Team'],
    ),
)
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
        if instance.is_owner:
            raise PermissionDenied(_('You can not delete the owner of the team'))
        instance.delete()


@extend_schema_view(
    post=extend_schema(
        summary='Refresh token',
        description='Refresh token',
        tags=['Token'],
    )
)
class TokenRefreshView(BaseTokenRefreshView):
    pass

@extend_schema_view(
    post=extend_schema(
        summary='Verify token',
        description='Verify token',
        tags=['Token'],
    )
)
class TokenVerifyView(BaseTokenVerifyView):
    pass
