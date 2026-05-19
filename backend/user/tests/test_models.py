"""Tests for user app models."""

import pytest
from django.db import IntegrityError

from user.factories import (
    TeamFactory,
    TeamInvitationFactory,
    TeamMemberFactory,
    UserFactory,
)


class TestUser:
    def test_email_is_username_field(self):
        # Django's BaseUserManager.normalize_email lowercases the domain part.
        user = UserFactory(email="UPPER@Example.com")
        assert user.email == "UPPER@example.com"
        assert user.get_username() == "UPPER@example.com"

    def test_uuid_is_assigned(self):
        user = UserFactory()
        assert user.pk is not None
        assert str(user.uuid) == str(user.pk)

    def test_email_unique_constraint_case_insensitive(self):
        UserFactory(email="dup@example.com")
        with pytest.raises(IntegrityError):
            UserFactory(email="DUP@example.com")

    def test_str_returns_email(self):
        user = UserFactory(email="foo@example.com")
        assert str(user) == "foo@example.com"


class TestTeam:
    def test_owner_returns_owner_member(self):
        team = TeamFactory()
        owner = UserFactory()
        regular = UserFactory()
        TeamMemberFactory(team=team, user=regular, is_owner=False)
        TeamMemberFactory(team=team, user=owner, is_owner=True)
        assert team.owner == owner

    @pytest.mark.xfail(
        reason=(
            "Known bug: Team.owner property's fallback uses members.order_by('id') "
            "but the custom User model has no 'id' field (uuid is the PK). Raises "
            "FieldError. Tracked as a regression marker."
        ),
        raises=Exception,
        strict=True,
    )
    def test_owner_falls_back_to_first_member_when_no_owner_flag(self):
        team = TeamFactory()
        first = UserFactory()
        second = UserFactory()
        TeamMemberFactory(team=team, user=first, is_owner=False)
        TeamMemberFactory(team=team, user=second, is_owner=False)
        assert team.owner == first

    @pytest.mark.xfail(
        reason="Same Team.owner FieldError on empty-members fallback.",
        raises=Exception,
        strict=True,
    )
    def test_owner_none_when_no_members(self):
        team = TeamFactory()
        assert team.owner is None


class TestTeamInvitation:
    def test_invitation_token_auto_generated(self):
        invitation = TeamInvitationFactory()
        assert invitation.invitation_token
        assert len(invitation.invitation_token) == 64

    def test_unique_together_team_email(self):
        invitation = TeamInvitationFactory(email="dup@example.com")
        with pytest.raises(IntegrityError):
            TeamInvitationFactory(team=invitation.team, email="dup@example.com")
