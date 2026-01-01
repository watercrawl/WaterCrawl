import logging
from enum import Enum
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import yaml
from django.conf import settings
from django.core.cache import cache
from django.template import Template, Context
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)

# Base directory for model configs
CONFIG_BASE_DIR = Path(__file__).parent

# Cache key prefix for model configs
CACHE_KEY_PREFIX = "llm_model_config"

# Default cache timeout in seconds (1 hour)
DEFAULT_CACHE_TIMEOUT = 3600


class ModelType(Enum):
    EMBEDDING = "embeddings"
    LLM = "llms"
    RERANKER = "rerankers"


def get_cache_timeout() -> int:
    """Get cache timeout from Django settings or use default."""
    return getattr(settings, "LLM_MODEL_CONFIG_CACHE_TIMEOUT", DEFAULT_CACHE_TIMEOUT)


class ParametersToSchema:
    """
    Converts YAML parameter rules to JSON Schema format.
    Supports template-based parameter definitions for common LLM parameters.
    """

    def __init__(self, parameters: List[Dict[str, Any]]):
        self.parameters = parameters

    def to_schema(self) -> Dict[str, Any]:
        """Convert all parameters to a JSON Schema object."""
        properties = {}
        required = []

        for param in self.parameters:
            name, schema = self._param_to_json_schema(param)
            properties[name] = schema
            if param.get("required", False):
                required.append(name)

        result = {
            "type": "object",
            "properties": properties,
        }
        if required:
            result["required"] = required

        return result

    def _param_to_json_schema(self, parameter: dict) -> Tuple[str, Dict[str, Any]]:
        """
        Convert a single parameter definition to JSON Schema format.

        Args:
            parameter: Parameter definition dict from YAML

        Returns:
            Tuple of (parameter_name, json_schema_dict)
        """
        # Handle template-based parameters
        if "use_template" in parameter:
            template_name = parameter["use_template"]
            if func := getattr(self, f"_template_{template_name}", None):
                return func(parameter)
            else:
                raise ValueError(
                    f"No template function named '_template_{template_name}' found"
                )

        return self._build_schema_from_param(parameter)

    def _build_schema_from_param(self, parameter: dict) -> Tuple[str, Dict[str, Any]]:
        """Build JSON schema from a parameter definition."""
        name = parameter["name"]
        param_type = parameter.get("type", "string")

        schema: Dict[str, Any] = {}

        # Map YAML types to JSON Schema types
        type_mapping = {
            "string": "string",
            "integer": "integer",
            "int": "integer",
            "float": "number",
            "number": "number",
            "boolean": "boolean",
            "bool": "boolean",
            "array": "array",
            "object": "object",
        }
        schema["type"] = type_mapping.get(param_type, "string")

        # Add description/help text
        if "help" in parameter:
            schema["description"] = str(parameter["help"])
        if "label" in parameter:
            schema["title"] = str(parameter["label"])

        # Add default value
        if "default" in parameter:
            schema["default"] = parameter["default"]

        # Add constraints
        if "min" in parameter:
            if schema["type"] in ("integer", "number"):
                schema["minimum"] = parameter["min"]
            elif schema["type"] == "string":
                schema["minLength"] = parameter["min"]
        if "max" in parameter:
            if schema["type"] in ("integer", "number"):
                schema["maximum"] = parameter["max"]
            elif schema["type"] == "string":
                schema["maxLength"] = parameter["max"]

        # Add enum options
        if "options" in parameter:
            schema["enum"] = parameter["options"]

        # Handle nested object type
        if param_type == "object" and "properties" in parameter:
            nested_properties = {}
            nested_required = []
            for nested_param in parameter["properties"]:
                nested_name, nested_schema = self._param_to_json_schema(nested_param)
                nested_properties[nested_name] = nested_schema
                if nested_param.get("required", False):
                    nested_required.append(nested_name)
            schema["properties"] = nested_properties
            if nested_required:
                schema["required"] = nested_required

        # Handle array type
        if param_type == "array" and "items" in parameter:
            _, item_schema = self._param_to_json_schema(parameter["items"])
            schema["items"] = item_schema

        return name, schema

    # ==========================================================================
    # Template functions for common LLM parameters
    # ==========================================================================

    def _template_temperature(self, parameter: dict) -> Tuple[str, Dict[str, Any]]:
        """Temperature parameter template (0.0 - 2.0)."""
        name = parameter.get("name", "temperature")
        return name, {
            "type": "number",
            "title": str(parameter.get("label", _("Temperature"))),
            "description": str(
                parameter.get(
                    "help",
                    _(
                        "Controls randomness. Lower values make the model more deterministic."
                    ),
                )
            ),
            "default": parameter.get("default", 0.7),
            "minimum": parameter.get("min", 0.0),
            "maximum": parameter.get("max", 2.0),
        }

    def _template_top_p(self, parameter: dict) -> Tuple[str, Dict[str, Any]]:
        """Top P (nucleus sampling) parameter template (0.0 - 1.0)."""
        name = parameter.get("name", "top_p")
        return name, {
            "type": "number",
            "title": str(parameter.get("label", _("Top P"))),
            "description": str(
                parameter.get(
                    "help",
                    _(
                        "Nucleus sampling: only consider tokens with cumulative probability >= top_p."
                    ),
                )
            ),
            "default": parameter.get("default", 1.0),
            "minimum": parameter.get("min", 0.0),
            "maximum": parameter.get("max", 1.0),
        }

    def _template_top_k(self, parameter: dict) -> Tuple[str, Dict[str, Any]]:
        """Top K parameter template."""
        name = parameter.get("name", "top_k")
        return name, {
            "type": "integer",
            "title": str(parameter.get("label", _("Top K"))),
            "description": str(
                parameter.get("help", _("Only sample from the top K tokens."))
            ),
            "default": parameter.get("default", 50),
            "minimum": parameter.get("min", 1),
            "maximum": parameter.get("max", 100),
        }

    def _template_max_tokens(self, parameter: dict) -> Tuple[str, Dict[str, Any]]:
        """Max tokens parameter template."""
        name = parameter.get("name", "max_tokens")
        return name, {
            "type": "integer",
            "title": str(parameter.get("label", _("Max Tokens"))),
            "description": str(
                parameter.get("help", _("Maximum number of tokens to generate."))
            ),
            "default": parameter.get("default", 512),
            "minimum": parameter.get("min", 1),
            "maximum": parameter.get("max", 128000),
        }

    def _template_presence_penalty(self, parameter: dict) -> Tuple[str, Dict[str, Any]]:
        """Presence penalty parameter template (-2.0 - 2.0)."""
        name = parameter.get("name", "presence_penalty")
        return name, {
            "type": "number",
            "title": str(parameter.get("label", _("Presence Penalty"))),
            "description": str(
                parameter.get(
                    "help",
                    _(
                        "Penalize new tokens based on whether they appear in the text so far."
                    ),
                )
            ),
            "default": parameter.get("default", 0.0),
            "minimum": parameter.get("min", -2.0),
            "maximum": parameter.get("max", 2.0),
        }

    def _template_frequency_penalty(
        self, parameter: dict
    ) -> Tuple[str, Dict[str, Any]]:
        """Frequency penalty parameter template (-2.0 - 2.0)."""
        name = parameter.get("name", "frequency_penalty")
        return name, {
            "type": "number",
            "title": str(parameter.get("label", _("Frequency Penalty"))),
            "description": str(
                parameter.get(
                    "help",
                    _(
                        "Penalize new tokens based on their frequency in the text so far."
                    ),
                )
            ),
            "default": parameter.get("default", 0.0),
            "minimum": parameter.get("min", -2.0),
            "maximum": parameter.get("max", 2.0),
        }

    def _template_stop_sequences(self, parameter: dict) -> Tuple[str, Dict[str, Any]]:
        """Stop sequences parameter template."""
        name = parameter.get("name", "stop")
        return name, {
            "type": "array",
            "title": str(parameter.get("label", _("Stop Sequences"))),
            "description": str(
                parameter.get(
                    "help",
                    _("Sequences where the model will stop generating further tokens."),
                )
            ),
            "items": {"type": "string"},
            "default": parameter.get("default", []),
        }

    def _template_seed(self, parameter: dict) -> Tuple[str, Dict[str, Any]]:
        """Seed parameter template for reproducibility."""
        name = parameter.get("name", "seed")
        return name, {
            "type": "integer",
            "title": str(parameter.get("label", _("Seed"))),
            "description": str(
                parameter.get("help", _("Random seed for reproducible outputs."))
            ),
        }

    def _template_response_format(self, parameter: dict) -> Tuple[str, Dict[str, Any]]:
        """Response format parameter template."""
        name = parameter.get("name", "response_format")
        options = parameter.get("options", ["text", "json_object"])
        schema: Dict[str, Any] = {
            "type": "string",
            "title": str(parameter.get("label", _("Response Format"))),
            "description": str(
                parameter.get(
                    "help", _("Specifying the format that the model must output.")
                )
            ),
            "enum": options,
        }
        if "default" in parameter:
            schema["default"] = parameter["default"]
        return name, schema

    def _template_json_schema(self, parameter: dict) -> Tuple[str, Dict[str, Any]]:
        """JSON schema parameter template for structured outputs."""
        name = parameter.get("name", "json_schema")
        return name, {
            "type": "object",
            "title": str(parameter.get("label", _("JSON Schema"))),
            "description": str(
                parameter.get(
                    "help",
                    _(
                        "JSON schema definition for structured output when response_format is json_schema."
                    ),
                )
            ),
            "ui": {"widget": "json-editor"},
        }


