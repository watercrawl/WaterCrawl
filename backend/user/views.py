from django.conf import settings
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
    TokenVerifyView as BaseTokenVerifyView,
)

from common.permissions import CanInstall
from user import serializers
from .decorators import setup_current_team
from user.services import (
    TeamService,
    UserService,
    oauth_service_factory,
    ForgotPasswordService,
    TeamInvitationService,
    VerificationService,
)
from .models import TeamMember, TeamInvitation, Team, TeamAPIKey
from .permissions import IsAuthenticatedTeam, CanSignup, CanLogin
from .tasks import (
    send_forget_password_email,
    send_invitation_email,
    send_verification_email,
    send_newsletter_confirmation,
    send_analytics_confirmation,
)


@extend_schema_view(
    post=extend_schema(
        summary=_("Install WaterCrawl"),
        description=_("Install WaterCrawl"),
        tags=["Auth"],
        request=serializers.InstallSerializer,
        responses={204: None},
    )
)
class InstallView(APIView):
    authentication_classes = []
    permission_classes = [CanInstall]
    serializer_class = serializers.InstallSerializer

    def post(self, request):
        serializer = serializers.InstallSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        UserService.install(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if serializer.validated_data["newsletter_confirmed"]:
            send_newsletter_confirmation.delay(serializer.validated_data["email"])
        if serializer.validated_data["analytics_confirmed"]:
            send_analytics_confirmation.delay()

        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    post=extend_schema(
        summary=_("Register a new user"),
        description=_("Register a new user"),
        tags=["Auth"],
        request=serializers.RegisterSerializer,
        responses={201: serializers.RegisterSerializer},
    )
)
class RegisterView(APIView):
    permission_classes = [CanSignup]
    serializer_class = serializers.RegisterSerializer
    authentication_classes = []

    def post(self, request):
        serializer = serializers.RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_service = UserService.create_user(**serializer.validated_data)
        if settings.IS_EMAIL_VERIFICATION_ACTIVE:
            send_verification_email.delay(user_service.user.pk)
        return Response(
            status=status.HTTP_201_CREATED,
            data=serializers.RegisterSerializer(user_service.user).data,
        )


@extend_schema_view(
    get=extend_schema(
        summary=_("Verify invitation"),
        description=_("Verify invitation"),
        tags=["Auth"],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "new_user": {"type": "boolean"},
                    "email": {"type": "string"},
                    "invitation_code": {"type": "string"},
                },
            }
        },
    ),
    post=extend_schema(
        summary=_("Register a new user"),
        description=_("Register a new user"),
        tags=["Auth"],
        request=serializers.RegisterSerializer,
        responses={201: serializers.RegisterSerializer},
    ),
)
class VerifyInvitation(APIView):
    permission_classes = []
    serializer_class = None

    def get(self, request, invitation_code):
        invitation_service = TeamInvitationService.make_with_invitation_token(
            invitation_code
        )
        return Response(
            {
                "uuid": str(invitation_service.invitation.uuid),
                "new_user": invitation_service.is_new_user(),
                "matched_email": request.user
                and request.user.is_authenticated
                and request.user.email == invitation_service.invitation.email,
                "invitation_code": invitation_code,
            }
        )

    def post(self, request, invitation_code):
        invitation_service = TeamInvitationService.make_with_invitation_token(
            invitation_code
        )
        if not invitation_service.is_new_user():
            raise ValidationError(_("You can not register you already have an account"))

        serializer = serializers.RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data["email"] != invitation_service.invitation.email:
            raise ValidationError(
                _(
                    "Emails do not match the invitation email. you have to register with the email that was invited"
                )
            )

        user_service = UserService.create_user(**serializer.validated_data)
        TeamInvitationService(invitation_service.invitation).accept_invitation(
            user_service.user
        )
        if settings.IS_EMAIL_VERIFICATION_ACTIVE:
            send_verification_email.delay(user_service.user.pk)
        return Response(
            status=status.HTTP_201_CREATED,
            data=serializers.RegisterSerializer(user_service.user).data,
        )


@extend_schema_view(
    post=extend_schema(
        summary=_("Authenticate using email and password"),
        description=_("Authenticate using email and password"),
        tags=["Auth"],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "refresh": {"type": "string"},
                    "access": {"type": "string"},
                },
            }
        },
    )
)
class LogingView(APIView):
    permission_classes = [CanLogin]
    serializer_class = serializers.LoginSerializer
    authentication_classes = []

    def post(self, request):
        serializer = serializers.LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = UserService(serializer.validated_data["user"]).get_jwt_token()

        return Response(
            status=status.HTTP_200_OK,
            data={"refresh": str(token), "access": str(token.access_token)},
        )


