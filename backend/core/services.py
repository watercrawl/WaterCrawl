import base64
import fnmatch
import io
import json
import subprocess
import urllib
import zipfile
from collections import OrderedDict
from datetime import timedelta
from functools import cached_property
from time import time
from typing import Optional
from urllib.parse import urlparse

import requests
from celery.result import AsyncResult
from django.conf import settings
from django.core.files.base import ContentFile
from django.db.models import Count, F, Q
from django.utils import timezone
from django_redis import get_redis_connection
from django.utils.translation import gettext as _

from common.encryption import decrypt_key
from core import consts
from core.models import (
    CrawlRequest,
    CrawlResult,
    SearchRequest,
    ProxyServer,
    SitemapRequest,
)
from core.utils import get_active_plugins
from spider.items import ScrapedItem
from user.models import Team
from user.utils import load_class_by_name
from watercrawl.celery import app


class BaseHelpers:
    @property
    def wait_time(self):
        return 500

    @property
    def timeout(self):
        return 15000

    @property
    def accept_cookies_selector(self):
        return None

    @property
    def locale(self):
        return "en-US"

    @property
    def extra_headers(self):
        return None

    @property
    def actions(self):
        return []


class CrawlHelpers(BaseHelpers):
    def __init__(self, crawl_request: CrawlRequest):
        self.crawl_request = crawl_request

    def get_allowed_domains(self) -> list[str]:
        parsed_url = urlparse(self.crawl_request.url)
        allowed_domains = self.crawl_request.options.get("spider_options", {}).get(
            "allowed_domains", []
        )
        if not allowed_domains:
            domain = parsed_url.netloc
            if domain.startswith("www."):
                domain = domain[4:]

            allowed_domains = ["*.{}".format(domain), domain]

        return allowed_domains

    @cached_property
    def allowed_domains(self):
        return self.get_allowed_domains()

    def get_spider_settings(self):
        max_depth = self.crawl_request.options.get("spider_options", {}).get(
            "max_depth", 100
        )

        page_limit = self.crawl_request.options.get("spider_options", {}).get(
            "page_limit", 1
        )

        concurrent_requests = (
            self.crawl_request.options.get("spider_options", {}).get(
                "concurrent_requests", None
            )
            or settings.SCRAPY_CONCURRENT_REQUESTS
        )

        return [
            "-s",
            "DEPTH_LIMIT={}".format(max_depth),
            "-s",
            "MAX_REQUESTS={}".format(page_limit),  # +2 for the robots.txt
            "-s",
            "CONCURRENT_REQUESTS={}".format(str(concurrent_requests)),
            "-s",
            "CONCURRENT_REQUESTS_PER_DOMAIN={}".format(
                str(settings.SCRAPY_CONCURRENT_REQUESTS_PER_DOMAIN)
            ),
            "-s",
            "CONCURRENT_REQUESTS_PER_IP={}".format(
                str(settings.SCRAPY_CONCURRENT_REQUESTS_PER_IP)
            ),
        ]

    @cached_property
    def __include_paths(self):
        return self.crawl_request.options.get("spider_options", {}).get(
            "include_paths", []
        )

    @cached_property
    def __exclude_paths(self):
        return self.crawl_request.options.get("spider_options", {}).get(
            "exclude_paths", []
        )

    def is_allowed_path(self, url):
        parsed_url = urlparse(url)
        if parsed_url.scheme in ["tel", "mailto", "mail"]:
            return False

        # skip if the url is a file
        splited = parsed_url.path.split(".")
        if len(splited) > 1 and splited[-1] in consts.IGNORE_FILE_TYPES:
            return False

        domain_matched = False
        for allowed_domain in self.allowed_domains:
            if fnmatch.fnmatch(parsed_url.netloc, allowed_domain):
                domain_matched = True
                break

        if not domain_matched:
            return False

        # check include path with start check
        uri = parsed_url.path

        # if there is no include path the current path is included
        included = not self.__include_paths

        if not included:
            for include_path in self.__include_paths:
                if fnmatch.fnmatch(uri, include_path):
                    included = True
                    break

        if not included:
            return False

        # check exclude path with start check
        for exclude_path in self.__exclude_paths:
            if fnmatch.fnmatch(uri, exclude_path):
                return False

        return True

    @cached_property
    def include_tags(self):
        return self.crawl_request.options.get("page_options", {}).get(
            "include_tags", []
        )

    @cached_property
    def exclude_tags(self):
        return self.crawl_request.options.get("page_options", {}).get(
            "exclude_tags", []
        )

    @cached_property
    def only_main_content(self):
        return self.crawl_request.options.get("page_options", {}).get(
            "only_main_content", True
        )

    def get_html_filter_options(self):
        return {
            "only_main_content": self.only_main_content,
            "exclude_tags": self.exclude_tags,
            "include_tags": self.include_tags,
        }

    @cached_property
    def include_html(self):
        return self.crawl_request.options.get("page_options", {}).get(
            "include_html", False
        )

    @cached_property
    def include_links(self):
        return self.crawl_request.options.get("page_options", {}).get(
            "include_links", False
        )

    @cached_property
    def wait_time(self):
        return self.crawl_request.options.get("page_options", {}).get("wait_time", 0)

    @cached_property
    def timeout(self):
        return self.crawl_request.options.get("page_options", {}).get("timeout", 15000)

    @cached_property
    def accept_cookies_selector(self):
        return self.crawl_request.options.get("page_options", {}).get(
            "accept_cookies_selector", None
        )

    @cached_property
    def locale(self):
        return self.crawl_request.options.get("page_options", {}).get("locale", "en-US")

    @cached_property
    def extra_headers(self):
        return self.crawl_request.options.get("page_options", {}).get(
            "extra_headers", {}
        )

    @cached_property
    def actions(self):
        return self.crawl_request.options.get("page_options", {}).get("actions", [])

    def get_plugins(self):
        for item in settings.WATERCRAWL_PLUGINS:
            plugin = load_class_by_name(item)
            yield plugin

    @cached_property
    def ignore_rendering(self):
        return self.crawl_request.options.get("page_options", {}).get(
            "ignore_rendering", False
        )