class ModelConfig:
    """
    Represents a loaded model configuration.
    """

    def __init__(self, config: Dict[str, Any]):
        self._config = config

    @property
    def key(self) -> str:
        """Model identifier."""
        return self._config.get("model", "")

    @property
    def label(self) -> str:
        """Human-readable model label."""
        return self._config.get("label", self.key)

    @property
    def model_type(self) -> str:
        """Model type (llm, embedding, etc.)."""
        return self._config.get("model_type", "llm")

    @property
    def model_properties(self) -> Dict[str, Any]:
        """Model properties (mode, context_size, etc.)."""
        return self._config.get("model_properties", {})

    @property
    def context_size(self) -> Optional[int]:
        """Maximum context size in tokens."""
        return self.model_properties.get("context_size")

    @property
    def mode(self) -> str | None:
        """Model mode (chat, completion, etc.)."""
        return self.model_properties.get("mode", None)

    @property
    def features(self) -> List[str]:
        """List of model features (e.g., multi-tool-call, vision, agent-thought, stream-tool-call)."""
        return self._config.get("features", [])

    def has_feature(self, feature: str) -> bool:
        """Check if model supports a specific feature."""
        return feature in self.features

    @property
    def parameter_rules(self) -> List[Dict[str, Any]]:
        """Raw parameter rules from config."""
        return self._config.get("parameter_rules", [])

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        """JSON Schema for model parameters."""
        return ParametersToSchema(self.parameter_rules).to_schema()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "key": self.key,
            "label": self.label,
            "model_type": self.model_type,
            "features": self.features,
            "model_properties": self.model_properties,
            "parameters_schema": self.parameters_schema,
        }

    def has_config_error(
        self, config: Optional[Dict[str, Any]] = None
    ) -> bool | Dict[str, Any]:
        if not config:
            return False

        # TODO: validate with json schema here
        return False


