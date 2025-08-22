from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class RetrievalStrategy(ABC):
    """Base class for retrieval strategies that work as query builders."""

    def __init__(
        self,
        keyword_importance: float = 1.5,
        hybrid: bool = False,
        hybrid_alpha: float = 0.7,
    ):
        """
        Initialize the retrieval strategy.

        Args:
            keyword_importance: Boost factor for keyword matches
            hybrid: Whether to enable hybrid search (vector + text)
            hybrid_alpha: Weight for hybrid search (0.0-1.0, higher = more vector weight)
        """
        self.keyword_importance = keyword_importance
        self.hybrid = hybrid
        self.hybrid_alpha = hybrid_alpha

    @abstractmethod
    def opensearch_query(
        self,
        query_vector: Optional[List[float]],
        query_text: str,
        k: int,
        keywords: Optional[List[str]] = None,
        filter: Optional[Dict[str, Any]] = None,
        text_field: str = "text",
        vector_field: str = "vector_field",
    ) -> Dict[str, Any]:
        """
        Build OpenSearch query based on strategy.

        Args:
            query_vector: Embedding vector for the query
            query_text: Original query text
            k: Number of results to return
            keywords: Keywords for boosting
            filter: Metadata filters
            text_field: Name of the text field
            vector_field: Name of the vector field

        Returns:
            OpenSearch query dictionary
        """
        pass

    @staticmethod
    def get_index_mapping(
        vector_field: str = "vector_field",
        similarity_metric: str = "l2",
        vector_dimension: int = None,
    ) -> Dict[str, Any]:
        """
        Generate OpenSearch index mapping for all strategies with BM25 optimization.

        Args:
            vector_field: Name of the vector field
            vector_dimension: Dimension of the embedding vectors
            similarity_metric: Similarity metric for vector search (l2, cosinesimil, innerproduct)

        Returns:
            OpenSearch mapping dictionary
        """
        mapping = {
            "mappings": {
                "properties": {
                    "text": {
                        "type": "text",
                        "analyzer": "standard",
                        "similarity": "BM25",  # Explicit BM25 similarity
                        "fields": {
                            "keyword": {"type": "keyword", "ignore_above": 256},
                            "english": {"type": "text", "analyzer": "english"},
                        },
                    },
                    "metadata": {
                        "type": "object",
                        "properties": {
                            "source": {"type": "keyword"},
                            "uuid": {"type": "keyword"},
                            "knowledge_base_id": {"type": "keyword"},
                            "keywords": {"type": "keyword"},
                            "index": {"type": "integer"},
                        },
                    },
                }
            },
            "settings": {
                "index": {
                    "knn": True,
                    "number_of_shards": 1,
                    "number_of_replicas": 0,
                    # BM25 parameters optimization
                    "similarity": {
                        "default": {
                            "type": "BM25",
                            "k1": 1.2,  # Term frequency saturation parameter
                            "b": 0.75,  # Length normalization parameter
                        }
                    },
                },
                "analysis": {
                    "analyzer": {
                        "standard_with_synonyms": {
                            "tokenizer": "standard",
                            "filter": ["lowercase", "stop", "snowball"],
                        }
                    }
                },
            },
        }
        if vector_dimension:
            mapping["mappings"]["properties"][vector_field] = {
                "type": "knn_vector",
                "dimension": vector_dimension,
                "method": {
                    "name": "hnsw",
                    "space_type": similarity_metric,
                    "engine": "lucene",
                },
            }
        return mapping


