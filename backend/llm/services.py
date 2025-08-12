import requests

from django.db.models import Q

from llm import consts
from llm.models import ProviderConfig
from user.models import Team


class ProviderService:
    @classmethod
    def get_available_providers(cls):
        return [
            {"key": key, "title": value}
            for key, value in consts.LLM_PROVIDER_WITHOUT_WATERCRAWL_CHOICES
        ]


class ProviderConfigService:
    def __init__(self, provider_config: ProviderConfig):
        self.provider_config: ProviderConfig = provider_config

    @classmethod
    def get_team_provider_configs(cls, team: Team):
        return ProviderConfig.objects.filter(Q(team=team) | Q(team__isnull=True))

    @classmethod
    def test_provider_config(
        cls, provider_name: str, api_key: str, base_url: str = None
    ) -> bool:
        """Test if a provider configuration is valid.

        Args:
            provider_name: Provider name
            api_key: API key to test
            base_url: Optional base URL override

        Returns:
            Dictionary with test results
        """

        try:
            # Different validation logic depending on provider
            if provider_name == "openai":
                return cls._test_openai_provider(api_key, base_url)
            return False
        except Exception:
            pass

        return False

    @classmethod
    def _test_openai_provider(cls, api_key: str, base_url: str = None) -> bool:
        """Test OpenAI provider configuration."""
        # Use default OpenAI API URL if not provided
        api_url = base_url or "https://api.openai.com/v1"
        # Make sure URL doesn't end with slash
        if api_url.endswith("/"):
            api_url = api_url[:-1]

        # Test with a simple models list request
        response = requests.get(
            f"{api_url}/models",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
        )

        if response.status_code == 200:
            return True

        return False
