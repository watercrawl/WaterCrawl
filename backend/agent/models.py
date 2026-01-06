import re

from django.db import models
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _

from agent import consts
from common.models import BaseModel


# Agent
class Agent(BaseModel):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("Team"),
        related_name="agents",
    )

    @cached_property
    def current_published_version(self):
        return self.versions.filter(
            status=consts.AGENT_VERSION_STATUS_PUBLISHED
        ).first()

    @cached_property
    def current_draft_version(self):
        return (
            self.versions.filter(status=consts.AGENT_VERSION_STATUS_DRAFT)
            .order_by("-created_at")
            .first()
        )

    @property
    def status(self):
        if self.current_published_version:
            return consts.AGENT_VERSION_STATUS_PUBLISHED
        elif self.current_draft_version:
            return consts.AGENT_VERSION_STATUS_DRAFT
        return consts.AGENT_VERSION_STATUS_ARCHIVED

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Agent")
        verbose_name_plural = _("Agents")


class AgentVersion(BaseModel):
    agent = models.ForeignKey(
        "agent.Agent",
        on_delete=models.CASCADE,
        verbose_name=_("Agent"),
        related_name="versions",
    )
    status = models.CharField(
        verbose_name=_("Status"),
        choices=consts.AGENT_VERSION_STATUS_CHOICES,
        default=consts.AGENT_VERSION_STATUS_DRAFT,
    )
    system_prompt = models.TextField(
        verbose_name=_("System Prompt"), null=True, blank=True
    )
    provider_config = models.ForeignKey(
        "llm.ProviderConfig",
        on_delete=models.SET_NULL,
        verbose_name=_("Config Provider"),
        related_name="agents",
        null=True,
        blank=True,
    )
    llm_model_key = models.CharField(
        verbose_name=_("LLM Model"),
        max_length=255,
        null=True,
        blank=True,
    )
    llm_configs = models.JSONField(default=dict)

    # JSON output formatting
    json_output = models.BooleanField(
        verbose_name=_("JSON Output"),
        default=False,
        help_text=_("Enable structured JSON output formatting"),
    )
    json_schema = models.JSONField(
        verbose_name=_("JSON Schema"),
        null=True,
        blank=True,
        help_text=_("JSON Schema for structured output format"),
    )

    def __str__(self):
        return self.agent.name

    class Meta:
        verbose_name = _("Agent")
        verbose_name_plural = _("Agents")


