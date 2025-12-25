import uuid

from django.shortcuts import render
from drf_spectacular.types import OpenApiTypes
from langchain_core.messages import ToolMessage
from rest_framework import status, mixins
from rest_framework.permissions import AllowAny
from rest_framework.viewsets import GenericViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.utils.translation import gettext as _
from drf_spectacular.utils import extend_schema, extend_schema_view

from agent.factories import ToolFactory
from agent.executors import MCPHelper
from agent.filters import AgentFilter
from user.decorators import setup_current_team
from user.permissions import IsAuthenticatedTeam
from common.services import EventStreamResponse
from agent import consts
from agent.tasks import validate_mcp_server_task
from agent.models import (
    Agent,
    AgentVersion,
    AgentTool,
    AgentKnowledgeBase,
    AgentAsTool,
    Tool,
    MCPServer,
    APISpec,
)
from agent.serializers import (
    AgentListSerializer,
    AgentVersionListSerializer,
    AgentVersionDetailSerializer,
    AgentToolSerializer,
    AgentToolUpdateSerializer,
    AgentKnowledgeBaseSerializer,
    AgentKnowledgeBaseUpdateSerializer,
    AgentAsToolSerializer,
    AgentAsToolUpdateSerializer,
    ToolListSerializer,
    APISpecSerializer,
    MCPServerSerializer,
    ChatMessageRequestSerializer,
    AgentRevertDraftSerializer,
    MessageSerializer,
    ConversationSerializer,
    OauthRedirectResponseSerializer,
    MessageBlockSerializer,
    ToolTestRequestSerializer,
)
from agent.services import (
    AgentService,
    AgentVersionService,
    ToolService,
    MCPServerService,
    APISpecService,
)
from agent.chat_service import ConversationService
from user.models import Media


