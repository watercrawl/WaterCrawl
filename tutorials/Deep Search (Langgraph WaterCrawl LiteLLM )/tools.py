"""
Core tools for the search agent project.
Handles WaterCrawl integration, BM25 filtering, and LLM interactions.
"""

import os
from typing import List, Dict, Any, Optional, Callable
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# External imports
from watercrawl import WaterCrawlAPIClient
from rank_bm25 import BM25Okapi
from litellm import completion
from dotenv import load_dotenv

# Local imports
from utils import tokenize_text, clean_text_for_llm, get_prompt_template, truncate_for_context, log_event, log_search_results, log_bm25_filter, log_llm_filter

# Load environment variables
load_dotenv()

# Initialize WaterCrawl client
watercrawl_client = None

def init_watercrawl_client():
    """Initialize WaterCrawl client with API key from environment."""
    global watercrawl_client
    api_key = os.getenv("WATERCRAWL_API_KEY")
    
    if not api_key:
        raise ValueError("WATERCRAWL_API_KEY not found in environment variables")
    
    # Initialize with base_url as shown in working example
    watercrawl_client = WaterCrawlAPIClient(
        api_key=api_key, 
        base_url='https://app.watercrawl.dev'
    )
    log_event("WaterCrawl client initialized")

def get_llm_model(task_type: str = "default", selected_models: Dict[str, str] = None) -> str:
    """Get LLM model for specific task type."""
    from configs import get_model_for_task
    return get_model_for_task(task_type, selected_models)

def watercrawl_search(
    query: str,
    result_limit: int = 30,
    language: Optional[str] = None,
    country: Optional[str] = None,
    time_range: str = "any",
    depth: str = "basic"
) -> List[Dict[str, Any]]:
    """
    Search the web using WaterCrawl API.
    
    Args:
        query: Search query
        result_limit: Maximum number of results
        language: Language code (e.g., 'en', 'fr')
        country: Country code (e.g., 'us', 'fr')
        time_range: Time range filter
        depth: Search depth
        
    Returns:
        List of search result dictionaries
    """
    if not watercrawl_client:
        init_watercrawl_client()
    
    try:
        # Validate query length (must be ≤ 255 characters)
        if len(query) > 255:
            query = query[:255]
            log_event(f"Query truncated to 255 characters: '{query}'")
        
        # Validate result_limit (must be between 1 and 20)
        if result_limit > 20:
            result_limit = 20
            log_event(f"Result limit capped at 20")
        elif result_limit < 1:
            result_limit = 1
            log_event(f"Result limit set to minimum of 1")
        
        log_event(f"Searching for: '{query}' (limit: {result_limit})")
        
        # Build search_options according to WaterCrawl API spec
        search_options = {
            "search_type": "web",
            "depth": depth
        }
        
        # Only add language and country if they are provided and valid
        if language and isinstance(language, str) and len(language) == 2:
            search_options["language"] = language.lower()
        
        if country and isinstance(country, str) and len(country) == 2:
            search_options["country"] = country.lower()
        
        # Only add time_range if it's not "any" (which might not be supported)
        if time_range and time_range != "any":
            # Map common time ranges to WaterCrawl expected values
            time_range_map = {
                "hour": "hour",
                "day": "day", 
                "week": "week",
                "month": "month",
                "year": "year"
            }
            if time_range in time_range_map:
                search_options["time_range"] = time_range_map[time_range]
        
        log_event(f"Search options: {search_options}")
        
        # Use the MCP tool instead of direct client call for better error handling
        try:
            from mcp0_search import mcp0_search
            result = mcp0_search(
                query=query,
                resultLimit=result_limit,
                searchOptions=search_options,
                sync=True,
                download=True
            )
        except ImportError:
            # Fallback to direct client call
            result = watercrawl_client.create_search_request(
                query=query,
                search_options=search_options,
                result_limit=result_limit,
                sync=True,
                download=True
            )
        
        # Handle different response formats
        if isinstance(result, dict):
            # WaterCrawl API returns results under 'result' key, not 'results'
            results = result.get("result", [])
            if not results:
                # Try alternative keys
                results = result.get("results", [])
                if not results:
                    results = result.get("data", [])
        else:
            results = []
        
        log_event(f"Found {len(results)} results for query: '{query}'")
        return results
        
    except Exception as e:
        log_event(f"Error in watercrawl_search: {str(e)}", "error")
        
        # Log more detailed error information for debugging
        if hasattr(e, 'response'):
            try:
                error_details = e.response.text if hasattr(e.response, 'text') else str(e.response)
                log_event(f"WaterCrawl API error details: {error_details}", "error")
            except:
                log_event(f"Could not extract error details from response", "error")
        
        return []

