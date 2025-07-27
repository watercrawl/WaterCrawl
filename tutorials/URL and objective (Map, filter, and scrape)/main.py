#!/usr/bin/env python3
"""gpt41_professional.py – Goal‑oriented site crawler powered by WaterCrawl & GPT‑4.1

Usage
-----
$ python gpt41_professional.py https://example.com "Find the REST authentication endpoint"
$ python gpt41_professional.py https://example.com "Find pricing information" --debug
$ python gpt41_professional.py https://example.com "Find pricing information" --strategies 5

Environment variables required:
* WATERCRAWL_API_KEY
* OPENAI_API_KEY

The program will exit with a non‑zero code if the objective cannot be
fulfilled. Successful execution prints a compact JSON object containing the
information that satisfies the user's objective.
pip install --upgrade litellm          # tiny dependency, ~90 kB
pip install rank-bm25
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=...
export GROQ_API_KEY=...
export COHERE_API_KEY=...
Support Models:
Anthropic Models:
anthropic/claude-sonnet-4-20250514
anthropic/claude-opus-4-20250514
anthropic/claude-3-7-sonnet-20250219
anthropic/claude-3-5-sonnet-20240620
anthropic/claude-3-sonnet-20240229
anthropic/claude-3-haiku-20240307
anthropic/claude-3-opus-20240229

DeepSeek Models:
deepseek/deepseek-chat
deepseek/deepseek-coder

OpenAI Models:
o4-mini
o3
o3-mini
o1-mini
o1-preview
gpt-4.1
gpt-4.1-mini
gpt-4.1-nano
gpt-4o
gpt-4o-mini
"""
import argparse
import json
import logging
import os
import sys
import time
import traceback
from dotenv import load_dotenv

from objective_crawler.clients import LLMClient, WaterCrawler
from objective_crawler.core import ObjectiveCrawler
from objective_crawler.utils import _early_exit
from objective_crawler.config import (
    DEFAULT_NUM_SEARCH_STRATEGIES,
    DEFAULT_TOP_K,
    MODEL_NAME,
    CHAT_TEMPERATURE
)

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
)
LOGGER = logging.getLogger(__name__)


def _parse_args() -> argparse.Namespace:  # noqa: D401
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(
        description="Autonomous website goal crawler with configurable search strategies",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python gpt41_professional.py https://stripe.com "Find pricing information"
  python gpt41_professional.py https://docs.openai.com "Find API authentication methods"
  python gpt41_professional.py https://company.com "Find contact information" -k 7
  python gpt41_professional.py https://company.com "Find pricing information" --debug
  python gpt41_professional.py https://company.com "Find pricing information" --strategies 5
        """
    )
    parser.add_argument("url", help="Root website URL to crawl")
    parser.add_argument("objective", help="Natural‑language objective to satisfy")
    parser.add_argument(
        "-k", "--top-k", 
        type=int, 
        default=DEFAULT_TOP_K, 
        help="Number of top-ranked pages to evaluate (default: %(default)s)"
    )
    parser.add_argument(
        "--model", default= MODEL_NAME,
        help="Any model name LiteLLM recognises (e.g. anthropic/claude-3-haiku, groq/llama3-70b)")
    parser.add_argument(
        "-s", "--strategies", 
        type=int, 
        default=DEFAULT_NUM_SEARCH_STRATEGIES, 
        help=f"Number of search strategies to generate (default: {DEFAULT_NUM_SEARCH_STRATEGIES})"
    )
    parser.add_argument(
        "-v", "--verbose", 
        action="store_true", 
        help="Enable debug logging"
    )
    parser.add_argument(
        "--debug", 
        action="store_true", 
        help="Enable debug mode - shows sitemap results, crawl content, and LLM interactions"
    )
    return parser.parse_args()


def main() -> None:  # noqa: D401
    """Program entry‑point."""
    args = _parse_args()
    if args.verbose:
        LOGGER.setLevel(logging.DEBUG)

    load_dotenv()

    wc_key = os.getenv("WATERCRAWL_API_KEY")
    if not wc_key:
        _early_exit("WATERCRAWL_API_KEY must be set in environment variables.")
    # if not wc_key or not oa_key:
    #     _early_exit("WATERCRAWL_API_KEY and the API key for the model must be set in environment variables.")

    # Validate strategies argument
    if args.strategies < 1:
        _early_exit("Number of search strategies must be at least 1.")
    if args.strategies > 10:
        LOGGER.warning("Using more than 10 search strategies may impact performance and API costs.")

    crawler = ObjectiveCrawler(
        wc=WaterCrawler(wc_key, debug_mode=args.debug),
        #gpt=GPTClient(oa_key, debug_mode=args.debug),
        gpt=LLMClient(model=args.model, stream=False, debug=args.debug),
        top_k=args.top_k,
        debug_mode=args.debug,
        num_search_strategies=args.strategies,
    )

    t0 = time.perf_counter()
    try:
        result = crawler.run(args.url, args.objective)
        elapsed = time.perf_counter() - t0
        
        # Output clean JSON result (without _metadata for cleaner display)
        display_result = {k: v for k, v in result.items() if k != "_metadata"}
        json.dump(display_result, sys.stdout, indent=2)
        print()  # newline after JSON
        
        # Log summary
        metadata = result.get("_metadata", {})
        individual_analyses = metadata.get("individual_analyses", [])
        
        LOGGER.info("=" * 60)
        LOGGER.info("EXECUTION SUMMARY")
        LOGGER.info("=" * 60)
        LOGGER.info("Objective fulfilled: %s", result.get("objective_fulfilled", False))
        LOGGER.info("Pages analyzed: %d", len(individual_analyses))
        LOGGER.info("Successful pages: %d", result.get("successful_pages", 0))
        LOGGER.info("Reference URLs: %d", len(result.get("reference_urls", [])))
        LOGGER.info("Execution time: %.2f seconds", elapsed)
        
        if args.verbose and individual_analyses:
            LOGGER.info("Individual page analyses:")
            for i, analysis in enumerate(individual_analyses, 1):
                LOGGER.info("  %d. %s", i, analysis["verified_url"])
                LOGGER.info("     Result: %s", analysis["result_of_analysis"][:100] + "..." if len(analysis["result_of_analysis"]) > 100 else analysis["result_of_analysis"])
        
    except KeyboardInterrupt:
        LOGGER.info("Process interrupted by user")
        traceback.print_exc()           
        sys.exit(130)
    except Exception as e:
        LOGGER.error("Unexpected error: %s", e)
        traceback.print_exc()           
        sys.exit(1)



if __name__ == "__main__":
    main()
