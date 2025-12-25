import asyncio
import pkgutil
import importlib
from abc import abstractmethod, ABC
from typing import Dict, Type, Any, Optional, Union

from django.utils.translation import gettext as _
from langchain_core.messages import ToolMessage
from langchain_core.tools import StructuredTool
from langgraph.types import Command
from pydantic import BaseModel

from agent.models import Tool
import agent.tools
from user.services import MediaService


class SaveFileMixin:
    context: Optional[Dict[str, Any]]

    async def save_file(self, file_name, file_content: bytes) -> Optional[str]:
        """Save file using media library if context is available, otherwise use legacy storage."""

        # If context is available, use media library
        team = self.context.get("team")
        agent = self.context.get("agent")
        conversation = self.context.get("conversation")
        agent_version = self.context.get("agent_version")

        if team:
            # Determine content type from file extension
            import mimetypes

            content_type, _ = mimetypes.guess_type(file_name)
            if not content_type:
                content_type = "application/octet-stream"

            # Build metadata
            metadata = {}
            if conversation:
                metadata["conversation_id"] = str(conversation.uuid)
            if agent_version:
                metadata["agent_version_id"] = str(agent_version.uuid)

            # Save to media library
            media_service = await MediaService.asave_file(
                team=team,
                file_name=file_name,
                file_content=file_content,
                content_type=content_type,
                related_object=agent,  # Agent is the related object
                metadata=metadata,
            )

            # Return the download URL
            return media_service.media.download_url

        return None


class StructuredToolWithToolCallId(StructuredTool):
    def _parse_input(
        self, tool_input: str | dict, tool_call_id: str | None
    ) -> str | dict[str, Any]:
        tool_input = super()._parse_input(tool_input, tool_call_id)
        tool_input["tool_call_id"] = tool_call_id
        return tool_input


class BaseBuiltinTool(SaveFileMixin, ABC):
    name: str
    input_schema: Optional[BaseModel] = None
    output_model: Optional[BaseModel] = None
    description: Optional[str] = None

    def __init__(self, tool: Tool, context: Optional[Dict[str, Any]] = None):
        self.tool = tool
        self.context = context or {}

    @classmethod
    def get_name(cls):
        if not cls.name:
            raise ValueError(
                _("Tool with Type {tool_type} has no attribute name.").format(
                    tool_type=cls.__name__
                )
            )
        return cls.name

    @classmethod
    def get_description(cls) -> str:
        if cls.description:
            return cls.description
        if cls.__doc__:
            return cls.__doc__.strip()

        raise ValueError(
            _("{tool_type} has no attribute description.").format(
                tool_type=cls.__name__
            )
        )

    @classmethod
    def get_input_schema(cls) -> Optional[Dict[str, Any]]:
        if not cls.input_schema:
            return None
        return cls.input_schema.model_json_schema()

    @classmethod
    def get_output_schema(cls) -> Optional[Dict[str, Any]]:
        if not cls.output_model:
            return None
        return cls.output_model.model_json_schema()

    @abstractmethod
    async def arun(self, tool_call_id: str, **params) -> Union[ToolMessage, Command]:
        """
        Execute the tool asynchronously.

        Returns:
            Either a ToolMessage for simple responses, or a Command for state updates.
            When returning Command, include both state updates and messages:

            return Command(
                update={
                    "my_state_field": new_value,
                    "messages": [ToolMessage(content="...", tool_call_id=tool_call_id)],
                }
            )
        """
        ...

    def run(self, tool_call_id: str, **params) -> Union[ToolMessage, Command]:
        return asyncio.run(self.arun(tool_call_id, **params))


class BuiltinToolRegistry:
    _tools: Dict[str, Type[BaseBuiltinTool]] = {}
    _autodiscovered: bool = False

    @classmethod
    def register(cls, key, tool: Type[BaseBuiltinTool]):
        cls._tools[key] = tool

    @classmethod
    def get(cls, tool_key: str) -> Type[BaseBuiltinTool]:
        if tool_key not in cls._tools:
            raise ValueError(_("Tool {tool_key} not found").format(tool_key=tool_key))
        return cls._tools.get(tool_key)

    @classmethod
    def read_all(cls) -> Dict[str, Type[BaseBuiltinTool]]:
        return cls._tools

    @classmethod
    def autodiscover(cls) -> None:
        if cls._autodiscovered:
            return
        cls._autodiscovered = True

        def walk_packages(package):
            package_path = package.__path__

            for finder, modname, ispkg in pkgutil.iter_modules(package_path):
                full_name = f"{package.__name__}.{modname}"

                # Import the module (this triggers decorator registration)
                module = importlib.import_module(full_name)

                # If it's a subpackage, recursively walk it
                if ispkg:
                    walk_packages(module)

        walk_packages(agent.tools)


def register_builtin_tool(tool_key: str):
    def decorator(tool: Type[BaseBuiltinTool]):
        return BuiltinToolRegistry.register(tool_key, tool)

    return decorator
