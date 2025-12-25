# API Design and Views Pattern

## DRF ViewSet Pattern

### Standard ViewSet Structure

```python
from rest_framework.viewsets import GenericViewSet
from rest_framework import mixins
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema_view

from user.decorators import setup_current_team
from user.permissions import IsAuthenticatedTeam


@extend_schema_view(
    list=extend_schema(summary=_("List resources"), tags=["Resources"]),
    create=extend_schema(summary=_("Create resource"), tags=["Resources"]),
)
@setup_current_team  # ✅ REQUIRED for team-scoped resources
class MyResourceViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    permission_classes = [IsAuthenticatedTeam]
    serializer_class = MyResourceSerializer
    queryset = MyResource.objects.none()
    filterset_fields = ["status", "created_at"]
    
    def get_queryset(self):
        """✅ ALWAYS filter by current team."""
        return self.request.current_team.my_resources.order_by(
            "-created_at"
        ).all()
    
    def perform_create(self, serializer):
        """✅ Auto-assign team and dispatch tasks."""
        instance = serializer.save(team=self.request.current_team)
        
        from .tasks import process_task
        process_task.apply_async(
            kwargs={"resource_pk": instance.pk},
            task_id=str(instance.uuid)
        )
```

## Team-Based Authentication

### The @setup_current_team Decorator

**CRITICAL:** Apply to all team-scoped ViewSets.

```python
@setup_current_team  # Injects request.current_team
class MyViewSet(GenericViewSet):
    permission_classes = [IsAuthenticatedTeam]
```

**What it does:**
1. Checks JWT → reads `X-Team-ID` header
2. Falls back to `X-API-Key` authentication
3. Sets `request.current_team`

### Permission Classes

```python
# Team-scoped resources
permission_classes = [IsAuthenticatedTeam]

# Admin-only
permission_classes = [IsSuperUser]

# Public
permission_classes = []
```

## Custom Actions

```python
@action(detail=True, methods=["get"], url_path="download")
def download(self, request, **kwargs):
    obj = self.get_object()
    service = MyResourceService(obj)
    return StreamingHttpResponse(service.generate_download())

@action(detail=False, methods=["post"], url_path="batch")
def batch_create(self, request):
    # List-level action (no PK required)
    pass
```

## Critical Rules

- ✅ **ALWAYS** use `@setup_current_team` for team resources
- ✅ **ALWAYS** filter queryset by `request.current_team`
- ✅ **ALWAYS** use `IsAuthenticatedTeam` permission
- ✅ **ALWAYS** pass team in `perform_create()`
- ✅ Use services for business logic, not views
- ✅ Document with `@extend_schema_view`
