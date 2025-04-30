---
sidebar_position: 6
---

# Cancel Search Request

Cancel a running search request.

**Endpoint**: `DELETE /api/v1/core/search/{id}/`

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
    search_options={"depth": "ultimate"},
    sync=False
)

# Get the search request ID
search_id = search_request['uuid']
print(f"Started search request: {search_id}")

# Cancel the search request
client.stop_search_request(search_id)
print(f"Cancelled search request: {search_id}")

# Verify it was cancelled
search_request = client.get_search_request(search_id)
print(f"Status: {search_request['status']}")  # Should show 'canceled'
```
  </TabItem>
  <TabItem value="curl" label="cURL">
```bash
curl -X DELETE "https://api.watercrawl.dev/api/v1/core/search/123e4567-e89b-12d3-a456-426614174000/" \
  -H "Authorization: Bearer YOUR_API_KEY"
```
  </TabItem>
  <TabItem value="node" label="Node.js">
```javascript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize client
const client = new WaterCrawlAPIClient('your_api_key');

async function cancelSearch() {
  try {
    // Create an asynchronous search request first
    const searchRequest = await client.createSearchRequest(
      "artificial intelligence",
      { depth: "ultimate" },
      10,
      false  // async mode
    );
    
    const searchId = searchRequest.uuid;
    console.log(`Started search request: ${searchId}`);
    
    // Cancel the search request
    await client.stopSearchRequest(searchId);
    console.log(`Cancelled search request: ${searchId}`);
    
    // Verify it was cancelled
    const updatedRequest = await client.getSearchRequest(searchId);
    console.log(`Status: ${updatedRequest.status}`);  // Should show 'canceled'
  } catch (error) {
    console.error("Error cancelling search:", error);
  }
}

cancelSearch();
```
  </TabItem>
</Tabs>

## Response

The endpoint returns an empty response with HTTP status code 204 (No Content) when successful.

## When to Cancel Searches

You might want to cancel a search request in the following scenarios:

1. **User Cancellation**: When a user explicitly cancels a search operation in your application
2. **Timeout**: If a search is taking too long and you want to implement a client-side timeout
3. **Changed Requirements**: If the search parameters are no longer relevant
4. **Resource Management**: To free up resources for more important searches
5. **Cost Control**: To prevent excessive credit usage for searches that are no longer needed

## Error Responses

| Status Code | Error | Description |
|-------------|-------|-------------|
| 404 | Not Found | The specified search request does not exist |
| 401 | Unauthorized | Invalid or missing API key |
| 400 | Bad Request | The search request cannot be cancelled (e.g., already completed) |

## Important Considerations

1. **Billing Impact**: Cancelling a search will stop the consumption of additional credits, but credits already used will not be refunded.

2. **Partial Results**: If a search is cancelled while in progress, any partial results that were collected before cancellation might still be available through the [Get Search Request](./get-search) endpoint.

3. **Status Transition**: After cancellation, a search request will first transition to `canceling` status and then to `canceled` once the cancellation is complete.

4. **Idempotent Operation**: Cancelling an already cancelled or completed search is a no-op (it will not return an error).
