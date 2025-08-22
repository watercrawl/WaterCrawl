from collections import OrderedDict

from django.utils.translation import gettext_lazy as _

LLM_PROVIDER_OPENAI = "openai"
LLM_PROVIDER_WATERCRAWL = "watercrawl"
LLM_PROVIDER_WITHOUT_WATERCRAWL_CHOICES = ((LLM_PROVIDER_OPENAI, _("OpenAI")),)
# The WaterCrawl LLM provider is just for cloud version not OSS
LLM_PROVIDER_CHOICES = LLM_PROVIDER_WITHOUT_WATERCRAWL_CHOICES + (
    (LLM_PROVIDER_WATERCRAWL, _("WaterCrawl")),
)

OPTION_OPTIONAL = "optional"
OPTION_REQUIRED = "required"
OPTION_NOT_AVAILABLE = "not_available"

LLM_PROVIDER_INFORMATION = OrderedDict(
    [
        (
            LLM_PROVIDER_OPENAI,
            {
                "title": _("OpenAI"),
                "api_key": OPTION_REQUIRED,
                "base_url": OPTION_OPTIONAL,
                "default_base_url": "https://api.openai.com/v1",
            },
        ),
    ]
)

VISIBILITY_LEVEL_NOT_AVAILABLE = "not_available"
VISIBILITY_LEVEL_AVAILABLE = "available"
VISIBILITY_LEVEL_TEAM_ONLY = "team_only"
VISIBILITY_LEVEL_PREMIUM = "premium"

VISIBILITY_LEVEL_CHOICES = (
    (VISIBILITY_LEVEL_NOT_AVAILABLE, _("Not Available")),
    (VISIBILITY_LEVEL_AVAILABLE, _("Available")),
    (VISIBILITY_LEVEL_TEAM_ONLY, _("Team Only")),
    (VISIBILITY_LEVEL_PREMIUM, _("Premium")),
)

TRUNCATE_START = "start"
TRUNCATE_END = "end"
TRUNCATE_CHOICES = (
    (TRUNCATE_START, _("Start")),
    (TRUNCATE_END, _("End")),
)
