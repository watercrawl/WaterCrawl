from llm.factories import ProviderFactory
from llm.models import ProviderConfig, LLMModel, EmbeddingModel


class ProviderConfigAdminService:
    def __init__(self, provider_config: ProviderConfig):
        self.provider_config = provider_config

    def sync_if_needed(self):
        if not LLMModel.objects.filter(
            provider_name=self.provider_config.provider_name
        ).exists():
            self.sync_llm_models()
        if not EmbeddingModel.objects.filter(
            provider_name=self.provider_config.provider_name
        ).exists():
            self.sync_provider_embeddings()

    def sync_llm_models(self):
        provider = ProviderFactory.from_provider_config(self.provider_config)
        for model in provider.get_models():
            LLMModel.objects.update_or_create(
                provider_name=self.provider_config.provider_name,
                key=model["key"],
                defaults={
                    "name": model["name"],
                    "min_temperature": model["min_temperature"],
                    "max_temperature": model["max_temperature"],
                    "default_temperature": model["default_temperature"],
                },
            )

    def sync_provider_embeddings(self):
        provider = ProviderFactory.from_provider_config(self.provider_config)
        for model in provider.get_embeddings():
            EmbeddingModel.objects.update_or_create(
                provider_name=self.provider_config.provider_name,
                key=model["key"],
                defaults={
                    "name": model["name"],
                    "dimensions": model["dimensions"],
                    "max_input_length": model["max_input_length"],
                    "truncate": model["truncate"],
                },
            )
