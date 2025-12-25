"""
Base vector store interface for WaterCrawl.
All vector store implementations should inherit from this class.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import logging

from knowledge_base.vector_stores.models import Document
from knowledge_base.vector_stores.reranker import WeightedScoreReranker
from llm.models_config.config import ModelConfigLoader, ModelType

logger = logging.getLogger(__name__)


class BaseReranker(ABC):
    """Base class for rerankers."""

    @abstractmethod
    def rerank(
        self, results: List[Document], query: str, top_k: int
    ) -> List[Dict[str, Any]]:
        """
        Rerank search results based on query.

        Args:
            results: List of search results with content and metadata
            query: Original query text

        Returns:
            Reranked results
        """
        pass


class BaseVectorStore(ABC):
    """Base class for all vector store implementations."""

    def __init__(self, knowledge_base):
        """
        Initialize the vector store.

        Args:
            knowledge_base: KnowledgeBase instance
        """
        self.knowledge_base = knowledge_base

    @classmethod
    @abstractmethod
    def initialize(cls):
        """Initialize the vector store."""
        pass

    def _get_embedding_dimension(self) -> int:
        """Get embedding dimension from model config."""
        embedding_dim = 1536
        try:
            if (
                self.knowledge_base.embedding_model_key
                and self.knowledge_base.embedding_provider_config
            ):
                provider_name = (
                    self.knowledge_base.embedding_provider_config.provider_name
                )
                model_key = self.knowledge_base.embedding_model_key

                loader = ModelConfigLoader(
                    provider_name=provider_name,
                    model_type=ModelType.EMBEDDING,
                    model_name=model_key,
                )
                model_config = loader.load()

                dimension = model_config.model_properties.get("dimension")
                if dimension:
                    embedding_dim = dimension
                    logger.info(
                        f"Loaded embedding dimension {embedding_dim} from model config for {provider_name}/{model_key}"
                    )
                else:
                    logger.warning(
                        f"No dimension found in model_properties for {provider_name}/{model_key}, using default {embedding_dim}"
                    )
            else:
                logger.warning(
                    f"No embedding model configured for knowledge base {self.knowledge_base.uuid}, using default dimension {embedding_dim}"
                )
        except Exception as e:
            logger.warning(
                f"Error loading embedding dimension from model config: {e}, using default {embedding_dim}"
            )

        return embedding_dim

    def create_vector_store(self):
        """Create the vector store."""
        pass

    @abstractmethod
    def index_chunks(self, chunks: List[Any]) -> List[str]:
        """
        Index chunks into the vector store.

        Args:
            chunks: List of KnowledgeBaseChunk instances or chunk data

        Returns:
            List of chunk IDs that were indexed
        """
        pass

    @abstractmethod
    def delete_chunks(self, chunk_ids: List[str]) -> bool:
        """
        Delete chunks from the vector store.

        Args:
            chunk_ids: List of chunk UUIDs to delete

        Returns:
            True if successful
        """
        pass

    @abstractmethod
    def reindex_all(self) -> int:
        """
        Reindex all chunks for this knowledge base.

        Returns:
            Number of chunks reindexed
        """
        pass

    @abstractmethod
    def delete_all(self) -> bool:
        """
        Delete all chunks for this knowledge base from the vector store.

        Returns:
            True if successful
        """
        pass

    def hybrid_search(
        self,
        query: str,
        embed_query: List[float],
        top_k: int,
        hybrid_alpha: Optional[float] = 0.5,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        """
        Perform hybrid search combining vector and full-text search.
        This is a concrete implementation that uses vector_search and full_text_search.

        Args:
            query: Text query for full-text search
            embed_query: Embedding vector for vector search
            top_k: Maximum number of results to return (only used if hybrid_alpha is provided)
            hybrid_alpha: Weight for semantic search (0.0-1.0). If None, returns combined results without reranking.
            filters: Optional metadata filters

        Returns:
            List of Document objects. If hybrid_alpha is None, returns all combined results.
            If hybrid_alpha is provided, returns at most top_k results.
        """

        # Get more results from each method to combine
        vector_results = self.vector_search(embed_query, top_k * 3, filters)
        text_results = self.full_text_search(query, top_k * 3, filters)

        # If hybrid_alpha is None, return combined results without reranking
        if hybrid_alpha is None:
            # Combine results by chunk_id, keeping all unique results
            combined_map = {}

            # Add text results first
            for result in text_results:
                if result.chunk_id:
                    combined_map[result.chunk_id] = result

            # Add vector results, combining scores if chunk already exists
            for result in vector_results:
                if result.chunk_id:
                    if result.chunk_id in combined_map:
                        # Combine scores (simple average if both exist)
                        existing_score = combined_map[result.chunk_id].score or 0.0
                        new_score = result.score or 0.0
                        combined_map[result.chunk_id].score = (
                            existing_score + new_score
                        ) / 2.0
                    else:
                        combined_map[result.chunk_id] = result

            # Return all combined results (no top_k filtering)
            return list(combined_map.values())

        # If hybrid_alpha is provided, use WeightedScoreReranker and return top_k results
        reranker = WeightedScoreReranker(
            semantic_weight=hybrid_alpha, text_weight=1 - hybrid_alpha
        )

        return reranker.rerank(vector_results, text_results, top_k)

    @abstractmethod
    def vector_search(
        self,
        embed_query: List[float],
        top_k: int,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        pass

    @abstractmethod
    def full_text_search(
        self, query, top_k: int, filters: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        pass
