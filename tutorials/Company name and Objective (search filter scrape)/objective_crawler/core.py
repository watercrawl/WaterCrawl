import json
import logging
import re
import traceback
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Set

from rank_bm25 import BM25Okapi

from .clients import LLMClient, WaterCrawler
from .config import (
    DEFAULT_NUM_SEARCH_STRATEGIES,
    DEFAULT_RELEVANCE_THRESHOLD,
    DEFAULT_TOP_K,
    MAX_CONTENT_CHARS,
    DEFAULT_SEARCH_RESULT_LIMIT,
    DEFAULT_BM25_RESULT_COUNT,
    DEFAULT_SEARCH_DEPTH,
    DEFAULT_SEARCH_LANGUAGE,
    DEFAULT_SEARCH_COUNTRY,
    DEFAULT_SEARCH_LLM,
    DEFAULT_RANKING_LLM,
    DEFAULT_CONTENT_ANALYSIS_LLM,
    DEFAULT_REASONING_LLM
)
from .prompts import (
    SEARCH_STRATEGIES_PROMPT,
    URL_RANKING_PROMPT,
    CONTENT_ANALYSIS_PROMPT,
    FINAL_RESULT_PROMPT
)
from .utils import (
    _debug_print, _debug_print_content, _debug_print_separator,
    _parse_strategy, _tokenise
)

LOGGER = logging.getLogger(__name__)


