"""Documentation strings for core API endpoints."""
from django.utils.translation import gettext_lazy as _
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter

CRAWL_REQUEST_CREATE = '''
Start a new web crawling task with specified configuration.

This endpoint allows you to:
- Start a new crawl with custom settings
- Configure crawling depth and scope
- Set specific data extraction rules
- Define crawling boundaries and limits

The crawl request will be processed asynchronously. 
you will receive a task ID that you can use to track the progress of the crawl.
'''

CRAWL_REQUEST_LIST = '''
Retrieve a list of all crawl requests for your team.

The response includes:
- A list of crawl requests
- Request status (new, running, paused, finished, cancelling, canceled, failed)
- Creation and completion timestamps
- Crawling configuration details
- Progress statistics

Query parameters:
- page: Page number (default: 1)
- page_size: Number of items per page (default: 25, maximum: 100)
- uuid: Filter requests by UUID
- url: Filter requests by start URL
- status: Filter requests by status
- created_at: Filter requests by date

Extra filters:
- url__contains: Filter requests by URL containing a specific string
- url__startswith: Filter requests by URL starting with a specific string
- created_at__gt: Filter requests by creation date (greater than)
- created_at__lt: Filter requests by creation date (less than)

'''

CRAWL_REQUEST_RETRIEVE = '''
Get detailed information about a specific crawl request.

Returns comprehensive information including:
- Current status and progress
- Configuration settings used
- Resource usage statistics
'''

CRAWL_REQUEST_DESTROY = '''
Cancel an active crawling task.

This will:
- Stop the crawler immediately
- Save any data collected so far
- Free up crawling resources
- Mark the request as cancelled

Note: Cancelled requests cannot be resumed.
'''

CRAWL_REQUEST_DOWNLOAD = '''
Download the results of a completed crawl request as a JSON file.
'''

CRAWL_REQUEST_CHECK_STATUS = '''
Real-time status monitoring using Server-Sent Events (SSE).

The endpoint streams updates every second with:
- Current crawling status
- Pages crawled
- Data extracted

Message Types:
1. 'state': Contains crawl request status updates
2. 'result': Contains new crawl results as they arrive

Connection remains open until:
- Crawl completes
- Error occurs
- Client disconnects

Query Parameters:
- prefetched: If you set this to True, you will get the result json instead of a download link. Default is False

'''

CRAWL_RESULT_LIST = '''
List all crawl results associated with your team's crawl requests.

The response includes:
- Extracted data
- Timestamps
- Success/failure status
- Resource statistics
- Associated attachments

Query Parameters:
- page: Page number
- page_size: Number of results per page(maximum 100)
- url: Filter results by URL
- created_at: Filter results by creation date  (exact match)
- prefetched: If you set this to True, you will get the result json instead of a download link. Default is False

Extra filters:
- url__contains: Filter results by URL containing a specific string
- url__startswith: Filter results by URL starting with a specific string
- created_at__gt: Filter results by creation date (greater than or equal to)
- created_at__lt: Filter results by creation date (less than or equal to)

Results are paginated and can be filtered by crawl request.
'''

CRAWL_RESULT_RETRIEVE = '''
Get detailed information about a specific crawl result.

Returns:
- Complete extracted data
- Crawling metadata
- Performance metrics
- Resource usage statistics
'''

USAGE_REPORT = '''
Get detailed usage statistics for your team.

The report includes:
- Total requests made
- Pages crawled
- Data extracted
- Resource usage
- Plan limits and remaining credits

Default period is last 30 days.
'''

PLUGIN_LIST = '''
Get a list of available plugins for data extraction.

Each plugin includes:
- Configuration schema
- Supported features
- Required parameters
- Optional settings
- Usage examples

Use these schemas to configure your crawl requests.
'''

####### PARAMETERS #######
CRAWL_REQUEST_LIST_PARAMETERS = [
    OpenApiParameter(
        'uuid', OpenApiTypes.STR, OpenApiParameter.QUERY, description=_('Filter crawl requests by UUID.')
    ),
    OpenApiParameter(
        'url', OpenApiTypes.STR, OpenApiParameter.QUERY, description=_('Filter crawl requests by start URL.')
    ),
    OpenApiParameter(
        'status', OpenApiTypes.STR, OpenApiParameter.QUERY, description=_('Filter crawl requests by status.')
    ),
    OpenApiParameter(
        'created_at', OpenApiTypes.DATETIME, OpenApiParameter.QUERY, description=_('Filter crawl requests by date')
    ),
]

CRAWL_RESULTS_PARAMETERS = [
    OpenApiParameter(
        'prefetched',
        OpenApiTypes.BOOL,
        OpenApiParameter.QUERY,
        description=_('Prefetch crawl results. Default: False.')
    ),
    OpenApiParameter(
        'url', OpenApiTypes.STR, OpenApiParameter.QUERY, description=_('Filter crawl results by URL.')
    ),
    OpenApiParameter(
        'created_at', OpenApiTypes.DATETIME, OpenApiParameter.QUERY, description=_('Filter crawl results by date')
    ),
]

CRAWL_REQUEST_CHECK_STATUS_PARAMETERS = [
    OpenApiParameter(
        'prefetched', OpenApiTypes.BOOL, OpenApiParameter.QUERY,
        description=_('Prefetch crawl results. Default: False.')
    )
]

CRAWL_REQUEST_DOWNLOAD_PARAMETERS = [
    OpenApiParameter(
        'output_format', OpenApiTypes.STR, OpenApiParameter.QUERY,
        enum=['markdown', 'json'],
        description=_('Format of the download file. Default: json. Available formats: markdown, json.')
    )
]
