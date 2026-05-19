"""Test-only settings overrides.

Imports everything from settings.py then patches the bits that touch external
services so the test suite is hermetic: real Postgres for the ORM, in-memory
for everything else (cache, storage, email, Celery, Redis locks).
"""

import os

# Force the env vars BEFORE settings.py runs env() lookups. The dev .env file
# in the repo sets IS_ENTERPRISE_MODE_ACTIVE=true; tests need it off so
# ``plan.services.TeamPlanService`` resolves to ``TeamPlanUnlimitedService``.
os.environ["IS_ENTERPRISE_MODE_ACTIVE"] = "false"
os.environ["CAPTURE_USAGE_HISTORY"] = "false"
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "watercrawl.settings_test")

from watercrawl.settings import *  # noqa: F401, F403, E402

# Faster password hashing (still works with set_password / check_password).
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# In-process cache; avoid Redis dependency for most tests.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "watercrawl-tests",
    }
}

# In-memory file storage; avoid MinIO/S3.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.InMemoryStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

# locmem mail backend; assert via django.core.mail.outbox.
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Run Celery tasks inline so the test suite doesn't need a worker.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Stripe stub values; tests mock the SDK directly.
STRIPE_SECRET_KEY = "sk_test_dummy"
STRIPE_WEBHOOK_SECRET = "whsec_test_dummy"

# Keep encryption deterministic across tests.
API_ENCRYPTION_KEY = "8zSd6JIuC7ovfZ4AoxG_XmhubW6CPnQWW7Qe_4TD1TQ="

# Silence sentry during tests.
SENTRY_DSN = None

# Avoid django-minio-backend trying to talk to MinIO on startup.
MINIO_CONSISTENCY_CHECK_ON_START = False
MINIO_BUCKET_CHECK_ON_SAVE = False
