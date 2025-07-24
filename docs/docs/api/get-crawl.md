---
sidebar_position: 3
---

# Get Crawl Request

Get details of a specific crawl request.

**Endpoint**: `GET /api/v1/core/crawl-requests/{uuid}/`

## Request Examples

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
from watercrawl import WaterCrawlAPIClient

# Initialize client
client = WaterCrawlAPIClient('your_api_key')

# Get crawl request details
crawl = client.get_crawl_request('123e4567-e89b-12d3-a456-426614174000')

print(f"Crawl Status: {crawl['status']}")
print(f"Documents Found: {crawl['number_of_documents']}")
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```bash
curl "https://api.watercrawl.dev/api/v1/core/crawl-requests/123e4567-e89b-12d3-a456-426614174000/" \
  -H "Authorization: Bearer YOUR_API_KEY"
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize client
const client = new WaterCrawlAPIClient('your_api_key');

// Get crawl request details
const crawl = await client.getCrawlRequest('123e4567-e89b-12d3-a456-426614174000');

console.log(`Crawl Status: ${crawl.status}`);
console.log(`Documents Found: ${crawl.number_of_documents}`);
```
  </TabItem>
</Tabs>

## Response Example

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
{
    'uuid': '123e4567-e89b-12d3-a456-426614174000',
    'url': 'https://example.com',
    'status': 'running',
    'options': {
        'spider_options': {
            'max_depth': 2,
            'page_limit': 100,
            'allowed_domains': ['example.com'],
            'exclude_paths': ['/private/*'],
            'include_paths': ['/blog/*'],
            'ignore_rendering': False,
        },
        'page_options': {
            'exclude_tags': ['nav', 'footer', 'aside'],
            'include_tags': ['article', 'main'],
            'wait_time': 100,
            'include_html': False,
            'only_main_content': True,
            'include_links': False
        },
        'plugin_options': {
            // Optional plugin-specific configuration
        }
    },
    'created_at': '2024-01-01T00:00:00Z',
    'updated_at': '2024-01-01T00:00:00Z',
    'number_of_documents': '42'
}
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```json
{
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "url": "https://example.com",
    "status": "running",
    "options": {
        "spider_options": {
            "max_depth": 2,
            "page_limit": 100,
            "allowed_domains": ["example.com"],
            "exclude_paths": ["/private/*"],
            "include_paths": ["/blog/*"],
            "ignore_rendering": False,
        },
        "page_options": {
            "exclude_tags": ["nav", "footer", "aside"],
            "include_tags": ["article", "main"],
            "wait_time": 100,
            "include_html": false,
            "only_main_content": true,
            "include_links": false
        },
        "plugin_options": {
            // Optional plugin-specific configuration
        }
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "number_of_documents": "42"
}
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
{
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    url: 'https://example.com',
    status: 'running',
    options: {
        spider_options: {
            max_depth: 2,
            page_limit: 100,
            allowed_domains: ['example.com'],
            exclude_paths: ['/private/*'],
            include_paths: ['/blog/*'],
            ignore_rendering: false,
        },
        page_options: {
            exclude_tags: ['nav', 'footer', 'aside'],
            include_tags: ['article', 'main'],
            wait_time: 100,
            include_html: false,
            only_main_content: true,
            include_links: false
        },
        plugin_options: {
            // Optional plugin-specific configuration
        }
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    number_of_documents: '42'
}
```
  </TabItem>
</Tabs>

### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| uuid | string | The UUID of the crawl request to retrieve |
