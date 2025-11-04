from sentry_sdk import init as sentry_sdk_init


def init_sentry():
    from . import __version__
    from django.conf import settings

    if not settings.SENTRY_DSN:
        return

    sentry_sdk_init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        send_default_pii=settings.SENTRY_SEND_DEFAULT_PII,
        enable_logs=settings.SENTRY_ENABLE_LOGS,
        release=__version__,
        http_proxy=settings.SENTRY_HTTP_PROXY or None,
        https_proxy=settings.SENTRY_HTTPS_PROXY or None,
        environment=settings.SENTRY_ENVIRONMENT,
        debug=settings.SENTRY_DEBUG,
    )
