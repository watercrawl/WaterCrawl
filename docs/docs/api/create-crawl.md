---
sidebar_position: 2
---

# Create Crawl Request

Start a new crawl request.

**Endpoint**: `POST /api/v1/core/crawl-requests/`

## Request Examples

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
from watercrawl import WaterCrawlAPIClient

# Initialize client
client = WaterCrawlAPIClient('your_api_key')

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
        "include_links": False,
        "ignore_rendering": False,
    }
)

print(f"Crawl started with ID: {crawl['uuid']}")
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```bash
curl -X POST "https://api.watercrawl.dev/api/v1/core/crawl-requests/" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "options": {
      "spider_options": {
        "max_depth": 2,
        "page_limit": 100,
        "allowed_domains": ["example.com"],
        "exclude_paths": ["/private/*"],
        "include_paths": ["/blog/*"]
      },
      "page_options": {
        "exclude_tags": ["nav", "footer", "aside"],
        "include_tags": ["article", "main"],
        "wait_time": 100,
        "include_html": false,
        "only_main_content": true,
        "include_links": false,
        "ignore_rendering": false
      }
    }
  }'
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize client
const client = new WaterCrawlAPIClient('your_api_key');

// Start a new crawl
const crawl = await client.createCrawlRequest({
    url: 'https://example.com',
    spiderOptions: {
        maxDepth: 2,
        pageLimit: 100,
        allowedDomains: ['example.com'],
        excludePaths: ['/private/*'],
        includePaths: ['/blog/*']
    },
    pageOptions: {
        excludeTags: ['nav', 'footer', 'aside'],
        includeTags: ['article', 'main'],
        waitTime: 100,
        includeHtml: false,
        onlyMainContent: true,
        includeLinks: false
    }
});

console.log(`Crawl started with ID: ${crawl.uuid}`);
```
  </TabItem>
</Tabs>

## Options

### Spider Options

| Option | Type | Description |
|--------|------|-------------|
| max_depth | integer | Maximum depth to crawl (default: 1) |
| page_limit | integer | Maximum number of pages to crawl (default: 1) |
| allowed_domains | array | List of domains to crawl (support star pattern `*.example.com`) |
| exclude_paths | array | URL patterns to exclude (support star pattern `blog/*`) |
| include_paths | array | URL patterns to include (support star pattern `blog/*`) |

### Page Options

| Option | Type | Description |
|--------|------|-------------|
| exclude_tags | array | HTML tags to exclude from content |
| include_tags | array | HTML tags to include in content |
| wait_time | integer | Time to wait before extracting content |
| include_html | boolean | Include HTML in the extracted content |
| only_main_content | boolean | Extract only the main content |
| include_links | boolean | Include links in the extracted content |
| ignore_rendering | boolean | Ignore rendering | false |

## Response Examples

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
{
  'uuid': '123e4567-e89b-12d3-a456-426614174000',
  'url': 'https://example.com',
  'status': 'new',
  'options': {
      'spider_options': {
          'max_depth': 2,
          'page_limit': 100,
          'allowed_domains': ['example.com'],
          'exclude_paths': ['/private/*'],
          'include_paths': ['/blog/*']
      },
      'page_options': {
          'exclude_tags': ['nav', 'footer', 'aside'],
          'include_tags': ['article', 'main'],
          'wait_time': 100,
          'include_html': False,
          'only_main_content': True,
          'include_links': False,
          'ignore_rendering': False
      }
  },
  'created_at': '2024-01-01T00:00:00Z',
  'updated_at': '2024-01-01T00:00:00Z',
  'number_of_documents': '0'
}
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```json
{
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "url": "https://example.com",
  "status": "new",
  "options": {
    "spider_options": {
      "max_depth": 2,
      "page_limit": 100,
      "allowed_domains": ["example.com"],
      "exclude_paths": ["/private/*"],
      "include_paths": ["/blog/*"]
    },
    "page_options": {
      "exclude_tags": ["nav", "footer", "aside"],
      "include_tags": ["article", "main"],
      "wait_time": 100,
      "include_html": false,
      "only_main_content": true,
      "include_links": false,
      "ignore_rendering": false,
    }
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "number_of_documents": "0"
}
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
{
  'uuid': '123e4567-e89b-12d3-a456-426614174000',
  'url': 'https://example.com',
  'status': 'new',
  'options': {
      'spider_options': {
          'max_depth': 2,
          'page_limit': 100,
          'allowed_domains': ['example.com'],
          'exclude_paths': ['/private/*'],
          'include_paths': ['/blog/*'],
          'ignore_rendering': false,
      },
      'page_options': {
          'exclude_tags': ['nav', 'footer', 'aside'],
          'include_tags': ['article', 'main'],
          'wait_time': 100,
          'include_html': false,
          'only_main_content': true,
          'include_links': false
      }
  },
  'created_at': '2024-01-01T00:00:00Z',
  'updated_at': '2024-01-01T00:00:00Z',
  'number_of_documents': '0'
}
```
  </TabItem>
</Tabs>
