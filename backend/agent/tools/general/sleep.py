import asyncio
from pydantic import BaseModel, Field
from langchain_core.messages import ToolMessage

from agent.tools.base import register_builtin_tool, BaseBuiltinTool


class SleepToolInputSchema(BaseModel):
    seconds: int = Field(
        description="Number of seconds to sleep (min 1, max 30).",
        default=1,
        ge=1,
        le=30,
    )


@register_builtin_tool("sleep")
class SleepTool(BaseBuiltinTool):
    """Tool that sleeps for a short duration (1–30 seconds)."""

    name = "Sleep Tool"
    input_schema = SleepToolInputSchema

    @classmethod
    def get_name(cls) -> str:
        return cls.name

    async def arun(self, tool_call_id: str, **params) -> ToolMessage:
        seconds = params.get("seconds", 1)

        # Sleep asynchronously
        await asyncio.sleep(seconds)

        return ToolMessage(
            content=f"Slept for {seconds} seconds.", tool_call_id=tool_call_id
        )
