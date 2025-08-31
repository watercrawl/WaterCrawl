import gzip
from typing import Iterable
import re
from urllib.parse import urlparse, urljoin

from lxml import etree
from scrapy import Request, Spider, signals

from core.services import SitemapRequestService, BasePubSupService
from spider import settings
from spider.items import SitemapResult


class SitemapScrapper(Spider):
    name = "SitemapScrapper"
    allowed_domains = []

    custom_settings = {
        "ROBOTSTXT_OBEY": False,
        "DOWNLOAD_DELAY": 0,
        "DOWNLOAD_TIMEOUT": 10,
        "RETRY_ENABLED": False,
        "CONCURRENT_REQUESTS": 10,
        "CONCURRENT_REQUESTS_PER_DOMAIN": 10,
        "CONCURRENT_REQUESTS_PER_IP": 10,
        "USER_AGENT": "WaterCrawlBot/1.0 (+http://www.watercrawl.dev/bot)",
        "PAGE_LIMIT": settings.SITEMAP_CRAWL_PAGE_LIMIT,
        "HTTPCACHE_ENABLED": True,
        "HTTPCACHE_EXPIRATION_SECS": 86400,  # 1 day,
        "MAX_REQUESTS": settings.SITEMAP_CRAWL_PAGE_LIMIT,
    }

    def __init__(self, sitemap_request_uuid, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.sitemap_request_service: SitemapRequestService = (
            SitemapRequestService.make_with_pk(sitemap_request_uuid)
        )
        self.helpers = self.sitemap_request_service.config_helpers
        self.pubsub_service: BasePubSupService = (
            self.sitemap_request_service.pubsub_service
        )
        self.plugin_validators = {}
        self.results = list()
        self.visited_urls = set()
        self.visited_sitemaps = set()
        self.patterns = set()
        # Minimum links threshold required to consider a page as valuable
        self.link_threshold = 5
        # Import settings
        self.max_urls = settings.MAX_NUMBER_OF_SITEMAP_URLS
        self.stopping = False
        # Queue for sequential sitemap processing
        self.sitemap_queue = []
        self.processing_sitemap = False
        self.init_plugins()

    @classmethod
    def from_crawler(cls, crawler, *args, **kwargs):
        spider = super().from_crawler(crawler, *args, **kwargs)
        crawler.signals.connect(spider.spider_closed, signal=signals.spider_closed)
        return spider

    def spider_closed(self, spider, reason):
        # This will be called automatically when the spider is about to close
        # The yielded item will be processed by the pipelines
        self.pubsub_service.send_feed(
            f"Sitemap crawl completed with {len(self.results)} URL(s). Stopped due to: {reason}.",
            feed_type="info",
        )
        self.crawler.engine.scraper.itemproc.process_item(
            SitemapResult(result=self.results),
            spider,
        )

    def init_plugins(self):
        for plugin in settings.PLUGINS:
            # todo: define how we want to use plugins in sitemap
            self.plugin_validators[plugin.plugin_key()] = None

    def append_result(self, url, searched=False):
        if not self.helpers.is_allowed_domain(url):
            self.log(f"Skipping URL not in allowed domain: {url}")
            return False

        if not self.helpers.is_allowed_path(url):
            self.log(f"Skipping URL not in allowed path: {url}")
            return False

        if not searched and not self.helpers.is_allowed_search(url):
            self.log(f"Skipping URL not in allowed with search query: {url}")
            return False

        if not self.stopping and len(self.results) + 1 >= self.max_urls:
            self.log(
                f"Reached maximum number of URLs ({self.max_urls}). Stopping crawler."
            )
            self.pubsub_service.send_feed(
                f"Reached maximum number of URLs ({self.max_urls}). Stopping crawler.",
                feed_type="warning",
            )
            self.stopping = True
            # Close the spider gracefully
            self.crawler.engine.close_spider(self, "max_urls_reached")

        if url not in self.results:
            self.results.append(url)

            return True

        return False

    def start_requests(self) -> Iterable[Request]:
        # First check if robots.txt exists
        robots_url = urljoin(self.helpers.base_url, "/robots.txt")
        self.pubsub_service.send_feed("Checking robots.txt for sitemaps...")

        if self.helpers.ignore_sitemap_xml:
            yield from self.crawl_website()
        else:
            yield Request(
                url=robots_url,
                callback=self.parse_robots_txt,
                errback=self.robots_txt_not_found,
                meta={"skip_playwright": True, "original_url": self.helpers.base_url},
            )

    ############
    # Sitemap Processing
    ############
    def parse_robots_txt(self, response):
        """Parse robots.txt to find sitemaps"""
        robots_txt = response.text
        site_map_found = False

        self.pubsub_service.send_feed(
            "Found sitemaps in robots.txt, starting processing..."
        )
        # Extract sitemap URLs from robots.txt
        for line in robots_txt.splitlines():
            if line.lower().startswith("sitemap:"):
                site_map_found = True
                sitemap_url = line.split(":", 1)[1].strip()
                self.log(f"Found sitemap URL in robots.txt: {sitemap_url}")
                yield from self.add_to_sitemap_queue(sitemap_url)

        if not site_map_found:
            # Try common sitemap locations
            self.log(
                "No sitemaps found in robots.txt, trying common sitemap locations..."
            )
            yield from self.try_common_sitemaps()

    def try_common_sitemaps(self):
        """Try common sitemap paths if none found in robots.txt"""
        common_paths = ["/sitemap.xml", "/sitemap_index.xml"]
        self.pubsub_service.send_feed(
            "No sitemaps found in robots.txt, trying common sitemap locations...",
            feed_type="warning",
        )

        for path in common_paths:
            sitemap_url = urljoin(self.helpers.base_url, path)
            if sitemap_url not in self.visited_sitemaps:
                yield from self.add_to_sitemap_queue(sitemap_url)

    def robots_txt_not_found(self, failure):
        """Callback when robots.txt is not found"""
        # Try common sitemap locations instead
        yield from self.try_common_sitemaps()

    def check_next_sitemap(self):
        """Process the next sitemap in the queue"""
        if self.stopping:
            return

        if not self.sitemap_queue:
            self.log("No more sitemaps to process.")
            self.processing_sitemap = False
            if not self.results:
                self.log(
                    "No URLs found in any sitemap. Falling back to website crawling."
                )
                self.pubsub_service.send_feed(
                    "No URLs found in sitemaps, crawling the website instead.",
                    feed_type="warning",
                )
                yield from self.crawl_website()
            return

        self.processing_sitemap = True
        next_sitemap = self.sitemap_queue.pop(0)
        self.log(f"Processing next sitemap in queue: {next_sitemap}")
        self.pubsub_service.send_feed(f"fetching next sitemap in queue: {next_sitemap}")
        yield Request(
            url=next_sitemap,
            callback=self.parse_sitemap,
            errback=self.handle_sitemap_error,
            meta={"skip_playwright": True},
        )

    def handle_sitemap_error(self, failure):
        """Handle errors during sitemap processing"""
        self.log(f"Error processing sitemap: {failure.value}")
        # Continue with the next sitemap
        yield from self.check_next_sitemap()

    def add_to_sitemap_queue(self, sitemap_url):
        """Add a sitemap URL to the processing queue"""
        if sitemap_url not in self.visited_sitemaps:
            self.visited_sitemaps.add(sitemap_url)
            self.sitemap_queue.append(sitemap_url)

            # If we're not currently processing a sitemap, start processing
            if not self.processing_sitemap:
                return self.check_next_sitemap()
        return []

    def parse_sitemap(self, response):
        """Parse sitemap XML or gzipped XML and extract <loc> URLs using XPath (Scrapy-style)"""
        self.log(f"Parsing sitemap: {response.url}")
        content = response.body
        content_type = (
            response.headers.get("Content-Type", b"").decode("utf-8", "ignore").lower()
        )

        # Handle gzipped content
        if (
            response.url.endswith(".gz")
            or "application/x-gzip" in content_type
            or "application/gzip" in content_type
        ):
            try:
                self.log(
                    f"Detected gzipped sitemap at {response.url}, decompressing..."
                )
                content = gzip.decompress(content)
            except Exception as e:
                self.log(f"Failed to decompress gzipped sitemap: {str(e)}")
                yield from self.check_next_sitemap()
                return

        try:
            # Parse XML using lxml
            tree = etree.fromstring(content)

            # Handle namespaces (default -> 'sm')
            nsmap = tree.nsmap.copy()
            if None in nsmap:
                nsmap["sm"] = nsmap.pop(None)

            # Check for sitemap index
            sitemap_locs = tree.xpath("//sm:sitemap/sm:loc/text()", namespaces=nsmap)
            if sitemap_locs:
                for loc in sitemap_locs:
                    nested_sitemap_url = loc.strip()
                    self.log(f"Found nested sitemap: {nested_sitemap_url}")
                    yield from self.add_to_sitemap_queue(nested_sitemap_url)
            else:
                # Regular sitemap: extract URLs
                urls_found = 0
                page_urls = tree.xpath("//sm:url/sm:loc/text()", namespaces=nsmap)
                for loc in page_urls:
                    if loc.endswith(".xml"):
                        self.log(f"Found nested sitemap: {loc}")
                        yield from self.add_to_sitemap_queue(loc)
                        continue
                    page_url = loc.strip()
                    normalized_url = self.normalize_url(page_url)
                    if self.append_result(normalized_url):
                        urls_found += 1
                self.log(f"Extracted {urls_found} URLs from sitemap {response.url}")

        except Exception as e:
            self.log(f"Error parsing sitemap {response.url}: {str(e)}")

        # Process the next sitemap
        yield from self.check_next_sitemap()

    ############
    # Fallback Crawling
    ############
    def crawl_website(self, failure=None):
        """Callback when sitemap is not found at common locations"""
        # If sitemap not found, try crawling the website
        requested_url = self.sitemap_request_service.sitemap.url
        self.pubsub_service.send_feed(
            f"Starting website crawl from URL: {requested_url}", feed_type="info"
        )
        yield Request(
            url=requested_url,
            callback=self.parse_html,
            errback=self.try_site_search,
            meta={"skip_playwright": True, "depth": 0},
        )

    def parse_html(self, response):
        current_depth = response.meta.get("depth", 0)

        self.pubsub_service.send_feed(f"Parsing HTML content for url:{response.url}")
        links = response.css("a::attr(href)").getall()
        discovered_links = []
        new_patterns = set()
        for link in links:
            absolute_url = response.urljoin(link)

            if not self.helpers.is_allowed_domain(absolute_url):
                self.log(f"Skipping link not in allowed domain: {absolute_url}")
                continue
            if not self.helpers.is_allowed_path(absolute_url):
                self.log(f"Skipping link not in allowed path: {absolute_url}")
                continue

            clean_url = self.normalize_url(absolute_url)

            if clean_url in self.visited_urls:
                self.log(f"Skipping already visited URL: {clean_url}")
                continue  # Skip already seen

            self.append_result(clean_url)
            pattern = self.extract_pattern(clean_url)

            if pattern not in self.patterns:
                self.patterns.add(pattern)
                new_patterns.add(pattern)
                # store result
                discovered_links.append((clean_url, pattern))

        self.visited_urls.update([url for url, _ in discovered_links])

        if current_depth < 5:
            for url, pattern in discovered_links[
                :10
            ]:  # Only follow top 10 new patterns
                yield Request(
                    url=url,
                    callback=self.parse_html,
                    meta={"depth": current_depth + 1, "skip_playwright": True},
                )

    @classmethod
    def normalize_url(cls, url):
        """Normalize URL by stripping fragments, query params, and trailing slashes."""
        return url.split("#")[0].split("?")[0].rstrip("/")

    @classmethod
    def extract_pattern(cls, url):
        """Extract general URL pattern from a path."""
        path = urlparse(url).path.strip("/")
        parts = path.split("/")
        pattern_parts = []
        for part in parts:
            if re.match(r"^\d+$", part):
                pattern_parts.append("<num>")
            elif re.match(r"^[a-f0-9]{8,}$", part):
                pattern_parts.append("<hash>")
            else:
                pattern_parts.append(part)
        return "/" + "/".join(pattern_parts)

    ############
    # Google Search
    ############
    def try_site_search(self, failure=None):
        """Use site: search as a fallback method"""
        # Create a search query with site: operator
        self.log(f"Using site: search fallback with query: {self.helpers.search_query}")
        self.pubsub_service.send_feed(
            f"Using site: search fallback with query: {self.helpers.search_query}",
            feed_type="warning",
        )

        # Make the first request to the Google Custom Search API
        search_url = self.make_google_search_url(self.helpers.search_query)
        yield Request(
            url=search_url,
            callback=lambda response: self.parse_google_search(response, 1),
            meta={"skip_playwright": True},
        )

    @classmethod
    def make_google_search_url(cls, query, start=1):
        """Create a Google search URL with the site: operator"""
        from spider import settings

        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": settings.GOOGLE_API_KEY,
            "cx": settings.GOOGLE_CSE_ID,
            "q": query,
            "start": start,
        }

        return f"{url}?{'&'.join([f'{key}={value}' for key, value in params.items() if value])}"

    def parse_google_search(self, response, page_num=1):
        """Parse Google search results and extract URLs"""
        self.pubsub_service.send_feed(f"Parsing search results for page: {page_num}")
        try:
            data = response.json()

            # Extract URLs from the current page
            if "items" in data:
                for item in data["items"]:
                    url = item["link"]
                    if self.append_result(url, searched=True):
                        self.log(f"Site search found URL: {url}")

            # Request the next page if we haven't reached page 10 yet
            if page_num < 5 and "queries" in data and "nextPage" in data["queries"]:
                next_page = page_num + 1
                start_index = data["queries"]["nextPage"][0]["startIndex"]

                # Get the search query from the current request
                current_params = dict(
                    item.split("=") for item in response.url.split("?")[1].split("&")
                )
                query = current_params.get("q", self.helpers.search_query)

                # Create the URL for the next page
                search_url = self.make_google_search_url(query, start_index)

                yield Request(
                    url=search_url,
                    callback=lambda resp: self.parse_google_search(resp, next_page),
                    meta={"skip_playwright": True},
                )

        except Exception as e:
            self.log(f"Error parsing Google search results: {str(e)}")
