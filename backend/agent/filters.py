import django_filters
from django.utils.translation import gettext_lazy as _

from agent.models import Agent


class AgentFilter(django_filters.FilterSet):
    """Filter for Agent model with search functionality."""

    search = django_filters.CharFilter(
        method="filter_search",
        label=_("Search"),
        help_text=_("Search agents by name"),
    )

    class Meta:
        model = Agent
        fields = ["search"]

    def filter_search(self, queryset, name, value):
        """Filter agents by name (case-insensitive)."""
        if value:
            return queryset.filter(name__icontains=value)
        return queryset
