from celery import shared_task
from django.db.models.functions import Lower

from core.services import CrawlerService
from core.tasks import run_spider
from knowledge_base import consts
from knowledge_base.models import KnowledgeBaseDocument
from knowledge_base.services import KnowledgeBaseDocumentService, KnowledgeBaseService


@shared_task
def after_create_knowledge_base(knowledge_base_id):
    """After create knowledge base."""
    # todo: create vector store for knowledge base
    pass


@shared_task
def after_delete_knowledge_base(knowledge_base_id):
    """After delete knowledge base."""
    # todo: delete vector store for knowledge base
    KnowledgeBaseService.make_by_uuid(knowledge_base_id).delete_forever()


@shared_task
def crawl_documents(document_ids):
    # create a new crawl request
    query = KnowledgeBaseDocument.objects.filter(pk__in=document_ids)
    if not query.exists():
        return

    crawl_service = CrawlerService.make_with_urls(
        list(query.values_list("source", flat=True)),
        team=query.first().knowledge_base.team,
    )

    query.update(status=consts.DOCUMENT_STATUS_CRAWLING)
    run_spider.apply_async(
        args=(str(crawl_service.crawl_request.pk),),
        link=after_crawl.si(
            document_ids=document_ids,
            crawl_request_uuid=str(crawl_service.crawl_request.uuid),
        ),
    )


@shared_task
def after_crawl(document_ids, crawl_request_uuid):
    """After crawl documents."""
    documents = KnowledgeBaseDocument.objects.filter(pk__in=document_ids)
    crawl_request = CrawlerService.make_with_pk(crawl_request_uuid).crawl_request
    query = crawl_request.results.annotate(normalized_url=Lower("url"))
    for document in documents:
        normalized_url = document.source.lower().rstrip("/")
        same_urls = [normalized_url, normalized_url + "/"]
        result = query.filter(
            normalized_url__in=same_urls,
        ).first()
        if not result:
            document.status = consts.DOCUMENT_STATUS_FAILED
            document.save(update_fields=["status"])
            continue

        document.metadata["crawl_result"] = str(result.pk)
        document.metadata["crawl_request"] = str(crawl_request.uuid)
        document.source_type = consts.DOCUMENT_SOURCE_TYPE_CRAWL
        document.save()

        process_document.delay(str(document.pk))


@shared_task
def process_document(document_id):
    service = KnowledgeBaseDocumentService.make_by_uuid(document_id)
    service.set_processing()
    try:
        service.fill()
        service.index_to_vector_store()
        service.set_ready()
    except Exception as e:
        import traceback

        traceback.print_exc()
        service.set_failed(str(e))
