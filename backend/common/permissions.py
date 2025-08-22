from django.conf import settings
from rest_framework import permissions

from common.services import FrontendSettingService


class IsEnterpriseMode:
    def has_permission(self, request, view):
        return settings.IS_ENTERPRISE_MODE_ACTIVE


class CanInstall(permissions.BasePermission):
    def has_permission(self, request, view):
        return not FrontendSettingService().is_installed
