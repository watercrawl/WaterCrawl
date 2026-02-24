import django_filters
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from knowledge_base.models import KnowledgeBase, KnowledgeBaseQuery


class KnowledgeBaseFilter(django_filters.FilterSet):
    """Filter for KnowledgeBase model with search functionality."""

    search = django_filters.CharFilter(
        method="filter_search",
        label=_("Search"),
        help_text=_("Search knowledge bases by title or description"),
    )

    class Meta:
        model = KnowledgeBase
        fields = ["search"]

    from django.db.models import Q

    def filter_search(self, queryset, name, value):
        """Filter knowledge bases by title or description (case-insensitive)."""
        if value:
            return queryset.filter(
                Q(title__icontains=value) | Q(description__icontains=value)
            )
        return queryset


class KnowledgeBaseQueryFilter(django_filters.FilterSet):
    """Filter for KnowledgeBaseQuery model."""

    status = django_filters.CharFilter(
        field_name="status",
        lookup_expr="iexact",
        label=_("Status"),
        help_text=_("Filter by query status"),
    )
    knowledge_base = django_filters.UUIDFilter(
        field_name="knowledge_base__uuid",
        label=_("Knowledge Base"),
        help_text=_("Filter by knowledge base UUID"),
    )

    class Meta:
        model = KnowledgeBaseQuery
        fields = ["status", "knowledge_base"]
