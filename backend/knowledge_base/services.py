import json
from typing import List

from django.core.files.uploadedfile import TemporaryUploadedFile
from django.db.transaction import atomic

from core.models import CrawlResult, CrawlRequest
from knowledge_base import consts
from knowledge_base.factories import FileToMarkdownFactory
from knowledge_base.helpers import NoiseRemover
from knowledge_base.models import KnowledgeBaseDocument, KnowledgeBase
from knowledge_base.tools.processor import KnowledgeBaseProcessor
from knowledge_base.tools.storage import KnowledgeBaseStorageService
from user.models import Team


class KnowledgeBaseService:
    def __init__(self, knowledge_base: KnowledgeBase):
        self.knowledge_base: KnowledgeBase = knowledge_base

    @classmethod
    def make_by_uuid(cls, uuid: str) -> "KnowledgeBaseService":
        return cls(KnowledgeBase.objects.get(uuid=uuid))

    @classmethod
    def make_by_team_and_uuid(cls, team: Team, uuid: str) -> "KnowledgeBaseService":
        return cls(KnowledgeBase.objects.get(team=team, uuid=uuid))

    def add_urls(self, urls: List[str]):
        return [
            self.make_document(url, url, consts.DOCUMENT_SOURCE_TYPE_CRAWL)
            for url in set(urls)
        ]

    def make_document(
        self,
        title: str,
        source: str,
        source_type=consts.DOCUMENT_SOURCE_TYPE_MANUAL,
        metadata: dict = None,
    ) -> KnowledgeBaseDocument:
        if metadata is None:
            metadata = {}

        document, _ = KnowledgeBaseDocument.objects.update_or_create(
            knowledge_base=self.knowledge_base,
            source_type=source_type,
            source=source,
            defaults={
                "title": title,
                "metadata": metadata,
                "status": consts.DOCUMENT_STATUS_NEW,
            },
        )
        return document

    def set_deleted(self):
        self.knowledge_base.status = "DELETED"
        self.knowledge_base.save(update_fields=["status"])

    def delete_forever(self):
        KnowledgeBaseProcessor(self.knowledge_base).delete_vector_store()
        self.knowledge_base.delete()

    def add_crawl_results(
        self, crawl_results: List[CrawlResult]
    ) -> List[KnowledgeBaseDocument]:
        return [
            self.make_document(
                title=crawl_result.url,
                source=crawl_result.url,
                source_type=consts.DOCUMENT_SOURCE_TYPE_CRAWL,
                metadata={
                    "crawl_result": str(crawl_result.pk),
                    "crawl_request": str(crawl_result.request_id),
                },
            )
            for crawl_result in crawl_results
        ]

    def add_crawl_request(self, crawl_request: CrawlRequest):
        return self.add_crawl_results(crawl_request.results.all())

    def can_add_documents(self):
        return self.knowledge_base.status == consts.KNOWLEDGE_BASE_STATUS_ACTIVE

    def add_files(
        self, files: List[TemporaryUploadedFile]
    ) -> List[KnowledgeBaseDocument]:
        documents = []

        for file in files:
            storage_file = KnowledgeBaseStorageService.from_knowledge_base(
                self.knowledge_base,
            ).save_file(file)
            documents.append(
                self.make_document(
                    title=storage_file.name,
                    source=storage_file.path,
                    source_type=consts.DOCUMENT_SOURCE_TYPE_FILE,
                ),
            )
        return documents


class KnowledgeBaseDocumentService:
    def __init__(self, document: KnowledgeBaseDocument):
        self.document: KnowledgeBaseDocument = document

    @classmethod
    def make_by_uuid(cls, uuid: str) -> "KnowledgeBaseDocumentService":
        return cls(KnowledgeBaseDocument.objects.get(uuid=uuid))

    def reindex_to_vector_store(self):
        self.set_reindexing()
        self.index_to_vector_store()

    @atomic
    def index_to_vector_store(self):
        processor = KnowledgeBaseProcessor(self.document.knowledge_base)
        processor.persist_to_vector_store(self.document)

    def remove_from_vector_store(self):
        processor = KnowledgeBaseProcessor(self.document.knowledge_base)
        processor.remove_from_vector_store(self.document)

    def set_processing(self):
        if self.document.status == consts.DOCUMENT_STATUS_PROCESSING:
            return
        self.document.status = consts.DOCUMENT_STATUS_PROCESSING
        self.document.error = None
        self.document.save(update_fields=["status", "error"])

    def set_ready(self):
        self.document.status = consts.DOCUMENT_STATUS_READY
        self.document.error = None
        self.document.save(update_fields=["status", "error"])

    def set_failed(self, error: str):
        self.document.status = consts.DOCUMENT_STATUS_FAILED
        self.document.error = error
        self.document.save(update_fields=["status", "error"])

    def set_reindexing(self):
        self.document.status = consts.DOCUMENT_STATUS_REINDEXING
        self.document.error = None
        self.document.save(update_fields=["status", "error"])

    def fill_from_crawl_result(self):
        crawl_result = CrawlResult.objects.get(
            uuid=self.document.metadata["crawl_result"]
        )
        data = json.load(crawl_result.result)
        self.document.content = self.remove_content_noises(data.get("markdown", ""))
        self.document.title = data.get("metadata", {}).get("title", "")
        self.document.save()

    def remove_content_noises(self, content: str) -> str:
        return NoiseRemover(content, self.document.source).remove_noises()

    def fill_from_file(self):
        document_to_text = FileToMarkdownFactory.from_knowledge_base_document(
            self.document,
        )
        self.document.content = document_to_text.convert(self.document)
        self.document.save()

    def fill(self):
        if self.document.source_type == consts.DOCUMENT_SOURCE_TYPE_CRAWL:
            self.fill_from_crawl_result()
        elif self.document.source_type == consts.DOCUMENT_SOURCE_TYPE_FILE:
            # For manual documents, we assume the content is already set
            self.fill_from_file()
