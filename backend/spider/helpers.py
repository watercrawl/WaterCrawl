import re
import html2text
from lxml import html


class HtmlFilter:
    def __init__(self, html_content, scrape_options):
        self.tree = html.fromstring(html_content)
        self.scrape_options = scrape_options

    def filter_html(self):
        # Step 1: Handle includeTags if provided
        if self.scrape_options.get('include_tags'):
            return self._handle_include_tags()

        # Step 2: Remove unwanted elements like <script>, <style>, etc.
        self._remove_unwanted_tags()

        # Step 3: Handle excludeTags
        if self.scrape_options.get('exclude_tags'):
            self._handle_exclude_tags()

        # Step 4: If onlyMainContent is specified, remove non-main content
        if self.scrape_options.get('only_main_content'):
            self._remove_non_main_content()

        # Return the final cleaned HTML
        return self._get_cleaned_html()

    def _handle_include_tags(self):
        include_tags = self.scrape_options['include_tags']
        # Create a new root element to hold the tags to keep
        new_root = html.Element("div")

        for tag in include_tags:
            for element in self.tree.cssselect(tag):
                new_root.append(element)

        return html.tostring(new_root, pretty_print=True, encoding="unicode")

    def _remove_unwanted_tags(self):
        # Remove common unwanted tags like script, style, etc.
        for unwanted_tag in ['script', 'style', 'noscript', 'meta', 'head']:
            for element in self.tree.cssselect(unwanted_tag):
                element.getparent().remove(element)

    def _handle_exclude_tags(self):
        exclude_tags = self.scrape_options['exclude_tags']
        for tag in exclude_tags:
            # Handle wildcards or specific tags
            if tag.startswith("*") and tag.endswith("*"):  # For wildcard search
                regex_pattern = re.compile(tag[1:-1], re.IGNORECASE)
                for element in self.tree.cssselect("*"):
                    if regex_pattern.search(element.tag):
                        element.getparent().remove(element)
            else:
                for element in self.tree.cssselect(tag):
                    element.getparent().remove(element)

    def _remove_non_main_content(self):
        # Define a list of tags to exclude from non-main content
        exclude_non_main_tags = ['header', 'footer', 'nav', 'aside']
        for tag in exclude_non_main_tags:
            for element in self.tree.cssselect(tag):
                element.getparent().remove(element)

    def _get_cleaned_html(self):
        # Return the final cleaned HTML
        return html.tostring(self.tree, pretty_print=True, encoding="unicode")


class HtmlToMarkdown:
    def __init__(self, html_content):
        self.html_content = html_content

    def convert_to_markdown(self):
        h = html2text.HTML2Text()
        h.body_width = 0
        return h.handle(self.html_content)


