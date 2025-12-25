"""
Weaviate vector store implementation for WaterCrawl.
"""

from typing import List, Dict, Any, Optional
import logging
import uuid as uuid_lib

from django.conf import settings
from weaviate.auth import Auth
from weaviate.collections.classes.filters import Filter

from knowledge_base.models import KnowledgeBaseChunk
from knowledge_base.vector_stores.base import BaseVectorStore
from knowledge_base.vector_stores.models import Document
import weaviate.classes as wvc

logger = logging.getLogger(__name__)


class WeaviateVectorStore(BaseVectorStore):
    """Weaviate implementation of BaseVectorStore."""

    def __init__(self, knowledge_base):
        """Initialize Weaviate vector store."""
        super().__init__(knowledge_base)
        self.client = self._create_client()
        # Create a valid collection name from knowledge base UUID
        # Weaviate collection names must start with uppercase and be alphanumeric
        self.collection_name = f"KB_{str(knowledge_base.uuid).replace('-', '_')}"
        self._create_collection_if_not_exists()

    @classmethod
    def initialize(cls):
        """Initialize the vector store."""
        pass

    def _create_client(self):
        """Create Weaviate client."""
        try:
            import weaviate
            from weaviate.connect import ConnectionParams
        except ImportError:
            raise ImportError(
                "weaviate-client is not installed. Please install it: pip install weaviate-client"
            )

        weaviate_url = settings.WEAVIATE_BASE_URL
        weaviate_grpc_port = settings.WEAVIATE_GRPC_PORT
        weaviate_api_key = settings.WEAVIATE_API_KEY

        # Build connection params
        connection_params = ConnectionParams.from_url(
            url=weaviate_url, grpc_port=weaviate_grpc_port
        )

        kwargs = {
            "connection_params": connection_params,
            "skip_init_checks": False,
        }

        if weaviate_api_key:
            kwargs["auth_client_secret"] = Auth.api_key(weaviate_api_key)

        client = weaviate.WeaviateClient(**kwargs)

        client.connect()
        return client

    def _create_collection_if_not_exists(self):
        """Create the Weaviate collection with proper schema if it doesn't exist."""
        try:
            import weaviate.classes as wvc
        except ImportError:
            raise ImportError(
                "weaviate-client is not installed. Please install it: pip install weaviate-client"
            )

        # Check if collection exists
        if self.client.collections.exists(self.collection_name):
            logger.debug(f"Collection {self.collection_name} already exists")
            return

        embedding_dim = self._get_embedding_dimension()

        try:
            # Create collection with properties and vector configuration
            self.client.collections.create(
                name=self.collection_name,
                properties=[
                    wvc.config.Property(
                        name="doc_id",
                        data_type=wvc.config.DataType.TEXT,
                        skip_vectorization=True,
                    ),
                    wvc.config.Property(
                        name="text",
                        data_type=wvc.config.DataType.TEXT,
                        skip_vectorization=True,  # We provide our own vectors
                    ),
                    wvc.config.Property(
                        name="chunk_index",
                        data_type=wvc.config.DataType.INT,
                        skip_vectorization=True,
                    ),
                    wvc.config.Property(
                        name="title",
                        data_type=wvc.config.DataType.TEXT,
                        skip_vectorization=True,
                    ),
                    wvc.config.Property(
                        name="source",
                        data_type=wvc.config.DataType.TEXT,
                        skip_vectorization=True,
                    ),
                    wvc.config.Property(
                        name="knowledge_base_id",
                        data_type=wvc.config.DataType.TEXT,
                        skip_vectorization=True,
                    ),
                    wvc.config.Property(
                        name="document_id",
                        data_type=wvc.config.DataType.TEXT,
                        skip_vectorization=True,
                    ),
                ],
                # Configure vector index for similarity search
                vector_index_config=wvc.config.Configure.VectorIndex.hnsw(
                    distance_metric=wvc.config.VectorDistances.COSINE,
                    ef_construction=128,
                    max_connections=64,
                ),
                # No vectorizer - we provide our own embeddings
                vectorizer_config=wvc.config.Configure.Vectorizer.none(),
                # Enable inverted index for full-text search
                inverted_index_config=wvc.config.Configure.inverted_index(
                    bm25_b=0.75,
                    bm25_k1=1.2,
                ),
            )
            logger.info(
                f"Created Weaviate collection {self.collection_name} with dimension {embedding_dim}"
            )
        except Exception as e:
            logger.error(
                f"Error creating Weaviate collection {self.collection_name}: {e}"
            )
            raise

    def create_vector_store(self):
        """Create the Weaviate vector store."""
        self._create_collection_if_not_exists()

    def index_chunks(self, chunks: List[KnowledgeBaseChunk]) -> List[str]:
        """Index chunks into Weaviate."""
        if not chunks:
            return []

        collection = self.client.collections.get(self.collection_name)
        indexed_ids = []

        # Use batch insert for efficiency
        with collection.batch.dynamic() as batch:
            for chunk in chunks:
                # Prepare vector
                vector = None
                if chunk.embedding is not None:
                    if hasattr(chunk.embedding, "tolist"):
                        vector = chunk.embedding.tolist()
                    elif isinstance(chunk.embedding, list):
                        vector = chunk.embedding
                    elif (
                        isinstance(chunk.embedding, dict)
                        and "vector" in chunk.embedding
                    ):
                        vector = chunk.embedding["vector"]

                # Create object with properties
                properties = {
                    "doc_id": str(chunk.uuid),
                    "text": chunk.content,
                    "chunk_index": chunk.index,
                    "title": chunk.document.title,
                    "source": chunk.document.source,
                    "knowledge_base_id": str(chunk.document.knowledge_base.uuid),
                    "document_id": str(chunk.document.uuid),
                }

                # Use chunk UUID as object UUID for easy retrieval
                object_uuid = uuid_lib.UUID(str(chunk.uuid))

                batch.add_object(
                    properties=properties,
                    uuid=object_uuid,
                    vector=vector,
                )
                indexed_ids.append(str(chunk.uuid))

        logger.info(
            f"Indexed {len(indexed_ids)} chunks to Weaviate collection {self.collection_name}"
        )
        return indexed_ids

    def delete_chunks(self, chunk_ids: List[str]) -> bool:
        """Delete chunks from Weaviate."""
        if not chunk_ids:
            return True

        try:
            collection = self.client.collections.get(self.collection_name)

            for chunk_id in chunk_ids:
                try:
                    collection.data.delete_by_id(chunk_id)
                except Exception as e:
                    logger.warning(f"Error deleting chunk {chunk_id}: {e}")

            logger.info(
                f"Deleted {len(chunk_ids)} chunks from Weaviate collection {self.collection_name}"
            )
            return True
        except Exception as e:
            logger.error(f"Error deleting chunks from Weaviate: {e}")
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
        """Delete the entire collection for this knowledge base."""
        try:
            if self.client.collections.exists(self.collection_name):
                self.client.collections.delete(self.collection_name)
                logger.info(f"Deleted Weaviate collection {self.collection_name}")
            return True
        except Exception as e:
            logger.error(f"Error deleting Weaviate collection: {e}")
            raise

    def vector_search(
        self,
        embed_query: List[float],
        top_k: int,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        """Perform vector similarity search using Weaviate near_vector."""
        if not embed_query:
            logger.warning("Empty embedding query provided")
            return []

        try:
            collection = self.client.collections.get(self.collection_name)

            # Build filter if provided
            where_filter = self._build_filters(filters) if filters else None

            # Perform near_vector search
            results = collection.query.near_vector(
                near_vector=embed_query,
                limit=top_k,
                filters=where_filter,
                return_metadata=wvc.query.MetadataQuery(distance=True, certainty=True),
                return_properties=[
                    "doc_id",
                    "text",
                    "chunk_index",
                    "title",
                    "source",
                    "knowledge_base_id",
                    "document_id",
                ],
            )

            return self._parse_search_results(results.objects)
        except Exception as e:
            logger.error(f"Error performing vector search in Weaviate: {e}")
            return []

    def full_text_search(
        self, query: str, top_k: int, filters: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """Perform full-text search using Weaviate BM25."""
        if not query or not query.strip():
            logger.warning("Empty query provided for full-text search")
            return []

        try:
            collection = self.client.collections.get(self.collection_name)

            # Build filter if provided
            where_filter = self._build_filters(filters) if filters else None

            # Perform BM25 search
            results = collection.query.bm25(
                query=query,
                limit=top_k,
                filters=where_filter,
                query_properties=["text", "title"],
                return_metadata=wvc.query.MetadataQuery(score=True),
                return_properties=[
                    "doc_id",
                    "text",
                    "chunk_index",
                    "title",
                    "source",
                    "knowledge_base_id",
                    "document_id",
                ],
            )

            return self._parse_search_results(results.objects, use_bm25_score=True)
        except Exception as e:
            logger.error(f"Error performing full-text search in Weaviate: {e}")
            return []

    def _build_filters(self, filters: Dict[str, Any]):
        """Build Weaviate filter from filter dictionary."""
        filter_conditions = []

        for key, value in filters.items():
            if key == "knowledge_base_id":
                filter_conditions.append(
                    Filter.by_property("knowledge_base_id").equal(str(value))
                )
            elif key == "document_id":
                filter_conditions.append(
                    Filter.by_property("document_id").equal(str(value))
                )
            elif key == "source":
                filter_conditions.append(Filter.by_property("source").equal(str(value)))
            elif isinstance(value, list):
                filter_conditions.append(
                    Filter.by_property(key).contains_any([str(v) for v in value])
                )
            else:
                filter_conditions.append(Filter.by_property(key).equal(str(value)))

        # Combine filters with AND
        if not filter_conditions:
            return None

        combined_filter = filter_conditions[0]
        for f in filter_conditions[1:]:
            combined_filter = combined_filter & f

        return combined_filter

    def _parse_search_results(
        self, objects: List[Any], use_bm25_score: bool = False
    ) -> List[Document]:
        """Parse Weaviate search results into Document objects."""
        documents = []

        for obj in objects:
            props = obj.properties

            # Calculate normalized score
            if use_bm25_score:
                # BM25 scores can vary widely, normalize to 0-1
                raw_score = (
                    obj.metadata.score if obj.metadata and obj.metadata.score else 0.0
                )
                normalized_score = min(1.0, max(0.0, raw_score / 10.0))
            else:
                # For vector search, use certainty or convert distance to similarity
                if obj.metadata and obj.metadata.certainty is not None:
                    normalized_score = obj.metadata.certainty
                elif obj.metadata and obj.metadata.distance is not None:
                    # Cosine distance: 0 = identical, 2 = opposite
                    # Convert to similarity: 1 - (distance / 2)
                    normalized_score = max(0.0, 1.0 - (obj.metadata.distance / 2.0))
                else:
                    normalized_score = 0.0

            doc = Document(
                content=props.get("text", ""),
                metadata={
                    "index": props.get("chunk_index"),
                    "title": props.get("title"),
                    "uuid": props.get("doc_id"),
                    "source": props.get("source"),
                    "knowledge_base_id": props.get("knowledge_base_id"),
                    "document_id": props.get("document_id"),
                },
                score=normalized_score,
                chunk_id=props.get("doc_id") or str(obj.uuid),
            )
            documents.append(doc)

        return documents

    def __del__(self):
        """Close the Weaviate client connection."""
        try:
            if hasattr(self, "client") and self.client:
                self.client.close()
        except Exception:
            pass
