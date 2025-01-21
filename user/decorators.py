from django.utils.decorators import method_decorator
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import AuthenticationFailed

from user.models import Team
from user.services import TeamService


class CurrentTeamAuthentication:
    def authenticate(self, request):
        # This is required for DRF's BaseAuthentication interface
        # Return None to proceed with other authenticators
        if not request.path.startswith('/api/'):
            return

        # Initialize the current team to None
        request.current_team = None

        # Check for authenticated user
        if request.user and request.user.is_authenticated:
            return self.authenticate_with_team_id(request)

        # Fallback to API key
        return self.authenticate_with_api_key(request)

    def authenticate_with_team_id(self, request):
        team_pk = request.headers.get('X-Team-ID')
        if team_pk:
            try:
                request.current_team = request.user.teams.get(pk=team_pk)
            except Team.DoesNotExist:
                pass
                # raise AuthenticationFailed(_('Invalid team ID'))

        if not request.current_team:
            # Automatically create or retrieve the default team
            request.current_team = TeamService.create_or_get_default_team(request.user).team

    def authenticate_with_api_key(self, request):
        api_key = request.headers.get('X-API-Key')
        if api_key:
            try:
                request.current_team = TeamService.make_with_api_key(api_key, update_last_used_at=True).team
            except Team.DoesNotExist:
                raise AuthenticationFailed(_('Invalid API key'))


def __setup_current_team(function):
    def wrapper(request):
        CurrentTeamAuthentication().authenticate(request)
        return function(request)

    return wrapper


setup_current_team = method_decorator(__setup_current_team, name='perform_authentication')

__all__ = ['setup_current_team']