@dataclass
class ObjectiveCrawler:
    """High‑level orchestrator that fulfils a user objective using search or direct URL."""

    wc: WaterCrawler = None
    top_k: int = DEFAULT_TOP_K
    max_content_chars: int = MAX_CONTENT_CHARS
    num_search_strategies: int = DEFAULT_NUM_SEARCH_STRATEGIES
    search_result_limit: int = DEFAULT_SEARCH_RESULT_LIMIT
    bm25_result_count: int = DEFAULT_BM25_RESULT_COUNT
    search_depth: str = DEFAULT_SEARCH_DEPTH
    search_language: str = DEFAULT_SEARCH_LANGUAGE
    search_country: str = DEFAULT_SEARCH_COUNTRY
    debug_mode: bool = False
    search_model: str = DEFAULT_SEARCH_LLM
    ranking_model: str = DEFAULT_RANKING_LLM
    reasoning_model: str = DEFAULT_REASONING_LLM
    content_analysis_model: str = DEFAULT_CONTENT_ANALYSIS_LLM  # New model for content analysis

    def __post_init__(self):
        if self.wc is None:
            self.wc = WaterCrawler()
        # Initialize different LLM clients for different tasks
        self.search_gpt = LLMClient(model_name=self.search_model)
        self.ranking_gpt = LLMClient(model_name=self.ranking_model)
        self.reasoning_gpt = LLMClient(model_name=self.reasoning_model)
        self.content_analysis_gpt = LLMClient(model_name=self.content_analysis_model)  # Use dedicated model for content analysis

    # ────────────────────────── private helpers ─────────────────────────── #
    def _derive_search_strategies(self, objective: str, company_or_url: str) -> List[str]:
        """Generate multiple search queries in Google search format for better coverage."""
        company_part = company_or_url 
        hint = "Include location-specific terms in the search query if relevant to the objective."
        prompt = SEARCH_STRATEGIES_PROMPT.format(
            objective=objective,
            company_part=company_part,
            hint=hint,
            num_strategies=self.num_search_strategies
        )
        
        response = self.search_gpt.ask(prompt)
        try:
            # Clean up response in case GPT adds formatting
            response = response.strip()
            if response.startswith("```"):
                response = response.split("```")[1].strip()
            if response.startswith("json"):
                response = response[4:].strip()
            strategies = json.loads(response)
            if isinstance(strategies, list) and len(strategies) >= self.num_search_strategies:
                strategies = strategies[:self.num_search_strategies]  # Take first N
                LOGGER.info("Search strategies: %s", strategies)
                if self.debug_mode:
                    _debug_print_separator("SEARCH STRATEGIES GENERATED", self.debug_mode)
                    for i, strategy in enumerate(strategies, 1):
                        _debug_print(f"{i}. '{strategy}'", self.debug_mode)
                return strategies
        except (json.JSONDecodeError, KeyError):
            LOGGER.warning("Failed to parse search strategies, using fallback")
            traceback.print_exc()           
        # Fallback: create basic search queries
        fallback_strategies = [
            f"{objective} {company_part}",
            f"site:{company_part} {objective}",
            f"{objective} AND {company_part}",
            f"intitle:{objective.split()[0]} {company_part}"
        ]
        return fallback_strategies[:self.num_search_strategies]

    def _filter_urls_by_strategies(
        self,
        search_results: List[Dict[str, Any]],
        strategies: List[str],
        max_results: int = 0
    ) -> List[str]:
        """
        Filters and ranks URLs using the BM25 retrieval algorithm based on full search result data.
        Returns up to max_results if specified, otherwise all matching results.
        """
        if not search_results or not strategies:
            return []

        # 1. Create a corpus by combining url, title, and description for each result
        corpus = []
        url_to_index = {}
        for i, result in enumerate(search_results):
            url = result.get("url", "")
            title = result.get("title", "")
            description = result.get("description", "")
            # Combine all fields into a single text for tokenization
            combined_text = f"{url} {title} {description}".strip()
            corpus.append(combined_text)
            url_to_index[url] = i

        # 2. Tokenize all corpus items
        tokenized_corpus = [_tokenise(text) for text in corpus]

        # 3. Initialize the BM25 model
        bm25 = BM25Okapi(tokenized_corpus)

        # 4. Score each result against all strategies
        url_scores: Dict[str, float] = {result.get("url", ""): 0.0 for result in search_results}

        for strategy_item in strategies:  # Renamed for clarity
            strategy_string = ""
            # FIX: Check the type and convert list to string if necessary
            if isinstance(strategy_item, list):
                strategy_string = " ".join(strategy_item)
            elif isinstance(strategy_item, str):
                strategy_string = strategy_item

            # Now, proceed with the guaranteed string
            if not strategy_string.strip():
                continue

            # Tokenize the current search strategy to create the query
            query_tokens = _tokenise(strategy_string)

            # Get a list of scores for all documents (results) against this query
            doc_scores = bm25.get_scores(query_tokens)

            # For each result, update its score if the new score is higher
            for url, index in url_to_index.items():
                url_scores[url] = max(url_scores[url], doc_scores[index])

        # 5. Filter out any URLs with a zero score
        matched_urls = {url: score for url, score in url_scores.items() if score > 0}

        # 6. Sort the matched URLs
        sorted_urls = sorted(matched_urls.keys(), key=matched_urls.get, reverse=True)

        # Limit to max_results if specified
        if max_results > 0 and len(sorted_urls) > max_results:
            sorted_urls = sorted_urls[:max_results]

        # --- Debugging Output ---
        if getattr(self, "debug_mode", False):
            _debug_print_separator("BM25 URL RANKING", self.debug_mode)
            _debug_print(f"Found {len(sorted_urls)} relevant URLs out of {len(search_results)}.", self.debug_mode)
            _debug_print("Top 10 matches:", self.debug_mode)
            for i, url in enumerate(sorted_urls[:10], 1):
                _debug_print(f"{i:2d}. Score: {matched_urls[url]:.2f} | {url}", self.debug_mode)
        return sorted_urls

    def _collect_candidate_urls(self, company_or_url: str, use_map: bool = False, strategies: List[str] = None, search_depth: str = None, search_language: str = None, search_country: str = None) -> List[str]:
        # Assign default values from instance attributes if not provided
        search_depth = search_depth if search_depth is not None else self.search_depth
        search_language = search_language if search_language is not None else self.search_language
        search_country = search_country if search_country is not None else self.search_country
        
        all_urls = []
        all_results = []
        if use_map:
            # Direct URL: get sitemap
            all_urls = self.wc.sitemap_full(company_or_url)
            LOGGER.info("Sitemap retrieved: %d URLs", len(all_urls))
            if self.debug_mode:
                _debug_print_separator("SITEMAP RETRIEVAL", self.debug_mode)
                _debug_print(f"Retrieved {len(all_urls)} URLs from sitemap of {company_or_url}", self.debug_mode)
        else:
            # Company name: use search API with strategies
            seen_urls = set()
            for i, query in enumerate(strategies, 1):
                LOGGER.info("Search %d/%d: '%s'", i, len(strategies), query)
                if self.debug_mode:
                    _debug_print(f"Sending search query {i}/{len(strategies)}: '{query}'", self.debug_mode)
                search_options = {
                    "depth": search_depth,
                    "language": search_language if search_language else None,
                    "country": search_country if search_country else None,
                    "search_type": "web"
                }
                results = self.wc.search(
                    query=query, 
                    result_limit=self.search_result_limit, 
                    search_options=search_options
                )
                if not results:
                    LOGGER.warning("No results for search: %s", query)
                    continue
                new_results = [r for r in results if r.get("url") and r["url"] not in seen_urls]
                seen_urls.update(r["url"] for r in new_results if r.get("url"))
                all_results.extend(new_results)
                LOGGER.info("Search '%s' returned %d new results (%d total unique)", query, len(new_results), len(seen_urls))
                if self.debug_mode:
                    _debug_print(f"Received {len(results)} results, {len(new_results)} new, total unique URLs: {len(seen_urls)}", self.debug_mode)
            
            if not all_results:
                LOGGER.warning("No search results from any strategy")
                if self.debug_mode:
                    _debug_print("No results from any search strategy.", self.debug_mode)
                return []
                
            # Filter URLs by BM25 relevance to strategies
            all_urls = self._filter_urls_by_strategies(all_results, strategies, max_results=self.bm25_result_count)
            if self.debug_mode:
                _debug_print_separator("CANDIDATE URLs AFTER BM25 FILTERING", self.debug_mode)
                _debug_print(f"Filtered to {len(all_urls)} URLs using BM25", self.debug_mode)

        return all_urls, all_results

    def _rank_links(self, links: List[str], objective: str, company_or_url: str) -> List[str]:
        """Rank URLs by relevance with improved prompt."""
        if not links:
            return []
            
        # Limit URLs to prevent token overflow
        if len(links) > self.bm25_result_count:
            LOGGER.info(f"Limiting URL ranking to first {self.bm25_result_count} URLs due to size")
            links = links[:self.bm25_result_count]
            
        prompt = URL_RANKING_PROMPT.format(
            company_or_url=company_or_url,
            objective=objective,
            url_list_json=json.dumps(links, indent=2),
            top_k=min(self.top_k, len(links))
        )
        response = self.ranking_gpt.ask(prompt)
        try:
            # Clean response
            response = response.strip()
            if response.startswith("```"):
                response = response.split("```")[1].strip()
            if response.startswith("json"):
                response = response[4:].strip()
                
            ranked: List[Dict[str, Any]] = json.loads(response)
            
            if not isinstance(ranked, list):
                raise ValueError("Response is not a list")
                
            LOGGER.info("Top %d candidate pages:", len(ranked))
            for r in ranked:
                if isinstance(r, dict) and "url" in r:
                    score = r.get("relevance_score", 0.0)
                    reason = r.get("reason", "No reason provided")
                    LOGGER.info("%-60s  %.2f  %s", r["url"][:60], score, reason)
            
            if self.debug_mode:
                _debug_print_separator("URL RANKING RESULTS", self.debug_mode)
                for i, r in enumerate(ranked, 1):
                    if isinstance(r, dict) and "url" in r:
                        score = r.get("relevance_score", 0.0)
                        reason = r.get("reason", "No reason provided")
                        _debug_print(f"{i}. {r['url']}", self.debug_mode)
                        _debug_print(f"   Score: {score:.2f} | Reason: {reason}", self.debug_mode)
                    
            return [r["url"] for r in ranked if isinstance(r, dict) and "url" in r][:self.top_k]
            
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            LOGGER.warning("Failed to parse ranking response: %s. Using original order.", e)
            traceback.print_exc()           
            return links[:self.top_k]

    def _analyze_page_content(self, markdown: str | None, objective: str, url: str) -> Dict[str, Any]:
        """Analyze page content and return structured result with verification."""
        if markdown is None or not markdown.strip():
            LOGGER.warning(f"URL could not be crawled: {url}")
            return {
                "verified_url": url,
                "objective": objective,
                "result_of_analysis": f"URL could not be crawled: {url}"
            }
            
        content = markdown[:self.max_content_chars]
        
        if self.debug_mode:
            _debug_print_separator(f"CONTENT ANALYSIS FOR: {url}", self.debug_mode)
            _debug_print(f"Original content length: {len(markdown)} chars", self.debug_mode)
            _debug_print(f"Content sent to LLM: {len(content)} chars (truncated: {len(markdown) > self.max_content_chars})", self.debug_mode)
            _debug_print_content(content, f"CONTENT SENT TO LLM FOR ANALYSIS", self.debug_mode, max_chars=2000)
        
        prompt = CONTENT_ANALYSIS_PROMPT.format(
            objective=objective,
            url=url,
            content=content
        )
        
        analysis_result = self.content_analysis_gpt.ask(prompt)  # Use dedicated content analysis LLM
        
        if self.debug_mode:
            _debug_print_content(analysis_result, "LLM ANALYSIS RESULT", self.debug_mode)
        
        return {
            "verified_url": url,
            "objective": objective,
            "result_of_analysis": analysis_result.strip()
        }

    def _generate_final_result(self, analysis_results: List[Dict[str, Any]], objective: str) -> Dict[str, Any]:
        """Generate final consolidated result from all page analyses."""
        
        # Separate successful and unsuccessful analyses
        successful_analyses = []
        failed_analyses = []
        
        for result in analysis_results:
            analysis = result["result_of_analysis"]
            if "does not exist in this URL" in analysis or "No content found" in analysis:
                failed_analyses.append(result)
            else:
                successful_analyses.append(result)
        
        if self.debug_mode:
            _debug_print_separator("FINAL RESULT GENERATION", self.debug_mode)
            _debug_print(f"Successful analyses: {len(successful_analyses)}", self.debug_mode)
            _debug_print(f"Failed analyses: {len(failed_analyses)}", self.debug_mode)
        
        prompt = FINAL_RESULT_PROMPT.format(
            objective=objective,
            analysis_results_json=json.dumps(analysis_results, indent=2)
        )
        
        final_response = self.reasoning_gpt.ask(prompt)
        
        # Clean and parse response
        try:
            if "```" in final_response:
                parts = final_response.split("```")
                for part in parts:
                    part = part.strip()
                    if part.startswith("json"):
                        part = part[4:].strip()
                    if part.startswith("{"):
                        final_response = part
                        break
            
            result = json.loads(final_response)
            if not isinstance(result, dict):
                raise ValueError("Response is not a dictionary")
                
            return result
            
        except (json.JSONDecodeError, ValueError) as e:
            LOGGER.warning("Failed to parse final result JSON: %s", e)
            traceback.print_exc()           
            # Fallback response
            return {
                "objective_fulfilled": len(successful_analyses) > 0,
                "final_answer": final_response,
                "reference_urls": [r["verified_url"] for r in successful_analyses],
                "pages_analyzed": len(analysis_results),
                "successful_pages": len(successful_analyses)
            }
    # ───────────────────────────── public API ───────────────────────────── #
    def run(self, company_or_url: str, objective: str, use_map: bool = False, search_depth: str = None, search_language: str = None, search_country: str = None) -> Dict[str, Any]:
        # Assign default values from instance attributes if not provided
        search_depth = search_depth if search_depth is not None else self.search_depth
        search_language = search_language if search_language is not None else self.search_language
        search_country = search_country if search_country is not None else self.search_country
        t0 = time.perf_counter()
        LOGGER.info("Objective: %s for %s", objective, company_or_url)
        if self.debug_mode:
            _debug_print_separator("OBJECTIVE CRAWLER STARTED", self.debug_mode)
            _debug_print(f"Objective: {objective}", self.debug_mode)
            _debug_print(f"Target: {company_or_url}", self.debug_mode)
            _debug_print(f"Search Depth: {search_depth}", self.debug_mode)
            _debug_print(f"Search Language: {search_language}", self.debug_mode)
            _debug_print(f"Search Country: {search_country}", self.debug_mode)

        # Step 1: Derive search strategies if not a URL
        strategies = []
        if not use_map:
            strategies = self._derive_search_strategies(objective, company_or_url)

        # Step 2: Collect candidate URLs either from search or sitemap
        candidate_urls, all_results = self._collect_candidate_urls(company_or_url, use_map, strategies, search_depth, search_language, search_country)
        if not candidate_urls:
            LOGGER.warning("No candidate URLs found")
            if self.debug_mode:
                _debug_print("No candidate URLs found. Returning empty result.", self.debug_mode)
            return {
                "objective_fulfilled": False,
                "final_answer": "No relevant URLs found for the objective.",
                "reference_urls": [],
                "pages_analyzed": 0,
                "successful_pages": 0
            }

        # Step 3: Rank URLs by relevance
        ranked_urls = self._rank_links(candidate_urls, objective, company_or_url)
        if not ranked_urls:
            LOGGER.warning("No URLs after ranking")
            if self.debug_mode:
                _debug_print("No URLs remaining after ranking. Returning empty result.", self.debug_mode)
            return {
                "objective_fulfilled": False,
                "final_answer": "No relevant URLs found after ranking.",
                "reference_urls": [],
                "pages_analyzed": 0,
                "successful_pages": 0
            }

        # Step 4: Crawl and analyze top pages
        analysis_results = []
        search_results_dict = {r.get("url", ""): r for r in all_results if "url" in r} if not use_map else {}
        for i, page_url in enumerate(ranked_urls, 1):
            LOGGER.info("[%d/%d] Crawling and analyzing: %s", i, len(ranked_urls), page_url)
            if self.debug_mode:
                _debug_print(f"Crawling URL {i}/{len(ranked_urls)}: {page_url}", self.debug_mode)
            try:
                markdown_content = self.wc.scrape(page_url)
                if markdown_content is None:
                    raise ValueError(f"Scrape returned None for URL: {page_url}")
                analysis_result = self._analyze_page_content(markdown_content, objective, page_url)
            except Exception as e:
                LOGGER.warning("Failed to process %s: %s", page_url, str(e))
                traceback.print_exc()
                description = search_results_dict.get(page_url, {}).get("description", "No description available")
                analysis_result = {
                    "verified_url": page_url,
                    "objective": objective,
                    "result_of_analysis": f"URL could not be crawled: {page_url}. Description: {description}"
                }
            analysis_results.append(analysis_result)

        # Store individual analyses in metadata for debugging or transparency
        result = self._generate_final_result(analysis_results, objective)
        result["_metadata"] = {"individual_analyses": analysis_results}

        t1 = time.perf_counter()
        LOGGER.info("Execution time: %.2f seconds", t1 - t0)
        return result
