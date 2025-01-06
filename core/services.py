import fnmatch
import json
import subprocess
from collections import OrderedDict
from datetime import timedelta
from functools import cached_property
from time import sleep
from urllib.parse import urlparse

from celery.result import AsyncResult
from django.conf import settings
from django.core.files.base import ContentFile
from django.db.models import Count, F
from django.utils import timezone

from core import consts
from core.models import CrawlRequest, CrawlResult
from core.utils import get_active_plugins
from spider.items import ScrapedItem
from user.models import Team
from user.utils import load_class_by_name
from watercrawl.celery import app


class CrawlHelpers:
    def __init__(self, crawl_request: CrawlRequest):
        self.crawl_request = crawl_request

    def get_allowed_domains(self) -> list[str]:
        parsed_url = urlparse(self.crawl_request.url)
        allowed_domains = self.crawl_request.options.get('spider_options', {}).get('allowed_domains', [])
        if not allowed_domains:
            domain = parsed_url.netloc
            if domain.startswith('www.'):
                domain = domain[4:]

            allowed_domains = ['*.{}'.format(domain)]

        return allowed_domains

    @cached_property
    def allowed_domains(self):
        return self.get_allowed_domains()

    def get_spider_settings(self):
        max_depth = self.crawl_request.options.get('spider_options', {}).get('max_depth', 100)

        page_limit = self.crawl_request.options.get('spider_options', {}).get('page_limit', 1)

        return [
            '-s',
            'DEPTH_LIMIT={}'.format(max_depth),
            '-s',
            'MAX_REQUESTS={}'.format(page_limit),  # +2 for the robots.txt
            '-s',
            'CONCURRENT_REQUESTS={}'.format(str(settings.SCRAPY_CONCURRENT_REQUESTS)),
            '-s',
            'CONCURRENT_REQUESTS_PER_DOMAIN={}'.format(str(settings.SCRAPY_CONCURRENT_REQUESTS_PER_DOMAIN)),
            '-s',
            'CONCURRENT_REQUESTS_PER_IP={}'.format(str(settings.SCRAPY_CONCURRENT_REQUESTS_PER_IP)),
        ]

    @property
    def __include_paths(self):
        include_paths = self.crawl_request.options.get('spider_options', {}).get('spider_options', ['*'])
        return include_paths

    @property
    def __exclude_paths(self):
        exclude_paths = self.crawl_request.options.get('spider_options', {}).get('exclude_paths', [])
        return exclude_paths

    def is_allowed_path(self, url):
        parsed_url = urlparse(url)
        if parsed_url.scheme in ['tel', 'mailto', 'mail']:
            return False

        # skip if the url is a file
        splited = parsed_url.path.split('.')
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
        for include_path in self.__include_paths:
            if fnmatch.fnmatch(uri, include_path):
                return True

        # check exclude path with start check
        for exclude_path in self.__exclude_paths:
            if fnmatch.fnmatch(uri, exclude_path):
                return False

        return True

    @cached_property
    def include_tags(self):
        return self.crawl_request.options.get('page_options', {}).get('include_tags', [])

    @cached_property
    def exclude_tags(self):
        return self.crawl_request.options.get('page_options', {}).get('exclude_tags', [])

    @cached_property
    def only_main_content(self):
        return self.crawl_request.options.get('page_options', {}).get('only_main_content', True)

    def get_html_filter_options(self):
        return {
            'only_main_content': self.only_main_content,
            'exclude_tags': self.exclude_tags,
            'include_tags': self.include_tags
        }

    @cached_property
    def include_html(self):
        return self.crawl_request.options.get('page_options', {}).get('include_html', False)

    @cached_property
    def include_links(self):
        return self.crawl_request.options.get('page_options', {}).get('include_links', False)

    @cached_property
    def wait_time(self):
        return self.crawl_request.options.get('page_options', {}).get('wait_time', 0)

    def get_plugins(self):
        for item in settings.WATERCRAWL_PLUGINS:
            plugin = load_class_by_name(item)
            yield plugin


