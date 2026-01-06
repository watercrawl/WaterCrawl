import secrets
import time
from enum import Enum
from typing import Optional, Dict, Any, AsyncGenerator
from urllib.parse import urljoin, urlencode

import httpx
from mcp import ClientSession
from mcp.client.auth import (
    OAuthClientProvider,
    OAuthFlowError,
    PKCEParameters,
    TokenStorage as BaseTokenStorage,
)
from mcp.client.sse import sse_client
from mcp.client.streamable_http import streamablehttp_client
from mcp.shared.auth import OAuthClientMetadata, OAuthMetadata
from pydantic import BaseModel


class TransportType(Enum):
    SSE = "sse"
    STREAMABLE_HTTP = "streamable_http"


class MCPConnectionError(Exception):
    """Raised when connection to MCP server fails"""

    pass


class MCPAuthenticationError(Exception):
    """Raised when authentication fails"""

    pass


class MCPOAuthRequiredError(Exception):
    """Raised when OAuth authentication is required"""

    pass


class MCPToolParameters(BaseModel):
    name: str
    description: str
    key: str
    input_schema: Optional[Dict[str, Any]]
    output_schema: Optional[Dict[str, Any]]


class LoginData(BaseModel):
    state: str
    code_verifier: str


class TokenStorage(BaseTokenStorage):
    async def get_login_data(self) -> LoginData | None:
        """To get state and code verifier"""
        ...

    async def set_login_data(self, login_data: LoginData) -> None:
        """To store state and code verifier"""
        ...

    async def clear_login_data(self) -> None:
        """To clear state and code verifier"""
        ...

    async def set_oauth_metadata(self, oauth_metadata: OAuthMetadata) -> None: ...

    async def get_oauth_metadata(self) -> Optional[OAuthMetadata]: ...


class MCPOAuthProvider(OAuthClientProvider):
    def __init__(
        self,
        server_url: str,
        client_metadata: OAuthClientMetadata,
        storage: TokenStorage,
        timeout: float = 300.0,
    ):
        super().__init__(
            server_url=server_url,
            client_metadata=client_metadata,
            storage=storage,
            redirect_handler=None,
            callback_handler=None,
            timeout=timeout,
        )

    async def _initialize(self) -> None:
        await super()._initialize()
        # always set token expiry now to refresh token
        self.context.token_expiry_time = time.time()
        self.context.oauth_metadata = await self.context.storage.get_oauth_metadata()

    async def _perform_authorization(self) -> httpx.Request:
        await self.context.storage.set_oauth_metadata(self.context.oauth_metadata)
        raise MCPOAuthRequiredError

    async def build_authorization_url(self) -> str:
        if not self._initialized:
            await self._initialize()

        print(self.context.oauth_metadata)
        if (
            self.context.oauth_metadata
            and self.context.oauth_metadata.authorization_endpoint
        ):
            auth_endpoint = str(
                self.context.oauth_metadata.authorization_endpoint
            )  # pragma: no cover
        else:
            auth_base_url = self.context.get_authorization_base_url(
                self.context.server_url
            )
            auth_endpoint = urljoin(auth_base_url, "/authorize")

        if not self.context.client_info:
            raise OAuthFlowError(
                "No client info available for authorization"
            )  # pragma: no cover

        # Generate PKCE parameters
        pkce_params = PKCEParameters.generate()
        state = secrets.token_urlsafe(32)

        await self.context.storage.set_login_data(
            LoginData(state=state, code_verifier=pkce_params.code_verifier)
        )

        auth_params = {
            "response_type": "code",
            "client_id": self.context.client_info.client_id,
            "redirect_uri": str(self.context.client_metadata.redirect_uris[0]),
            "state": state,
            "code_challenge": pkce_params.code_challenge,
            "code_challenge_method": "S256",
        }

        # Only include resource param if conditions are met
        if self.context.should_include_resource_param(self.context.protocol_version):
            auth_params["resource"] = (
                self.context.get_resource_url()
            )  # RFC 8707  # pragma: no cover

        if self.context.client_metadata.scope:  # pragma: no branch
            auth_params["scope"] = self.context.client_metadata.scope

        authorization_url = f"{auth_endpoint}?{urlencode(auth_params)}"

        return authorization_url

    async def _get_authorization_request(
        self, auth_code, returned_state
    ) -> httpx.Request:
        login_data: LoginData = await self.context.storage.get_login_data()
        if returned_state is None or not secrets.compare_digest(
            returned_state, login_data.state
        ):
            raise OAuthFlowError(
                f"State parameter mismatch: {returned_state} != {login_data.state}"
            )  # pragma: no cover

        if not auth_code:
            raise OAuthFlowError("No authorization code received")  # pragma: no cover
        token_request = await self._exchange_token_authorization_code(
            auth_code, login_data.code_verifier
        )
        await self.context.storage.clear_login_data()
        return token_request

    async def handle_callback(self, auth_code, returned_state):
        if not self._initialized:
            await self._initialize()
        token_request = await self._get_authorization_request(auth_code, returned_state)
        async with httpx.AsyncClient() as client:
            token_response = await client.send(token_request)
        await self._handle_token_response(token_response)


