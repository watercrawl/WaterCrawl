"""Tests for user app services."""

import pytest
import responses
from django.core import mail
from django.core.exceptions import ValidationError
from django.utils import timezone
from freezegun import freeze_time

from user.factories import (
    TeamFactory,
    TeamInvitationFactory,
    UserFactory,
)
from user.models import TeamAPIKey, TeamMember, User
from user.services import (
    APIKeyService,
    ForgotPasswordService,
    GithubOAuthService,
    GoogleOAuthService,
    GoogleSigninButtonService,
    TeamInvitationService,
    TeamService,
    UserService,
    VerificationService,
    oauth_service_factory,
)


# --- UserService -------------------------------------------------------------


class TestUserService:
    def test_create_user_hashes_password(self):
        svc = UserService.create_user("new@example.com", "Sup3rSecret!")
        assert svc.user.pk is not None
        assert svc.user.password != "Sup3rSecret!"
        assert svc.user.check_password("Sup3rSecret!")

    def test_get_jwt_token_returns_refresh_with_access(self):
        svc = UserService.create_user("jwt@example.com", "Sup3rSecret!")
        refresh = svc.get_jwt_token()
        assert refresh is not None
        assert str(refresh)
        assert str(refresh.access_token)

    def test_install_creates_superuser_and_default_team(self):
        svc = UserService.install("admin@example.com", "Sup3rSecret!")
        assert svc.user.is_superuser is True
        assert svc.user.is_staff is True
        assert svc.user.email_verified is True
        # default team auto-created
        team = svc.user.teams.first()
        assert team is not None
        assert team.is_default is True

    def test_make_with_pk_raises_for_missing(self):
        with pytest.raises(User.DoesNotExist):
            UserService.make_with_pk("00000000-0000-0000-0000-000000000000")


# --- ForgotPasswordService ---------------------------------------------------


class TestForgotPasswordService:
    def test_generate_token_sets_expiry_one_hour_out(self):
        user = UserFactory()
        with freeze_time("2026-01-01 12:00:00"):
            token = ForgotPasswordService(user).generate_reset_password_token()
            user.refresh_from_db()
            assert user.reset_password_token == token
            assert len(token) == 64
            delta = (user.reset_password_expires_at - timezone.now()).total_seconds()
            assert 3590 < delta <= 3600

    def test_token_lookup_rejects_expired(self):
        user = UserFactory()
        with freeze_time("2026-01-01 12:00:00"):
            token = ForgotPasswordService(user).generate_reset_password_token()
        with freeze_time("2026-01-01 13:00:01"):
            with pytest.raises(User.DoesNotExist):
                ForgotPasswordService.make_with_reset_password_token(token)

    def test_token_lookup_accepts_before_expiry(self):
        user = UserFactory()
        with freeze_time("2026-01-01 12:00:00"):
            token = ForgotPasswordService(user).generate_reset_password_token()
        with freeze_time("2026-01-01 12:59:00"):
            svc = ForgotPasswordService.make_with_reset_password_token(token)
            assert svc.user == user

    def test_reset_password_consumes_token(self):
        user = UserFactory()
        token = ForgotPasswordService(user).generate_reset_password_token()
        ForgotPasswordService(user).reset_password("NewP4ssword!")
        user.refresh_from_db()
        assert user.check_password("NewP4ssword!") is True
        assert user.reset_password_token is None
        assert user.reset_password_expires_at is None
        # second lookup must fail
        with pytest.raises(User.DoesNotExist):
            ForgotPasswordService.make_with_reset_password_token(token)

    def test_send_reset_password_email(self, settings):
        settings.FRONTEND_URL = "https://app.example.com"
        user = UserFactory(email="reset@example.com")
        ForgotPasswordService(user).send_reset_password_email()
        assert len(mail.outbox) == 1
        assert mail.outbox[0].to == ["reset@example.com"]
        assert "reset" in mail.outbox[0].subject.lower()


# --- TeamService -------------------------------------------------------------


class TestTeamService:
    def test_create_team_adds_user_and_apikey(self):
        user = UserFactory()
        svc = TeamService.create_team(user, name="Acme", is_owner=True)
        assert svc.team.name == "Acme"
        assert TeamMember.objects.filter(
            team=svc.team, user=user, is_owner=True
        ).exists()
        assert TeamAPIKey.objects.filter(team=svc.team).exists()

    def test_create_or_get_default_team_idempotent(self):
        user = UserFactory()
        a = TeamService.create_or_get_default_team(user)
        b = TeamService.create_or_get_default_team(user)
        assert a.team == b.team

    def test_invite_creates_invitation(self):
        user = UserFactory()
        team_svc = TeamService.create_team(user)
        invitation = team_svc.invite("invitee@example.com")
        assert invitation.email == "invitee@example.com"
        assert invitation.activated is False

    def test_invite_rejects_existing_member(self):
        user = UserFactory(email="member@example.com")
        team_svc = TeamService.create_team(user)
        with pytest.raises(ValidationError):
            team_svc.invite("MEMBER@example.com")  # case-insensitive

    def test_make_with_api_key_updates_last_used_at(self):
        team = TeamFactory()
        api_key = TeamAPIKey.objects.create(team=team, name="k")
        with freeze_time("2026-02-15 10:00:00"):
            svc = TeamService.make_with_api_key(api_key.key, update_last_used_at=True)
        api_key.refresh_from_db()
        assert svc.team == team
        assert api_key.last_used_at is not None

    def test_make_with_api_key_no_update_when_flag_false(self):
        team = TeamFactory()
        api_key = TeamAPIKey.objects.create(team=team, name="k")
        TeamService.make_with_api_key(api_key.key, update_last_used_at=False)
        api_key.refresh_from_db()
        assert api_key.last_used_at is None


