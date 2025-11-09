import re
from datetime import timedelta
from urllib.parse import urljoin
from django.utils.translation import gettext_lazy as _

import requests
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.transaction import atomic
from django.utils import timezone
from django.utils.crypto import get_random_string
from rest_framework_simplejwt.tokens import RefreshToken

from common.services import EmailService
from locker import redis_lock
from user.models import User, Team, TeamAPIKey, TeamInvitation
from user.utils import generate_random_api_key


class UserService:
    def __init__(self, user: User):
        self.user = user

    @classmethod
    def make_with_pk(cls, user_pk: str):
        return cls(User.objects.get(pk=user_pk))

    @classmethod
    def create_user(cls, email, password, **kwargs) -> "UserService":
        return cls(User.objects.create_user(email, password, **kwargs))

    def get_jwt_token(self):
        return RefreshToken.for_user(self.user)

    @classmethod
    def install(cls, email, password):
        user_service = cls.create_user(
            email,
            password,
            is_staff=True,
            is_superuser=True,
            is_active=True,
            email_verified=True,
        )
        TeamService.create_or_get_default_team(user_service.user)
        return user_service

    def activate_invitation(self, invitation_code):
        pass


class ForgotPasswordService:
    def __init__(self, user: User):
        self.user = user

    @classmethod
    def make_with_email(cls, email: str):
        return cls(User.objects.get(email__iexact=email))

    @classmethod
    def make_with_reset_password_token(cls, token: str):
        return cls(
            User.objects.filter(reset_password_expires_at__gt=timezone.now()).get(
                reset_password_token=token
            )
        )

    def reset_password(self, new_password: str):
        self.user.set_password(new_password)
        self.user.reset_password_token = None
        self.user.reset_password_expires_at = None
        self.user.save(
            update_fields=[
                "password",
                "reset_password_token",
                "reset_password_expires_at",
            ]
        )
        return self

    def send_reset_password_email(self):
        (
            EmailService()
            .set_subject("Reset your password")
            .add_to(self.user.email)
            .set_template("user/reset_password.html", {"link": self.get_link()})
            .send()
        )

    def get_link(self):
        return urljoin(
            settings.FRONTEND_URL,
            f"/reset-password/{self.generate_reset_password_token()}",
        )

    def generate_reset_password_token(self):
        self.user.reset_password_token = get_random_string(length=64)
        self.user.reset_password_expires_at = timezone.now() + timedelta(hours=1)
        self.user.save(
            update_fields=["reset_password_token", "reset_password_expires_at"]
        )
        return self.user.reset_password_token


class TeamService:
    def __init__(self, team: Team):
        self.team = team

    @classmethod
    def make_with_pk(cls, team_pk: str):
        return cls(Team.objects.get(pk=team_pk))

    @classmethod
    def make_with_api_key(cls, api_key: str, update_last_used_at: bool = False):
        team_api_key = TeamAPIKey.objects.get(key=api_key)
        if update_last_used_at:
            team_api_key.last_used_at = timezone.now()
            team_api_key.save(update_fields=["last_used_at"])
        return cls(team_api_key.team)

    @staticmethod
    def default_team_name(
        email: str, first_name: str = None, last_name: str = None
    ) -> str:
        # Prefer full name if available
        if first_name or last_name:
            full_name = " ".join(filter(None, [first_name, last_name])).strip()
        else:
            # Derive from email if no name available
            local_part = email.split("@")[0]
            # Replace common special chars with spaces
            clean = re.sub(r"[._+\-]+", " ", local_part)
            # Remove multiple spaces and capitalize words
            full_name = " ".join(word.capitalize() for word in clean.split())

        # Handle completely empty fallback (shouldn’t happen)
        if not full_name:
            full_name = "My"

        # Return the formatted team name
        return f"{full_name}'s Team"

    @classmethod
    def create_team(
        cls,
        user: User,
        name: str = None,
        is_owner: bool = True,
        is_default: bool = False,
    ):
        if not name:
            name = cls.default_team_name(user.email, user.first_name, user.last_name)
        team = Team.objects.create(name=name, is_default=is_default)
        APIKeyService.create_api_key(team)
        return cls(team).add_user(user, is_owner)

    def add_user(self, user: User, is_owner: bool = False):
        self.team.team_members.create(user=user, is_owner=is_owner)
        return self

    @classmethod
    def create_or_get_default_team(cls, user: User):
        with redis_lock(f"create_or_get_default_team_{user.pk}"):
            team = user.teams.order_by("created_at").first()
            if team:
                return cls(team)
            return cls.create_team(user, is_owner=True, is_default=True)

    def invite(self, email: str):
        if self.team.members.filter(email__iexact=email).exists():
            raise ValidationError(_("User is already a member of the team"))
        invitation, _created = self.team.invitations.update_or_create(
            email=email, defaults={"activated": False}
        )
        return invitation


