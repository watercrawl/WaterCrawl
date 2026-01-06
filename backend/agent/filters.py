import django_filters
from django.utils.translation import gettext_lazy as _

from agent.models import Agent
from agent import consts
from django.db.models import Exists, OuterRef
from agent.models import AgentVersion


class AgentFilter(django_filters.FilterSet):
    """Filter for Agent model with search and status functionality."""

    search = django_filters.CharFilter(
        method="filter_search",
        label=_("Search"),
        help_text=_("Search agents by name"),
    )

    status = django_filters.CharFilter(
        method="filter_status",
        label=_("Status"),
        help_text=_("Filter agents by status (published, draft)"),
    )

    class Meta:
        model = Agent
        fields = ["search", "status"]

    def filter_search(self, queryset, name, value):
        """Filter agents by name (case-insensitive)."""
        if value:
            return queryset.filter(name__icontains=value)
        return queryset

    def filter_status(self, queryset, name, value):
        """Filter agents by their current status."""
        if not value:
            return queryset

        if value == consts.AGENT_VERSION_STATUS_PUBLISHED:
            # Agent is published if it has at least one published version
            published_versions = AgentVersion.objects.filter(
                agent=OuterRef("pk"), status=consts.AGENT_VERSION_STATUS_PUBLISHED
            )
            return queryset.annotate(has_published=Exists(published_versions)).filter(
                has_published=True
            )
        elif value == consts.AGENT_VERSION_STATUS_DRAFT:
            # Agent is draft if it has a draft version and NO published version
            draft_versions = AgentVersion.objects.filter(
                agent=OuterRef("pk"), status=consts.AGENT_VERSION_STATUS_DRAFT
            )
            published_versions = AgentVersion.objects.filter(
                agent=OuterRef("pk"), status=consts.AGENT_VERSION_STATUS_PUBLISHED
            )
            return (
                queryset.annotate(has_draft=Exists(draft_versions))
                .annotate(has_published=Exists(published_versions))
                .filter(has_draft=True, has_published=False)
            )

        return queryset