class SearchHelpers(BaseHelpers):
    def __init__(self, search_request: SearchRequest):
        self.search_request = search_request

    @cached_property
    def depth(self):
        return self.search_request.search_options.get(
            "depth", consts.SEARCH_DEPTH_BASIC
        )

    @cached_property
    def search_query(self):
        return self.search_request.query

    @property
    def language(self):
        return self.search_request.search_options.get("language", None)

    @property
    def country(self):
        return self.search_request.search_options.get("country", None)

    @property
    def advanced_search(self) -> bool:
        return self.depth != consts.SEARCH_DEPTH_BASIC

    @property
    def is_ultimate(self) -> bool:
        return self.depth == consts.SEARCH_DEPTH_ULTIMATE

    @property
    def time_range(self):
        value = self.search_request.search_options.get(
            "time_renge", consts.SEARCH_TIME_RENGE_ANY
        )
        if value == consts.SEARCH_TIME_RENGE_ANY:
            return None
        return value


class SitemapHelpers(BaseHelpers):
    def __init__(self, sitemap_request: SitemapRequest):
        self.sitemap_request = sitemap_request

    @cached_property
    def base_url(self) -> str:
        parsed_url = urlparse(self.sitemap_request.url)
        return f"{parsed_url.scheme}://{parsed_url.netloc}"

    @cached_property
    def domain(self) -> str:
        parsed_url = urlparse(self.sitemap_request.url)
        domain = parsed_url.netloc
        if domain.startswith("www."):
            domain = domain[4:]
        return domain

    @cached_property
    def search_value(self) -> Optional[str]:
        search_value = self.sitemap_request.options.get("search", "")
        return search_value.strip().lower() if search_value else None

    @cached_property
    def __split_search_value(self) -> list[str]:
        if self.search_value:
            return self.search_value.split(" ")
        return []

    @cached_property
    def search_query(self) -> str:
        if self.search_value:
            return "site:{} {}".format(self.domain, self.search_value)
        return "site:{}".format(self.domain)

    @cached_property
    def ignore_sitemap_xml(self):
        return self.sitemap_request.options.get("ignore_sitemap_xml", False)

    @cached_property
    def __include_paths(self):
        return self.sitemap_request.options.get("include_paths", [])

    @cached_property
    def __exclude_paths(self):
        return self.sitemap_request.options.get("exclude_paths", [])

    def is_allowed_domain(self, url):
        parsed_url = urlparse(url)
        host = parsed_url.netloc
        if host.startswith("www."):
            host = host[4:]

        if self.domain == host:
            return True

        include_subdomains = bool(
            self.sitemap_request.options.get("include_subdomains", True)
        )
        if not include_subdomains:
            return False

        # Check if the host is a subdomain of the main domain
        if host.endswith(f".{self.domain}"):
            return True

        return False

    def is_allowed_path(self, url):
        parsed_url = urlparse(url)
        if parsed_url.scheme in ["tel", "mailto", "mail"]:
            return False

        # skip if the url is a file
        splited = parsed_url.path.split(".")
        if len(splited) > 1 and splited[-1] in consts.IGNORE_FILE_TYPES:
            return False

        # check include path with start check
        uri = parsed_url.path

        # if there is no include path the current path is included
        included = not self.__include_paths

        if not included:
            for include_path in self.__include_paths:
                if fnmatch.fnmatch(uri, include_path):
                    included = True
                    break

        if not included:
            return False

        # check exclude path with start check
        for exclude_path in self.__exclude_paths:
            if fnmatch.fnmatch(uri, exclude_path):
                return False

        return True

    def is_allowed_search(self, url):
        parsed_url = urlparse(url)
        uri = parsed_url.path
        if self.search_value:
            # Use BM25 score with threshold for filtering
            bm25_score = self.__check_search_value(uri)
            # Minimum threshold for relevance (configurable)
            min_threshold = 0.5
            return bm25_score >= min_threshold
        return True

    def __check_search_value(self, path: str) -> float:
        """
        BM25 scoring for search terms in URL path.
        Returns a relevance score instead of boolean match.
        """
        if not self.__split_search_value:
            return 1.0

        # BM25 parameters
        k1 = 1.2
        b = 0.75

        # Tokenize path for analysis
        # Decode percent-encoded characters before tokenizing
        path_lower = urllib.parse.unquote(path).lower()
        # Split path into tokens (by common URL separators)
        path_tokens = []
        for separator in ["/", "-", "_", ".", "?", "&", "="]:
            path_lower = path_lower.replace(separator, " ")
        path_tokens = [token for token in path_lower.split() if token]

        if not path_tokens:
            return 0.0

        doc_length = len(path_tokens)
        # Use average URL path length as baseline (typically 3-5 segments)
        avg_doc_length = 4.0

        total_score = 0.0

        for search_term in self.__split_search_value:
            search_term = search_term.lower().strip()
            if not search_term:
                continue

            # Calculate term frequency in path
            tf = 0
            for token in path_tokens:
                if search_term in token:
                    # Full match gets higher score than partial match
                    if token == search_term:
                        tf += 2
                    else:
                        tf += 1

            if tf > 0:
                # Simplified IDF (assuming moderate term frequency in collection)
                idf = 2.0  # Static IDF for URL path matching

                # BM25 formula
                numerator = tf * (k1 + 1)
                denominator = tf + k1 * (1 - b + b * (doc_length / avg_doc_length))

                term_score = idf * (numerator / denominator)
                total_score += term_score

        return total_score