@extend_schema_view(
    list=extend_schema(
        summary=_("List agents"),
        description="Get list of current team's agents with name and status",
        tags=["Agents"],
    ),
    create=extend_schema(
        summary=_("Create agent"),
        description="Create new agent with just name (creates initial draft version)",
        tags=["Agents"],
    ),
    destroy=extend_schema(
        summary=_("Delete agent"),
        description="Delete agent and all versions and connections",
        tags=["Agents"],
    ),
    publish_draft=extend_schema(
        summary=_("Publish draft"),
        description="Publish draft version (archive current published)",
        tags=["Agents"],
        responses={204: None},
    ),
    draft=extend_schema(
        summary=_("Get or update draft version"),
        description="GET: Get current draft version (create if doesn't exist). PUT/PATCH: Update current draft.",
        tags=["Agents"],
        request=AgentVersionDetailSerializer,
        responses={200: AgentVersionDetailSerializer()},
    ),
    chat_with_draft=extend_schema(
        summary=_("Chat with draft agent"),
        description="Send message to draft version and receive streaming response (SSE)",
        tags=["Agent Chat"],
        request=ChatMessageRequestSerializer,
        responses={200: {"description": "Server-Sent Events stream"}},
    ),
    chat_with_published=extend_schema(
        summary=_("Chat with published agent"),
        description="Send message to published version and receive streaming response (SSE)",
        tags=["Agent Chat"],
        request=ChatMessageRequestSerializer,
        responses={200: {"description": "Server-Sent Events stream"}},
    ),
)
@setup_current_team
class AgentViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """ViewSet for managing agents."""

    permission_classes = [IsAuthenticatedTeam]
    queryset = Agent.objects.none()
    serializer_class = AgentListSerializer
    filterset_class = AgentFilter

    def get_queryset(self):
        return self.request.current_team.agents.order_by("-created_at").all()

    def perform_create(self, serializer):
        """Create agent with initial draft version."""
        serializer.save(team=self.request.current_team)

    @action(detail=True, methods=["get", "put", "patch"], url_path="draft")
    def draft(self, request, **kwargs):
        """Get or update draft version."""
        agent = self.get_object()
        agent_service = AgentService(agent)
        draft = agent_service.get_or_create_draft()

        if request.method == "GET":
            serializer = AgentVersionDetailSerializer(
                draft, context={"team": self.request.current_team}
            )
            return Response(serializer.data)

        # PUT or PATCH
        serializer = AgentVersionDetailSerializer(
            instance=draft,
            data=request.data,
            context={"team": self.request.current_team},
            partial=(request.method == "PATCH"),
        )
        serializer.is_valid(raise_exception=True)

        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=["GET"], url_path="current-published")
    def get_published_version(self, request, **kwargs):
        agent = self.get_object()
        if not agent.current_published_version:
            raise ValidationError(_("No published version found"))

        serializer = AgentVersionDetailSerializer(agent.current_published_version)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="draft/publish")
    def publish_draft(self, request, **kwargs):
        """Publish draft version."""
        agent = self.get_object()
        if not agent.current_draft_version:
            raise ValidationError(_("No draft version found"))

        service = AgentVersionService(agent.current_draft_version)
        service.publish()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def chat(self, request, chat_with_draft=False):
        """Chat with agent."""
        agent = self.get_object()

        agent_version = (
            agent.current_draft_version
            if chat_with_draft
            else agent.current_published_version
        )

        if not agent_version:
            raise ValidationError(_("No draft or published version found"))

        serializer = ChatMessageRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        response_mode = validated_data.get("response_mode") or "streaming"

        # Fetch Media files if file UUIDs provided
        file_uuids = validated_data.get("files", [])
        files = None
        if file_uuids:
            files = list(
                Media.objects.filter(uuid__in=file_uuids, team=request.current_team)
            )
            # Validate all files were found
            if len(files) != len(file_uuids):
                raise ValidationError(
                    _("One or more files not found or not accessible")
                )

        conversation_service = ConversationService.get_or_create_conversation(
            team=request.current_team,
            agent=agent,
            agent_version=agent_version,
            user_identifier=serializer.validated_data["user"],
            conversation_id=validated_data.get("conversation_id"),
            inputs=serializer.validated_data.get("inputs", {}),
        )

        if response_mode == "streaming":
            # Return SSE stream using EventStreamResponse
            return EventStreamResponse(
                conversation_service.chat(query=validated_data["query"], files=files)
            )
        else:
            # Blocking mode - return complete response
            result = conversation_service.chat_blocking(
                query=validated_data["query"], files=files
            )
            serializer = MessageBlockSerializer(result)
            return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="draft/chat-message")
    def chat_with_draft(self, request, **kwargs):
        """Chat with draft version (streaming)."""

        return self.chat(request, chat_with_draft=True)

    @action(detail=True, methods=["post"], url_path="chat-message")
    def chat_with_published(self, request, **kwargs):
        """Chat with published version (streaming)."""
        return self.chat(request, chat_with_draft=False)

    @action(detail=True, methods=["post"], url_path="revert-draft")
    def revert_draft_to_version(self, request, **kwargs):
        agent = self.get_object()
        agent_service = AgentService(agent)
        serializer = AgentRevertDraftSerializer(
            data=self.request.data, context={"agent": agent}
        )
        serializer.is_valid(raise_exception=True)

        version: AgentVersion = serializer.validated_data.get("version_uuid")
        draft = agent_service.revert_to_version(version)
        return Response(
            AgentVersionDetailSerializer(draft).data, status=status.HTTP_200_OK
        )


@extend_schema_view(
    list=extend_schema(
        summary=_("List agent versions"),
        description="Get list of all versions for an agent",
        tags=["Agents"],
        responses={200: AgentVersionListSerializer(many=True)},
    ),
    retrive=extend_schema(
        summary=_("Get single version"),
        description="Get details of a specific agent version",
        tags=["Agents"],
        responses={200: AgentVersionDetailSerializer()},
    ),
)
@setup_current_team
class AgentVersionViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    permission_classes = [IsAuthenticatedTeam]
    queryset = AgentVersion.objects.none()
    lookup_field = "uuid"

    def get_serializer_class(self):
        if self.action == "list":
            return AgentVersionListSerializer
        return AgentVersionDetailSerializer

    def get_agent(self):
        """Get agent from URL."""
        agent_uuid = self.kwargs.get("agent_uuid")
        return self.request.current_team.agents.get(
            uuid=agent_uuid,
        )

    def get_queryset(self):
        return self.get_agent().versions.order_by("-created_at").all()


