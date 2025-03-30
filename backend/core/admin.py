from django.contrib import admin
from .models import CrawlRequest, CrawlResult


@admin.register(CrawlRequest)
class CrawlConfigAdmin(admin.ModelAdmin):
    list_display = ("url", "status", "created_at", "updated_at")


@admin.register(CrawlResult)
class CrawlResultAdmin(admin.ModelAdmin):
    list_display = ("url", "result", "created_at", "updated_at")