class CrawlerService:
    def __init__(self, crawl_request: CrawlRequest):
        self.crawl_request = crawl_request

    @cached_property
    def config_helpers(self):
        return CrawlHelpers(self.crawl_request)

    def run(self):
        self.crawl_request.status = consts.CRAWL_STATUS_RUNNING
        self.crawl_request.save()

        params = [
            'scrapy',
            'crawl',
            'SiteScrapper',
            '-a',
            f'crawl_request_uuid={self.crawl_request.pk}',
            *self.config_helpers.get_spider_settings()
        ]
        subprocess.run(params, check=True)

        self.crawl_request.status = consts.CRAWL_STATUS_FINISHED
        self.crawl_request.save()

    @classmethod
    def make_with_pk(cls, crawl_request_pk: str):
        return cls(CrawlRequest.objects.get(pk=crawl_request_pk))

    def add_scraped_item(self, item: ScrapedItem):
        file_content = self.get_file_content(item)

        CrawlResult.objects.create(
            request=self.crawl_request,
            url=item['url'],
            result=ContentFile(json.dumps(file_content).encode('utf-8'), name='result.json')
        )

    def get_file_content(self, item):
        result = {
            'metadata': item['metadata'],
            'markdown': item['markdown']
        }
        if self.config_helpers.include_links:
            result['links'] = item['links']
        if self.config_helpers.include_html:
            result['html'] = item['filtered_html']

        if item['extraction']:
            result['extraction'] = item['extraction']

        return result

    def stop(self):
        self.crawl_request.status = consts.CRAWL_STATUS_CANCELING
        self.crawl_request.save(update_fields=['status'])

        app.control.revoke(str(self.crawl_request.uuid), terminate=True)

        self.crawl_request.status = consts.CRAWL_STATUS_CANCELED
        self.crawl_request.save(update_fields=['status'])

    def download(self):
        count = self.crawl_request.results.count()
        yield "["
        index = 0
        for item in self.crawl_request.results.iterator():
            index += 1
            yield item.result.read().decode('utf-8')
            if index < count:
                yield ","

        yield "]"

    def check_status(self):
        from .serializers import CrawlResultSerializer, CrawlRequestSerializer
        # check task in celery is running
        items_already_sent = []
        while AsyncResult(str(self.crawl_request.uuid)).state in ('PENDING', 'STARTED'):
            self.crawl_request.refresh_from_db()
            if self.crawl_request.status in [
                consts.CRAWL_STATUS_CANCELED,
                consts.CRAWL_STATUS_FINISHED,
                consts.CRAWL_STATUS_FAILED
            ]:
                break

            for item in self.crawl_request.results.exclude(pk__in=items_already_sent):
                items_already_sent.append(item.pk)
                yield {
                    'type': 'result',
                    'data': CrawlResultSerializer(item).data
                }

            yield {
                'type': 'state',
                'data': CrawlRequestSerializer(self.crawl_request).data
            }
            sleep(1)

        for item in self.crawl_request.results.exclude(pk__in=items_already_sent):
            items_already_sent.append(item.pk)
            yield {
                'type': 'result',
                'data': CrawlResultSerializer(item).data
            }

        self.crawl_request.refresh_from_db()
        yield {
            'type': 'state',
            'data': CrawlRequestSerializer(self.crawl_request).data
        }


class ReportService:
    """Todo: make some cache layers for this"""

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

    def get_crawl_history(self, by: str = 'date'):
        if by == 'month':
            return self.crawl_requests.values('created_at__year', 'created_at__month').annotate(
                count=Count('uuid'),
                month=F('created_at__month')
            ).order_by('created_at__year', 'created_at__month')

        return self.crawl_requests.values('created_at__date').annotate(
            count=Count('uuid'),
            date=F('created_at__date')
        ).order_by('created_at__date')

    def get_document_history(self, by: str = 'date'):
        if by == 'month':
            return self.results.values('created_at__year', 'created_at__month').annotate(
                count=Count('uuid'),
                month=F('created_at__month')
            ).order_by('created_at__year', 'created_at__month')

        return self.results.values('created_at__date').annotate(
            count=Count('uuid'),
            date=F('created_at__date')
        ).order_by('created_at__date')


class PluginService:
    @classmethod
    def get_plugin_form_jsonschema(cls):
        properties = {}
        for plugin_class in get_active_plugins():
            json_schema = plugin_class.get_input_validator().get_json_schema()
            if json_schema:

                if not json_schema.get('properties'):
                    json_schema['properties'] = {}

                keys = json_schema['properties'].keys()

                # append is_active field at the top
                json_schema['properties'] = OrderedDict(
                    [('is_active', {
                        'type': 'boolean',
                        'title': 'Is Active',
                        'default': True
                    })] + list(json_schema['properties'].items())
                )

                if json_schema.get('required'):
                    json_schema['dependentRequired'] = {
                        **json_schema.get('dependentRequired', {}),
                        'is_active': json_schema['required']
                    }

                json_schema['required'] = ['is_active']

                properties[plugin_class.plugin_key()] = json_schema

        return {
            '$schema': 'http://json-schema.org/draft-07/schema#',
            'type': 'object',
            'properties': properties
        }
