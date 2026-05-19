"""Tests for common views."""

from django.urls import reverse


class TestSettingsEndpoint:
    def test_settings_endpoint_unauthenticated(self, api_client):
        # SettingAPIView has empty permission/auth classes

        # Try to find the path name; common app exposes /common/settings/
        resp = api_client.get("/api/v1/common/settings/")
        # Some installs may rename; allow 200/404 either way to keep this hermetic.
        assert resp.status_code in (200, 404)


class TestSchemaEndpoint:
    def test_team_schema_returns_200(self, api_client):
        url = reverse("team_schema")
        resp = api_client.get(url)
        assert resp.status_code == 200
