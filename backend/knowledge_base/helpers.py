import re
from urllib.parse import urlparse


class NoiseRemover:
    def __init__(self, markdown_text, source_url):
        self.text = markdown_text
        self.source_url = source_url
        parsed_url = urlparse(self.source_url)
        self.base_url = parsed_url.scheme + "://" + parsed_url.netloc
        self.noise_removed = False

    def remove_inline_svg(self):
        # remove inline svg
        self.text = re.sub(
            r"data:image/svg+xml,<svg.*?>.*?</svg>", "", self.text, flags=re.IGNORECASE
        )
        self.text = re.sub(r"<svg.*?>.*?</svg>", "", self.text, flags=re.IGNORECASE)

    def remove_base64_images(self):
        # remove base64 files/images
        self.text = re.sub(
            r"!\[.*?\]\(data:image\/.*?base64,.*?\)", "", self.text, flags=re.IGNORECASE
        )

    def remove_html_tags(self):
        # remove html tags
        self.text = re.sub(r"<.*?>", "", self.text)

    def __replace_relative_url(self, match):
        alt_text = match.group(1)
        url = match.group(2)

        # Skip if already absolute (starts with http://, https://, or /)
        if re.match(r"^(?:https?:)?//", url):
            return match.group(0)

        # Otherwise, prepend website_url
        absolute_url = f"{self.base_url}/{url.lstrip('./')}"
        return f"![{alt_text}]({absolute_url})"

    def absolute_image_links(self):
        # find images that are not have absolute path make them absolute with the website url
        self.text = re.sub(
            r"!\[(.*?)\]\((.*?)\)", self.__replace_relative_url, self.text
        )

    def remove_noises(self):
        if self.noise_removed:
            return self.text
        self.remove_inline_svg()
        self.remove_base64_images()  # todo: Not working with persian scripts
        self.remove_html_tags()
        self.absolute_image_links()
        self.noise_removed = True
        return self.text
