from functools import cached_property
from typing import List

from llm.interfaces import BaseProvider


class OpenAIProvider(BaseProvider):
    @cached_property
    def client(self):
        from openai import OpenAI

        return OpenAI(
            api_key=self.config["api_key"],
            base_url=self.config["base_url"] or "https://api.openai.com/v1",
        )

    def _get_model_temperature(self, model: str) -> dict:
        if model in [
            "o1",
            "o1-mini",
            "o3",
            "o3-mini",
            "o4-mini",
            "gpt-5",
            "gpt-5-mini",
            "gpt-5-nano",
            "gpt-5-chat-latest",
        ]:
            return {
                "min_temperature": None,
                "max_temperature": None,
                "default_temperature": 1,
            }
        return {
            "min_temperature": 0.0,
            "max_temperature": 2.0,
            "default_temperature": 0.7,
        }

    def get_models(self) -> List[dict]:
        models = self.client.models.list()
        result = []
        for model in models:
            if "embedding" in model.id:
                continue
            if model.owned_by in ["openai", "openai-internal", "system"]:
                result.append(
                    {
                        "key": model.id,
                        "name": model.id,
                        **self._get_model_temperature(model.id),
                    }
                )

        return result

    def get_embeddings(self) -> List[dict]:
        return [
            {
                "name": "text-embedding-ada-002",
                "key": "text-embedding-ada-002",
                "dimensions": 1536,
                "max_input_length": 8191,
                "truncate": "end",
            },
            {
                "name": "text-embedding-3-small",
                "key": "text-embedding-3-small",
                "dimensions": 1536,
                "max_input_length": 8192,
                "truncate": "end",
            },
            {
                "name": "text-embedding-3-large",
                "key": "text-embedding-3-large",
                "dimensions": 3072,
                "max_input_length": 8192,
                "truncate": "end",
            },
        ]


class WaterCrawlProvider(BaseProvider):
    @cached_property
    def client(self):
        try:
            from watercrawl_llm import WaterCrawlLLM
        except ImportError:
            raise ImportError("WaterCrawlLLM is not installed. Please install it")
        return WaterCrawlLLM(
            api_key=self.config["api_key"],
            base_url=self.config["base_url"],
        )

    def get_models(self) -> List[dict]:
        return []

    def get_embeddings(self) -> List[dict]:
        return []
