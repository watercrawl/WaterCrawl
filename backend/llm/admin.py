from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from llm.models import ProviderConfig


@admin.register(ProviderConfig)
class ProviderConfigAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "provider_name",
        "team",
        "is_global",
        "created_at",
        "updated_at",
    )
    search_fields = ("title",)
    list_filter = ("provider_name", "team")
    readonly_fields = ("is_global", "created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("title", "provider_name", "team")}),
        (
            _("API Configuration"),
            {
                "fields": ("api_key", "base_url"),
                "classes": ("collapse",),
            },
        ),
        (
            _("Metadata"),
            {
                "fields": ("is_global", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )
