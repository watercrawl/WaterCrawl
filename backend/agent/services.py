from typing import List, Optional, Dict

from django.core.exceptions import ValidationError
from django.db.models import Q
from django.db.transaction import atomic
from django.utils.translation import gettext as _

from agent import consts
from agent.models import (
    Agent,
    AgentVersion,
    AgentTool,
    AgentKnowledgeBase,
    AgentAsTool,
    Tool,
    APISpec,
    APISpecTool,
    MCPServer,
)
from agent.parsers.api_spec_parsers import APISpecParser
from common.encryption import encrypt_key
from locker import redis_lock
from user.models import Team


class AgentService:
    """Service for managing agents."""

    def __init__(self, agent: Agent):
        self.agent = agent

    @classmethod
    def make_with_pk(cls, pk: str) -> "AgentService":
        """Get agent by primary key."""
        return cls(Agent.objects.get(pk=pk))

    def get_or_create_draft(self) -> AgentVersion:
        """Get current draft or create one (copy from published if exists)."""
        with redis_lock(self.agent.uuid):
            draft = self.agent.current_draft_version

            if draft:
                return draft

            # Check if published version exists
            published = self.agent.current_published_version

            if published:
                # Copy from published
                draft = self.revert_to_version(published)
            else:
                # Create new draft
                draft = AgentVersion.objects.create(
                    agent=self.agent, status=consts.AGENT_VERSION_STATUS_DRAFT
                )

            return draft

    def revert_to_version(self, version: AgentVersion):
        """Revert to a specific version."""

        # Archive all versions except draft
        self.agent.versions.exclude(uuid=version.uuid).filter(
            status=consts.AGENT_VERSION_STATUS_DRAFT
        ).update(status=consts.AGENT_VERSION_STATUS_ARCHIVED)

        draft = AgentVersion.objects.create(
            agent=self.agent,
            status=consts.AGENT_VERSION_STATUS_DRAFT,
            system_prompt=version.system_prompt,
            provider_config=version.provider_config,
            llm_model_key=version.llm_model_key,
            llm_configs=version.llm_configs.copy() if version.llm_configs else {},
            json_output=version.json_output,
            json_schema=version.json_schema.copy() if version.json_schema else None,
        )

        # Copy tools
        for agent_tool in version.agent_tools.all():
            AgentTool.objects.create(
                agent_version=draft,
                tool=agent_tool.tool,
                config=agent_tool.config.copy(),
            )

        # Copy knowledge bases
        for agent_kb in version.agent_knowledge_bases.all():
            AgentKnowledgeBase.objects.create(
                agent_version=draft,
                knowledge_base=agent_kb.knowledge_base,
                config=agent_kb.config.copy(),
            )

        # Copy subagents (agents used as tools)
        for agent_as_tool in version.agent_as_tools.all():
            AgentAsTool.objects.create(
                parent_agent_version=draft,
                tool_agent=agent_as_tool.tool_agent,
                config=agent_as_tool.config.copy(),
            )

        # Copy Context Parameters
        for context_parameter in version.parameters.all():
            draft.parameters.create(
                name=context_parameter.name,
                value=context_parameter.value,
                parameter_type=context_parameter.parameter_type,
            )

        return draft


class AgentVersionService:
    """Service for managing agent versions."""

    def __init__(self, agent_version: AgentVersion):
        self.agent_version = agent_version

    @classmethod
    def make_with_pk(cls, pk: str) -> "AgentVersionService":
        """Get agent version by primary key."""
        return cls(AgentVersion.objects.get(pk=pk))

    def publish(self) -> AgentVersion:
        """Publish draft version (archive current published)."""
        errors = self.has_error()
        if errors:
            raise ValidationError(errors)

        # Archive all versions except draft
        self.agent_version.agent.versions.exclude(uuid=self.agent_version.uuid).update(
            status=consts.AGENT_VERSION_STATUS_ARCHIVED
        )

        # Publish draft
        self.agent_version.status = consts.AGENT_VERSION_STATUS_PUBLISHED
        self.agent_version.save(update_fields=["status", "updated_at"])

        return self.agent_version

    def has_error(self) -> Dict[str, Optional[str]]:
        errors = {}
        if self.agent_version.status == consts.AGENT_VERSION_STATUS_PUBLISHED:
            errors["error"] = _("Published version cannot be edited.")
            return errors

        if self.agent_version.system_prompt is None:
            errors["system_prompt"] = _("System prompt is required.")

        if self.agent_version.provider_config is None:
            errors["provider_config"] = _("Provider config is required.")

        if self.agent_version.llm_model_key is None:
            errors["llm_model"] = _("LLM model is required.")

        return errors


class ToolService:
    """Service for managing tools."""

    def __init__(self, tool: Tool):
        self.tool = tool

    @classmethod
    def get_team_tools(cls, team: Team):
        return Tool.objects.filter(Q(team=team) | Q(team__isnull=True))

    @classmethod
    def make_with_pk(cls, pk: str) -> "ToolService":
        """Get tool by primary key."""
        return cls(Tool.objects.get(pk=pk))

    @classmethod
    def is_api_spec_in_use(cls, instance: APISpec):
        return AgentTool.objects.filter(tool__apispectool__api_spec=instance).exists()

    @classmethod
    def is_mcp_server_in_use(cls, instance: MCPServer):
        return AgentTool.objects.filter(tool__mcptool__mcp_server=instance).exists()


