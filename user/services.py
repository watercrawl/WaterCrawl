from datetime import timedelta
from urllib.parse import urljoin

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
    def create_user(cls, email, password, **kwargs):
        return cls(User.objects.create_user(email, password, **kwargs))

    def get_jwt_token(self):
        return RefreshToken.for_user(self.user)


class ForgotPasswordService:
    def __init__(self, user: User):
        self.user = user

    @classmethod
    def make_with_email(cls, email: str):
        return cls(User.objects.get(email__iexact=email))

    @classmethod
    def make_with_reset_password_token(cls, token: str):
        return cls(
            User.objects.filter(
                reset_password_expires_at__gt=timezone.now()
            ).get(reset_password_token=token)
        )

    def reset_password(self, new_password: str):
        self.user.set_password(new_password)
        self.user.reset_password_token = None
        self.user.reset_password_expires_at = None
        self.user.save(update_fields=['password', 'reset_password_token', 'reset_password_expires_at'])
        return self

    def send_reset_password_email(self):
        (
            EmailService()
            .set_subject('Reset your password')
            .add_to(self.user.email)
            .set_template('user/reset_password.html', {'link': self.get_link()})
            .send()
        )

    def get_link(self):
        return urljoin(settings.FRONTEND_URL, f'/reset-password/{self.generate_reset_password_token()}')

    def generate_reset_password_token(self):
        self.user.reset_password_token = get_random_string(length=64)
        self.user.reset_password_expires_at = timezone.now() + timedelta(hours=1)
        self.user.save(update_fields=['reset_password_token', 'reset_password_expires_at'])
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
            team_api_key.save(update_fields=['last_used_at'])
        return cls(team_api_key.team)

    @classmethod
    def create_team(cls, user: User, name: str = 'Default', is_owner: bool = True, is_default: bool = False):
        team = Team.objects.create(name=name, is_default=is_default)
        APIKeyService.create_api_key(team)
        return cls(team).add_user(user, is_owner)

    def add_user(self, user: User, is_owner: bool = False):
        self.team.team_members.create(user=user, is_owner=is_owner)
        return self

    @classmethod
    def create_or_get_default_team(cls, user: User):
        with redis_lock(f'create_or_get_default_team_{user.pk}'):
            team = user.teams.order_by('created_at').first()
            if team:
                return cls(team)
            return cls.create_team(user, is_owner=True, is_default=True)

    def invite(self, email: str):
        if self.team.members.filter(email__iexact=email).exists():
            raise ValidationError('User is already a member of the team')
        invitation, _ = self.team.invitations.update_or_create(email=email, defaults={'activated': False})
        return invitation


class APIKeyService:
    def __init__(self, api_key: TeamAPIKey):
        self.api_key = api_key

    @classmethod
    def make_with_pk(cls, api_key_pk: str):
        return cls(TeamAPIKey.objects.get(pk=api_key_pk))

    @classmethod
    def create_api_key(cls, team: Team, name: str = 'Default'):
        return cls(TeamAPIKey.objects.create(team=team, name=name))

    def reset_api_key(self):
        self.api_key.key = generate_random_api_key()
        self.api_key.save(update_fields=['key'])
        return self


class TeamInvitationService:
    def __init__(self, invitation: TeamInvitation):
        self.invitation = invitation

    @classmethod
    def make_with_pk(cls, invitation_pk: str):
        return cls(TeamInvitation.objects.get(pk=invitation_pk))

    def send_invitation_email(self):
        (
            EmailService()
            .set_subject('Join our team')
            .add_to(self.invitation.email)
            .set_template('user/team_invitation.html', {
                'link': self.get_link(),
                'team_name': self.invitation.team.name
            })
            .send()
        )

    @atomic
    def accept_invitation(self, user: User):
        self.invitation.activated = True
        self.invitation.save(update_fields=['activated'])
        TeamService(self.invitation.team).add_user(user)
        return self

    def get_link(self):
        return settings.FRONTEND_URL


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
                raise ValidationError('User does not exist')
            return None

    def send_verification_email(self):
        (
            EmailService()
            .set_subject('Verify your email')
            .add_to(self.user.email)
            .set_template('user/verify_email.html', {'link': self.get_link()})
            .send()
        )

    def get_link(self):
        return urljoin(settings.FRONTEND_URL, f'/verify-email/{self.generate_verification_token()}')

    def generate_verification_token(self):
        self.user.email_verification_token = get_random_string(length=64)
        self.user.save(update_fields=['email_verification_token'])
        return self.user.email_verification_token

    def verify_email(self):
        self.user.email_verified = True
        self.user.save(update_fields=['email_verified'])
        return self


class AbsractOAuth2Service:
    def authenticate(self, token) -> UserService or None:
        raise NotImplementedError

    def get_or_create_user(self, email, first_name=None, last_name=None) -> UserService:
        try:
            return UserService(User.objects.get(email__iexact=email))
        except User.DoesNotExist:
            return UserService.create_user(
                email=email,
                password=None,
                first_name=first_name or '',
                last_name=last_name or ''
            )


class GoogleOAuthService(AbsractOAuth2Service):
    def authenticate(self, token):
        try:
            response = requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={
                    'Authorization': f'Bearer {token}'
                }
            )
            response.raise_for_status()
            data = response.json()
            return self.get_or_create_user(data['email'], data['given_name'], data['family_name'])
        except requests.RequestException:
            return None


class GoogleSigninButtonService(AbsractOAuth2Service):
    def authenticate(self, token):
        try:
            response = requests.get(
                'https://oauth2.googleapis.com/tokeninfo',
                params={
                    'id_token': token
                }
            )
            response.raise_for_status()
            data = response.json()
            return self.get_or_create_user(data['email'], data['given_name'], data['family_name'])
        except requests.RequestException:
            return None


class GithubOAuthService(AbsractOAuth2Service):
    def authenticate(self, token) -> UserService or None:
        try:
            response = requests.post(
                'https://github.com/login/oauth/access_token',
                data={
                    'client_id': settings.GITHUB_CLIENT_ID,
                    'client_secret': settings.GITHUB_CLIENT_SECRET,
                    'code': token,
                },
                headers={
                    'Accept': 'application/json'
                }
            )
            response.raise_for_status()
            data = response.json()
            access_token = data['access_token']
            response = requests.get(
                'https://api.github.com/user/emails',
                headers={
                    'Authorization': f'token {access_token}'
                }
            )
            response.raise_for_status()
            data = response.json()
            email = next(email['email'] for email in data if email['primary'])
            if not email:
                return None
            return self.get_or_create_user(email)
        except requests.RequestException:
            return None


def oauth_service_factory(provider: str) -> AbsractOAuth2Service:
    if provider == 'github':
        return GithubOAuthService()
    elif provider == 'google':
        return GoogleOAuthService()
    elif provider == 'google-signin':
        return GoogleSigninButtonService()
    else:
        raise ValueError(f'Unknown provider: {provider}')
