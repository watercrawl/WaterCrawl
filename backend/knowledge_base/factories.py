"""
This module contains factory classes for creating knowledge base components.
Each factory follows the Factory Method pattern to create the appropriate implementation
based on configuration settings or knowledge base properties.
"""

from abc import abstractmethod, ABC
from typing import Dict, Any, Type, Optional

from django.conf import settings
from django.utils.translation import gettext as _
from langchain_cohere import CohereEmbeddings

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    CharacterTextSplitter,
    TokenTextSplitter,
)
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.embeddings import Embeddings
from langchain_text_splitters import TextSplitter

from common.encryption import decrypt_key
from llm import consts as llm_consts
from knowledge_base import consts
from knowledge_base.tools.interfaces import (
    BaseSummarizer,
    BaseFileToMarkdownConverter,
)
from knowledge_base.models import KnowledgeBase, KnowledgeBaseDocument, RetrievalSetting
from knowledge_base.tools.file_to_markdown import (
    FileReaderAsConverter,
    HtmlFileToMarkdownConverter,
    DocxFileToMarkdownConverter,
    CsvFileToMarkdownConverter,
)
from knowledge_base.tools.summarizers import ContextAwareSummarizer, LLMSummarizer

from knowledge_base.vector_stores.opensearch import OpenSearchVectorStore
from knowledge_base.vector_stores.base import BaseVectorStore, BaseReranker
from knowledge_base.vector_stores.postgres import PostgresVectorStore
from knowledge_base.vector_stores.weaviate import WeaviateVectorStore
from llm.models_config.cohere.cohere import CohereReranker


class BaseFactory(ABC):
    @classmethod
    @abstractmethod
    def from_knowledge_base(cls, knowledge_base: KnowledgeBase) -> Any:
        raise NotImplementedError


class TextSplitterFactory(BaseFactory):
    """Factory for creating text splitters."""

    # Register available text splitters
    _text_splitters: Dict[str, Type[TextSplitter]] = {
        "recursive": RecursiveCharacterTextSplitter,
        "character": CharacterTextSplitter,
        "token": TokenTextSplitter,
    }

    @classmethod
    def create(cls, splitter_type: str, **kwargs) -> TextSplitter:
        """Create a text splitter instance."""
        if splitter_type not in cls._text_splitters:
            raise ValueError(
                _("Text splitter type '{splitter_type}' not supported").format(
                    splitter_type=splitter_type
                )
            )

        return cls._text_splitters[splitter_type](**kwargs)

    @classmethod
    def from_knowledge_base(cls, knowledge_base: KnowledgeBase) -> TextSplitter:
        """Create a text splitter from a knowledge base configuration."""
        # Default to recursive character text splitter if not specified
        splitter_type = getattr(settings, "KB_TEXT_SPLITTER_TYPE", "recursive")

        return cls.create(
            splitter_type,
            chunk_size=knowledge_base.chunk_size,
            chunk_overlap=knowledge_base.chunk_overlap,
        )


class EmbedderFactory(BaseFactory):
    """Factory for creating embedding models."""

    @classmethod
    def create_openai_embedding(self, knowledge_base: KnowledgeBase) -> Embeddings:
        return OpenAIEmbeddings(
            model=knowledge_base.embedding_model_key,
            openai_api_key=decrypt_key(
                knowledge_base.embedding_provider_config.api_key
            ),
            openai_api_base=knowledge_base.embedding_provider_config.base_url
            or "https://api.openai.com/v1",
        )

    @classmethod
    def create_cohere_embedding(cls, knowledge_base: KnowledgeBase) -> Embeddings:
        return CohereEmbeddings(
            model=knowledge_base.embedding_model_key,
            cohere_api_key=decrypt_key(
                knowledge_base.embedding_provider_config.api_key
            ),
        )

    @classmethod
    def create_google_genai_embedding(cls, knowledge_base: KnowledgeBase) -> Embeddings:
        return GoogleGenerativeAIEmbeddings(
            model=knowledge_base.embedding_model_key,
            google_api_key=decrypt_key(
                knowledge_base.embedding_provider_config.api_key
            ),
        )

    @classmethod
    def from_knowledge_base(cls, knowledge_base: KnowledgeBase) -> Embeddings:
        """Create embedding model based on provider type."""
        provider_name = knowledge_base.embedding_provider_config.provider_name
        match provider_name:
            case llm_consts.LLM_PROVIDER_GOOGLE_GENAI:
                return cls.create_google_genai_embedding(knowledge_base)
            case llm_consts.LLM_PROVIDER_OPENAI:
                return cls.create_openai_embedding(knowledge_base)
            case llm_consts.LLM_PROVIDER_COHERE:
                return cls.create_cohere_embedding(knowledge_base)
            case _:
                raise ValueError(
                    _("Unsupported embedding provider: {provider_name}").format(
                        provider_name=provider_name
                    )
                )


