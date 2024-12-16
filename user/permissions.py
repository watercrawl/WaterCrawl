from rest_framework import permissions


class IsAuthenticatedTeam(permissions.BasePermission):
    def has_permission(self, request, view):
        return hasattr(request, 'current_team') and request.current_team

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)
