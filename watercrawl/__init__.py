from __future__ import absolute_import, unicode_literals

import os

# This will make sure the app is always imported when
# Django starts, ensuring Celery tasks can be registered.
from .celery import app as celery_app

if os.path.exists('./VERSION'):
    with open('./VERSION') as f:
        __version__ = f.read().strip()
else:
    __version__ = 'development'

__all__ = ('celery_app',)
