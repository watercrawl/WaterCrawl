from django.db import models
from django.utils.translation import gettext_lazy as _
from common.models import BaseModel
from llm import consts


class LLMModel(BaseModel):
    name = models.CharField(_("Name"), max_length=255, unique=True)
    key = models.CharField(_("Key"), max_length=255)
    provider_name = models.CharField(
        _("Provider"),
        max_length=255,
        choices=consts.LLM_PROVIDER_CHOICES,
        default=consts.LLM_PROVIDER_OPENAI,
    )
    visibility_level = models.CharField(
        _("Visibility Level"),
        max_length=255,
        choices=consts.VISIBILITY_LEVEL_CHOICES,
        default=consts.VISIBILITY_LEVEL_AVAILABLE,
    )
    min_temperature = models.FloatField(
        _("Min Temperature"), default=0.0, null=True, blank=True
    )
    max_temperature = models.FloatField(
        _("Max Temperature"), default=2.0, null=True, blank=True
    )
    default_temperature = models.FloatField(
        _("Default Temperature"), default=0.7, null=True, blank=True
    )

    class Meta:
        verbose_name = _("Model")
        verbose_name_plural = _("Models")

    def __str__(self):
        return f"{self.name} ({self.provider_name})"


class ProviderConfig(BaseModel):
    title = models.CharField(_("Title"), max_length=255)
    provider_name = models.CharField(
        _("Provider"),
        max_length=255,
        choices=consts.LLM_PROVIDER_CHOICES,
        default=consts.LLM_PROVIDER_OPENAI,
    )
    api_key = models.TextField(_("API Key"))
    base_url = models.CharField(
        _("API Base URL"), max_length=255, blank=True, null=True
    )
    temperature = models.FloatField(_("Temperature"), default=0.7)
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("Team"),
        related_name="provider_configs",
        blank=True,
        null=True,
    )

    @property
    def is_global(self):
        """Check if this is a global provider config."""
        return self.team is None

    @property
    def available_llm_models(self):
        queryset = LLMModel.objects.filter(provider_name=self.provider_name).exclude(
            visibility_level=consts.VISIBILITY_LEVEL_NOT_AVAILABLE
        )
        if self.is_global:
            return queryset.exclude(visibility_level=consts.VISIBILITY_LEVEL_TEAM_ONLY)
        return queryset

    @property
    def available_embedding_models(self):
        queryset = EmbeddingModel.objects.filter(
            provider_name=self.provider_name
        ).exclude(visibility_level=consts.VISIBILITY_LEVEL_NOT_AVAILABLE)
        if self.is_global:
            return queryset.exclude(visibility_level=consts.VISIBILITY_LEVEL_TEAM_ONLY)
        return queryset

    class Meta:
        verbose_name = _("Provider Config")
        verbose_name_plural = _("Provider Configs")

    def __str__(self):
        return f"{self.title} ({self.provider_name})"


class EmbeddingModel(BaseModel):
    """Model for embedding models supported by a provider"""

    provider_name = models.CharField(
        _("Provider"),
        max_length=255,
        choices=consts.LLM_PROVIDER_CHOICES,
        default=consts.LLM_PROVIDER_OPENAI,
    )
    name = models.CharField(_("Name"), max_length=255)
    key = models.CharField(_("Key"), max_length=255)
    description = models.TextField(_("Description"), blank=True, null=True)
    dimensions = models.IntegerField(_("Dimensions"), default=1536)
    max_input_length = models.IntegerField(_("Max Input Length"), default=8191)
    truncate = models.CharField(
        _("Truncate"),
        max_length=255,
        choices=consts.TRUNCATE_CHOICES,
        default=consts.TRUNCATE_END,
    )
    visibility_level = models.CharField(
        _("Visibility Level"),
        max_length=255,
        choices=consts.VISIBILITY_LEVEL_CHOICES,
        default=consts.VISIBILITY_LEVEL_AVAILABLE,
    )

    class Meta:
        verbose_name = _("Provider Embedding")
        verbose_name_plural = _("Provider Embeddings")
        unique_together = [("provider_name", "key")]

    def __str__(self):
        return f"{self.name} ({self.provider_name})"
