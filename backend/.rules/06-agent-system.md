# Agent System Architecture

## Agent Model Hierarchy

### Core Concepts

**Agent**: Container for AI agent with versioning
**AgentVersion**: Specific version with prompt, model, tools
**Tool**: Abstract base for all tool types
**Conversation**: Chat session with an agent
**Message**: Individual message in conversation

### Agent Versioning Pattern

```python
class Agent(BaseModel):
    name = models.CharField(max_length=255, unique=True)
    team = models.ForeignKey("user.Team", on_delete=models.CASCADE)
    
    @cached_property
    def current_published_version(self):
        """Get active production version."""
        return self.versions.filter(
            status=consts.AGENT_VERSION_STATUS_PUBLISHED
        ).first()
    
    @cached_property
    def current_draft_version(self):
        """Get latest draft version."""
        return self.versions.filter(
            status=consts.AGENT_VERSION_STATUS_DRAFT
        ).order_by('-created_at').first()
    
    @property
    def status(self):
        """Derived status from versions."""
        if self.current_published_version:
            return consts.AGENT_VERSION_STATUS_PUBLISHED
        elif self.current_draft_version:
            return consts.AGENT_VERSION_STATUS_DRAFT
        return consts.AGENT_VERSION_STATUS_ARCHIVED
```

**Version Lifecycle:**
1. Create agent → draft version created
2. Configure prompt, model, tools
3. Publish version → becomes active
4. Edit → creates new draft
5. Archive old versions

### Tool Abstraction

Three types of tools, all inherit from `Tool`:

```python
class Tool(BaseModel):
    """Abstract base for all tool types."""
    name = models.CharField(max_length=255)
    description = models.TextField()  # For LLM
    key = models.CharField(max_length=255)
    tool_type = models.CharField(
        choices=consts.TOOL_TYPE_CHOICES,
        max_length=255
    )
    input_schema = models.JSONField(null=True, blank=True)
    output_schema = models.JSONField(null=True, blank=True)
    team = models.ForeignKey("user.Team", on_delete=models.CASCADE)
```

#### 1. MCP Tools (Model Context Protocol)

```python
class MCPServer(BaseModel):
    """External MCP server connection."""
    name = models.CharField(max_length=255)
    url = models.URLField()
    team = models.ForeignKey("user.Team", on_delete=models.CASCADE)

class MCPTool(Tool):
    """Tool from MCP server."""
    mcp_server = models.ForeignKey(
        "agent.MCPServer",
        on_delete=models.CASCADE,
        related_name="tools"
    )
```

**Usage**: Connect to external MCP servers to get tools dynamically.

#### 2. API Spec Tools (OpenAPI)

```python
class APISpec(BaseModel):
    """OpenAPI specification storage."""
    name = models.CharField(max_length=255)
    api_spec = models.JSONField(default=dict)
    team = models.ForeignKey("user.Team", on_delete=models.CASCADE)

class APISpecTool(Tool):
    """Tool generated from OpenAPI spec."""
    api_spec = models.ForeignKey(
        "agent.APISpec",
        on_delete=models.CASCADE,
        related_name="tools"
    )
    method = models.CharField(max_length=255)  # GET, POST, etc.
    path = models.CharField(max_length=255)  # /api/endpoint
```

**Usage**: Parse OpenAPI specs to generate tools automatically.

#### 3. Built-in Tools

```python
# Example: Scraper tool
from langchain_core.tools import BaseTool

class ScraperTool(BaseTool):
    name = "scrapper"
    description = "Scrape a URL and return content"
    
    def _run(self, url: str) -> str:
        from core.services import CrawlerService
        result = CrawlerService.make_with_urls(
            [url],
            self.agent.team
        ).run()
        return result
```

**Usage**: Predefined tools in code.

### Connecting Tools to Agents

```python
class AgentTool(BaseModel):
    """Junction table: Agent Version ↔ Tool."""
    tool = models.ForeignKey(
        "agent.Tool",
        on_delete=models.CASCADE,
        related_name="agent_tools"
    )
    agent_version = models.ForeignKey(
        "agent.AgentVersion",
        on_delete=models.CASCADE,
        related_name="agent_tools"
    )
    config = models.JSONField()  # Tool-specific configuration
    
    class Meta:
        unique_together = ["agent_version", "tool"]
```

