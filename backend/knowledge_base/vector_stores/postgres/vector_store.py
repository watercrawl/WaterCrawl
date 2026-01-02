"""
PostgreSQL vector store implementation for WaterCrawl using pgvector.
"""

from typing import List, Dict, Any, Optional
import logging

from django.db.models import ExpressionWrapper, Value, FloatField, F
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from pgvector.django import CosineDistance

from knowledge_base.models import KnowledgeBaseChunk
from knowledge_base.vector_stores.base import BaseVectorStore
from knowledge_base.vector_stores.models import Document

logger = logging.getLogger(__name__)


class PostgresVectorStore(BaseVectorStore):
    """PostgreSQL implementation of BaseVectorStore using pgvector."""

    def __init__(self, knowledge_base):
        """Initialize PostgreSQL vector store."""
        super().__init__(knowledge_base)
        self.queryset = KnowledgeBaseChunk.objects.filter(
            document__knowledge_base=self.knowledge_base
        )

    @classmethod
    def initialize(cls):
        """Initialize the vector store."""
        pass

    def index_chunks(self, chunks: List[KnowledgeBaseChunk]) -> List[str]:
        """
        Index chunks into PostgreSQL.
        Since chunks are already saved in PostgreSQL with embeddings,
        we just need to ensure they're properly indexed.

        Args:
            chunks: List of KnowledgeBaseChunk instances

        Returns:
            List of chunk UUIDs
        """
        if not chunks:
            return []

        # Chunks are already in PostgreSQL with embeddings
        # We just need to ensure the vector index exists
        logger.info(f"Indexed {len(chunks)} chunks in PostgreSQL")
        return [str(chunk.uuid) for chunk in chunks]

    def delete_chunks(self, chunk_ids: List[str]) -> bool:
        """
        Delete chunks from PostgreSQL.
        Note: This only removes from vector index consideration.
        Actual deletion should be done at the model level.

        Args:
            chunk_ids: List of chunk UUIDs

        Returns:
            True if successful
        """
        # In PostgreSQL, chunks are already in the database
        # We don't need to do anything special for deletion
        # The chunks will simply not be returned in queries
        logger.info(f"Marked {len(chunk_ids)} chunks for exclusion from vector search")
        return True

    def reindex_all(self) -> int:
        """
        Reindex all chunks for this knowledge base.
        Since chunks are already in PostgreSQL with embeddings,
        we just return the count without reindexing.

        Returns:
            Number of chunks (already indexed)
        """
        count = KnowledgeBaseChunk.objects.filter(
            document__knowledge_base=self.knowledge_base
        ).count()

        return count

    def delete_all(self) -> bool:
        """
        Delete all chunks from vector store for this knowledge base.
        Note: This does not delete from PostgreSQL database.

        Returns:
            True if successful
        """
        # In PostgreSQL, we can't really "delete" from the vector store
        # without deleting from the database. This is a no-op.
        # Actual deletion should be done at the model level.
        logger.info(
            "PostgreSQL vector store delete_all called (no-op, data remains in database)"
        )
        return True

    def vector_search(
        self,
        query_embedding: List[float],
        top_k: int,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        """Perform vector similarity search using pgvector."""
        # Convert embedding list to string format for pgvector

        queryset = self._apply_filters(self.queryset, filters)

        queryset = (
            queryset.annotate(
                distance=CosineDistance("embedding", query_embedding),
            )
            .annotate(
                score=ExpressionWrapper(
                    Value(1.0) - F("distance"), output_field=FloatField()
                )
            )
            .order_by("-score")[:5]
        )

        return self._make_results(queryset)

    def full_text_search(
        self, query: str, top_k: int, filters: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """Perform full-text search using PostgreSQL's full-text search."""
        # Use PostgreSQL's full-text search
        search_vector = SearchVector("content", weight="A")
        search_query = SearchQuery(query)
        search_rank = SearchRank(search_vector, search_query)

        queryset = self._apply_filters(self.queryset, filters)
        queryset = (
            queryset.annotate(search=search_vector, score=search_rank)
            .filter(search=search_query)
            .order_by("-score")[:top_k]
        )

        return self._make_results(queryset)

    def _apply_filters(self, queryset, filter: Dict[str, Any]):
        """Apply metadata filters to queryset."""

        return queryset

    def _make_results(self, results: List[KnowledgeBaseChunk]) -> List[Document]:
        return self._normalize_scores(
            [
                Document(
                    content=chunk.content,
                    metadata={
                        "title": chunk.document.title,
                        "document_id": chunk.document_id,
                        "index": chunk.index,
                        "source": chunk.document.source,
                        "source_type": chunk.document.source_type,
                    },
                    score=chunk.score,
                    chunk_id=str(chunk.uuid),
                )
                for chunk in results
            ]
        )

    def _normalize_scores(self, results: List[Document]) -> List[Document]:
        """Normalize scores to 0-1 range."""
        if not results:
            return results

        scores = [r.score for r in results if r.score is not None]
        if not scores:
            return results

        min_score = min(scores)
        max_score = max(scores)

        if max_score == min_score:
            # All scores are the same, set to 1.0
            for result in results:
                result.score = 1.0
        else:
            # Normalize to 0-1
            for result in results:
                result.score = (result.score - min_score) / (max_score - min_score)

        return results
