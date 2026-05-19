"""Tests for user app serializers."""

import pytest

from user.factories import UserFactory
from user.serializers import (
    LoginSerializer,
    RegisterSerializer,
)


class TestRegisterSerializer:
    def test_validates_password_strength(self):
        s = RegisterSerializer(
            data={
                "email": "foo@example.com",
                "password": "abc",  # too short
                "first_name": "A",
                "last_name": "B",
            }
        )
        assert s.is_valid() is False
        assert "password" in s.errors

    def test_rejects_existing_email_case_insensitive(self):
        UserFactory(email="dup@example.com")
        s = RegisterSerializer(
            data={
                "email": "DUP@example.com",
                "password": "Sup3rSecret!",
                "first_name": "A",
                "last_name": "B",
            }
        )
        assert s.is_valid() is False
        assert "email" in s.errors


class TestLoginSerializer:
    def test_invalid_credentials_raises(self):
        UserFactory(email="login@example.com")
        s = LoginSerializer(data={"email": "login@example.com", "password": "wrong"})
        assert s.is_valid() is False

    def test_unverified_email_blocks_login(self):
        UserFactory(email="unverified@example.com", email_verified=False)
        s = LoginSerializer(
            data={"email": "unverified@example.com", "password": "Pa$$word123"}
        )
        from rest_framework.exceptions import PermissionDenied

        with pytest.raises(PermissionDenied):
            s.is_valid(raise_exception=True)

    def test_valid_login_returns_user(self):
        user = UserFactory(email="ok@example.com")
        s = LoginSerializer(data={"email": "ok@example.com", "password": "Pa$$word123"})
        assert s.is_valid() is True
        assert s.validated_data["user"] == user

    def test_inactive_user_cannot_login(self):
        UserFactory(email="inactive@example.com", is_active=False)
        s = LoginSerializer(
            data={"email": "inactive@example.com", "password": "Pa$$word123"}
        )
        assert s.is_valid() is False
