from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from llm.models import LLMModel, ProviderConfig, EmbeddingModel


@admin.register(LLMModel)
class LLMModelAdmin(admin.ModelAdmin):
    list_display = ("name", "key", "provider_name")
    search_fields = ("name", "key")
    list_filter = ("provider_name",)


@admin.register(EmbeddingModel)
class EmbeddingModelAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "key",
        "provider_name",
        "dimensions",
        "max_input_length",
        "truncate",
    )
    search_fields = ("name", "key")
    list_filter = ("provider_name", "truncate")


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