class BasePubSupService:
    def send_status(self, event_type, payload=None):
        self.connection.publish(
            self.redis_channel,
            json.dumps({"event_type": event_type, "payload": payload}),
        )

    def send_feed(self, message, feed_type: str = "info", metadata=None):
        self.connection.publish(
            self.redis_channel,
            json.dumps(
                {
                    "event_type": "feed",
                    "payload": {
                        "id": "{}".format(time()),
                        "type": feed_type,
                        "message": message,
                        "timestamp": timezone.now().isoformat(),
                        "metadata": metadata or {},
                    },
                }
            ),
        )


class CrawlPupSupService(BasePubSupService):
    def __init__(self, crawl_request: CrawlRequest):
        self.crawl_request = crawl_request
        self.redis_channel = f"crawl:{self.crawl_request.uuid}"
        self.connection = get_redis_connection("default")

    def check_status(self, prefetched=False):
        """
        New method using Redis Pub/Sub for real-time updates.
        If no new data comes from Redis, it sends crawl status every 5 seconds.
        """
        from .serializers import (
            CrawlResultSerializer,
            CrawlRequestSerializer,
            FullCrawlResultSerializer,
        )

        ResultSerializer = (
            CrawlResultSerializer if not prefetched else FullCrawlResultSerializer
        )

        # Initialize Redis connection and pubsub
        pubsub = self.connection.pubsub()
        pubsub.subscribe(self.redis_channel)

        # Initialize tracking variables
        items_already_sent = []
        send_state_interval = 5  # Send state every 5 seconds

        # First load existing results from database that might have been added
        # before subscription was established
        queryset = self.crawl_request.results.prefetch_related("attachments").all()
        for item in queryset:
            items_already_sent.append(item.pk)
            yield {"type": "result", "data": ResultSerializer(item).data}

        # Send initial state
        self.crawl_request.refresh_from_db()
        yield {"type": "state", "data": CrawlRequestSerializer(self.crawl_request).data}
        last_state_time = time()

        # Process messages while the task is running
        while AsyncResult(str(self.crawl_request.uuid)).state in ("PENDING", "STARTED"):
            self.crawl_request.refresh_from_db()
            if self.crawl_request.status in [
                consts.CRAWL_STATUS_CANCELED,
                consts.CRAWL_STATUS_FINISHED,
                consts.CRAWL_STATUS_FAILED,
            ]:
                break

            # Check for new messages with a timeout
            message = pubsub.get_message(timeout=0.1)

            if message and message["type"] == "message":
                # Process the message
                try:
                    data = json.loads(message["data"].decode("utf-8"))
                    if data["event_type"] == "result":
                        # If it's a result, track it
                        item = queryset.filter(pk=data["payload"]).first()
                        if not item:
                            continue
                        items_already_sent.append(item.pk)
                        yield {"type": "result", "data": ResultSerializer(item).data}
                    elif data["event_type"] == "state":
                        self.crawl_request.refresh_from_db()
                        last_state_time = time()
                        yield {
                            "type": "state",
                            "data": CrawlRequestSerializer(self.crawl_request).data,
                        }
                    elif data["event_type"] == "feed":
                        yield {
                            "type": "feed",
                            "data": data["payload"],
                        }
                except Exception as e:
                    # Log error but continue
                    print(f"Error processing Redis message: {str(e)}")

            # Check if we need to send state update
            current_time = time()
            if current_time - last_state_time >= send_state_interval:
                self.crawl_request.refresh_from_db()
                yield {
                    "type": "state",
                    "data": CrawlRequestSerializer(self.crawl_request).data,
                }
                last_state_time = current_time

        # After the task is complete, check for any missed results from the database
        # This ensures we don't miss any items that might have been added
        # after our subscription was established but before messages were processed
        queryset = self.crawl_request.results.prefetch_related("attachments").exclude(
            pk__in=items_already_sent
        )
        for item in queryset:
            yield {"type": "result", "data": ResultSerializer(item).data}

        # Send final state
        self.crawl_request.refresh_from_db()
        yield {"type": "state", "data": CrawlRequestSerializer(self.crawl_request).data}

        # Clean up
        pubsub.unsubscribe(self.redis_channel)
        pubsub.close()


