"""Tiny smoke test to verify the test harness wires up correctly."""

from user.factories import UserFactory


def test_user_factory_creates_user():
    user = UserFactory()
    assert user.pk is not None
    assert user.email.startswith("user")
    assert user.email.endswith("@example.com")
    assert user.email_verified is True
    assert user.check_password("Pa$$word123")
