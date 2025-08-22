from core import consts as core_consts


def calculate_number_of_search_credits(number_of_results, depth):
    if depth == core_consts.SEARCH_DEPTH_ULTIMATE:
        return number_of_results

    if depth == core_consts.SEARCH_DEPTH_ADVANCED:
        return ((number_of_results + 4) // 5) * 2

    return (number_of_results + 4) // 5


def calculate_number_of_sitemap_credits(ignore_sitemap_xml):
    if ignore_sitemap_xml:
        return 15
    return 5
