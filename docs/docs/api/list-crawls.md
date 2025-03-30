---
sidebar_position: 2
---

# List Crawl Requests

List all crawl requests.

**Endpoint**: `GET /api/v1/core/crawl-requests/`

## Request Examples

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
from watercrawl import WaterCrawlAPIClient

# Initialize client
client = WaterCrawlAPIClient('your_api_key')

# List all crawl requests
crawls = client.get_crawl_requests_list()

# Print the results
for crawl in crawls['results']:
    print(f"Crawl {crawl['uuid']}: Status={crawl['status']}")

# Pagination page 2, 10 results per page
next_page = client.get_crawl_requests_list(page=2, page_size=10)
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```bash
curl "https://api.watercrawl.dev/api/v1/core/crawl-requests/?page=1&page_size=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize client
const client = new WaterCrawlAPIClient('your_api_key');

// List all crawl requests
const crawls = await client.getCrawlRequestsList();

// Print the results
crawls.results.forEach(crawl => {
    console.log(`Crawl ${crawl.uuid}: Status=${crawl.status}`);
});

// Pagination page 2, 10 results per page
const nextPage = await client.getCrawlRequestsList(2, 10);
```
  </TabItem>
</Tabs>

## Response Example

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
{
    'count': 123,
    'next': 'http://api.example.org/api/v1/core/crawl-requests/?page=4',
    'previous': 'http://api.example.org/api/v1/core/crawl-requests/?page=2',
    'results': [
        {
            'uuid': '123e4567-e89b-12d3-a456-426614174000',
            'url': 'https://example.com',
            'status': 'running',
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z',
            'number_of_documents': '42'
        }
    ]
}
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```json
{
    "count": 123,
    "next": "http://api.watercrawl.dev/api/v1/core/crawl-requests/?page=4",
    "previous": "http://api.watercrawl.dev/api/v1/core/crawl-requests/?page=2",
    "results": [
        {
            "uuid": "123e4567-e89b-12d3-a456-426614174000",
            "url": "https://example.com",
            "status": "running",
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z",
            "number_of_documents": "42"
        }
    ]
}
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
{
    count: 123,
    next: 'http://api.watercrawl.dev/api/v1/core/crawl-requests/?page=4',
    previous: 'http://api.watercrawl.dev/api/v1/core/crawl-requests/?page=2',
    results: [
        {
            uuid: '123e4567-e89b-12d3-a456-426614174000',
            url: 'https://example.com',
            status: 'running',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            number_of_documents: '42'
        }
    ]
}
```
  </TabItem>
</Tabs>

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number for pagination |
| page_size | integer | Number of results per page |
