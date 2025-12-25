"""
This module defines the interfaces (abstract base classes) for the knowledge base components.
These interfaces provide a common API for different implementations of each component.
"""

from abc import ABC, abstractmethod

from knowledge_base.models import KnowledgeBase, KnowledgeBaseDocument
from llm.models import ProviderConfig


class BaseInterface(ABC):
    def __init__(self, knowledge_base: KnowledgeBase):
        self.knowledge_base = knowledge_base


class BaseSummarizer(ABC):
    """
    Interface for summarization models.
    Implementations should handle generating summaries from texts.
    """

    def __init__(
        self,
        knowledge_base: KnowledgeBase,
    ):
        """Initialize the context-aware summarizer.

        Args:
            knowledge_base (KnowledgeBase): The knowledge base instance.
        """
        self.llm_model_key: str = knowledge_base.summarization_model_key
        self.provider_config: ProviderConfig = (
            knowledge_base.summarization_provider_config
        )
        self.knowledge_base: KnowledgeBase = knowledge_base

    @abstractmethod
    def summarize(self, content: str) -> str:
        """Generate a summary from documents."""
        pass


class BaseFileToMarkdownConverter(ABC):
    @classmethod
    @abstractmethod
    def from_knowledge_base(
        cls, knowledge_base: KnowledgeBase
    ) -> "BaseFileToMarkdownConverter":
        pass

    @abstractmethod
    def convert(self, document: KnowledgeBaseDocument) -> str:
        pass
