from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

from .views import (
    LLMModelAdminApiView,
    ProviderConfigAdminApiView,
    EmbeddingModelAdminApiView,
    ProviderConfigModelAdminViewSet,
)

router = DefaultRouter()
router.register(
    r"provider-configs", ProviderConfigAdminApiView, basename="admin-provider-config"
)
router.register(
    r"(?P<provider_name>[^/.]+)/llm-models",
    LLMModelAdminApiView,
    basename="admin-llm-model",
)
router.register(
    r"(?P<provider_name>[^/.]+)/embedding-models",
    EmbeddingModelAdminApiView,
    basename="admin-provider-embedding",
)

# Nested router for provider config models (admin)
provider_config_router = routers.NestedDefaultRouter(
    router, r"provider-configs", lookup="provider_config"
)
provider_config_router.register(
    r"models", ProviderConfigModelAdminViewSet, basename="admin-provider-config-model"
)

urlpatterns = router.urls + provider_config_router.urls
