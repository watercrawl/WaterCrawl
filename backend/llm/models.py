from django.db import models
from django.utils.translation import gettext_lazy as _
from common.models import BaseModel
from llm import consts


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

    class Meta:
        verbose_name = _("Provider Config")
        verbose_name_plural = _("Provider Configs")

    def __str__(self):
        return f"{self.title} ({self.provider_name})"


class ProviderConfigModel(BaseModel):
    """
    Tracks model availability and custom models for a ProviderConfig.

    This model serves two purposes:
    1. Track which YAML-defined models are active/inactive for a provider config
    2. Store custom user-defined models that don't have YAML definitions
    """

    provider_config = models.ForeignKey(
        ProviderConfig,
        on_delete=models.CASCADE,
        verbose_name=_("Provider Config"),
        related_name="models",
    )
    model_key = models.CharField(
        _("Model Key"),
        max_length=255,
        help_text=_("Unique identifier for the model"),
    )
    model_type = models.CharField(
        _("Model Type"),
        max_length=50,
        choices=consts.MODEL_TYPE_CHOICES,
        default=consts.MODEL_TYPE_LLM,
    )
    is_active = models.BooleanField(
        _("Is Active"),
        default=True,
        help_text=_("Whether this model is available for use"),
    )
    is_custom = models.BooleanField(
        _("Is Custom"),
        default=False,
        help_text=_("Whether this is a custom user-defined model"),
    )
    custom_label = models.CharField(
        _("Custom Label"),
        max_length=255,
        blank=True,
        null=True,
        help_text=_("Human-readable label for custom models"),
    )
    custom_config = models.JSONField(
        _("Custom Configuration"),
        default=dict,
        blank=True,
        help_text=_(
            "Custom model configuration (features, model_properties, parameter_rules)"
        ),
    )

    class Meta:
        verbose_name = _("Provider Config Model")
        verbose_name_plural = _("Provider Config Models")
        unique_together = [["provider_config", "model_key", "model_type"]]
        ordering = ["model_type", "model_key"]

    def __str__(self):
        status = "active" if self.is_active else "inactive"
        custom = " (custom)" if self.is_custom else ""
        return f"{self.model_key} [{self.model_type}] - {status}{custom}"

    @property
    def label(self):
        """Get the display label for this model."""
        if self.is_custom and self.custom_label:
            return self.custom_label
        return self.model_key