@extend_schema_view(
    list=extend_schema(
        summary=_("List draft tools"),
        description="List tools attached to agent draft version",
        tags=["Agent Draft Tools"],
    ),
    retrieve=extend_schema(
        summary=_("Get draft tool"),
        description="Get single tool details from draft",
        tags=["Agent Draft Tools"],
    ),
    create=extend_schema(
        summary=_("Add tool to draft"),
        description="Add tool to agent draft version",
        tags=["Agent Draft Tools"],
    ),
    update=extend_schema(
        summary=_("Update tool in draft"),
        description="Update tool configuration in draft",
        tags=["Agent Draft Tools"],
    ),
    partial_update=extend_schema(
        summary=_("Update tool in draft"),
        description="Update tool configuration in draft",
        tags=["Agent Draft Tools"],
    ),
    destroy=extend_schema(
        summary=_("Remove tool from draft"),
        description="Remove tool from draft version",
        tags=["Agent Draft Tools"],
    ),
)
@setup_current_team
class AgentDraftToolViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    """ViewSet for managing tools in agent drafts."""

    pagination_class = None
    permission_classes = [IsAuthenticatedTeam]
    queryset = AgentTool.objects.none()
    lookup_field = "uuid"

    def get_agent(self):
        """Get agent from URL."""
        agent_uuid = self.kwargs.get("agent_uuid")
        return self.request.current_team.agents.get(
            uuid=agent_uuid,
        )

    def get_draft(self):
        """Get or create draft for agent."""
        agent = self.get_agent()
        service = AgentService(agent)
        return service.get_or_create_draft()

    def get_queryset(self):
        """Get tools for draft version."""
        draft = self.get_draft()
        return draft.agent_tools.select_related("tool").all()

    def get_serializer_class(self):
        if self.action in ["update", "partial_update"]:
            return AgentToolUpdateSerializer
        return AgentToolSerializer

    def get_serializer_context(self):
        return {"team": self.request.current_team}

    def perform_create(self, serializer):
        serializer.save(agent_version=self.get_draft())


@extend_schema_view(
    list=extend_schema(
        summary=_("List draft knowledge bases"),
        description="List knowledge bases attached to agent draft",
        tags=["Agent Draft Knowledge Bases"],
    ),
    retrieve=extend_schema(
        summary=_("Get draft knowledge base"),
        description="Get single knowledge base details from draft",
        tags=["Agent Draft Knowledge Bases"],
    ),
    create=extend_schema(
        summary=_("Add knowledge base to draft"),
        description="Add knowledge base to agent draft version",
        tags=["Agent Draft Knowledge Bases"],
    ),
    update=extend_schema(
        summary=_("Update knowledge base in draft"),
        description="Update knowledge base configuration",
        tags=["Agent Draft Knowledge Bases"],
    ),
    partial_update=extend_schema(
        summary=_("Update knowledge base in draft"),
        description="Update knowledge base configuration",
        tags=["Agent Draft Knowledge Bases"],
    ),
    destroy=extend_schema(
        summary=_("Remove knowledge base from draft"),
        description="Remove knowledge base from draft version",
        tags=["Agent Draft Knowledge Bases"],
    ),
)
@setup_current_team
class AgentDraftKnowledgeBaseViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    """ViewSet for managing knowledge bases in agent drafts."""

    pagination_class = None
    permission_classes = [IsAuthenticatedTeam]
    queryset = AgentKnowledgeBase.objects.none()
    lookup_field = "uuid"

    def get_agent(self):
        """Get agent from URL."""
        agent_uuid = self.kwargs.get("agent_uuid")
        return self.request.current_team.agents.get(uuid=agent_uuid)

    def get_draft(self):
        """Get or create draft for agent."""
        agent = self.get_agent()
        service = AgentService(agent)
        return service.get_or_create_draft()

    def get_queryset(self):
        """Get knowledge bases for draft version."""
        draft = self.get_draft()
        return draft.agent_knowledge_bases.select_related("knowledge_base").all()

    def get_serializer_class(self):
        if self.action in ["update", "partial_update"]:
            return AgentKnowledgeBaseUpdateSerializer
        return AgentKnowledgeBaseSerializer

    def get_serializer_context(self):
        return {"team": self.request.current_team}

    def perform_create(self, serializer):
        serializer.save(agent_version=self.get_draft())


