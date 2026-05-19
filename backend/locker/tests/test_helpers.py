"""Tests for the RedisLock context manager, using fakeredis."""

import pytest

from locker.helpers import RedisLock


@pytest.fixture(autouse=True)
def _swap_connection(monkeypatch, fake_redis):
    """Swap the module-level Redis connection for fakeredis."""
    import locker.helpers as helpers

    monkeypatch.setattr(helpers, "connection", fake_redis)
    yield


class TestRedisLock:
    def test_acquire_returns_true_when_free(self, fake_redis):
        lock = RedisLock("test-lock")
        assert lock.acquire() is True
        assert fake_redis.exists("test-lock") == 1

    def test_release_removes_key(self, fake_redis):
        lock = RedisLock("test-lock")
        lock.acquire()
        lock.release()
        assert fake_redis.exists("test-lock") == 0

    def test_context_manager_releases_on_normal_exit(self, fake_redis):
        with RedisLock("ctx-lock"):
            assert fake_redis.exists("ctx-lock") == 1
        assert fake_redis.exists("ctx-lock") == 0

    def test_context_manager_releases_on_exception(self, fake_redis):
        try:
            with RedisLock("err-lock"):
                assert fake_redis.exists("err-lock") == 1
                raise RuntimeError("boom")
        except RuntimeError:
            pass
        assert fake_redis.exists("err-lock") == 0

    def test_second_acquire_times_out_when_held(self, fake_redis):
        first = RedisLock("contended", wait_time=0.05, retry_interval=0.01)
        second = RedisLock("contended", wait_time=0.05, retry_interval=0.01)
        assert first.acquire() is True
        # Second attempt should time out and return False (lock held by first)
        assert second.acquire() is False
        first.release()

    def test_context_manager_raises_timeout_when_held(self, fake_redis):
        first = RedisLock("blocked", wait_time=0.05, retry_interval=0.01)
        first.acquire()
        with pytest.raises(TimeoutError):
            with RedisLock("blocked", wait_time=0.05, retry_interval=0.01):
                pass  # never enters

    def test_independent_locks_dont_collide(self, fake_redis):
        a = RedisLock("a")
        b = RedisLock("b")
        a.acquire()
        assert b.acquire() is True

    def test_acquire_respects_ttl(self, fake_redis):
        lock = RedisLock("expires", timeout=60)
        lock.acquire()
        ttl = fake_redis.ttl("expires")
        assert 0 < ttl <= 60