@extend_schema_view(
    post=extend_schema(
        summary=_("Send a verification email"),
        description=_("Send a verification email"),
        tags=["Auth"],
        request=serializers.RequestEmailVerificationSerializer,
        responses={204: None},
    )
)
class RequestEmailVerificationView(APIView):
    permission_classes = []
    authentication_classes = []
    serializer_class = serializers.RequestEmailVerificationSerializer

    def post(self, request):
        serializer = serializers.RequestEmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        verification_service = VerificationService.make_with_email(
            serializer.validated_data["email"], raise_error=False
        )

        if verification_service:
            send_verification_email.delay(verification_service.user.pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    post=extend_schema(
        summary=_("Authenticate using OAuth"),
        description=_("Authenticate using OAuth"),
        tags=["Auth"],
        responses={
            200: {
                "type": "object",
                "properties": {
                    "refresh": {"type": "string"},
                    "access": {"type": "string"},
                },
            }
        },
    )
)
class OauthAPIView(APIView):
    serializer_class = serializers.OauthSerializer
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        serializer = serializers.OauthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = oauth_service_factory(serializer.validated_data["provider"])
        user_service = service.authenticate(token=serializer.validated_data["token"])
        if not user_service:
            raise ValidationError({"token": _("Invalid token")})

        VerificationService(user_service.user).verify_email()
        token = user_service.get_jwt_token()

        return Response(
            status=status.HTTP_200_OK,
            data={"refresh": str(token), "access": str(token.access_token)},
        )


@extend_schema_view(
    post=extend_schema(
        summary=_("Send a forgot password email"),
        description=_("Send a forgot password email"),
        tags=["Auth"],
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
        send_forget_password_email.delay(serializer.validated_data["email"])
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    get=extend_schema(
        summary=_("Verify reset password token"),
        description=_("Verify reset password token"),
        tags=["Auth"],
        request=None,
        responses={204: None},
    ),
    post=extend_schema(
        summary=_("Reset password"),
        description=_("Reset password"),
        tags=["Auth"],
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

        service.reset_password(serializer.validated_data["password"])
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    get=extend_schema(
        summary=_("Verify email"),
        description=_("Verify email"),
        tags=["Auth"],
        request=None,
        responses={
            200: {
                "type": "object",
                "properties": {
                    "refresh": {"type": "string"},
                    "access": {"type": "string"},
                },
            }
        },
    ),
)
class VerifyEmailView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request, token):
        # the following line will raise an exception if the token is invalid or expired
        verification_service = VerificationService.make_with_verification_token(
            token
        ).verify_email()
        user_service = UserService(verification_service.user)
        token = user_service.get_jwt_token()
        return Response(
            status=status.HTTP_200_OK,
            data={"refresh": str(token), "access": str(token.access_token)},
        )


@extend_schema_view(
    get=extend_schema(
        summary=_("Get user profile"),
        description=_("Get the current user profile"),
        tags=["Profile"],
    ),
    patch=extend_schema(
        summary=_("Update user profile"),
        description=_("Update user profile"),
        tags=["Profile"],
    ),
)
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.ProfileSerializer

    def get(self, request):
        return Response(data=serializers.ProfileSerializer(request.user).data)

    def patch(self, request):
        serializer = serializers.ProfileSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_200_OK, data=serializer.data)


