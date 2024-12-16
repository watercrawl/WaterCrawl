from django.urls.conf import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView, TokenObtainPairView

from user.views import RegisterView, ProfileView, TeamViewSet, LogingView, APIKeyViewSet, CurrentTeamMembersView

router = DefaultRouter()
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'api-keys', APIKeyViewSet, basename='api-keys')
router.register(r'teams/current/members', CurrentTeamMembersView, basename='current-team-members')
urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LogingView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify', TokenVerifyView.as_view(), name='token_verify'),

    # private endpoints
    path('profile/', ProfileView.as_view(), name='profile'),

    *router.urls
]
