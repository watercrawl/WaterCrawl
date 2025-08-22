from django.urls import path, include
from rest_framework.routers import DefaultRouter

from knowledge_base import views
from knowledge_base.feature import is_knowledge_base_enabled

router = DefaultRouter()

if is_knowledge_base_enabled():
    router.register(
        r"knowledge-bases", views.KnowledgeBaseViewSet, basename="knowledge-base"
    )
    router.register(
        r"knowledge-bases/(?P<knowledge_base_uuid>[0-9a-fA-F-]{36})/documents",
        views.KnowledgeBaseDocumentViewSet,
        basename="knowledge-base-document",
    )
    router.register(
        r"knowledge-bases/(?P<knowledge_base_uuid>[0-9a-fA-F-]{36})/documents/(?P<document_uuid>[0-9a-fA-F-]{36})/chunks",
        views.KnowledgeBaseChunkViewSet,
        basename="knowledge-base-chunk",
    )

urlpatterns = [
    path("", include(router.urls)),
]
