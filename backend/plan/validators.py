import datetime
from typing import Protocol

from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import PermissionDenied

from core.models import CrawlRequest
from core.services import ProxyService
from knowledge_base.models import KnowledgeBase
from plan.services import TeamPlanService
from plan.utils import (
    calculate_number_of_search_credits,
    calculate_number_of_sitemap_credits,
    calculate_number_of_knowledge_base_documents_credits,
)
from user.models import Team
import core.consts as core_consts


class PlanValidatorInterface(Protocol):
    def __init__(self, team: Team):
        self.team = team
        self.team_plan_service = TeamPlanService(team=team)

    def validate_daily_credit(self, requested_credit=1): ...

    def validate_credit(self, requested_credit=1): ...


class PlanValidator(PlanValidatorInterface):
    def validate_daily_credit(self, requested_credit=1):
        if (
            self.team_plan_service.remaining_daily_page_credit == -1
            or requested_credit == 0
        ):
            return

        if self.team_plan_service.remaining_daily_page_credit <= 0:
            raise PermissionDenied(
                _(
                    "You have no more daily credit left in your plan. for current request you need {} credits."
                ).format(requested_credit)
            )

        if requested_credit > self.team_plan_service.remaining_daily_page_credit:
            raise PermissionDenied(
                _(
                    "You just have {} daily credit left in your plan. for current request you need {} credits."
                ).format(
                    self.team_plan_service.remaining_daily_page_credit, requested_credit
                )
            )

    def validate_credit(self, requested_credit=1):
        if self.team_plan_service.remaining_page_credit == -1 or requested_credit == 0:
            return

        if self.team_plan_service.remaining_page_credit <= 0:
            raise PermissionDenied(
                _(
                    "You have no more pages left in your plan. for current request you need {} credits."
                ).format(requested_credit)
            )

        if requested_credit > self.team_plan_service.remaining_page_credit:
            raise PermissionDenied(
                _(
                    "You just have {} credits left in your plan. for current request you need {} credits."
                ).format(self.team_plan_service.remaining_page_credit, requested_credit)
            )


class CrawlRequestValidatorMixin(PlanValidatorInterface):
    def validate_batch_crawl_request(self, data):
        return self.validate_crawl_request(data)

    def validate_crawl_request(self, data: dict):
        requested_credit = (
            data.get("options", {}).get("spider_options", {}).get("page_limit", 1)
        )
        self.validate_daily_credit(requested_credit)
        self.validate_credit(requested_credit)

        self._validate_proxy(data)
        self._validate_max_depth(data)
        self._validate_max_limit(data)
        self._validate_plugins(data)
        self._validate_concurrent_crawl(data)

        return data

    def _validate_proxy(self, data):
        proxy_server_slug = (
            data.get("options", {}).get("spider_options", {}).get("proxy_server", None)
        )
        if not proxy_server_slug:
            return

        proxy_server = (
            ProxyService.get_team_proxies(self.team)
            .filter(slug=proxy_server_slug)
            .first()
        )
        if not proxy_server:
            return

        if proxy_server.category not in self.team_plan_service.allowed_proxy_categories:
            raise PermissionDenied(
                _(
                    "With the current plan you cannot use this proxy server."
                    " Upgrade your plan to use Premium proxy servers."
                )
            )

    def _validate_max_depth(self, data):
        if self.team_plan_service.max_depth == -1:
            return
        if (
            data.get("options", {}).get("spider_options", {}).get("max_depth", 1)
            > self.team_plan_service.max_depth
        ):
            raise PermissionDenied(
                _(
                    "Your plan does not support more than {} depth. change the max depth in spider options."
                ).format(self.team_plan_service.max_depth)
            )

    def _validate_max_limit(self, data):
        if self.team_plan_service.crawl_max_limit == -1:
            return
        if (
            data.get("options", {}).get("spider_options", {}).get("page_limit", 1)
            > self.team_plan_service.crawl_max_limit
        ):
            raise PermissionDenied(
                _(
                    "Your plan does not support more than {} pages per crawl. change the page limit in spider options."
                ).format(self.team_plan_service.crawl_max_limit)
            )

    def _validate_plugins(self, data):
        pass

    def _validate_concurrent_crawl(self, data):
        if self.team_plan_service.max_concurrent_crawl == -1:
            return
        if (
            self.team.crawl_requests.filter(
                status__in=[
                    core_consts.CRAWL_STATUS_NEW,
                    core_consts.CRAWL_STATUS_RUNNING,
                ],
                created_at__gte=timezone.now() - datetime.timedelta(hours=2),
            ).count()
            >= self.team_plan_service.max_concurrent_crawl
        ):
            raise PermissionDenied(
                _(
                    "Your plan does not support more than {} concurrent crawls. Wait for them to finish."
                ).format(self.team_plan_service.max_concurrent_crawl)
            )


