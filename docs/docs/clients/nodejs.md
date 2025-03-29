# Node.js Client

A TypeScript/Node.js client library for the WaterCrawl API. This client provides a simple and intuitive way to interact with WaterCrawl's web crawling service.

[![Test](https://github.com/watercrawl/watercrawl-nodejs/actions/workflows/test.yml/badge.svg)](https://github.com/watercrawl/watercrawl-nodejs/actions/workflows/test.yml)
[![npm version](https://badge.fury.io/js/@watercrawl%2Fnodejs.svg)](https://badge.fury.io/js/@watercrawl%2Fnodejs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- Full API coverage for WaterCrawl endpoints
- Written in TypeScript with complete type definitions
- Support for both synchronous and asynchronous crawling
- Real-time crawl monitoring with event streaming
- Automatic result downloading and processing
- Promise-based API with async/await support
- Comprehensive error handling
- ESLint and Prettier configured for code quality
- Built with ES Modules
- Continuous Integration with GitHub Actions
- Automated npm publishing with version tags

## Installation

```bash
npm install @watercrawl/nodejs
```

## Quick Start

```typescript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';

// Initialize the client with your API key
const client = new WaterCrawlAPIClient('your-api-key');

// Simple synchronous crawling
const result = await client.scrapeUrl('https://watercrawl.dev');
console.log(result);

// Asynchronous crawling with monitoring
const request = await client.scrapeUrl('https://watercrawl.dev', {}, {}, false);
for await (const event of client.monitorCrawlRequest(request.uuid)) {
    console.log('Event:', event);
}
```

## API Reference

### Types

```typescript
interface CrawlRequest {
    uuid: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
    created_at: string;
    updated_at: string;
}

interface CrawlResult {
    uuid: string;
    url: string;
    data: Record<string, any>;
    metadata: Record<string, any>;
}

interface PageOptions {
    wait_for_selector?: string;
    screenshot?: boolean;
    viewport?: {
        width: number;
        height: number;
    };
}

interface PluginOptions {
    extract_links?: boolean;
    extract_text?: boolean;
    custom_js?: string;
}

interface CrawlEvent {
    type: 'status' | 'result' | 'error';
    data: any;
}
```

### Constructor

```typescript
class WaterCrawlAPIClient {
    constructor(apiKey: string, baseUrl?: string);
}
```

### Methods

#### Crawl Requests

```typescript
// Create a new crawl request
async createCrawlRequest(
    url: string,
    spiderOptions?: Record<string, any>,
    pageOptions?: PageOptions,
    pluginOptions?: PluginOptions
): Promise<CrawlRequest>;

// List all crawl requests
async getCrawlRequestsList(
    page?: number,
    pageSize?: number
): Promise<{ results: CrawlRequest[] }>;

// Get a specific crawl request
async getCrawlRequest(itemId: string): Promise<CrawlRequest>;

// Stop a crawl request
async stopCrawlRequest(itemId: string): Promise<null>;

// Download crawl request results
async downloadCrawlRequest(itemId: string): Promise<CrawlResult[]>;
```

#### Monitoring and Results

```typescript
// Monitor crawl progress in real-time
async *monitorCrawlRequest(
    itemId: string,
    download?: boolean
): AsyncGenerator<CrawlEvent, void, unknown>;

// Get results for a crawl request
async getCrawlRequestResults(
    itemId: string
): Promise<{ results: CrawlResult[] }>;

// Download a specific result
async downloadResult(resultObject: CrawlResult): Promise<Record<string, any>>;
```

#### Simplified Crawling

```typescript
// Synchronous crawling (waits for result)
async scrapeUrl(
    url: string,
    pageOptions?: PageOptions,
    pluginOptions?: PluginOptions,
    sync?: true,
    download?: true
): Promise<Record<string, any>>;

// Asynchronous crawling (returns immediately)
async scrapeUrl(
    url: string,
    pageOptions?: PageOptions,
    pluginOptions?: PluginOptions,
    sync: false
): Promise<CrawlRequest>;
```

## Examples

### Basic Crawling

```typescript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';
import type { CrawlResult } from '@watercrawl/nodejs';

const client = new WaterCrawlAPIClient('your-api-key');

// Simple crawl
const result = await client.scrapeUrl('https://watercrawl.dev');
console.log('Crawl result:', result);
```

### Advanced Crawling with Options

```typescript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';
import type { PageOptions, PluginOptions } from '@watercrawl/nodejs';

const client = new WaterCrawlAPIClient('your-api-key');

// Crawl with custom options
const pageOptions: PageOptions = {
    wait_for_selector: '.content',
    screenshot: true,
    viewport: {
        width: 1920,
        height: 1080
    }
};

const pluginOptions: PluginOptions = {
    extract_links: true,
    extract_text: true,
    custom_js: `
        // Custom JavaScript to run on the page
        return {
            title: document.title,
            metaDescription: document.querySelector('meta[name="description"]')?.content
        };
    `
};

const result = await client.scrapeUrl('https://watercrawl.dev', pageOptions, pluginOptions);
```

### Asynchronous Crawling with Progress Monitoring

```typescript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';
import type { CrawlEvent } from '@watercrawl/nodejs';

const client = new WaterCrawlAPIClient('your-api-key');

// Start crawl asynchronously
const request = await client.scrapeUrl('https://watercrawl.dev', {}, {}, false);

// Monitor progress
for await (const event of client.monitorCrawlRequest(request.uuid)) {
    switch (event.type) {
        case 'status':
            console.log('Status update:', event.data);
            break;
        case 'result':
            console.log('Got result:', event.data);
            break;
        case 'error':
            console.error('Error:', event.data);
            break;
    }
}
```

### Managing Multiple Crawls

```typescript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';
import type { CrawlRequest, CrawlResult } from '@watercrawl/nodejs';

const client = new WaterCrawlAPIClient('your-api-key');

// List all crawl requests
const { results: requests } = await client.getCrawlRequestsList();
console.log('All requests:', requests);

// Get specific request details
const request: CrawlRequest = await client.getCrawlRequest(requests[0].uuid);
console.log('Request details:', request);

// Stop a crawl
await client.stopCrawlRequest(request.uuid);

// Download results
const { results } = await client.getCrawlRequestResults(request.uuid);
console.log('Results:', results);
```

## Error Handling

The client includes comprehensive error handling with TypeScript support:

```typescript
import { WaterCrawlAPIClient } from '@watercrawl/nodejs';
import type { APIError } from '@watercrawl/nodejs';

try {
    const result = await client.scrapeUrl('https://watercrawl.dev');
} catch (error) {
    if ((error as APIError).response) {
        // API error with response
        console.error('API Error:', (error as APIError).response.data);
    } else {
        // Network or other error
        console.error('Error:', error.message);
    }
}
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Copy example environment file
cp .env.example .env

# Add your API key to .env
echo "WATERCRAWL_API_KEY=your-api-key" > .env
```

### Available Scripts

```bash
# Build the project
npm run build

# Run tests
npm test

# Lint the code
npm run lint

# Format the code
npm run format

# Prepare for publishing
npm run prepare
```

### Continuous Integration

This project uses GitHub Actions for continuous integration and deployment:

- **Testing**: All pushes to `main` and pull requests are automatically tested against Node.js versions 16, 18, and 20.
- **Publishing**: When a version tag (e.g., `v1.0.0`) is pushed, the package is automatically:
  1. Built and tested
  2. Version number is validated
  3. Published to npm
  4. A GitHub release is created

### Publishing a New Version

To publish a new version:

1. Update the version in `package.json`:
   ```bash
   npm version patch  # or minor, or major
   ```

2. Push the changes and the new tag:
   ```bash
   git push && git push --tags
   ```

3. The GitHub Action will automatically:
   - Run all tests
   - Publish to npm if tests pass
   - Create a GitHub release

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.