@extend_schema_view(
    list=extend_schema(
        summary=_("List draft agent tools"),
        description="List agents attached as tools to agent draft",
        tags=["Agent Draft Agent Tools"],
    ),
    retrieve=extend_schema(
        summary=_("Get draft agent tool"),
        description="Get single agent tool details from draft",
        tags=["Agent Draft Agent Tools"],
    ),
    create=extend_schema(
        summary=_("Add agent as tool to draft"),
        description="Add another agent as a tool to agent draft version",
        tags=["Agent Draft Agent Tools"],
    ),
    update=extend_schema(
        summary=_("Update agent tool in draft"),
        description="Update agent tool configuration",
        tags=["Agent Draft Agent Tools"],
    ),
    partial_update=extend_schema(
        summary=_("Update agent tool in draft"),
        description="Update agent tool configuration",
        tags=["Agent Draft Agent Tools"],
    ),
    destroy=extend_schema(
        summary=_("Remove agent tool from draft"),
        description="Remove agent tool from draft version",
        tags=["Agent Draft Agent Tools"],
    ),
)
@setup_current_team
class AgentAsToolViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    """ViewSet for managing agents as tools in agent drafts."""

    pagination_class = None
    permission_classes = [IsAuthenticatedTeam]
    queryset = AgentAsTool.objects.none()
    lookup_field = "uuid"

    def get_agent(self):
        """Get parent agent from URL."""
        agent_uuid = self.kwargs.get("agent_uuid")
        return self.request.current_team.agents.get(uuid=agent_uuid)

    def get_draft(self):
        """Get or create draft for parent agent."""
        agent = self.get_agent()
        service = AgentService(agent)
        return service.get_or_create_draft()

    def get_queryset(self):
        """Get agent tools for draft version."""
        draft = self.get_draft()
        return draft.agent_as_tools.select_related("tool_agent").all()

    def get_serializer_class(self):
        if self.action in ["update", "partial_update"]:
            return AgentAsToolUpdateSerializer
        return AgentAsToolSerializer

    def get_serializer_context(self):
        return {
            "team": self.request.current_team,
            "parent_agent_version": self.get_draft(),
        }

    def perform_create(self, serializer):
        serializer.save(parent_agent_version=self.get_draft())


@extend_schema_view(
    list=extend_schema(
        summary=_("List built-in tools"),
        description="Get list of built-in tools available for use",
        tags=["Tools"],
    ),
    retrieve=extend_schema(
        summary=_("Get built-in tool"),
        description="Get details of a specific built-in tool",
        tags=["Tools"],
    ),
    test=extend_schema(
        summary=_("Test built-in tool"),
        description="Test a built-in tool from this API spec",
        tags=["Tools"],
    ),
)
@setup_current_team
class ToolViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """ViewSet for listing built-in tools."""

    permission_classes = [IsAuthenticatedTeam]
    serializer_class = ToolListSerializer
    queryset = Tool.objects.none()

    def get_queryset(self):
        """Get only built-in tools (global tools without team)."""
        if self.action == "list":
            return (
                Tool.objects.filter(
                    team__isnull=True, tool_type=consts.TOOL_TYPE_BUILT_IN
                )
                .order_by("-created_at")
                .all()
            )
        return ToolService.get_team_tools(self.request.current_team).all()

    @action(detail=True, methods=["POST"], url_path="test")
    def test(self, request, **kwargs):
        """Test tool."""
        tool = self.get_object()

        context = {
            "team": self.request.current_team,
        }
        structured_tool = ToolFactory.create_tool(tool, {}, context=context)
        serializer = ToolTestRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tool_input = serializer.validated_data.get("input", {})

        # Execute the tool
        try:
            # Generate a fake tool_call_id for testing
            tool_call_id = str(uuid.uuid4())

            result: ToolMessage = structured_tool.func(
                tool_call_id=tool_call_id, **tool_input
            )

            return Response(
                {
                    "content": result.content if result else None,
                    "artifact": result.artifact
                    if result and hasattr(result, "artifact")
                    else None,
                }
            )
        except Exception as e:
            raise ValidationError(
                _("Tool failed to execute: {error}").format(error=str(e))
            )


