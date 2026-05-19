"""Tests for spider/helpers.py pure-function HTML transformations."""

from spider.helpers import HtmlFilter, HtmlToMarkdown


class TestHtmlFilter:
    def test_removes_script_and_style(self):
        html = (
            "<html><head><style>body{}</style></head>"
            "<body><p>Hello</p><script>alert(1)</script></body></html>"
        )
        out = HtmlFilter(html, {}).filter_html()
        assert "<script" not in out
        assert "<style" not in out
        assert "Hello" in out

    def test_only_main_content_strips_header_footer_nav_aside(self):
        html = (
            "<html><body>"
            "<header>HEAD</header><nav>NAV</nav>"
            "<main><p>Main</p></main>"
            "<aside>SIDE</aside><footer>FOOT</footer>"
            "</body></html>"
        )
        out = HtmlFilter(html, {"only_main_content": True}).filter_html()
        assert "HEAD" not in out
        assert "NAV" not in out
        assert "SIDE" not in out
        assert "FOOT" not in out
        assert "Main" in out

    def test_exclude_tags_removes_specified_elements(self):
        html = "<html><body><p>keep</p><div class='ads'>drop</div></body></html>"
        out = HtmlFilter(html, {"exclude_tags": ["div"]}).filter_html()
        assert "keep" in out
        assert "drop" not in out

    def test_include_tags_returns_only_matching(self):
        html = "<html><body><p>keep me</p><div>drop me</div><span>ignore</span></body></html>"
        out = HtmlFilter(html, {"include_tags": ["p"]}).filter_html()
        assert "keep me" in out
        assert "drop me" not in out


class TestHtmlToMarkdown:
    def test_converts_basic_html_to_markdown(self):
        md = HtmlToMarkdown("<h1>Hello</h1><p>World</p>").convert_to_markdown()
        assert "# Hello" in md
        assert "World" in md

    def test_links_converted(self):
        md = HtmlToMarkdown(
            '<a href="https://example.com/">Example</a>'
        ).convert_to_markdown()
        assert "[Example](https://example.com/)" in md