class SearchPupSupService(BasePubSupService):
    def __init__(self, search_request: SearchRequest):
        self.search_request = search_request
        self.redis_channel = f"search:{self.search_request.uuid}"
        self.connection = get_redis_connection("default")

    def check_status(self, prefetched=False):
        from .serializers import (
            SearchRequestSerializer,
            FullSearchResultSerializer,
        )

        ResultSerializer = (
            SearchRequestSerializer if not prefetched else FullSearchResultSerializer
        )

        # Initialize Redis connection and pubsub
        pubsub = self.connection.pubsub()
        pubsub.subscribe(self.redis_channel)
        yield {
            "type": "state",
            "data": ResultSerializer(self.search_request).data,
        }
        # Process messages while the task is running
        while AsyncResult(str(self.search_request.uuid)).state in (
            "PENDING",
            "STARTED",
        ):
            self.search_request.refresh_from_db()
            if self.search_request.status in [
                consts.CRAWL_STATUS_CANCELED,
                consts.CRAWL_STATUS_FINISHED,
                consts.CRAWL_STATUS_FAILED,
            ]:
                break

            # Check for new messages with a timeout
            message = pubsub.get_message(timeout=0.1)

            if message and message["type"] == "message":
                # Process the message
                try:
                    data = json.loads(message["data"].decode("utf-8"))
                    if data["event_type"] == "state":
                        self.search_request.refresh_from_db()
                        yield {
                            "type": "state",
                            "data": ResultSerializer(self.search_request).data,
                        }
                    elif data["event_type"] == "feed":
                        yield {
                            "type": "feed",
                            "data": data["payload"],
                        }

                except Exception as e:
                    # Log error but continue
                    print(f"Error processing Redis message: {str(e)}")

        # Send final state
        self.search_request.refresh_from_db()
        yield {
            "type": "state",
            "data": ResultSerializer(self.search_request).data,
        }

        # Clean up
        pubsub.unsubscribe(self.redis_channel)
        pubsub.close()


