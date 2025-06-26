import importlib
from typing import Type, List

from django.conf import settings
from watercrawl_plugin import AbstractPlugin


def generate_crawl_result_file_path(instance, filename):
    return "crawls/{}/results/{}.json".format(instance.request_id, instance.pk)


def generate_crawl_result_attachment_path(instance, filename):
    return "crawls/{}/results/{}/attachments/{}".format(
        instance.crawl_result.request_id, instance.crawl_result.uuid, filename
    )


def search_result_file_path(instance, filename):
    return "searches/{}/result.json".format(
        instance.uuid,
    )


def sitemap_result_file_path(instance, filename):
    return "sitemaps/{}/result.json".format(
        instance.uuid,
    )


def generate_crawl_request_sitemap_path(instance, filename):
    return "crawls/{}/sitemap.json".format(instance.uuid)


def get_active_plugins() -> List[Type["AbstractPlugin"]]:
    """
    Get a list of active plugins
    :return: AbstractPlugin[]
    """
    result = []
    plugins = settings.WATERCRAWL_PLUGINS
    if not isinstance(plugins, list):
        plugins = plugins.split(",")

    for plugin_class in plugins:
        module_name, class_name = plugin_class.rsplit(".", 1)

        # Import the module
        module = importlib.import_module(module_name)

        # Get the class from the module
        cls = getattr(module, class_name)
        result.append(cls)

    return result


def cast_bool(value):
    return value.lower() in ("true", "1", "t")
