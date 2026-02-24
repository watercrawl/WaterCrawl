from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from common.models import BaseModel
from knowledge_base import consts
from knowledge_base.utils import chunk_default_separators
from pgvector.django import VectorField


# Query status constants
QUERY_STATUS_NEW = "new"
QUERY_STATUS_PROCESSING = "processing"
QUERY_STATUS_FINISHED = "finished"
QUERY_STATUS_FAILED = "failed"


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
        default=chunk_default_separators,
    )
    embedding_model_key = models.CharField(
        verbose_name=_("Embedding Model"),
        max_length=255,
        blank=True,
        null=True,
    )
    embedding_provider_config = models.ForeignKey(
        "llm.ProviderConfig",
        on_delete=models.SET_NULL,
        verbose_name=_("Embedding Provider Config"),
        related_name="embedding_knowledge_bases",
        blank=True,
        null=True,
        help_text=_("Provider configuration for embedding models"),
    )
    summarization_provider_config = models.ForeignKey(
        "llm.ProviderConfig",
        on_delete=models.SET_NULL,
        verbose_name=_("Summarization Provider Config"),
        related_name="summarization_knowledge_bases",
        blank=True,
        null=True,
        help_text=_("Provider configuration for summarization models"),
    )
    summarization_model_key = models.CharField(
        verbose_name=_("Summarization Model"),
        max_length=255,
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
    summarizer_llm_config = models.JSONField(
        _("Summarizer LLM Config"),
        default=dict,
        null=True,
        blank=True,
        help_text=_("LLM config to be provided to the summarizer"),
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
    vector_store_type = models.CharField(
        _("Vector Store Type"),
        max_length=50,
        default=settings.KNOWLEDGE_BASE_VECTOR_STORE_TYPE,
        help_text=_("Type of vector store used for this knowledge base"),
    )

    @property
    def default_retrieval_setting(self):
        """Get the default retrieval setting for this knowledge base."""
        return self.retrieval_settings.filter(is_default=True).first()

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
    # Embedding vector - use pgvector if available, otherwise JSONField
    embedding = VectorField(
        dimensions=None,  # Will be set dynamically based on embedding model
        null=True,
        blank=True,
        verbose_name=_("Embedding"),
        help_text=_("Vector embedding for semantic search"),
    )

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


class RetrievalSetting(BaseModel):
    """Retrieval settings for knowledge base queries."""

    RETRIEVAL_TYPE_VECTOR = "vector_search"
    RETRIEVAL_TYPE_FULL_TEXT = "full_text_search"
    RETRIEVAL_TYPE_HYBRID = "hybrid_search"

    RETRIEVAL_TYPE_CHOICES = (
        (RETRIEVAL_TYPE_VECTOR, _("Vector Search")),
        (RETRIEVAL_TYPE_FULL_TEXT, _("Full-Text Search")),
        (RETRIEVAL_TYPE_HYBRID, _("Hybrid Search")),
    )

    knowledge_base = models.ForeignKey(
        "knowledge_base.KnowledgeBase",
        on_delete=models.CASCADE,
        verbose_name=_("Knowledge Base"),
        related_name="retrieval_settings",
    )
    name = models.CharField(
        _("Name"),
        max_length=255,
        help_text=_("Name for this retrieval setting"),
    )
    retrieval_type = models.CharField(
        _("Retrieval Type"),
        max_length=50,
        choices=RETRIEVAL_TYPE_CHOICES,
        default=RETRIEVAL_TYPE_HYBRID,
        help_text=_("Type of retrieval to use"),
    )
    is_default = models.BooleanField(
        _("Is Default"),
        default=False,
        help_text=_(
            "Whether this is the default retrieval setting for the knowledge base"
        ),
    )
    # Reranker settings
    reranker_enabled = models.BooleanField(
        _("Reranker Enabled"),
        default=False,
        help_text=_("Whether to use reranker model for post-processing results"),
    )
    reranker_provider_config = models.ForeignKey(
        "llm.ProviderConfig",
        on_delete=models.SET_NULL,
        verbose_name=_("Reranker Provider Config"),
        related_name="reranker_retrieval_settings",
        blank=True,
        null=True,
        help_text=_("Provider configuration for reranker model"),
    )
    reranker_model_key = models.CharField(
        _("Reranker Model Key"),
        max_length=255,
        blank=True,
        null=True,
        help_text=_("Model key for reranker (required if reranker_enabled is true)"),
    )
    # Retrieval parameters
    top_k = models.PositiveIntegerField(
        _("Top K"),
        default=3,
        help_text=_("Number of top results to retrieve"),
    )
    # Hybrid search settings
    hybrid_alpha = models.FloatField(
        _("Hybrid Alpha"),
        default=0.7,
        blank=True,
        null=True,
        help_text=_(
            "Weight for semantic search in hybrid mode (0.0-1.0, higher = more semantic). Used for weighted score ranking when reranker_enabled is false."
        ),
    )
    reranker_model_config = models.JSONField(
        _("Reranker Model Config"),
        default=dict,
        null=True,
        blank=True,
        help_text=_("Model config to be provided to the reranker"),
    )

    # Pricing fields
    retrieval_cost = models.PositiveIntegerField(
        _("Retrieval Cost"),
        help_text=_("The cost in credits per retrieval using this setting"),
        default=0,
    )

    class Meta:
        verbose_name = _("Retrieval Setting")
        verbose_name_plural = _("Retrieval Settings")
        unique_together = [["knowledge_base", "name"]]

    def __str__(self):
        return f"{self.knowledge_base.title} - {self.name}"

    def clean(self):
        """Validate retrieval setting."""
        # If reranker is enabled, require model_key and provider_config
        if self.reranker_enabled:
            if not self.reranker_model_key:
                raise ValidationError(
                    {
                        "reranker_model_key": _(
                            "Reranker model key is required when reranker is enabled."
                        )
                    }
                )
            if not self.reranker_provider_config:
                raise ValidationError(
                    {
                        "reranker_provider_config": _(
                            "Reranker provider config is required when reranker is enabled."
                        )
                    }
                )
            if not self.reranker_provider_config:
                raise ValidationError(
                    {
                        "reranker_provider_config": _(
                            "Reranker provider config is required when using rerank model strategy."
                        )
                    }
                )

        # If retrieval type is vector_search or hybrid, knowledge base must have embeddings
        if self.retrieval_type in [
            self.RETRIEVAL_TYPE_VECTOR,
            self.RETRIEVAL_TYPE_HYBRID,
        ]:
            if not self.knowledge_base.embedding_provider_config:
                raise ValidationError(
                    _(
                        "Vector search and hybrid search require the knowledge base to have embedding configuration."
                    )
                )

    def _calculate_retrieval_cost(self):
        """Calculate the cost in credits for using this retrieval setting."""
        cost = 0

        # Check if vector/hybrid search uses WaterCrawl embedding provider
        if self.retrieval_type in [
            self.RETRIEVAL_TYPE_VECTOR,
            self.RETRIEVAL_TYPE_HYBRID,
        ]:
            if self.knowledge_base.embedding_provider_config:
                # Check if it's a global WaterCrawl provider (not external/custom)
                if self.knowledge_base.embedding_provider_config.is_global:
                    cost += 1

        # Check if reranker uses WaterCrawl provider
        if self.reranker_enabled and self.reranker_provider_config:
            # Check if it's a global WaterCrawl provider (not external/custom)
            if self.reranker_provider_config.is_global:
                cost += 1

        return cost

    def save(self, *args, **kwargs):
        """Override save to calculate retrieval cost."""
        # Calculate retrieval cost before saving
        self.retrieval_cost = self._calculate_retrieval_cost()
        super().save(*args, **kwargs)

        # Ensure only one default per knowledge base
        if self.is_default:
            existing_default = RetrievalSetting.objects.filter(
                knowledge_base=self.knowledge_base, is_default=True
            ).exclude(pk=self.pk if self.pk else None)
            if existing_default.exists():
                raise ValidationError(
                    _(
                        "Only one retrieval setting can be set as default per knowledge base."
                    )
                )


class KnowledgeBaseQuery(BaseModel):
    """Track knowledge base query requests for usage history and billing."""

    QUERY_STATUS_CHOICES = (
        (QUERY_STATUS_NEW, _("New")),
        (QUERY_STATUS_PROCESSING, _("Processing")),
        (QUERY_STATUS_FINISHED, _("Finished")),
        (QUERY_STATUS_FAILED, _("Failed")),
    )

    knowledge_base = models.ForeignKey(
        "knowledge_base.KnowledgeBase",
        on_delete=models.CASCADE,
        verbose_name=_("Knowledge Base"),
        related_name="queries",
    )
    retrieval_setting = models.ForeignKey(
        "knowledge_base.RetrievalSetting",
        on_delete=models.SET_NULL,
        verbose_name=_("Retrieval Setting"),
        related_name="queries",
        null=True,
        blank=True,
        help_text=_("The retrieval setting used for this query"),
    )
    query_text = models.TextField(
        _("Query Text"),
        help_text=_("The search query submitted by the user"),
    )
    status = models.CharField(
        _("Status"),
        max_length=20,
        choices=QUERY_STATUS_CHOICES,
        default=QUERY_STATUS_NEW,
    )
    results_count = models.PositiveIntegerField(
        _("Results Count"),
        default=0,
        help_text=_("Number of results returned"),
    )
    retrieval_cost = models.PositiveIntegerField(
        _("Retrieval Cost"),
        default=0,
        help_text=_("The cost in credits for this query"),
    )
    error_message = models.TextField(
        _("Error Message"),
        blank=True,
        null=True,
        help_text=_("Error message if query failed"),
    )

    class Meta:
        verbose_name = _("Knowledge Base Query")
        verbose_name_plural = _("Knowledge Base Queries")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.knowledge_base.title} - {self.query_text[:50]}"
