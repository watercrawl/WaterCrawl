import time
from redis import Redis
from django.conf import settings

connection = Redis(
    host=settings.REDIS_LOCKER_CONFIG['HOST'],
    port=settings.REDIS_LOCKER_CONFIG['PORT'],
    db=settings.REDIS_LOCKER_CONFIG['NAME'],
    password=settings.REDIS_LOCKER_CONFIG['PASSWORD']
)


class RedisLock:
    def __init__(self, lock_name, timeout=10, wait_time=5, retry_interval=0.1):
        """
        :param lock_name: The unique name for the lock.
        :param timeout: How long the lock should exist in Redis (in seconds).
        :param wait_time: Maximum time to wait to acquire the lock (in seconds).
        :param retry_interval: Time between retries (in seconds).
        """
        self.lock_name = lock_name
        self.timeout = timeout
        self.wait_time = wait_time
        self.retry_interval = retry_interval

    def acquire(self):
        start_time = time.time()
        while time.time() - start_time < self.wait_time:
            if connection.set(self.lock_name, "locked", nx=True, ex=self.timeout):
                # Lock acquired
                return True
            time.sleep(self.retry_interval)
        # Failed to acquire lock within wait_time
        return False

    def release(self):
        connection.delete(self.lock_name)

    def __enter__(self):
        if not self.acquire():
            raise TimeoutError(f"Failed to acquire lock '{self.lock_name}' within {self.wait_time} seconds")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.release()


def redis_lock(lock_name, timeout=10, wait_time=5, retry_interval=0.1):
    return RedisLock(lock_name, timeout, wait_time, retry_interval)
