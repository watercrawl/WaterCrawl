from django.apps import AppConfig


class KnowledgeBaseConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "knowledge_base"

    def ready(self):
        from . import signals  # noqa: F401
