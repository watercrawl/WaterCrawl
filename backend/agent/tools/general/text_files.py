import enum
from langchain_core.messages import ToolMessage
from pydantic import BaseModel, Field

from agent.tools.base import BaseBuiltinTool, register_builtin_tool


class PlainTextFileType(str, enum.Enum):
    """Supported text file types for export."""

    HTML = "html"
    MARKDOWN = "md"
    TXT = "txt"


class PlainTextFileToolInputSchema(BaseModel):
    content: str = Field(
        description="The full string content that should be written to the file. This value is required.",
    )
    file_type: PlainTextFileType = Field(
        description="The desired file type (html, md, txt).",
        default=PlainTextFileType.TXT,
    )
    file_name: str = Field(
        description="The desired base output file name (e.g., 'document'). The tool will append the correct extension.",
        default="output_document",
    )


@register_builtin_tool("plaintext_file")
class PlainTextFileTool(BaseBuiltinTool):
    """Tool to create plain text files (HTML, Markdown, TXT)."""

    name = "Plain Text File Creator"
    input_schema = PlainTextFileToolInputSchema

    def _generate_file_to_bytes(
        self, content: str, file_type: PlainTextFileType, file_name: str
    ) -> tuple[bytes, str]:
        """
        Generates the file content and saves it to a temporary local file.
        Returns the file content as bytes and the final file name.
        """

        final_file_name_with_ext = f"{file_name}.{file_type.value}"

        # The content is already a string, we just need to encode it to bytes.
        # We use UTF-8 as the standard encoding for text files.
        file_content_bytes = content.encode("utf-8")

        return file_content_bytes, final_file_name_with_ext

    async def arun(self, tool_call_id: str, **params) -> ToolMessage:
        file_type = params.get("file_type")
        content = params.get("content")
        file_name = params.get("file_name", "output_document")

        try:
            file_type = PlainTextFileType(file_type)
        except ValueError:
            valid_types = [t.value for t in PlainTextFileType]
            return ToolMessage(
                content=f"Error: Invalid file type: {file_type}. Must be one of {', '.join(valid_types)}.",
                tool_call_id=tool_call_id,
                status="error",
            )

        if not content:
            return ToolMessage(
                content="Error: The 'content' parameter cannot be empty.",
                tool_call_id=tool_call_id,
                status="error",
            )

        try:
            file_content_bytes, final_file_name = self._generate_file_to_bytes(
                content, file_type, file_name
            )

        except Exception as e:
            # This is less likely to happen than in the structured tool, but good practice.
            return ToolMessage(
                content=f"Error generating file content: {e}",
                tool_call_id=tool_call_id,
                status="error",
            )

        print("File content bytes", file_content_bytes)
        # Assuming self.save_file handles the file storage and returns a URL
        url = await self.save_file(final_file_name, file_content_bytes)
        print("URL", url)

        if not url:
            return ToolMessage(
                content="Error saving file.", tool_call_id=tool_call_id, status="error"
            )

        return ToolMessage(
            content=f"File Created: {url}",
            artifact={"type": "file", "url": url},
            tool_call_id=tool_call_id,
        )
