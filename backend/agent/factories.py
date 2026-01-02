"""
Agent Factory Module

This module provides factory classes for creating configured agents with tools,
knowledge bases, and LLM integration. It follows the factory pattern similar to
the LLM module and provides clean abstractions for agent creation.
"""

import logging
import re
from typing import Dict, List, Any, Optional

from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import ToolMessage
from langchain_core.runnables import Runnable
from langchain_core.tools import Tool, StructuredTool
from langchain_ollama import ChatOllama

from agent import consts
from agent.executors import (
    MCPToolExecutor,
    APISpecToolExecutor,
    ToolExecutor,
    BuiltinToolExecutor,
    KnowledgeBaseQuestionExecutor,
    AgentToolExecutor,
)
from agent.parameter_strategy import ParameterStrategyProcessor
from agent.models import (
    AgentVersion,
    Tool as ToolModel,
    APISpecTool,
    MCPTool,
    AgentKnowledgeBase,
    AgentAsTool,
)
from agent.tools.base import StructuredToolWithToolCallId
from knowledge_base.models import RetrievalSetting
from llm.factories import ChatModelFactory

logger = logging.getLogger(__name__)


class AgentFactory:
    """
    Factory class for creating configured LangChain agents.

    This factory handles:
    - Creating chat models from provider configs
    - Converting database tools to LangChain tools
    - Setting up knowledge base retrieval
    - Creating agent executors with proper prompts
    """

    @classmethod
    def create_agent(
        cls,
        agent_version: AgentVersion,
        context_variables: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        sub_agent: bool = False,
        output_schema: Optional[Dict[str, Any]] = None,
    ) -> Runnable:
        """
        Create a LangChain agent from an agent version.

        Args:
            agent_version: The AgentVersion model instance
            context_variables: Optional dict of context variables to substitute
                              in the system prompt. Keys should match {{KEY}}
                              patterns in the prompt.
            context: Optional context dict containing team, agent, agent_version, conversation
                    for media library integration.
            sub_agent: Whether this agent is being used as a sub-agent
            output_schema: Optional JSON Schema for structured output. Used when agent has
                          json_output=True but no predefined json_schema (dynamic schema mode).

        Returns:
            Runnable agent instance
        """
        tools = cls._create_tools(agent_version, context=context)

        # Process system prompt with context variables
        system_prompt = cls._process_system_prompt(
            agent_version, context_variables or {}
        )

        chat_model = cls._create_chat_model(agent_version)

        # Build agent kwargs
        agent_kwargs = {
            "model": chat_model,
            "tools": tools,
            # "middleware": [TodoListMiddleware()],
            "system_prompt": system_prompt,
        }

        # Apply structured JSON output if enabled
        # Three states:
        # 1. json_output=False: No structured output
        # 2. json_output=True, json_schema set: Use predefined schema from agent
        # 3. json_output=True, json_schema=None: Use dynamic schema from API request (output_schema)
        if agent_version.json_output:
            schema_to_use = agent_version.json_schema or output_schema
            if schema_to_use:
                response_schema = cls._prepare_response_schema(
                    schema_to_use, agent_version.agent.name
                )

                if isinstance(chat_model, ChatOllama):
                    agent_kwargs["response_format"] = ToolStrategy(response_schema)
                else:
                    agent_kwargs["response_format"] = response_schema

        if sub_agent:
            agent_kwargs["name"] = f"{agent_version.uuid.hex}_sub_agent"

        return create_agent(**agent_kwargs)

    @classmethod
    def _prepare_response_schema(
        cls, schema: Dict[str, Any], agent_name: str
    ) -> Dict[str, Any]:
        """
        Prepare JSON schema for use as response_format.

        Ensures the schema has required top-level 'title' and 'description' keys.
        The title/name must match pattern ^[a-zA-Z0-9_-]+$
        """
        prepared_schema = schema.copy()

        # Sanitize name for OpenAI API (must match ^[a-zA-Z0-9_-]+$)
        safe_name = re.sub(r"[^a-zA-Z0-9_-]", "_", agent_name)
        # Remove consecutive underscores and leading/trailing underscores
        safe_name = re.sub(r"_+", "_", safe_name).strip("_")
        if not safe_name:
            safe_name = "AgentResponse"

        # Add title if missing (sanitize existing title too)
        if "title" not in prepared_schema:
            prepared_schema["title"] = f"{safe_name}_Response"
        else:
            # Sanitize existing title
            existing_title = prepared_schema["title"]
            prepared_schema["title"] = re.sub(r"[^a-zA-Z0-9_-]", "_", existing_title)

        # Add description if missing
        if "description" not in prepared_schema:
            prepared_schema["description"] = (
                f"Structured response format for {agent_name}"
            )

        return prepared_schema

    @classmethod
    def _create_chat_model(
        cls,
        agent_version: AgentVersion,
    ) -> BaseChatModel:
        return ChatModelFactory.create_chat_model_from_provider_config(
            provider_config=agent_version.provider_config,
            llm_model_key=agent_version.llm_model_key,
        )

    @classmethod
    def _create_tools(
        cls, agent_version: AgentVersion, context: Optional[Dict[str, Any]] = None
    ) -> List[Tool]:
        """Create LangChain tools from agent tools."""
        tools = []

        # Add regular tools (built-in, API spec, MCP)
        for agent_tool in agent_version.agent_tools.select_related("tool").all():
            langchain_tool = ToolFactory.create_tool(
                tool=agent_tool.tool,
                config=agent_tool.config,
                context=context,
            )
            tools.append(langchain_tool)

        # Add knowledge base retrieval tools
        for agent_kb in agent_version.agent_knowledge_bases.select_related(
            "knowledge_base"
        ).all():
            kb_tool = KnowledgeBaseToolFactory.create_knowledge_base_tool(
                agent_version=agent_version,
                agent_kb=agent_kb,
                context=context,
            )
            tools.append(kb_tool)

        # Add agent-as-tool functionality
        for agent_as_tool in agent_version.agent_as_tools.select_related(
            "tool_agent"
        ).all():
            agent_tool_instance = AgentToolFactory.create_agent_tool(
                agent_as_tool=agent_as_tool,
                context=context,
            )
            tools.append(agent_tool_instance)

        return tools

    @classmethod
    def _process_system_prompt(
        cls, agent_version: AgentVersion, context_variables: Dict[str, Any]
    ) -> str:
        """
        Process system prompt by substituting context variables.

        Replaces {{VARIABLE_NAME}} patterns with their corresponding values
        from the context_variables dict.

        Args:
            system_prompt: The raw system prompt with variable placeholders
            context_variables: Dict mapping variable names to their values

        Returns:
            Processed system prompt with variables substituted
        """
        if not agent_version.system_prompt or not context_variables:
            return agent_version.system_prompt

        default_parameters = agent_version.parameters.values("name", "value")
        default_parameters = {
            param["name"]: param["value"] for param in default_parameters
        }

        def replace_var(match: re.Match) -> str:
            var_name = match.group(1)
            value = default_parameters.get(var_name)
            if var_name in context_variables:
                value = context_variables[var_name] or value

            return value

        # Match {{VARIABLE_NAME}} patterns
        pattern = r"\{\{([A-Za-z_][A-Z0-9_]*)\}\}"
        return re.sub(pattern, replace_var, agent_version.system_prompt)


