"""
Feeder class for indexing documents into knowledge bases.
Handles text splitting, embedding, saving to PostgreSQL, and indexing to vector stores.
"""

from typing import List, Optional
import logging
from django.db import transaction

from langchain_core.embeddings import Embeddings
from langchain_text_splitters import TextSplitter

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
)
from knowledge_base.tools.interfaces import BaseSummarizer
from knowledge_base.vector_stores.base import BaseVectorStore

logger = logging.getLogger(__name__)


class Feeder:
    """
    Feeder class for indexing documents into knowledge bases.
    Saves everything to PostgreSQL first, then indexes to vector store.
    """

    def __init__(self, knowledge_base: KnowledgeBase):
        """
        Initialize the feeder.

        Args:
            knowledge_base: KnowledgeBase instance
        """
        self.knowledge_base = knowledge_base

        # Create text splitter
        self.text_splitter: TextSplitter = TextSplitterFactory.from_knowledge_base(
            knowledge_base
        )

        # Create embedder if available
        self.embedder: Optional[Embeddings] = None
        if knowledge_base.embedding_provider_config:
            try:
                self.embedder = EmbedderFactory.from_knowledge_base(knowledge_base)
            except Exception as e:
                logger.warning(f"Failed to create embedder: {e}")
                self.embedder = None

        # Create vector store
        self.vector_store: BaseVectorStore = VectorStoreFactory.from_knowledge_base(
            knowledge_base
        )

        # Create summarizer if available
        self.summarizer: Optional[BaseSummarizer] = (
            SummarizerFactory.from_knowledge_base(knowledge_base)
        )

    @transaction.atomic
    def feed_document(self, document: KnowledgeBaseDocument) -> List[str]:
        """
        Process and index a document.
        Saves chunks to PostgreSQL first, then indexes to vector store.

        Args:
            document: KnowledgeBaseDocument instance to process

        Returns:
            List of created chunk UUIDs
        """
        # Remove existing chunks from vector store
        self.remove_document(document)

        # Delete existing chunks from database
        document.chunks.all().delete()

        chunks = []
        index = 1

        # Generate summary if summarizer is available
        summary = ""
        if self.summarizer:
            try:
                summary = self.summarizer.summarize(document.content)
            except Exception as e:
                logger.warning(f"Failed to generate summary: {e}")

        # Split text into chunks
        chunk_texts = self.text_splitter.split_text(document.content)

        # Generate embeddings for all chunks if embedder is available
        embeddings = None
        if self.embedder:
            # Prepare texts for embedding (with summary prefix if available)
            texts_to_embed = [
                f"{summary}\n\n{chunk_text}" if summary else chunk_text
                for chunk_text in chunk_texts
            ]
            embeddings = self.embedder.embed_documents(texts_to_embed)

        # Create chunks with embeddings and save to PostgreSQL
        for i, chunk_text in enumerate(chunk_texts):
            chunk = KnowledgeBaseChunk(
                document=document,
                index=index,
                content=f"{summary}\n\n{chunk_text}" if summary else chunk_text,
            )

            # Set embedding if available
            if embeddings and i < len(embeddings):
                chunk.embedding = embeddings[i]

            # Save to PostgreSQL
            chunk.save()
            chunks.append(chunk)
            index += 1

        # Index chunks to vector store (after saving to PostgreSQL)
        if chunks:
            self.vector_store.index_chunks(chunks)
            logger.info(
                f"Indexed {len(chunks)} chunks to vector store for document {document.uuid}"
            )

        return [str(chunk.uuid) for chunk in chunks]

    def remove_document(self, document: KnowledgeBaseDocument) -> bool:
        """
        Remove document chunks from vector store.
        Note: This does not delete from PostgreSQL - that should be done separately.

        Args:
            document: KnowledgeBaseDocument instance

        Returns:
            True if successful
        """
        chunk_ids = list(document.chunks.all().values_list("uuid", flat=True))
        if not chunk_ids:
            return True

        try:
            return self.vector_store.delete_chunks(chunk_ids)
        except Exception as e:
            logger.error(f"Error removing chunks from vector store: {e}")
            return False

    def reindex_all(self) -> int:
        """
        Reindex all chunks for this knowledge base.
        Reads from PostgreSQL and indexes to vector store.

        Returns:
            Number of chunks reindexed
        """
        return self.vector_store.reindex_all()

    def delete_all(self) -> bool:
        """
        Delete all chunks from vector store for this knowledge base.
        Note: This does not delete from PostgreSQL.

        Returns:
            True if successful
        """
        try:
            return self.vector_store.delete_all()
        except Exception as e:
            logger.error(f"Error deleting all chunks from vector store: {e}")
            return False
