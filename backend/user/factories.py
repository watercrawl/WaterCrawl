"""Factory Boy factories for the user app."""

import factory
from factory.django import DjangoModelFactory

from user.models import Team, TeamAPIKey, TeamInvitation, TeamMember, User


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ("email",)

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    first_name = "Test"
    last_name = "User"
    email_verified = True
    is_active = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop("password", "Pa$$word123")
        user = model_class.objects.create_user(*args, password=password, **kwargs)
        return user


class TeamFactory(DjangoModelFactory):
    class Meta:
        model = Team

    name = factory.Sequence(lambda n: f"Team {n}")
    is_default = False


class TeamMemberFactory(DjangoModelFactory):
    class Meta:
        model = TeamMember

    user = factory.SubFactory(UserFactory)
    team = factory.SubFactory(TeamFactory)
    is_owner = False


class TeamInvitationFactory(DjangoModelFactory):
    class Meta:
        model = TeamInvitation

    team = factory.SubFactory(TeamFactory)
    email = factory.Sequence(lambda n: f"invitee{n}@example.com")
    activated = False


class TeamAPIKeyFactory(DjangoModelFactory):
    class Meta:
        model = TeamAPIKey

    team = factory.SubFactory(TeamFactory)
    name = "Test API Key"
