"""
This module contains factory classes for creating knowledge base components.
Each factory follows the Factory Method pattern to create the appropriate implementation
based on configuration settings or knowledge base properties.
"""

from abc import abstractmethod, ABC
from typing import Dict, Any, Type, Optional

from django.conf import settings

from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    CharacterTextSplitter,
    TokenTextSplitter,
)
from langchain_openai import OpenAIEmbeddings
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import VectorStore
from langchain_text_splitters import TextSplitter
from opensearchpy import OpenSearch

from common.encryption import decrypt_key
from knowledge_base.interfaces import (
    BaseSummarizer,
    BaseKeywordExtractor,
    BaseFileToMarkdownConverter,
)
from knowledge_base.models import KnowledgeBase, KnowledgeBaseDocument
from knowledge_base.tools.file_to_markdown import (
    FileReaderAsConverter,
    HtmlFileToMarkdownConverter,
    DocxFileToMarkdownConverter,
    CsvFileToMarkdownConverter,
)
from knowledge_base.tools.retrieval_strategies import (
    DenseRetrievalStrategy,
    ContentRetrievalStrategy,
)
from knowledge_base.tools.summarizers import ContextAwareSummarizer, LLMSummarizer

from knowledge_base.tools.keyword_extractors import (
    JiebaKeywordExtractor,
    LLMKeywordExtractor,
)
from knowledge_base.tools.vectore_store import WaterCrawlOpenSearchVectorStore


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
            raise ValueError(f"Text splitter type '{splitter_type}' not supported")

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
            model=knowledge_base.embedding_model.key,
            openai_api_key=decrypt_key(
                knowledge_base.embedding_provider_config.api_key
            ),
            openai_api_base=knowledge_base.embedding_provider_config.base_url
            or "https://api.openai.com/v1",
        )

    @classmethod
    def create_watercrawl_embedding(self, knowledge_base: KnowledgeBase) -> Embeddings:
        try:
            from watercrawl_llm import WaterCrawlEmbeddings
        except ImportError:
            raise ImportError(
                "WaterCrawlEmbeddings is not installed. Please install it first."
            )
        return WaterCrawlEmbeddings(
            model=knowledge_base.embedding_model.key,
            api_key=decrypt_key(knowledge_base.embedding_provider_config.api_key),
            base_url=knowledge_base.embedding_provider_config.base_url,
        )

    @classmethod
    def from_knowledge_base(cls, knowledge_base: KnowledgeBase) -> Embeddings:
        """Create embedding model based on provider type."""
        provider_name = knowledge_base.embedding_provider_config.provider_name
        if provider_name == "openai":
            return cls.create_openai_embedding(knowledge_base)
        if provider_name == "watercrawl":
            return cls.create_watercrawl_embedding(knowledge_base)
        raise ValueError(f"Unsupported embedding provider: {provider_name}")


class VectorStoreFactory(BaseFactory):
    """Factory for creating vector stores."""

    @classmethod
    def create_opensearch_client(cls) -> OpenSearch:
        # Create OpenSearch connection
        opensearch_url = settings.KB_OPENSEARCH_URL
        return OpenSearch(
            hosts=opensearch_url,
            http_compress=True,
            use_ssl=False,
            verify_certs=False,
        )

    @classmethod
    def create_opensearch_store(
        cls, knowledge_base: KnowledgeBase, embedder: Embeddings = None
    ) -> VectorStore:
        """Create OpenSearch vector store."""

        # Create index name from knowledge base ID
        index_name = f"kb_chunks_{knowledge_base.uuid}"

        if embedder:
            strategy = DenseRetrievalStrategy(
                hybrid=True, keyword_importance=1.5, hybrid_alpha=0.7
            )
        else:
            strategy = ContentRetrievalStrategy(keyword_importance=1.5)

        return WaterCrawlOpenSearchVectorStore(
            opensearch_client=cls.create_opensearch_client(),
            index_name=index_name,
            embedding=embedder,
            retrieval_strategy=strategy,
        )

    @classmethod
    def from_knowledge_base(cls, knowledge_base: KnowledgeBase) -> VectorStore:
        """Create a vector store from a knowledge base configuration."""
        vector_store_type = getattr(settings, "KB_VECTOR_STORE_TYPE", "opensearch")

        embedder = None
        if knowledge_base.embedding_provider_config:
            embedder = EmbedderFactory.from_knowledge_base(knowledge_base)

        # Create vector store based on type
        if vector_store_type == "opensearch":
            return cls.create_opensearch_store(knowledge_base, embedder)

        raise ValueError(f"Vector store type '{vector_store_type}' not supported")


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
        summarization_model = knowledge_base.summarization_model

        if summarization_model is None:
            return None

        # Create the appropriate summarizer based on the knowledge base's summarizer_type
        if knowledge_base.summarizer_type == "context_aware":
            return ContextAwareSummarizer(knowledge_base=knowledge_base)
        else:
            return LLMSummarizer(knowledge_base=knowledge_base)


class KeywordExtractorFactory(BaseFactory):
    """Factory for creating keyword extractors."""

    @classmethod
    def from_knowledge_base(cls, knowledge_base: KnowledgeBase) -> BaseKeywordExtractor:
        """Create a keyword extractor from a knowledge base configuration."""

        if knowledge_base.summarization_provider_config:
            return LLMKeywordExtractor.from_knowledge_base(knowledge_base)

        return JiebaKeywordExtractor.from_knowledge_base(knowledge_base)


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

        raise ValueError(f"Unsupported document type: {extension}")