# --- APIKeyService -----------------------------------------------------------


class TestAPIKeyService:
    def test_create_api_key_generates_unique_keys(self):
        team = TeamFactory()
        k1 = APIKeyService.create_api_key(team).api_key
        k2 = APIKeyService.create_api_key(team).api_key
        assert k1.key != k2.key
        assert k1.key.startswith("wc-")

    def test_reset_api_key_rotates_value(self):
        team = TeamFactory()
        svc = APIKeyService.create_api_key(team)
        old = svc.api_key.key
        svc.reset_api_key()
        assert svc.api_key.key != old


# --- TeamInvitationService ---------------------------------------------------


class TestTeamInvitationService:
    def test_accept_invitation_marks_activated_and_adds_member(self):
        user = UserFactory(email="newcomer@example.com")
        invitation = TeamInvitationFactory(email="newcomer@example.com")
        TeamInvitationService(invitation).accept_invitation(user)
        invitation.refresh_from_db()
        assert invitation.activated is True
        assert invitation.invitation_token is None
        assert TeamMember.objects.filter(team=invitation.team, user=user).exists()

    def test_is_new_user_true_when_no_existing_user(self):
        invitation = TeamInvitationFactory(email="unseen@example.com")
        assert TeamInvitationService(invitation).is_new_user() is True

    def test_is_new_user_false_when_user_exists(self):
        UserFactory(email="seen@example.com")
        invitation = TeamInvitationFactory(email="SEEN@example.com")
        assert TeamInvitationService(invitation).is_new_user() is False

    def test_make_with_invitation_token_rejects_activated(self):
        invitation = TeamInvitationFactory(activated=True)
        with pytest.raises(invitation.__class__.DoesNotExist):
            TeamInvitationService.make_with_invitation_token(
                invitation.invitation_token
            )


# --- VerificationService -----------------------------------------------------


class TestVerificationService:
    def test_verify_email_marks_verified_and_clears_token(self):
        user = UserFactory(email_verified=False)
        svc = VerificationService(user)
        svc.generate_verification_token()
        svc.verify_email()
        user.refresh_from_db()
        assert user.email_verified is True
        assert user.email_verification_token is None

    def test_make_with_email_raises_for_missing(self):
        with pytest.raises(ValidationError):
            VerificationService.make_with_email("nobody@example.com")

    def test_make_with_email_returns_none_when_raise_disabled(self):
        assert (
            VerificationService.make_with_email("nobody@example.com", raise_error=False)
            is None
        )


# --- OAuth services ----------------------------------------------------------


class TestOAuthServices:
    @responses.activate
    def test_google_oauth_creates_user_on_success(self):
        responses.add(
            responses.GET,
            "https://www.googleapis.com/oauth2/v3/userinfo",
            json={
                "email": "google@example.com",
                "given_name": "G",
                "family_name": "User",
            },
            status=200,
        )
        svc = GoogleOAuthService().authenticate("fake-token")
        assert svc is not None
        assert svc.user.email == "google@example.com"
        assert svc.user.first_name == "G"

    @responses.activate
    def test_google_oauth_returns_none_on_error(self):
        responses.add(
            responses.GET,
            "https://www.googleapis.com/oauth2/v3/userinfo",
            status=500,
        )
        assert GoogleOAuthService().authenticate("fake") is None

    @responses.activate
    def test_google_signin_button_reuses_existing_user(self):
        UserFactory(email="existing@example.com")
        responses.add(
            responses.GET,
            "https://oauth2.googleapis.com/tokeninfo",
            json={"email": "EXISTING@example.com"},
            status=200,
        )
        svc = GoogleSigninButtonService().authenticate("id-token")
        assert svc is not None
        assert svc.user.email == "existing@example.com"  # case-insensitive

    @responses.activate
    def test_github_oauth_returns_none_without_access_token(self):
        responses.add(
            responses.POST,
            "https://github.com/login/oauth/access_token",
            json={"error": "bad_code"},
            status=200,
        )
        assert GithubOAuthService().authenticate("expired-code") is None

    @responses.activate
    def test_github_oauth_picks_primary_email(self):
        responses.add(
            responses.POST,
            "https://github.com/login/oauth/access_token",
            json={"access_token": "ghs_xxx"},
            status=200,
        )
        responses.add(
            responses.GET,
            "https://api.github.com/user/emails",
            json=[
                {"email": "secondary@example.com", "primary": False},
                {"email": "primary@example.com", "primary": True},
            ],
            status=200,
        )
        svc = GithubOAuthService().authenticate("code")
        assert svc is not None
        assert svc.user.email == "primary@example.com"

    def test_oauth_service_factory_github(self):
        assert isinstance(oauth_service_factory("github"), GithubOAuthService)
