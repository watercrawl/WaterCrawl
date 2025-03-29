---
sidebar_position: 1
---

# Scrape Single URL

A convenience function available in client libraries to quickly scrape a single URL. This function combines the create crawl request and monitoring functionality into a single synchronous operation.

:::note
This function is only available in the client libraries and is not a direct API endpoint.
:::

## Request Examples

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
from watercrawl import WaterCrawlAPIClient

# Initialize client
client = WaterCrawlAPIClient('your_api_key')

# Quick scrape a single URL with default options
result = client.scrape_url('https://example.com')

# Scrape with custom page options
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

# Print the extracted content
print(result['result']['markdown'])
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```typescript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize client
const client = new WaterCrawlAPIClient('your-api-key');

// Simple synchronous crawling
const result = await client.scrapeUrl('https://example.com');
console.log(result);

// Scrape with custom options
const result = await client.scrapeUrl(
    'https://example.com',
    {}, // spider options (not used for single URL)
    {
        exclude_tags: ['nav', 'footer', 'aside'],
        include_tags: ['article', 'main'],
        wait_time: 100,
        include_html: false,
        only_main_content: true,
        include_links: false
    }
);

// Print the extracted content
console.log(result.result.markdown);

// Asynchronous crawling with monitoring
const request = await client.scrapeUrl('https://example.com', {}, {}, false);
for await (const event of client.monitorCrawlRequest(request.uuid)) {
    console.log('Event:', event);
}
```
  </TabItem>
</Tabs>

## Response Example

```json
{
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "url": "https://example.com/page",
    "status": "success",
    "result": {
        "markdown": "Extracted content...",
        "html": "<html>...</html>",
        "metadata": {
            "title": "Page Title",
            "description": "Page Description",
            "language": "en",
            "word_count": 1500
        },
        "links": ["https://example.com/link1", "https://example.com/link2"]
    },
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
```

## Function Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| url | string | Yes | The URL to scrape |
| page_options | object | No | Options for page processing |
| wait_for_completion | boolean | No | If false, returns immediately with crawl request info instead of waiting for results (Node.js only) |

### Page Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| exclude_tags | string[] | [] | HTML tags to exclude from content extraction |
| include_tags | string[] | [] | HTML tags to include in content extraction |
| wait_time | number | 0 | Time to wait after page load (ms) |
| include_html | boolean | false | Include raw HTML in result |
| only_main_content | boolean | true | Extract only main content |
| include_links | boolean | false | Include list of links in result |

## How It Works

The `scrape_url` function is a convenience wrapper that:

1. Creates a crawl request for a single URL
2. Monitors the crawl progress
3. Returns the final result when complete

Under the hood, it uses:
- `create_crawl_request` with depth=0 and page_limit=1
- `monitor_crawl_request` to wait for completion
- Returns the first (and only) result

This provides a simpler interface when you only need to scrape a single URL and want to wait for the result.

:::tip
For scraping multiple pages or more complex crawling needs, use the [Create Crawl Request](./create-crawl) endpoint directly.
:::