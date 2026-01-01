import logging
import requests
from typing import List, Dict, Any, Optional

from django.db.models import Q

from llm import consts
from llm.models import ProviderConfig, ProviderConfigModel
from llm.models_config.config import (
    ModelConfigLoader,
    ModelType,
    ModelConfig,
    ParametersToSchema,
)
from user.models import Team

logger = logging.getLogger(__name__)


class ProviderService:
    @classmethod
    def get_available_providers(cls):
        return [
            {"key": key, **value}
            for key, value in consts.LLM_PROVIDER_INFORMATION.items()
        ]


class ProviderConfigService:
    def __init__(self, provider_config: ProviderConfig):
        self.provider_config: ProviderConfig = provider_config

    @classmethod
    def get_team_provider_configs(cls, team: Team):
        return ProviderConfig.objects.filter(Q(team=team) | Q(team__isnull=True))

    @classmethod
    def test_provider_config(
        cls, provider_name: str, api_key: str, base_url: str = None
    ) -> bool:
        """Test if a provider configuration is valid.

        Args:
            provider_name: Provider name
            api_key: API key to test
            base_url: Optional base URL override

        Returns:
            Dictionary with test results
        """
        try:
            # Different validation logic depending on provider
            if provider_name == consts.LLM_PROVIDER_OPENAI:
                return cls._test_openai_provider(api_key, base_url)
            if provider_name == consts.LLM_PROVIDER_GOOGLE_GENAI:
                return cls._test_google_genai_provider(api_key)
            if provider_name == consts.LLM_PROVIDER_COHERE:
                return cls._test_cohere_provider(api_key, base_url)
            if provider_name == consts.LLM_PROVIDER_OLLAMA:
                return cls._test_ollama_provider(base_url)
            if provider_name == consts.LLM_PROVIDER_ANTHROPIC:
                return cls._test_anthropic_provider(api_key, base_url)

            return False
        except Exception:
            pass

        return False

    @classmethod
    def _test_openai_provider(cls, api_key: str, base_url: str = None) -> bool:
        """Test OpenAI provider configuration."""
        # Use default OpenAI API URL if not provided
        api_url = base_url or "https://api.openai.com/v1"
        # Make sure URL doesn't end with slash
        if api_url.endswith("/"):
            api_url = api_url[:-1]

        # Test with a simple models list request
        response = requests.get(
            f"{api_url}/models",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )

        if response.status_code == 200:
            return True

        return False

    @classmethod
    def _test_google_genai_provider(cls, api_key: str) -> bool:
        """Test Google Generative AI provider configuration."""
        try:
            from google.genai import Client

            # Create client with API key
            client = Client(api_key=api_key)

            # Test by listing models (lightweight operation)
            client.models.list()
            # If we can list models, the API key is valid
            return True
        except Exception as e:
            # Log the error for debugging but don't expose it
            logger.error(f"Google GenAI provider test failed: {str(e)}")
            return False

    @classmethod
    def _test_cohere_provider(cls, api_key: str, base_url: str = None) -> bool:
        """Test Cohere provider configuration."""
        # Use default Cohere API URL if not provided
        api_url = base_url or "https://api.cohere.ai/v1"
        # Make sure URL doesn't end with slash
        if api_url.endswith("/"):
            api_url = api_url[:-1]

        # Test with a simple models list request
        response = requests.get(
            f"{api_url}/models",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )

        if response.status_code == 200:
            return True

        return False

    @classmethod
    def _test_ollama_provider(cls, base_url: str = None, api_key: str = None) -> bool:
        """Test Ollama provider configuration."""
        api_url = base_url or "http://localhost:11434"
        if api_url.endswith("/"):
            api_url = api_url[:-1]

        headers = {"Content-Type": "application/json"}

        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        try:
            response = requests.get(
                f"{api_url}/api/tags",
                headers=headers,
                timeout=10,
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Ollama provider test failed: {str(e)}")
            return False

    @classmethod
    def _test_anthropic_provider(cls, api_key, base_url):
        api_url = base_url or "https://api.anthropic.com"

        if api_url.endswith("/"):
            api_url = api_url[:-1]

        try:
            response = requests.get(
                f"{api_url}/v1/models",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                },
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Anthropic provider test failed: {str(e)}")
            return False


class ModelAvailabilityService:
    """
    Service to manage model availability for provider configs.

    This service handles:
    - Getting available models (YAML + custom - inactive)
    - Validating if a model can be used
    - Managing model activation/deactivation
    - Managing custom models CRUD
    """

    # Map model type string to ModelType enum
    MODEL_TYPE_MAP = {
        consts.MODEL_TYPE_LLM: ModelType.LLM,
        consts.MODEL_TYPE_EMBEDDING: ModelType.EMBEDDING,
        consts.MODEL_TYPE_RERANKER: ModelType.RERANKER,
    }

    @classmethod
    def get_all_models_for_provider(
        cls,
        provider_config: ProviderConfig,
        model_type: str,
        include_inactive: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Get all models for a provider config, combining YAML and custom models.

        Args:
            provider_config: The provider config to get models for
            model_type: One of 'llm', 'embedding', 'reranker'
            include_inactive: Whether to include inactive models

        Returns:
            List of model dictionaries with availability status
        """
        model_type_enum = cls.MODEL_TYPE_MAP.get(model_type)
        if not model_type_enum:
            return []

        # Get YAML-defined models
        yaml_models = cls._get_yaml_models(
            provider_config.provider_name, model_type_enum
        )

        # Get model status overrides from database
        model_statuses = cls._get_model_statuses(provider_config, model_type)

        # Get custom models
        custom_models = cls._get_custom_models(provider_config, model_type)

        result = []

        # Process YAML models with their status
        for model_config in yaml_models:
            model_key = model_config.key
            status = model_statuses.get(model_key)

            # Determine if model is active (default True for YAML models)
            is_active = status.is_active if status else True

            if not include_inactive and not is_active:
                continue

            result.append(
                {
                    "key": model_config.key,
                    "label": model_config.label,
                    "model_type": model_type,
                    "features": model_config.features,
                    "model_properties": model_config.model_properties,
                    "parameters_schema": model_config.parameters_schema,
                    "is_active": is_active,
                    "is_custom": False,
                }
            )

        # Add custom models
        for custom in custom_models:
            if not include_inactive and not custom.is_active:
                continue

            # Process parameters schema - expand any template references
            parameters_schema = cls._expand_parameters_schema(
                custom.custom_config.get("parameters_schema", {})
            )

            result.append(
                {
                    "key": custom.model_key,
                    "label": custom.label,
                    "model_type": model_type,
                    "features": custom.custom_config.get("features", []),
                    "model_properties": custom.custom_config.get(
                        "model_properties", {}
                    ),
                    "parameters_schema": parameters_schema,
                    "is_active": custom.is_active,
                    "is_custom": True,
                }
            )

        return result

    @classmethod
    def get_available_models(
        cls, provider_config: ProviderConfig, model_type: str
    ) -> List[Dict[str, Any]]:
        """Get only active models for a provider config."""
        return cls.get_all_models_for_provider(
            provider_config, model_type, include_inactive=False
        )

    @classmethod
    def is_model_available(
        cls, provider_config: ProviderConfig, model_type: str, model_key: str
    ) -> bool:
        """Check if a specific model is available for use."""
        available_models = cls.get_available_models(provider_config, model_type)
        return any(m["key"] == model_key for m in available_models)

    @classmethod
    def set_model_status(
        cls,
        provider_config: ProviderConfig,
        model_type: str,
        model_key: str,
        is_active: bool,
    ) -> ProviderConfigModel:
        """Set the active status for a model."""
        model_status, created = ProviderConfigModel.objects.get_or_create(
            provider_config=provider_config,
            model_key=model_key,
            model_type=model_type,
            defaults={
                "is_active": is_active,
                "is_custom": False,
            },
        )
        if not created:
            model_status.is_active = is_active
            model_status.save(update_fields=["is_active", "updated_at"])
        return model_status

    @classmethod
    def create_custom_model(
        cls,
        provider_config: ProviderConfig,
        model_type: str,
        model_key: str,
        label: str,
        config: Dict[str, Any],
    ) -> ProviderConfigModel:
        """Create a custom user-defined model."""
        return ProviderConfigModel.objects.create(
            provider_config=provider_config,
            model_key=model_key,
            model_type=model_type,
            is_active=True,
            is_custom=True,
            custom_label=label,
            custom_config=config,
        )

    @classmethod
    def update_custom_model(
        cls,
        provider_config_model: ProviderConfigModel,
        label: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None,
        is_active: Optional[bool] = None,
    ) -> ProviderConfigModel:
        """Update a custom model."""
        if not provider_config_model.is_custom:
            raise ValueError("Cannot update non-custom model configuration")

        if label is not None:
            provider_config_model.custom_label = label
        if config is not None:
            provider_config_model.custom_config = config
        if is_active is not None:
            provider_config_model.is_active = is_active

        provider_config_model.save()
        return provider_config_model

    @classmethod
    def delete_custom_model(cls, provider_config_model: ProviderConfigModel) -> bool:
        """Delete a custom model."""
        if not provider_config_model.is_custom:
            raise ValueError("Cannot delete non-custom model")
        provider_config_model.delete()
        return True

    @classmethod
    def _get_yaml_models(
        cls, provider_name: str, model_type: ModelType
    ) -> List[ModelConfig]:
        """Get all YAML-defined models for a provider."""
        try:
            return ModelConfigLoader.load_all_models(provider_name, model_type)
        except Exception as e:
            logger.warning(
                f"Error loading YAML models for {provider_name}/{model_type}: {e}"
            )
            return []

    @classmethod
    def _get_model_statuses(
        cls, provider_config: ProviderConfig, model_type: str
    ) -> Dict[str, ProviderConfigModel]:
        """Get model status overrides from database."""
        statuses = ProviderConfigModel.objects.filter(
            provider_config=provider_config,
            model_type=model_type,
            is_custom=False,
        )
        return {s.model_key: s for s in statuses}

    @classmethod
    def _get_custom_models(
        cls, provider_config: ProviderConfig, model_type: str
    ) -> List[ProviderConfigModel]:
        """Get custom models for a provider config."""
        return list(
            ProviderConfigModel.objects.filter(
                provider_config=provider_config,
                model_type=model_type,
                is_custom=True,
            )
        )

    @classmethod
    def _expand_parameters_schema(cls, schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Expand template references in a parameters schema.

        If a property has 'use_template', it will be expanded using the
        ParametersToSchema class from config.py.

        Args:
            schema: The parameters schema to expand

        Returns:
            Expanded schema with templates resolved
        """
        if not schema or schema.get("type") != "object" or not schema.get("properties"):
            return schema

        properties = schema.get("properties", {})
        has_templates = any(
            isinstance(prop, dict) and "use_template" in prop
            for prop in properties.values()
        )

        if not has_templates:
            return schema

        # Convert properties with templates to parameter_rules format
        parameter_rules = []
        regular_properties = {}
        required = schema.get("required", [])

        for name, prop in properties.items():
            if isinstance(prop, dict) and "use_template" in prop:
                # Convert to parameter_rules format for ParametersToSchema
                rule = {
                    "name": name,
                    "use_template": prop["use_template"],
                }
                # Add any overrides
                if "default" in prop:
                    rule["default"] = prop["default"]
                if "min" in prop:
                    rule["min"] = prop["min"]
                if "max" in prop:
                    rule["max"] = prop["max"]
                if name in required:
                    rule["required"] = True
                parameter_rules.append(rule)
            else:
                regular_properties[name] = prop

        # Expand templates using ParametersToSchema
        if parameter_rules:
            try:
                converter = ParametersToSchema(parameter_rules)
                expanded = converter.to_schema()

                # Merge expanded properties with regular properties
                if expanded.get("properties"):
                    regular_properties.update(expanded["properties"])

                # Merge required fields
                expanded_required = expanded.get("required", [])
                all_required = list(set(required + expanded_required))

                result = {
                    "type": "object",
                    "properties": regular_properties,
                }
                if all_required:
                    result["required"] = all_required

                return result
            except Exception as e:
                logger.warning(f"Error expanding parameter templates: {e}")
                return schema

        return schema


class LLMModelService:
    def __init__(self, provider_config: ProviderConfig, llm_model_key: str):
        self.provider_config: ProviderConfig = provider_config
