# Python Client
[![PyPI version](https://badge.fury.io/py/watercrawl-py.svg)](https://badge.fury.io/py/watercrawl-py)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A Python client library for interacting with the WaterCrawl API - a powerful web crawling and scraping service.

## Installation

```bash
pip install watercrawl-py
```

## Requirements

- Python >= 3.8
- `requests` library

## Quick Start

```python
from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient('your-api-key')

# Simple URL scraping
result = client.scrape_url('https://example.com')

# Advanced crawling with options
crawl_request = client.create_crawl_request(
    url='https://example.com',
    spider_options={},
    page_options={},
    plugin_options={}
)

# Monitor and download results
for result in client.monitor_crawl_request(crawl_request['uuid']):
    if result['type'] == 'result':
        print(result['data'])  # it is a result object per page
```

## API Examples

### Client Initialization

```python
from watercrawl import WaterCrawlAPIClient

# Initialize with default base URL
client = WaterCrawlAPIClient('your-api-key')

# Or specify a custom base URL
client = WaterCrawlAPIClient('your-api-key', base_url='https://custom-app.watercrawl.dev/')
```

### Crawling Operations

#### List all crawl requests

```python
# Get the first page of requests (default page size: 10)
requests = client.get_crawl_requests_list()

# Specify page number and size
requests = client.get_crawl_requests_list(page=2, page_size=20)
```

#### Get a specific crawl request

```python
request = client.get_crawl_request('request-uuid')
```

#### Create a crawl request

```python
# Simple request with just a URL
request = client.create_crawl_request(url='https://example.com')

# Advanced request with a single URL
request = client.create_crawl_request(
    url='https://example.com',
    spider_options={
        "max_depth": 1, # maximum depth to crawl
        "page_limit": 1, # maximum number of pages to crawl
        "allowed_domains": [], # allowed domains to crawl
        "exclude_paths": [], # exclude paths
        "include_paths": [], # include paths
        "ignore_rendering": False # ignore rendering
    },
    page_options={
        "exclude_tags": [], # exclude tags from the page
        "include_tags": [], # include tags from the page
        "wait_time": 1000, # wait time in milliseconds after page load
        "include_html": False, # the result will include HTML
        "only_main_content": True, # only main content of the page automatically remove headers, footers, etc.
        "include_links": False, # if True the result will include links
        "timeout": 15000, # timeout in milliseconds
        "accept_cookies_selector": None, # accept cookies selector e.g. "#accept-cookies"
        "locale": "en-US", # locale
        "extra_headers": {}, # extra headers e.g. {"Authorization": "Bearer your_token"}
        "actions": [] # actions to perform {"type": "screenshot"} or {"type": "pdf"}
    },
    plugin_options={}
)
```

#### Stop a crawl request

```python
client.stop_crawl_request('request-uuid')
```

#### Download a crawl request result

```python
# Download the crawl request as a ZIP file
zip_data = client.download_crawl_request('request-uuid')

# Save to a file
with open('crawl_results.zip', 'wb') as f:
    f.write(zip_data)
```

#### Monitor a crawl request

```python
# Monitor with automatic result download (default)
for event in client.monitor_crawl_request('request-uuid'):
    if event['type'] == 'state':
        print(f"Crawl state: {event['data']['status']}")
    elif event['type'] == 'result':
        print(f"Received result for: {event['data']['url']}")

# Monitor without downloading results will return result as url instead of result object
for event in client.monitor_crawl_request('request-uuid', download=False):
    print(f"Event type: {event['type']}")
```

#### Get crawl request results

```python
# Get the first page of results
results = client.get_crawl_request_results('request-uuid')

# Specify page number and size
results = client.get_crawl_request_results('request-uuid', page=2, page_size=20)
```

#### Quick URL scraping

```python
# Synchronous scraping (default)
result = client.scrape_url('https://example.com')

# With page options
result = client.scrape_url(
    'https://example.com',
    page_options={}
)

# Asynchronous scraping
request = client.scrape_url('https://example.com', sync=False)
# Later check for results with get_crawl_request
```

### Sitemap Operations

#### Download a sitemap

```python
# Download using a crawl request object
crawl_request = client.get_crawl_request('request-uuid')
sitemap = client.download_sitemap(crawl_request)

# you need to give crawl request uuid or crawl request object
sitemap = client.download_sitemap('request-uuid')

# Process sitemap entries
for entry in sitemap:
    print(f"URL: {entry['url']}, Title: {entry['title']}")
```

#### Download sitemap as graph data

```python
# you need to give crawl request uuid or crawl request object
graph_data = client.download_sitemap_graph('request-uuid')
```

#### Download sitemap as markdown

```python
# you need to give crawl request uuid or crawl request object
markdown = client.download_sitemap_markdown('request-uuid')
```

### Search Operations

#### Create a search request

```python
# Simple search
search = client.create_search_request(query="python programming")

# Search with options and limited results
search = client.create_search_request(
    query="python tutorial", 
    search_options={
        "language": null, # language code e.g. "en" or "fr" or "es"
        "country": null, # country code e.g. "us" or "fr" or "es"
        "time_renge": "any", # time range e.g. "any" or "hour" or "day" or "week" or "month" or "year"
        "search_type": "web", # search type e.g. "web" now just web is supported
        "depth": "basic" # depth e.g. "basic" or "advanced" or "ultimate"
    },
    result_limit=5, # limit the number of results
    sync=True, # wait for results
    download=True # download results
)

# Asynchronous search
search = client.create_search_request(
    query="machine learning",
    search_options={},
    result_limit=5, # limit the number of results
    sync=False, # Don't wait for results
    download=False # Don't download results
)
```

#### Monitor a search request

```python
# Monitor with automatic result download the event type just state for now
for event in client.monitor_search_request('search-uuid'):
    if event['type'] == 'state':
        print(f"Search state: {event['status']}")
    
# Monitor without downloading results
for event in client.monitor_search_request('search-uuid', download=False):
    print(f"Event: {event}")
```

#### Get search request details

```python
search = client.get_search_request('search-uuid')
```

#### Stop a search request

```python
client.stop_search_request('search-uuid')
```

## Features

- Simple and intuitive API client
- Support for both synchronous and asynchronous crawling
- Comprehensive crawling options and configurations
- Built-in request monitoring and result downloading
- Efficient session management and request handling
- Support for sitemaps and search operations


## Compatibility

- WaterCrawl API >= 0.7.1

## Changelog

Please see [CHANGELOG.md](https://github.com/watercrawl/watercrawl-py/blob/main/CHANGELOG.md) for more information on what has changed recently.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/watercrawl/watercrawl-py/blob/main/LICENSE) file for details.

## Support

For support, please visit:
- Issues: [GitHub Issues](https://github.com/watercrawl/watercrawl-py/issues)
- Homepage: [GitHub Repository](https://github.com/watercrawl/watercrawl-py)
- Documentation: [WaterCrawl Docs](https://docs.watercrawl.dev/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
