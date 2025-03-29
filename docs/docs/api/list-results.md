---
sidebar_position: 6
---

# List Crawl Results

List all results for a specific crawl request.

**Endpoint**: `GET /api/v1/core/crawl-requests/{uuid}/results/`

## Request Examples

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
from watercrawl import WaterCrawlAPIClient

# Initialize client
client = WaterCrawlAPIClient('your_api_key')

# List all results for a crawl request
results = client.get_crawl_request_results('123e4567-e89b-12d3-a456-426614174000')

# Print the results
for result in results['results']:
    print(f"Page URL: {result['url']}")
    print(f"Status: {result['status']}")

# Pagination page 2, 10 results per page
next_page = client.get_crawl_request_results('123e4567-e89b-12d3-a456-426614174000', page=2, page_size=10)
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```bash
curl "https://api.watercrawl.dev/api/v1/core/crawl-requests/123e4567-e89b-12d3-a456-426614174000/results/?page=1&page_size=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize client
const client = new WaterCrawlAPIClient('your_api_key');

// List all results for a crawl request
const results = await client.getCrawlRequestResults('123e4567-e89b-12d3-a456-426614174000');

// Print the results
results.results.forEach(result => {
    console.log(`Page URL: ${result.url}`);
    console.log(`Status: ${result.status}`);
});

// Pagination page 2, 10 results per page
const nextPage = await client.getCrawlRequestResults('123e4567-e89b-12d3-a456-426614174000', 2, 10);
```
  </TabItem>
</Tabs>

## Response Example

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
{
    'count': 123,
    'next': 'https://api.watercrawl.dev/api/v1/core/crawl-requests/123e4567-e89b-12d3-a456-426614174000/results/?page=4',
    'previous': 'https://api.watercrawl.dev/api/v1/core/crawl-requests/123e4567-e89b-12d3-a456-426614174000/results/?page=2',
    'results': [
        {
            'uuid': '123e4567-e89b-12d3-a456-426614174000',
            'url': 'https://example.com/page',
            'status': 'success',
            'result': "https://storage.watercrawl.dev/results/123e4567-e89b-12d3-a456-426614174000.json",
            'attachments': [
                {
                    'uuid': '095be615-a8ad-4c33-8e9c-c7612fbf6c9f',
                    'attachment': 'https://storage.watercrawl.dev/123e4567-e89b-12d3-a456-426614174000.pdf',
                    'attachment_type': 'pdf',
                    'filename': 'screenshot.pdf'
                }
            ],
            'created_at': '2024-01-01T00:00:00Z'
        }
    ]
}
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```json
{
    "count": 123,
    "next": "https://api.watercrawl.dev/api/v1/core/crawl-requests/123e4567-e89b-12d3-a456-426614174000/results/?page=4",
    "previous": "https://api.watercrawl.dev/api/v1/core/crawl-requests/123e4567-e89b-12d3-a456-426614174000/results/?page=2",
    "results": [
        {
            "uuid": "123e4567-e89b-12d3-a456-426614174000",
            "url": "https://example.com/page",
            "status": "success",
            "result": "https://storage.watercrawl.dev/results/123e4567-e89b-12d3-a456-426614174000.json",
            "attachments": [
                {
                    "uuid": "095be615-a8ad-4c33-8e9c-c7612fbf6c9f",
                    "attachment": "https://storage.watercrawl.dev/123e4567-e89b-12d3-a456-426614174000.pdf",
                    "attachment_type": "pdf",
                    "filename": "screenshot.pdf"
                }
            ],
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
{
    "count": 123,
    "next": "https://api.watercrawl.dev/api/v1/core/crawl-requests/123e4567-e89b-12d3-a456-426614174000/results/?page=4",
    "previous": "https://api.watercrawl.dev/api/v1/core/crawl-requests/123e4567-e89b-12d3-a456-426614174000/results/?page=2",
    "results": [
        {
            "uuid": "123e4567-e89b-12d3-a456-426614174000",
            "url": "https://example.com/page",
            "status": "success",
            "result": "https://storage.watercrawl.dev/results/123e4567-e89b-12d3-a456-426614174000.json",
            "attachments": [
                {
                    "uuid": "095be615-a8ad-4c33-8e9c-c7612fbf6c9f",
                    "attachment": "https://storage.watercrawl.dev/123e4567-e89b-12d3-a456-426614174000.pdf",
                    "attachment_type": "pdf",
                    "filename": "screenshot.pdf"
                }
            ],
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```
  </TabItem>
                    
</Tabs>

### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| uuid | string | The UUID of the crawl request to list results for |

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number for pagination |
| page_size | integer | Number of results per page |
