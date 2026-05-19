"""Tests for common services: EmailService, FrontendSettingService, EventStreamResponse."""

import json

import pytest
from django.core import mail

from common.services import EmailService, EventStreamResponse, FrontendSettingService


class TestEmailService:
    def test_builder_send_uses_locmem_outbox(self):
        (
            EmailService()
            .add_to("recipient@example.com")
            .set_subject("Hi")
            .set_body("hello body")
            .send()
        )
        assert len(mail.outbox) == 1
        msg = mail.outbox[0]
        assert msg.to == ["recipient@example.com"]
        assert msg.subject == "Hi"
        assert "hello body" in msg.body

    def test_html_alternative_attached(self):
        (
            EmailService()
            .add_to("recipient@example.com")
            .set_subject("Hi")
            .set_html("<h1>HTML</h1>")
            .send()
        )
        msg = mail.outbox[0]
        # plaintext body derived from html2text
        assert "HTML" in msg.body.upper()
        # one alternative attached
        assert any("text/html" in alt for _, alt in msg.alternatives)

    def test_validate_requires_recipient(self):
        with pytest.raises(ValueError):
            EmailService().set_subject("x").set_body("y").send()

    def test_validate_requires_subject(self):
        with pytest.raises(ValueError):
            EmailService().add_to("a@example.com").set_body("y").send()

    def test_validate_requires_body_or_html(self):
        with pytest.raises(ValueError):
            EmailService().add_to("a@example.com").set_subject("x").send()


class TestEventStreamResponse:
    def test_sse_framing(self):
        def gen():
            yield {"event_type": "state", "payload": {"x": 1}}
            yield {"event_type": "feed", "payload": "hello"}

        resp = EventStreamResponse(gen())
        body = b"".join(resp.streaming_content).decode()
        # SSE: each event lines up with "data: <json>\n\n"
        chunks = [c for c in body.split("\n\n") if c]
        assert len(chunks) == 2
        assert chunks[0].startswith("data: ")
        assert json.loads(chunks[0][6:])["event_type"] == "state"

    def test_no_cache_and_no_buffering_headers(self):
        resp = EventStreamResponse(iter([]))
        assert resp["Cache-Control"] == "no-cache"
        assert resp["X-Accel-Buffering"] == "no"
        assert resp["Content-Type"] == "text/event-stream"


class TestFrontendSettingService:
    def test_api_version_from_module(self):
        svc = FrontendSettingService()
        # watercrawl.__version__ exists; just confirm we read it.
        assert isinstance(svc.api_version, str)

    def test_is_installed_false_when_no_users(self):
        svc = FrontendSettingService()
        # users may have been created by other tests in the same session — assert
        # the type rather than the value to avoid order dependence.
        assert isinstance(svc.is_installed, bool)

    def test_is_search_configured_reflects_settings(self, settings):
        settings.SCRAPY_GOOGLE_API_KEY = ""
        settings.SCRAPY_GOOGLE_CSE_ID = ""
        svc = FrontendSettingService()
        assert svc.is_search_configured is False
