from collections import OrderedDict

from django.utils.translation import gettext_lazy as _

LLM_PROVIDER_OPENAI = "openai"
LLM_PROVIDER_ANTHROPIC = "anthropic"
LLM_PROVIDER_GOOGLE_GENAI = "google-genai"
LLM_PROVIDER_COHERE = "cohere"
LLM_PROVIDER_OLLAMA = "ollama"
LLM_PROVIDER_CHOICES = (
    (LLM_PROVIDER_OPENAI, _("OpenAI")),
    (LLM_PROVIDER_ANTHROPIC, _("Anthropic")),
    (LLM_PROVIDER_GOOGLE_GENAI, _("Google Generative AI")),
    (LLM_PROVIDER_COHERE, _("Cohere")),
    (LLM_PROVIDER_OLLAMA, _("Ollama")),
)

# Model type constants
MODEL_TYPE_LLM = "llm"
MODEL_TYPE_EMBEDDING = "embedding"
MODEL_TYPE_RERANKER = "reranker"
MODEL_TYPE_CHOICES = (
    (MODEL_TYPE_LLM, _("LLM")),
    (MODEL_TYPE_EMBEDDING, _("Embedding")),
    (MODEL_TYPE_RERANKER, _("Reranker")),
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
        (
            LLM_PROVIDER_ANTHROPIC,
            {
                "title": _("Anthropic"),
                "api_key": OPTION_REQUIRED,
                "base_url": OPTION_OPTIONAL,
                "default_base_url": "https://api.anthropic.com",
            },
        ),
        (
            LLM_PROVIDER_GOOGLE_GENAI,
            {
                "title": _("Google Generative AI"),
                "api_key": OPTION_REQUIRED,
                "base_url": OPTION_NOT_AVAILABLE,
                "default_base_url": None,
            },
        ),
        (
            LLM_PROVIDER_COHERE,
            {
                "title": _("Cohere"),
                "api_key": OPTION_REQUIRED,
                "base_url": OPTION_OPTIONAL,
                "default_base_url": "https://api.cohere.ai/v1",
            },
        ),
        (
            LLM_PROVIDER_OLLAMA,
            {
                "title": _("Ollama"),
                "api_key": OPTION_NOT_AVAILABLE,
                "base_url": OPTION_REQUIRED,
                "default_base_url": "http://localhost:11434",
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