class MCPServerParser:
    def __init__(
        self,
        mcp_server_url: str,
        headers: Optional[Dict[str, str]] = None,
        auth: Optional[httpx.Auth] = None,
        timeout: float = 30.0,
        sse_read_timeout: float = 300.0,
        transport_type: Optional[TransportType] = None,
    ):
        self.mcp_server_url = mcp_server_url
        self._headers = headers or {}
        self._timeout = timeout
        self._sse_read_timeout = sse_read_timeout
        self._transport_type: Optional[TransportType] = transport_type
        self._auth = auth

    @property
    def headers(self):
        return self._headers

    @headers.setter
    def headers(self, headers: Dict[str, str]):
        self._headers = headers

    async def _validate_connection(self, transport_type: TransportType) -> None:
        """
        Validate connection to the server using specified transport.

        Args:
            transport_type: The transport type to test

        Raises:
            MCPConnectionError: If connection fails
            MCPAuthenticationError: If authentication fails
            MCPOAuthRequiredError: If OAuth authentication is required
        """
        try:
            if transport_type == TransportType.SSE:
                async with sse_client(
                    self.mcp_server_url,
                    headers=self._headers,
                    timeout=self._timeout,
                    sse_read_timeout=self._sse_read_timeout,
                    auth=self._auth,
                ) as (read_stream, write_stream):
                    async with ClientSession(read_stream, write_stream) as session:
                        await session.initialize()
            else:  # STREAMABLE_HTTP
                async with streamablehttp_client(
                    self.mcp_server_url,
                    headers=self._headers,
                    timeout=self._timeout,
                    sse_read_timeout=self._sse_read_timeout,
                    auth=self._auth,
                ) as (read_stream, write_stream, _):
                    async with ClientSession(read_stream, write_stream) as session:
                        await session.initialize()
        except MCPOAuthRequiredError:
            raise  # Re-raise OAuth errors
        except httpx.HTTPStatusError as e:
            if e.response.status_code in (401, 403):
                raise MCPAuthenticationError(
                    f"Authentication failed: {e.response.status_code} - {e.response.text}"
                )

            if e.response.status_code == 405:
                raise MCPConnectionError(
                    f"HTTP error: {e.response.status_code} - It looks like you're trying to use an unsupported transport type."
                )
            raise MCPConnectionError(
                f"HTTP error: {e.response.status_code} - {e.response.text}"
            )
        except Exception as e:
            raise MCPConnectionError(f"Connection failed: {str(e)}")

    async def validate(self) -> bool:
        """
        Validate connection to the MCP server.

        Returns:
            bool: True if connection is successful

        Raises:
            MCPConnectionError: If connection fails
            MCPAuthenticationError: If authentication fails
            MCPOAuthRequiredError: If OAuth authentication is required
        """
        if self._transport_type is None:
            raise MCPConnectionError("Transport type must be provided")

        await self._validate_connection(self._transport_type)
        return True

    async def tools(self) -> AsyncGenerator[MCPToolParameters, None]:
        """
        List all tools from the MCP server.

        Yields:
            MCPToolParameters: Tool information

        Raises:
            MCPConnectionError: If not validated or connection fails
            MCPAuthenticationError: If authentication fails
            MCPOAuthRequiredError: If OAuth authentication is required
        """
        if self._transport_type is None:
            await self.validate()

        try:
            if self._transport_type == TransportType.SSE:
                async with sse_client(
                    self.mcp_server_url,
                    headers=self._headers,
                    timeout=self._timeout,
                    sse_read_timeout=self._sse_read_timeout,
                    auth=self._auth,
                ) as (read_stream, write_stream):
                    async with ClientSession(read_stream, write_stream) as session:
                        await session.initialize()
                        tools = await session.list_tools()

                        for tool in tools.tools:
                            yield MCPToolParameters(
                                name=tool.name,
                                description=tool.description or "",
                                key=tool.name,
                                input_schema=tool.inputSchema,
                                output_schema=tool.outputSchema,
                            )
            else:  # STREAMABLE_HTTP
                async with streamablehttp_client(
                    self.mcp_server_url,
                    headers=self._headers,
                    timeout=self._timeout,
                    sse_read_timeout=self._sse_read_timeout,
                    auth=self._auth,
                ) as (read_stream, write_stream, _):
                    async with ClientSession(read_stream, write_stream) as session:
                        await session.initialize()
                        tools = await session.list_tools()

                        for tool in tools.tools:
                            yield MCPToolParameters(
                                name=tool.name,
                                description=tool.description or "",
                                key=tool.name,
                                input_schema=tool.inputSchema,
                                output_schema=tool.outputSchema,
                            )
        except MCPOAuthRequiredError:
            raise  # Re-raise OAuth errors
        except ExceptionGroup as e:
            for exc in e.exceptions:
                if isinstance(exc, httpx.HTTPStatusError):
                    if exc.response.status_code in (401, 403):
                        raise MCPAuthenticationError(
                            f"Authentication failed: {exc.response.status_code}"
                        )
                    if exc.response.status_code == 405:
                        raise MCPConnectionError(
                            f"HTTP error: {exc.response.status_code} -- It looks like you're trying to use an unsupported transport type."
                        )
                    raise MCPConnectionError(
                        f"HTTP error: {exc.response.status_code} - {exc.response.text}"
                    )
                raise
        except Exception as e:
            raise MCPConnectionError(f"Failed to list tools: {str(e)}")
