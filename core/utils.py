def generate_crawl_result_file_path(instance, filename):
    return 'crawls/{}/results/{}.json'.format(instance.request_id, instance.pk)
