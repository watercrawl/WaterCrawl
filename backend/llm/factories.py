from typing import Optional

from django.utils.translation import gettext as _
from langchain_anthropic import ChatAnthropic
from langchain_cohere import ChatCohere
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from langchain_core.language_models import BaseChatModel

from common.encryption import decrypt_key
from llm import consts
from llm.models import ProviderConfig


class ChatModelFactory:
    """
    Factory class for creating language models using different providers.

    Support both the legacy LanguageModel approach and the new ProviderConfig approach.
    """

    @classmethod
    def create_chat_model_from_provider_config(
        cls,
        provider_config: ProviderConfig,
        llm_model_key: str,
        llm_config: Optional[dict] = None,
    ) -> BaseChatModel:
        """
        Create a chat model from a Model and ProviderConfig.

        Args:
            provider_config: The provider configuration with API key and settings
            llm_model_key: The Model instance containing provider and model information
            llm_config: Optional configuration parameters for the model

        Returns:
            A LangChain chat model instance
        """
        llm_config = llm_config or {}
        if not provider_config:
            raise ValueError(_("Provider config is required"))

        api_key = (
            decrypt_key(provider_config.api_key) if provider_config.api_key else None
        )
        api_base = provider_config.base_url

        match provider_config.provider_name:
            case consts.LLM_PROVIDER_OPENAI:
                return ChatOpenAI(
                    model=llm_model_key,
                    openai_api_key=api_key,
                    openai_api_base=api_base or "https://api.openai.com/v1",
                    **llm_config,
                )
            case consts.LLM_PROVIDER_ANTHROPIC:
                anthropic_kwargs = {
                    "model": llm_model_key,
                    "anthropic_api_key": api_key,
                    **llm_config,
                }
                if api_base:
                    anthropic_kwargs["anthropic_api_url"] = api_base
                return ChatAnthropic(**anthropic_kwargs)
            case consts.LLM_PROVIDER_GOOGLE_GENAI:
                return ChatGoogleGenerativeAI(
                    model=llm_model_key, google_api_key=api_key, **llm_config
                )
            case consts.LLM_PROVIDER_COHERE:
                return ChatCohere(
                    model=llm_model_key, cohere_api_key=api_key, **llm_config
                )
            case consts.LLM_PROVIDER_OLLAMA:
                if api_key:
                    kwargs = {"headers": {"Authorization": f"Bearer {api_key}"}}
                else:
                    kwargs = {}
                return ChatOllama(
                    base_url=api_base,
                    model=llm_model_key,
                    client_kwargs=kwargs,
                    **llm_config,
                )
            case _:
                raise ValueError(
                    _("Unsupported provider: {provider_name}").format(
                        provider_name=provider_config.provider_name
                    )
                )