class ToolFactory:
    """
    Factory for creating LangChain tools from database tool models.

    Supports different tool types:
    - API Spec tools (REST APIs from OpenAPI specs)
    - MCP tools (Model Context Protocol servers)
    - Built-in tools (custom Python functions)
    """

    @classmethod
    def create_tool(
        cls,
        tool: ToolModel,
        config: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> StructuredTool:
        """
        Create a LangChain tool from a database tool model.

        Args:
            tool: The Tool model instance
            config: Configuration for this specific tool usage
            context: Optional context dict for media library integration

        Returns:
            LangChain Tool instance
        """

        if tool.tool_type == consts.TOOL_TYPE_API_SPEC:
            return APISpecToolFactory.create_tool(tool, config, context=context)
        elif tool.tool_type == consts.TOOL_TYPE_MCP:
            return MCPToolFactory.create_tool(tool, config, context=context)
        elif tool.tool_type == consts.TOOL_TYPE_BUILT_IN:
            return BuiltInToolFactory.create_tool(tool, config, context=context)
        else:
            raise ValueError(f"Unsupported tool type: {tool.tool_type}")


class BaseToolFactory:
    """Base factory class for creating LangChain tools."""

    @classmethod
    def create_tool(cls, tool: ToolModel, config: Dict[str, Any]) -> StructuredTool:
        raise NotImplementedError

    @classmethod
    def make_with_executor(
        cls, tool: ToolModel, executor: ToolExecutor, config: Dict[str, Any]
    ) -> StructuredToolWithToolCallId:
        # Process parameter strategies
        processor = ParameterStrategyProcessor(config)
        original_schema = tool.input_schema or {}
        modified_schema, fixed_values = processor.process_schema(original_schema)

        sync_func = cls._create_sync_wrapper(executor.execute, fixed_values, processor)
        async_func = cls._create_async_wrapper(
            executor.aexecute, fixed_values, processor
        )

        # Use custom function_name and description from config if provided
        function_name = config.get("function_name") or tool.key.replace(".", "_")
        description = config.get("description") or tool.description

        return StructuredToolWithToolCallId(
            name=function_name,
            description=description,
            func=sync_func,
            coroutine=async_func,
            args_schema=modified_schema
            if modified_schema.get("properties")
            else original_schema,
        )

    @staticmethod
    def _create_sync_wrapper(
        original_func,
        fixed_values: Dict[str, Any],
        processor: ParameterStrategyProcessor,
    ):
        """Create a sync wrapper that injects fixed values."""

        def wrapper(tool_call_id, **kwargs):
            merged_params = processor.merge_params(kwargs, fixed_values)
            try:
                return original_func(tool_call_id=tool_call_id, **merged_params)
            except Exception as e:
                return ToolMessage(
                    tool_call_id=tool_call_id, content=str(e), type="error"
                )

        return wrapper

    @staticmethod
    def _create_async_wrapper(
        original_coro,
        fixed_values: Dict[str, Any],
        processor: ParameterStrategyProcessor,
    ):
        """Create an async wrapper that injects fixed values."""

        async def wrapper(tool_call_id, **kwargs):
            merged_params = processor.merge_params(kwargs, fixed_values)
            try:
                return await original_coro(tool_call_id=tool_call_id, **merged_params)
            except Exception as e:
                return ToolMessage(
                    tool_call_id=tool_call_id, content=str(e), type="error"
                )

        return wrapper


class APISpecToolFactory(BaseToolFactory):
    """
    Factory for creating LangChain tools from OpenAPI specifications.

    Converts OpenAPI operation definitions into callable LangChain tools
    that make HTTP requests to the specified endpoints.
    """

    @classmethod
    def create_tool(
        cls,
        tool: ToolModel,
        config: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> StructuredTool:
        """
        Create a LangChain tool from an API Spec tool.

        Args:
            tool: APISpecTool model instance
            config: Configuration including parameter strategies
            context: Optional context dict for media library integration

        Returns:
            StructuredTool that makes HTTP requests
        """
        if not isinstance(tool, APISpecTool):
            tool = APISpecTool.objects.get(pk=tool.pk)

        executor = APISpecToolExecutor(tool, context=context)

        # Create wrapper functions if there are fixed values
        return cls.make_with_executor(tool, executor, config)


class MCPToolFactory(BaseToolFactory):
    """
    Factory for creating LangChain tools from MCP (Model Context Protocol) servers.

    Integrates with MCP servers to provide dynamic tool discovery and execution.
    Uses the official MCP Python SDK.
    """

    @classmethod
    def create_tool(
        cls,
        tool: ToolModel,
        config: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> StructuredToolWithToolCallId:
        """
        Create a LangChain tool from an MCP tool.

        Args:
            tool: MCPTool model instance
            config: Configuration including parameter strategies
            context: Optional context dict for media library integration

        Returns:
            StructuredTool that calls MCP server
        """
        if not isinstance(tool, MCPTool):
            tool = MCPTool.objects.get(pk=tool.pk)

        mcp_server = tool.mcp_server

        # Create the tool function
        executor = MCPToolExecutor(mcp_server, tool.name, context=context)

        return cls.make_with_executor(tool, executor, config)


class BuiltInToolFactory(BaseToolFactory):
    """
    Factory for creating built-in LangChain tools.

    These are custom Python functions registered in the system.
    """

    @classmethod
    def create_tool(
        cls,
        tool: ToolModel,
        config: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> StructuredToolWithToolCallId:
        """Create a LangChain tool from a built-in tool."""
        executor = BuiltinToolExecutor(tool, context=context)
        return cls.make_with_executor(tool, executor, config)


class KnowledgeBaseToolFactory:
    """
    Factory for creating knowledge base tools.

    Creates LangChain tools that can query knowledge bases using retrieval settings.
    """

    @classmethod
    def create_knowledge_base_tool(
        cls,
        agent_version: AgentVersion,
        agent_kb: AgentKnowledgeBase,
        context: Optional[Dict[str, Any]] = None,
    ) -> StructuredToolWithToolCallId:
        """
        Create a LangChain tool for querying a knowledge base.

        Args:
            agent_version: The AgentVersion instance
            agent_kb: AgentKnowledgeBase instance with config
            context: Optional context dict for media library integration

        Returns:
            StructuredTool that queries the knowledge base
        """

        knowledge_base = agent_kb.knowledge_base
        config = agent_kb.config or {}

        # Get retrieval setting from config
        retrieval_setting = None
        retrieval_setting_uuid = config.get("retrieval_setting_uuid")
        if retrieval_setting_uuid:
            retrieval_setting = RetrievalSetting.objects.filter(
                knowledge_base=knowledge_base, uuid=retrieval_setting_uuid
            ).first()

        # Use default if no retrieval setting specified
        if not retrieval_setting:
            retrieval_setting = knowledge_base.default_retrieval_setting

        if not retrieval_setting:
            raise ValueError(
                f"Knowledge base {knowledge_base.title} has no retrieval settings configured"
            )

        # Create executor
        executor = KnowledgeBaseQuestionExecutor(
            knowledge_base=knowledge_base,
            retrieval_setting=retrieval_setting,
            context=context,
        )

        return cls._make_with_executor(agent_kb, executor, config)

    @classmethod
    def _make_with_executor(
        cls,
        agent_kb: AgentKnowledgeBase,
        executor: KnowledgeBaseQuestionExecutor,
        config: Dict[str, Any],
    ):
        # Process parameter strategies
        processor = ParameterStrategyProcessor(config)
        original_schema = agent_kb.input_schema or {}
        modified_schema, fixed_values = processor.process_schema(original_schema)

        sync_func = cls._create_sync_wrapper(executor.execute, fixed_values, processor)
        async_func = cls._create_async_wrapper(
            executor.aexecute, fixed_values, processor
        )

        # Use custom function_name and description from config if provided
        function_name = config.get("function_name") or agent_kb.key
        description = config.get("description") or agent_kb.description

        return StructuredToolWithToolCallId(
            name=function_name,
            description=description,
            func=sync_func,
            coroutine=async_func,
            args_schema=modified_schema
            if modified_schema.get("properties")
            else original_schema,
        )

    @staticmethod
    def _create_sync_wrapper(
        original_func,
        fixed_values: Dict[str, Any],
        processor: ParameterStrategyProcessor,
    ):
        """Create a sync wrapper that injects fixed values."""

        def wrapper(tool_call_id, **kwargs):
            merged_params = processor.merge_params(kwargs, fixed_values)
            try:
                return original_func(tool_call_id=tool_call_id, **merged_params)
            except Exception as e:
                return ToolMessage(
                    tool_call_id=tool_call_id, content=str(e), type="error"
                )

        return wrapper

    @staticmethod
    def _create_async_wrapper(
        original_coro,
        fixed_values: Dict[str, Any],
        processor: ParameterStrategyProcessor,
    ):
        """Create an async wrapper that injects fixed values."""

        async def wrapper(tool_call_id, **kwargs):
            merged_params = processor.merge_params(kwargs, fixed_values)
            try:
                return await original_coro(tool_call_id=tool_call_id, **merged_params)
            except Exception as e:
                return ToolMessage(
                    tool_call_id=tool_call_id, content=str(e), type="error"
                )

        return wrapper


class AgentToolFactory:
    """
    Factory for creating agent-as-tool functionality.

    Allows one agent to delegate tasks to another specialized agent.
    """

    @classmethod
    def create_agent_tool(
        cls,
        agent_as_tool: AgentAsTool,
        context: Optional[Dict[str, Any]] = None,
    ) -> StructuredToolWithToolCallId:
        """
        Create a LangChain tool that executes another agent.

        Args:
            agent_as_tool: AgentAsTool instance with config
            context: Optional context dict for execution

        Returns:
            StructuredTool that executes the agent
        """
        tool_agent = agent_as_tool.tool_agent
        config = agent_as_tool.config or {}

        # Get the published version or draft version of the tool agent
        agent_version = (
            tool_agent.current_published_version or tool_agent.current_draft_version
        )

        if not agent_version:
            raise ValueError(
                f"Agent {tool_agent.name} has no published or draft version available"
            )

        # Create executor
        executor = AgentToolExecutor(agent_version=agent_version, context=context)

        return cls._make_with_executor(agent_as_tool, executor, config)

    @classmethod
    def _make_with_executor(
        cls,
        agent_as_tool: AgentAsTool,
        executor: AgentToolExecutor,
        config: Dict[str, Any],
    ):
        """Create structured tool with executor."""
        # Process parameter strategies
        processor = ParameterStrategyProcessor(config)
        original_schema = agent_as_tool.input_schema or {}
        modified_schema, fixed_values = processor.process_schema(original_schema)

        sync_func = cls._create_sync_wrapper(executor.execute, fixed_values, processor)
        async_func = cls._create_async_wrapper(
            executor.aexecute, fixed_values, processor
        )

        # Use custom function_name and description from config if provided
        function_name = config.get("function_name") or agent_as_tool.key
        description = config.get("description") or agent_as_tool.description

        return StructuredToolWithToolCallId(
            name=function_name,
            description=description,
            func=sync_func,
            coroutine=async_func,
            args_schema=modified_schema
            if modified_schema.get("properties")
            else original_schema,
        )

    @staticmethod
    def _create_sync_wrapper(
        original_func,
        fixed_values: Dict[str, Any],
        processor: ParameterStrategyProcessor,
    ):
        """Create a sync wrapper that injects fixed values."""

        def wrapper(tool_call_id, **kwargs):
            merged_params = processor.merge_params(kwargs, fixed_values)
            try:
                return original_func(tool_call_id=tool_call_id, **merged_params)
            except Exception as e:
                return ToolMessage(
                    tool_call_id=tool_call_id, content=str(e), type="error"
                )

        return wrapper

    @staticmethod
    def _create_async_wrapper(
        original_coro,
        fixed_values: Dict[str, Any],
        processor: ParameterStrategyProcessor,
    ):
        """Create an async wrapper that injects fixed values."""

        async def wrapper(tool_call_id, **kwargs):
            merged_params = processor.merge_params(kwargs, fixed_values)
            try:
                return await original_coro(tool_call_id=tool_call_id, **merged_params)
            except Exception as e:
                return ToolMessage(
                    tool_call_id=tool_call_id, content=str(e), type="error"
                )

        return wrapper