class SearchRequestValidatorMixin(PlanValidatorInterface):
    def validate_search_request(self, data: dict):
        number_of_results = data.get("result_limit", 5)
        depth = data.get("search_options", {}).get(
            "depth", core_consts.SEARCH_DEPTH_BASIC
        )
        number_of_credit = calculate_number_of_search_credits(number_of_results, depth)

        self.validate_daily_credit(number_of_credit)
        self.validate_credit(number_of_credit)

        self._validate_current_search(data)

        return data

    def _validate_current_search(self, data: dict):
        if self.team_plan_service.max_concurrent_crawl == -1:
            return

        if (
            self.team.search_requests.filter(
                status__in=[
                    core_consts.CRAWL_STATUS_NEW,
                    core_consts.CRAWL_STATUS_RUNNING,
                ],
                created_at__gte=timezone.now() - datetime.timedelta(hours=2),
            ).count()
            >= self.team_plan_service.max_concurrent_crawl
        ):
            raise PermissionDenied(
                _(
                    "Your plan does not support more than {} concurrent searches. Wait for them to finish."
                ).format(self.team_plan_service.max_concurrent_crawl)
            )


class SitemapRequestValidatorMixin(PlanValidatorInterface):
    def validate_sitemap_request(self, data: dict):
        number_of_credit = calculate_number_of_sitemap_credits(
            data.get("options", {}).get("ignore_sitemap_xml", False)
        )
        self.validate_daily_credit(number_of_credit)
        self.validate_credit(number_of_credit)

        self._validate_current_sitemap(data)

        return data

    def _validate_current_sitemap(self, data: dict):
        if self.team_plan_service.max_concurrent_crawl == -1:
            return

        if (
            self.team.sitemap_requests.filter(
                status__in=[
                    core_consts.CRAWL_STATUS_NEW,
                    core_consts.CRAWL_STATUS_RUNNING,
                ],
                created_at__gte=timezone.now() - datetime.timedelta(hours=2),
            ).count()
            >= self.team_plan_service.max_concurrent_crawl
        ):
            raise PermissionDenied(
                _(
                    "Your plan does not support more than {} concurrent sitemaps. Wait for them to finish."
                ).format(self.team_plan_service.max_concurrent_crawl)
            )


