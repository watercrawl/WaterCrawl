from rest_framework.throttling import SimpleRateThrottle
from django.utils.translation import gettext_lazy as _

from plan.services import TeamPlanService


class TeamBasedThrottle(SimpleRateThrottle):
    scope = "team"

    def __init__(self) -> None:
        # Override the usual SimpleRateThrottle, because we can't determine
        # the rate until called by the view.
        pass

    def get_cache_key(self, request, view):
        if not getattr(request, "current_team", None):
            raise ValueError(
                _("Cannot throttle a request without a team attached to it.")
            )
        return f"throttle_knowledge_base_retrival_{request.current_team.pk}"

    def set_rate(self, rate):
        self.rate = rate
        self.num_requests, self.duration = self.parse_rate(rate)

    def get_rate_limit_for_team(self, request, team):
        raise NotImplementedError

    def allow_request(self, request, view):
        team = getattr(request, "current_team", None)
        if not team:
            raise ValueError(
                _("Cannot throttle a request without a team attached to it.")
            )

        rate_limit = self.get_rate_limit_for_team(request, team)
        self.set_rate(rate_limit)
        return super().allow_request(request, view)


class KnowledgeBaseRetrivalRateThrottle(TeamBasedThrottle):
    scope = "knowledge_base_retrival"

    def get_rate_limit_for_team(self, request, team):
        return TeamPlanService(request.current_team).knowledge_base_retrival_rate_limit


class SummaryEnhancementRateThrottle(TeamBasedThrottle):
    scope = "summary_enhancement"

    def get_rate_limit_for_team(self, request, team):
        return "10/day"
