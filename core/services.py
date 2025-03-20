import base64
import fnmatch
import io
import json
import subprocess
import zipfile
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
from zipstream import ZipStream

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

            allowed_domains = ['*.{}'.format(domain), domain]

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

    @cached_property
    def __include_paths(self):
        return self.crawl_request.options.get('spider_options', {}).get('include_paths', [])

    @cached_property
    def __exclude_paths(self):
        return self.crawl_request.options.get('spider_options', {}).get('exclude_paths', [])

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

    @cached_property
    def timeout(self):
        return self.crawl_request.options.get('page_options', {}).get('timeout', 15000)

    @cached_property
    def accept_cookies_selector(self):
        return self.crawl_request.options.get('page_options', {}).get('accept_cookies_selector', None)

    @cached_property
    def locale(self):
        return self.crawl_request.options.get('page_options', {}).get('locale', 'en-US')

    @cached_property
    def extra_headers(self):
        return self.crawl_request.options.get('page_options', {}).get('extra_headers', {})

    @cached_property
    def actions(self):
        return self.crawl_request.options.get('page_options', {}).get('actions', [])

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

        self.crawl_request.duration = timezone.now() - self.crawl_request.created_at
        self.crawl_request.status = consts.CRAWL_STATUS_FINISHED
        self.crawl_request.save()

    @classmethod
    def make_with_pk(cls, crawl_request_pk: str):
        return cls(CrawlRequest.objects.get(pk=crawl_request_pk))

    def add_scraped_item(self, item: ScrapedItem):
        file_content = self.get_file_content(item)

        result = CrawlResult.objects.create(
            request=self.crawl_request,
            url=item['url'],
            result=ContentFile(json.dumps(file_content).encode('utf-8'), name='result.json')
        )
        for attachment in item['attachments']:
            result.attachments.create(
                attachment_type=attachment['type'],
                attachment=ContentFile(
                    base64.b64decode(attachment['content']),
                    name=attachment['filename']
                )
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

        self.crawl_request.duration = timezone.now() - self.crawl_request.created_at
        self.crawl_request.status = consts.CRAWL_STATUS_CANCELED
        self.crawl_request.save(update_fields=['status', 'duration'])

    def download_zip(self, output_format='json'):
        """Generator function that streams ZIP content dynamically."""
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for item in self.crawl_request.results.iterator():
                file_name = item.url.replace("https://", "").replace("http://", "").replace("/", "_")
                if output_format == 'json':
                    zipf.writestr(file_name + '.json', item.result.read())
                else:
                    zipf.writestr(file_name + '.md', json.load(item.result)['markdown'])

        yield buffer.getvalue()


    def check_status(self, prefetched=False):
        from .serializers import CrawlResultSerializer, CrawlRequestSerializer, FullCrawlResultSerializer

        ResultSerializer = CrawlResultSerializer if not prefetched else FullCrawlResultSerializer
        items_already_sent = []
        # check task in celery is running
        while AsyncResult(str(self.crawl_request.uuid)).state in ('PENDING', 'STARTED'):
            self.crawl_request.refresh_from_db()
            if self.crawl_request.status in [
                consts.CRAWL_STATUS_CANCELED,
                consts.CRAWL_STATUS_FINISHED,
                consts.CRAWL_STATUS_FAILED
            ]:
                break

            queryset = self.crawl_request.results.prefetch_related('attachments').exclude(pk__in=items_already_sent)
            for item in queryset:
                items_already_sent.append(item.pk)
                yield {
                    'type': 'result',
                    'data': ResultSerializer(item).data
                }

            yield {
                'type': 'state',
                'data': CrawlRequestSerializer(self.crawl_request).data
            }
            sleep(1)

        for item in self.crawl_request.results.exclude(pk__in=items_already_sent):
            items_already_sent.append(item.uuid)
            yield {
                'type': 'result',
                'data': ResultSerializer(item).data
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

                # append is_active field at the top
                json_schema['properties'] = OrderedDict(
                    [('is_active', {
                        'type': 'boolean',
                        'title': 'Is Active',
                        'default': False
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