def watercrawl_scrape(url: str, page_options: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Scrape a single URL using WaterCrawl.
    
    Args:
        url: URL to scrape
        page_options: Optional page scraping options
        
    Returns:
        Scraped content dictionary
    """
    if not watercrawl_client:
        init_watercrawl_client()
    
    if page_options is None:
        page_options = {
            'exclude_tags': [],
            'include_tags': [],
            'wait_time': 0,
            'only_main_content': True,
            'include_html': False,
            'include_links': True,
            'timeout': 10,
            'accept_cookies_selector': None,
            'locale': None,
            'extra_headers': {},
            'actions': []
        }
    
    try:
        log_event(f"Scraping URL: {url}")
        
        # Use the correct API call structure from the working example
        result_object = watercrawl_client.scrape_url(
            url=url,
            page_options=page_options,
            plugin_options={},
            sync=True,
            download=True
        )
        
        # Extract the actual result from the response structure
        result = result_object.get('result', {})
        
        # Build a standardized response structure for compatibility
        scraped_data = {
            "url": result_object.get('url', url),
            "title": result.get('metadata', {}).get('title', ''),
            "text": result.get('markdown', ''),  # Content is in 'markdown' field
            "html": result.get('html', ''),
            "links": result.get('links', []),
            "metadata": result.get('metadata', {}),
            "attachments": result.get('attachments', [])
        }
        
        log_event(f"Successfully scraped: {url} (content length: {len(scraped_data['text'])})")
        return scraped_data
        
    except Exception as e:
        log_event(f"Error scraping {url}: {str(e)}", "error")
        return {"url": url, "text": "", "title": "", "error": str(e)}

def bm25_filter(
    results: List[Dict[str, Any]],
    query: str,
    max_results: int
) -> List[Dict[str, Any]]:
    """
    Filter search results using BM25 ranking.
    
    Args:
        results: List of search result dictionaries
        query: Original search query
        max_results: Maximum number of results to return
        
    Returns:
        Filtered and ranked results
    """
    if not results:
        return []
    
    try:
        log_event(f"Applying BM25 filter (max: {max_results})")
        
        # Prepare corpus from results
        corpus = []
        for result in results:
            # Combine title and description for better matching
            text = f"{result.get('title', '')} {result.get('description', '')}"
            tokenized = tokenize_text(text)
            corpus.append(tokenized)
        
        if not corpus:
            return results[:max_results]
        
        # Initialize BM25
        bm25 = BM25Okapi(corpus)
        
        # Tokenize query
        tokenized_query = tokenize_text(query)
        
        # Get scores
        scores = bm25.get_scores(tokenized_query)
        
        # Sort results by score
        scored_results = list(zip(results, scores))
        scored_results.sort(key=lambda x: x[1], reverse=True)
        
        # Return top results
        filtered_results = [result for result, score in scored_results[:max_results]]
        log_event(f"BM25 filtered to {len(filtered_results)} results")
        return filtered_results
        
    except Exception as e:
        log_event(f"Error in BM25 filtering: {str(e)}", "error")
        return results[:max_results]

def llm_filter(
    results: List[Dict[str, Any]],
    user_goal: str,
    search_strategy: str,
    max_results: int,
    selected_models: Dict[str, str] = None
) -> List[Dict[str, Any]]:
    """
    Filter and rank search results using LLM-based relevance scoring.
    Evaluates ALL results and selects the BEST ones based on goal relevance.
    
    Args:
        results: List of search result dictionaries
        user_goal: User's search goal
        search_strategy: Current search strategy
        max_results: Maximum number of results to return
        
    Returns:
        Top-ranked results based on LLM relevance scoring
    """
    if not results:
        return []
    
    try:
        log_event(f"Applying LLM ranking filter to {len(results)} results (selecting top {max_results})")
        
        model = get_llm_model("filtering", selected_models)
        prompt_template = get_prompt_template("filtering")
        
        # Score all results first
        scored_results = []
        
        for i, result in enumerate(results):
            content = f"Title: {result.get('title', '')}\nDescription: {result.get('description', '')}\nURL: {result.get('url', '')}"
            content = clean_text_for_llm(content)
            
            prompt = prompt_template.format(
                user_goal=user_goal,
                search_strategy=search_strategy,
                content=content,
                total_results=len(results),
                current_index=i+1
            )
            
            try:
                response = completion(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=600,
                    temperature=0.1
                )
                
                response_text = response.choices[0].message.content.strip()
                
                # Parse relevance score and reasoning
                if "SCORE:" in response_text:
                    try:
                        score_line = [line for line in response_text.split('\n') if 'SCORE:' in line][0]
                        score = float(score_line.split('SCORE:')[1].strip().split()[0])
                        result["relevance_score"] = score
                        result["llm_reasoning"] = response_text
                        scored_results.append(result)
                    except (ValueError, IndexError):
                        # If score parsing fails, assign default score
                        result["relevance_score"] = 5.0
                        result["llm_reasoning"] = response_text
                        scored_results.append(result)
                else:
                    # If no score format, check for IRRELEVANT
                    if "IRRELEVANT" not in response_text.upper():
                        result["relevance_score"] = 6.0  # Default relevant score
                        result["llm_reasoning"] = response_text
                        scored_results.append(result)
                    # If IRRELEVANT, don't include in scored_results
                        
            except Exception as e:
                log_event(f"Error in LLM filtering for result {i+1}: {str(e)}", "error")
                # Include result with low score if LLM fails
                result["relevance_score"] = 3.0
                result["llm_reasoning"] = "LLM evaluation failed - included with low score"
                scored_results.append(result)
        
        # Sort by relevance score (highest first) and select top results
        scored_results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        top_results = scored_results[:max_results]
        
        log_event(f"LLM ranked and selected top {len(top_results)} results from {len(scored_results)} relevant results")
        
        # Add ranking summary for debugging
        if top_results:
            scores = [r.get("relevance_score", 0) for r in top_results]
            log_event(f"Selected result scores: {scores}")
        
        return top_results
        
    except Exception as e:
        log_event(f"Error in LLM filtering: {str(e)}", "error")
        return results[:max_results]

def llm_summarize(
    scrape_data: Dict[str, Any],
    user_goal: str,
    search_strategy: str,
    selected_models: Dict[str, str] = None
) -> str:
    """
    Summarize scraped content using LLM.
    
    Args:
        scrape_data: Scraped content dictionary
        user_goal: User's search goal
        search_strategy: Current search strategy
        
    Returns:
        Summary string or empty if no relevant info
    """
    try:
        content = scrape_data.get("text", "")
        url = scrape_data.get("url", "")
        
        if not content:
            return ""
        
        # Clean and truncate content
        content = clean_text_for_llm(content)
        content = truncate_for_context(content, 6000)  # Leave room for prompt
        
        model = get_llm_model("summary", selected_models)
        prompt_template = get_prompt_template("summarization")
        
        prompt = prompt_template.format(
            user_goal=user_goal,
            search_strategy=search_strategy,
            url=url,
            content=content
        )
        
        response = completion(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.1
        )
        
        summary = response.choices[0].message.content.strip()
        
        # Check if summary indicates no relevant info
        if "NO_RELEVANT_INFO" in summary.upper():
            return ""
        
        return summary
        
    except Exception as e:
        log_event(f"Error in LLM summarization: {str(e)}", "error")
        return ""  # Return empty string instead of None

def llm_plan(
    search_goal: str,
    previous_strategies: List[List[str]] = None,
    reflection_feedback: str = "",
    selected_models: Dict[str, str] = None,
    chat_history: List[Dict[str, Any]] = None
) -> List[str]:
    """
    Generate search strategies using LLM.
    
    Args:
        search_goal: User's search goal
        previous_strategies: Previously used strategies
        reflection_feedback: Feedback from reflection agent
        
    Returns:
        List of search strategy strings
    """
    try:
        log_event(f"[DEBUG] Planning for goal: '{search_goal}'")
        
        model = get_llm_model("planning", selected_models)
        prompt_template = get_prompt_template("planning")
        
        log_event(f"[DEBUG] Using model: {model}")
        
        previous_str = str(previous_strategies) if previous_strategies else "None"
        
        # Format chat history for context
        chat_history_str = "None"
        if chat_history and len(chat_history) > 0:
            # Get the last few messages for context (limit to avoid token overflow)
            recent_messages = chat_history[-6:]  # Last 6 messages (3 user + 3 assistant typically)
            formatted_messages = []
            for msg in recent_messages:
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')
                # Truncate very long messages
                if len(content) > 200:
                    content = content[:200] + "..."
                formatted_messages.append(f"{role.capitalize()}: {content}")
            chat_history_str = "\n".join(formatted_messages)
        
        prompt = prompt_template.format(
            search_goal=search_goal,
            previous_strategies=previous_str,
            reflection_feedback=reflection_feedback,
            chat_history=chat_history_str
        )
        
        log_event(f"[DEBUG] Prompt length: {len(prompt)} characters")
        log_event(f"[DEBUG] Full prompt: {prompt[:500]}...")  # First 500 chars
        
        response = completion(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.3
        )
        
        response_text = response.choices[0].message.content.strip()
        log_event(f"[DEBUG] LLM response: {response_text}")
        
        # Check if clarification is needed
        ##### this method is not good 
        if "<CLARIFY>" in response_text.upper():
            log_event(f"[DEBUG] LLM requested clarification: {response_text}")
            return response_text  # Signal that clarification is needed
        
        # Extract strategies from response
        from utils import extract_search_strategies_from_response
        strategies = extract_search_strategies_from_response(response_text)
        
        log_event(f"[DEBUG] Extracted strategies: {strategies}")
        log_event(f"Generated {len(strategies)} search strategies")
        return strategies
        
    except Exception as e:
        log_event(f"Error in LLM planning: {str(e)}", "error")
        import traceback
        log_event(f"[DEBUG] Full traceback: {traceback.format_exc()}", "error")
        return []

def llm_reflect(
    user_goal: str,
    search_strategies: List[List[str]],
    learnings: List[Dict[str, Any]],
    max_iteration: int,
    current_iteration: int,
    selected_models: Dict[str, str] = None
) -> Dict[str, Any]:
    """
    Perform reflection and gap analysis using LLM.
    
    Args:
        user_goal: User's search goal
        search_strategies: All search strategies used
        learnings: Accumulated learnings
        max_iteration: Maximum iterations allowed
        current_iteration: Current iteration number
        
    Returns:
        Dictionary with reflection results
    """
    try:
        model = get_llm_model("reflection", selected_models)
        prompt_template = get_prompt_template("reflection")
        
        # Format learnings for prompt
        learnings_str = ""
        for i, learning in enumerate(learnings, 1):
            learnings_str += f"{i}. {learning.get('learning', 'N/A')}\n"
            if learning.get('url'):
                learnings_str += f"   Source: {learning['url']}\n"
        
        if not learnings_str:
            learnings_str = "No learnings accumulated yet."
        
        prompt = prompt_template.format(
            user_goal=user_goal,
            search_strategies=str(search_strategies),
            learnings=learnings_str,
            current_iteration=current_iteration,
            max_iteration=max_iteration
        )
        
        response = completion(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.2
        )
        
        response_text = response.choices[0].message.content.strip()
        log_event(f"[DEBUG] LLM reflection response: {response_text}")
        
        # Try to parse JSON response
        try:
            import json
            # Clean the response - sometimes LLMs add extra text around JSON
            if '{' in response_text and '}' in response_text:
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                json_str = response_text[start:end]
                reflection_data = json.loads(json_str)
                
                conclusive = reflection_data.get("conclusive", False)
                gaps = reflection_data.get("gaps", "No gap analysis provided")
                
                # Force conclusive if at max iteration
                if current_iteration >= max_iteration:
                    conclusive = True
                    
                log_event(f"[DEBUG] Parsed JSON - Conclusive: {conclusive}")
                
            else:
                raise ValueError("No JSON found in response")
                
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            log_event(f"[DEBUG] Failed to parse JSON response: {e}", "warning")
            # Fallback to old parsing method
            conclusive = "CONCLUSIVE" in response_text.upper() or current_iteration >= max_iteration
            gaps = response_text
            log_event(f"[DEBUG] Using fallback parsing - Conclusive: {conclusive}")
        
        result = {
            "gaps": gaps,
            "conclusive": conclusive,
            "new_strategies_suggested": [] if conclusive else ["Continue search based on gaps identified"]
        }
        
        log_event(f"Reflection complete - Conclusive: {conclusive}")
        return result
        
    except Exception as e:
        log_event(f"Error in LLM reflection: {str(e)}", "error")
        import traceback
        log_event(f"[DEBUG] Full traceback: {traceback.format_exc()}", "error")
        return {
            "gaps": f"Error in reflection: {str(e)}",
            "conclusive": current_iteration >= max_iteration,
            "new_strategies_suggested": []
        }

def parallel_search_and_filter(
    strategies: List[str],
    user_goal: str,
    config: Dict[str, Any],
    progress_callback: Callable = None
) -> List[Dict[str, Any]]:
    """
    Execute parallel searches for multiple strategies and filter each strategy individually.
    
    Args:
        strategies: List of search strategies
        user_goal: User's search goal
        config: Configuration dictionary
        progress_callback: Optional callback for progress updates
        
    Returns:
        Combined filtered results from all strategies
    """
    all_filtered_results = []
    search_params = config.get("search_params", {})
    
    log_event(f"DEBUG: parallel_search_and_filter called with {len(strategies)} strategies")
    
    # Check if strategies is empty
    if not strategies:
        log_event("WARNING: No search strategies provided to parallel_search_and_filter")
        return all_filtered_results
    
    # Use ThreadPoolExecutor for parallel execution
    with ThreadPoolExecutor(max_workers=min(5, len(strategies))) as executor:
        # Submit all search tasks
        future_to_strategy = {
            executor.submit(
                watercrawl_search,
                strategy,
                config["search_result_limit"],
                search_params.get("language"),
                search_params.get("country"),
                search_params.get("time_range", "any"),
                search_params.get("depth", "advanced")
            ): strategy
            for strategy in strategies
        }
        
        log_event(f"DEBUG: Submitted {len(future_to_strategy)} search tasks to executor")
        
        # Collect and filter results as they complete
        for future in as_completed(future_to_strategy):
            strategy = future_to_strategy[future]
            try:
                results = future.result()
                log_event(f"DEBUG: Strategy '{strategy}': Raw search returned {len(results)} results")
                
                # Log search results with color
                log_search_results(strategy, results)
                
                if not results:
                    log_event(f"WARNING: Strategy '{strategy}': No search results found!")
                    continue
                
                # Add strategy info to each result
                for result in results:
                    result["search_strategy"] = strategy
                
                # Filter this strategy's results individually
                if results:
                    # Apply BM25 filter for this specific strategy
                    before_bm25_count = len(results)
                    filtered_results = bm25_filter(
                        results, 
                        strategy,  # Use the specific strategy, not combined query
                        config["bm25_filter_limit"]
                    )
                    
                    # Log BM25 filtering with color
                    log_bm25_filter(strategy, before_bm25_count, len(filtered_results), filtered_results)
                    
                    log_event(f"DEBUG: Strategy '{strategy}': BM25 filter reduced {len(results)} to {len(filtered_results)} results")
                    
                    # Apply LLM filter if enabled
                    if config["llm_rank_flag"] and filtered_results:
                        pre_llm_count = len(filtered_results)
                        filtered_results = llm_filter(
                            filtered_results,
                            user_goal,
                            strategy,  # Use the specific strategy
                            config["llm_filter_limit"]
                        )
                        
                        # Log LLM filtering with color
                        log_llm_filter(strategy, pre_llm_count, len(filtered_results), filtered_results)
                        
                        log_event(f"DEBUG: Strategy '{strategy}': LLM filter reduced {pre_llm_count} to {len(filtered_results)} results")
                    
                    log_event(f"SUMMARY: Strategy '{strategy}': Final filtered count: {len(filtered_results)} results")
                    all_filtered_results.extend(filtered_results)
                    
            except Exception as e:
                log_event(f"ERROR: Error in search/filter for '{strategy}': {str(e)}", "error")
    
    log_event(f"SUMMARY: Parallel search and filter completed - Total filtered results: {len(all_filtered_results)}")
    
    if len(all_filtered_results) == 0:
        log_event("CRITICAL: No results from any search strategy - this will result in no learnings!")
    
    return all_filtered_results

def parallel_search(
    strategies: List[str],
    config: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Execute parallel searches for multiple strategies (legacy function for backward compatibility).
    
    Args:
        strategies: List of search strategies
        config: Configuration dictionary
        
    Returns:
        Combined search results from all strategies
    """
    all_results = []
    search_params = config.get("search_params", {})
    
    # Check if strategies is empty
    if not strategies:
        log_event("No search strategies provided")
        return all_results
    
    # Use ThreadPoolExecutor for parallel execution
    with ThreadPoolExecutor(max_workers=min(5, len(strategies))) as executor:
        # Submit all search tasks
        future_to_strategy = {
            executor.submit(
                watercrawl_search,
                strategy,
                config["search_result_limit"],
                search_params.get("language"),
                search_params.get("country"),
                search_params.get("time_range", "any"),
                search_params.get("depth", "advanced")
            ): strategy
            for strategy in strategies
        }
        
        # Collect results as they complete
        for future in as_completed(future_to_strategy):
            strategy = future_to_strategy[future]
            try:
                results = future.result()
                # Add strategy info to each result
                for result in results:
                    result["search_strategy"] = strategy
                all_results.extend(results)
            except Exception as e:
                log_event(f"Error in parallel search for '{strategy}': {str(e)}", "error")
    
    log_event(f"Parallel search completed - Total results: {len(all_results)}")
    return all_results

def llm_generate_final_report(
    search_goal: str,
    search_strategies_used: List[List[str]],
    global_learnings: List[Dict[str, Any]],
    total_iterations: int,
    total_learnings: int,
    total_urls_scraped: int,
    selected_models: Dict[str, str] = None
) -> str:
    """
    Generate a polished, well-organized final report using LLM.
    
    Args:
        search_goal: The original search goal
        search_strategies_used: All search strategies used across iterations
        global_learnings: All accumulated learnings
        total_iterations: Total number of iterations completed
        total_learnings: Total number of learnings found
        total_urls_scraped: Total number of URLs scraped
        
    Returns:
        Polished final report as a string
    """
    try:
        model = get_llm_model("summary", selected_models)
        
        # Format learnings for the prompt with reference tracking
        learnings_str = ""
        references = []  # Track all unique references
        ref_counter = 1
        
        for i, learning in enumerate(global_learnings, 1):
            learning_text = learning.get('learning', 'N/A')
            source_url = learning.get('url', '')
            source_title = learning.get('title', 'Unknown Source')
            
            if source_url:
                # Add reference number to the learning
                learnings_str += f"{i}. {learning_text} [{ref_counter}]\n\n"
                
                # Track reference for bibliography
                references.append({
                    'number': ref_counter,
                    'url': source_url,
                    'title': source_title
                })
                ref_counter += 1
            else:
                learnings_str += f"{i}. {learning_text}\n\n"
        
        if not learnings_str:
            learnings_str = "No learnings were accumulated during the search."
        
        # Format references for bibliography
        references_str = ""
        if references:
            references_str = "\n".join([
                f"[{ref['number']}] {ref['title']} - {ref['url']}"
                for ref in references
            ])
        
        # Format search strategies
        strategies_str = ""
        for i, iteration_strategies in enumerate(search_strategies_used, 1):
            strategies_str += f"Iteration {i}: {', '.join(iteration_strategies)}\n"
        
        if not strategies_str:
            strategies_str = "No search strategies were recorded."
        
        # Create the enhanced prompt for final report generation with references
        prompt = f"""You are a professional research analyst tasked with creating a comprehensive, well-organized final report based on search results.

Your task is to synthesize the findings into a polished, coherent report that addresses the user's original search goal with proper citations and references.

**Original Search Goal:** {search_goal}

**Search Strategies Used:**
{strategies_str}

**Key Findings and Learnings (with reference numbers):**
{learnings_str}

**Available References for Bibliography:**
{references_str}

**Instructions for the Final Report:**
1. Create a professional, well-structured report that directly addresses the search goal
2. Organize the information in a logical, coherent manner with clear headings and sections
3. Synthesize the learnings into meaningful insights rather than just listing them
4. **IMPORTANT: Use in-text citations throughout the report by referencing the numbered sources [1], [2], etc.**
5. Draw connections between different findings when relevant, citing sources appropriately
6. Write in a professional but accessible tone suitable for stakeholders
7. Include an executive summary at the beginning
8. Provide a clear conclusion that summarizes the key takeaways
9. **MANDATORY: Include a complete "References" section at the end with all numbered sources**
10. Include search statistics at the very end (iterations: {total_iterations}, sources analyzed: {total_urls_scraped}, key insights: {total_learnings})

**Report Structure:**
- Executive Summary
- Introduction
- Main Content (with appropriate sections and subsections)
- Conclusion
- References (numbered list with full URLs)
- Search Statistics

Generate a comprehensive, well-referenced final report now:"""
        
        log_event("Generating final report using LLM...")
        
        response = completion(
            model=model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        final_report = response.choices[0].message.content.strip()
        
        log_event(f"Final report generated successfully ({len(final_report)} characters)")
        return final_report
        
    except Exception as e:
        log_event(f"Error generating final report: {str(e)}", "error")
        import traceback
        log_event(f"[DEBUG] Full traceback: {traceback.format_exc()}", "error")
        
        # Create fallback learnings string in case the error occurred before learnings_str was defined
        try:
            fallback_learnings = learnings_str if 'learnings_str' in locals() and learnings_str != "No learnings were accumulated during the search." else None
        except NameError:
            fallback_learnings = None
            
        if not fallback_learnings:
            if global_learnings:
                fallback_learnings = "\n".join([f"• {learning.get('learning', 'N/A')}" for learning in global_learnings[:5]])
            else:
                fallback_learnings = "Unfortunately, no specific learnings were found during this search."
        
        # Fallback to a simple formatted report
        fallback_report = f"""# Search Results Report

## Search Goal
{search_goal}

## Key Findings
{fallback_learnings}

## Search Summary
- Completed {total_iterations} search iterations
- Analyzed {total_urls_scraped} web sources
- Generated {total_learnings} key insights

*Note: This is a simplified report due to an error in generating the full analysis.*"""
        
        return fallback_report


def classify_user_intent(
    user_message: str,
    chat_history: List[Dict[str, Any]] = None,
    selected_models: Dict[str, str] = None
) -> Dict[str, Any]:
    """
    Classify user intent to determine if message needs web search or can be answered conversationally.
    
    Args:
        user_message: The user's input message
        chat_history: Previous conversation history for context
        selected_models: Dictionary of user-selected LLM models
        
    Returns:
        Dictionary with intent classification and response
    """
    try:
        log_event(f"[DEBUG] Classifying intent for: '{user_message}'")
        
        model = get_llm_model("planning", selected_models)
        
        # Format chat history for context
        chat_history_str = "None"
        if chat_history and len(chat_history) > 0:
            recent_messages = chat_history[-6:]  # Last 6 messages for context
            formatted_messages = []
            for msg in recent_messages:
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')
                if len(content) > 200:
                    content = content[:200] + "..."
                formatted_messages.append(f"{role.capitalize()}: {content}")
            chat_history_str = "\n".join(formatted_messages)
        
        prompt = f"""System: You are an intent classification agent. Analyze the user's message and determine if it requires web search or can be answered conversationally.

CLASSIFICATION RULES:

1. **CONVERSATIONAL** - Answer directly without web search:
   - Meta questions about the system: "do you have memory?", "what can you do?", "how does this work?"
   - Follow-up questions about previous results: "tell me more about that", "explain the first point"
   - Clarifications about previous searches: "what did I ask?", "what was my question?"
   - General greetings or thanks: "hello", "thank you", "thanks"
   - Questions about the conversation: "what did we discuss?", "what did I say?"

2. **SEARCH_REQUIRED** - Needs web research:
   - Requests for factual information: "tell me about LLM serving", "how to deploy models"
   - Research queries: "latest trends in AI", "best practices for..."
   - Technical questions requiring current information: "performance optimization techniques"
   - Any topic that would benefit from web sources and current information

Chat History Context:
{chat_history_str}

User Message: "{user_message}"

Respond with EXACTLY this format:
INTENT: [CONVERSATIONAL or SEARCH_REQUIRED]
CONFIDENCE: [HIGH, MEDIUM, LOW]
REASON: [Brief explanation]
RESPONSE: [If CONVERSATIONAL, provide a helpful response. If SEARCH_REQUIRED, write "PROCEED_WITH_SEARCH"]"""
        
        response = completion(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.1
        )
        
        response_text = response.choices[0].message.content.strip()
        log_event(f"[DEBUG] Intent classification response: {response_text}")
        
        # Parse the response
        lines = response_text.split('\n')
        intent = "SEARCH_REQUIRED"  # Default fallback
        confidence = "MEDIUM"
        reason = "Unable to parse response"
        direct_response = None
        
        for line in lines:
            if line.startswith("INTENT:"):
                intent = line.replace("INTENT:", "").strip()
            elif line.startswith("CONFIDENCE:"):
                confidence = line.replace("CONFIDENCE:", "").strip()
            elif line.startswith("REASON:"):
                reason = line.replace("REASON:", "").strip()
            elif line.startswith("RESPONSE:"):
                response_content = line.replace("RESPONSE:", "").strip()
                if response_content != "PROCEED_WITH_SEARCH":
                    direct_response = response_content
        
        result = {
            "intent": intent,
            "confidence": confidence,
            "reason": reason,
            "needs_search": intent == "SEARCH_REQUIRED",
            "direct_response": direct_response
        }
        
        log_event(f"[DEBUG] Classified intent: {result}")
        return result
        
    except Exception as e:
        log_event(f"Error in intent classification: {str(e)}", "error")
        # Default to search if classification fails
        return {
            "intent": "SEARCH_REQUIRED",
            "confidence": "LOW",
            "reason": f"Classification error: {str(e)}",
            "needs_search": True,
            "direct_response": None
        }
