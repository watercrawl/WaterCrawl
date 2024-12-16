from rest_framework_simplejwt.tokens import RefreshToken

from user.models import User, Team, TeamAPIKey
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


class TeamService:
    def __init__(self, team: Team):
        self.team = team

    @classmethod
    def make_with_pk(cls, team_pk: str):
        return cls(Team.objects.get(pk=team_pk))

    @classmethod
    def make_with_api_key(cls, api_key: str):
        return cls(Team.objects.get(api_keys__key=api_key))

    @classmethod
    def create_team(cls, user: User, name: str = 'Default', is_owner: bool = True):
        team = Team.objects.create(name=name)
        APIKeyService.create_api_key(team)
        return cls(team).add_user(user, is_owner)

    def add_user(self, user: User, is_owner: bool = False):
        self.team.team_members.create(user=user, is_owner=is_owner)
        return self

    @classmethod
    def create_or_get_default_team(cls, user: User):
        team = user.teams.order_by('created_at').first()
        if team:
            return cls(team)
        return cls.create_team(user, is_owner=True)

    def invite(self, email: str):
        invitation, _ = self.team.invitations.get_or_create(email=email)
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
