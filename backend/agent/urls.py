from django.urls import path, include
from rest_framework.routers import DefaultRouter

from agent.views import (
    AgentViewSet,
    AgentDraftToolViewSet,
    AgentDraftKnowledgeBaseViewSet,
    AgentAsToolViewSet,
    ToolViewSet,
    APISpecViewSet,
    MCPServerViewSet,
    ConversationViewSet,
    AgentVersionViewSet,
    ConversationMessageViewSet,
    ConversationMessageBlockViewSet,
)

# Main router for top-level resources
router = DefaultRouter()
router.register(r"agents", AgentViewSet, basename="agent")
router.register(r"conversations", ConversationViewSet, basename="conversation")
router.register(r"tools", ToolViewSet, basename="tool")
router.register(r"api-specs", APISpecViewSet, basename="api-spec")
router.register(r"mcp-servers", MCPServerViewSet, basename="mcp-server")

router.register(
    r"agents/(?P<agent_uuid>[^/.]+)/versions",
    AgentVersionViewSet,
    basename="agent-draft",
)
# Nested router for agent draft resources
router.register(
    r"agents/(?P<agent_uuid>[^/.]+)/draft/tools",
    AgentDraftToolViewSet,
    basename="agent-draft-tools",
)
router.register(
    r"agents/(?P<agent_uuid>[^/.]+)/draft/knowledge-bases",
    AgentDraftKnowledgeBaseViewSet,
    basename="agent-draft-knowledge-bases",
)
router.register(
    r"agents/(?P<agent_uuid>[^/.]+)/draft/agent-tools",
    AgentAsToolViewSet,
    basename="agent-draft-agent-tools",
)
router.register(
    r"conversations/(?P<conversation_uuid>[^/.]+)/messages",
    ConversationMessageViewSet,
    basename="conversation-messages",
)
router.register(
    r"conversations/(?P<conversation_uuid>[^/.]+)/blocks",
    ConversationMessageBlockViewSet,
    basename="conversation-blocks",
)

urlpatterns = [
    path("", include(router.urls)),
]