class KnowledgeBaseRequestValidatorMixin(PlanValidatorInterface):
    def validate_create_knowledge_base(self, data: dict):
        self._validate_number_of_knowledge_bases()

        data["knowledge_base_each_document_cost"] = 0

        embedding_provider_config = data.get("embedding_provider_config")
        if embedding_provider_config and embedding_provider_config.team != self.team:
            data["knowledge_base_each_document_cost"] += 1

        summary_provider_config = data.get("summarization_provider_config")
        if summary_provider_config and summary_provider_config.team != self.team:
            data["knowledge_base_each_document_cost"] += 1

        return data

    def _validate_number_of_knowledge_bases(self):
        if self.team_plan_service.number_of_knowledge_bases == -1:
            return
        number_of_knowledge_used = self.team.knowledge_bases.count()

        if number_of_knowledge_used >= self.team_plan_service.number_of_knowledge_bases:
            raise PermissionDenied(
                _(
                    "Your plan does not support more than {} knowledge bases. You can not create more."
                ).format(self.team_plan_service.number_of_knowledge_bases)
            )

    def validate_create_knowledge_base_document_from_manual(
        self, knowledge_base: KnowledgeBase, attrs
    ):
        self._validate_number_of_knowledge_base_documents(knowledge_base)

        number_of_credit = calculate_number_of_knowledge_base_documents_credits(
            knowledge_base
        )
        self.validate_daily_credit(number_of_credit)
        self.validate_credit(number_of_credit)

        return attrs

    def _validate_number_of_knowledge_base_documents(
        self, knowledge_base: KnowledgeBase, new_document_count=1
    ):
        if self.team_plan_service.number_of_knowledge_bases == -1:
            return

        total_number_of_documents = (
            knowledge_base.documents.count() + new_document_count
        )

        if (
            total_number_of_documents
            >= self.team_plan_service.number_of_each_knowledge_base_documents
        ):
            raise PermissionDenied(
                _(
                    "Your current plan does not support more than {} documents per knowledge base. "
                    "This knowledge base has {} documents left. "
                    "Your request will add {} documents."
                ).format(
                    self.team_plan_service.number_of_each_knowledge_base_documents,
                    self.team_plan_service.number_of_each_knowledge_base_documents
                    - knowledge_base.documents.count(),
                    new_document_count,
                )
            )

    def validate_create_knowledge_base_document_from_urls(
        self, knowledge_base: KnowledgeBase, attrs
    ):
        attrs["urls"] = list(set(attrs["urls"]))
        # number of urls needed to crawl
        number_of_credit = number_of_documents = len(attrs["urls"])

        self._validate_number_of_knowledge_base_documents(
            knowledge_base, number_of_documents
        )

        # number of urls needed to crawl + total credit for importing to knowledge base
        number_of_credit += calculate_number_of_knowledge_base_documents_credits(
            knowledge_base, number_of_documents
        )
        self.validate_daily_credit(number_of_credit)
        self.validate_credit(number_of_credit)

        return attrs

    def validate_create_knowledge_base_document_from_crawl_results(
        self, knowledge_base: KnowledgeBase, number_of_documents: int, attrs
    ):
        self._validate_number_of_knowledge_base_documents(
            knowledge_base, number_of_documents
        )

        # no extra credit needed for crawl just credits for importing to knowledge base
        number_of_credit = calculate_number_of_knowledge_base_documents_credits(
            knowledge_base, number_of_documents
        )
        self.validate_daily_credit(number_of_credit)
        self.validate_credit(number_of_credit)

        return attrs

    def validate_create_knowledge_base_document_from_crawl_requests(
        self, knowledge_base: KnowledgeBase, crawl_request: CrawlRequest, attrs
    ):
        number_of_documents = crawl_request.number_of_documents()
        self._validate_number_of_knowledge_base_documents(
            knowledge_base, number_of_documents
        )

        # no extra credit needed for crawl just credits for importing to knowledge base
        number_of_credit = calculate_number_of_knowledge_base_documents_credits(
            knowledge_base, number_of_documents
        )
        self.validate_daily_credit(number_of_credit)
        self.validate_credit(number_of_credit)

        return attrs

    def validate_create_knowledge_base_document_from_file(
        self, knowledge_base: KnowledgeBase, attrs
    ):
        number_of_documents = len(attrs["files"])
        self._validate_number_of_knowledge_base_documents(
            knowledge_base, number_of_documents
        )

        number_of_credit = calculate_number_of_knowledge_base_documents_credits(
            knowledge_base, number_of_documents
        )
        self.validate_daily_credit(number_of_credit)
        self.validate_credit(number_of_credit)

        return attrs


class CanInviteNewMemberValidatorMixin(PlanValidatorInterface):
    def can_add_new_member(self):
        number_of_current_members = (
            self.team.members.count()
            + self.team.invitations.filter(activated=False).count()
        )

        if self.team_plan_service.plan_number_users == -1:
            return

        if self.team_plan_service.plan_number_users > number_of_current_members:
            return

        raise PermissionDenied(
            _("You have reached the maximum number of users for your plan.")
        )


class PlanLimitValidator(
    CrawlRequestValidatorMixin,
    SearchRequestValidatorMixin,
    SitemapRequestValidatorMixin,
    KnowledgeBaseRequestValidatorMixin,
    CanInviteNewMemberValidatorMixin,
    PlanValidator,
):
    pass
