import enum
import yaml
import pandas as pd
from langchain_core.messages import ToolMessage
from pydantic import BaseModel, Field
import os
import tempfile

from agent.tools.base import BaseBuiltinTool, register_builtin_tool


class FileType(str, enum.Enum):
    """Supported structured file types for export."""

    CSV = "csv"
    XML = "xml"
    XLS = "xls"
    XLSX = "xlsx"
    JSON = "json"
    YAML = "yaml"


class StructuredFileToolInputSchema(BaseModel):
    data: list[dict] = Field(
        description="A list of dictionaries, where each dictionary represents a row and its keys are the column names."
        " it loaded to a DataFrame. this value is required.",
    )
    file_type: FileType = Field(
        description="The desired file type (csv, xls, xlsx, xml, json).",
        default=FileType.CSV,
    )
    file_name: str = Field(
        description="The desired base output file name (e.g., 'report'). The tool will append the correct extension.",
        default="output_file",
    )


@register_builtin_tool("structured_file")
class StructuredFileTool(BaseBuiltinTool):
    """Tool to create structured data files (CSV, XML, XLS, XLSX, JSON, YAML)."""

    name = "Structured File Creator"
    input_schema = StructuredFileToolInputSchema

    def _generate_file_to_bytes(
        self, df: pd.DataFrame, file_type: FileType, file_name: str
    ) -> tuple[bytes, str]:
        """
        Generates the file content and saves it to a temporary local file.
        Returns the path to the temporary file.
        """

        final_file_name_with_ext = f"{file_name}.{file_type.value}"

        # Create a temporary file path guaranteed to be unique
        temp_dir = tempfile.gettempdir()
        temp_file_path = os.path.join(temp_dir, final_file_name_with_ext)

        if file_type == FileType.CSV:
            df.to_csv(temp_file_path, index=False)

        elif file_type == FileType.XML:
            df.to_xml(temp_file_path, index=False)

        elif file_type in (FileType.XLS, FileType.XLSX):
            df.to_excel(temp_file_path, index=False, sheet_name="Data")

        elif file_type == FileType.JSON:
            df.to_json(temp_file_path, orient="records", indent=4)

        elif file_type == FileType.YAML:
            data_records = df.to_dict(orient="records")
            with open(temp_file_path, "w") as f:
                yaml.dump(data_records, f, default_flow_style=False)

        else:
            raise ValueError(f"Unsupported file type: {file_type}")

        with open(temp_file_path, "rb") as f:
            data = f.read()
        os.remove(temp_file_path)
        return data, final_file_name_with_ext

    async def arun(self, tool_call_id: str, **params) -> ToolMessage:
        file_type = params.get("file_type")
        data = params.get("data")
        file_name = params.get("file_name", "output_file")

        try:
            file_type = FileType(file_type)
        except ValueError:
            return ToolMessage(
                content=f"Error: Invalid file type: {file_type}",
                tool_call_id=tool_call_id,
                status="error",
            )

        if not data:
            return ToolMessage(
                content="Error: The 'data' parameter cannot be empty.",
                tool_call_id=tool_call_id,
                status="error",
            )

        try:
            df = pd.DataFrame(data)
        except Exception as e:
            return ToolMessage(
                content=f"Error creating DataFrame from data: {e}",
                tool_call_id=tool_call_id,
                status="error",
            )

        try:
            content, file_name = self._generate_file_to_bytes(df, file_type, file_name)

        except (ValueError, Exception) as e:
            return ToolMessage(
                content=f"Error generating file content: {e}",
                tool_call_id=tool_call_id,
                status="error",
            )

        url = await self.save_file(file_name, content)

        if not url:
            return ToolMessage(
                content="Error saving file.", tool_call_id=tool_call_id, status="error"
            )

        return ToolMessage(
            content=f"File Created: {url}",
            artifact={"type": "file", "url": url},
            tool_call_id=tool_call_id,
        )
