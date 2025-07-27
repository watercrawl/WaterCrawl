import json
import logging
import re
import traceback
from dataclasses import dataclass
from typing import Any, Dict, List, Set

from rank_bm25 import BM25Okapi

from .clients import LLMClient, WaterCrawler
from .config import (
    DEFAULT_NUM_SEARCH_STRATEGIES,
    DEFAULT_RELEVANCE_THRESHOLD,
    DEFAULT_TOP_K,
    MAX_CONTENT_CHARS,
)
from .utils import (
    _debug_print, _debug_print_content, _debug_print_separator,
    _parse_strategy, _tokenise
)

LOGGER = logging.getLogger(__name__)


@dataclass
class ObjectiveCrawler:
    """High‑level orchestrator that fulfils a user objective on a given site."""

    wc: WaterCrawler
    gpt: LLMClient
    top_k: int = DEFAULT_TOP_K
    num_search_strategies: int = DEFAULT_NUM_SEARCH_STRATEGIES
    debug_mode: bool = False

    # ────────────────────────── private helpers ─────────────────────────── #
    def _derive_search_strategies(self, objective: str) -> List[str]:
        """Generate multiple search strategies for better coverage."""
        prompt = f"""
Given this objective: "{objective}"

Generate exactly {self.num_search_strategies} different search strategies as JSON array of strings. Each strategy should target different aspects:

1. **Direct Keywords**: 1-2 most specific terms from the objective
2. **Contextual Terms**: Related business/technical terms that might appear on relevant pages  
3. **Page Type**: Common webpage naming patterns for this type of content

Examples:
- Objective: "Find pricing information" → ["pricing", "plans", "cost"]
- Objective: "Find API documentation" → ["api", "developer", "docs"]
- Objective: "Find contact information" → ["contact", "support", "about"]

Return only a JSON array of {self.num_search_strategies} strings, no other text.
"""
        
        response = self.gpt.ask(prompt)
        print(type(response))
        print(response)
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
        
        # Fallback: extract key terms from objective
        words = objective.lower().split()
        # Remove common words
        stopwords = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "find", "get", "show", "information"}
        key_words = [w for w in words if w not in stopwords and len(w) > 2]
        
        if len(key_words) >= self.num_search_strategies:
            return key_words[:self.num_search_strategies]
        elif len(key_words) == 2 and self.num_search_strategies == 3:
            return key_words + [key_words[0]]  # Repeat first
        elif len(key_words) == 1:
            return [key_words[0]] * self.num_search_strategies
        else:
            # Generate more generic fallback strategies based on requested number
            fallback_strategies = ["info", "page", "content", "main", "home", "about", "help", "guide"]
            return fallback_strategies[:self.num_search_strategies]

    def _filter_urls_by_strategies(
        self,
        all_urls: List[str],
        strategies: List[str]
    ) -> List[str]:
        """
        Filters and ranks URLs using the BM25 retrieval algorithm.
        ...
        """
        if not all_urls or not strategies:
            return []

        # 1. Tokenize all URLs...
        tokenized_corpus = [_tokenise(url) for url in all_urls]

        # 2. Initialize the BM25 model...
        bm25 = BM25Okapi(tokenized_corpus)

        # 3. Score each URL against all strategies...
        url_scores: Dict[str, float] = {url: 0.0 for url in all_urls}

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

            # Tokenize the current search strategy to create the query.
            query_tokens = _tokenise(strategy_string)

            # Get a list of scores for all documents (URLs) against this query.
            doc_scores = bm25.get_scores(query_tokens)

            # For each URL, update its score if the new score is higher.
            for i, url in enumerate(all_urls):
                url_scores[url] = max(url_scores[url], doc_scores[i])

        # 4. Filter out any URLs with a zero score...
        matched_urls = {url: score for url, score in url_scores.items() if score > 0}

        # 5. Sort the matched URLs...
        sorted_urls = sorted(matched_urls.keys(), key=matched_urls.get, reverse=True)

        # --- Debugging Output ---
        if getattr(self, "debug_mode", False):
            _debug_print_separator("BM25 URL RANKING", self.debug_mode)
            _debug_print(f"Found {len(sorted_urls)} relevant URLs out of {len(all_urls)}.", self.debug_mode)
            _debug_print("Top 10 matches:", self.debug_mode)
            for i, url in enumerate(sorted_urls[:10], 1):
                _debug_print(f"{i:2d}. Score: {matched_urls[url]:.2f} | {url}", self.debug_mode)
        return sorted_urls    

    def _collect_candidate_urls(self, base_url: str, objective: str) -> List[str]:
        """Get full sitemap first, then filter using search strategies."""
        # Step 1: Get complete sitemap (single API call)
        LOGGER.info("Fetching complete sitemap for: %s", base_url)
        all_urls = self.wc.sitemap_full(base_url)
        LOGGER.info("Complete sitemap contains %d URLs", len(all_urls))
        
        if not all_urls:
            return []
            
        # Step 2: Generate search strategies
        strategies = self._derive_search_strategies(objective)
        
        # Step 3: Filter URLs using all strategies
        candidate_urls = self._filter_urls_by_strategies(all_urls, strategies)
        
        LOGGER.info("Found %d candidate URLs matching search strategies", len(candidate_urls))
        
        if self.debug_mode:
            _debug_print_separator("CANDIDATE URLS AFTER FILTERING", self.debug_mode)
            for i, url in enumerate(candidate_urls, 1):
                _debug_print(f"{i:2d}. {url}", self.debug_mode)
        
        for i, strategy in enumerate(strategies, 1):
            strategy_matches = [url for url in all_urls if strategy.lower() in url.lower()]
            LOGGER.info("Strategy %d '%s': %d matches", i, strategy, len(strategy_matches))
        
        return candidate_urls

    def _rank_links(self, links: List[str], objective: str) -> List[str]:
        """Rank URLs by relevance with improved prompt."""
        if not links:
            return []
            
        # Limit URLs to prevent token overflow
        if len(links) > 20:
            LOGGER.info("Limiting URL ranking to first 20 URLs due to size")
            links = links[:20]
            
        prompt = f"""
Analyze these URLs and rank them by relevance to the objective. Consider:
- URL path segments and file names
- Common web patterns for this type of content
- Subdirectory structure indicating content organization

Objective: {objective}

URLs to rank:
{json.dumps(links, indent=2)}

Return exactly {min(self.top_k, len(links))} JSON objects in order of relevance (most relevant first).
Each object must have: url, relevance_score (0.0-1.0), reason

Format as a JSON array only, no other text:
"""
        response = self.gpt.ask(prompt)
        try:
            response = self.gpt.ask(prompt)
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

    def _analyze_page_content(self, markdown: str, objective: str, url: str) -> Dict[str, Any]:
        """Analyze page content and return structured result with verification."""
        if not markdown.strip():
            return {
                "verified_url": url,
                "objective": objective,
                "result_of_analysis": "No content found - page appears to be empty or failed to load"
            }
            
        content = markdown[:MAX_CONTENT_CHARS]
        
        if self.debug_mode:
            _debug_print_separator(f"CONTENT ANALYSIS FOR: {url}", self.debug_mode)
            _debug_print(f"Original content length: {len(markdown)} chars", self.debug_mode)
            _debug_print(f"Content sent to LLM: {len(content)} chars (truncated: {len(markdown) > MAX_CONTENT_CHARS})", self.debug_mode)
            _debug_print_content(content, f"CONTENT SENT TO LLM FOR ANALYSIS", self.debug_mode, max_chars=2000)
        
        prompt = f"""
Analyze this webpage content to determine if it contains information relevant to the user's objective.

OBJECTIVE: {objective}
SOURCE URL: {url}

CONTENT:
{content}

TASK:
Carefully analyze the content and provide one of two responses:

1. If the content DOES contain information that answers the objective:
   - Extract and summarize the relevant information clearly
   - Be specific and include key details (numbers, dates, specifications, etc.)
   - Format as: "Based on the objective and URL analysis: [detailed answer with specific information found]"

2. If the content does NOT contain relevant information:
   - Format as: "Based on the objective and URL analysis: The requested information does not exist in this URL"

Examples of good responses:
- "Based on the objective and URL analysis: The pricing is $29/month for Basic plan, $79/month for Pro plan, and $199/month for Enterprise plan. All plans include 14-day free trial."
- "Based on the objective and URL analysis: The API authentication uses Bearer tokens with endpoint POST /api/v1/auth/login requiring email and password fields."
- "Based on the objective and URL analysis: The requested information does not exist in this URL"

Response:
"""
        
        analysis_result = self.gpt.ask(prompt)
        
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
        
        prompt = f"""
You are provided with analysis results from multiple web pages for a specific objective. 
Your task is to synthesize this information into a comprehensive final answer.

OBJECTIVE: {objective}

ANALYSIS RESULTS:
{json.dumps(analysis_results, indent=2)}

TASK:
1. If any of the analyses contain relevant information that answers the objective:
   - Synthesize the information from successful analyses into a comprehensive answer
   - Include reference URLs for each piece of information
   - Provide a structured, clear response
   - Ignore analyses that state "does not exist in this URL"

2. If none of the analyses contain relevant information:
   - State that the objective could not be fulfilled
   - List the URLs that were checked
   - Suggest what might be needed (different search terms, manual search, etc.)

FORMAT YOUR RESPONSE AS JSON:
{{
  "objective_fulfilled": true/false,
  "final_answer": "comprehensive answer with details",
  "reference_urls": ["url1", "url2"],
  "pages_analyzed": number,
  "successful_pages": number
}}

Response:
"""
        
        final_response = self.gpt.ask(prompt)
        
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
    def run(self, url: str, objective: str) -> Dict[str, Any]:
        """Execute the objective-driven crawling process."""
        LOGGER.info("=" * 60)
        LOGGER.info("OBJECTIVE: %s", objective)
        LOGGER.info("TARGET URL: %s", url)
        LOGGER.info("DEBUG MODE: %s", self.debug_mode)
        LOGGER.info("SEARCH STRATEGIES: %d", self.num_search_strategies)
        LOGGER.info("=" * 60)
        
        # Step 1: Get complete sitemap and filter with search strategies
        candidate_urls = self._collect_candidate_urls(url, objective)
        if not candidate_urls:
            return {
                "objective_fulfilled": False,
                "final_answer": "No candidate URLs found matching the search strategies",
                "reference_urls": [],
                "pages_analyzed": 0,
                "successful_pages": 0
            }

        # Step 2: Rank URLs by relevance
        ranked_urls = self._rank_links(candidate_urls, objective)
        if not ranked_urls:
            return {
                "objective_fulfilled": False,
                "final_answer": "Failed to rank any URLs for evaluation",
                "reference_urls": [],
                "pages_analyzed": 0,
                "successful_pages": 0
            }

        # Step 3: Crawl each ranked URL and collect analysis results
        analysis_results = []
        
        for i, page_url in enumerate(ranked_urls, 1):
            LOGGER.info("[%d/%d] Crawling and analyzing: %s", i, len(ranked_urls), page_url)
            try:
                # Scrape the page
                markdown_content = self.wc.scrape(page_url)
                
                # Analyze the content
                analysis_result = self._analyze_page_content(markdown_content, objective, page_url)
                analysis_results.append(analysis_result)
                
                # Log the result
                if "does not exist in this URL" in analysis_result["result_of_analysis"]:
                    LOGGER.info("✗ No relevant information found: %s", page_url)
                else:
                    LOGGER.info("✓ Relevant information found: %s", page_url)
                    
            except Exception as e:
                LOGGER.warning("Failed to process %s: %s", page_url, e)
                traceback.print_exc()           
                analysis_results.append({
                    "verified_url": page_url,
                    "objective": objective,
                    "result_of_analysis": f"Failed to crawl URL due to error: {str(e)}"
                })

        # Step 4: Generate final consolidated result
        LOGGER.info("=" * 60)
        LOGGER.info("GENERATING FINAL RESULT FROM %d ANALYSES", len(analysis_results))
        LOGGER.info("=" * 60)
        
        final_result = self._generate_final_result(analysis_results, objective)
        
        # Add metadata
        final_result["_metadata"] = {
            "objective": objective,
            "base_url": url,
            "total_candidate_urls": len(candidate_urls),
            "ranked_urls_evaluated": len(ranked_urls),
            "search_strategies_used": self.num_search_strategies,
            "individual_analyses": analysis_results
        }
        
        return final_result

