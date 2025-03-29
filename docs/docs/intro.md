---
sidebar_position: 1
---

# Introduction to WaterCrawl

WaterCrawl is a powerful, modern web crawling and content extraction platform designed for scalability, flexibility, and ease of use. Whether you're building a search engine, conducting market research, or gathering data for analysis, WaterCrawl provides the tools you need to efficiently crawl and process web content.

## Key Features

### 1. Intelligent Crawling
- **Smart Navigation**: Automatically follows relevant links while respecting site structure
- **Depth Control**: Configure crawl depth and page limits to manage scope
- **Domain Management**: Restrict crawling to specific domains and paths
- **Rate Limiting**: Built-in rate limiting to be respectful to target websites

### 2. Advanced Content Extraction
- **Selective Parsing**: Target specific HTML elements while excluding irrelevant content
- **Multiple Formats**: Extract content in various formats (HTML, plain text)
- **Custom Selectors**: Fine-tune content extraction using tags and selectors
- **Link Extraction**: Option to include or exclude hyperlinks in extracted content

### 3. Real-time Monitoring
- **Live Status Updates**: Monitor crawl progress in real-time using Server-Sent Events
- **Detailed Statistics**: Track number of pages crawled, success rates, and more
- **Error Reporting**: Comprehensive error reporting and status tracking
- **Event Streaming**: Real-time updates on newly crawled pages

### 4. Developer-Friendly
- **RESTful API**: Clean and well-documented REST API
- **Python Client**: Official Python client library for easy integration
- **Authentication**: Secure JWT-based authentication
- **Webhook Support**: Get notified of crawl events via webhooks

## Getting Started

### 1. Installation

```bash
pip install watercrawl-py
```

### 2. Quick Start

```python
from watercrawl import WaterCrawlAPIClient

# Initialize client
client = WaterCrawlAPIClient('your_api_key')

# Start a simple crawl
result = client.scrape_url(
    url="https://example.com",
    page_options={
        "exclude_tags": ["nav", "footer"],
        "include_tags": ["article", "main"],
        "only_main_content": True
    }
)
```

### 3. Documentation Structure

- [API Reference](./api/documentation): Comprehensive API documentation
- [Python Client](./clients/python): Python client library usage and examples
- [Authentication](./api/overview#authentication): Authentication and security details

## Use Cases

### Content Aggregation
Build content aggregators or news feeds by crawling multiple sources and extracting relevant content.

### Data Analysis
Gather web data for market research, sentiment analysis, or trend tracking.

### Search Engines
Create specialized search engines by crawling and indexing content from specific domains.

### Monitoring
Track changes on websites by regularly crawling and comparing content.

## Best Practices

1. **Respect Robots.txt**
   - Always check and respect the target site's robots.txt
   - Implement appropriate crawl delays

2. **Resource Management**
   - Use pagination and crawl limits
   - Implement proper error handling
   - Monitor resource usage

3. **Content Targeting**
   - Use specific selectors to target relevant content
   - Exclude unnecessary elements to reduce noise
   - Validate extracted content

4. **Performance Optimization**
   - Implement caching when appropriate
   - Use asynchronous crawling for better performance
   - Monitor and adjust crawl rates

## Support and Community

- [GitHub Repository](https://github.com/watercrawl/watercrawl)
- [Issue Tracker](https://github.com/watercrawl/watercrawl/issues)
- [Discord Community](https://discord.gg/watercrawl)
- [Stack Overflow Tag](https://stackoverflow.com/questions/tagged/watercrawl)

## License

WaterCrawl is released under a modified MIT License with additional terms. While the software is open source and can be freely used, modified, and distributed, there are some important conditions:

1. The code must retain the original copyright notice
2. Commercial use as a service similar to watercrawl.dev requires explicit permission
3. Community contributions and modifications for non-commercial use are welcome

See the [LICENSE](https://github.com/watercrawl/watercrawl/blob/main/LICENSE) file for the complete terms.
