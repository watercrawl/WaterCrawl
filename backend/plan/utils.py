from core import consts as core_consts


def calculate_number_of_search_credits(number_of_results, depth):
    if depth == core_consts.SEARCH_DEPTH_ULTIMATE:
        return number_of_results

    if depth == core_consts.SEARCH_DEPTH_ADVANCED:
        return ((number_of_results + 4) // 5) * 2

    return (number_of_results + 4) // 5
