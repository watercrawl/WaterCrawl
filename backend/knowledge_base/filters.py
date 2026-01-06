import django_filters
from django.utils.translation import gettext_lazy as _

from knowledge_base.models import KnowledgeBase


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
