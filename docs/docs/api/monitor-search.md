---
sidebar_position: 4
---

# Monitor Search Status

Monitor the status of an ongoing search request using Server-Sent Events (SSE).

**Endpoint**: `GET /api/v1/core/search/{id}/status/`

## Request Examples

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
from watercrawl import WaterCrawlAPIClient

# Initialize client
client = WaterCrawlAPIClient('your_api_key')

# Create an asynchronous search request first
search_request = client.create_search_request(
    query="artificial intelligence",
    search_options={"depth": "advanced"},
    sync=False
)

# Get the search request ID
search_id = search_request['uuid']

# Monitor search status with Server-Sent Events
for event in client.monitor_search_request(search_id, download=True):
    if event['type'] == 'state':
        print(f"Search status: {event['status']}")
        
        # Check if search is complete
        if event['status'] in ['finished', 'failed']:
            print(f"Search completed with status: {event['status']}")
            
            # If results are available
            if event['data']['result'] and event['data']['status'] == 'finished':
                for result in event['data']['result']:
                    print(f"- {result['title']}: {result['url']}")
            break
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```bash
curl -N "https://api.watercrawl.dev/api/v1/core/search/123e4567-e89b-12d3-a456-426614174000/status/?prefetched=true" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Accept: text/event-stream"
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize client
const client = new WaterCrawlAPIClient('your_api_key');

async function monitorSearch() {
  try {
    // Create an asynchronous search request first
    const searchRequest = await client.createSearchRequest(
      "artificial intelligence",
      { depth: "advanced" },
      10,
      false  // async mode
    );
    
    const searchId = searchRequest.uuid;
    console.log(`Monitoring search request: ${searchId}`);
    
    // Monitor search status with SSE
    for await (const event of client.monitorSearchRequest(searchId, true)) {
      if (event.type === 'state') {
        console.log(`Search status: ${event.status}`);
        
        // Check if search is complete
        if (['finished', 'failed'].includes(event.status)) {
          console.log(`Search completed with status: ${event.status}`);
          
          // If results are available
          if (event.data.result && event.data.status === 'finished') {
            const results = event.data.result;
            results.forEach(result => {
              console.log(`- ${result.title}: ${result.url}`);
            });
          }
          break;
        }
      }
    }
  } catch (error) {
    console.error("Error monitoring search:", error);
  }
}

monitorSearch();
```
  </TabItem>
</Tabs>

## Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| prefetched | boolean | Whether to include full result data (true) or just URLs (false) |

In client libraries, this parameter is often named `download` for clarity.

## SSE Event Format

The endpoint returns a stream of Server-Sent Events (SSE) with the following format:

```
data: {"type": "state", "data": {...}}
```

Each event has a `type` field and additional data depending on the event type.

### Event Types

| Event Type | Description |
|------------|-------------|
| state | Updates on the search status with the current state of the search request |

### Status Values

Search requests can have the following status values:

- `new`: Search request created but not started
- `running`: Search is in progress
- `finished`: Search completed successfully
- `canceling`: Search is being cancelled
- `canceled`: Search was cancelled
- `failed`: Search failed due to an error

## Response Examples

<Tabs groupId="client-examples">
  <TabItem value="python" label="Python" default>
```python
# Event structure
{
    'type': 'state',
    'data': {
        'uuid': '123e4567-e89b-12d3-a456-426614174000',
        'query': 'artificial intelligence',
        'search_options': {
            'depth': 'advanced',
            'language': 'en',
            'country': null,
            'time_range': 'any'
        },
        'result_limit': 10,
        'status': 'running',
        'created_at': '2024-01-01T00:00:00Z',
        'duration': null,
        'result': []
    }
}

# Completion event (when prefetched=True)
{
    'type': 'state',
    'data': {
        'uuid': '123e4567-e89b-12d3-a456-426614174000',
        'query': 'artificial intelligence',
        'search_options': {
            'depth': 'advanced',
            'language': 'en',
            'country': null,
            'time_range': 'any'
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
}
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```
data: {"type":"state","status":"running","data":{"uuid":"123e4567-e89b-12d3-a456-426614174000","query":"artificial intelligence","search_options":{"depth":"advanced","language":"en","country":null,"time_range":"any"},"result_limit":10,"status":"running","created_at":"2024-01-01T00:00:00Z","duration":null,"result":[]}}

data: {"type":"state","status":"finished","data":{"uuid":"123e4567-e89b-12d3-a456-426614174000","query":"artificial intelligence","search_options":{"depth":"advanced","language":"en","country":null,"time_range":"any"},"result_limit":10,"status":"finished","created_at":"2024-01-01T00:00:00Z","duration":"2.5s","result":[{"title":"Artificial Intelligence - Overview","url":"https://example.com/ai-overview","description":"Artificial intelligence (AI) refers to the simulation of human intelligence in machines...","order":1,"depth":"advanced"}]}}
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
// Event structure
{
    type: 'state',
    data: {
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        query: 'artificial intelligence',
        search_options: {
            depth: 'advanced',
            language: 'en',
            country: null,
            time_range: 'any'
        },
        result_limit: 10,
        status: 'running',
        created_at: '2024-01-01T00:00:00Z',
        duration: null,
        result: []
    }
}

// Completion event (when prefetched=true)
{
    type: 'state',
    data: {
        uuid: '123e4567-e89b-12d3-a456-426614174000',
        query: 'artificial intelligence',
        search_options: {
            depth: 'advanced',
            language: 'en',
            country: null,
            time_range: 'any'
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
}
```
  </TabItem>
</Tabs>

## Best Practices

1. **Error Handling**: Implement proper error handling for SSE connections, including automatic reconnection in case of network issues.

2. **Timeout Handling**: Consider implementing a timeout mechanism to handle cases where a search might take too long.

3. **Prefetched Parameter**: Use `prefetched=true` (or `download=true` in client libraries) when you want to get the full results in the completion event, which saves an additional API call.

4. **Complete Processing**: Always check for final states (`finished`, `failed`, `canceled`) to ensure complete processing of the search request.

## Error Responses

| Status Code | Error | Description |
|-------------|-------|-------------|
| 404 | Not Found | The specified search request does not exist |
| 401 | Unauthorized | Invalid or missing API key |