@extend_schema_view(
    list=extend_schema(
        summary=_("Get my invitations"),
        description=_("Get my invitations"),
        tags=["Profile"],
    ),
    accept=extend_schema(
        summary=_("Accept an invitation"),
        description=_("Accept an invitation"),
        tags=["Profile"],
        responses={204: None},
        request=None,
    ),
)
class MyInvitationsView(mixins.ListModelMixin, GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = serializers.MyTeamInvitationSerializer
    pagination_class = None
    queryset = TeamInvitation.objects.none()

    def get_queryset(self):
        return TeamInvitation.objects.filter(
            email=self.request.user.email, activated=False
        )

    @action(detail=True, methods=["post"], url_path="accept", url_name="accept")
    def accept(self, request, *args, **kwargs):
        invitation = self.get_object()
        TeamInvitationService(invitation).accept_invitation(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    create=extend_schema(
        summary=_("Create a new team"),
        description=_("Create a new team"),
        tags=["Team"],
    ),
    retrieve=extend_schema(
        summary=_("Get a team"),
        description=_("Get a team"),
        tags=["Team"],
    ),
    update=extend_schema(
        summary=_("Update a team"),
        description=_("Update a team"),
        tags=["Team"],
    ),
    list=extend_schema(
        summary=_("List teams"),
        description=_("List teams"),
        tags=["Team"],
    ),
    current=extend_schema(
        summary=_("Get/Update the current team"),
        description=_("Get the current team"),
        responses={200: serializers.TeamSerializer},
        tags=["Team"],
    ),
    invite=extend_schema(
        summary=_("Invite a user to the current team"),
        description=_("Invite a user to the current team"),
        request=serializers.TeamInvitationSerializer,
        responses={204: None},
        tags=["Team"],
    ),
    invitations=extend_schema(
        summary=_("List invitations to the current team"),
        description=_("List invitations to the current team"),
        responses={200: serializers.TeamInvitationSerializer(many=True)},
        tags=["Team"],
    ),
    revoke_invitation=extend_schema(
        summary=_("Revoke an invitation"),
        description=_("Revoke an invitation"),
        responses={204: None},
        tags=["Team"],
    ),
    invitation_url=extend_schema(
        summary=_("Get the invitation URL"),
        description=_("Get the invitation URL for the selected invitation"),
        responses={200: serializers.TeamInvitationSerializer},
        tags=["Team"],
    ),
    resend_invitation_email=extend_schema(
        summary=_("Resend the invitation email"),
        description=_("Resend the invitation email to the invited user"),
        responses={204: None},
        tags=["Team"],
    ),
)
@setup_current_team
class TeamViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    GenericViewSet,
):
    permission_classes = [IsAuthenticated, IsAuthenticatedTeam]
    serializer_class = serializers.TeamSerializer
    pagination_class = None
    queryset = Team.objects.none()

    def get_queryset(self):
        return self.request.user.teams.all()

    def perform_create(self, serializer):
        service = TeamService.create_team(
            self.request.user, serializer.validated_data["name"]
        )
        serializer.instance = service.team

    @action(
        detail=False, methods=["get", "patch"], url_path="current", url_name="current"
    )
    def current(self, request):
        if request.method == "GET":
            return Response(data=serializers.TeamSerializer(request.current_team).data)

        serializer = serializers.TeamSerializer(
            request.current_team, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(data=serializer.data)

    @action(
        detail=False, methods=["post"], url_path="current/invite", url_name="invite"
    )
    def invite(self, request):
        serializer = serializers.TeamInvitationSerializer(
            data=request.data,
            context={"team": request.current_team},
        )
        serializer.is_valid(raise_exception=True)

        invitation = TeamService(request.current_team).invite(
            serializer.validated_data["email"]
        )

        send_invitation_email.delay(str(invitation.pk))
        return Response(status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["get"],
        url_path="current/invitations",
        url_name="invitations",
    )
    def invitations(self, request):
        return Response(
            data=serializers.TeamInvitationSerializer(
                request.current_team.invitations.filter(activated=False).all(),
                many=True,
            ).data
        )

    @action(
        detail=False,
        methods=["delete"],
        url_path="current/invitations/(?P<uuid>[^/.]+)",
        url_name="revoke-invitation",
    )
    def revoke_invitation(self, request, uuid):
        invitation = TeamInvitation.objects.filter(activated=False).get(pk=uuid)
        TeamInvitationService(invitation).revoke()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=False,
        methods=["get"],
        url_path="current/invitations/(?P<uuid>[^/.]+)/url",
        url_name="invitation-url",
    )
    def invitation_url(self, request, uuid):
        invitation = TeamInvitation.objects.filter(activated=False).get(pk=uuid)
        return Response(
            data={
                "url": TeamInvitationService(invitation).get_link(),
                "code": invitation.invitation_token,
            }
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="current/invitations/(?P<uuid>[^/.]+)/resend",
        url_name="resend-invitation-email",
    )
    def resend_invitation_email(self, request, uuid):
        invitation = TeamInvitation.objects.filter(activated=False).get(pk=uuid)
        send_invitation_email.delay(str(invitation.pk))
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    create=extend_schema(
        summary=_("Create a new API key"),
        description=_("Create a new API key"),
        tags=["API Key"],
    ),
    list=extend_schema(
        summary=_("List API keys"),
        description=_("List API keys"),
        tags=["API Key"],
    ),
    destroy=extend_schema(
        summary=_("Delete an API key"),
        description=_("Delete an API key"),
        tags=["API Key"],
    ),
)
@setup_current_team
class APIKeyViewSet(
    mixins.DestroyModelMixin,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    GenericViewSet,
):
    permission_classes = [IsAuthenticated, IsAuthenticatedTeam]
    serializer_class = serializers.APIKeySerializer
    queryset = TeamAPIKey.objects.none()

    def get_queryset(self):
        return self.request.current_team.api_keys.all()

    def perform_create(self, serializer):
        serializer.save(team=self.request.current_team)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)


@extend_schema_view(
    list=extend_schema(
        summary=_("List team members"),
        description=_("List team members"),
        tags=["Team"],
    ),
    destroy=extend_schema(
        summary=_("Delete a team member"),
        description=_("Delete a team member"),
        tags=["Team"],
    ),
)
@setup_current_team
class CurrentTeamMembersView(
    mixins.ListModelMixin, mixins.DestroyModelMixin, GenericViewSet
):
    permission_classes = [IsAuthenticated, IsAuthenticatedTeam]
    serializer_class = serializers.TeamMemberSerializer
    queryset = TeamMember.objects.none()

    def get_queryset(self):
        return self.request.current_team.team_members.all()

    def perform_destroy(self, instance: TeamMember):
        if instance.is_owner:
            raise PermissionDenied(_("You can not delete the owner of the team"))
        instance.delete()


@extend_schema_view(
    post=extend_schema(
        summary=_("Refresh token"),
        description=_("Refresh token"),
        tags=["Token"],
    )
)
class TokenRefreshView(BaseTokenRefreshView):
    pass


@extend_schema_view(
    post=extend_schema(
        summary=_("Verify token"),
        description=_("Verify token"),
        tags=["Token"],
    )
)
class TokenVerifyView(BaseTokenVerifyView):
    pass