class SitemapPubSupService(BasePubSupService):
    def __init__(self, sitemap_request: SitemapRequest):
        self.sitemap_request = sitemap_request
        self.redis_channel = f"sitemap:{self.sitemap_request.uuid}"
        self.connection = get_redis_connection("default")

    def check_status(self, prefetched=False):
        from .serializers import (
            SitemapRequestSerializer,
            FullSitemapRequestSerializer,
        )

        ResultSerializer = (
            SitemapRequestSerializer if not prefetched else FullSitemapRequestSerializer
        )

        # Initialize Redis connection and pubsub
        pubsub = self.connection.pubsub()
        pubsub.subscribe(self.redis_channel)
        yield {
            "type": "state",
            "data": ResultSerializer(self.sitemap_request).data,
        }
        last_state_time = time()
        # Process messages while the task is running
        while AsyncResult(str(self.sitemap_request.uuid)).state in (
            "PENDING",
            "STARTED",
        ):
            self.sitemap_request.refresh_from_db()
            if self.sitemap_request.status in [
                consts.CRAWL_STATUS_CANCELED,
                consts.CRAWL_STATUS_FINISHED,
                consts.CRAWL_STATUS_FAILED,
            ]:
                break

            # Check for new messages with a timeout
            message = pubsub.get_message(timeout=0.1)

            if message and message["type"] == "message":
                # Process the message
                try:
                    data = json.loads(message["data"].decode("utf-8"))
                    if data["event_type"] == "state":
                        self.sitemap_request.refresh_from_db()
                        yield {
                            "type": "state",
                            "data": ResultSerializer(self.sitemap_request).data,
                        }
                        last_state_time = time()
                    elif data["event_type"] == "feed":
                        yield {
                            "type": "feed",
                            "data": data["payload"],
                        }

                except Exception as e:
                    # Log error but continue
                    print(f"Error processing Redis message: {str(e)}")

            else:
                # Check if we need to send state update
                current_time = time()
                if current_time - last_state_time >= 5:
                    self.sitemap_request.refresh_from_db()
                    yield {
                        "type": "state",
                        "data": ResultSerializer(self.sitemap_request).data,
                    }
                    last_state_time = current_time

        # Send final state
        self.sitemap_request.refresh_from_db()
        yield {
            "type": "state",
            "data": ResultSerializer(self.sitemap_request).data,
        }

        # Clean up
        pubsub.unsubscribe(self.redis_channel)
        pubsub.close()


class CrawlerService:
    def __init__(self, crawl_request: CrawlRequest):
        self.crawl_request = crawl_request
        self.proxy_service = ProxyService.get_proxy_for_crawl_request(crawl_request)
        self.pubsub_service = CrawlPupSupService(
            self.crawl_request,
        )

    @classmethod
    def make_with_urls(
        cls,
        urls: list[str],
        team: Team,
        spider_options: Optional[dict] = None,
        page_options: Optional[dict] = None,
    ):
        page_options = page_options or {}
        spider_options = spider_options or {}
        urls = list(set(urls))
        if not urls:
            raise ValueError(_("At least one URL is required for the crawl request."))

        allowed_domains = []
        for url in urls:
            parsed_url = urlparse(url)
            if parsed_url.netloc not in allowed_domains:
                allowed_domains.append(parsed_url.netloc)

        url_count = len(urls)

        default_spider_options = {
            "max_depth": 0,
            "page_limit": url_count,
            "allowed_domains": allowed_domains,
            "exclude_paths": [],
            "include_paths": [],
            "proxy_server": None,
        }

        default_page_options = {
            "exclude_tags": [],
            "include_tags": [],
            "wait_time": 1000,
            "include_html": False,
            "only_main_content": True,
            "include_links": False,
            "timeout": 15000,
            "accept_cookies_selector": None,
            "locale": "en-US",
            "extra_headers": {},
            "actions": [],
            "ignore_rendering": False,
        }

        # Merge with provided options (user overrides default)
        spider_options = {**default_spider_options, **spider_options}
        page_options = {**default_page_options, **page_options}

        crawl_request = CrawlRequest.objects.create(
            team=team,
            urls=urls,
            crawl_type=consts.CRAWL_TYPE_BATCH
            if url_count > 1
            else consts.CRAWL_TYPE_SINGLE,
            options={
                "spider_options": spider_options,
                "page_options": page_options,
                "plugin_options": {},
            },
        )

        return cls(crawl_request)

    @cached_property
    def config_helpers(self):
        return CrawlHelpers(self.crawl_request)

    def run(self):
        self.crawl_request.status = consts.CRAWL_STATUS_RUNNING
        self.crawl_request.save()
        self.pubsub_service.send_status("state")

        params = [
            "scrapy",
            "crawl",
            "SiteScrapper",
            "-a",
            f"crawl_request_uuid={self.crawl_request.pk}",
            *self.config_helpers.get_spider_settings(),
        ]
        try:
            subprocess.run(params, check=True, cwd=settings.BASE_DIR)
        except subprocess.CalledProcessError:
            self.crawl_request.duration = timezone.now() - self.crawl_request.created_at
            self.crawl_request.status = consts.CRAWL_STATUS_FAILED
            self.crawl_request.save(update_fields=["status", "duration"])
            self.pubsub_service.send_status("state")
            raise

        self.crawl_request.duration = timezone.now() - self.crawl_request.created_at
        self.crawl_request.status = consts.CRAWL_STATUS_FINISHED
        self.crawl_request.save(update_fields=["status", "duration"])
        self.pubsub_service.send_status("state")

    @cached_property
    def proxy_object(self):
        if not self.proxy_service:
            return
        return self.proxy_service.get_proxy_object()

    @property
    def proxy_url(self):
        if not self.proxy_service:
            return
        return self.proxy_service.get_proxy_url()

    @classmethod
    def make_with_pk(cls, crawl_request_pk: str):
        return cls(CrawlRequest.objects.get(pk=crawl_request_pk))

    def add_scraped_item(self, item: ScrapedItem):
        file_content = self.get_file_content(item)

        result = CrawlResult.objects.create(
            request=self.crawl_request,
            url=item["url"],
            result=ContentFile(
                json.dumps(file_content).encode("utf-8"), name="result.json"
            ),
        )
        for attachment in item["attachments"]:
            result.attachments.create(
                attachment_type=attachment["type"],
                attachment=ContentFile(
                    base64.b64decode(attachment["content"]), name=attachment["filename"]
                ),
            )

        self.pubsub_service.send_status("result", str(result.pk))

    def add_sitemap(self, results: list):
        json_file = ContentFile(
            json.dumps(results).encode("utf-8"), name="sitemap.json"
        )
        self.crawl_request.sitemap = json_file
        self.crawl_request.save(update_fields=["sitemap"])

    def get_file_content(self, item):
        result = {"metadata": item["metadata"], "markdown": item["markdown"]}
        if self.config_helpers.include_links:
            result["links"] = item["links"]
        if self.config_helpers.include_html:
            result["html"] = item["filtered_html"]

        if item["extraction"]:
            result["extraction"] = item["extraction"]

        return result

    def stop(self):
        self.crawl_request.status = consts.CRAWL_STATUS_CANCELING
        self.crawl_request.save(update_fields=["status"])
        self.pubsub_service.send_status("state")

        app.control.revoke(str(self.crawl_request.uuid), terminate=True)

        self.crawl_request.duration = timezone.now() - self.crawl_request.created_at
        self.crawl_request.status = consts.CRAWL_STATUS_CANCELED
        self.crawl_request.save(update_fields=["status", "duration"])
        self.pubsub_service.send_status("state")

    def download_zip(self, output_format="json"):
        """Generator function that streams ZIP content dynamically."""
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zipf:
            for item in self.crawl_request.results.iterator():
                file_name = (
                    item.url.replace("https://", "")
                    .replace("http://", "")
                    .replace("/", "_")
                )
                if output_format == "json":
                    zipf.writestr(file_name + ".json", item.result.read())
                else:
                    zipf.writestr(file_name + ".md", json.load(item.result)["markdown"])

        yield buffer.getvalue()


