from django.conf import settings


def is_knowledge_base_enabled():
    return settings.KNOWLEDGE_BASE_ENABLED
