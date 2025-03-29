---
sidebar_position: 0
---

# API Overview

Welcome to the WaterCrawl API documentation. This guide will help you understand and integrate with our API.

## Client Libraries

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```bash
pip install watercrawl-py
```

```python
from watercrawl import WaterCrawlAPIClient
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```bash
npm install @watercrawl/nodejs
```

```javascript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';
```
  </TabItem>
</Tabs>

## Authentication

All API requests require authentication using a JWT token. Include the token in the Authorization header:

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
from watercrawl import WaterCrawlAPIClient

# The client handles authentication automatically
client = WaterCrawlAPIClient('your_api_key')
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.watercrawl.dev/api/v1/...
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('your-api-key');
```
  </TabItem>
</Tabs>

## Status Values

Crawl requests can have the following status values:

- `new`: Crawl request created but not started
- `running`: Crawl is in progress
- `finished`: Crawl completed successfully
- `cancelling`: Crawl is being cancelled
- `canceled`: Crawl was cancelled
- `failed`: Crawl failed due to an error

## API Endpoints
1. [Scrape URL](./scrape-url): Start a new crawl
2. [Create Crawl Request](./create-crawl): Start a new crawl
3. [List Crawl Requests](./list-crawls): Get all crawls
4. [Get Crawl Request](./get-crawl): Get crawl details
5. [Cancel Crawl Request](./cancel-crawl): Stop a crawl
6. [Monitor Crawl Status](./monitor-crawl): Track progress
7. [List Crawl Results](./list-results): Get results

## Best Practices

1. **Rate Limiting**: Implement appropriate rate limiting in your client applications to avoid overwhelming the target websites.
2. **Resource Management**: Use the `page_limit` and `max_depth` options to control the scope of your crawls.
3. **Error Handling**: Always check the status of your crawl requests and implement proper error handling.
4. **Content Extraction**: Use `exclude_tags` and `include_tags` to precisely target the content you need.
5. **Domain Restrictions**: Use `allowed_domains` to prevent the crawler from accessing unintended domains.