class ModelConfigLoader:
    """
    Loads model configurations from YAML template files with Redis caching.
    Supports Django template syntax for translations.

    Cache timeout can be configured in Django settings:
        LLM_MODEL_CONFIG_CACHE_TIMEOUT = 3600  # seconds (default: 1 hour)
    """

    def __init__(self, provider_name: str, model_type: ModelType, model_name: str):
        """
        Load a model configuration.

        Args:
            provider_name: Provider directory name (e.g., 'openai', 'anthropic')
            model_type: Model type (llm, embedding, etc.)
            model_name: Model file name without extension (e.g., 'chatgpt-4o-latest')
        """
        self.provider_name: str = provider_name
        self.model_type: ModelType = model_type
        self.model_name: str = model_name
        self._config: Optional[ModelConfig] = None

    @property
    def cache_key(self) -> str:
        """Generate cache key for this model configuration."""
        return f"{CACHE_KEY_PREFIX}:{self.provider_name}:{self.model_type.value}:{self.model_name}"

    @property
    def config_path(self) -> Path:
        """Full path to the configuration file."""
        # Try .yaml.tpl first, then .yaml, then .yml
        base_path = (
            CONFIG_BASE_DIR
            / self.provider_name
            / self.model_type.value
            / self.model_name
        )
        for ext in [".yaml.tpl", ".yaml", ".yml", ".yml.tpl"]:
            base_path.with_suffix(ext) if not str(base_path).endswith(ext) else Path(
                str(base_path) + ext
            )
            # Handle double extension like .yaml.tpl
            full_path = Path(str(base_path) + ext)
            if full_path.exists():
                return full_path
        raise FileNotFoundError(
            f"No config file found for {self.provider_name}/{self.model_type.value}/{self.model_name}"
        )

    def _load_from_file(self) -> Dict[str, Any]:
        """Load and parse the configuration file from disk."""
        with open(self.config_path, "r", encoding="utf-8") as f:
            raw_content = f.read()

        # Process Django template syntax with i18n support
        # Prepend {% load i18n %} to enable trans tags
        template_content = "{% load i18n %}" + raw_content
        template = Template(template_content)
        rendered_content = template.render(Context())

        # Parse YAML
        return yaml.safe_load(rendered_content)

    def load(self, use_cache: bool = True) -> ModelConfig:
        """
        Load the configuration, using cache if available.

        Args:
            use_cache: Whether to use Redis cache (default: True)

        Returns:
            ModelConfig instance
        """
        # Return in-memory cached config if available
        if self._config is not None:
            return self._config

        config_dict = None

        # Try to get from Redis cache
        if use_cache:
            try:
                config_dict = cache.get(self.cache_key)
                if config_dict is not None:
                    logger.debug(f"Cache hit for {self.cache_key}")
            except Exception as e:
                logger.warning(f"Cache get failed for {self.cache_key}: {e}")

        # Load from file if not in cache
        if config_dict is None:
            logger.debug(f"Cache miss for {self.cache_key}, loading from file")
            config_dict = self._load_from_file()

            # Store in cache
            try:
                cache.set(self.cache_key, config_dict, get_cache_timeout())
                logger.debug(f"Cached {self.cache_key} for {get_cache_timeout()}s")
            except Exception as e:
                logger.warning(f"Cache set failed for {self.cache_key}: {e}")

        self._config = ModelConfig(config_dict)
        return self._config

    def invalidate_cache(self) -> bool:
        """
        Invalidate the cache for this model configuration.

        Returns:
            True if cache was deleted, False otherwise
        """
        try:
            cache.delete(self.cache_key)
            self._config = None
            logger.debug(f"Cache invalidated for {self.cache_key}")
            return True
        except Exception as e:
            logger.warning(f"Cache invalidation failed for {self.cache_key}: {e}")
            return False

    def refresh(self) -> ModelConfig:
        """
        Force reload from file and update cache.

        Returns:
            Freshly loaded ModelConfig instance
        """
        self._config = None
        self.invalidate_cache()
        return self.load(use_cache=True)

    @property
    def config(self) -> ModelConfig:
        """Get the loaded configuration (loads if not already loaded)."""
        return self.load()

    @classmethod
    def list_providers(cls) -> List[str]:
        """List all available providers."""
        providers = []
        for item in CONFIG_BASE_DIR.iterdir():
            if (
                item.is_dir()
                and not item.name.startswith("_")
                and not item.name.startswith(".")
            ):
                providers.append(item.name)
        return sorted(providers)

    @classmethod
    def list_models(
        cls, provider_name: str, model_type: ModelType = ModelType.LLM
    ) -> List[str]:
        """List all available models for a provider."""
        models = []
        model_dir = CONFIG_BASE_DIR / provider_name / model_type.value
        if not model_dir.exists():
            return models

        valid_extensions = [".yaml.tpl", ".yaml", ".yml.tpl", ".yml"]

        for item in model_dir.iterdir():
            # Skip directories and non-files
            if not item.is_file():
                continue

            # Skip hidden files and files starting with underscore
            if item.name.startswith(".") or item.name.startswith("_"):
                continue

            # Only process YAML files
            has_valid_ext = any(item.name.endswith(ext) for ext in valid_extensions)
            if not has_valid_ext:
                continue

            # Remove extensions to get model name
            name = item.name
            for ext in valid_extensions:
                if name.endswith(ext):
                    name = name[: -len(ext)]
                    break

            if name and name not in models:
                models.append(name)

        return sorted(models)

    @classmethod
    def load_all_models(
        cls, provider_name: str, model_type: ModelType = ModelType.LLM
    ) -> List[ModelConfig]:
        """Load all model configurations for a provider."""
        configs = []
        for model_name in cls.list_models(provider_name, model_type):
            try:
                loader = cls(provider_name, model_type, model_name)
                configs.append(loader.load())
            except Exception as e:
                logger.error(
                    f"Error loading {provider_name}/{model_type}/{model_name}: {e}"
                )
        return configs

    @classmethod
    def invalidate_all_cache(cls) -> int:
        """
        Invalidate all model config caches.

        Returns:
            Number of cache entries invalidated
        """
        count = 0
        for provider in cls.list_providers():
            for model_type in ["llms", "embeddings", "rerankers"]:
                model_type_enum = (
                    ModelType.LLM
                    if model_type == "llms"
                    else (
                        ModelType.EMBEDDING
                        if model_type == "embeddings"
                        else ModelType.RERANKER
                    )
                )
                for model_name in cls.list_models(provider, model_type_enum):
                    loader = cls(provider, model_type_enum, model_name)
                    if loader.invalidate_cache():
                        count += 1
        logger.info(f"Invalidated {count} model config cache entries")
        return count

    @classmethod
    def invalidate_provider_cache(cls, provider_name: str) -> int:
        """
        Invalidate all model config caches for a specific provider.

        Args:
            provider_name: Provider to invalidate cache for

        Returns:
            Number of cache entries invalidated
        """
        # Try pattern-based deletion first (more efficient for Redis)
        pattern = f"{CACHE_KEY_PREFIX}:{provider_name}:*"
        try:
            if hasattr(cache, "delete_pattern"):
                # django-redis provides delete_pattern
                count = cache.delete_pattern(pattern)
                logger.info(
                    f"Invalidated {count} cache entries for provider {provider_name} using pattern"
                )
                return count
        except Exception as e:
            logger.debug(
                f"Pattern deletion not available, falling back to iteration: {e}"
            )

        # Fallback: iterate through known models
        count = 0
        for model_type in [ModelType.LLM, ModelType.EMBEDDING, ModelType.RERANKER]:
            for model_name in cls.list_models(provider_name, model_type):
                loader = cls(provider_name, model_type, model_name)
                if loader.invalidate_cache():
                    count += 1
        logger.info(
            f"Invalidated {count} model config cache entries for provider {provider_name}"
        )
        return count

    @classmethod
    def invalidate_all_providers_cache(cls) -> int:
        """
        Invalidate all model config caches using Redis pattern matching.
        More efficient than invalidate_all_cache() when using Redis.

        Returns:
            Number of cache entries invalidated (or True if pattern deletion used)
        """
        pattern = f"{CACHE_KEY_PREFIX}:*"
        try:
            if hasattr(cache, "delete_pattern"):
                # django-redis provides delete_pattern for efficient bulk deletion
                count = cache.delete_pattern(pattern)
                logger.info(
                    f"Invalidated {count} cache entries using pattern '{pattern}'"
                )
                return count
        except Exception as e:
            logger.debug(
                f"Pattern deletion not available, falling back to iteration: {e}"
            )

        # Fallback to iteration-based deletion
        return cls.invalidate_all_cache()

    @classmethod
    def provider_has_model(cls, provider_name, model_type, model_name):
        return model_name in cls.list_models(provider_name, model_type)
