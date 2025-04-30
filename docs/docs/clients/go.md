# Go Client

A Go client library for the WaterCrawl API. This client provides a simple and intuitive way to interact with WaterCrawl's web crawling service.

## Installation

```bash
go get github.com/watercrawl/watercrawl-go
```

## Usage

### Initialize the client

```go
import "github.com/watercrawl/watercrawl-go"

client := watercrawl.NewClient("your-api-key", "")  // Empty string uses default base URL
```

### Create a crawl request

```go
ctx := context.Background()
input := watercrawl.CreateCrawlRequestInput{
    URL: "https://example.com",
    Options: watercrawl.CrawlOptions{
        SpiderOptions: map[string]interface{}{
            "allowed_domains": []string{"example.com"},
        },
        PageOptions: map[string]interface{}{
            "wait_x": "#content",
        },
        PluginOptions: map[string]interface{}{
        },
    },
}

result, err := client.CreateCrawlRequest(ctx, input)
if err != nil {
    log.Fatal(err)
}
```

### Monitor a crawl request

```go
events, err := client.MonitorCrawlRequest(ctx, result.UUID, true)
if err != nil {
    log.Fatal(err)
}

for event := range events {
    switch event.Type {
    case "progress":
        fmt.Printf("Progress: %v\n", event.Data)
    case "result":
        fmt.Printf("Result: %v\n", event.Data)
    }
}
```

### Quick URL scraping

```go
pageOptions := map[string]interface{}{
    "wait_for": "#content",
}
pluginOptions := map[string]interface{}{
    "extract_links": true,
}

// Synchronous scraping with automatic download
result, err := client.ScrapeURL(ctx, "https://example.com", pageOptions, pluginOptions, true, true)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Scraped data: %v\n", result)
```

### List crawl requests

```go
list, err := client.GetCrawlRequests(ctx, 1, 10)  // Page 1, 10 items per page
if err != nil {
    log.Fatal(err)
}

for _, request := range list.Results {
    fmt.Printf("Request %s: %s\n", request.UUID, request.Status)
}
```

### Get crawl request details

```go
request, err := client.GetCrawlRequest(ctx, "request-uuid")
if err != nil {
    log.Fatal(err)
}
```

### Stop a crawl request

```go
err := client.StopCrawlRequest(ctx, "request-uuid")
if err != nil {
    log.Fatal(err)
}
```

### Download crawl results

```go
results, err := client.DownloadCrawlRequest(ctx, "request-uuid")
if err != nil {
    log.Fatal(err)
}
```

### Get crawl request results

```go
results, err := client.GetCrawlRequestResults(ctx, "request-uuid", 1, 10)
if err != nil {
    log.Fatal(err)
}

for _, result := range results.Results {
    fmt.Printf("Result for URL %s: %v\n", result.URL, result.Data)
}
```

## Error Handling

The SDK uses standard Go error handling patterns. All methods that can fail return an error as their last return value. You should always check these errors before using the returned values.

## Contributing

Please see [CONTRIBUTING.md](https://github.com/watercrawl/watercrawl-go/blob/main/CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/watercrawl/watercrawl-go/blob/main/LICENSE) file for details. 