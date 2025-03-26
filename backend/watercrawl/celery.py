from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'watercrawl.settings')

app = Celery('watercrawl')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# Namespace 'CELERY_' means all celery-related configs must have this prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Look for task modules in Django apps.
app.autodiscover_tasks()