@extend_schema_view(
    list=extend_schema(
        summary=_("List API spec tools"),
        description="Get list of API spec tools (team-owned or global)",
        tags=["API Spec Tools"],
    ),
    retrieve=extend_schema(
        summary=_("Get API spec tool"),
        description="Get details of a specific API spec tool",
        tags=["API Spec Tools"],
    ),
    create=extend_schema(
        summary=_("Create API spec tools"),
        description="Create API spec and generate tools from OpenAPI specification",
        tags=["API Spec Tools"],
    ),
    destroy=extend_schema(
        summary=_("Delete API spec"),
        description="Delete API spec and its tools",
        tags=["API Spec Tools"],
    ),
)
@setup_current_team
class APISpecViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    """ViewSet for creating API spec tools."""

    permission_classes = [IsAuthenticatedTeam]
    serializer_class = APISpecSerializer
    queryset = APISpec.objects.none()

    def get_queryset(self):
        """Get API specs owned by team."""
        return self.request.current_team.api_specs.all()

    def perform_create(self, serializer):
        """Create API spec with pending status."""
        service = APISpecService.create(
            team=self.request.current_team,
            name=serializer.validated_data["name"],
            base_url=serializer.validated_data["base_url"],
            api_spec=serializer.validated_data["api_spec"],
            parameters=serializer.validated_data.get("parameters", []),
        )
        serializer.instance = service.api_spec

    def perform_destroy(self, instance):
        if ToolService.is_api_spec_in_use(instance):
            raise PermissionDenied(_("API spec is in use"))
        instance.delete()


