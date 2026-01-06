TOOL_TYPE_API_SPEC = "api_spec"
TOOL_TYPE_BUILT_IN = "built_in"
TOOL_TYPE_MCP = "mcp"

TOOL_TYPE_CHOICES = (
    (TOOL_TYPE_API_SPEC, "API Specification"),
    (TOOL_TYPE_BUILT_IN, "Built-in"),
    (TOOL_TYPE_MCP, "MCP"),
)

TOOL_PARAMETER_TYPE_HEADER = "header"
TOOL_PARAMETER_TYPE_QUERY = "query"
TOOL_PARAMETER_TYPE_PATH = "path"
TOOL_PARAMETER_OAUTH = "oauth"

TOOL_PARAMETER_TYPE_CHOICES = (
    (TOOL_PARAMETER_TYPE_PATH, "Path"),
    (TOOL_PARAMETER_TYPE_HEADER, "Header"),
    (TOOL_PARAMETER_TYPE_QUERY, "Query"),
    (TOOL_PARAMETER_OAUTH, "OAuth"),
)

AGENT_VERSION_STATUS_DRAFT = "draft"
AGENT_VERSION_STATUS_PUBLISHED = "published"
AGENT_VERSION_STATUS_ARCHIVED = "archived"

AGENT_VERSION_STATUS_CHOICES = (
    (AGENT_VERSION_STATUS_DRAFT, "Draft"),
    (AGENT_VERSION_STATUS_PUBLISHED, "Published"),
    (AGENT_VERSION_STATUS_ARCHIVED, "Archived"),
)

MCP_SERVER_STATUS_PENDING = "pending"
MCP_SERVER_STATUS_ACTIVE = "active"
MCP_SERVER_STATUS_ERROR = "error"
MCP_SERVER_STATUS_OAUTH_REQUIRED = "oauth_required"
MCP_SERVER_STATUS_AUTH_REQUIRED = "auth_required"

MCP_SERVER_STATUS_CHOICES = (
    (MCP_SERVER_STATUS_PENDING, "Pending"),
    (MCP_SERVER_STATUS_ACTIVE, "Active"),
    (MCP_SERVER_STATUS_ERROR, "Error"),
    (MCP_SERVER_STATUS_OAUTH_REQUIRED, "OAuth Authentication Required"),
    (MCP_SERVER_STATUS_AUTH_REQUIRED, "Authentication Required"),
)

TRANSPORT_TYPE_SSE = "sse"
TRANSPORT_TYPE_STREAMABLE_HTTP = "streamable_http"
TRANSPORT_TYPE_CHOICES = (
    (TRANSPORT_TYPE_SSE, "SSE"),
    (TRANSPORT_TYPE_STREAMABLE_HTTP, "Streamable HTTP"),
)
MESSAGE_ROLE_USER = "user"
MESSAGE_ROLE_ASSISTANT = "assistant"

MESSAGE_ROLE_CHOICES = (
    (MESSAGE_ROLE_USER, "User"),
    (MESSAGE_ROLE_ASSISTANT, "Assistant"),
)

TOOL_EXECUTION_STATUS_PENDING = "pending"
TOOL_EXECUTION_STATUS_SUCCESS = "success"
TOOL_EXECUTION_STATUS_ERROR = "error"
TOOL_EXECUTION_STATUS_INVALID = "invalid"

TOOL_EXECUTION_STATUS_CHOICES = (
    (TOOL_EXECUTION_STATUS_PENDING, "Pending"),
    (TOOL_EXECUTION_STATUS_SUCCESS, "Success"),
    (TOOL_EXECUTION_STATUS_ERROR, "Error"),
    (TOOL_EXECUTION_STATUS_INVALID, "Invalid Format"),
)

PARAMETER_TYPE_STRING = "string"
PARAMETER_TYPE_BOOLEAN = "boolean"
PARAMETER_TYPE_NUMBER = "number"
PARAMETER_TYPE_CHOICES = (
    (PARAMETER_TYPE_STRING, "String"),
    (PARAMETER_TYPE_BOOLEAN, "Boolean"),
    (PARAMETER_TYPE_NUMBER, "Number"),
)

# File content types for multimodal messages
FILE_CONTENT_TYPE_IMAGE = "image"
FILE_CONTENT_TYPE_FILE = "file"
FILE_CONTENT_TYPE_AUDIO = "audio"

FILE_CONTENT_TYPE_CHOICES = (
    (FILE_CONTENT_TYPE_IMAGE, "Image"),
    (FILE_CONTENT_TYPE_FILE, "File"),
    (FILE_CONTENT_TYPE_AUDIO, "Audio"),
)

# Supported MIME types for each content type
IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
]

FILE_MIME_TYPES = [
    "application/pdf",
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/json",
    "application/xml",
]

AUDIO_MIME_TYPES = [
    "audio/wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/ogg",
    "audio/webm",
]

ALL_SUPPORTED_MIME_TYPES = IMAGE_MIME_TYPES + FILE_MIME_TYPES + AUDIO_MIME_TYPES
