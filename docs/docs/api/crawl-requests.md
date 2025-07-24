---
sidebar_position: 2
---

# Core Crawl-Requests

The Core Crawl-Requests API allows you to manage web crawling operations in WaterCrawl. This section covers how to start new crawls, monitor their status, and retrieve results.

## Authentication

All API endpoints require authentication using an API key. Include your API key in the request headers:

```bash
X-API-KEY: your_api_key_here
```

## Endpoints

### 1. Start a New Crawl

```http
POST /api/v1/core/crawl-requests/
```

Start a new web crawling operation with specified options.

#### Request Body

```json
{
  "url": "https://example.com",
  "options": {
    "spider_options": {
      "max_depth": 2,
      "page_limit": 100,
      "allowed_domains": ["example.com"],
      "exclude_paths": ["/private/*"],
      "include_paths": ["/blog/*"],
      "ignore_rendering": false
    },
    "page_options": {
      "exclude_tags": ["nav", "footer", "aside"],
      "include_tags": ["article", "main"],
      "wait_time": 100,
      "include_html": false,
      "only_main_content": true,
      "include_links": false
    },
    "plugin_options": {
      // Optional plugin-specific configuration
    }
  }
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| url | string | The target URL to crawl (required) |
| options | object | Crawl configuration options (required) |

##### Spider Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| max_depth | integer | Maximum depth to crawl | 1 |
| page_limit | integer | Maximum number of pages to crawl | 1 |
| allowed_domains | array | List of allowed domains to crawl | [] |
| exclude_paths | array | List of paths to exclude | [] |
| include_paths | array | List of paths to include | [] |
| ignore_rendering | boolean | Ignore rendering | false |

##### Page Options

| Option | Type | Description |
|--------|------|-------------|
| exclude_tags | array | HTML tags to exclude from content |
| include_tags | array | HTML tags to include in content |
| wait_time | integer | Time to wait before extracting content |
| include_html | boolean | Include HTML in the extracted content |
| only_main_content | boolean | Extract only the main content |
| include_links | boolean | Include links in the extracted content |

### 2. List Crawl Requests

```http
GET /api/v1/core/crawl-requests/
```

Retrieve a list of all crawl requests with pagination support.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number for pagination |

#### Response

```json
{
  "count": 123,
  "next": "http://api.example.org/crawl-requests/?page=4",
  "previous": "http://api.example.org/crawl-requests/?page=2",
  "results": [
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
      "number_of_documents": "5"
    }
  ]
}
```

### 3. Get Crawl Request

```http
GET /api/v1/core/crawl-requests/{id}/
```

Retrieve details of a specific crawl request.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | UUID of the crawl request |

#### Response

```json
{
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "url": "https://example.com",
  "status": "running",
  "options": {
    "spider_options": {
      "max_depth": 2,
      "page_limit": 100,
      "allowed_domains": ["example.com"],
      "exclude_paths": ["/private/*"],
      "include_paths": ["/blog/*"],
      "ignore_rendering": false
    },
    "page_options": {
      "exclude_tags": ["nav", "footer", "aside"],
      "include_tags": ["article", "main"],
      "wait_time": 100,
      "include_html": false,
      "only_main_content": true,
      "include_links": false
    },
    "plugin_options": {
      // Optional plugin-specific configuration
    }
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "number_of_documents": "5"
}
```

### 4. Cancel Crawl Request

```http
DELETE /api/v1/core/crawl-requests/{id}/
```

Cancel a running crawl request.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | UUID of the crawl request to cancel |

#### Response

On successful cancellation:
```http
Status: 204 No Content
```

On crawl request not found:
```json
{
  "message": "Not found.",
  "errors": null,
  "code": 404
}
```

### 5. Monitor Crawl Status

```http
GET /api/v1/core/crawl-requests/{id}/status/
```

Monitor the status of a specific crawl request using Server-Sent Events (SSE).

#### Event Types

- **state**: Current state of the crawl (returns CrawlRequest object)
- **result**: New crawled page result (returns CrawlResult object)

#### Example Events

```json
// State Event
{
  "type": "state",
  "data": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "url": "https://example.com",
    "status": "running",
    "options": {
      "spider_options": { ... },
      "page_options": { ... }
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "number_of_documents": "45"
  }
}

// Result Event
{
  "type": "result",
  "data": {
    "uuid": "123e4567-e89b-12d3-a456-426614174000",
    "url": "https://example.com/page",
    "result": "https://storage.example.com/results/page.json",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 6. List Crawl Results

```http
GET /api/v1/core/crawl-requests/{crawl_request_uuid}/results/
```

Retrieve the results of a specific crawl request with pagination.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| crawl_request_uuid | string | Yes | UUID of the crawl request |
| page | integer | No | Page number for pagination |

#### Response

```json
{
  "count": 123,
  "next": "http://api.example.org/crawl-requests/{id}/results/?page=4",
  "previous": "http://api.example.org/crawl-requests/{id}/results/?page=2",
  "results": [
    {
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "url": "https://example.com/page",
      "result": "https://storage.example.com/results/page.json",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 7. Download Crawl Result

```http
GET /api/v1/core/crawl-requests/{id}/download/
```

Download the complete results of a crawl request.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | UUID of the crawl request |

## Status Values

| Status | Description |
|--------|-------------|
| new | Crawl request is created but not started |
| running | Crawl is in progress |
| finished | Crawl completed successfully |
| cancelling | Crawl is in the process of being cancelled |
| canceled | Crawl was cancelled by the user |
| failed | Crawl encountered an error and failed |

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "message": "Invalid input data.",
  "errors": {
    "url": ["Invalid URL format."],
    "options": ["Invalid options configuration."],
    "non_field_errors": ["General validation error."]
  },
  "code": 400
}
```

### 500 Internal Server Error

```json
{
  "message": "An unexpected error occurred.",
  "errors": null,
  "code": 500
}
```

## Best Practices

1. **Rate Limiting**: Implement appropriate rate limiting in your client applications to avoid overwhelming the target websites.
2. **Resource Management**: Use the `page_limit` and `max_depth` options to control the scope of your crawls.
3. **Error Handling**: Always check the status of your crawl requests and implement proper error handling.
4. **Content Extraction**: Use `exclude_tags` and `include_tags` to precisely target the content you need.
5. **Domain Restrictions**: Use `allowed_domains` to prevent the crawler from accessing unintended domains.
6. **Ignore Rendering**: Use `ignore_rendering` to prevent the crawler from rendering a JS-heavy page.