class VectorStoreFactory(BaseFactory):
    """Factory for creating vector stores."""

    @classmethod
    def _get_vector_store_type_by_name(cls, name) -> Type[BaseVectorStore]:
        match name:
            case consts.VECTOR_STORE_OPENSEARCH:
                return OpenSearchVectorStore
            case consts.VECTOR_STORE_POSTGRES:
                return PostgresVectorStore
            case consts.VECTOR_STORE_WEAVIATE:
                return WeaviateVectorStore
        raise ValueError(_("Unsupported vector store type: {name}").format(name=name))

    @classmethod
    def from_knowledge_base(cls, knowledge_base: KnowledgeBase) -> BaseVectorStore:
        """Create a vector store from a knowledge base configuration."""
        # Use knowledge base's vector_store_type, fallback to settings
        vector_store_type = knowledge_base.vector_store_type

        # Create vector store based on type
        vector_store_type = cls._get_vector_store_type_by_name(vector_store_type)
        return vector_store_type(knowledge_base)

    @classmethod
    def initialize_vector_store(cls):
        vector_store_type = cls._get_vector_store_type_by_name(
            settings.KNOWLEDGE_BASE_VECTOR_STORE_TYPE
        )
        vector_store_type.initialize()


class SummarizerFactory(BaseFactory):
    """Factory for creating summarizers."""

    @classmethod
    def from_knowledge_base(
        cls, knowledge_base: KnowledgeBase
    ) -> Optional[BaseSummarizer]:
        """Create a summarizer from a knowledge base configuration.

        Returns:
            BaseSummarizer or None if no summarization model is specified.
        """
        # Use the summarization model from the knowledge base if specified
        summarization_model = knowledge_base.summarization_model_key

        if summarization_model is None:
            return None

        # Create the appropriate summarizer based on the knowledge base's summarizer_type
        if knowledge_base.summarizer_type == "context_aware":
            return ContextAwareSummarizer(knowledge_base=knowledge_base)
        else:
            return LLMSummarizer(knowledge_base=knowledge_base)


class FileToMarkdownFactory:
    """Factory for creating document to text converters."""

    @classmethod
    def from_knowledge_base_document(
        cls, knowledge_base_document: KnowledgeBaseDocument
    ) -> BaseFileToMarkdownConverter:
        """Create a document to text converter from a knowledge base configuration.
        I used document in this factory to can decide which converter to use
        for now just support simple for extraction form markdown, html, text
        in future we can support images and other file formats as well
        """

        extension = knowledge_base_document.source.split(".")[-1].lower()
        match extension:
            case "md" | "txt" | "text":
                return FileReaderAsConverter.from_knowledge_base(
                    knowledge_base_document.knowledge_base
                )
            case "html":
                return HtmlFileToMarkdownConverter.from_knowledge_base(
                    knowledge_base_document.knowledge_base
                )
            case "docx":
                return DocxFileToMarkdownConverter.from_knowledge_base(
                    knowledge_base_document.knowledge_base
                )
            case "csv":
                return CsvFileToMarkdownConverter.from_knowledge_base(
                    knowledge_base_document.knowledge_base
                )

        raise ValueError(
            _("Unsupported document type: {extension}").format(extension=extension)
        )


class RerankerFactory:
    """Factory for creating rerankers."""

    @classmethod
    def from_retrieval_setting(
        cls, retrieval_setting: RetrievalSetting
    ) -> BaseReranker:
        """
        Create reranker from retrieval setting.

        Args:
            retrieval_setting: RetrievalSetting instance

        Returns:
            Reranker instance or None if reranking is disabled
        """
        provider_name = retrieval_setting.reranker_provider_config.provider_name
        model_key = retrieval_setting.reranker_model_key

        if provider_name == llm_consts.LLM_PROVIDER_COHERE:
            return CohereReranker(
                model_key=model_key,
                provider_config=retrieval_setting.reranker_provider_config,
            )
        else:
            raise ValueError(f"Unsupported reranker provider: {provider_name}")
