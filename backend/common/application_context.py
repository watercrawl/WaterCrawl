from asgiref.local import Local

_application_context = Local()


def set_application_context_api_key(key):
    _application_context.used_api_key = key


def get_application_context_api_key():
    return getattr(_application_context, "used_api_key", None)


def clear_application_context():
    _application_context.__dict__.clear()
