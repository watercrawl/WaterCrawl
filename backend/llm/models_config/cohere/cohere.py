from typing import Any, Optional, Dict, List
import logging
from cohere import Client

from common.encryption import decrypt_key
from knowledge_base.vector_stores.base import BaseReranker
from knowledge_base.vector_stores.models import Document

logger = logging.getLogger(__name__)


class CohereReranker(BaseReranker):
    """Cohere reranker that uses Cohere's rerank API."""

    def __init__(
        self,
        model_key: str,
        provider_config: Any,
        reranker_config: Optional[Dict[str, Any]] = None,
    ):
        """
        Initialize Cohere reranker.

        Args:
            model_key: Model key for the reranker (e.g., 'rerank-english-v3.0')
            provider_config: ProviderConfig instance
            reranker_config: Optional reranker configuration
        """
        self.model_key = model_key
        self.provider_config = provider_config
        self.reranker_config = reranker_config or {}
        self._client = None

    @property
    def client(self):
        """Lazy load Cohere client."""
        if self._client is None:
            api_key = decrypt_key(self.provider_config.api_key)
            base_url = self.provider_config.base_url or "https://api.cohere.ai/v1"

            self._client = Client(
                api_key=api_key,
                base_url=base_url,
            )
        return self._client

    def rerank(self, results: List[Document], query: str, top_k) -> List[Document]:
        """Rerank results using Cohere rerank API."""
        if not results:
            return results

        try:
            # Prepare documents for reranking
            documents = [result.content for result in results]

            rerank_response = self.client.rerank(
                model=self.model_key,
                query=query,
                documents=documents,
                top_n=min(top_k, len(results)),
            )

            # Map reranked results back to original format
            reranked_results = []
            for result in rerank_response.results:
                original_index = result.index
                if original_index < len(results):
                    original_result = results[original_index].model_copy()
                    # Update score with rerank relevance score
                    original_result.score = result.relevance_score
                    reranked_results.append(original_result)

            return reranked_results

        except Exception as e:
            raise e
            logger.error(f"Error in Cohere reranking: {e}")
            return results