### Knowledge Base Integration

```python
class AgentKnowledgeBase(BaseModel):
    """Connect agent to knowledge base for RAG."""
    knowledge_base = models.ForeignKey(
        "knowledge_base.KnowledgeBase",
        on_delete=models.CASCADE,
        related_name="agent_knowledge_bases"
    )
    agent_version = models.ForeignKey(
        "agent.AgentVersion",
        on_delete=models.CASCADE,
        related_name="agent_knowledge_bases"
    )
    config = models.JSONField(default=dict)  # RAG config (top_k, etc.)
    
    class Meta:
        unique_together = ["agent_version", "knowledge_base"]
```

### Conversations

```python
class Conversation(BaseModel):
    """Chat session with agent."""
    title = models.CharField(max_length=255, null=True, blank=True)
    user_identifier = models.CharField(max_length=255)  # For anonymous users
    agent = models.ForeignKey(
        "agent.Agent",
        on_delete=models.CASCADE,
        related_name="conversations"
    )
    team = models.ForeignKey("user.Team", on_delete=models.CASCADE)

class Message(BaseModel):
    """Individual message in conversation."""
    conversation = models.ForeignKey(
        "agent.Conversation",
        on_delete=models.CASCADE,
        related_name="messages"
    )
    role = models.CharField(max_length=255)  # user, assistant, system
    content = models.TextField()
```

## Agent Service (To Be Implemented)

```python
class AgentService:
    def __init__(self, agent: Agent):
        self.agent = agent
    
    def create_version(self, system_prompt, provider_config, llm_model):
        """Create new draft version."""
        return AgentVersion.objects.create(
            agent=self.agent,
            status=consts.AGENT_VERSION_STATUS_DRAFT,
            system_prompt=system_prompt,
            provider_config=provider_config,
            llm_model=llm_model,
        )
    
    def add_tool(self, agent_version, tool, config=None):
        """Add tool to agent version."""
        return AgentTool.objects.create(
            agent_version=agent_version,
            tool=tool,
            config=config or {}
        )
    
    def add_knowledge_base(self, agent_version, kb, config=None):
        """Connect knowledge base for RAG."""
        return AgentKnowledgeBase.objects.create(
            agent_version=agent_version,
            knowledge_base=kb,
            config=config or {}
        )
    
    def publish_version(self, agent_version):
        """Publish version (archive previous published)."""
        # Archive current published
        self.agent.versions.filter(
            status=consts.AGENT_VERSION_STATUS_PUBLISHED
        ).update(status=consts.AGENT_VERSION_STATUS_ARCHIVED)
        
        # Publish new version
        agent_version.status = consts.AGENT_VERSION_STATUS_PUBLISHED
        agent_version.save()
```

## Constants

```python
# agent/consts.py

TOOL_TYPE_API_SPEC = 'api_spec'
TOOL_TYPE_BUILT_IN = 'built_in'
TOOL_TYPE_MCP = 'mcp'

TOOL_TYPE_CHOICES = (
    (TOOL_TYPE_API_SPEC, 'API Specification'),
    (TOOL_TYPE_BUILT_IN, 'Built-in'),
    (TOOL_TYPE_MCP, 'MCP'),
)

AGENT_VERSION_STATUS_DRAFT = 'draft'
AGENT_VERSION_STATUS_PUBLISHED = 'published'
AGENT_VERSION_STATUS_ARCHIVED = 'archived'

AGENT_VERSION_STATUS_CHOICES = (
    (AGENT_VERSION_STATUS_DRAFT, 'Draft'),
    (AGENT_VERSION_STATUS_PUBLISHED, 'Published'),
    (AGENT_VERSION_STATUS_ARCHIVED, 'Archived'),
)
```

## Design Principles

- ✅ **Versioning**: All agent changes create new versions
- ✅ **Polymorphism**: Three tool types share base `Tool` model
- ✅ **Configuration as JSON**: Flexible tool/KB configs
- ✅ **Team Isolation**: All resources scoped to teams
- ✅ **Conversation History**: Full message tracking
- ✅ **Anonymous Support**: `user_identifier` for non-authenticated users