class SearchService:
    def __init__(self, search_request: SearchRequest):
        self.search_request = search_request
        self.pubsub_service = SearchPupSupService(self.search_request)
        self.config_helpers = SearchHelpers(self.search_request)

    @classmethod
    def make_with_pk(cls, search_request_uuid):
        return cls(SearchRequest.objects.get(uuid=search_request_uuid))

    def run(self):
        self.search_request.status = consts.CRAWL_STATUS_RUNNING
        self.search_request.save(update_fields=["status"])
        self.pubsub_service.send_status("state")

        params = [
            "scrapy",
            "crawl",
            "GoogleCustomSearchScrapper",
            "-a",
            f"search_request_uuid={self.search_request.pk}",
        ]
        subprocess.run(params, check=True)

        self.search_request.refresh_from_db()
        self.search_request.duration = timezone.now() - self.search_request.created_at
        if self.search_request.result:
            self.search_request.status = consts.CRAWL_STATUS_FINISHED
        else:
            self.search_request.status = consts.CRAWL_STATUS_FAILED
        self.search_request.save(update_fields=["status", "duration"])
        self.pubsub_service.send_status("state")

    def stop(self):
        self.search_request.status = consts.CRAWL_STATUS_CANCELING
        self.search_request.save(update_fields=["status"])
        self.pubsub_service.send_status("state")

        app.control.revoke(str(self.search_request.uuid), terminate=True)

        self.search_request.duration = timezone.now() - self.search_request.created_at
        self.search_request.status = consts.CRAWL_STATUS_CANCELED
        self.search_request.save(update_fields=["status", "duration"])
        self.pubsub_service.send_status("state")

    def add_search_result(self, item):
        content_file = ContentFile(
            json.dumps(item["results"]).encode("utf-8"), name="result.json"
        )
        self.search_request.result = content_file
        self.search_request.save(update_fields=["result"])

        self.pubsub_service.send_status("state")


