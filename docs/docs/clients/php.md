# PHP Client

[![Latest Version on Packagist](https://img.shields.io/packagist/v/watercrawl/php.svg?style=flat-square)](https://packagist.org/packages/watercrawl/php)
[![Build Status](https://img.shields.io/github/actions/workflow/status/watercrawl/watercrawl-php/release.yml?branch=main&style=flat-square)](https://github.com/watercrawl/watercrawl-php/actions?query=workflow%3ARelease)
[![PHP Version Support](https://img.shields.io/packagist/php-v/watercrawl/php?style=flat-square)](https://packagist.org/packages/watercrawl/php)
[![Total Downloads](https://img.shields.io/packagist/dt/watercrawl/php.svg?style=flat-square)](https://packagist.org/packages/watercrawl/php)
[![License](https://img.shields.io/packagist/l/watercrawl/php.svg?style=flat-square)](https://packagist.org/packages/watercrawl/php)

PHP Client for WaterCrawl REST APIs. This package provides a simple and elegant way to interact with WaterCrawl's web scraping and crawling services.

## Installation

You can install the package via composer:

```bash
composer require watercrawl/php
```

## Requirements

- PHP 7.4 or higher
- `ext-mbstring`
- `ext-json`

## Usage

```php
use WaterCrawl\APIClient;

// Initialize the client
$client = new APIClient('your-api-key');

// Scrape a single URL
$result = $client->scrapeUrl('https://example.com');

// Create a crawl request
$result = $client->createCrawlRequest(
    'https://example.com',
    ['allowed_domains' => ['example.com']],
    ['wait_time' => 1000]
);

// Monitor crawl progress
foreach ($client->monitorCrawlRequest($result['uuid']) as $update) {
    if ($update['type'] === 'result') {
        // Process the result
        print_r($update['data']);
    }
}
```

## API Examples

### Crawling Operations

#### List all crawl requests

```php
// Get the first page of requests (default page size: 10)
$requests = $client->getCrawlRequestsList();

// Specify page number and size
$requests = $client->getCrawlRequestsList(2, 20);
```

#### Get a specific crawl request

```php
$request = $client->getCrawlRequest('request-uuid');
```

#### Create a crawl request

```php
// Simple request with just a URL
$request = $client->createCrawlRequest('https://example.com');

// Advanced request with options
$request = $client->createCrawlRequest(
    'https://example.com',
    [
        'max_depth' => 1, // maximum depth to crawl
        'page_limit' => 1, // maximum number of pages to crawl
        'allowed_domains' => [], // allowed domains to crawl
        'exclude_paths' => [], // exclude paths
        'include_paths' => [] // include paths
    ],
    [
        'exclude_tags' => [], // exclude tags from the page
        'include_tags' => [], // include tags from the page
        'wait_time' => 1000, // wait time in milliseconds after page load
        'include_html' => false, // the result will include HTML
        'only_main_content' => true, // only main content of the page
        'include_links' => false, // if true the result will include links
        'timeout' => 15000, // timeout in milliseconds
        'accept_cookies_selector' => null, // accept cookies selector
        'locale' => "en-US", // locale
        'extra_headers' => [], // extra headers
        'actions' => [] // actions to perform
    ],
    [] // plugin options
);
```

#### Stop a crawl request

```php
$client->stopCrawlRequest('request-uuid');
```

#### Download a crawl request result

```php
// Download the crawl request results
$results = $client->downloadCrawlRequest('request-uuid');
```

#### Monitor a crawl request

```php
// Monitor with automatic result download (default)
foreach ($client->monitorCrawlRequest('request-uuid') as $event) {
    if ($event['type'] === 'state') {
        echo "Crawl state: {$event['data']['status']}\n";
    } elseif ($event['type'] === 'result') {
        echo "Received result for: {$event['data']['url']}\n";
    }
}

// Monitor without downloading results
foreach ($client->monitorCrawlRequest('request-uuid', false) as $event) {
    echo "Event type: {$event['type']}\n";
}
```

#### Get crawl request results

```php
// Get the first page of results
$results = $client->getCrawlRequestResults('request-uuid');

// Specify page number and size
$results = $client->getCrawlRequestResults('request-uuid', 2, 20);
```

#### Quick URL scraping

```php
// Synchronous scraping (default)
$result = $client->scrapeUrl('https://example.com');

// With page options
$result = $client->scrapeUrl(
    'https://example.com',
    [
        'wait_time' => 1000,
        'only_main_content' => true
    ]
);

// Asynchronous scraping
$request = $client->scrapeUrl('https://example.com', [], [], false);
// Later check for results with getCrawlRequest
```

### Sitemap Operations

#### Download a sitemap

```php
// Download using a crawl request object
$crawlRequest = $client->getCrawlRequest('request-uuid');
$sitemap = $client->downloadSitemap($crawlRequest);

// Or download using just the UUID
$sitemap = $client->downloadSitemap('request-uuid');

// Process sitemap entries
foreach ($sitemap as $entry) {
    echo "URL: {$entry['url']}, Title: {$entry['title']}\n";
}
```

#### Download sitemap as graph data

```php
// You need to provide crawl request uuid or crawl request object
$graphData = $client->downloadSitemapGraph('request-uuid');
```

#### Download sitemap as markdown

```php
// You need to provide crawl request uuid or crawl request object
$markdown = $client->downloadSitemapMarkdown('request-uuid');

// Save to a file
file_put_contents('sitemap.md', $markdown);
```

### Search Operations

#### Get search requests list

```php
// Get the first page of search requests
$searchRequests = $client->getSearchRequestsList();

// Specify page number and size
$searchRequests = $client->getSearchRequestsList(2, 20);
```

#### Create a search request

```php
// Simple search with synchronous results
$results = $client->createSearchRequest('php programming');

// Search with options and limited results
$results = $client->createSearchRequest(
    'php tutorial',
    [
        'language' => null, // language code e.g. "en" or "fr"
        'country' => null, // country code e.g. "us" or "fr"
        'time_range' => 'any', // time range e.g. "any", "hour", "day", "week", "month", "year"
        'search_type' => 'web', // search type e.g. "web"
        'depth' => 'basic' // depth e.g. "basic", "advanced", "ultimate"
    ],
    5, // limit the number of results
    true, // wait for results
    true // download results
);

// Asynchronous search
$searchRequest = $client->createSearchRequest(
    'machine learning',
    [], // search options
    5, // limit the number of results
    false, // Don't wait for results
    false // Don't download results
);
```

#### Monitor a search request

```php
// Monitor a search request
foreach ($client->monitorSearchRequest('search-uuid') as $event) {
    if ($event['type'] === 'state') {
        echo "Search state: {$event['status']}\n";
    }
}

// Monitor without downloading results
foreach ($client->monitorSearchRequest('search-uuid', false) as $event) {
    echo "Event: " . json_encode($event) . "\n";
}
```

#### Get a search request

```php
$searchRequest = $client->getSearchRequest('search-uuid');
```

#### Stop a search request

```php
$client->stopSearchRequest('search-uuid');
```

## Features

- Simple and intuitive API
- Real-time crawl monitoring
- Configurable scraping options
- Automatic response handling
- Support for sitemaps and search operations
- PHP 7.4+ compatibility
- Proper UTF-8 support

## Testing

```bash
composer test
```

## Compatibility

- WaterCrawl API >= 0.7.1

## Changelog

Please see [CHANGELOG.md](https://github.com/watercrawl/watercrawl-php/blob/main/CHANGELOG.md) for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING.md](https://github.com/watercrawl/watercrawl-php/blob/main/CONTRIBUTING.md) for details.

## Security

If you discover any security related issues, please email security@watercrawl.dev instead of using the issue tracker.

## License

The MIT License (MIT). Please see [License File](https://github.com/watercrawl/watercrawl-php/blob/main/LICENSE) for more information.
