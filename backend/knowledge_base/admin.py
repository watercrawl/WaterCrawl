from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from knowledge_base.models import (
    KnowledgeBase,
    KnowledgeBaseDocument,
    KnowledgeBaseChunk,
)


@admin.register(KnowledgeBase)
class KnowledgeBaseAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "team",
        "embedding_model",
        "summarization_model",
        "knowledge_base_each_document_cost",
        "created_at",
    )
    search_fields = ("title", "description")
    list_filter = ("team", "embedding_model", "summarization_model", "summarizer_type")
    fieldsets = (
        (None, {"fields": ("title", "description", "team")}),
        (
            _("Chunking Configuration"),
            {
                "fields": ("chunk_size", "chunk_overlap"),
            },
        ),
        (
            _("Embedding Configuration"),
            {
                "fields": ("embedding_model", "embedding_provider_config"),
            },
        ),
        (
            _("Chunk Enhancement"),
            {
                "fields": (
                    "summarization_model",
                    "summarization_provider_config",
                    "summarizer_type",
                    "summarizer_context",
                ),
            },
        ),
        (
            _("Metadata"),
            {
                "fields": ("uuid", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )
    readonly_fields = ("uuid", "created_at", "updated_at")


@admin.register(KnowledgeBaseDocument)
class KnowledgeBaseDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "knowledge_base", "source_type", "source", "created_at")
    search_fields = ("title", "content", "source")
    list_filter = ("knowledge_base",)
    fieldsets = (
        (None, {"fields": ("title", "knowledge_base")}),
        (
            _("Content"),
            {
                "fields": ("content", "source", "source_type"),
            },
        ),
        (
            _("Metadata"),
            {
                "fields": ("metadata", "uuid", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )
    readonly_fields = ("uuid", "created_at", "updated_at")


@admin.register(KnowledgeBaseChunk)
class KnowledgeBaseChunkAdmin(admin.ModelAdmin):
    list_display = ("document", "created_at")
    search_fields = ("content",)
    list_filter = ("document__knowledge_base",)
    fieldsets = (
        (None, {"fields": ("document", "content")}),
        (
            _("Embedding"),
            {
                "fields": ("embedding",),
                "classes": ("collapse",),
            },
        ),
        (
            _("Metadata"),
            {
                "fields": ("uuid", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )
    readonly_fields = ("uuid", "created_at", "updated_at")
