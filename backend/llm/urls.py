from rest_framework.routers import DefaultRouter

from llm import views

app_name = "llm"

# Register viewsets with the router
router = DefaultRouter()
router.register(
    r"provider-configs", views.ProviderConfigViewSet, basename="provider-config"
)

urlpatterns = router.urls