class SitemapService:
    def __init__(self, sitemap_file):
        self.data = json.load(sitemap_file)

    def __process_item(self, item):
        if isinstance(item, str):
            return {"url": self.__get_url(item)}
        return {
            **item,
            "url": self.__get_url(item),
        }

    def __get_url(self, item: str | dict) -> str:
        if isinstance(item, str):
            return urllib.parse.unquote(item)
        return urllib.parse.unquote(item.get("url", ""))

    def insert_into_tree(self, tree, parts, item, query):
        current = tree
        for i, part in enumerate(parts):
            # Skip inserting empty string part
            if part == "":
                continue
            current = current.setdefault(part, {})

        if "__self__" not in current:
            current["__self__"] = self.__process_item(item)
        elif query:
            current.setdefault("__query__", []).append(self.__process_item(item))

    def build_tree(self, data):
        tree = {}
        for item in data:
            parsed = urlparse(self.__get_url(item))
            domain = parsed.netloc
            path = parsed.path.rstrip("/")  # remove trailing slash
            if path == "":
                # Root path: attach directly under the domain
                tree.setdefault(domain, {})
                if "__self__" not in tree[domain]:
                    tree[domain]["__self__"] = self.__process_item(item)
                elif parsed.query:
                    tree[domain].setdefault("__query__", []).append(
                        self.__process_item(item)
                    )
            else:
                parts = [domain] + path.strip("/").split("/")
                self.insert_into_tree(tree, parts, item, parsed.query)
        return tree

    def to_graph(self):
        return self.build_tree(self.data)

    def build_markdown(self, data):
        for item in data:
            if isinstance(item, str):
                yield f"- {self.__get_url(item)}"
            elif isinstance(item, dict):
                title = item.get("title", "No Title")
                yield f"- [{title}]({self.__get_url(item)})"
            else:
                yield f"- {item}"

    def to_markdown(self):
        return "\n".join(self.build_markdown(self.data))


class ReportService:
    def __init__(self, team: Team, time_delta: timedelta):
        self.team = team
        self.timedelta = time_delta
        self.time_from = timezone.now() - self.timedelta
        self.crawl_requests = self.team.crawl_requests.filter(
            created_at__gte=timezone.now() - self.timedelta
        )
        self.results = CrawlResult.objects.filter(request__team=team).filter(
            created_at__gte=timezone.now() - self.timedelta
        )

    @cached_property
    def total_crawls(self):
        return self.crawl_requests.count()

    @cached_property
    def total_documents(self):
        return self.results.count()

    @cached_property
    def finished_crawls(self):
        return self.crawl_requests.filter(status=consts.CRAWL_STATUS_FINISHED).count()

    @cached_property
    def crawl_history(self):
        return self.get_crawl_history()

    @cached_property
    def document_history(self):
        return self.get_document_history()

    def get_crawl_history(self, by: str = "date"):
        if by == "month":
            return (
                self.crawl_requests.values("created_at__year", "created_at__month")
                .annotate(count=Count("uuid"), month=F("created_at__month"))
                .order_by("created_at__year", "created_at__month")
            )

        return (
            self.crawl_requests.values("created_at__date")
            .annotate(count=Count("uuid"), date=F("created_at__date"))
            .order_by("created_at__date")
        )

    def get_document_history(self, by: str = "date"):
        if by == "month":
            return (
                self.results.values("created_at__year", "created_at__month")
                .annotate(count=Count("uuid"), month=F("created_at__month"))
                .order_by("created_at__year", "created_at__month")
            )

        return (
            self.results.values("created_at__date")
            .annotate(count=Count("uuid"), date=F("created_at__date"))
            .order_by("created_at__date")
        )


class PluginService:
    @classmethod
    def get_plugin_form_jsonschema(cls):
        properties = {}
        for plugin_class in get_active_plugins():
            json_schema = plugin_class.get_input_validator().get_json_schema()
            if json_schema:
                if not json_schema.get("properties"):
                    json_schema["properties"] = {}

                # append is_active field at the top
                json_schema["properties"] = OrderedDict(
                    [
                        (
                            "is_active",
                            {"type": "boolean", "title": "Is Active", "default": False},
                        )
                    ]
                    + list(json_schema["properties"].items())
                )

                if json_schema.get("required"):
                    json_schema["dependentRequired"] = {
                        **json_schema.get("dependentRequired", {}),
                        "is_active": json_schema["required"],
                    }

                json_schema["required"] = ["is_active"]

                properties[plugin_class.plugin_key()] = json_schema

        return {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": properties,
        }


