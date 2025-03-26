from django.conf import settings


class IsEnterpriseMode:
    def has_permission(self, request, view):
        return settings.IS_ENTERPRISE_MODE_ACTIVE
