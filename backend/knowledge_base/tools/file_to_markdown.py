import csv
import io
import tempfile
from abc import ABC

import html2text
import pypandoc
from django.core.files.storage import Storage, default_storage

from knowledge_base.interfaces import BaseFileToMarkdownConverter
from knowledge_base.models import KnowledgeBase, KnowledgeBaseDocument


class BaseConverter(BaseFileToMarkdownConverter, ABC):
    def __init__(self):
        self.storage: Storage = default_storage

    @classmethod
    def from_knowledge_base(cls, knowledge_base: KnowledgeBase) -> "BaseConverter":
        return cls()


class FileReaderAsConverter(BaseConverter):
    def convert(self, document: KnowledgeBaseDocument) -> str:
        with self.storage.open(document.source) as f:
            return f.read().decode("utf-8")


class HtmlFileToMarkdownConverter(BaseConverter):
    def convert(self, document: KnowledgeBaseDocument) -> str:
        with self.storage.open(document.source) as f:
            h = html2text.HTML2Text()
            h.body_width = 0
            return h.handle(f.read().decode("utf-8"))


class PyPandocConverter(BaseConverter):
    def get_format(self) -> str:
        raise NotImplementedError

    def convert(self, document: KnowledgeBaseDocument) -> str:
        with (
            self.storage.open(document.source) as f,
            tempfile.NamedTemporaryFile(delete=True) as temp_file,
        ):
            temp_file.write(f.read())
            temp_file.flush()
            return pypandoc.convert_file(
                temp_file.name,
                "md",
                format=self.get_format(),
            )


class DocxFileToMarkdownConverter(PyPandocConverter):
    def get_format(self) -> str:
        return "docx"


class CsvFileToMarkdownConverter(BaseConverter):
    def convert(self, document: KnowledgeBaseDocument) -> str:
        # storage.open() provides a file-like object in binary mode.
        with self.storage.open(document.source) as f:
            # We use io.TextIOWrapper to wrap the binary stream with a text-decoding stream.
            # This makes the new 'text_stream' object behave like a file opened in text mode.
            # We assume UTF-8 encoding, which is standard for most CSV files.
            text_stream = io.TextIOWrapper(f, encoding="utf-8", errors="ignore")

            markdown = ""
            reader = csv.reader(text_stream)

            for row in reader:
                # The 'row' now contains strings, and the csv.reader works as expected.
                markdown += " | ".join([x.strip() for x in row]) + "\n"

            return markdown
