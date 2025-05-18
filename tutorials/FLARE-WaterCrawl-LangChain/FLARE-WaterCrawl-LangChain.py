
#!/usr/bin/env python3
"""
watercrawl_flare_rag.py
====================================================

End‑to‑end RAG playground that combines

  • WaterCrawl  – crawl, scrape, and search
  • FLARE Chain – retrieval‑aware answer refinement
  • LangChain   – orchestration layer
  • OpenAI (GPT‑4o) – default LLM
  • Tavily (optional) – drop‑in search alternative

It:

1. Accepts a natural‑language query from the CLI.
2. Runs either WaterCrawl Search (default) or Tavily to get fresh links.
3. Scrapes each link with WaterCrawl and wraps results in LangChain
   `Document`s.
4. Feeds those docs to `FlareChain`, which iteratively checks model
   confidence and pulls more context when needed.
5. Prints the final, source‑grounded answer.

---------------------------
Environment variables (.env)
---------------------------
OPENAI_API_KEY=•••
WATERCRAWL_API_KEY=•••
# optional – only if you want to use Tavily
TAVILY_API_KEY=•••
----------------------------------------------------
Dependencies (install once, then comment the pip block
----------------------------------------------------
    pip install --upgrade pip
    pip install python-dotenv requests \
                langchain-community langchain-core langchain-openai \
                langchain tavily-python watercrawl-py
"""
from __future__ import annotations

import argparse
import logging
import os
import sys
from typing import Any, Callable, List, Optional

import requests
from dotenv import load_dotenv
from langchain.callbacks.manager import (
    AsyncCallbackManagerForRetrieverRun,
    CallbackManagerForRetrieverRun,
)
from langchain.chains import FlareChain
from langchain.globals import set_verbose
from langchain_openai import ChatOpenAI
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from pydantic import BaseModel, Field
from watercrawl import WaterCrawlAPIClient

