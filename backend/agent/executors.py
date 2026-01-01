import asyncio
import json
import uuid
import logging
from typing import Any, Dict, Annotated, Optional
from urllib.parse import urljoin, urlencode, urlparse, parse_qs, urlunparse

from django.conf import settings
from django.urls import reverse
from langchain_core.messages import ToolMessage
from langchain_core.tools import InjectedToolCallId
from mcp import ClientSession
from mcp.client.auth import OAuthRegistrationError
from mcp.client.sse import sse_client
from mcp.client.streamable_http import streamablehttp_client
from mcp.shared.auth import OAuthToken, OAuthClientInformationFull, OAuthClientMetadata
from mcp.types import CallToolResult, TextContent
from pydantic import AnyUrl
import httpx

from agent import consts
from agent.models import MCPServer, APISpecTool, Tool, AgentVersion
from agent.parsers.mcp_parser import (
    TokenStorage,
    LoginData,
    MCPOAuthProvider,
    MCPServerParser,
    MCPOAuthRequiredError,
    TransportType,
)
from langgraph.types import Command

from agent.tools.base import BuiltinToolRegistry, BaseBuiltinTool, SaveFileMixin
from common.encryption import encrypt_key, decrypt_key
from knowledge_base.models import RetrievalSetting, KnowledgeBase
from knowledge_base.vector_stores.retriever import Retriever

logger = logging.getLogger(__name__)


class MCPTokenStorageHelper(TokenStorage):
    def __init__(self, mcp_server: MCPServer):
        self.mcp_server = mcp_server
        self.data = {}
        self.parameter = None
        self._initialized = False

    async def initialize(self):
        if self._initialized:
            return
        self.parameter = await self.mcp_server.parameters.filter(
            tool_parameter_type=consts.TOOL_PARAMETER_OAUTH
        ).afirst()
        if self.parameter:
            self.data = json.loads(decrypt_key(self.parameter.value))
        self._initialized = True

    async def store_data(self):
        if self.parameter:
            self.parameter.value = encrypt_key(json.dumps(self.data))
            await self.parameter.asave(update_fields=["value"])
            return
        self.parameter = await self.mcp_server.parameters.acreate(
            tool_parameter_type=consts.TOOL_PARAMETER_OAUTH,
            value=encrypt_key(json.dumps(self.data)),
        )

    async def get_tokens(self) -> OAuthToken | None:
        """Get stored tokens."""
        await self.initialize()
        tokens = self.data.get("tokens")
        if tokens:
            return OAuthToken(**tokens)
        return None

    async def set_tokens(self, tokens: OAuthToken) -> None:
        self.data["tokens"] = tokens.model_dump(mode="json", exclude_none=True)
        await self.store_data()

    async def get_client_info(self) -> OAuthClientInformationFull | None:
        """Get stored client information."""
        await self.initialize()
        client_info = self.data.get("client_info")
        if client_info:
            return OAuthClientInformationFull(**client_info)
        return None

    async def set_client_info(self, client_info: OAuthClientInformationFull) -> None:
        """Store client information."""
        self.data["client_info"] = client_info.model_dump(
            mode="json", exclude_none=True
        )
        await self.store_data()

    async def get_login_data(self) -> LoginData | None:
        """To get state and code verifier"""
        await self.initialize()
        login_data = self.data.get("login_data")
        if login_data:
            return LoginData(**login_data)
        return None

    async def set_login_data(self, login_data: LoginData) -> None:
        """To store state and code verifier"""
        self.data["login_data"] = login_data.model_dump(mode="json", exclude_none=True)
        await self.store_data()

    async def clear_login_data(self) -> None:
        """To clear state and code verifier"""
        self.data["login_data"] = None
        await self.store_data()


