from django.db.transaction import atomic
from rest_framework import serializers
from django.utils.translation import gettext as _

from agent.models import (
    Agent,
    AgentVersion,
    AgentTool,
    AgentKnowledgeBase,
    AgentAsTool,
    Tool,
    APISpec,
    APISpecTool,
    APISpecParameters,
    MCPServer,
    MCPServerParameters,
    MCPTool,
    Conversation,
    Message,
    MessageBlock,
    ContextParameters,
)
from agent.services import ToolService
from llm import consts as llm_consts
from llm.services import ProviderConfigService, ModelAvailabilityService
from user.models import Team


# Agent Serializers
class AgentListSerializer(serializers.ModelSerializer):
    """Serializer for agent list (name and status only)."""

    status = serializers.CharField(read_only=True)

    class Meta:
        model = Agent
        fields = [
            "uuid",
            "name",
            "status",
            "enable_as_tool",
            "tool_function_name",
            "tool_description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "status", "created_at", "updated_at"]

    def validate(self, attrs):
        """Validate tool configuration when enable_as_tool is True."""
        enable_as_tool = attrs.get("enable_as_tool")
        if enable_as_tool is None and self.instance:
            enable_as_tool = self.instance.enable_as_tool

        if enable_as_tool:
            tool_function_name = attrs.get("tool_function_name")
            tool_description = attrs.get("tool_description")

            if tool_function_name is None and self.instance:
                tool_function_name = self.instance.tool_function_name

            if tool_description is None and self.instance:
                tool_description = self.instance.tool_description

            if not tool_function_name or not tool_function_name.strip():
                raise serializers.ValidationError(
                    {
                        "tool_function_name": _(
                            "Tool function name is required when agent is enabled as tool"
                        )
                    }
                )

            if not tool_description or not tool_description.strip():
                raise serializers.ValidationError(
                    {
                        "tool_description": _(
                            "Tool description is required when agent is enabled as tool"
                        )
                    }
                )

        # Check if trying to disable tool feature while being used
        if enable_as_tool is False and self.instance and self.instance.enable_as_tool:
            # Check if agent is being used as tool in other agents
            usage_count = self.instance.used_as_tool_in.count()
            if usage_count > 0:
                raise serializers.ValidationError(
                    {
                        "enable_as_tool": _(
                            f"Cannot disable agent as tool. It is currently being used in {usage_count} agent(s). "
                            "Remove it from those agents first."
                        )
                    }
                )

        return attrs


class AgentRevertDraftSerializer(serializers.Serializer):
    """Serializer for reverting draft version."""

    version_uuid = serializers.UUIDField(help_text="UUID of draft version to revert to")

    def validate_version_uuid(self, value):
        agent: Agent = self.context["agent"]
        version = agent.versions.filter(uuid=value).first()
        if not version:
            raise serializers.ValidationError(_("Version does not exist"))
        if agent.current_draft_version.uuid == value:
            raise serializers.ValidationError(
                _("You cannot revert to current draft version")
            )
        return version


class AgentVersionListSerializer(serializers.ModelSerializer):
    """Serializer for listing agent versions."""

    class Meta:
        model = AgentVersion
        fields = ["uuid", "status", "created_at", "updated_at"]
        read_only_fields = ["uuid", "status", "created_at", "updated_at"]


class ContextParametersSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContextParameters
        fields = ["parameter_type", "name", "value"]


class AgentVersionDetailSerializer(serializers.ModelSerializer):
    """Serializer for agent version details."""

    agent_name = serializers.CharField(source="agent.name", read_only=True)
    provider_config_uuid = serializers.UUIDField(source="provider_config_id")
    llm_configs = serializers.JSONField(default=dict, help_text="LLM model configs")
    parameters = ContextParametersSerializer(
        many=True,
    )

    class Meta:
        model = AgentVersion
        fields = [
            "uuid",
            "agent_name",
            "status",
            "system_prompt",
            "provider_config",
            "provider_config_uuid",
            "llm_model_key",
            "llm_configs",
            "json_output",
            "json_schema",
            "parameters",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "status", "created_at", "updated_at"]

    def validate_provider_config_uuid(self, value):
        team: Team = self.context["team"]
        if (
            not ProviderConfigService.get_team_provider_configs(team=team)
            .filter(uuid=value)
            .exists()
        ):
            raise serializers.ValidationError(_("Provider config not found"))
        return value

    def validate(self, attrs):
        team: Team = self.context["team"]
        llm_model_key = attrs.get("llm_model_key")
        if not llm_model_key:
            return attrs

        provider_config_uuid = attrs.get("provider_config_id")
        if not provider_config_uuid:
            if self.instance:
                provider_config_uuid = self.instance.provider_config_id
            else:
                raise serializers.ValidationError(
                    {"provider_config_uuid": _("Provider config UUID is required")}
                )

        provider_config = (
            ProviderConfigService.get_team_provider_configs(team=team)
            .filter(uuid=provider_config_uuid)
            .first()
        )

        if not provider_config:
            raise serializers.ValidationError(
                {"provider_config_uuid": _("Provider config not found")}
            )

        if not ModelAvailabilityService.is_model_available(
            provider_config=provider_config,
            model_type=llm_consts.MODEL_TYPE_LLM,
            model_key=llm_model_key,
        ):
            raise serializers.ValidationError(
                {"llm_model_key": _("Invalid llm model Key.")}
            )
        return attrs

    @atomic
    def save(self, **kwargs):
        parameters = self.validated_data.pop("parameters", [])
        agent_version = super().save(**kwargs)

        agent_version.parameters.all().delete()

        for context_parameter in parameters:
            agent_version.parameters.create(**context_parameter)
        return agent_version


# Tool Serializers
class ToolListSerializer(serializers.ModelSerializer):
    """Serializer for listing tools."""

    class Meta:
        model = Tool
        fields = [
            "uuid",
            "name",
            "description",
            "key",
            "tool_type",
            "input_schema",
            "output_schema",
            "created_at",
        ]
        read_only_fields = ["uuid", "created_at"]


class AgentToolSerializer(serializers.ModelSerializer):
    """Serializer for agent tools (junction)."""

    tool = ToolListSerializer(read_only=True)
    tool_uuid = serializers.UUIDField(source="tool_id")

    def validate_tool_uuid(self, value):
        """Validate that tool exists."""
        if (
            not ToolService.get_team_tools(self.context["team"])
            .filter(uuid=value)
            .exists()
        ):
            raise serializers.ValidationError(_("Tool not found"))
        return value

    class Meta:
        model = AgentTool
        fields = ["uuid", "tool", "tool_uuid", "config", "created_at"]
        read_only_fields = ["uuid", "tool", "created_at"]


class AgentToolUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating agent tool config."""

    tool = ToolListSerializer(read_only=True)

    class Meta:
        model = AgentTool
        fields = ["uuid", "tool", "config", "created_at"]
        read_only_fields = ["uuid", "tool", "created_at"]


# Knowledge Base Serializers
class AgentKnowledgeBaseSerializer(serializers.ModelSerializer):
    """Serializer for agent knowledge bases."""

    knowledge_base_uuid = serializers.UUIDField(source="knowledge_base_id")

    class Meta:
        model = AgentKnowledgeBase
        fields = [
            "uuid",
            "knowledge_base_uuid",
            "config",
            "created_at",
            "title",
            "key",
            "description",
            "input_schema",
        ]
        read_only_fields = [
            "uuid",
            "knowledge_base",
            "created_at",
            "title",
            "key",
            "description",
            "input_schema",
        ]

    def validate_knowledge_base_uuid(self, value):
        """Validate that knowledge base exists."""
        team: Team = self.context["team"]
        if not team.knowledge_bases.filter(uuid=value).exists():
            raise serializers.ValidationError(_("Knowledge base not found"))
        return value


class AgentKnowledgeBaseUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating knowledge base config."""

    knowledge_base_uuid = serializers.UUIDField(source="knowledge_base_id")

    class Meta:
        model = AgentKnowledgeBase
        fields = [
            "uuid",
            "knowledge_base_uuid",
            "config",
            "created_at",
            "title",
            "key",
            "description",
            "input_schema",
        ]
        read_only_fields = [
            "uuid",
            "knowledge_base_uuid",
            "created_at",
            "title",
            "key",
            "description",
            "input_schema",
        ]


# Agent as Tool Serializers
class AgentAsToolSerializer(serializers.ModelSerializer):
    """Serializer for agent as tool."""

    tool_agent_uuid = serializers.UUIDField(source="tool_agent_id")

    class Meta:
        model = AgentAsTool
        fields = [
            "uuid",
            "tool_agent_uuid",
            "config",
            "created_at",
            "name",
            "key",
            "description",
            "input_schema",
        ]
        read_only_fields = [
            "uuid",
            "tool_agent",
            "created_at",
            "name",
            "key",
            "description",
            "input_schema",
        ]

    def validate_tool_agent_uuid(self, value):
        """Validate that tool agent exists and is not the same as parent agent."""
        team: Team = self.context["team"]

        # Check if agent exists and belongs to team
        try:
            tool_agent = team.agents.get(uuid=value)
        except Agent.DoesNotExist:
            raise serializers.ValidationError(_("Agent not found"))

        # Check if agent is enabled as tool
        if not tool_agent.enable_as_tool:
            raise serializers.ValidationError(
                _("This agent is not enabled to be used as a tool")
            )

        # Check if agent is published
        if not tool_agent.current_published_version:
            raise serializers.ValidationError(
                _("Only published agents can be used as tools")
            )

        # Prevent self-reference
        parent_agent_version = self.context.get("parent_agent_version")
        if parent_agent_version and tool_agent == parent_agent_version.agent:
            raise serializers.ValidationError(_("Agent cannot use itself as a tool"))

        return value


class AgentAsToolUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating agent tool config."""

    tool_agent_uuid = serializers.UUIDField(source="tool_agent_id")

    class Meta:
        model = AgentAsTool
        fields = [
            "uuid",
            "tool_agent_uuid",
            "config",
            "created_at",
            "name",
            "key",
            "description",
            "input_schema",
        ]
        read_only_fields = [
            "uuid",
            "tool_agent_uuid",
            "created_at",
            "name",
            "key",
            "description",
            "input_schema",
        ]


class APISpecParametersSerializer(serializers.ModelSerializer):
    value = serializers.CharField(write_only=True, allow_null=True)

    class Meta:
        model = APISpecParameters
        fields = ["uuid", "tool_parameter_type", "name", "value"]
        read_only_fields = ["uuid"]

    def validate_value(self, value):
        is_update = self.context.get("is_update")
        if not value and not is_update:
            raise serializers.ValidationError(_("Value is required"))
        return value


class APISpecToolSerializer(serializers.ModelSerializer):
    """Serializer for API spec tools."""

    class Meta:
        model = APISpecTool
        fields = [
            "uuid",
            "name",
            "description",
            "key",
            "method",
            "path",
            "input_schema",
            "output_schema",
            "created_at",
        ]
        read_only_fields = ["uuid", "created_at"]


# API Spec Tool Serializers
class APISpecSerializer(serializers.ModelSerializer):
    """Serializer for creating API spec tools."""

    parameters = APISpecParametersSerializer(many=True, required=False)
    tools = APISpecToolSerializer(many=True, read_only=True)
    api_spec = serializers.JSONField(write_only=True, required=False, allow_null=True)

    def validate_api_spec(self, value):
        is_update = self.context["is_update"]
        if not is_update and not value:
            raise serializers.ValidationError(_("Value is required"))
        return value

    class Meta:
        model = APISpec
        fields = [
            "uuid",
            "name",
            "api_spec",
            "base_url",
            "parameters",
            "tools",
            "created_at",
        ]
        read_only_fields = ["uuid", "created_at"]
        extra_kwargs = {"api_spec": {"write_only": True}}


# MCP Tool Serializers
class MCPServerParametersSerializer(serializers.ModelSerializer):
    value = serializers.CharField(write_only=True, allow_null=True)

    class Meta:
        model = MCPServerParameters
        fields = ["uuid", "tool_parameter_type", "name", "value"]
        read_only_fields = ["uuid"]

    def validate_value(self, value):
        is_update = self.context.get("is_update")
        if not value and not is_update:
            raise serializers.ValidationError(_("Value is required"))
        return value


class MCPToolSerializer(serializers.ModelSerializer):
    """Serializer for MCP tools."""

    mcp_server_name = serializers.CharField(source="mcp_server.name", read_only=True)

    class Meta:
        model = MCPTool
        fields = [
            "uuid",
            "name",
            "description",
            "key",
            "mcp_server",
            "mcp_server_name",
            "input_schema",
            "output_schema",
            "created_at",
        ]
        read_only_fields = ["uuid", "mcp_server_name", "created_at"]


class MCPServerSerializer(serializers.ModelSerializer):
    """Serializer for MCP servers with parameters and tools."""

    parameters = MCPServerParametersSerializer(many=True, required=False)
    tools = MCPToolSerializer(many=True, read_only=True)

    class Meta:
        model = MCPServer
        fields = [
            "uuid",
            "name",
            "url",
            "transport_type",
            "status",
            "error_message",
            "parameters",
            "tools",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "uuid",
            "status",
            "error_message",
            "created_at",
            "updated_at",
        ]


# Tool Test Serializers
class ToolTestRequestSerializer(serializers.Serializer):
    """Serializer for testing a tool with input parameters."""

    input = serializers.JSONField(
        required=False,
        default=dict,
        help_text="Input parameters for the tool (based on tool's input_schema)",
    )


class ToolTestResponseSerializer(serializers.Serializer):
    """Serializer for tool test response."""

    success = serializers.BooleanField(
        help_text="Whether the tool execution was successful"
    )
    content = serializers.CharField(
        allow_null=True, help_text="Text content from the response"
    )
    artifact = serializers.JSONField(
        allow_null=True, help_text="Artifact data (files, images, etc.)"
    )
    error = serializers.CharField(
        allow_null=True, required=False, help_text="Error message if execution failed"
    )


# Chat Serializers
class ChatMessageRequestSerializer(serializers.Serializer):
    """Serializer for chat message request."""

    query = serializers.CharField(
        required=True, help_text="User input/question content"
    )
    inputs = serializers.JSONField(
        required=False, default=dict, help_text="Variables for the conversation"
    )
    user = serializers.CharField(
        required=True, help_text="User identifier for retrieval and statistics"
    )
    conversation_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        help_text="Conversation ID to continue previous chat",
    )
    files = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list,
        help_text="List of Media file UUIDs to attach to the message",
    )
    output_schema = serializers.JSONField(
        required=False,
        allow_null=True,
        default=None,
        help_text=(
            "JSON Schema for structured output format. Required when agent has "
            "json_output=True but no predefined json_schema. Must be a valid JSON Schema object."
        ),
    )
    event_types = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_null=True,
        default=None,
        help_text=(
            "Optional list of event types to filter. Only specified event types will be sent. "
            "Available types: 'message', 'tool_call', 'tool_result', 'conversation', 'title', 'done', 'error', 'ping'. "
            "If not provided, all events are sent."
        ),
    )


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for message."""

    class Meta:
        model = Message
        fields = [
            "uuid",
            "name",
            "message_type",
            "content",
            "tool_calls",
            "additional_kwargs",
            "response_metadata",
            "tool_call_id",
            "created_at",
        ]
        read_only_fields = ["uuid", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversation."""

    class Meta:
        model = Conversation
        fields = [
            "uuid",
            "title",
            "user_identifier",
            "agent",
            "agent_version",
            "inputs",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uuid", "created_at", "updated_at"]


class OauthRedirectResponseSerializer(serializers.Serializer):
    """Serializer for OAuth redirect response."""

    redirect_url = serializers.CharField(help_text="Redirect URL for OAuth flow")


class MessageBlockSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = MessageBlock
        fields = ["uuid", "conversation_id", "role", "structured_response", "messages"]
