---
sidebar_position: 3
---

# Create Search Request

Create a new search request to find relevant web content.

**Endpoint**: `POST /api/v1/core/search/`

## Request Examples

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
from watercrawl import WaterCrawlAPIClient

# Initialize client
client = WaterCrawlAPIClient('your_api_key')

# Synchronous search - returns results directly
results = client.create_search_request(
    query="artificial intelligence",
    search_options={
        "depth": "basic", # "basic", "advanced", or "ultimate"
        "language": "en", # language code e.g. "en" or "fr" or "es"
        "country": "us", # country code e.g. "us" or "fr" or "es"
        "time_range": "any" # time range e.g. "any" or "hour" or "day" or "week" or "month" or "year",
        "search_type": "web" # "web" now just web is supported
    },
    result_limit=5,
    sync=True,
    download=True
)

# Print the results
for result in results:
    print(f"Title: {result['title']}")
    print(f"URL: {result['url']}")
    print(f"Description: {result['description']}")
    print("---")

# Asynchronous search - returns a request object
search_request = client.create_search_request(
    query="machine learning",
    search_options={
        "depth": "advanced",
        "language": "en"
    },
    sync=False
)

print(f"Search request ID: {search_request['uuid']}")
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```bash
curl -X POST "https://api.watercrawl.dev/api/v1/core/search/" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "artificial intelligence",
    "search_options": {
      "depth": "basic", # "basic", "advanced", or "ultimate"
      "language": "en", # language code e.g. "en" or "fr" or "es"
      "country": "us", # country code e.g. "us" or "fr" or "es"
      "time_range": "any" # time range e.g. "any" or "hour" or "day" or "week" or "month" or "year",
      "search_type": "web" # "web" now just web is supported
    },
    "result_limit": 5
  }'
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize client
const client = new WaterCrawlAPIClient('your_api_key');

// Synchronous search
async function performSearch() {
  try {
    // Synchronous search - returns results directly
    const results = await client.createSearchRequest(
      "artificial intelligence",
      {
        depth: "basic", // "basic", "advanced", or "ultimate"
        language: "en", // language code e.g. "en" or "fr" or "es"
        country: "us", // country code e.g. "us" or "fr" or "es"
        time_range: "any" // time range e.g. "any" or "hour" or "day" or "week" or "month" or "year",
        search_type: "web" // "web" now just web is supported
      },
      5,  // result_limit
      true,  // sync
      true   // download
    );

    // Print the results
    results.forEach(result => {
      console.log(`Title: ${result.title}`);
      console.log(`URL: ${result.url}`);
      console.log(`Description: ${result.description}`);
      console.log("---");
    });

    // Asynchronous search - returns a request object
    const searchRequest = await client.createSearchRequest(
      "machine learning",
      {
        depth: "advanced",
        language: "en"
      },
      5,    // result_limit
      false, // sync
      true   // download
    );

    console.log(`Search request ID: ${searchRequest.uuid}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

performSearch();
```
  </TabItem>
</Tabs>

## Request Body

```json
{
  "query": "artificial intelligence",
  "search_options": {
    "depth": "basic", # "basic", "advanced", or "ultimate"
    "language": "en", # language code e.g. "en" or "fr" or "es"
    "country": "us", # country code e.g. "us" or "fr" or "es"
    "time_range": "any" # time range e.g. "any" or "hour" or "day" or "week" or "month" or "year",
    "search_type": "web" # "web" now just web is supported
  },
  "result_limit": 5
}
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| query | string | Search query (required) |
| search_options | object | Search configuration options (required) |
| result_limit | integer | Maximum number of results to return (default: 5) |

#### Search Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| depth | string | Search depth: "basic", "advanced", or "ultimate" | "basic" |
| language | string | Language code (e.g., "en", "fr", "de") | null |
| country | string | Country code (e.g., "us", "gb", "ca") | null |
| time_range | string | Time range: "any", "hour", "day", "week", "month", "year" | "any" |
| search_type | string | Type of search (only "web" is supported currently) | "web" |

