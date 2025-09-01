from django.db import models
from django.utils.translation import gettext_lazy as _

from common.models import BaseModel
from knowledge_base import consts


class KnowledgeBase(BaseModel):
    title = models.CharField(_("Title"), max_length=255)
    description = models.TextField(_("Description"))
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("Team"),
        related_name="knowledge_bases",
    )
    chunk_size = models.PositiveIntegerField(
        _("Chunk size"),
        help_text=_("Number of documents to be processed in each chunk"),
        default=1024,
    )
    chunk_overlap = models.PositiveIntegerField(
        _("Chunk overlap"),
        help_text=_("Number of overlapping documents in each chunk"),
        default=204,
    )
    chunk_seperator = models.JSONField(
        _("Chunk separator"),
        help_text=_("Separator used to split documents into chunks"),
        default=["\n\n", "\n", " ", ""],
    )
    embedding_model = models.ForeignKey(
        "llm.EmbeddingModel",
        on_delete=models.SET_NULL,
        verbose_name=_("embedding model"),
        related_name="knowledge_bases",
        blank=True,
        null=True,
    )
    embedding_provider_config = models.ForeignKey(
        "llm.ProviderConfig",
        on_delete=models.SET_NULL,
        verbose_name=_("embedding provider config"),
        related_name="embedding_knowledge_bases",
        blank=True,
        null=True,
        help_text=_("Provider configuration for embedding models"),
    )
    summarization_provider_config = models.ForeignKey(
        "llm.ProviderConfig",
        on_delete=models.SET_NULL,
        verbose_name=_("summarization provider config"),
        related_name="summarization_knowledge_bases",
        blank=True,
        null=True,
        help_text=_("Provider configuration for summarization models"),
    )
    summarization_model = models.ForeignKey(
        "llm.LLMModel",
        on_delete=models.SET_NULL,
        verbose_name=_("summarization model"),
        related_name="summarization_knowledge_bases",
        blank=True,
        null=True,
    )
    summarizer_context = models.TextField(
        _("Summarizer Context"),
        blank=True,
        null=True,
        help_text=_("Context to be provided to the summarizer"),
    )
    summarizer_type = models.CharField(
        _("Summarizer Type"),
        max_length=20,
        choices=consts.SUMMARIZER_TYPE_CHOICES,
        default="standard",
        help_text=_("The type of summarizer to use for document summarization"),
    )
    summarizer_temperature = models.FloatField(
        _("Summarizer Temperature"),
        default=0.7,
        null=True,
        blank=True,
        help_text=_("Temperature to be provided to the summarizer"),
    )
    status = models.CharField(
        _("Status"),
        max_length=20,
        choices=consts.KNOWLEDGE_BASE_STATUS_CHOICES,
        default=consts.KNOWLEDGE_BASE_STATUS_ACTIVE,
    )
    knowledge_base_each_document_cost = models.PositiveIntegerField(
        _("Knowledge Base Each Document Cost"),
        help_text=_("The cost of each document in the knowledge base"),
        default=1,
    )

    class Meta:
        verbose_name = _("Knowledge Base")
        verbose_name_plural = _("Knowledge Bases")

    def __str__(self):
        return self.title

    @property
    def document_count(self):
        return self.documents.count()


class KnowledgeBaseDocument(BaseModel):
    knowledge_base = models.ForeignKey(
        "knowledge_base.KnowledgeBase",
        on_delete=models.CASCADE,
        verbose_name=_("Knowledge Base"),
        related_name="documents",
    )
    title = models.CharField(_("Title"), max_length=255)
    content = models.TextField(_("Content"))
    source_type = models.CharField(
        _("Source Type"),
        max_length=20,
        choices=consts.DOCUMENT_SOURCE_TYPE_CHOICES,
        default=consts.DOCUMENT_SOURCE_TYPE_MANUAL,
    )
    source = models.CharField(_("Source"), max_length=1256, blank=True, null=True)
    error = models.TextField(_("Error"), blank=True, null=True)
    metadata = models.JSONField(_("Metadata"), blank=True, null=True)
    status = models.CharField(
        _("Status"),
        max_length=20,
        choices=consts.DOCUMENT_STATUS_CHOICES,
        default=consts.DOCUMENT_STATUS_NEW,
    )

    class Meta:
        verbose_name = _("Document")
        verbose_name_plural = _("Documents")
        unique_together = ["knowledge_base", "source_type", "source"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.title:
            self.title = self.content[:50]
        super().save(*args, **kwargs)


class KnowledgeBaseChunk(BaseModel):
    document = models.ForeignKey(
        "knowledge_base.KnowledgeBaseDocument",
        on_delete=models.CASCADE,
        verbose_name=_("Document"),
        related_name="chunks",
    )
    index = models.PositiveIntegerField(_("Index"), default=0)
    content = models.TextField(_("Content"))
    keywords = models.JSONField(_("Keywords"), blank=True, null=True, default=list)

    class Meta:
        verbose_name = _("Chunk")
        verbose_name_plural = _("Chunks")
        ordering = ["document", "index"]

    def __str__(self):
        return self.content

    def save(self, *args, **kwargs):
        if not self.content:
            self.content = self.document.content[self.start : self.end]
        super().save(*args, **kwargs)
