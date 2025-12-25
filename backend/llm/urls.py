from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

from llm import views

app_name = "llm"

# Register viewsets with the router
router = DefaultRouter()
router.register(
    r"provider-configs", views.ProviderConfigViewSet, basename="provider-config"
)

# Nested router for provider config models
provider_config_router = routers.NestedDefaultRouter(
    router, r"provider-configs", lookup="provider_config"
)
provider_config_router.register(
    r"models", views.ProviderConfigModelViewSet, basename="provider-config-model"
)

urlpatterns = router.urls + provider_config_router.urls
