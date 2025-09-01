import json
from functools import cached_property
from typing import Generator

import html2text
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.http import StreamingHttpResponse
from django.template.loader import render_to_string

import watercrawl
from user.models import User


class EventStreamResponse(StreamingHttpResponse):
    def __init__(self, generator: Generator):
        self.generator = generator
        super().__init__(self.callback(), content_type="text/event-stream")
        self["Cache-Control"] = "no-cache"
        self["X-Accel-Buffering"] = "no"

    def callback(self):
        for event in self.generator:
            data = json.dumps(event)
            yield f"data: {data}\n\n"


class FrontendSettingService:
    @cached_property
    def is_enterprise_mode_active(self):
        return settings.IS_ENTERPRISE_MODE_ACTIVE

    @cached_property
    def github_client_id(self):
        return settings.GITHUB_CLIENT_ID

    @cached_property
    def google_client_id(self):
        return settings.GOOGLE_CLIENT_ID

    @cached_property
    def is_signup_active(self):
        return settings.IS_SIGNUP_ACTIVE

    @cached_property
    def is_login_active(self):
        return settings.IS_LOGIN_ACTIVE

    @cached_property
    def is_google_login_active(self):
        return settings.IS_GOOGLE_LOGIN_ACTIVE

    @cached_property
    def is_github_login_active(self):
        return settings.IS_GITHUB_LOGIN_ACTIVE

    @cached_property
    def api_version(self):
        return watercrawl.__version__

    @cached_property
    def policy_url(self):
        return watercrawl.PRIVACY_URL

    @cached_property
    def terms_url(self):
        return watercrawl.TERMS_URL

    @cached_property
    def policy_update_at(self):
        return watercrawl.LATEST_PRIVACY_UPDATE_AT

    @cached_property
    def terms_update_at(self):
        return watercrawl.LATEST_TERMS_UPDATE_AT

    @cached_property
    def google_analytics_id(self):
        return settings.GOOGLE_ANALYTICS_ID

    @cached_property
    def is_installed(self):
        return User.objects.exists()

    @cached_property
    def is_search_configured(self):
        return bool(settings.SCRAPY_GOOGLE_CSE_ID and settings.SCRAPY_GOOGLE_API_KEY)

    @cached_property
    def max_crawl_concurrency(self):
        return settings.SCRAPY_CONCURRENT_REQUESTS

    @cached_property
    def mcp_server(self):
        return settings.MCP_SERVER


class EmailService:
    def __init__(self):
        self.from_email = settings.DEFAULT_FROM_EMAIL
        self.tos = []
        self.ccs = []
        self.bccs = []
        self.subject = ""
        self.body = None
        self.html = None
        self.attachments = []

    def send(self):
        self.validate()
        email = EmailMultiAlternatives(
            self.subject, self.__process_body(), self.from_email, self.tos
        )
        if self.html:
            email.attach_alternative(self.html, "text/html")
        email.send()

    def validate(self):
        if not self.tos:
            raise ValueError("No recipient provided")
        if not self.subject:
            raise ValueError("No subject provided")
        if not self.body and not self.html:
            raise ValueError("No body or html provided")

    def add_to(self, to):
        self.tos.append(to)
        return self

    def add_cc(self, cc):
        self.ccs.append(cc)
        return self

    def add_bcc(self, bcc):
        self.bccs.append(bcc)
        return self

    def set_subject(self, subject):
        self.subject = subject
        return self

    def set_body(self, body):
        self.body = body
        return self

    def set_html(self, html):
        self.html = html
        return self

    def set_template(self, template_name, context):
        self.html = render_to_string(template_name, context)
        return self

    def add_attachment(self, attachment):
        self.attachments.append(attachment)
        return self

    def __process_body(self):
        if self.body:
            return self.body
        return html2text.html2text(self.html)
