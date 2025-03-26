from __future__ import absolute_import, unicode_literals

import os

# This will make sure the app is always imported when
# Django starts, ensuring Celery tasks can be registered.
from .celery import app as celery_app

LATEST_PRIVACY_UPDATE_AT = '2025-01-02T00:00:00'
LATEST_TERMS_UPDATE_AT = '2025-02-11T00:00:00'
PRIVACY_URL = "https://watercrawl.dev/privacy"
TERMS_URL = "https://watercrawl.dev/terms"

if os.path.exists('./VERSION'):
    with open('./VERSION') as f:
        __version__ = f.read().strip()
else:
    __version__ = 'development'

__all__ = ('celery_app',)
