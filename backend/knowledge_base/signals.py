from django.db.models import signals
from django.dispatch import receiver

from knowledge_base import consts
from llm.models import ProviderConfig


@receiver(signals.pre_delete, sender=ProviderConfig)
def pre_delete_provider_config(sender, instance: ProviderConfig, **kwargs):
    instance.embedding_knowledge_bases.update(
        status=consts.KNOWLEDGE_BASE_STATUS_ARCHIVED
    )
    instance.summarization_knowledge_bases.update(
        status=consts.KNOWLEDGE_BASE_STATUS_ARCHIVED
    )
