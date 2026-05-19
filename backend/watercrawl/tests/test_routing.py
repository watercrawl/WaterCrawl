"""Smoke tests for project-level URL routing and module imports."""

from django.urls import reverse


class TestUrlRouting:
    def test_register_url_resolves(self):
        assert reverse("register") == "/api/v1/user/auth/register/"

    def test_login_url_resolves(self):
        assert reverse("login") == "/api/v1/user/auth/login/"

    def test_schema_url_resolves(self):
        assert reverse("schema") == "/api/schema/"

    def test_team_schema_url_resolves(self):
        assert reverse("team_schema") == "/api/schema/team/"


class TestProjectImports:
    def test_celery_app_importable(self):
        from watercrawl.celery import app

        assert app is not None

    def test_sentry_init_idempotent_without_dsn(self, settings):
        # SENTRY_DSN is None in test settings; init should be a no-op.
        from watercrawl.sentry import init_sentry

        init_sentry()
        init_sentry()  # second call must not blow up
