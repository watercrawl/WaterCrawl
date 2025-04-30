---
sidebar_position: 5
---

# Get Search Request

Retrieve details of a specific search request by its ID.

**Endpoint**: `GET /api/v1/core/search/{id}/`

## Request Examples

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
from watercrawl import WaterCrawlAPIClient

# Initialize client
client = WaterCrawlAPIClient('your_api_key')

# Get details of a search request
search_id = "123e4567-e89b-12d3-a456-426614174000"
search_request = client.get_search_request(search_id, download=True)

print(f"Search query: {search_request['query']}")
print(f"Status: {search_request['status']}")
print(f"Created at: {search_request['created_at']}")

# If the search is completed and results are available
if search_request['status'] == 'finished' and search_request['result']:
    print("\nResults:")
    for result in search_request['result']:
        print(f"- {result['title']}: {result['url']}")
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```bash
curl "https://api.watercrawl.dev/api/v1/core/search/123e4567-e89b-12d3-a456-426614174000/" \
  -H "Authorization: Bearer YOUR_API_KEY"
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize client
const client = new WaterCrawlAPIClient('your_api_key');

async function getSearchDetails() {
  try {
    // Get details of a search request
    const searchId = "123e4567-e89b-12d3-a456-426614174000";
    // download=True will download the results
    const searchRequest = await client.getSearchRequest(searchId, true);
    
    console.log(`Search query: ${searchRequest.query}`);
    console.log(`Status: ${searchRequest.status}`);
    console.log(`Created at: ${searchRequest.created_at}`);
    
    // If the search is completed and results are available
    if (searchRequest.status === 'finished' && searchRequest.result) {
      console.log("\nResults:");
      searchRequest.result.forEach(result => {
        console.log(`- ${result.title}: ${result.url}`);
      });
    }
  } catch (error) {
    console.error("Error retrieving search details:", error);
  }
}

getSearchDetails();
```
  </TabItem>
</Tabs>

## Response Example

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
{
    'uuid': '123e4567-e89b-12d3-a456-426614174000',
    'query': 'artificial intelligence',
    'search_options': {
        'depth': 'advanced',
        'language': 'en',
        'country': null,
        'time_range': 'any',
        'search_type': 'web'
    },
    'result_limit': 10,
    'status': 'finished',
    'created_at': '2024-01-01T00:00:00Z',
    'duration': '2.5s',
    'result': [
        {
            'title': 'Artificial Intelligence - Overview',
            'url': 'https://example.com/ai-overview',
            'description': 'Artificial intelligence (AI) refers to the simulation of human intelligence in machines...',
            'order': 1,
            'depth': 'advanced'
        },
        # More results...
    ]
}
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```json
{
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "query": "artificial intelligence",
    "search_options": {
        "depth": "advanced",
        "language": "en",
        "country": null,
        "time_range": "any",
        "search_type": "web"
    },
    "result_limit": 10,
    "status": "finished",
    "created_at": "2024-01-01T00:00:00Z",
    "duration": "2.5s",
    "result": [
        {
            "title": "Artificial Intelligence - Overview",
            "url": "https://example.com/ai-overview",
            "description": "Artificial intelligence (AI) refers to the simulation of human intelligence in machines...",
            "order": 1,
            "depth": "advanced"
        }
    ]
}
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
{
    uuid: '123e4567-e89b-12d3-a456-426614174000',
    query: 'artificial intelligence',
    search_options: {
        depth: 'advanced',
        language: 'en',
        country: null,
        time_range: 'any',
        search_type: 'web'
    },
    result_limit: 10,
    status: 'finished',
    created_at: '2024-01-01T00:00:00Z',
    duration: '2.5s',
    result: [
        {
            title: 'Artificial Intelligence - Overview',
            url: 'https://example.com/ai-overview',
            description: 'Artificial intelligence (AI) refers to the simulation of human intelligence in machines...',
            order: 1,
            depth: 'advanced'
        },
        // More results...
    ]
}
```
  </TabItem>
</Tabs>

## Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| prefetched | boolean | Whether to include full result data (true) or just URLs (false) |

In client libraries, this parameter is often named `download` for clarity.

## Response Details

| Field | Type | Description |
|-------|------|-------------|
| uuid | string | Unique identifier for the search request |
| query | string | The search query |
| search_options | object | The search options used |
| result_limit | integer | Maximum number of results requested |
| status | string | Current status of the search request |
| created_at | string | Timestamp when the search request was created |
| duration | string | Time taken to complete the search (null if not finished) |
| result | array/string | Search results or null if not completed |

### Status Values

Search requests can have the following status values:

- `new`: Search request created but not started
- `running`: Search is in progress
- `finished`: Search completed successfully
- `canceling`: Search is being cancelled
- `canceled`: Search was cancelled
- `failed`: Search failed due to an error

## Result Format

When the search is completed (`status` is `finished`), the `result` field will contain an array of search results, each with the following structure:

| Field | Type | Description |
|-------|------|-------------|
| title | string | Title of the search result |
| url | string | URL of the result |
| description | string | Description or snippet of the result |
| order | integer | Result ranking position |
| depth | string | Depth level of this particular result |

## Error Responses

| Status Code | Error | Description |
|-------------|-------|-------------|
| 404 | Not Found | The specified search request does not exist |
| 401 | Unauthorized | Invalid or missing API key |
