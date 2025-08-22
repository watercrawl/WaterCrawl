"""
This module contains implementations of summarizers for generating document summaries.
"""

from langchain_core.prompts import PromptTemplate

from knowledge_base.interfaces import BaseSummarizer
from llm.factories import ChatModelFactory
from llm.models import LLMModel, ProviderConfig


class LLMSummarizer(BaseSummarizer):
    """Summarizer using a language model."""

    def summarize(self, content: str) -> str:
        """Generate a summary from documents."""

        llm = ChatModelFactory.create_chat_model_from_provider_config(
            llm_model=self.language_model,
            provider_config=self.provider_config,
            temperature=self.knowledge_base.summarizer_temperature,
        )

        prompt = PromptTemplate.from_template(
            "Summarize the following text in a concise paragraph maximally 50 words:\n\n{text}"
        )

        result = llm.invoke(prompt.format(text=content[:100000]))
        return result.content


class ContextAwareSummarizer(BaseSummarizer):
    """Context-aware summarizer that considers knowledge base context."""

    def summarize(self, content: str) -> str:
        """Generate a context-aware summary from documents."""
        context_info = self.knowledge_base.summarizer_context

        # Create LLM instance with provider_config
        llm = ChatModelFactory.create_chat_model_from_provider_config(
            llm_model=self.language_model,
            provider_config=self.provider_config,
            temperature=self.knowledge_base.summarizer_temperature,
        )

        # Create a context-enhanced summarization prompt
        context_prompt = PromptTemplate.from_template(
            "Summarize the following text in a concise paragraph maximally 50 words, "
            "while taking into account the following context information:\n\n"
            "{context_info}\n\n"
            "Text:\n\n"
            "{text}"
        )

        # Invoke the LLM with the context-enhanced prompt
        result = llm.invoke(
            context_prompt.format(text=content[:10000], context_info=context_info)
        )
        return result.content


class ContextAwareEnhancerService:
    def __init__(
        self,
        llm_model: LLMModel,
        provider_config: ProviderConfig,
        temperature: float = None,
    ):
        self.llm_model: LLMModel = llm_model
        self.provider_config: ProviderConfig = provider_config
        self.temperature: float = temperature

    def enhance_context(self, context: str) -> str:
        llm = ChatModelFactory.create_chat_model_from_provider_config(
            llm_model=self.llm_model,
            provider_config=self.provider_config,
            temperature=self.temperature,
        )
        enhancer_prompt = PromptTemplate(
            input_variables=["user_goal"],
            template="""You are an expert knowledge architect.

Given a user-submitted goal about how they want to use a knowledge base, your job is to enhance that goal by making it more specific, actionable, and clear — while staying true to the user's intent.

Enhance the following goal:

"{user_goal}"

Respond with only the enhanced goal. The given text must be short and to the point.
""",
        )
        result = llm.invoke(enhancer_prompt.format(user_goal=context))
        return result.content
