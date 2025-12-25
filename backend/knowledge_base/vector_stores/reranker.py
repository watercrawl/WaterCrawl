"""
Reranker implementations for WaterCrawl knowledge base retrieval.
"""

from typing import List
import logging

from knowledge_base.vector_stores.models import Document

logger = logging.getLogger(__name__)


class WeightedScoreReranker:
    """Weighted score reranker that combines semantic and keyword scores."""

    def __init__(self, semantic_weight: float = 0.7, text_weight: float = 0.3):
        """
        Initialize weighted score reranker.

        Args:
            semantic_weight: Weight for semantic similarity (0.0-1.0)
            text_weight: Weight for keyword matching (0.0-1.0)
        """
        self.semantic_weight = semantic_weight
        self.text_weight = text_weight

    def rerank(
        self,
        semantic_results: List[Document],
        keywork_results: List[Document],
        top_k: int,
    ) -> List[Document]:
        """Rerank results using weighted scores."""
        if not keywork_results and not semantic_results:
            return []
        if not keywork_results:
            return semantic_results[:top_k]
        if not semantic_results:
            return keywork_results[:top_k]

        # Calculate combined scores
        scored_results = {}
        for result in keywork_results:
            text_score = result.score or 0.0
            chunk_id = result.chunk_id

            scored_results[chunk_id] = Document(
                content=result.content,
                metadata=result.metadata,
                score=text_score * self.text_weight,
                chunk_id=chunk_id,
            )

        for result in semantic_results:
            semantic_score = result.score or 0.0
            chunk_id = result.chunk_id

            if chunk_id in scored_results:
                # Combine scores
                scored_results[chunk_id].score = (
                    scored_results[chunk_id].score or 0.0
                ) + (semantic_score * self.semantic_weight)
            else:
                scored_results[chunk_id] = Document(
                    content=result.content,
                    metadata=result.metadata,
                    score=semantic_score * self.semantic_weight,
                    chunk_id=chunk_id,
                )

        # Sort by combined score and return top_k
        sorted_results = sorted(
            scored_results.values(), key=lambda x: x.score or 0.0, reverse=True
        )
        return sorted_results[:top_k]
