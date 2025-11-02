"""
ASGI config for watercrawl project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from .sentry import init_sentry

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "watercrawl.settings")

application = get_asgi_application()

init_sentry()