###############################################################################
# Logging helpers
###############################################################################
LOG_FORMAT = "%(asctime)s — %(levelname)-8s — %(message)s"
logging.basicConfig(stream=sys.stdout, level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger("watercrawl_flare_rag")

###############################################################################
# Search helpers (WaterCrawl + Tavily)
###############################################################################
def tavily_search_tool(
    query: str,
    api_key: str,
    max_results: int = 3,
    *,
    topic: str = "general",
    depth: str = "basic",  # "basic" | "deep"
) -> List[str]:
    """Return top‐N URLs from Tavily Search API."""
    url = "https://api.tavily.com/search"
    payload = {
        "query": query,
        "topic": topic,
        "search_depth": depth,
        "max_results": max_results,
        "include_answer": False,
    }
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        resp.raise_for_status()
        results = resp.json().get("results", [])
        urls = [hit["url"] for hit in results if isinstance(hit, dict) and hit.get("url")]
        logger.debug("Tavily URLs: %s", urls)
        return urls[: max_results]
    except Exception as exc:  # noqa: BLE001
        logger.warning("Tavily search failed: %s", exc)
        return []


def watercrawl_search_tool(
    query: str,
    api_key: str,
    max_results: int = 3,
    *,
    language: str = "en",
    country: str = "us",
    time_range: str = "month",  # "day" | "week" | "month" | "year" | "all"
    depth: str = "basic",  # "basic" | "deep"
) -> List[str]:
    """Return top‐N URLs from WaterCrawl Search."""
    client = WaterCrawlAPIClient(api_key)
    try:
        req = client.create_search_request(
            query=query,
            search_options={
                "depth": depth,
                "language": language,
                "country": country,
                "time_range": time_range,
                "search_type": "web",
            },
            result_limit=max_results,
            sync=True,
            download=True,
        )
        urls = [hit["url"] for hit in req.get("result", []) if hit.get("url")]
        logger.debug("WaterCrawl URLs: %s", urls)
        return urls[: max_results]
    except Exception as exc:  # noqa: BLE001
        logger.warning("WaterCrawl search failed: %s", exc)
        return []


###############################################################################
# LangChain retriever that glues search → scrape
###############################################################################
class WaterCrawlRetriever(BaseRetriever, BaseModel):
    """Custom LangChain retriever using WaterCrawl scrape."""

    client: WaterCrawlAPIClient
    tavily_api_key: Optional[str] = None
    watercrawl_api_key: Optional[str] = None
    search_tool: Callable[[str, str, int], List[str]] = Field(
        default_factory=lambda: watercrawl_search_tool
    )

    page_options: dict = {
        "exclude_tags": ["nav", "footer", "aside"],
        "include_tags": ["article", "main"],
        "wait_time": 150,
        "include_html": False,
        "only_main_content": True,
    }

    # -------------------- sync -------------------- #
    def _get_relevant_documents(
        self,
        query: str,
        *,
        run_manager: CallbackManagerForRetrieverRun,
        **kwargs: Any,
    ) -> List[Document]:  # noqa: D401
        api_key = (
            self.tavily_api_key
            if self.search_tool is tavily_search_tool
            else (self.watercrawl_api_key or getattr(self.client, "api_key", None))
        )

        docs: List[Document] = []
        urls = self.search_tool(query, api_key, max_results=3)
        for url in urls:
            try:
                result = self.client.scrape_url(
                    url=url,
                    page_options=self.page_options,
                    sync=True,
                    download=True,
                )
                content = result.get("content", "")
                if content:
                    docs.append(Document(page_content=content, metadata={"source": url}))
            except Exception as exc:  # noqa: BLE001
                logger.debug("Scrape failed for %s: %s", url, exc)
        return docs

    # ------------------- async -------------------- #
    async def _aget_relevant_documents(
        self,
        query: str,
        *,
        run_manager: AsyncCallbackManagerForRetrieverRun,
        **kwargs: Any,
    ) -> List[Document]:
        from asyncio import to_thread  # lazy import

        return await to_thread(self._get_relevant_documents, query, run_manager=run_manager)


###############################################################################
# Main runner
###############################################################################
def run_query(
    user_query: str,
    model: str,
    use_tavily: bool = False,
    verbose: bool = False,
) -> str:
    """Wire everything and execute the FLARE chain."""
    set_verbose(verbose)

    # 1‑ Load env
    load_dotenv()
    openai_key = os.getenv("OPENAI_API_KEY")
    wc_key = os.getenv("WATERCRAWL_API_KEY")
    tavily_key = os.getenv("TAVILY_API_KEY")

    if not openai_key or not wc_key:
        raise RuntimeError("OPENAI_API_KEY and WATERCRAWL_API_KEY must be set.")

    # 2‑ Build retriever
    retriever = WaterCrawlRetriever(
        client=WaterCrawlAPIClient(api_key=wc_key),
        watercrawl_api_key=wc_key,
        tavily_api_key=tavily_key,
        search_tool=tavily_search_tool if use_tavily else watercrawl_search_tool,
    )

    # 3‑ Build FLARE chain
    llm = ChatOpenAI(model=model, temperature=0)
    flare = FlareChain.from_llm(llm, retriever=retriever, max_generation_len=164, min_prob=0.3)

    # 4‑ Run
    logger.info("⚡ Running FLARE chain …")
    result = flare.invoke(user_query)
    answer = result["response"]
    logger.info("✅ Done")
    return answer


###############################################################################
# CLI
###############################################################################
def parse_args() -> argparse.Namespace:  # noqa: D401
    parser = argparse.ArgumentParser(description="WaterCrawl × FLARE RAG playground")
    parser.add_argument(
        "-q",
        "--query",
        required=True,
        help='User question in quotes, e.g. --query "What is WaterCrawl?"',
    )
    parser.add_argument(
        "--model",
        default="gpt-4o",
        help="OpenAI chat model (default: gpt-4o)",
    )
    parser.add_argument(
        "--use-tavily",
        action="store_true",
        help="Use Tavily instead of WaterCrawl Search (requires TAVILY_API_KEY)",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Show LangChain debug traces",
    )
    return parser.parse_args()


def main() -> None:  # noqa: D401
    args = parse_args()
    try:
        answer = run_query(
            user_query=args.query,
            model=args.model,
            use_tavily=args.use_tavily,
            verbose=args.verbose,
        )
        print("\n" + "=" * 80)
        print("FINAL ANSWER\n")
        print(answer)
        print("=" * 80 + "\n")
    except Exception as exc:  # noqa: BLE001
        logger.critical("Fatal error: %s", exc, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()

# call the script like this:
# python FLARE-WaterCrawl-LangChain.py -q "Explain what is watercrawl tool and how I can improve the LLM performance?"