class ProxyService:
    def __init__(self, proxy_server: ProxyServer):
        self.proxy_server = proxy_server

    @classmethod
    def get_team_proxies(cls, team):
        return ProxyServer.objects.filter(Q(team=team) | Q(team__isnull=True))

    @classmethod
    def get_proxy_by_team_and_slug(cls, team, slug=None):
        proxies = cls.get_team_proxies(team)
        if not proxies.exists():
            return None
        proxies = proxies.order_by("team", "?")

        if slug:
            proxy = proxies.filter(slug=slug).first()
            if proxy:
                return cls(proxy)

        default_proxy = proxies.filter(is_default=True).first()
        if default_proxy:
            return cls(default_proxy)

    @classmethod
    def get_proxy_for_crawl_request(
        cls, crawl_request: CrawlRequest
    ) -> Optional["ProxyService"]:
        proxy_slug = crawl_request.options.get("spider_options", {}).get(
            "proxy_server", None
        )
        return cls.get_proxy_by_team_and_slug(crawl_request.team, proxy_slug)

    @classmethod
    def get_proxy_for_sitemap_request(
        cls, sitemap_request: SitemapRequest
    ) -> Optional["ProxyService"]:
        proxy_slug = sitemap_request.options.get("proxy_server", None)
        return cls.get_proxy_by_team_and_slug(sitemap_request.team, proxy_slug)

    def get_proxy_object(self) -> dict[str, str]:
        return {
            "type": self.proxy_server.proxy_type,
            "host": self.proxy_server.host,
            "port": str(self.proxy_server.port),
            "username": self.proxy_server.username,
            "password": decrypt_key(self.proxy_server.password),
        }

    @staticmethod
    def __make_proxy_url(host, port, proxy_type, username=None, password=None):
        username_password = ""
        if username:
            username_password = username
        if password:
            if username_password:
                username_password += f":{password}"
            else:
                username_password = password

        if username_password:
            username_password += "@"

        return f"{proxy_type}://{username_password}{host}:{port}"

    @classmethod
    def test_proxy(cls, host, port, proxy_type, username=None, password=None):
        proxy_url = cls.__make_proxy_url(host, port, proxy_type, username, password)

        response = requests.get(
            "https://httpbin.org/ip",
            proxies={
                "http": proxy_url,
                "https": proxy_url,
            },
            timeout=10,
        )
        response.raise_for_status()
        return response.json()

    def get_proxy_url(self):
        return self.__make_proxy_url(
            self.proxy_server.host,
            self.proxy_server.port,
            self.proxy_server.proxy_type,
            self.proxy_server.username,
            decrypt_key(self.proxy_server.password)
            if self.proxy_server.password
            else None,
        )


class SitemapRequestService:
    def __init__(self, sitemap: SitemapRequest):
        self.sitemap = sitemap
        self.proxy_service = ProxyService.get_proxy_for_sitemap_request(sitemap)
        self.pubsub_service = SitemapPubSupService(self.sitemap)
        self.config_helpers = SitemapHelpers(self.sitemap)

    @classmethod
    def make_with_pk(cls, pk):
        return cls(SitemapRequest.objects.get(pk=pk))

    def run(self):
        self.sitemap.status = consts.CRAWL_STATUS_RUNNING
        self.sitemap.save(update_fields=["status"])
        self.pubsub_service.send_status("state")

        params = [
            "scrapy",
            "crawl",
            "SitemapScrapper",
            "-a",
            f"sitemap_request_uuid={self.sitemap.pk}",
        ]
        try:
            subprocess.run(params, check=True)
        except subprocess.CalledProcessError as e:
            print(e)
            self.sitemap.duration = timezone.now() - self.sitemap.created_at
            self.sitemap.status = consts.CRAWL_STATUS_FAILED
            self.sitemap.save(update_fields=["status", "duration"])
            self.pubsub_service.send_status("state")
            raise

        self.sitemap.refresh_from_db()
        self.sitemap.duration = timezone.now() - self.sitemap.created_at
        if self.sitemap.result:
            self.sitemap.status = consts.CRAWL_STATUS_FINISHED
        else:
            self.sitemap.status = consts.CRAWL_STATUS_FAILED
        self.sitemap.save(update_fields=["status", "duration"])

    @cached_property
    def proxy_object(self):
        if not self.proxy_service:
            return
        return self.proxy_service.get_proxy_object()

    @cached_property
    def proxy_url(self):
        if not self.proxy_service:
            return
        return self.proxy_service.get_proxy_url()

    def stop(self):
        self.sitemap.status = consts.CRAWL_STATUS_CANCELING
        self.sitemap.save(update_fields=["status"])

        app.control.revoke(str(self.sitemap.uuid), terminate=True)

        self.sitemap.duration = timezone.now() - self.sitemap.created_at
        self.sitemap.status = consts.CRAWL_STATUS_CANCELED
        self.sitemap.save(update_fields=["status", "duration"])

    def add_sitemap_result(self, item):
        content_file = ContentFile(
            json.dumps(item["result"]).encode("utf-8"), name="result.json"
        )
        self.sitemap.result = content_file
        self.sitemap.status = consts.CRAWL_STATUS_FINISHED
        self.sitemap.save(update_fields=["status", "result"])
