---
sidebar_position: 5
---

# Stop/Cancel Crawl Request

Stop a running crawl request.

**Endpoint**: `DELETE /api/v1/core/crawl-requests/{uuid}/`

## Request Examples

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
from watercrawl import WaterCrawlAPIClient

# Initialize client
client = WaterCrawlAPIClient('your_api_key')

# Stop a crawl request
response = client.stop_crawl_request('123e4567-e89b-12d3-a456-426614174000')

print(f"Crawl Status: {response['status']}")
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```bash
curl -X DELETE "https://api.watercrawl.dev/api/v1/core/crawl-requests/123e4567-e89b-12d3-a456-426614174000/" \
  -H "Authorization: Bearer YOUR_API_KEY"
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize client
const client = new WaterCrawlAPIClient('your_api_key');

// Cancel a crawl request
const response = await client.stopCrawlRequest('123e4567-e89b-12d3-a456-426614174000');

console.log(`Crawl Status: ${response.status}`);
```
  </TabItem>
</Tabs>

## Response Example
```bash
204 No Content
```

### URL Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| uuid | string | The UUID of the crawl request to cancel |