class APIKeyService:
    def __init__(self, api_key: TeamAPIKey):
        self.api_key = api_key

    @classmethod
    def make_with_pk(cls, api_key_pk: str):
        return cls(TeamAPIKey.objects.get(pk=api_key_pk))

    @classmethod
    def create_api_key(cls, team: Team, name: str = "Default"):
        return cls(TeamAPIKey.objects.create(team=team, name=name))

    def reset_api_key(self):
        self.api_key.key = generate_random_api_key()
        self.api_key.save(update_fields=["key"])
        return self


class TeamInvitationService:
    def __init__(self, invitation: TeamInvitation):
        self.invitation = invitation

    @classmethod
    def make_with_pk(cls, invitation_pk: str):
        return cls(TeamInvitation.objects.get(pk=invitation_pk))

    @classmethod
    def make_with_invitation_token(
        cls, invitation_token: str
    ) -> "TeamInvitationService":
        return cls(
            TeamInvitation.objects.get(
                invitation_token=invitation_token, activated=False
            )
        )

    def send_invitation_email(self):
        (
            EmailService()
            .set_subject("Join our team")
            .add_to(self.invitation.email)
            .set_template(
                "user/team_invitation.html",
                {"link": self.get_link(), "team_name": self.invitation.team.name},
            )
            .send()
        )

    @atomic
    def accept_invitation(self, user: User):
        self.invitation.activated = True
        self.invitation.invitation_token = None
        self.invitation.save(update_fields=["activated", "invitation_token"])
        TeamService(self.invitation.team).add_user(user)
        return self

    def get_link(self):
        return urljoin(
            settings.FRONTEND_URL,
            f"/accept/invitation/{self.invitation.invitation_token}",
        )

    def is_new_user(self):
        return not User.objects.filter(email__iexact=self.invitation.email).exists()

    def revoke(self):
        self.invitation.delete()
        return


class VerificationService:
    def __init__(self, user: User):
        self.user = user

    @classmethod
    def make_with_user_pk(cls, user_pk: str):
        return cls(User.objects.get(pk=user_pk))

    @classmethod
    def make_with_verification_token(cls, token: str):
        return cls(User.objects.get(email_verification_token=token))

    @classmethod
    def make_with_email(cls, email: str, raise_error: bool = True):
        try:
            return cls(User.objects.get(email__iexact=email))
        except User.DoesNotExist:
            if raise_error:
                raise ValidationError(_("User does not exist"))
            return None

    def send_verification_email(self):
        (
            EmailService()
            .set_subject("Verify your email")
            .add_to(self.user.email)
            .set_template("user/verify_email.html", {"link": self.get_link()})
            .send()
        )

    def get_link(self):
        return urljoin(
            settings.FRONTEND_URL, f"/verify-email/{self.generate_verification_token()}"
        )

    def generate_verification_token(self):
        self.user.email_verification_token = get_random_string(length=64)
        self.user.save(update_fields=["email_verification_token"])
        return self.user.email_verification_token

    def verify_email(self):
        self.user.email_verified = True
        self.user.email_verification_token = None
        self.user.save(update_fields=["email_verified", "email_verification_token"])
        return self


class AbsractOAuth2Service:
    def authenticate(self, token) -> UserService or None:
        raise NotImplementedError

    def get_or_create_user(self, email, first_name=None, last_name=None) -> UserService:
        try:
            return UserService(User.objects.get(email__iexact=email))
        except User.DoesNotExist:
            if not settings.IS_SIGNUP_ACTIVE:
                raise ValidationError(_("Signup is not active"))
            return UserService.create_user(
                email=email,
                password=None,
                first_name=first_name or "",
                last_name=last_name or "",
            )


class GoogleOAuthService(AbsractOAuth2Service):
    def authenticate(self, token):
        try:
            response = requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
            data = response.json()
            return self.get_or_create_user(
                data["email"], data.get("given_name"), data.get("family_name")
            )
        except requests.RequestException:
            return None


class GoogleSigninButtonService(AbsractOAuth2Service):
    def authenticate(self, token):
        try:
            response = requests.get(
                "https://oauth2.googleapis.com/tokeninfo", params={"id_token": token}
            )
            response.raise_for_status()
            data = response.json()
            return self.get_or_create_user(
                data["email"], data.get("given_name"), data.get("family_name")
            )
        except requests.RequestException:
            return None


class GithubOAuthService(AbsractOAuth2Service):
    def authenticate(self, token) -> UserService or None:
        try:
            response = requests.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": token,
                },
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()
            data = response.json()

            access_token = data.get("access_token")
            if not access_token:
                # This handles cases where GitHub returns an error in the JSON body
                # (e.g., for an expired code) or if the token is missing for other reasons.
                return None

            response = requests.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"token {access_token}"},
            )
            response.raise_for_status()
            data = response.json()
            email = next(email["email"] for email in data if email["primary"])
            if not email:
                return None
            return self.get_or_create_user(email)
        except requests.RequestException:
            return None


def oauth_service_factory(provider: str) -> AbsractOAuth2Service:
    if provider == "github":
        return GithubOAuthService()
    elif provider == "google":
        return GoogleOAuthService()
    elif provider == "google-signin":
        return GoogleSigninButtonService()
    else:
        raise ValueError(f"Unknown provider: {provider}")
