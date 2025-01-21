from django.urls.conf import path
from rest_framework.routers import DefaultRouter

from user.views import RegisterView, ProfileView, TeamViewSet, LogingView, APIKeyViewSet, CurrentTeamMembersView, \
    OauthAPIView, ForgotPasswordView, ResetPasswordView, MyInvitationsView, VerifyEmailView, TokenRefreshView, \
    TokenVerifyView

router = DefaultRouter()
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'api-keys', APIKeyViewSet, basename='api-keys')
router.register(r'teams/current/members', CurrentTeamMembersView, basename='current-team-members')
router.register(r'profile/invitations', MyInvitationsView, basename='invitations')
urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LogingView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    path('auth/oauth/', OauthAPIView.as_view(), name='token_obtain_pair'),

    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),

    path('auth/reset-password/<str:token>/', ResetPasswordView.as_view(), name='reset_password'),

    path('auth/verify-email/<str:token>/', VerifyEmailView.as_view(), name='verify_email'),

    # private endpoints
    path('profile/', ProfileView.as_view(), name='profile'),

    *router.urls
]
