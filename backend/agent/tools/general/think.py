from typing import Optional, List

from langchain_core.messages import ToolMessage
from pydantic import BaseModel, Field

from agent.tools.base import register_builtin_tool, BaseBuiltinTool


# =============================================================================
# Simple Think Tool - Lightweight reflection
# =============================================================================


class ThinkToolInputSchema(BaseModel):
    reflection: str = Field(
        description="Your reflection on what you've done so far and your plan for the next steps."
    )


@register_builtin_tool("think")
class ThinkTool(BaseBuiltinTool):
    """
    Use this to pause, reflect on what you've done so far based on the user request,
    and plan your next steps before using other tools.

    This is a lightweight thinking tool - use it to:
    - Reflect on progress so far
    - Plan your next action
    - Reason about what tool to use next
    - Consider if you have all the information needed
    """

    name = "Think"
    input_schema = ThinkToolInputSchema

    @classmethod
    def get_name(cls) -> str:
        return cls.name

    async def arun(self, tool_call_id: str, **params) -> ToolMessage:
        reflection = params.get("reflection", "")

        if not reflection:
            return ToolMessage(
                content="Error: reflection is required.", tool_call_id=tool_call_id
            )

        # Simply return the reflection - the value is in the model articulating its thoughts
        return ToolMessage(content=reflection, tool_call_id=tool_call_id)


# =============================================================================
# Deep Think Tool - Structured reasoning with multiple fields
# =============================================================================


class DeepThinkToolInputSchema(BaseModel):
    thought: str = Field(
        description="Your detailed thinking process. Use this to reason through complex problems step by step."
    )
    problem: Optional[str] = Field(
        default=None,
        description="Brief description of the problem you're thinking about",
    )
    considerations: Optional[List[str]] = Field(
        default=None, description="List of key considerations or factors to weigh"
    )
    conclusion: Optional[str] = Field(
        default=None, description="Your conclusion or decision after thinking"
    )


@register_builtin_tool("deep_think")
class DeepThinkTool(BaseBuiltinTool):
    """
    A cognitive tool that allows you to think through problems before acting.

    Use this tool when you need to:
    - Reason through complex multi-step problems
    - Weigh pros and cons before making a decision
    - Break down a difficult task into manageable steps
    - Reflect on information before responding
    - Plan your approach before executing
    - Avoid rushing into potentially incorrect answers

    This tool helps you structure your thinking and ensures you consider
    all aspects of a problem before proceeding. The thought process is
    recorded and returned, helping maintain transparency in reasoning.

    Best practices:
    - Use for complex tasks requiring multiple steps
    - Think before using other tools in sequence
    - Break problems into smaller sub-problems
    - Consider edge cases and potential issues
    - Document your reasoning for complex decisions
    """

    name = "Deep Think"
    input_schema = DeepThinkToolInputSchema

    @classmethod
    def get_name(cls) -> str:
        return cls.name

    async def arun(self, tool_call_id: str, **params) -> ToolMessage:
        thought = params.get("thought", "")
        problem = params.get("problem")
        considerations = params.get("considerations")
        conclusion = params.get("conclusion")

        if not thought:
            return ToolMessage(
                content="❌ Error: 'thought' is required. Please provide your thinking process.",
                tool_call_id=tool_call_id,
            )

        # Build a structured thinking response
        lines = ["🧠 **Thinking Process**", ""]

        if problem:
            lines.append(f"**Problem:** {problem}")
            lines.append("")

        lines.append("**Thought Process:**")
        lines.append(thought)
        lines.append("")

        if considerations:
            lines.append("**Key Considerations:**")
            for i, consideration in enumerate(considerations, 1):
                lines.append(f"  {i}. {consideration}")
            lines.append("")

        if conclusion:
            lines.append(f"**Conclusion:** {conclusion}")
            lines.append("")

        lines.append("---")
        lines.append(
            "✅ Thinking complete. You may now proceed with your planned action."
        )

        return ToolMessage(content="\n".join(lines), tool_call_id=tool_call_id)
