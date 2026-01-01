"""
OpenSearch vector store implementation for WaterCrawl.
"""

from typing import List, Dict, Any, Optional
import logging

from opensearchpy import OpenSearch
from django.conf import settings

from knowledge_base.models import KnowledgeBaseChunk
from knowledge_base.vector_stores.base import BaseVectorStore
from knowledge_base.vector_stores.models import Document

logger = logging.getLogger(__name__)


class OpenSearchVectorStore(BaseVectorStore):
    """OpenSearch implementation of BaseVectorStore."""

    def __init__(self, knowledge_base):
        """Initialize OpenSearch vector store."""
        super().__init__(knowledge_base)
        self.client = self._create_client()
        self.index_name = f"kb_chunks_{knowledge_base.uuid}"
        self._create_index_if_not_exists()

    @classmethod
    def initialize(cls):
        """Initialize the vector store."""
        client = cls._create_client()
        if settings.DEBUG:
            # Set low watermark to 99%
            client.cluster.put_settings(
                body={
                    "persistent": {
                        "cluster.routing.allocation.disk.watermark.low": "99%",
                        "cluster.routing.allocation.disk.watermark.high": "99%",
                        "cluster.routing.allocation.disk.watermark.flood_stage": "99%",
                    }
                }
            )

    @classmethod
    def _create_client(cls) -> OpenSearch:
        """Create OpenSearch client."""
        opensearch_url = settings.OPENSEARCH_BASE_URL
        return OpenSearch(
            hosts=opensearch_url,
            http_compress=True,
            use_ssl=False,
            verify_certs=False,
        )

    def _create_index_if_not_exists(self):
        """Create the OpenSearch index with proper mapping if it doesn't exist."""
        if self.client.indices.exists(index=self.index_name):
            logger.debug(f"Index {self.index_name} already exists")
            return

        # Determine embedding dimension from model config
        embedding_dim = self._get_embedding_dimension()

        # Create index mapping with vector field for kNN search
        index_body = {
            "settings": {
                "index": {
                    "knn": True,
                    "knn.algo_param.ef_search": 100,
                },
                "number_of_shards": 1,
                "number_of_replicas": 0,
            },
            "mappings": {
                "properties": {
                    "doc_id": {"type": "keyword"},
                    "text": {
                        "type": "text",
                        "analyzer": "standard",
                        "fields": {"keyword": {"type": "keyword"}},
                    },
                    "vector_field": {
                        "type": "knn_vector",
                        "dimension": embedding_dim,
                        "method": {
                            "name": "hnsw",
                            "space_type": "cosinesimil",
                            "engine": "lucene",
                            "parameters": {"ef_construction": 128, "m": 24},
                        },
                    },
                    "metadata": {
                        "type": "object",
                        "properties": {
                            "index": {"type": "integer"},
                            "title": {"type": "text"},
                            "uuid": {"type": "keyword"},
                            "source": {"type": "keyword"},
                            "knowledge_base_id": {"type": "keyword"},
                            "document_id": {"type": "keyword"},
                        },
                    },
                }
            },
        }

        try:
            self.client.indices.create(index=self.index_name, body=index_body)
            logger.info(
                f"Created OpenSearch index {self.index_name} with dimension {embedding_dim}"
            )
        except Exception as e:
            logger.error(f"Error creating OpenSearch index {self.index_name}: {e}")
            return

    def create_vector_store(self):
        """Create the OpenSearch vector store."""
        self._create_index_if_not_exists()

    def index_chunks(self, chunks: List[KnowledgeBaseChunk]) -> List[str]:
        """Index chunks into OpenSearch."""
        if not chunks:
            return []

        documents = []
        for chunk in chunks:
            doc = {
                "doc_id": str(chunk.uuid),
                "text": chunk.content,
                "metadata": {
                    "title": chunk.document.title,
                    "document_id": chunk.document_id,
                    "index": chunk.index,
                    "source": chunk.document.source,
                    "source_type": chunk.document.source_type,
                },
            }

            # Add embedding if available
            if chunk.embedding is not None:
                # Handle both pgvector and JSONField formats
                if hasattr(chunk.embedding, "tolist"):
                    doc["vector_field"] = chunk.embedding.tolist()
                elif isinstance(chunk.embedding, list):
                    doc["vector_field"] = chunk.embedding
                elif isinstance(chunk.embedding, dict) and "vector" in chunk.embedding:
                    doc["vector_field"] = chunk.embedding["vector"]

            documents.append(
                {"_index": self.index_name, "_id": str(chunk.uuid), "_source": doc}
            )

        # Bulk index documents
        from opensearchpy.helpers import bulk

        try:
            bulk(self.client, documents)
            logger.info(f"Indexed {len(chunks)} chunks to {self.index_name}")
            return [str(chunk.uuid) for chunk in chunks]
        except Exception as e:
            logger.error(f"Error indexing chunks to OpenSearch: {e}")
            raise

    def delete_chunks(self, chunk_ids: List[str]) -> bool:
        """Delete chunks from OpenSearch."""
        if not chunk_ids:
            return True

        try:
            self.client.delete_by_query(
                index=self.index_name, body={"query": {"ids": {"values": chunk_ids}}}
            )
            logger.info(f"Deleted {len(chunk_ids)} chunks from {self.index_name}")
            return True
        except Exception as e:
            logger.error(f"Error deleting chunks from OpenSearch: {e}")
            raise

    def reindex_all(self) -> int:
        """Reindex all chunks for this knowledge base."""
        chunks = KnowledgeBaseChunk.objects.filter(
            document__knowledge_base=self.knowledge_base
        ).select_related("document")

        if not chunks.exists():
            return 0

        chunk_list = list(chunks)
        self.index_chunks(chunk_list)
        return len(chunk_list)

    def delete_all(self) -> bool:
        """Delete all chunks for this knowledge base from OpenSearch."""
        try:
            if self.client.indices.exists(index=self.index_name):
                self.client.indices.delete(index=self.index_name)
                logger.info(f"Deleted index {self.index_name}")
            return True
        except Exception as e:
            logger.error(f"Error deleting index: {e}")
            raise

    def vector_search(
        self,
        embed_query: List[float],
        top_k: int,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        """Perform vector similarity search using OpenSearch kNN."""
        if not embed_query:
            logger.warning("Empty embedding query provided")
            return []

        # Build query with filters
        query_body = {
            "size": top_k,
            "query": {"knn": {"vector_field": {"vector": embed_query, "k": top_k}}},
            "_source": ["doc_id", "text", "metadata"],
        }

        # Apply filters if provided
        if filters:
            query_body["query"] = {
                "bool": {
                    "must": [
                        {"knn": {"vector_field": {"vector": embed_query, "k": top_k}}}
                    ],
                    "filter": self._build_filters(filters),
                }
            }

        try:
            response = self.client.search(index=self.index_name, body=query_body)
            return self._parse_search_results(response)
        except Exception as e:
            logger.error(f"Error performing vector search: {e}")
            return []

    def full_text_search(
        self, query, top_k: int, filters: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """Perform full-text search using OpenSearch query DSL."""
        if not query or not query.strip():
            logger.warning("Empty query provided for full-text search")
            return []

        # Build query with multi-match for text search
        query_body = {
            "size": top_k,
            "query": {
                "bool": {
                    "must": [
                        {
                            "multi_match": {
                                "query": query,
                                "fields": [
                                    "text^2",
                                    "metadata.title",
                                    "metadata.keywords",
                                ],
                                "type": "best_fields",
                                "fuzziness": "AUTO",
                            }
                        }
                    ]
                }
            },
            "_source": ["doc_id", "text", "metadata"],
        }

        # Apply filters if provided
        if filters:
            filter_clauses = self._build_filters(filters)
            if filter_clauses:
                query_body["query"]["bool"]["filter"] = filter_clauses

        try:
            response = self.client.search(index=self.index_name, body=query_body)
            return self._parse_search_results(response)
        except Exception as e:
            logger.error(f"Error performing full-text search: {e}")
            return []

    def _build_filters(self, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Build OpenSearch filter clauses from filter dictionary."""
        filter_clauses = []

        for key, value in filters.items():
            if key == "knowledge_base_id":
                filter_clauses.append(
                    {"term": {"metadata.knowledge_base_id": str(value)}}
                )
            elif key == "document_id":
                filter_clauses.append({"term": {"metadata.document_id": str(value)}})
            elif key == "source":
                filter_clauses.append({"term": {"metadata.source": str(value)}})
            elif isinstance(value, list):
                filter_clauses.append(
                    {"terms": {f"metadata.{key}": [str(v) for v in value]}}
                )
            else:
                filter_clauses.append({"term": {f"metadata.{key}": str(value)}})

        return filter_clauses

    def _parse_search_results(self, response: Dict[str, Any]) -> List[Document]:
        """Parse OpenSearch search response into Document objects."""
        documents = []
        hits = response.get("hits", {}).get("hits", [])

        for hit in hits:
            source = hit.get("_source", {})
            score = hit.get("_score", 0.0)

            # Normalize score to 0-1 range (OpenSearch scores can vary)
            # For kNN, scores are similarity scores (higher is better)
            # For text search, scores are relevance scores (higher is better)
            normalized_score = min(1.0, max(0.0, score / 10.0)) if score > 0 else 0.0

            doc = Document(
                content=source.get("text", ""),
                metadata=source.get("metadata", {}),
                score=normalized_score,
                chunk_id=source.get("doc_id") or hit.get("_id"),
            )
            documents.append(doc)

        return documents
