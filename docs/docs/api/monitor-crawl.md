---
sidebar_position: 5
---

# Monitor Crawl Status

Monitor the status and progress of a crawl request using server-sent events (SSE).

**Endpoint**: `GET /api/v1/core/crawl-requests/{id}/status/`

## Examples

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
from watercrawl import WaterCrawlAPIClient

# Initialize client
client = WaterCrawlAPIClient('your_api_key')

# Monitor crawl progress with content download
for event in client.monitor_crawl_request('123e4567-e89b-12d3-a456-426614174000', download=True):
    if event['type'] == 'state':
        crawl_request = event['data']  # CrawlRequest object
        print(f"Status: {crawl_request['status']}")
        print(f"Documents: {crawl_request['number_of_documents']}")
    elif event['type'] == 'result':
        result = event['data']  # Result object with content
        print(f"New page crawled: {result['url']}")
        print(f"Content: {result['result']}")
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```bash
# Monitor with content download
curl -N "https://api.watercrawl.dev/api/v1/core/crawl-requests/123e4567-e89b-12d3-a456-426614174000/status/" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Downloads flaged handled by SDKs itself. in the Curl mode you have to call it by yourself
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize client
const client = new WaterCrawlAPIClient('your_api_key');

// Monitor crawl progress with content download
const stream = client.monitorCrawlRequest('123e4567-e89b-12d3-a456-426614174000', true);

for await (const event of stream) {
    if (event.type === 'state') {
        const crawlRequest = event.data; // CrawlRequest object
        console.log(`Status: ${crawlRequest.status}`);
        console.log(`Documents: ${crawlRequest.number_of_documents}`);
    } else if (event.type === 'result') {
        const result = event.data; // Result object with content
        console.log(`New page crawled: ${result.url}`);
        console.log(`Content: ${result.result}`);
    }
}
```
  </TabItem>
</Tabs>

## Event Types

The endpoint sends two types of events:

1. **State Events**: Updates about the crawl status (returns a CrawlRequest object)
2. **Result Events**: Information about newly crawled pages (returns a Result object)

## Response Events

The monitoring endpoint uses Server-Sent Events (SSE) to stream real-time updates about your crawl request. While the raw response format looks like this:

```bash
data: {"type":"state","data":{...}}
data: {"type":"result","data":{...}}
```

Our SDKs handle all the event parsing and streaming complexity for you. You only need to handle two types of events in your code:

1. **State Events** (`event.type === 'state'`): Updates about the crawl status
   - Includes progress updates, status changes, and document counts
   - The `event.data` contains the full `CrawlRequest` object

2. **Result Events** (`event.type === 'result'`): New crawled pages
   - Triggered when a new page is successfully crawled
   - The `event.data` contains the `Result` object with page content

For example, using the Python SDK:
```python
for event in client.monitor_crawl_request(uuid):
    if event['type'] == 'state':
        # Handle status updates
        print(f"Status: {event['data']['status']}")
        print(f"Documents: {event['data']['number_of_documents']}")
    elif event['type'] == 'result':
        # Handle new page results
        print(f"New page: {event['data']['url']}")
        print(f"Content: {event['data']['result']}")
```

Or with the Node.js SDK:
```javascript
for await (const event of client.monitorCrawlRequest(uuid)) {
    if (event.type === 'state') {
        // Handle status updates
        console.log(`Status: ${event.data.status}`);
    } else if (event.type === 'result') {
        // Handle new page results
        console.log(`New page: ${event.data.url}`);
    }
}
```

## CrawlRequest Object

The state event returns a CrawlRequest object with the following structure:

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
{
    'uuid': '123e4567-e89b-12d3-a456-426614174000',
    'url': 'https://example.com',
    'status': 'running',
    'options': {
        'spider_options': { ... },
        'page_options': { ... }
    },
    'created_at': '2024-01-01T00:00:00Z',
    'updated_at': '2024-01-01T00:00:00Z',
    'number_of_documents': 42
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
    "spider_options": { ... },
    "page_options": { ... }
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "number_of_documents": 42
}
```
  </TabItem>
</Tabs>

### Result Object

The result event returns a Result object that varies based on the `download` parameter:

```json
// With download=true
{
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "url": "https://example.com/page",
    "status": "success",
    "result": {
        "markdown": "Extracted content...",
        "html": "<html>...</html>",
        "metadata": { ... },
        "links": ["https://example.com/link1", "https://example.com/link2"]
    },
    "attachments": [
        {
          "uuid": "095be615-a8ad-4c33-8e9c-c7612fbf6c9f",
          "attachment": "https://storage.watercrawl.dev/123e4567-e89b-12d3-a456-426614174000.pdf",
          "attachment_type": "pdf",
          "filename": "screenshot.pdf",
        }
    ],
    "created_at": "2024-01-01T00:00:00Z"
}

// With download=false
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
          "filename": "screenshot.pdf",
        }
    ],
    "created_at": "2024-01-01T00:00:00Z"
}
```

## SDKs Parameters
It is just available in the SDKs and client libraries. You cannot use it in the Curl mode.

| Parameter | Type | Description |
|-----------|------|-------------|
| download | boolean | If true, includes content in result events. If false, provides download URLs instead (default: false) |