class APISpecService:
    """Service for managing API specs."""

    def __init__(self, api_spec: APISpec):
        self.api_spec = api_spec

    @classmethod
    def make_with_pk(cls, pk: str) -> "APISpecService":
        """Get API spec by primary key."""
        return cls(APISpec.objects.get(pk=pk))

    @classmethod
    @atomic
    def update(
        cls,
        api_spec_obj: APISpec,
        name: str = None,
        base_url: str = None,
        parameters: List[dict] = None,
    ) -> "APISpecService":
        """Update API spec and its parameters."""
        if name:
            api_spec_obj.name = name
        if base_url:
            api_spec_obj.base_url = base_url

        api_spec_obj.save()

        if not parameters:
            api_spec_obj.parameters.all().delete()
            return cls(api_spec_obj)

        existing_params = {p.name: p for p in api_spec_obj.parameters.all()}

        new_param_names = [p["name"] for p in parameters]
        api_spec_obj.parameters.exclude(name__in=new_param_names).delete()

        for param_data in parameters:
            name = param_data["name"]
            value = param_data["value"]
            param_type = param_data["tool_parameter_type"]

            if name in existing_params:
                obj = existing_params[name]
                obj.tool_parameter_type = param_type
                if value:
                    obj.value = encrypt_key(value)
                obj.save()
            else:
                if not value:
                    raise ValidationError(_("Value for new parameters is required"))
                api_spec_obj.parameters.create(
                    name=name,
                    tool_parameter_type=param_type,
                    value=encrypt_key(value),
                )

        return cls(api_spec_obj)

    @classmethod
    @atomic
    def create(
        cls, team, name: str, api_spec: dict, base_url: str, parameters: List = None
    ):
        """Create API spec and generate tools from OpenAPI spec."""
        # Create APISpec
        parser = APISpecParser(api_spec)
        api_spec_obj = APISpec.objects.create(
            team=team, name=name, api_spec=api_spec, base_url=base_url
        )

        # Parse OpenAPI spec and create tools
        for tool in parser.parse():
            APISpecTool.objects.create(
                api_spec=api_spec_obj,
                name=tool.name,
                description=tool.description,
                key=tool.key,
                tool_type=consts.TOOL_TYPE_API_SPEC,
                method=tool.method,
                path=tool.path,
                content_type=tool.content_type,
                input_schema=tool.input_schema,
                output_schema=tool.output_schema,
                team=team,
            )

        for parameter in parameters or []:
            parameter["value"] = encrypt_key(parameter["value"])
            api_spec_obj.parameters.create(**parameter)

        return cls(api_spec_obj)


class MCPServerService:
    """Service for managing MCP servers."""

    def __init__(self, mcp_server: MCPServer):
        self.mcp_server = mcp_server

    @classmethod
    def make_with_pk(cls, pk: str) -> "MCPServerService":
        """Get MCP server by primary key."""
        return cls(MCPServer.objects.get(pk=pk))

    @classmethod
    @atomic
    def create(
        cls,
        team,
        name: str,
        url: str,
        transport_type: str = None,
        parameters: List[dict] = None,
    ) -> "MCPServerService":
        """Create MCP server with pending status."""
        mcp_server = MCPServer.objects.create(
            team=team,
            name=name,
            url=url,
            transport_type=transport_type,
            status=consts.MCP_SERVER_STATUS_PENDING,
        )

        for parameter in parameters or []:
            parameter["value"] = encrypt_key(parameter["value"])
            mcp_server.parameters.create(**parameter)

        return cls(mcp_server)

    def update_status(self, status: str, error_message: str = None):
        """Update MCP server status."""
        self.mcp_server.status = status
        self.mcp_server.error_message = error_message
        self.mcp_server.save(update_fields=["status", "error_message", "updated_at"])

    def can_oauth_authorize(self):
        return self.mcp_server.status == consts.MCP_SERVER_STATUS_OAUTH_REQUIRED

    def make_pending(self):
        self.mcp_server.status = consts.MCP_SERVER_STATUS_PENDING
        self.mcp_server.save(update_fields=["status"])

    @classmethod
    @atomic
    def update(
        cls,
        mcp_server: MCPServer,
        name: str = None,
        url: str = None,
        transport_type: str = None,
        parameters: List[dict] = None,
    ) -> "MCPServerService":
        """Update MCP server and its parameters."""
        if name:
            mcp_server.name = name
        if url:
            mcp_server.url = url
        if transport_type:
            mcp_server.transport_type = transport_type

        mcp_server.status = consts.MCP_SERVER_STATUS_PENDING
        mcp_server.save()

        if not parameters:
            mcp_server.parameters.all().delete()
        else:
            existing_params = {p.name: p for p in mcp_server.parameters.all()}

            new_param_names = [p["name"] for p in parameters]
            mcp_server.parameters.exclude(name__in=new_param_names).delete()

            for param_data in parameters:
                name = param_data["name"]
                value = param_data["value"]
                param_type = param_data["tool_parameter_type"]

                if name in existing_params:
                    obj = existing_params[name]
                    obj.tool_parameter_type = param_type
                    # Only update value if it's not the masked placeholder or empty (for OAuth/Masked values)
                    if value:
                        obj.value = encrypt_key(value)
                    obj.save()
                else:
                    # New parameter
                    if not value:
                        raise ValidationError(_("Value for new parameters is required"))
                    mcp_server.parameters.create(
                        name=name,
                        tool_parameter_type=param_type,
                        value=encrypt_key(value),
                    )

        return cls(mcp_server)
