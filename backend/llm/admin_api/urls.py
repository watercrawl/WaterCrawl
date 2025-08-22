from rest_framework.routers import DefaultRouter

from .views import (
    LLMModelAdminApiView,
    ProviderConfigAdminApiView,
    EmbeddingModelAdminApiView,
)


router = DefaultRouter()
router.register(
    r"provider-configs", ProviderConfigAdminApiView, basename="admin-provider-config"
)
router.register(r"llm-models", LLMModelAdminApiView, basename="admin-llm-model")
router.register(
    r"embedding-models", EmbeddingModelAdminApiView, basename="admin-provider-embedding"
)

urlpatterns = router.urls
