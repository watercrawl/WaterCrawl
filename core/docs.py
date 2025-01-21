"""Documentation strings for core API endpoints."""

CRAWL_REQUEST_CREATE = '''
Start a new web crawling task with specified configuration.

This endpoint allows you to:
- Start a new crawl with custom settings
- Configure crawling depth and scope
- Set specific data extraction rules
- Define crawling boundaries and limits

The crawl request will be queued and processed based on your team's plan limits.
'''

CRAWL_REQUEST_LIST = '''
Retrieve a list of all crawl requests for your team.

The response includes:
- Request status (pending, running, completed, failed)
- Creation and completion timestamps
- Crawling configuration details
- Progress statistics

Results are paginated and can be filtered by status.
'''

CRAWL_REQUEST_RETRIEVE = '''
Get detailed information about a specific crawl request.

Returns comprehensive information including:
- Current status and progress
- Configuration settings used
- Error details (if any)
- Resource usage statistics
- Associated results and downloads
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
Download the collected data from a completed crawl request.

Supports multiple formats:
- JSON (structured data)
- CSV (tabular data)
- ZIP (compressed with attachments)

The response includes:
- Extracted data points
- Metadata and timestamps
- Error logs (if any)
- Downloaded resources (based on configuration)
'''

CRAWL_REQUEST_CHECK_STATUS = '''
Real-time status monitoring using Server-Sent Events (SSE).

The endpoint streams updates every second with:
- Current crawling status
- Pages crawled/remaining
- Data extracted
- Error counts
- Resource usage

Message Types:
1. 'state': Contains crawl request status updates
2. 'result': Contains new crawl results as they arrive

Connection remains open until:
- Crawl completes
- Error occurs
- Client disconnects
'''

CRAWL_RESULT_LIST = '''
List all crawl results associated with your team's requests.

The response includes:
- Extracted data
- Timestamps
- Success/failure status
- Resource statistics
- Associated attachments

Results are paginated and can be filtered by crawl request.
'''

CRAWL_RESULT_RETRIEVE = '''
Get detailed information about a specific crawl result.

Returns:
- Complete extracted data
- Crawling metadata
- Error details (if any)
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
