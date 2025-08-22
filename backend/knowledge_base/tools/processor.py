"""
This module contains the main processor service for knowledge base operations.
It orchestrates the text splitting, embedding, vector storage, and search operations.
"""

from typing import List, Dict, Any, Optional

from django.conf import settings
from django.utils.functional import cached_property
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import VectorStore
from langchain_text_splitters import TextSplitter

from knowledge_base.interfaces import BaseSummarizer, BaseKeywordExtractor
from knowledge_base.models import (
    KnowledgeBase,
    KnowledgeBaseDocument,
    KnowledgeBaseChunk,
)
from knowledge_base.factories import (
    TextSplitterFactory,
    EmbedderFactory,
    VectorStoreFactory,
    SummarizerFactory,
    KeywordExtractorFactory,
)


class KnowledgeBaseProcessor:
    """
    Main processor for knowledge base operations.
    Orchestrates text splitting, embedding, vector storage, and search.
    """

    def __init__(self, knowledge_base: KnowledgeBase):
        """Initialize with a knowledge base."""
        self.knowledge_base = knowledge_base

    @cached_property
    def text_splitter(self) -> TextSplitter:
        """Get the text splitter."""
        return TextSplitterFactory.from_knowledge_base(self.knowledge_base)

    @cached_property
    def embedder(self) -> Embeddings:
        """Get the embedder."""
        return EmbedderFactory.from_knowledge_base(self.knowledge_base)

    @cached_property
    def vector_store(self) -> VectorStore:
        """Get the vector store."""
        return VectorStoreFactory.from_knowledge_base(
            self.knowledge_base,
        )

    @cached_property
    def summarizer(self) -> Optional[BaseSummarizer]:
        """Get the summarizer. May return None if no summarization model is configured."""
        return SummarizerFactory.from_knowledge_base(self.knowledge_base)

    @cached_property
    def keyword_extractor(self) -> BaseKeywordExtractor:
        """
        Get the keyword extractor.

        Returns:
            The keyword extractor.
        """
        return KeywordExtractorFactory.from_knowledge_base(self.knowledge_base)

    def persist_to_vector_store(self, document: KnowledgeBaseDocument) -> List[str]:
        """
        Persist a document to the vector store and return the created chunks.

        Args:
            document: The document to persist.

        Returns:
            List of created chunks.
        """
        self.remove_from_vector_store(document)
        document.chunks.all().delete()
        chunks = []
        index = 1
        summary = ""
        if self.summarizer:
            summary = self.summarizer.summarize(document.content)
        for chunk_text in self.text_splitter.split_text(document.content):
            chunk = KnowledgeBaseChunk(
                document=document,
                index=index,
                content=f"{summary}\n\n{chunk_text}" if summary else chunk_text,
                keywords=self.keyword_extractor.extract_keywords(chunk_text),
            )
            chunk.save()
            chunk_uuid = str(chunk.uuid)
            chunks.append(
                Document(
                    page_content=chunk_text,
                    id=chunk_uuid,
                    metadata={
                        "index": index,
                        "title": document.title,
                        "uuid": chunk_uuid,
                        "source": document.source,
                        "knowledge_base_id": str(document.knowledge_base.uuid),
                        "document_id": str(document.uuid),
                        "keywords": chunk.keywords,
                    },
                )
            )
            index += 1

        return self.vector_store.add_documents(chunks)

    def remove_from_vector_store(self, document: KnowledgeBaseDocument):
        ids = document.chunks.all().values_list("uuid", flat=True)
        if not ids:
            return True
        return self.vector_store.delete(ids=list(ids))

    def search(
        self, query: str, top_k: int = 4, search_type: str = "similarity"
    ) -> List[Dict[str, Any]]:
        """
        Search the knowledge base for documents similar to the query.

        Args:
            query: The search query.
            top_k: Number of results to return.
            search_type: Type of search to perform (similarity or mmr or similarity_score_threshold).

        Returns:
            List of search results.
        """
        # Search for similar chunks
        results = self.vector_store.search(query, k=top_k, search_type=search_type)
        # Format results
        formatted_results = []
        for doc in results:
            formatted_results.append(
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                }
            )

        return formatted_results

    def delete_vector_store(self):
        """
        Delete the entire vector store/index for this knowledge base.
        This removes all documents and the index structure.
        """
        vector_store_type = getattr(settings, "KB_VECTOR_STORE_TYPE", "opensearch")

        if vector_store_type == "opensearch":
            # Handle OpenSearch index deletion
            opensearch_client = self.vector_store.client
            index_name = self.vector_store.index_name
            try:
                if opensearch_client.indices.exists(index=index_name):
                    opensearch_client.indices.delete(index=index_name)
                    print(f"Successfully deleted OpenSearch index: {index_name}")
                else:
                    print(f"OpenSearch index {index_name} does not exist")
            except Exception as e:
                print(
                    f"[Warning] Failed to delete OpenSearch index '{index_name}': {e}"
                )
                raise

        else:
            raise ValueError(
                f"Vector store type '{vector_store_type}' not supported for deletion."
            )
