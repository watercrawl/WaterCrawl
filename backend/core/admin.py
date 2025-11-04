from urllib.parse import urlencode

from django.utils.translation import gettext as _
from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html

from .models import CrawlRequest, CrawlResult, ProxyServer


@admin.register(CrawlRequest)
class CrawlConfigAdmin(admin.ModelAdmin):
    list_display = ("url", "status", "created_at", "updated_at")


@admin.register(CrawlResult)
class CrawlResultAdmin(admin.ModelAdmin):
    list_display = ("url", "result", "created_at", "updated_at")


@admin.register(ProxyServer)
class ProxyServerAdmin(admin.ModelAdmin):
    list_display = ("name", "host", "created_at", "updated_at", "duplicate_link")

    def duplicate_link(self, obj):
        # Fields to include in the duplication (exclude id, timestamps, etc.)
        fields_to_copy = {
            field.name: getattr(obj, field.name)
            for field in obj._meta.fields
            if field.name not in ["id", "created_at", "updated_at"]  # adjust if needed
        }

        # Build the "add" URL with query parameters
        query_string = urlencode(fields_to_copy)
        add_url = reverse(f"admin:{obj._meta.app_label}_{obj._meta.model_name}_add")

        return format_html(
            '<a class="button" href="{}?{}">{}</a>',
            add_url,
            query_string,
            _("Duplicate"),
        )

    duplicate_link.short_description = _("Duplicate")
