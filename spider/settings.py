import os
import sys
import django
from django.conf import settings

sys.path.append(os.path.dirname(os.path.abspath('.')))
os.environ['DJANGO_SETTINGS_MODULE'] = 'watercrawl.settings'
django.setup()

# Scrapy settings for spider project
#
# For simplicity, this file contains only settings considered important or
# commonly used. You can find more settings consulting the documentation:
#
#     https://docs.scrapy.org/en/latest/topics/settings.html
#     https://docs.scrapy.org/en/latest/topics/downloader-middleware.html
#     https://docs.scrapy.org/en/latest/topics/spider-middleware.html

BOT_NAME = "spider"

SPIDER_MODULES = ["spider.spiders"]
NEWSPIDER_MODULE = "spider.spiders"

# Crawl responsibly by identifying yourself (and your website) on the user-agent
USER_AGENT = settings.SCRAPY_USER_AGENT

# Obey robots.txt rules
ROBOTSTXT_OBEY = settings.SCRAPY_ROBOTSTXT_OBEY

# Configure maximum concurrent requests performed by Scrapy (default: 16)
CONCURRENT_REQUESTS = settings.SCRAPY_CONCURRENT_REQUESTS

# Configure a delay for requests for the same website (default: 0)
# See https://docs.scrapy.org/en/latest/topics/settings.html#download-delay
# See also autothrottle settings and docs
DOWNLOAD_DELAY = settings.SCRAPY_DOWNLOAD_DELAY
# The download delay setting will honor only one of:
CONCURRENT_REQUESTS_PER_DOMAIN = settings.SCRAPY_CONCURRENT_REQUESTS_PER_DOMAIN
CONCURRENT_REQUESTS_PER_IP = settings.SCRAPY_CONCURRENT_REQUESTS_PER_IP

# Disable cookies (enabled by default)
# COOKIES_ENABLED = False

# Disable Telnet Console (enabled by default)
# TELNETCONSOLE_ENABLED = False

# Override the default request headers:
# DEFAULT_REQUEST_HEADERS = {
#    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
#    "Accept-Language": "en",
# }

# Enable or disable spider middlewares
# See https://docs.scrapy.org/en/latest/topics/spider-middleware.html
SPIDER_MIDDLEWARES = {
    # "spider.middlewares.SpiderSpiderMiddleware": 543,
    # 'scrapy_splash.SplashDeduplicateArgsMiddleware': 100,
}

# Enable or disable downloader middlewares
# See https://docs.scrapy.org/en/latest/topics/downloader-middleware.html
# DOWNLOADER_MIDDLEWARES = {
# }

# Enable or disable extensions
# See https://docs.scrapy.org/en/latest/topics/extensions.html
EXTENSIONS = {
    'spider.extensions.StopAfterRequestsExtension': 500,
    # "scrapy.extensions.telnet.TelnetConsole": None,
}

# Configure item pipelines
# See https://docs.scrapy.org/en/latest/topics/item-pipeline.html
ITEM_PIPELINES = {
    "spider.pipelines.HTMLFilterPipeline": 100,
    "spider.pipelines.MarkdownPipeline": 200,
    "watercrawl_plugin.pipeline.PipelinePluginLoader": 300,
    "spider.pipelines.SpiderPipeline": 400,
}

# Enable and configure the AutoThrottle extension (disabled by default)
# See https://docs.scrapy.org/en/latest/topics/autothrottle.html
# AUTOTHROTTLE_ENABLED = True
# The initial download delay
# AUTOTHROTTLE_START_DELAY = 5
# The maximum download delay to be set in case of high latencies
# AUTOTHROTTLE_MAX_DELAY = 60
# The average number of requests Scrapy should be sending in parallel to
# each remote server
# AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0
# Enable showing throttling stats for every response received:
# AUTOTHROTTLE_DEBUG = False

# Enable and configure HTTP caching (disabled by default)
# See https://docs.scrapy.org/en/latest/topics/downloader-middleware.html#httpcache-middleware-settings
HTTPCACHE_ENABLED = settings.SCRAPY_HTTPCACHE_ENABLED
HTTPCACHE_EXPIRATION_SECS = settings.SCRAPY_HTTPCACHE_EXPIRATION_SECS
HTTPCACHE_DIR = settings.SCRAPY_HTTPCACHE_DIR
HTTPCACHE_IGNORE_HTTP_CODES = [
    400,
    401,
    403,
    404,
    405,
    500,
    502,
    503,
    504,
]
HTTPCACHE_STORAGE = "scrapy.extensions.httpcache.FilesystemCacheStorage"

# Set settings whose default value is deprecated to a future-proof value
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"

LOG_LEVEL = settings.SCRAPY_LOG_LEVEL