class MCPHelper:
    def __init__(self, mcp_server: MCPServer, revalidate_type=False):
        self.mcp_server: MCPServer = mcp_server
        self.headers = {}
        self.query_params = {}
        self.timeout = 300.0
        self.sse_read_timeout = 300.0
        self.revalidate_type = revalidate_type

        for parameter in self.mcp_server.parameters.filter(
            tool_parameter_type__in=[
                consts.TOOL_PARAMETER_TYPE_HEADER,
                consts.TOOL_PARAMETER_TYPE_QUERY,
            ]
        ):
            if parameter.tool_parameter_type == consts.TOOL_PARAMETER_TYPE_HEADER:
                self.headers[parameter.name] = decrypt_key(parameter.value)
            else:
                self.query_params[parameter.name] = decrypt_key(parameter.value)

    def make_storage(self) -> MCPTokenStorageHelper:
        return MCPTokenStorageHelper(self.mcp_server)

    @property
    def mcp_server_url(self):
        # If no additional query params, return original URL unchanged.
        if not self.query_params:
            return self.mcp_server.url

        # Parse original URL
        parsed = urlparse(self.mcp_server.url)

        # Parse original query params (each value is a list, so flatten later)
        original_qs = parse_qs(parsed.query)

        # Merge with new params (dict[str,str])
        # parse_qs produces list-values, but your query_params is simple key->str
        merged = {**original_qs, **{k: [v] for k, v in self.query_params.items()}}

        # Re-encode
        new_query = urlencode(merged, doseq=True)

        # Rebuild full URL including fragment
        rebuilt = urlunparse(
            (
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                new_query,
                parsed.fragment,
            )
        )

        return rebuilt

    def make_auth_provider(self) -> MCPOAuthProvider:
        redirect_url = urljoin(
            settings.API_BASE_URL,
            reverse("mcp-server-oauth-callback", args=(self.mcp_server.uuid,)),
        )
        return MCPOAuthProvider(
            server_url=self.mcp_server_url,
            client_metadata=OAuthClientMetadata(
                client_name=f"WaterCrawl-{self.mcp_server.uuid.hex[:8]}",
                redirect_uris=[AnyUrl(redirect_url)],
                grant_types=["authorization_code", "refresh_token"],
                response_types=["code"],
            ),
            storage=self.make_storage(),
        )

    def make_parser(self) -> MCPServerParser:
        transport_type = None
        if self.mcp_server.transport_type and not self.revalidate_type:
            transport_type = TransportType(self.mcp_server.transport_type)

        return MCPServerParser(
            self.mcp_server_url,
            auth=self.make_auth_provider(),
            transport_type=transport_type,
            timeout=self.timeout,
            sse_read_timeout=self.sse_read_timeout,
        )

    def validate_and_save_tools(self):
        async def _validate_and_save_tools():
            try:
                parser = self.make_parser()
                if not self.mcp_server.transport_type or self.revalidate_type:
                    self.mcp_server.transport_type = (
                        await parser.detect_transport_type()
                    ).value
                    await self.mcp_server.asave(update_fields=["transport_type"])

                fetched_tools = [tool async for tool in parser.tools()]
                for tool in fetched_tools:
                    await self.mcp_server.tools.aupdate_or_create(
                        name=tool.name,
                        defaults={
                            "description": tool.description,
                            "key": tool.key,
                            "tool_type": consts.TOOL_TYPE_MCP,
                            "input_schema": tool.input_schema,
                            "output_schema": tool.output_schema,
                            "team_id": self.mcp_server.team_id,
                        },
                    )

                self.mcp_server.status = consts.MCP_SERVER_STATUS_ACTIVE
                self.mcp_server.error_message = None
                await self.mcp_server.asave(update_fields=["status", "error_message"])
            except MCPOAuthRequiredError as e:
                self.mcp_server.status = consts.MCP_SERVER_STATUS_OAUTH_REQUIRED
                self.mcp_server.error_message = str(e)
                await self.mcp_server.asave(update_fields=["status", "error_message"])
            except OAuthRegistrationError:
                self.mcp_server.status = consts.MCP_SERVER_STATUS_AUTH_REQUIRED
                self.mcp_server.error_message = (
                    "The server requires authentication and not support oauth."
                )
                await self.mcp_server.asave(update_fields=["status", "error_message"])

            except ExceptionGroup as e:
                for exc in e.exceptions:
                    if isinstance(exc, MCPOAuthRequiredError):
                        self.mcp_server.status = consts.MCP_SERVER_STATUS_OAUTH_REQUIRED
                        self.mcp_server.error_message = str(exc)
                        await self.mcp_server.asave(
                            update_fields=["status", "error_message"]
                        )
                        return
                    if isinstance(exc, OAuthRegistrationError):
                        self.mcp_server.status = consts.MCP_SERVER_STATUS_AUTH_REQUIRED
                        self.mcp_server.error_message = (
                            "The server requires authentication and not support oauth."
                        )
                        await self.mcp_server.asave(
                            update_fields=["status", "error_message"]
                        )
                        return

            except Exception as e:
                self.mcp_server.status = consts.MCP_SERVER_STATUS_ERROR
                self.mcp_server.error_message = str(e)
                await self.mcp_server.asave(update_fields=["status", "error_message"])

        asyncio.run(_validate_and_save_tools())

    def get_redirect_url(self):
        async def _get_redirect_url() -> str:
            provider = self.make_auth_provider()
            return await provider.build_authorization_url()

        return asyncio.run(_get_redirect_url())

    def verify_authorization(self, code, state):
        async def _verify_authorization():
            provider = self.make_auth_provider()
            try:
                return await provider.handle_callback(code, state)
            except Exception as e:
                raise ValueError(f"Failed to verify authorization: {str(e)}")

        asyncio.run(_verify_authorization())

        self.mcp_server.status = consts.MCP_SERVER_STATUS_PENDING
        self.mcp_server.error_message = None
        self.mcp_server.save(update_fields=["status", "error_message"])

    async def execute_tool(self, tool_name, params):
        if self.mcp_server.transport_type == consts.TRANSPORT_TYPE_SSE:
            return await self._execute_tool_sse(tool_name, params)
        else:  # STREAMABLE_HTTP
            return await self._execute_tool_streamable_http(tool_name, params)

    async def _execute_tool_sse(self, tool_name, params) -> CallToolResult:
        async with sse_client(
            self.mcp_server_url,
            headers=self.headers,
            timeout=self.timeout,
            sse_read_timeout=self.sse_read_timeout,
            auth=self.make_auth_provider(),
        ) as (read_stream, write_stream):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()

                return await session.call_tool(tool_name, params)

    async def _execute_tool_streamable_http(self, tool_name, params) -> CallToolResult:
        async with streamablehttp_client(
            self.mcp_server_url,
            headers=self.headers,
            timeout=self.timeout,
            sse_read_timeout=self.sse_read_timeout,
            auth=self.make_auth_provider(),
        ) as (read_stream, write_stream, _):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()

                return await session.call_tool(tool_name, params)


