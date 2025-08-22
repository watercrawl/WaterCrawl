import os
import json
import traceback
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union, Iterator
from types import GeneratorType
from collections.abc import Generator, Iterable

import litellm
from litellm import ModelResponse, stream_chunk_builder
from openai import OpenAIError
from watercrawl import WaterCrawlAPIClient

from .utils import _debug_print_separator, _debug_print

LOGGER = logging.getLogger(__name__)

@dataclass(slots=True)
class LLMClient:
    """
    Thin, provider-agnostic wrapper around `litellm.completion`.
    Works with any LiteLLM provider as long as you use the correct
    model name or `<provider>/` prefix.
    """

    model: str = "openai/gpt-4o"
    api_key: str | None = None          # optional – can rely on env
    api_base: str | None = None         # optional – custom endpoint
    temperature: float = 0.0
    stream: bool = False
    debug: bool = False

    _provider: str = field(init=False, repr=False)

    def __post_init__(self) -> None:
        self._provider = self._detect_provider(self.model)
        self._export_keys()

    # ---------- public API --------------------------------------------------

    def ask(self, prompt: str, **kwargs):
        messages = [{"role": "user", "content": prompt}]
        want_stream = kwargs.pop("stream", self.stream)

        resp = litellm.completion(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            stream=want_stream,
            drop_params=True,
            **kwargs,
        )

        # 1) ─────────────────── Streaming path ───────────────────
        if want_stream:
            # resp is a generator of ModelResponseChunk
            def text_stream():
                for chunk in resp:
                    yield chunk.choices[0].delta.content or ""
            return text_stream()

        # 2) ─────────────────── Non-stream path ──────────────────
        if isinstance(resp, ModelResponse):                    # new normal
            return resp.choices[0].message.content.strip()

        if isinstance(resp, Generator):
            # provider secretly streamed → rebuild a single object
            full = stream_chunk_builder(list(resp), messages=messages)
            return full.choices[0].message.content.strip()

        raise TypeError(f"Unexpected LiteLLM response type: {type(resp)}")                      # ultra-defensive fallback


    # ---------- helpers -----------------------------------------------------

    def _detect_provider(self, model: str) -> str:
        """Infer provider from prefix or heuristics."""
        if "/" in model:
            return model.split("/", 1)[0]

        # heuristic fall-backs for naked model names
        if model.startswith(("gpt-", "openai")):
            return "openai"
        if model.startswith(("claude", "anthropic")):
            return "anthropic"
        if model.startswith("deepseek"):
            return "deepseek"
        if model.startswith(("llama", "ollama")):
            return "ollama"
        # default
        return "openai"

    def _export_keys(self) -> None:
        """Populate the correct env-vars so LiteLLM sees the credentials."""
        env_map = {
            "openai": "OPENAI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
            "deepseek": "DEEPSEEK_API_KEY",
            # Ollama uses no key; add others here as needed
        }
        if self.api_key and (key_name := env_map.get(self._provider)):
            os.environ[key_name] = self.api_key

        if self.api_base:
            os.environ[f"{self._provider.upper()}_API_BASE"] = self.api_base



@dataclass
class WaterCrawler:
    """Wrapper around WaterCrawl operations used by this program."""

    api_key: str
    debug_mode: bool = False

    def __post_init__(self) -> None:
        self._client = WaterCrawlAPIClient(self.api_key)

    # ───────────────────────── public façade ────────────────────────── #
    def sitemap_full(self, url: str) -> List[str]:
        """Return a complete sitemap of URLs within the domain."""
        request = self._client.create_sitemap_request(
            url=url,
            options={
                "include_subdomains": False,
                "ignore_sitemap_xml": False,
                "search": "",  # Empty search to get all URLs
                "include_paths": [],
                "exclude_paths": [],
            },
        )
        req_id: str = request["uuid"]
        LOGGER.info("Full sitemap request created (%s)", req_id)

        # Wait for completion
        for event in self._client.monitor_sitemap_request(req_id):
            if event["type"] == "state":
                status = event["data"]["status"]
                LOGGER.debug("Sitemap status → %s", status)
                if status in {"finished", "failed"}:
                    break
            elif event["type"] == "feed":
                LOGGER.debug("%s", event["data"]["message"])

        raw: Any = self._client.get_sitemap_results(req_id, output_format="json")

        # WaterCrawl may yield a JSON string, list[str], or list[dict]
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)  # type: ignore[assignment]
            except json.JSONDecodeError:
                traceback.print_exc()           
                raw = [raw]

        urls: List[str] = []
        for entry in raw:
            if isinstance(entry, dict):
                url_val: Optional[str] = entry.get("url")
                if url_val:
                    urls.append(url_val)
            elif isinstance(entry, str):
                urls.append(entry)

        # DEBUG: Print sitemap results
        if self.debug_mode:
            _debug_print_separator("COMPLETE SITEMAP RESULTS", self.debug_mode)
            _debug_print(f"Total URLs found: {len(urls)}", self.debug_mode)
            for i, url in enumerate(urls[:20], 1):  # Show first 20
                _debug_print(f"{i:2d}. {url}", self.debug_mode)
            if len(urls) > 20:
                _debug_print(f"... and {len(urls) - 20} more URLs", self.debug_mode)

        return urls

    def sitemap(self, url: str, search_filter: str) -> List[str]:
        """Return a flat list of URLs within *url* that contain *search_filter*."""
        request = self._client.create_sitemap_request(
            url=url,
            options={
                "include_subdomains": False,
                "ignore_sitemap_xml": False,
                "search": search_filter,
                "include_paths": [],
                "exclude_paths": [],
            },
        )
        req_id: str = request["uuid"]
        LOGGER.info("Sitemap request created (%s) for search: '%s'", req_id, search_filter)

        # Wait for completion
        for event in self._client.monitor_sitemap_request(req_id):
            if event["type"] == "state":
                status = event["data"]["status"]
                LOGGER.debug("Sitemap status → %s", status)
                if status in {"finished", "failed"}:
                    break
            elif event["type"] == "feed":
                LOGGER.debug("%s", event["data"]["message"])

        raw: Any = self._client.get_sitemap_results(req_id, output_format="json")

        # WaterCrawl may yield a JSON string, list[str], or list[dict]
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)  # type: ignore[assignment]
            except json.JSONDecodeError:
                traceback.print_exc()           
                raw = [raw]

        urls: List[str] = []
        for entry in raw:
            if isinstance(entry, dict):
                url_val: Optional[str] = entry.get("url")
                if url_val:
                    urls.append(url_val)
            elif isinstance(entry, str):
                urls.append(entry)

        return urls

    def scrape(self, url: str) -> Dict[str, Any]:
        """Download *url* and return WaterCrawl's result object."""
        result = self._client.scrape_url(
            url,
            page_options={
                "only_main_content": True,
                "include_html": False,
                "include_links": True,
                "timeout": 15_000,
            },
            plugin_options={},
            sync=True,
            download=True,
        )["result"]["markdown"]

        # DEBUG: Print crawl results
        if self.debug_mode:
            _debug_print_separator(f"CRAWL RESULT FOR: {url}", self.debug_mode)
            _debug_print(f"URL: {url}", self.debug_mode)
            _debug_print(f"scrape of URL   >>>>>>>>>: {result}", self.debug_mode)
            

            # Show other potentially useful fields
            if "links" in result:
                links = result["links"][:10]  # First 10 links
                _debug_print(f"Links found: {len(result['links'])} total, showing first 10:", self.debug_mode)
                for link in links:
                    _debug_print(f"  - {link}", self.debug_mode)
        
        return result
