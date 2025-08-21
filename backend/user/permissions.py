from django.conf import settings
from rest_framework import permissions


class IsAuthenticatedTeam(permissions.BasePermission):
    def has_permission(self, request, view):
        return hasattr(request, "current_team") and request.current_team

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser


class CanLogin(permissions.BasePermission):
    def has_permission(self, request, view):
        return settings.IS_LOGIN_ACTIVE


class CanSignup(permissions.BasePermission):
    def has_permission(self, request, view):
        return settings.IS_SIGNUP_ACTIVE
