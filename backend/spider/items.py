import scrapy


class BaseItem(scrapy.Item):

    def __getitem__(self, key):
        return self._values.get(key)

    def __setitem__(self, key, value):
        self._values[key] = value


class ScrapedItem(BaseItem):
    crawl_request_uuid = scrapy.Field()
    url = scrapy.Field()
    links = scrapy.Field()
    metadata = scrapy.Field()
    html = scrapy.Field()
    filtered_html = scrapy.Field()
    markdown = scrapy.Field()
    attachments = scrapy.Field()
