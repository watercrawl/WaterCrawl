import importlib

from django.utils.crypto import get_random_string


def generate_random_api_key(length=32):
    return "wc-{}".format(
        get_random_string(
            length=length, allowed_chars="abcdefghijklmnopqrstuvwxyz0123456789"
        )
    )


def load_class_by_name(full_class_name):
    # Split the full class name into module path and class name
    module_name, class_name = full_class_name.rsplit(".", 1)

    # Import the module
    module = importlib.import_module(module_name)

    # Get the class from the module
    cls = getattr(module, class_name)

    return cls
