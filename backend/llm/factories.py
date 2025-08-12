from typing import Optional

from langchain_community.chat_models import ChatOpenAI
from langchain_core.language_models import BaseChatModel

from common.encryption import decrypt_key
from llm.interfaces import BaseProvider
from llm.models import LLMModel, ProviderConfig
from llm.providers import OpenAIProvider, WaterCrawlProvider


class ChatModelFactory:
    """
    Factory class for creating language models using different providers.

    Support both the legacy LanguageModel approach and the new ProviderConfig approach.
    """

    @classmethod
    def create_chat_model_from_provider_config(
        cls,
        model: LLMModel,
        provider_config: Optional[ProviderConfig] = None,
        temperature=None,
    ) -> BaseChatModel:
        """
        Create a chat model from a Model and ProviderConfig.

        Args:
            model: The Model instance containing provider and model information
            provider_config: The provider configuration with API key and settings

        Returns:
            A LangChain chat model instance
        """
        if not provider_config:
            raise ValueError("Provider config is required")

        provider_name = model.provider_name
        model_name = model.key  # Use key as it's the actual API model name
        api_key = decrypt_key(provider_config.api_key)
        api_base = provider_config.base_url

        if provider_name == "openai":
            kwargs = {}
            if temperature is not None:
                kwargs["temperature"] = temperature

            return ChatOpenAI(
                model=model_name,
                openai_api_key=api_key,
                openai_api_base=api_base or "https://api.openai.com/v1",
                **kwargs,
            )

        elif provider_name == "watercrawl":
            try:
                from watercrawl_llm import ChatWaterCrawl
            except ImportError:
                raise ImportError("WaterCrawlLLM is not installed. Please install it")

            kwargs = {}
            return ChatWaterCrawl(
                model=model_name, api_key=api_key, base_url=api_base, **kwargs
            )

        else:
            raise ValueError(f"Unsupported provider: {provider_name}")


class ProviderFactory:
    """Factory for creating providers."""

    @classmethod
    def from_provider_config(cls, provider_config: ProviderConfig) -> BaseProvider:
        if provider_config.provider_name == "openai":
            return OpenAIProvider(
                config={
                    "api_key": decrypt_key(provider_config.api_key),
                    "base_url": provider_config.base_url,
                }
            )
        elif provider_config.provider_name == "watercrawl":
            return WaterCrawlProvider(
                config={
                    "api_key": decrypt_key(provider_config.api_key),
                    "base_url": provider_config.base_url,
                }
            )
        raise ValueError(f"Unsupported provider: {provider_config.provider_name}")
