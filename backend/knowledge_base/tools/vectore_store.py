from langchain.vectorstores.base import VectorStore
from langchain.schema import Document
from langchain.embeddings.base import Embeddings
from typing import List, Optional, Dict, Any, Tuple
from opensearchpy import OpenSearch
import uuid
import logging
import numpy as np

from .retrieval_strategies import RetrievalStrategy, DenseRetrievalStrategy

logger = logging.getLogger(__name__)


class WaterCrawlOpenSearchVectorStore(VectorStore):
    """OpenSearch vector store implementation for LangChain with pluggable retrieval strategies."""

    def __init__(
        self,
        opensearch_client: OpenSearch,
        index_name: str,
        embedding: Embeddings,
        retrieval_strategy: Optional[RetrievalStrategy] = None,
        text_field: str = "text",
        vector_field: str = "vector_field",
        similarity_metric: str = "l2",
    ):
        """
        Initialize the OpenSearch vector store.

        Args:
            opensearch_client: OpenSearch client instance
            index_name: Name of the index to use
            embedding: Embedding model to use for vectorization
            retrieval_strategy: Strategy for search retrieval (query builder)
            text_field: Field name for storing text content
            vector_field: Field name for storing vectors
            similarity_metric: Similarity metric for vector search (l2, cosinesimil, innerproduct)
        """
        self.client = opensearch_client
        self.index_name = index_name
        self.embedding = embedding
        self.text_field = text_field
        self.vector_field = vector_field
        self.similarity_metric = similarity_metric

        # Use provided strategy or default to DenseRetrievalStrategy
        if retrieval_strategy is None:
            self.retrieval_strategy = DenseRetrievalStrategy(
                keyword_importance=1.5, hybrid=False, hybrid_alpha=0.7
            )
        else:
            self.retrieval_strategy = retrieval_strategy

        # Ensure index exists with proper mapping
        self._create_index_if_not_exists()

    def _create_index_if_not_exists(self):
        """Create the OpenSearch index with proper mapping if it doesn't exist."""
        try:
            if not self.client.indices.exists(index=self.index_name):
                logger.info(f"Creating index {self.index_name}")

                # Auto-detect vector dimensions by generating a test embedding
                detected_dimensions = 0
                if isinstance(self.embedding, Embeddings):
                    test_embedding = self.embedding.embed_query("test")
                    detected_dimensions = len(test_embedding)

                # Use detected dimensions instead of default
                mapping = self.retrieval_strategy.get_index_mapping(
                    vector_field=self.vector_field,
                    vector_dimension=detected_dimensions,
                    similarity_metric=self.similarity_metric,
                )

                self.client.indices.create(index=self.index_name, body=mapping)
                logger.info(
                    f"Created index {self.index_name} with {detected_dimensions}D vectors and mapping"
                )
            else:
                logger.info(f"Index {self.index_name} already exists")

        except Exception as e:
            logger.error(f"Error creating index: {e}")
            raise

    def add_texts(
        self,
        texts: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> List[str]:
        """
        Add texts to the vector store.

        Args:
            texts: List of texts to add
            metadatas: List of metadata dicts for each text
            ids: List of document IDs (UUIDs generated if not provided)

        Returns:
            List of document IDs
        """
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in texts]

        if metadatas is None:
            metadatas = [{}] * len(texts)

        # Generate embeddings for all texts
        if self.embedding:
            embeddings = self.embedding.embed_documents(texts)
        else:
            embeddings = [None] * len(texts)

        # Prepare documents for bulk indexing
        documents = []
        for i, (text, metadata, doc_id, embedding) in enumerate(
            zip(texts, metadatas, ids, embeddings)
        ):
            doc = {"doc_id": doc_id, self.text_field: text, "metadata": metadata}
            if embedding is not None:
                doc[self.vector_field] = embedding
            documents.append({"_index": self.index_name, "_id": doc_id, "_source": doc})

        # Bulk index documents
        from opensearchpy.helpers import bulk

        try:
            bulk(self.client, documents)
            logger.info(f"Added {len(texts)} documents to index {self.index_name}")
        except Exception as e:
            logger.error(f"Error adding documents to OpenSearch: {e}")
            raise

        return ids

    def similarity_search(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None,
        keywords: Optional[List[str]] = None,
        **kwargs: Any,
    ) -> List[Document]:
        """
        Perform similarity search using query text.

        Args:
            query: Query text
            k: Number of results to return
            filter: Optional filter dict for metadata
            keywords: List of keywords to boost

        Returns:
            List of Document objects
        """
        # Generate embedding for query if needed by the strategy
        query_vector = None
        if isinstance(self.retrieval_strategy, DenseRetrievalStrategy):
            query_vector = self.embedding.embed_query(query)

        # Build query using the retrieval strategy
        opensearch_query = self.retrieval_strategy.opensearch_query(
            query_vector=query_vector,
            query_text=query,
            k=k,
            keywords=keywords,
            filter=filter,
            text_field=self.text_field,
            vector_field=self.vector_field,
        )

        try:
            response = self.client.search(index=self.index_name, body=opensearch_query)
            documents = []

            for hit in response["hits"]["hits"]:
                source = hit["_source"]
                doc = Document(
                    page_content=source[self.text_field],
                    metadata=source.get("metadata", {}),
                )
                documents.append(doc)

            # Apply keyword post-processing if needed
            if keywords and self.retrieval_strategy.keyword_importance > 0:
                documents = self._apply_keyword_scoring(documents, keywords, k)

            return documents[:k]

        except Exception as e:
            logger.error(f"Error performing similarity search: {e}")
            raise

    def _apply_keyword_scoring(
        self, documents: List[Document], keywords: List[str], k: int
    ) -> List[Document]:
        """Apply keyword-based scoring and re-ranking."""
        if not keywords:
            return documents

        scored_docs = []
        for doc in documents:
            keyword_score = self._calculate_keyword_score(
                doc.metadata.get("keywords", []), keywords
            )
            scored_docs.append((doc, keyword_score))

        # Sort by keyword score and return
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        return [doc for doc, __ in scored_docs]

    def _calculate_keyword_score(
        self, doc_keywords: List[str], query_keywords: List[str]
    ) -> float:
        """Calculate keyword match score between document keywords and query keywords."""
        if not doc_keywords or not query_keywords:
            return 0.0

        # Convert to sets for intersection calculation
        doc_kw_set = set(kw.lower().strip() for kw in doc_keywords)
        query_kw_set = set(kw.lower().strip() for kw in query_keywords)

        # Calculate intersection
        intersection = doc_kw_set.intersection(query_kw_set)

        if not intersection:
            return 0.0

        # Calculate score based on intersection size and document keyword count
        intersection_score = len(intersection) / len(doc_kw_set)
        coverage_score = len(intersection) / len(query_kw_set)

        # Combine intersection and coverage scores
        return (intersection_score + coverage_score) / 2

    def similarity_search_with_score(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> List[Tuple[Document, float]]:
        """
        Perform similarity search with scores.

        Args:
            query: Query text
            k: Number of results to return
            filter: Optional filter dict for metadata

        Returns:
            List of (Document, score) tuples
        """
        # Generate embedding for query if needed by the strategy
        query_vector = None
        if isinstance(self.retrieval_strategy, DenseRetrievalStrategy):
            query_vector = self.embedding.embed_query(query)

        # Build query using the retrieval strategy
        opensearch_query = self.retrieval_strategy.opensearch_query(
            query_vector=query_vector,
            query_text=query,
            k=k,
            filter=filter,
            text_field=self.text_field,
            vector_field=self.vector_field,
        )

        try:
            response = self.client.search(index=self.index_name, body=opensearch_query)
            documents = []

            for hit in response["hits"]["hits"]:
                source = hit["_source"]
                doc = Document(
                    page_content=source[self.text_field],
                    metadata=source.get("metadata", {}),
                )
                score = hit["_score"]
                documents.append((doc, score))

            return documents[:k]

        except Exception as e:
            logger.error(f"Error performing similarity search with scores: {e}")
            raise

    def max_marginal_relevance_search(
        self,
        query: str,
        k: int = 4,
        fetch_k: int = 20,
        lambda_mult: float = 0.5,
        filter: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> List[Document]:
        """
        Perform Maximum Marginal Relevance (MMR) search.

        Args:
            query: Query text
            k: Number of results to return
            fetch_k: Number of results to fetch initially
            lambda_mult: MMR lambda parameter (0=diversity, 1=relevance)
            filter: Optional filter dict for metadata

        Returns:
            List of Document objects
        """
        # Generate embedding for query if needed by the strategy
        query_vector = None
        if isinstance(self.retrieval_strategy, DenseRetrievalStrategy):
            query_vector = self.embedding.embed_query(query)

        # Build query using the retrieval strategy
        opensearch_query = self.retrieval_strategy.opensearch_query(
            query_vector=query_vector,
            query_text=query,
            k=fetch_k,
            filter=filter,
            text_field=self.text_field,
            vector_field=self.vector_field,
        )

        try:
            response = self.client.search(index=self.index_name, body=opensearch_query)
            documents = []

            for hit in response["hits"]["hits"]:
                source = hit["_source"]
                doc = Document(
                    page_content=source[self.text_field],
                    metadata=source.get("metadata", {}),
                )
                documents.append(doc)

            # Apply MMR ranking
            documents = self._apply_mmr_ranking(documents, query, k, lambda_mult)

            return documents[:k]

        except Exception as e:
            logger.error(f"Error performing MMR search: {e}")
            raise

    def _apply_mmr_ranking(
        self, documents: List[Document], query: str, k: int, lambda_mult: float
    ) -> List[Document]:
        """Apply MMR ranking to documents."""
        if not documents or len(documents) <= k:
            return documents

        # Generate query embedding
        query_embedding = (
            self.embedding.embed_query(query) if isinstance(query, str) else query
        )

        # Get embeddings for all documents
        doc_embeddings = []
        for doc in documents:
            doc_embedding = self.embedding.embed_query(doc.page_content)
            doc_embeddings.append(doc_embedding)

        # Convert to numpy arrays
        query_emb = np.array(query_embedding)
        doc_embs = np.array(doc_embeddings)

        # Calculate similarities to query
        query_similarities = np.dot(doc_embs, query_emb) / (
            np.linalg.norm(doc_embs, axis=1) * np.linalg.norm(query_emb)
        )

        selected = []
        remaining = list(range(len(documents)))

        # Select first document (highest similarity to query)
        best_idx = np.argmax(query_similarities)
        selected.append(remaining.pop(best_idx))

        # Select remaining documents using MMR
        for _ in range(min(k - 1, len(remaining))):
            mmr_scores = []

            for idx in remaining:
                # Relevance score
                relevance = query_similarities[idx]

                # Diversity score (max similarity to already selected)
                if selected:
                    selected_embs = doc_embs[
                        [documents.index(documents[i]) for i in selected]
                    ]
                    current_emb = doc_embs[idx]
                    similarities = np.dot(selected_embs, current_emb) / (
                        np.linalg.norm(selected_embs, axis=1)
                        * np.linalg.norm(current_emb)
                    )
                    max_similarity = np.max(similarities)
                else:
                    max_similarity = 0

                # MMR score
                mmr_score = lambda_mult * relevance - (1 - lambda_mult) * max_similarity
                mmr_scores.append(mmr_score)

            # Select document with highest MMR score
            best_idx = np.argmax(mmr_scores)
            selected.append(remaining.pop(best_idx))

        return [documents[i] for i in selected]

    def _calculate_relevance_score(self, doc: Document, query: str) -> float:
        """Calculate relevance score between document and query."""
        # Simple text similarity score
        query_words = set(query.lower().split())
        doc_words = set(doc.page_content.lower().split())
        intersection = query_words.intersection(doc_words)
        return len(intersection) / len(query_words) if query_words else 0.0

    def _calculate_diversity_score(
        self, doc: Document, documents: List[Document]
    ) -> float:
        """Calculate diversity score for a document given a list of documents."""
        # Simple diversity based on unique words
        doc_words = set(doc.page_content.lower().split())
        other_words = set()
        for other_doc in documents:
            if other_doc != doc:
                other_words.update(other_doc.page_content.lower().split())
        intersection = doc_words.intersection(other_words)
        return 1 - len(intersection) / len(doc_words) if doc_words else 0.0

    def similarity_search_with_relevance_scores(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> List[Tuple[Document, float]]:
        """
        Perform similarity search and return documents with normalized relevance scores (0-1).

        Args:
            query: Query text
            k: Number of results to return
            filter: Optional filter dict for metadata

        Returns:
            List of (Document, relevance_score) tuples where relevance_score is in [0, 1]
        """
        # Generate embedding for query if needed by the strategy
        query_vector = None
        if isinstance(self.retrieval_strategy, DenseRetrievalStrategy):
            query_vector = self.embedding.embed_query(query)

        # Build query using the retrieval strategy
        opensearch_query = self.retrieval_strategy.opensearch_query(
            query_vector=query_vector,
            query_text=query,
            k=k,
            filter=filter,
            text_field=self.text_field,
            vector_field=self.vector_field,
        )

        try:
            response = self.client.search(index=self.index_name, body=opensearch_query)

            # Get all scores for normalization
            scores = [hit["_score"] for hit in response["hits"]["hits"]]
            if not scores:
                return []

            # Find min and max for normalization
            min_score = min(scores)
            score_range = max(scores) - min_score

            # Process documents with normalized scores
            documents_with_scores = []

            for hit in response["hits"]["hits"]:
                source = hit["_source"]
                doc = Document(
                    page_content=source[self.text_field],
                    metadata=source.get("metadata", {}),
                )

                # Normalize score to [0, 1] range
                raw_score = hit["_score"]
                normalized_score = (
                    (raw_score - min_score) / score_range if score_range > 0 else 1.0
                )

                documents_with_scores.append((doc, normalized_score))

            return documents_with_scores[:k]

        except Exception as e:
            logger.error(
                f"Error performing similarity search with relevance scores: {e}"
            )
            raise

    def similarity_search_by_vector(
        self,
        embedding: List[float],
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> List[Document]:
        """
        Perform similarity search using embedding vector.

        Args:
            embedding: Query embedding vector
            k: Number of results to return
            filter: Optional filter dict for metadata

        Returns:
            List of Document objects
        """
        # Build query using the retrieval strategy
        opensearch_query = self.retrieval_strategy.opensearch_query(
            query_vector=embedding,
            query_text="",  # Empty query text for vector-only search
            k=k,
            filter=filter,
            text_field=self.text_field,
            vector_field=self.vector_field,
        )

        try:
            response = self.client.search(index=self.index_name, body=opensearch_query)
            documents = []

            for hit in response["hits"]["hits"]:
                source = hit["_source"]
                doc = Document(
                    page_content=source[self.text_field],
                    metadata=source.get("metadata", {}),
                )
                documents.append(doc)

            return documents[:k]

        except Exception as e:
            logger.error(f"Error performing similarity search by vector: {e}")
            raise

    def similarity_search_with_score_by_vector(
        self,
        embedding: List[float],
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> List[Tuple[Document, float]]:
        """
        Perform similarity search by vector with scores.

        Args:
            embedding: Query embedding vector
            k: Number of results to return
            filter: Optional filter dict for metadata

        Returns:
            List of (Document, score) tuples
        """
        # Build query using the retrieval strategy
        opensearch_query = self.retrieval_strategy.opensearch_query(
            query_vector=embedding,
            query_text="",  # Empty query text for vector-only search
            k=k,
            filter=filter,
            text_field=self.text_field,
            vector_field=self.vector_field,
        )

        try:
            response = self.client.search(index=self.index_name, body=opensearch_query)
            documents = []

            for hit in response["hits"]["hits"]:
                source = hit["_source"]
                doc = Document(
                    page_content=source[self.text_field],
                    metadata=source.get("metadata", {}),
                )
                score = hit["_score"]
                documents.append((doc, score))

            return documents[:k]

        except Exception as e:
            logger.error(
                f"Error performing similarity search by vector with scores: {e}"
            )
            raise

    def max_marginal_relevance_search_by_vector(
        self,
        embedding: List[float],
        k: int = 4,
        fetch_k: int = 20,
        lambda_mult: float = 0.5,
        filter: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> List[Document]:
        """
        Perform Maximum Marginal Relevance (MMR) search by vector.

        Args:
            embedding: Query embedding vector
            k: Number of results to return
            fetch_k: Number of results to fetch initially
            lambda_mult: MMR lambda parameter (0=diversity, 1=relevance)
            filter: Optional filter dict for metadata

        Returns:
            List of Document objects
        """
        # Build query using the retrieval strategy
        opensearch_query = self.retrieval_strategy.opensearch_query(
            query_vector=embedding,
            query_text="",  # Empty query text for vector-only search
            k=fetch_k,
            filter=filter,
            text_field=self.text_field,
            vector_field=self.vector_field,
        )

        try:
            response = self.client.search(index=self.index_name, body=opensearch_query)
            documents = []

            for hit in response["hits"]["hits"]:
                source = hit["_source"]
                doc = Document(
                    page_content=source[self.text_field],
                    metadata=source.get("metadata", {}),
                )
                documents.append(doc)

            # Apply MMR ranking with embedding
            documents = self._apply_mmr_ranking(documents, embedding, k, lambda_mult)

            return documents[:k]

        except Exception as e:
            logger.error(f"Error performing MMR search by vector: {e}")
            raise

    @classmethod
    def from_texts(
        cls,
        texts: List[str],
        embedding: Embeddings,
        metadatas: Optional[List[Dict]] = None,
        opensearch_client: Optional[OpenSearch] = None,
        index_name: str = "langchain-index",
        retrieval_strategy: Optional[RetrievalStrategy] = None,
        text_field: str = "text",
        vector_field: str = "vector_field",
        similarity_metric: str = "l2",
        **kwargs: Any,
    ) -> "WaterCrawlOpenSearchVectorStore":
        """
        Create vector store from texts.

        Args:
            texts: List of texts to add
            embedding: Embedding model
            metadatas: Optional metadata for each text
            opensearch_client: OpenSearch client
            index_name: Index name
            retrieval_strategy: Strategy for search retrieval
            text_field: Field name for text
            vector_field: Field name for vectors
            similarity_metric: Similarity metric

        Returns:
            WaterCrawlOpenSearchVectorStore instance
        """
        if opensearch_client is None:
            raise ValueError("opensearch_client is required")

        vector_store = cls(
            opensearch_client=opensearch_client,
            index_name=index_name,
            embedding=embedding,
            retrieval_strategy=retrieval_strategy,
            text_field=text_field,
            vector_field=vector_field,
            similarity_metric=similarity_metric,
        )

        # Add texts to the vector store
        vector_store.add_texts(texts, metadatas)
        return vector_store

    def delete(self, ids: Optional[List[str]] = None, **kwargs: Any) -> Optional[bool]:
        """
        Delete documents by IDs.

        Args:
            ids: List of document IDs to delete

        Returns:
            True if successful
        """
        if not ids:
            return None

        try:
            self.client.delete_by_query(
                index=self.index_name, body={"query": {"ids": {"values": ids}}}
            )
            logger.info(f"Deleted {len(ids)} documents from index {self.index_name}")
            return True
        except Exception as e:
            logger.error(f"Error deleting documents: {e}")
            raise

    def get_index_stats(self) -> Dict[str, Any]:
        """Get statistics about the index."""
        try:
            stats = self.client.indices.stats(index=self.index_name)
            return stats
        except Exception as e:
            logger.error(f"Error getting index stats: {e}")
            raise
