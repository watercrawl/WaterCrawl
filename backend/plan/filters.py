import django_filters
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError

from plan.models import UsageHistory


class UsageHistoryFilter(django_filters.FilterSet):
    content_type = django_filters.ChoiceFilter(
        field_name="content_type_filter",
        label=_("Content type"),
        choices=[
            ("core.crawlrequest", "Crawl request"),
            ("core.searchrequest", "Search request"),
            ("core.sitemaprequest", "Sitemap request"),
            ("knowledge_base.knowledgebasedocument", "Knowledge base document"),
        ],
        method="filter_content_type",
    )
    team_api_key = django_filters.UUIDFilter(
        label=_("API key"), field_name="team_api_key_id"
    )

    class Meta:
        model = UsageHistory
        fields = []

    def filter_content_type(self, queryset, name, value):
        try:
            app_label, model = value.split(".")
        except ValueError:
            raise ValidationError(
                {"content_type": "Invalid value. Expected format: app_label.model"}
            )

        return queryset.filter(
            content_type__app_label=app_label, content_type__model=model
        )