class ToolExecutor(SaveFileMixin):
    """Base class for tool executors with context support."""

    def __init__(self, context: Optional[Dict[str, Any]] = None):
        """
        Initialize executor with optional context.

        Args:
            context: Dictionary containing team, agent, agent_version, conversation
        """
        self.context = context or {}

    async def aexecute(self, tool_call_id, **params) -> ToolMessage | Command:
        raise NotImplementedError

    def execute(
        self, tool_call_id: Annotated[str, InjectedToolCallId], **params
    ) -> ToolMessage | Command | None:
        """Synchronous wrapper for aexecute."""
        return asyncio.run(self.aexecute(tool_call_id=tool_call_id, **params))


class MCPToolExecutor(ToolExecutor):
    def __init__(
        self,
        mcp_server: MCPServer,
        tool_name: str,
        context: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(context)
        self.mcp_server = mcp_server
        self.tool_name = tool_name
        self.helper = MCPHelper(self.mcp_server)

    async def aexecute(self, tool_call_id, **params) -> ToolMessage:
        result = await self.helper.execute_tool(self.tool_name, params)
        return self._make_langchain_result(tool_call_id, result.content)

    @staticmethod
    def _make_langchain_result(tool_call_id, content) -> ToolMessage:
        text_contents = []
        non_text_contents = []

        for item in content:
            if isinstance(item, TextContent):
                text_contents.append(item)
            else:
                non_text_contents.append(item)

                # Format text content based on count
        tool_content = [content.text for content in text_contents]
        if not text_contents:
            tool_content = ""
        elif len(text_contents) == 1:
            tool_content = tool_content[0]

        return ToolMessage(
            content=tool_content,
            artifact=non_text_contents,
            tool_call_id=tool_call_id,
        )


class APISpecToolExecutor(ToolExecutor):
    """
    Executor for API Spec tools that makes HTTP requests based on OpenAPI specifications.
    Supports multiple content types: JSON, form-urlencoded, multipart, XML, plain text.
    """

    def __init__(
        self, api_spec_tool: APISpecTool, context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(context)
        self.api_spec_tool: APISpecTool = api_spec_tool
        self.api_spec = api_spec_tool.api_spec
        self.headers = {}
        self.base_query_params = {}
        self.timeout = 120.0

        # Load parameters from api_spec.parameters
        for parameter in self.api_spec.parameters.all():
            if parameter.tool_parameter_type == consts.TOOL_PARAMETER_TYPE_HEADER:
                self.headers[parameter.name] = decrypt_key(parameter.value)
            elif parameter.tool_parameter_type == consts.TOOL_PARAMETER_TYPE_QUERY:
                self.base_query_params[parameter.name] = decrypt_key(parameter.value)

    async def aexecute(
        self, tool_call_id: Annotated[str, InjectedToolCallId], **params
    ) -> ToolMessage:
        """
        Execute the API call based on the tool's configuration.

        Args:
            tool_call_id: Unique ID for the tool call. Used for logging.

            **params: Can be either:
                - Nested structure: url_params, query_params, header_params, body_params
                - Flat structure: all params at top level (will be auto-routed based on schema)

        Returns:
            Tuple of (response_text, None) for successful requests
        """

        # Detect if params are in nested or flat structure
        # If we have any of the expected wrapper keys, assume nested structure
        has_nested_structure = any(
            key in params
            for key in ["url_params", "query_params", "header_params", "body_params"]
        )

        if has_nested_structure:
            # Nested structure - extract directly
            url_params = params.get("url_params", {})
            query_params = params.get("query_params", {})
            header_params = params.get("header_params", {})
            body_params = params.get("body_params", None)
        else:
            # Flat structure - route params based on input_schema
            url_params, query_params, header_params, body_params = (
                self._route_flat_params(params)
            )

        # Build URL
        url = self._build_url(url_params, query_params)

        # Prepare headers: base headers + request-specific headers
        headers = {**self.headers, **(header_params or {})}

        # Prepare request kwargs based on content type
        # NOTE: Don't set Content-Type here for multipart - httpx will set it with boundary
        request_kwargs = self._prepare_body(body_params, headers)

        try:
            # Make the HTTP request
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.request(
                    method=self.api_spec_tool.method,
                    url=url,
                    headers=headers,
                    **request_kwargs,
                )
                response.raise_for_status()

                return await self.handle_response(tool_call_id, response)

        except httpx.HTTPStatusError as e:
            return ToolMessage(
                content=f"Error executing tool: {str(e)}",
                tool_call_id=tool_call_id,
                status="error",
            )
        except Exception as e:
            return ToolMessage(
                content=f"Error executing tool: {str(e)}",
                tool_call_id=tool_call_id,
                status="error",
            )

    async def handle_response(
        self, tool_call_id, response: httpx.Response
    ) -> ToolMessage:
        content_type = response.headers.get("content-type", "").split(";")[0]
        extension = "bin"

        if response.status_code == 204:
            return ToolMessage(content="204 No content", tool_call_id=tool_call_id)

        # Text-based content
        if content_type in (
            "application/json",
            "text/plain",
            "text/xml",
            "text/html",
            "application/problem+json",
        ):
            return ToolMessage(
                content=response.text,
                tool_call_id=tool_call_id,
            )

            # Images - can be sent to model if supported
        elif content_type.startswith("image/"):
            extension = content_type.split("/")[-1]
            filename = f"{uuid.uuid4()}.{extension}"

            url = await self.save_file(filename, response.content)
            if url is None:
                return ToolMessage(
                    content="Error saving file",
                    tool_call_id=tool_call_id,
                    status="error",
                )

            return ToolMessage(
                content=f"Image received: {url}",
                artifact={"type": "image", "url": url, "mime_type": content_type},
                tool_call_id=tool_call_id,
            )

            # PDFs and other documents
        elif content_type in (
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ):
            part2 = content_type.split("/")[-1]

            match part2:
                case "pdf":
                    extension = "pdf"
                case "msword":
                    extension = "doc"
                case "vnd.openxmlformats-officedocument.wordprocessingml.document":
                    extension = "docx"

            filename = f"{uuid.uuid4()}.{extension}"

            url = await self.save_file(filename, response.content)
            if url is None:
                return ToolMessage(
                    content="Error saving file",
                    tool_call_id=tool_call_id,
                    status="error",
                )

            return ToolMessage(
                content=f"File received ({content_type}): {filename}",
                artifact={"type": "file", "url": url, "mime_type": content_type},
                tool_call_id=tool_call_id,
            )

            # Audio files
        elif content_type.startswith("audio/"):
            extension = content_type.split("/")[-1]
            filename = f"{uuid.uuid4()}.{extension}"
            url = await self.save_file(filename, response.content)
            if url is None:
                return ToolMessage(
                    content="Error saving file",
                    tool_call_id=tool_call_id,
                    status="error",
                )

            return ToolMessage(
                content=f"Audio received: {url}",
                artifact={"type": "audio", "url": url, "mime_type": content_type},
                tool_call_id=tool_call_id,
            )

            # Video files
        elif content_type.startswith("video/"):
            extension = content_type.split("/")[-1]
            filename = f"{uuid.uuid4()}.{extension}"
            url = await self.save_file(filename, response.content)
            if url is None:
                return ToolMessage(
                    content="Error saving file",
                    tool_call_id=tool_call_id,
                    status="error",
                )

            return ToolMessage(
                content=f"Video received: {url}",
                artifact={"type": "video", "url": url, "mime_type": content_type},
                tool_call_id=tool_call_id,
            )

            # Generic binary files - use artifact
        else:
            extension = "bin"
            filename = f"{uuid.uuid4()}.{extension}"
            url = await self.save_file(filename, response.content)
            if url is None:
                return ToolMessage(
                    content="Error saving file",
                    tool_call_id=tool_call_id,
                    status="error",
                )

            return ToolMessage(
                content=f"File received ({content_type}): {filename}",
                artifact={"type": "file", "url": url, "mime_type": content_type},
                tool_call_id=tool_call_id,
            )

    def _route_flat_params(self, params: Dict[str, Any]) -> tuple:
        """
        Route flat parameters to their appropriate categories based on input_schema.

        When the LLM sends flat params like {"prompt": "...", "accept": "..."}
        we need to figure out which go to body_params, header_params, etc.

        Also applies default values from the schema for required/important params.
        """
        url_params = {}
        query_params = {}
        header_params = {}
        body_params = {}

        input_schema = self.api_spec_tool.input_schema or {}
        properties = input_schema.get("properties", {})

        # Build lookup maps from schema with their property definitions
        url_param_props = properties.get("url_params", {}).get("properties", {})
        query_param_props = properties.get("query_params", {}).get("properties", {})
        header_param_props = properties.get("header_params", {}).get("properties", {})
        body_param_props = properties.get("body_params", {}).get("properties", {})

        # Apply defaults from header_params schema (important for things like 'accept')
        for param_name, param_def in header_param_props.items():
            if param_name not in params and "default" in param_def:
                header_params[param_name] = param_def["default"]

        # Route each param to its category
        for key, value in params.items():
            if value is None:
                continue
            if key in url_param_props:
                url_params[key] = value
            elif key in query_param_props:
                query_params[key] = value
            elif key in header_param_props:
                header_params[key] = value
            elif key in body_param_props:
                body_params[key] = value
            else:
                # Default: assume it's a body param for POST/PUT/PATCH, else query
                if self.api_spec_tool.method.upper() in ["POST", "PUT", "PATCH"]:
                    body_params[key] = value
                else:
                    query_params[key] = value

        return (
            url_params or {},
            query_params or {},
            header_params or {},
            body_params if body_params else None,
        )

    def _prepare_body(
        self, body_params: Any, headers: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Prepare the request body based on the tool's content type.

        Args:
            body_params: The body parameters from the request
            headers: Headers dict (will be modified to add Content-Type if needed)

        Returns:
            Dict of kwargs to pass to httpx.request (e.g., json=, data=, content=, files=)
        """
        if body_params is None:
            return {}

        content_type = self.api_spec_tool.content_type

        if content_type == "application/json":
            headers["Content-Type"] = "application/json"
            return {"json": body_params}

        elif content_type == "application/x-www-form-urlencoded":
            headers["Content-Type"] = "application/x-www-form-urlencoded"
            # body_params should be a dict for form data
            return {"data": body_params if isinstance(body_params, dict) else {}}

        elif content_type == "multipart/form-data":
            # DON'T set Content-Type header - httpx will set it with proper boundary
            # Remove Content-Type if it was set elsewhere
            headers.pop("Content-Type", None)

            if isinstance(body_params, dict):
                # For multipart/form-data, ALL fields must go through 'files' parameter
                # as tuples: (filename, content, content_type) or (None, value) for non-files
                files = {}
                for key, value in body_params.items():
                    if value is None:
                        continue
                    if (
                        isinstance(value, dict)
                        and "filename" in value
                        and "content" in value
                    ):
                        # File-like structure: {"filename": "...", "content": "...", "content_type": "..."}
                        files[key] = (
                            value.get("filename", key),
                            value.get("content", ""),
                            value.get("content_type", "application/octet-stream"),
                        )
                    else:
                        # Regular field - wrap as tuple for multipart
                        # (None, value) tells httpx it's a form field, not a file
                        files[key] = (
                            None,
                            str(value) if not isinstance(value, str) else value,
                        )

                return {"files": files} if files else {}
            return {}

        elif content_type in ("text/plain", "text/xml", "application/xml"):
            headers["Content-Type"] = content_type
            # body_params should be a string for text content
            if isinstance(body_params, str):
                return {"content": body_params}
            elif isinstance(body_params, dict):
                # Try to convert dict to string (for XML, user should provide string)
                return {"content": json.dumps(body_params)}
            return {"content": str(body_params)}

        else:
            # Unknown content type - try JSON as fallback
            headers["Content-Type"] = content_type
            if isinstance(body_params, dict):
                return {"json": body_params}
            return {"content": str(body_params)}

    def _build_url(
        self, url_params: Dict[str, Any], query_params: Dict[str, Any]
    ) -> str:
        """
        Build the full URL with path parameters and query string.

        Args:
            url_params: Dict of path parameters to replace in the URL template
            query_params: Dict of query parameters to add to the URL

        Returns:
            The fully constructed URL
        """
        # Start with base URL and path
        base_url = self.api_spec.base_url.rstrip("/")
        path = self.api_spec_tool.path

        # Replace path parameters (e.g., /users/{userId} -> /users/123)
        if url_params:
            for param_name, param_value in url_params.items():
                path = path.replace(f"{{{param_name}}}", str(param_value))

        # Build full URL
        full_url = f"{base_url}{path}"

        # Merge base query params with request query params
        merged_query_params = {**self.base_query_params, **(query_params or {})}

        # Add query string if there are any params
        if merged_query_params:
            query_string = urlencode(merged_query_params)
            full_url = f"{full_url}?{query_string}"

        return full_url


class BuiltinToolExecutor(ToolExecutor):
    def __init__(self, builtin_tool: Tool, context: Optional[Dict[str, Any]] = None):
        super().__init__(context)
        self.builtin_tool = builtin_tool

    async def aexecute(self, tool_call_id: str, **params) -> ToolMessage | Command:
        try:
            tool_class = BuiltinToolRegistry.get(self.builtin_tool.key)
            tool: BaseBuiltinTool = tool_class(self.builtin_tool, context=self.context)

            return await tool.arun(tool_call_id=tool_call_id, **params)
        except ValueError as e:
            return ToolMessage(
                content=str(e),
                tool_call_id=tool_call_id,
            )


class KnowledgeBaseQuestionExecutor(ToolExecutor):
    """
    Executor for knowledge base question answering.
    Uses the Retriever class to query knowledge bases with retrieval settings.
    """

    def __init__(
        self,
        knowledge_base: KnowledgeBase,
        retrieval_setting: Optional[RetrievalSetting] = None,
        context: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(context)
        self.knowledge_base = knowledge_base
        self.retrieval_setting = retrieval_setting
        self.retriever = Retriever(
            knowledge_base=knowledge_base, retrieval_setting=retrieval_setting
        )

    async def aexecute(self, tool_call_id: str, **params) -> ToolMessage:
        return await asyncio.to_thread(self.execute, tool_call_id, **params)

    def execute(self, tool_call_id: str, **params) -> ToolMessage:
        """
        Execute knowledge base query.

        Args:
            tool_call_id: Unique ID for the tool call
        Returns:
            ToolMessage with retrieved documents
        """
        try:
            # Filters are passed as a parameter
            query = params.get("query")
            # Retrieve documents
            documents = self.retriever.retrieve(query=query)

            # Format results
            if not documents:
                return ToolMessage(
                    content="No relevant documents found in the knowledge base.",
                    tool_call_id=tool_call_id,
                )

            # Format documents as a readable response
            results = []
            for doc in documents:
                result_text = f"Content: {doc.content}"
                # if doc.metadata:
                #     result_text += f"\nMetadata: {json.dumps(doc.metadata, indent=2)}"
                if doc.score is not None:
                    result_text += f"\nRelevance Score: {doc.score:.4f}"
                results.append(result_text)

            content = (
                f"Found {len(documents)} relevant document(s):\n\n"
                + "\n\n---\n\n".join(results)
            )

            return ToolMessage(
                content=content,
                tool_call_id=tool_call_id,
            )
        except Exception as e:
            import logging

            logger = logging.getLogger(__name__)
            logger.error(f"Error querying knowledge base: {str(e)}", exc_info=True)
            return ToolMessage(
                content=f"Error querying knowledge base: {str(e)}",
                tool_call_id=tool_call_id,
            )


class AgentToolExecutor(ToolExecutor):
    """
    Executor for delegating tasks to another agent.
    Allows one agent to use another agent as a tool.
    """

    def __init__(
        self, agent_version: AgentVersion, context: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize agent tool executor.

        Args:
            agent_version: The Runnable agent to execute
            context: Optional context for execution
        """
        super().__init__(context)
        self.agent_version = agent_version
        self.conversation_id = str(uuid.uuid4())

    async def aexecute(self, tool_call_id, **params) -> ToolMessage | Command:
        return await asyncio.to_thread(self.execute, tool_call_id, **params)

    def execute(self, tool_call_id: str, **params) -> ToolMessage:
        """
        Execute the agent tool by invoking the agent with the given query.

        Args:
            tool_call_id: Unique ID for the tool call
            **params: Parameters including 'query' and optional 'inputs'

        Returns:
            ToolMessage with the agent's response
        """
        from .chat_service import ConversationService

        try:
            query = params.get("query")
            inputs = params.get("inputs", {})

            conversation = ConversationService.get_or_create_conversation(
                team=self.context["team"],
                agent=self.agent_version.agent,
                agent_version=self.agent_version,
                user_identifier="agent_as_tool",
                conversation_id=self.conversation_id,
                inputs=inputs,
            )

            if not query:
                return ToolMessage(
                    content="Error: No query provided for agent tool",
                    tool_call_id=tool_call_id,
                    status="error",
                )

            # Invoke the agent with the query
            message_block = conversation.chat_blocking(query)

            # Extract the response from messages
            message = message_block.messages.last()
            if not message:
                return ToolMessage(
                    content="Error: No response from agent tool",
                    tool_call_id=tool_call_id,
                    status="error",
                )

            return ToolMessage(
                content=str(message.content),
                tool_call_id=tool_call_id,
                status="success",
            )

        except Exception as e:
            logger.error(f"Error executing agent tool: {str(e)}", exc_info=True)
            return ToolMessage(
                content=f"Error executing agent: {str(e)}",
                tool_call_id=tool_call_id,
                status="error",
            )