@extend_schema_view(
    list=extend_schema(
        summary=_("List MCP servers"),
        description="Get list of MCP servers (team-owned)",
        tags=["MCP Servers"],
    ),
    retrieve=extend_schema(
        summary=_("Get MCP server status"),
        description="Check status of MCP server validation",
        tags=["MCP Servers"],
    ),
    create=extend_schema(
        summary=_("Create MCP server"),
        description="Create MCP server and validate (async)",
        tags=["MCP Servers"],
    ),
    destroy=extend_schema(
        summary=_("Delete MCP server"),
        description="Delete MCP server and its tools",
        tags=["MCP Servers"],
    ),
    oauth_redirect=extend_schema(
        summary=_("OAuth redirect"),
        description="OAuth redirect for MCP server",
        tags=["MCP Servers"],
        responses={200: OauthRedirectResponseSerializer},
    ),
    oauth_callback=extend_schema(
        summary=_("OAuth callback"),
        description="OAuth callback for MCP server",
        tags=["MCP Servers"],
        responses={200: OpenApiTypes.STR},
    ),
    revalidate=extend_schema(
        summary=_("Revalidate MCP server"),
        description="Revalidate MCP server (async)",
        tags=["MCP Servers"],
        responses={204: None},
    ),
)
@setup_current_team
class MCPServerViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    """ViewSet for managing MCP servers."""

    permission_classes = [IsAuthenticatedTeam]
    serializer_class = MCPServerSerializer
    queryset = MCPServer.objects.none()
    lookup_field = "uuid"

    def get_queryset(self):
        """Get MCP servers owned by team."""
        return self.request.current_team.mcp_servers.all()

    def perform_create(self, serializer):
        service = MCPServerService.create(
            team=self.request.current_team,
            name=serializer.validated_data["name"],
            url=serializer.validated_data["url"],
            parameters=serializer.validated_data.get("parameters", []),
        )
        serializer.instance = service.mcp_server
        validate_mcp_server_task.delay(service.mcp_server.pk)

    def perform_destroy(self, instance):
        if ToolService.is_mcp_server_in_use(instance):
            raise PermissionDenied(_("MCP server is in use"))
        instance.delete()

    @action(
        detail=True, methods=["GET"], url_path="oauth-redirect", name="oauth-redirect"
    )
    def oauth_redirect(self, request, **kwargs):
        instance = self.get_object()
        service = MCPServerService(instance)
        if not service.can_oauth_authorize():
            raise PermissionDenied(_("MCP server is not configured for OAuth"))

        helpers = MCPHelper(service.mcp_server)
        return Response({"redirect_url": helpers.get_redirect_url()})

    @action(
        detail=True,
        methods=["GET"],
        url_path="oauth-callback",
        permission_classes=[AllowAny],
        name="oauth-callback",
    )
    def oauth_callback(self, request, uuid=None):
        helpers = MCPHelper(MCPServer.objects.get(pk=uuid))
        state: str = request.GET.get("state")
        code: str = request.GET.get("code")
        if not state or not code:
            return Response("Invalid state or code", status=status.HTTP_400_BAD_REQUEST)

        try:
            helpers.verify_authorization(code, state)
            MCPServerService(mcp_server=helpers.mcp_server).make_pending()
            validate_mcp_server_task.delay(uuid)

            oauth_status = "success"
        except ValueError:
            oauth_status = "error"

        return render(request, "agent/oauth_callback.html", {"status": oauth_status})

    @action(detail=True, methods=["POST"], url_path="revalidate", name="revalidate")
    def revalidate(self, request, **kwargs):
        instance = self.get_object()
        MCPServerService(instance).make_pending()
        validate_mcp_server_task.delay(instance.pk, revalidate_type=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    list=extend_schema(
        summary=_("List conversations"),
        description="Get list of conversations with optional agent filter",
        tags=["Agent Conversations"],
    ),
    retrieve=extend_schema(
        summary=_("Get conversation"),
        description="Get single conversation details",
        tags=["Agent Conversations"],
    ),
)
@setup_current_team
class ConversationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    GenericViewSet,
):
    """ViewSet for managing conversations."""

    permission_classes = [IsAuthenticatedTeam]
    serializer_class = ConversationSerializer
    lookup_field = "uuid"

    def get_queryset(self):
        queryset = self.request.current_team.conversations.all()

        # Filter by agent if provided
        agent_uuid = self.request.query_params.get("agent")
        if agent_uuid:
            queryset = queryset.filter(agent__uuid=agent_uuid)

        # Order by created_at descending (newest first)
        return queryset.order_by("-created_at")


@extend_schema_view(
    list=extend_schema(
        summary=_("List conversation messages"),
        description="Get list of messages in a conversation",
        tags=["Agent Conversations"],
    )
)
@setup_current_team
class ConversationMessageViewSet(mixins.ListModelMixin, GenericViewSet):
    permission_classes = [IsAuthenticatedTeam]
    serializer_class = MessageSerializer
    lookup_field = "uuid"

    def get_queryset(self):
        conversation_uuid = self.kwargs.get("conversation_uuid")
        # Order by created_at ascending (oldest first, newest last) for chat display
        return (
            self.request.current_team.conversations.get(uuid=conversation_uuid)
            .messages.order_by("created_at")
            .all()
        )


@extend_schema_view(
    list=extend_schema(
        summary=_("List conversation message blocks"),
        description="Get list of blocks in a conversation message",
        tags=["Agent Conversations"],
    )
)
@setup_current_team
class ConversationMessageBlockViewSet(mixins.ListModelMixin, GenericViewSet):
    permission_classes = [IsAuthenticatedTeam]
    serializer_class = MessageBlockSerializer
    lookup_field = "uuid"

    def get_queryset(self):
        conversation_uuid = self.kwargs.get("conversation_uuid")
        # Order by created_at ascending (oldest first, newest last) for chat display
        return (
            self.request.current_team.conversations.get(uuid=conversation_uuid)
            .blocks.prefetch_related("messages")
            .order_by("created_at")
            .all()
        )
