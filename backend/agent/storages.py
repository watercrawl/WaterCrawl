import json
from typing import Optional
from mcp.client.auth import TokenStorage
from mcp.shared.auth import OAuthToken, OAuthClientInformationFull
from pydantic import AnyUrl

from agent import consts
from agent.models import MCPServer
from common.encryption import encrypt_key, decrypt_key


class DjangoTokenStorage(TokenStorage):
    """Django-based token storage using single JSON field"""

    def __init__(self, mcp_server: MCPServer):
        self.mcp_server = mcp_server
        self.parameter = None
        self._loaded = False

    async def load_oauth_data(self):
        """Retrieve OAuth data from database"""
        if not self._loaded:
            self.parameter = await self.mcp_server.parameters.filter(
                tool_parameter_type=consts.TOOL_PARAMETER_OAUTH
            ).afirst()
            self._loaded = True

        if not self.parameter:
            return {}
        return json.loads(decrypt_key(self.parameter.value))

    async def save_oauth_data(self, value):
        """Store OAuth data in database"""
        if not self.parameter:
            self.parameter = await self.mcp_server.parameters.acreate(
                tool_parameter_type=consts.TOOL_PARAMETER_OAUTH,
                value=encrypt_key(json.dumps(value)),
            )
        else:
            self.parameter.value = encrypt_key(json.dumps(value))
            self.parameter.save(update_fields=["value"])

    async def get_tokens(self) -> Optional[OAuthToken]:
        """Retrieve OAuth tokens from database"""
        oauth_data = await self.load_oauth_data()
        tokens_data = oauth_data.get("tokens")

        if not tokens_data:
            return None

        return OAuthToken(**tokens_data)

    async def set_tokens(self, tokens: OAuthToken) -> None:
        """Store OAuth tokens in database"""
        oauth_data = await self.load_oauth_data()
        oauth_data["tokens"] = tokens.model_dump(mode="json", exclude_none=True)
        await self.save_oauth_data(oauth_data)

    async def get_client_info(self) -> Optional[OAuthClientInformationFull]:
        """Retrieve OAuth client info from database"""
        oauth_data = await self.load_oauth_data()
        client_info_data = oauth_data.get("client_info")

        if not client_info_data:
            return None

            # Reconstruct redirect_uris as AnyUrl objects
        if "redirect_uris" in client_info_data:
            client_info_data["redirect_uris"] = [
                AnyUrl(uri) for uri in client_info_data["redirect_uris"]
            ]

        return OAuthClientInformationFull(**client_info_data)

    async def set_client_info(self, client_info: OAuthClientInformationFull) -> None:
        """Store OAuth client info in database"""
        oauth_data = await self.load_oauth_data()
        oauth_data["client_info"] = client_info.model_dump(
            mode="json", exclude_none=True
        )

        await self.save_oauth_data(oauth_data)