class ContentRetrievalStrategy(RetrievalStrategy):
    """Content-based retrieval strategy using text search with optional keyword importance."""

    def opensearch_query(
        self,
        query_vector: Optional[List[float]],
        query_text: str,
        k: int,
        keywords: Optional[List[str]] = None,
        filter: Optional[Dict[str, Any]] = None,
        text_field: str = "text",
        vector_field: str = "vector_field",
    ) -> Dict[str, Any]:
        """Build content-based search query using BM25."""

        # Main BM25 text search with optimized parameters
        must_queries = [
            {
                "match": {
                    text_field: {
                        "query": query_text,
                        "boost": 1.0,
                        "analyzer": "standard",
                        "fuzziness": "AUTO",
                        "prefix_length": 2,
                        "max_expansions": 50,
                        "operator": "or",
                    }
                }
            }
        ]

        # Add keyword boosting with BM25 optimization
        if keywords and self.keyword_importance > 0:
            should_queries = []
            for keyword in keywords:
                # Exact phrase match with high boost
                should_queries.append(
                    {
                        "match_phrase": {
                            text_field: {
                                "query": keyword,
                                "boost": self.keyword_importance * 2.0,
                            }
                        }
                    }
                )
                # Fuzzy match for partial matches
                should_queries.append(
                    {
                        "match": {
                            text_field: {
                                "query": keyword,
                                "boost": self.keyword_importance,
                                "fuzziness": "AUTO",
                                "operator": "and",
                            }
                        }
                    }
                )
                # Search in metadata keywords with exact term match
                should_queries.append(
                    {
                        "term": {
                            "metadata.keywords": {
                                "value": keyword.lower(),
                                "boost": self.keyword_importance * 1.5,
                            }
                        }
                    }
                )

            # Add keyword boost queries as should clauses
            must_queries.append(
                {"bool": {"should": should_queries, "minimum_should_match": 1}}
            )

        query = {
            "query": {"bool": {"must": must_queries}},
            "size": k,
            # Explicit BM25 similarity settings
            "track_scores": True,
            "_source": True,
        }

        # Add filters
        if filter:
            query["query"]["bool"]["filter"] = self._build_filters(filter)

        return query

    def _build_filters(self, filter: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Build filter clauses."""
        filters = []
        for key, value in filter.items():
            if key == "keywords":
                filters.append({"term": {"metadata.keywords": value}})
            else:
                filters.append({"term": {f"metadata.{key}": value}})
        return filters


class DenseRetrievalStrategy(RetrievalStrategy):
    """Dense + BM25 hybrid search using Reciprocal Rank Fusion via OpenSearch pipeline."""

    def opensearch_query(
        self,
        query_vector: Optional[List[float]],
        query_text: str,
        k: int,
        keywords: Optional[List[str]] = None,
        filter: Optional[Dict[str, Any]] = None,
        text_field: str = "text",
        vector_field: str = "vector_field",
    ) -> Dict[str, Any]:
        if not query_vector:
            raise ValueError("query_vector is required for DenseRetrievalStrategy")

        # Vector search clause
        knn_clause = {"knn": {vector_field: {"vector": query_vector, "k": k * 2}}}

        # Text search clause
        text_clause = {
            "match": {
                text_field: {
                    "query": query_text,
                    "fuzziness": "AUTO",
                    "prefix_length": 2,
                    "max_expansions": 50,
                    "operator": "or",
                    "boost": 1.0,
                }
            }
        }

        # Optional keyword boosting
        if keywords and self.keyword_importance > 0:
            keyword_should = []
            for kw in keywords:
                keyword_should.extend(
                    [
                        {
                            "match_phrase": {
                                text_field: {
                                    "query": kw,
                                    "boost": self.keyword_importance * 1.5,
                                }
                            }
                        },
                        {
                            "match": {
                                text_field: {
                                    "query": kw,
                                    "boost": self.keyword_importance,
                                    "fuzziness": "AUTO",
                                }
                            }
                        },
                        {
                            "term": {
                                "metadata.keywords": {
                                    "value": kw.lower(),
                                    "boost": self.keyword_importance,
                                }
                            }
                        },
                    ]
                )
            text_clause = {
                "bool": {"must": [text_clause], "should": keyword_should, "boost": 1.0}
            }

        # Hybrid query using both clauses
        query = {
            "query": {"hybrid": {"queries": [knn_clause, text_clause]}},
            "size": k,
            "track_scores": True,
            "_source": True,
        }

        # Apply filters if needed
        if filter:
            query["query"] = {
                "bool": {
                    "must": [query["query"]],
                    "filter": self._build_filters(filter),
                }
            }

        # Attach the search pipeline name
        query["search_pipeline"] = "rrf-pipeline"

        return query

    def _build_filters(self, filter: Dict[str, Any]) -> List[Dict[str, Any]]:
        filters = []
        for key, value in filter.items():
            if key == "keywords":
                filters.append({"term": {"metadata.keywords": value}})
            else:
                filters.append({"term": {f"metadata.{key}": value}})
        return filters


class KeywordRetrievalStrategy(RetrievalStrategy):
    """Pure keyword-based retrieval strategy."""

    def opensearch_query(
        self,
        query_vector: Optional[List[float]],
        query_text: str,
        k: int,
        keywords: Optional[List[str]] = None,
        filter: Optional[Dict[str, Any]] = None,
        text_field: str = "text",
        vector_field: str = "vector_field",
    ) -> Dict[str, Any]:
        """Build keyword-based search query using BM25."""

        should_queries = []

        # Search in metadata keywords with exact term matching
        if keywords:
            for keyword in keywords:
                # Exact term match in metadata keywords (highest boost)
                should_queries.append(
                    {
                        "term": {
                            "metadata.keywords": {
                                "value": keyword.lower(),
                                "boost": self.keyword_importance * 2.0,
                            }
                        }
                    }
                )
                # Phrase match in text content
                should_queries.append(
                    {
                        "match_phrase": {
                            text_field: {
                                "query": keyword,
                                "boost": self.keyword_importance * 1.5,
                            }
                        }
                    }
                )
                # Fuzzy match in text content
                should_queries.append(
                    {
                        "match": {
                            text_field: {
                                "query": keyword,
                                "boost": self.keyword_importance,
                                "fuzziness": "AUTO",
                                "operator": "and",
                            }
                        }
                    }
                )

        # BM25 search in text content for query terms
        if query_text.strip():
            # Full query match with BM25
            should_queries.append(
                {
                    "match": {
                        text_field: {
                            "query": query_text,
                            "boost": 1.0,
                            "analyzer": "standard",
                            "fuzziness": "AUTO",
                            "prefix_length": 2,
                            "max_expansions": 50,
                            "operator": "or",
                        }
                    }
                }
            )

            # Individual term matches for better recall
            query_terms = query_text.split()
            for term in query_terms:
                if len(term) > 2:  # Skip very short terms
                    should_queries.append(
                        {
                            "match": {
                                text_field: {
                                    "query": term,
                                    "boost": 0.5,
                                    "fuzziness": "AUTO",
                                }
                            }
                        }
                    )

        query = {
            "query": {"bool": {"should": should_queries, "minimum_should_match": 1}},
            "size": k,
            "track_scores": True,
            "_source": True,
        }

        # Add filters
        if filter:
            query["query"]["bool"]["filter"] = self._build_filters(filter)

        return query

    def _build_filters(self, filter: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Build filter clauses."""
        filters = []
        for key, value in filter.items():
            if key == "keywords":
                filters.append({"term": {"metadata.keywords": value}})
            else:
                filters.append({"term": {f"metadata.{key}": value}})
        return filters
