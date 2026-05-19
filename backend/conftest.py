"""Root pytest fixtures for the WaterCrawl backend test suite."""

from __future__ import annotations

from typing import Callable

import fakeredis
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


# --- DB / autouse hygiene ----------------------------------------------------


@pytest.fixture(autouse=True)
def _enable_db_for_all_tests(db):
    """Auto-grant DB access; most tests touch the ORM."""
    return db


# --- Redis fake --------------------------------------------------------------


@pytest.fixture
def fake_redis():
    """A fresh fakeredis instance per test."""
    return fakeredis.FakeStrictRedis(decode_responses=False)


@pytest.fixture(autouse=True)
def _patch_redis_connections(monkeypatch, fake_redis):
    """Redirect django_redis + locker to fakeredis so tests don't need a real Redis.

    Anything that calls ``django_redis.get_redis_connection`` (PubSub services) or
    ``locker.helpers.redis_lock`` will hit the in-memory fake.
    """
    monkeypatch.setattr(
        "django_redis.get_redis_connection", lambda *_args, **_kw: fake_redis
    )
    # core/services.py imports it as ``from django_redis import get_redis_connection``,
    # so patch the imported name too.
    import core.services as core_services

    monkeypatch.setattr(
        core_services, "get_redis_connection", lambda *a, **kw: fake_redis
    )

    # locker/helpers.py builds the Redis client at module import time:
    #   connection = Redis(host=..., port=..., db=..., password=...)
    # By the time this fixture runs, that connection object already exists,
    # so patching ``redis.Redis`` is too late. Replace the cached connection
    # object directly so ``redis_lock`` writes/reads against fakeredis.
    import locker.helpers as locker_helpers

    monkeypatch.setattr(locker_helpers, "connection", fake_redis)


# --- API client / auth -------------------------------------------------------


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def authenticate(api_client) -> Callable[[object], APIClient]:
    """Return a function that authenticates the shared api_client as the given user."""

    def _auth(user):
        token = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
        return api_client

    return _auth


# --- Domain fixtures (re-exported from app factories) -----------------------


@pytest.fixture
def user(db):
    from user.factories import UserFactory

    return UserFactory()


@pytest.fixture
def team(db, user):
    from user.factories import TeamFactory, TeamMemberFactory

    team = TeamFactory()
    TeamMemberFactory(team=team, user=user, is_owner=True)
    return team


@pytest.fixture
def authenticated_client(authenticate, user, team):
    """A DRF APIClient authenticated as ``user`` who owns ``team``."""
    return authenticate(user)


@pytest.fixture
def default_plan(db):
    from plan.factories import PlanFactory

    return PlanFactory(is_default=True, name="Free", price=0)


@pytest.fixture
def paid_plan(db):
    from plan.factories import PlanFactory

    return PlanFactory(
        is_default=False, name="Pro", price=19, page_credit=10000, daily_page_credit=500
    )


# --- Stripe mock -------------------------------------------------------------


@pytest.fixture
def mock_stripe(mocker):
    """Stub out the stripe SDK methods we touch in tests."""
    import stripe

    customer = mocker.MagicMock(id="cus_test_123")
    subscription = mocker.MagicMock(
        id="sub_test_123",
        status="active",
        current_period_start=1700000000,
        current_period_end=1702592000,
    )

    mocker.patch.object(stripe.Customer, "create", return_value=customer)
    mocker.patch.object(stripe.Customer, "retrieve", return_value=customer)
    mocker.patch.object(stripe.Subscription, "create", return_value=subscription)
    mocker.patch.object(stripe.Subscription, "retrieve", return_value=subscription)
    mocker.patch.object(stripe.Subscription, "modify", return_value=subscription)
    mocker.patch.object(stripe.Subscription, "delete", return_value=subscription)
    mocker.patch.object(
        stripe.checkout.Session,
        "create",
        return_value=mocker.MagicMock(
            id="cs_test_123", url="https://stripe.test/checkout"
        ),
    )
    return {"customer": customer, "subscription": subscription}
