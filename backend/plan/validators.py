import datetime

from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError, PermissionDenied

from plan.services import TeamPlanService
from user.models import Team
import core.consts as core_consts


class PlanLimitValidator:
    def __init__(self, team: Team):
        self.team = team
        self.team_plan_service = TeamPlanService(team=team)

    def validate_crawl_request(self, data: dict):
        self._validate_remaining_pages(data)
        self._validate_max_depth(data)
        self._validate_max_limit(data)
        self._validate_plugins(data)
        self._validate_concurrent_crawl(data)

        return data

    def _validate_remaining_pages(self, data: dict):
        if self.team_plan_service.remaining_page_credit == -1:
            return

        if self.team_plan_service.remaining_page_credit <= 0:
            raise PermissionDenied(_('You have no more pages left in your plan'))

        page_limit = data.get('options', {}).get('spider_options', {}).get('page_limit', 1)
        if page_limit > self.team_plan_service.remaining_page_credit:
            raise PermissionDenied(
                _('You just have {} page credits left in your plan. change the page limit in spider options.').format(
                    self.team_plan_service.remaining_page_credit)
            )

        if self.team_plan_service.remaining_daily_page_credit == -1:
            return

        if self.team_plan_service.remaining_daily_page_credit <= 0:
            raise PermissionDenied(_('You have no more daily pages left in your plan'))

        if page_limit > self.team_plan_service.remaining_daily_page_credit:
            raise PermissionDenied(
                _('You just have {} daily pages left in your plan. change the page limit in spider options.').format(
                    self.team_plan_service.remaining_daily_page_credit)
            )

    def _validate_max_depth(self, data):
        if self.team_plan_service.max_depth == -1:
            return
        if data.get('options', {}).get('spider_options', {}).get('max_depth', 1) > self.team_plan_service.max_depth:
            raise PermissionDenied(
                _('Your plan does not support more than {} depth. change the max depth in spider options.').format(
                    self.team_plan_service.max_depth
                )
            )

    def _validate_max_limit(self, data):
        if self.team_plan_service.crawl_max_limit == -1:
            return
        if data.get('options', {}).get('spider_options', {}).get('page_limit', 1) > self.team_plan_service.crawl_max_limit:
            raise PermissionDenied(
                _('Your plan does not support more than {} pages per crawl. change the page limit in spider options.').format(
                    self.team_plan_service.crawl_max_limit
                )
            )

    def _validate_plugins(self, data):
        pass

    def _validate_concurrent_crawl(self, data):
        if self.team_plan_service.max_concurrent_crawl == -1:
            return
        if self.team.crawl_requests.filter(
                status__in=[
                    core_consts.CRAWL_STATUS_NEW,
                    core_consts.CRAWL_STATUS_RUNNING,
                ],
                created_at__gte=timezone.now() - datetime.timedelta(hours=2)
        ).count() >= self.team_plan_service.max_concurrent_crawl:
            raise PermissionDenied(
                _('Your plan does not support more than {} concurrent crawls. Wait for them to finish.').format(
                    self.team_plan_service.max_concurrent_crawl
                )
            )
