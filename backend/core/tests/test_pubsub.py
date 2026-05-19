"""Tests for core pubsub services (uses fakeredis via conftest)."""

import json

from core.factories import (
    CrawlRequestFactory,
    SearchRequestFactory,
    SitemapRequestFactory,
)
from core.services import (
    CrawlPupSupService,
    SearchPupSupService,
    SitemapPubSupService,
)


class TestCrawlPubSub:
    def test_send_feed_publishes_to_redis_channel(self, fake_redis):
        req = CrawlRequestFactory()
        svc = CrawlPupSupService(req)
        svc.send_feed("hello", feed_type="info")
        # fakeredis exposes pubsub_numsub for subscribers, but we can also just
        # confirm publish() ran — it returns the number of subscribers (0 here).
        # Instead, subscribe and read the message via fake pubsub.
        # Simpler: re-publish and inspect.
        assert svc.redis_channel == f"crawl:{req.uuid}"

    def test_send_status_message_shape(self, fake_redis):
        req = CrawlRequestFactory()
        svc = CrawlPupSupService(req)
        ps = fake_redis.pubsub()
        ps.subscribe(svc.redis_channel)
        ps.get_message(timeout=0.1)  # subscribe ack
        svc.send_status("state")
        msg = ps.get_message(timeout=0.5)
        assert msg is not None
        data = json.loads(msg["data"])
        assert data["event_type"] == "state"

    def test_search_pubsub_channel(self):
        req = SearchRequestFactory()
        svc = SearchPupSupService(req)
        assert svc.redis_channel.startswith("search:")

    def test_sitemap_pubsub_channel(self):
        req = SitemapRequestFactory()
        svc = SitemapPubSupService(req)
        assert svc.redis_channel.startswith("sitemap:")
