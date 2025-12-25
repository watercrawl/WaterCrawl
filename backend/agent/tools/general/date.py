import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from langchain_core.messages import ToolMessage
from pydantic import BaseModel, Field

from agent.tools.base import register_builtin_tool, BaseBuiltinTool


class DateTimeToolInputSchema(BaseModel):
    timezone: str = Field(description="Timezone to use for date", default="UTC")
    format: str = Field(
        description="Pythonic date format", default="%Y-%m-%dT%H:%M:%S%z"
    )


@register_builtin_tool("date")
class DateTool(BaseBuiltinTool):
    """Tool to get current date."""

    name = "Get Date Time"
    input_schema = DateTimeToolInputSchema

    @classmethod
    def get_name(cls) -> str:
        return cls.name

    async def arun(self, tool_call_id: str, **params) -> ToolMessage:
        tz_name = params.get("timezone") or "UTC"

        try:
            tz = ZoneInfo(tz_name)
        except ZoneInfoNotFoundError:
            return ToolMessage(
                content=f"Timezone '{tz_name}' not found. Using UTC instead.",
                tool_call_id=tool_call_id,
            )

        content = datetime.datetime.now(
            tz  # Pass the zoneinfo ZoneInfo object
        ).strftime(params.get("format") or "%Y-%m-%dT%H:%M:%S%z")

        return ToolMessage(content=content, tool_call_id=tool_call_id)