class ContextParameters(BaseModel):
    agent_version = models.ForeignKey(
        "agent.AgentVersion",
        verbose_name=_("Agent Version"),
        on_delete=models.CASCADE,
        related_name="parameters",
    )
    parameter_type = models.CharField(
        verbose_name=_("Parameter Type"),
        choices=consts.PARAMETER_TYPE_CHOICES,
        max_length=255,
    )
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    value = models.TextField(
        verbose_name=_("Value"), null=True, blank=True, default=None
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Agent Context Parameter")
        verbose_name_plural = _("Agent Context Parameters")


class Tool(BaseModel):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    description = models.TextField(verbose_name=_("LLM Description"))
    key = models.CharField(verbose_name=_("Key"), max_length=255)
    tool_type = models.CharField(
        verbose_name=_("Tool Type"), choices=consts.TOOL_TYPE_CHOICES, max_length=255
    )
    input_schema = models.JSONField(null=True, blank=True, default=None)
    output_schema = models.JSONField(null=True, blank=True, default=None)
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("Team"),
        related_name="tools",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Tool")
        verbose_name_plural = _("Tools")


class MCPServer(BaseModel):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    url = models.URLField(verbose_name=_("URL"))
    transport_type = models.CharField(
        verbose_name=_("Transport Type"),
        choices=consts.TRANSPORT_TYPE_CHOICES,
        default=consts.TRANSPORT_TYPE_STREAMABLE_HTTP,
        null=True,
        max_length=50,
    )
    status = models.CharField(
        verbose_name=_("Status"),
        choices=consts.MCP_SERVER_STATUS_CHOICES,
        default=consts.MCP_SERVER_STATUS_PENDING,
        max_length=50,
    )
    error_message = models.TextField(
        verbose_name=_("Error Message"), null=True, blank=True
    )
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("Team"),
        related_name="mcp_servers",
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.url

    class Meta:
        verbose_name = _("MCP Server")
        verbose_name_plural = _("MCP Servers")


class MCPServerParameters(BaseModel):
    mcp_server = models.ForeignKey(
        "agent.MCPServer",
        on_delete=models.CASCADE,
        verbose_name=_("MCP Server"),
        related_name="parameters",
    )
    tool_parameter_type = models.CharField(
        verbose_name=_("Tool Parameter Type"),
        choices=consts.TOOL_PARAMETER_TYPE_CHOICES,
        max_length=255,
    )
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    value = models.TextField(verbose_name=_("Value"))


class MCPTool(Tool):
    mcp_server = models.ForeignKey(
        "agent.MCPServer",
        on_delete=models.CASCADE,
        verbose_name=_("MCP Server"),
        related_name="tools",
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("MCP Tool")
        verbose_name_plural = _("MCP Tools")


class APISpec(BaseModel):
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("Team"),
        related_name="api_specs",
        null=True,
        blank=True,
    )
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    api_spec = models.JSONField(default=dict)
    base_url = models.URLField()


class APISpecParameters(BaseModel):
    api_spec = models.ForeignKey(
        "agent.APISpec",
        on_delete=models.CASCADE,
        verbose_name=_("API Spec"),
        related_name="parameters",
    )
    tool_parameter_type = models.CharField(
        verbose_name=_("Tool Parameter Type"),
        choices=consts.TOOL_PARAMETER_TYPE_CHOICES,
        max_length=255,
    )
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    value = models.TextField(verbose_name=_("Value"))


class APISpecTool(Tool):
    api_spec = models.ForeignKey(
        "agent.APISpec",
        on_delete=models.CASCADE,
        verbose_name=_("API Spec"),
        related_name="tools",
    )
    method = models.CharField(verbose_name=_("Method"), max_length=255)
    path = models.CharField(verbose_name=_("Path"), max_length=255)
    content_type = models.CharField(
        verbose_name=_("Content Type"), max_length=255, default="application/json"
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("API Spec Tool")
        verbose_name_plural = _("API Spec Tools")


class AgentTool(BaseModel):
    tool = models.ForeignKey(
        "agent.Tool",
        on_delete=models.CASCADE,
        verbose_name=_("Tool"),
        related_name="agent_tools",
    )
    agent_version = models.ForeignKey(
        "agent.AgentVersion",
        on_delete=models.CASCADE,
        verbose_name=_("Agent"),
        related_name="agent_tools",
    )
    config = models.JSONField()

    def __str__(self):
        return f"{self.agent_version.agent} - {self.tool}"

    class Meta:
        unique_together = ["agent_version", "tool"]
        verbose_name = _("Agent Tool")
        verbose_name_plural = _("Agent Tools")


class AgentKnowledgeBase(BaseModel):
    knowledge_base = models.ForeignKey(
        "knowledge_base.KnowledgeBase",
        on_delete=models.CASCADE,
        verbose_name=_("Knowledge Base"),
        related_name="agent_knowledge_bases",
    )
    agent_version = models.ForeignKey(
        "agent.AgentVersion",
        on_delete=models.CASCADE,
        verbose_name=_("Agent"),
        related_name="agent_knowledge_bases",
    )
    config = models.JSONField(default=dict)

    @cached_property
    def title(self):
        return self.knowledge_base.title

    @cached_property
    def key(self):
        return "search_in_{}".format(
            re.sub(r"[^a-zA-Z0-9_]", "_", self.knowledge_base.title)
        )[:50]

    @cached_property
    def description(self):
        return self.knowledge_base.description

    @property
    def input_schema(self):
        return {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The search query"},
                "filters": {
                    "type": "object",
                    "description": "Additional filters to apply key value pairs. on metadata field.",
                    "properties": {},
                },
            },
            "required": ["query"],
        }

    def __str__(self):
        return f"{self.agent_version.agent} - {self.knowledge_base}"

    class Meta:
        unique_together = ["agent_version", "knowledge_base"]
        verbose_name = _("Agent Knowledge Base")
        verbose_name_plural = _("Agent Knowledge Bases")


class AgentAsTool(BaseModel):
    """
    Model for using another agent as a tool within an agent.
    Allows agents to delegate tasks to other specialized agents.
    """

    tool_agent = models.ForeignKey(
        "agent.Agent",
        on_delete=models.CASCADE,
        verbose_name=_("Tool Agent"),
        related_name="used_as_tool_in",
        help_text=_("The agent to be used as a tool"),
    )
    parent_agent_version = models.ForeignKey(
        "agent.AgentVersion",
        on_delete=models.CASCADE,
        verbose_name=_("Parent Agent Version"),
        related_name="agent_as_tools",
        help_text=_("The agent version that uses this agent as a tool"),
    )
    config = models.JSONField(
        default=dict,
        help_text=_("Configuration for how the tool agent should be invoked"),
    )

    @cached_property
    def name(self):
        """Tool name based on agent name."""
        return self.tool_agent.name

    @cached_property
    def key(self):
        """Unique key for the tool."""
        return "agent_{}".format(
            re.sub(r"[^a-zA-Z0-9_]", "_", self.tool_agent.name.lower())
        )[:50]

    @cached_property
    def description(self):
        """Tool description from agent's system prompt or name."""
        version = (
            self.tool_agent.current_published_version
            or self.tool_agent.current_draft_version
        )
        if version and version.system_prompt:
            # Use first 200 chars of system prompt as description
            return version.system_prompt[:200].strip()
        return f"Delegate tasks to {self.tool_agent.name} agent"

    @property
    def input_schema(self):
        """
        Input schema for the agent tool.
        Accepts a query/instruction for the tool agent.
        The 'inputs' field schema is dynamically generated based on the tool agent's context variables.
        """
        version = (
            self.tool_agent.current_published_version
            or self.tool_agent.current_draft_version
        )

        properties = {
            "query": {
                "type": "string",
                "description": "The task or question to send to the agent",
            }
        }

        required_items = ["query"]

        if version and version.parameters.exists():
            context_vars = version.parameters.all()
            input_props = {}
            required_inputs = []

            for var in context_vars:
                input_props[var.name] = {
                    "type": var.parameter_type,
                    "description": f"Value for {var.name}",
                }
                # If it doesn't have a default value, it might be required
                if not var.value:
                    required_inputs.append(var.name)

            properties["inputs"] = {
                "type": "object",
                "description": "Input variables for the agent context",
                "properties": input_props,
                "additionalProperties": False,
            }
            if required_inputs:
                properties["inputs"]["required"] = required_inputs
                required_items.append("inputs")

        return {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": properties,
            "required": required_items,
        }

    def __str__(self):
        return f"{self.parent_agent_version.agent} uses {self.tool_agent}"

    class Meta:
        unique_together = ["parent_agent_version", "tool_agent"]
        verbose_name = _("Agent as Tool")
        verbose_name_plural = _("Agents as Tools")


class Conversation(BaseModel):
    title = models.CharField(max_length=255, null=True, blank=True)
    user_identifier = models.CharField(max_length=255, null=True, blank=True)
    agent = models.ForeignKey(
        "agent.Agent",
        on_delete=models.CASCADE,
        verbose_name=_("agent"),
        related_name="conversations",
    )
    agent_version = models.ForeignKey(
        "agent.AgentVersion",
        on_delete=models.CASCADE,
        verbose_name=_("agent version"),
        related_name="conversations",
    )
    team = models.ForeignKey(
        "user.Team",
        on_delete=models.CASCADE,
        verbose_name=_("team"),
        related_name="conversations",
    )
    inputs = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _("Conversation")
        verbose_name_plural = _("Conversations")


class MessageBlock(BaseModel):
    conversation = models.ForeignKey(
        "agent.Conversation",
        on_delete=models.CASCADE,
        verbose_name=_("conversation"),
        related_name="blocks",
    )
    role = models.CharField(max_length=20, choices=consts.MESSAGE_ROLE_CHOICES)
    structured_response = models.JSONField(default=None, blank=True, null=True)


class Message(BaseModel):
    conversation = models.ForeignKey(
        "agent.Conversation",
        on_delete=models.CASCADE,
        related_name="messages",
    )
    block = models.ForeignKey(
        "agent.MessageBlock",
        on_delete=models.CASCADE,
        related_name="messages",
    )
    name = models.CharField(max_length=255, blank=True, null=True)
    message_type = models.CharField(max_length=20)
    content = models.JSONField()
    tool_calls = models.JSONField(default=list, blank=True)
    tool_call_id = models.CharField(max_length=255, blank=True, null=True)
    additional_kwargs = models.JSONField(default=dict, blank=True)
    response_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _("Message")
        verbose_name_plural = _("Messages")
        ordering = ["created_at"]
