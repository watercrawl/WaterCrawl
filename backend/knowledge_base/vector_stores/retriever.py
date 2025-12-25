"""
Retriever class for knowledge base queries.
Handles embedding generation and retrieval from vector stores.
"""

from typing import List, Dict, Any, Optional
import logging

from langchain_core.embeddings import Embeddings

from knowledge_base.models import KnowledgeBase, RetrievalSetting
from knowledge_base.factories import (
    EmbedderFactory,
    VectorStoreFactory,
    RerankerFactory,
)
from knowledge_base.vector_stores.base import BaseVectorStore
from knowledge_base.vector_stores.models import Document

logger = logging.getLogger(__name__)


class Retriever:
    """
    Retriever class for querying knowledge bases.
    Handles embedding generation and coordinates with vector stores.
    """

    def __init__(
        self,
        knowledge_base: KnowledgeBase,
        retrieval_setting: Optional[RetrievalSetting] = None,
    ):
        """
        Initialize the retriever.

        Args:
            knowledge_base: KnowledgeBase instance
            retrieval_setting: Optional RetrievalSetting instance
        """
        self.knowledge_base = knowledge_base
        self.retrieval_setting = (
            retrieval_setting or knowledge_base.default_retrieval_setting
        )

        # Create embedder if available
        self.embedder: Optional[Embeddings] = None
        if knowledge_base.embedding_provider_config:
            self.embedder = EmbedderFactory.from_knowledge_base(knowledge_base)

        # Create vector store
        self.vector_store: BaseVectorStore = VectorStoreFactory.from_knowledge_base(
            knowledge_base
        )

    def retrieve(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        """
        Retrieve documents from the knowledge base.

        Args:
            query: Search query text
            filters: Optional metadata filters

        Returns:
            List of retrieved results with content, metadata, and scores
        """
        if not self.retrieval_setting:
            raise ValueError("No retrieval setting available for this knowledge base")

        embed_query = None
        if self.embedder and self.retrieval_setting.retrieval_type in [
            RetrievalSetting.RETRIEVAL_TYPE_VECTOR,
            RetrievalSetting.RETRIEVAL_TYPE_HYBRID,
        ]:
            try:
                embed_query = self.embedder.embed_query(query)
            except Exception as e:
                logger.error(f"Error generating query embedding: {e}")
                # Fallback to text-only search if embedding fails
                raise ValueError(
                    "Vector search requires embeddings but embedding generation failed"
                )

        if (
            self.retrieval_setting.retrieval_type
            == RetrievalSetting.RETRIEVAL_TYPE_HYBRID
        ):
            result = self.hybrid_retrieve(query, embed_query, filters)
        elif (
            self.retrieval_setting.retrieval_type
            == RetrievalSetting.RETRIEVAL_TYPE_VECTOR
        ):
            result = self.semantic_retrieve(embed_query, filters)
        else:
            result = self.text_retrieve(query, filters)

        if self.retrieval_setting.reranker_enabled and result:
            reranker = RerankerFactory.from_retrieval_setting(self.retrieval_setting)
            if reranker:
                result = reranker.rerank(result, query, self.retrieval_setting.top_k)

        return result

    def hybrid_retrieve(
        self, query: str, embed_query, filters: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        hybrid_alpha = self.retrieval_setting.hybrid_alpha
        if self.retrieval_setting.reranker_enabled:
            hybrid_alpha = None

        return self.vector_store.hybrid_search(
            query=query,
            embed_query=embed_query,
            top_k=self.retrieval_setting.top_k,
            hybrid_alpha=hybrid_alpha,
            filters=filters,
        )

    def semantic_retrieve(
        self, embed_query, filters: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        return self.vector_store.vector_search(
            embed_query=embed_query,
            top_k=self.retrieval_setting.top_k,
            filters=filters,
        )

    def text_retrieve(
        self, query: str, filters: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        return self.vector_store.full_text_search(
            query=query, filters=filters, top_k=self.retrieval_setting.top_k
        )
