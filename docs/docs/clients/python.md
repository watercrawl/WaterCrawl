# Python Client
[![PyPI version](https://badge.fury.io/py/watercrawl-py.svg)](https://badge.fury.io/py/watercrawl-py)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

WaterCrawl provides an official Python client that makes it easy to interact with the API. You can install it using pip:

```bash
pip install watercrawl-py
```

## Basic Usage

```python
from watercrawl import WaterCrawlAPIClient

# Initialize the client
client = WaterCrawlAPIClient('your_api_key')

# Quick scrape a single URL
result = client.scrape_url(
    url="https://example.com",
    page_options={
        "exclude_tags": ["nav", "footer", "aside"],
        "include_tags": ["article", "main"],
        "wait_time": 100,
        "include_html": False,
        "only_main_content": True,
        "include_links": False
    }
)
```

## Advanced Usage

### 1. Create and Monitor a Crawl

```python
# Start a new crawl
crawl = client.create_crawl_request(
    url="https://example.com",
    spider_options={
        "max_depth": 2,
        "page_limit": 100,
        "allowed_domains": ["example.com"],
        "exclude_paths": ["/private/*"],
        "include_paths": ["/blog/*"]
    },
    page_options={
        "exclude_tags": ["nav", "footer", "aside"],
        "include_tags": ["article", "main"],
        "wait_time": 100,
        "include_html": False,
        "only_main_content": True,
        "include_links": False
    }
)

# Monitor the crawl progress
for event in client.monitor_crawl_request(crawl['uuid']):
    if event['type'] == 'state':
        print(f"Status: {event['data']['status']}")
    elif event['type'] == 'result':
        print(f"New page crawled: {event['data']['url']}")
```

### 2. List and Manage Crawls

```python
# List all crawl requests
crawls = client.get_crawl_requests_list(page=1, page_size=10)

# Get details of a specific crawl
crawl = client.get_crawl_request('crawl_uuid')

# Stop a running crawl
client.stop_crawl_request('crawl_uuid')

# Get results of a crawl
results = client.get_crawl_request_results('crawl_uuid')

# Download complete crawl data
data = client.download_crawl_request('crawl_uuid')
```

## Asynchronous vs Synchronous

The client supports both synchronous and asynchronous crawling:

```python
# Synchronous (wait for results)
result = client.scrape_url(
    url="https://example.com",
    sync=True,
    download=True  # Automatically download the results
)

# Asynchronous (return immediately)
crawl = client.scrape_url(
    url="https://example.com",
    sync=False
)
```

## Error Handling

The client will raise exceptions for HTTP errors. It's recommended to use try-except blocks:

```python
try:
    result = client.scrape_url("https://example.com")
except requests.exceptions.HTTPError as e:
    print(f"HTTP Error: {e}")
except requests.exceptions.RequestException as e:
    print(f"Error making request: {e}")
```

## API Reference

### WaterCrawlAPIClient Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `scrape_url()` | Quick single URL scrape | `url`, `page_options`, `plugin_options`, `sync`, `download` |
| `create_crawl_request()` | Start a new crawl | `url`, `spider_options`, `page_options`, `plugin_options` |
| `get_crawl_requests_list()` | List all crawls | `page`, `page_size` |
| `get_crawl_request()` | Get crawl details | `item_id` |
| `stop_crawl_request()` | Cancel a crawl | `item_id` |
| `monitor_crawl_request()` | Monitor crawl progress | `item_id`, `download` |
| `get_crawl_request_results()` | Get crawl results | `item_id` |
| `download_crawl_request()` | Download complete data | `item_id` |