## Response Examples

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
# Synchronous response (sync=True)

{
      'uuid': '123e4567-e89b-12d3-a456-426614174000',
    'query': 'artificial intelligence',
    'search_options': {
        'depth': 'basic',
        'language': 'en',
        'country': 'us',
        'time_range': 'any',
        'search_type': 'web'
    },
    'result_limit': 10,
    'status': 'running',
    'created_at': '2024-01-01T00:00:00Z',
    'duration': null,
    'results': [
    {
        'title': 'Artificial Intelligence - Overview',
        'url': 'https://example.com/ai-overview',
        'description': 'Artificial intelligence (AI) refers to the simulation of human intelligence in machines...',
        'order': 1,
        'depth': 'basic'
    },
    # More results...
]
}


# Asynchronous response (sync=False)
{
    'uuid': '123e4567-e89b-12d3-a456-426614174000',
    'query': 'artificial intelligence',
    'search_options': {
        'depth': 'basic',
        'language': 'en',
        'country': 'us',
        'time_range': 'any',
        'search_type': 'web'
    },
    'result_limit': 10,
    'status': 'running',
    'created_at': '2024-01-01T00:00:00Z',
    'duration': null,
    'results': null
}
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```json
{
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "query": "artificial intelligence",
    "search_options": {
        "depth": "basic",
        "language": "en",
        "country": "us",
        "time_range": "any",
        "search_type": "web"
    },
    "result_limit": 10,
    "status": "running",
    "created_at": "2024-01-01T00:00:00Z",
    "duration": null,
    "results": null
}
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
// Synchronous response (sync=true)

{
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "query": "artificial intelligence",
    "search_options": {
        "depth": "basic",
        "language": "en",
        "country": "us",
        "time_range": "any",
        "search_type": "web"
    },
    "result_limit": 10,
    "status": "running",
    "created_at": "2024-01-01T00:00:00Z",
    "duration": null,
    "results": [
        {
            "title": "Artificial Intelligence - Overview",
            "url": "https://example.com/ai-overview",
            "description": "Artificial intelligence (AI) refers to the simulation of human intelligence in machines...",
            "order": 1,
            "depth": "basic"
        },
        // More results...
    ]
}

// Asynchronous response (sync=false)
{
    uuid: "123e4567-e89b-12d3-a456-426614174000",
    query: "artificial intelligence",
    search_options: {
        depth: "basic",
        language: "en",
        country: "us",
        time_range: "any",
        search_type: "web"
    },
    result_limit: 10,
    status: "running",
    created_at: "2024-01-01T00:00:00Z",
    duration: null,
    results: null
}
```
  </TabItem>
</Tabs>

## Synchronous vs Asynchronous

- **Synchronous mode** (`sync=true`): The API will wait for the search to complete and return the results directly. This is useful for quick searches where you need the results immediately.
  
- **Asynchronous mode** (`sync=false`): The API will immediately return a search request object with a UUID. You can then use this UUID to monitor the search progress and retrieve results when they're ready. This is useful for longer searches or when you want to handle the results in a separate process.

## Download Option

The `download` parameter (called `prefetched` in the raw API) determines whether the API should return the actual result content:

- When `download=true`, the API returns full search results with titles, descriptions, etc.
- When `download=false`, the API only returns URLs, which you can fetch separately.

## Credit Usage

Different search depths consume different amounts of credits:

| Depth | Description | Credits Used |
|-------|-------------|--------------|
| basic | Quick search with fewer results | 1 credit |
| advanced | More comprehensive search | 2 credits |
| ultimate | Extensive search with more results | 5 credits |

## Error Responses

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Bad Request | Missing required fields or invalid parameters |
| 401 | Unauthorized | Invalid or missing API key |
| 403 | Forbidden | Insufficient credits or max requests exceeded |
