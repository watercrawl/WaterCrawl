"""
LangGraph workflow definition for the search agent project.
Defines nodes, edges, and state management for the iterative search process.
"""

from typing import Dict, Any, List, TypedDict, Set
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from datetime import datetime
import time
from langgraph.graph import StateGraph, END

# Local imports
from tools import (
    llm_plan, parallel_search, parallel_search_and_filter, bm25_filter, llm_filter, 
    watercrawl_scrape, llm_summarize, llm_reflect
)
from utils import dedup_urls, log_event, format_learnings_for_display, log_search_strategies, log_learnings, log_iteration_summary, MessageHistoryManager

class SearchState(TypedDict):
    """State schema for the search agent workflow."""
    # User input and configuration
    search_goal: str
    original_search_goal: str  # Keep track of original goal
    agent_search_type: str
    config: Dict[str, Any]
    selected_models: Dict[str, str]  # User-selected LLM models
    chat_history: List[Dict[str, Any]]  # Chat history from Streamlit app
    
    # Iteration tracking
    iteration: int
    max_iteration: int
    
    # Interactive clarification system
    clarification_round: int
    awaiting_user_response: bool
    user_clarification_response: str
    pending_questions: List[str]
    clarification_history: List[Dict[str, Any]]
    
    # Search strategies and results
    search_strategies: List[List[str]]  # All strategies from all iterations
    current_strategies: List[str]      # Current iteration strategies
    searched_urls: List[Dict[str, Any]]  # Raw search results
    filtered_urls: List[Dict[str, Any]]  # Filtered search results
    
    # Learning accumulation
    current_iteration_learnings: List[Dict[str, Any]]
    global_learnings: List[Dict[str, Any]]
    scraped_urls: Set[str]
    
    # Reflection and control flow
    reflections: List[str]
    current_reflection: str
    clarification_needed: bool
    clarification_message: str  # Store specific clarification message
    needs_more_search: bool
    
    # Enhanced message history system
    message_history: List[Dict[str, Any]]
    history_manager: MessageHistoryManager
    
    # Final output
    final_result: Dict[str, Any]
    
    # Progress callback
    progress_callback: callable

def add_to_history(state: SearchState, node: str, msg_type: str, content: str):
    """Helper function to add structured messages to the workflow history."""
    state.setdefault("message_history", []).append({
        "node": node,
        "type": msg_type,
        "content": content,
        "timestamp": datetime.now().isoformat(),
        "iteration": state.get("iteration", 0)
    })

def planning_node(state: SearchState) -> SearchState:
    """
    Node 1: Planning Agent - Generate search strategies.
    """
    log_event(f"=== PLANNING NODE - Iteration {state['iteration']} ===")
    
    add_to_history(state, "planning", "start", f"Planning iteration {state['iteration']}")
    
    progress_callback = state.get("progress_callback")
    if progress_callback:
        progress_callback("planning", f" Planning Agent - Iteration {state['iteration']}")
    
    # Handle user clarification by combining with current goal for progressive refinement
    log_event(f"DEBUG PLANNING: user_clarification_response='{state.get('user_clarification_response')}', search_goal='{state.get('search_goal')}', awaiting_user_response={state.get('awaiting_user_response')}")
    
    goal_updated = False
    if state.get("user_clarification_response") and state.get("search_goal"):
        # Combine current goal with clarification to create a progressively more specific goal
        current_goal = state["search_goal"]
        clarification = state["user_clarification_response"]
        
        # Create combined goal (progressive refinement) - ensure proper spacing
        combined_goal = f"{current_goal} {clarification}".strip()
        
        log_event(f"DEBUG PLANNING: Combining current goal '{current_goal}' with clarification '{clarification}' -> '{combined_goal}'")
        
        # Update the search goal with the combined version
        state["search_goal"] = combined_goal
        goal_updated = True
        
        log_event(f"DEBUG PLANNING: Updated state search_goal to: '{state['search_goal']}'")
        
        # Clear the clarification flags
        state["clarification_needed"] = False
        state["awaiting_user_response"] = False
        state["user_clarification_response"] = ""
        
        add_to_history(state, "planning", "clarification_processed", f"Updated search goal to: {combined_goal}")
        
        # Notify progress callback about the updated goal
        if progress_callback:
            progress_callback("planning", f"🎯 Updated Search Goal: {combined_goal}")
    else:
        log_event(f"DEBUG PLANNING: No clarification processing - conditions not met")
    
    # Prepare context for planning
    previous_strategies = state.get("search_strategies", [])
    reflection_feedback = state.get("current_reflection", "")
    
    # Generate new search strategies
    strategies = llm_plan(
        search_goal=state["search_goal"],
        previous_strategies=previous_strategies,
        reflection_feedback=reflection_feedback,
        selected_models=state.get("selected_models"),
        chat_history=state.get("chat_history", [])
    )
    
    # Log search strategies with color
    if strategies and isinstance(strategies, list):
        log_search_strategies(state["iteration"], strategies)
    
    # Check if clarification is needed (LLM returned clarification text instead of strategies)
    if isinstance(strategies, str) and "<CLARIFY>" in strategies.upper():
        log_event("LLM requested clarification")
        state["clarification_needed"] = True
        state["awaiting_user_response"] = True  # Signal that we need user input
        
        # Extract the clarification message (remove the <CLARIFY> tag)
        clarification_msg = strategies.replace("<CLARIFY>", "").replace("<clarify>", "").strip()
        state["clarification_message"] = clarification_msg
        
        add_to_history(state, "planning", "clarification", clarification_msg)
        
        if progress_callback:
            progress_callback("planning", " Need more specific details about your search goal")
        
        return state
    
    # Check if no strategies were generated (fallback case)
    if not strategies or (isinstance(strategies, list) and len(strategies) == 0):
        log_event("No strategies generated - using fallback approach")
        state["clarification_needed"] = True
        
        # Generate a generic fallback clarification message
        search_goal = state["search_goal"].lower().strip()
        
        # Check if the goal is genuinely unclear (very short or vague)
        if len(search_goal.split()) <= 1:
            # Single word queries
            clarification_msg = f"I'd like to help you with '{state['search_goal']}', but I need a bit more context. Could you tell me:\n\n• What specific aspect are you interested in?\n• Are you looking for explanations, tutorials, news, or something else?\n• What's the purpose or context for this information?"
        elif any(vague_term in search_goal for vague_term in ['help', 'information', 'stuff', 'things', 'something']):
            # Vague terms
            clarification_msg = f"Your request is quite general. To provide the most helpful results, could you specify:\n\n• What specific topic or subject are you interested in?\n• What type of information would be most useful?\n• What's your goal or what are you trying to accomplish?"
        else:
            # For seemingly clear questions that still didn't generate strategies, 
            # this might be a system error - let's try to proceed anyway
            log_event(f"Warning: Clear question '{state['search_goal']}' failed to generate strategies. This may be a system issue.")
            
            # Generate some basic fallback strategies based on the question
            fallback_strategies = []
            if any(term in search_goal for term in ['what', 'how', 'why', 'when', 'where']):
                # Question words detected - try basic strategies
                fallback_strategies = [
                    f"{state['search_goal']} explanation",
                    f"{state['search_goal']} guide",
                    f"{state['search_goal']} overview"
                ]
            
            if fallback_strategies:
                log_event(f"Using fallback strategies: {fallback_strategies}")
                strategies = fallback_strategies
                state["clarification_needed"] = False
                log_search_strategies(state["iteration"], strategies)
                add_to_history(state, "planning", "fallback_strategies", f"Generated {len(strategies)} fallback strategies")
            else:
                clarification_msg = f"I want to make sure I search for exactly what you need. Could you provide a bit more detail about '{state['search_goal']}'?\n\n• What specific information are you looking for?\n• What's the context or purpose?\n• Are there particular aspects you're most interested in?"
        
        if state["clarification_needed"]:
            state["awaiting_user_response"] = True  # Signal that we need user input
            state["clarification_message"] = clarification_msg
            add_to_history(state, "planning", "clarification", clarification_msg)
        
        if progress_callback:
            progress_callback("planning", " Need more specific details about your search goal")
        
        return state
    
    # Update state with new strategies
    state["current_strategies"] = strategies
    state["search_strategies"].append(strategies)
    
    add_to_history(state, "planning", "success", f"Generated {len(strategies)} search strategies")
    
    log_event(f"Generated {len(strategies)} search strategies for iteration {state['iteration']}")
    
    if progress_callback:
        progress_callback("planning", f" Generated {len(strategies)} search strategies")
    
    return state

def search_filter_node(state: SearchState) -> SearchState:
    """
    Node 2: Search and Filter - Execute searches and apply per-strategy filters.
    """
    log_event("=== SEARCH & FILTER NODE ===")
    
    progress_callback = state.get("progress_callback")
    if progress_callback:
        progress_callback("search", " Starting parallel search and filtering")
    
    strategies = state["current_strategies"]
    config = state["config"]
    user_goal = state["search_goal"]
    
    log_event(f"DEBUG: Starting search_filter_node with {len(strategies)} strategies")
    log_event(f"DEBUG: Strategies: {strategies}")
    
    if not strategies:
        log_event("WARNING: No search strategies provided - this will result in no URLs to scrape!")
        state["searched_urls"] = []
        state["filtered_urls"] = []
        return state
    
    # Execute parallel searches with per-strategy filtering
    log_event(f"Executing parallel searches and filtering for {len(strategies)} strategies")
    
    # Use the new per-strategy filtering approach
    filtered_results = parallel_search_and_filter(strategies, user_goal, config, progress_callback)
    
    log_event(f"DEBUG: parallel_search_and_filter returned {len(filtered_results)} results")
    
    # Store raw results (for backward compatibility, though not used in new approach)
    state["searched_urls"] = filtered_results  # These are already filtered
    
    # Remove duplicates and already scraped URLs
    unique_urls = []
    seen_urls = set()
    
    for result in filtered_results:
        url = result.get("url", "")
        if url and url not in seen_urls and url not in state["scraped_urls"]:
            unique_urls.append(result)
            seen_urls.add(url)
        elif not url:
            log_event("WARNING: Found result with empty URL")
        elif url in seen_urls:
            log_event(f"DEBUG: Skipping duplicate URL: {url}")
        elif url in state["scraped_urls"]:
            log_event(f"DEBUG: Skipping already scraped URL: {url}")
    
    state["filtered_urls"] = unique_urls
    log_event(f"SUMMARY: Per-strategy filtering completed - {len(unique_urls)} unique, unscraped URLs")
    
    if len(unique_urls) == 0:
        log_event("WARNING: No unique URLs after filtering - this will result in no learnings!")
    
    if progress_callback:
        progress_callback("search", f" Search and filtering complete - {len(unique_urls)} URLs ready for scraping")
    
    return state

def scrape_and_summarize_single_url(url_data: Dict[str, Any], state: SearchState, index: int, total: int) -> Dict[str, Any]:
    """
    Helper function to scrape and summarize a single URL.
    Designed to be used in parallel processing.
    
    Args:
        url_data: Dictionary containing URL and metadata
        state: Current search state
        index: Current URL index (for logging)
        total: Total number of URLs being processed
        
    Returns:
        Dictionary with learning data or None if failed
    """
    url = url_data.get("url", "")
    if not url:
        log_event(f"WARNING: Empty URL in result {index}")
        return None
    
    thread_id = threading.get_ident()
    log_event(f"[Thread-{thread_id}] Scraping {index}/{total}: {url}")
    print(f"🔗 [Thread-{thread_id}] Scraping {index}/{total}: {url}")
    
    try:
        # Scrape the URL
        scrape_data = watercrawl_scrape(url, state["config"].get("page_options"))
        content_length = len(scrape_data.get('text', ''))
        log_event(f"[Thread-{thread_id}] Scrape result for {url}: {content_length} characters")
        print(f"📄 [Thread-{thread_id}] Scraped content: {content_length} characters")
        
        if content_length == 0:
            print(f"⚠️ [Thread-{thread_id}] WARNING: No content scraped from {url}")
            return None
        else:
            print(f"✅ [Thread-{thread_id}] Content preview: {scrape_data.get('text', '')[:100]}...")
        
        # Summarize the content
        print(f"🧠 [Thread-{thread_id}] Generating summary for: {scrape_data.get('title', url)}")
        summary = llm_summarize(
            scrape_data,
            state["search_goal"],
            url_data.get("search_strategy", ""),
            state.get("selected_models")
        )
        
        log_event(f"[Thread-{thread_id}] Summary result for {url}: {'Found' if summary else 'Empty'} ({len(summary) if summary else 0} characters)")
        
        if summary:
            print(f"✅ [Thread-{thread_id}] Summary generated: {len(summary)} characters")
            print(f"   [Thread-{thread_id}] Preview: {summary[:150]}...")
            
            # Return learning data
            return {
                "learning": summary,
                "url": url,
                "title": scrape_data.get("title", ""),
                "search_strategy": url_data.get("search_strategy", "")
            }
        else:
            print(f"❌ [Thread-{thread_id}] No summary generated for {url}")
            return None
            
    except Exception as e:
        log_event(f"[Thread-{thread_id}] ERROR: Failed to process {url}: {str(e)}", "error")
        print(f"❌ [Thread-{thread_id}] ERROR: Failed to process {url}: {str(e)}")
        return None

def scrape_summarize_node(state: SearchState) -> SearchState:
    """
    Node 3: Scrape and Summarize - Scrape URLs and generate summaries.
    """
    log_event("=== SCRAPE & SUMMARIZE NODE ===")
    
    progress_callback = state.get("progress_callback")
    if progress_callback:
        progress_callback("scraping", " Starting content scraping and summarization")
    
    filtered_urls = state["filtered_urls"]
    current_learnings = []
    
    log_event(f"DEBUG: Starting scrape_summarize_node with {len(filtered_urls)} filtered URLs")
    print(f"🔍 DEBUG: Filtered URLs received: {len(filtered_urls)}")
    
    # Debug: Print the filtered URLs
    for i, url_data in enumerate(filtered_urls):
        print(f"  {i+1}. URL: {url_data.get('url', 'NO URL')}")
        print(f"      Title: {url_data.get('title', 'NO TITLE')}")
        print(f"      Strategy: {url_data.get('search_strategy', 'NO STRATEGY')}")
    
    if not filtered_urls:
        log_event("WARNING: No filtered URLs to scrape - this is why no learnings are being accumulated!")
        print("❌ CRITICAL: No filtered URLs to scrape!")
        print("   This means either:")
        print("   1. Search returned no results")
        print("   2. All results were filtered out by BM25/LLM filtering")
        if progress_callback:
            progress_callback("scraping", " No URLs to scrape - check search and filtering logic")
        state["current_iteration_learnings"] = current_learnings
        
        # Log empty learnings with color
        log_learnings(state["iteration"], current_learnings)
        log_iteration_summary(state["iteration"], len(state["global_learnings"]))
        
        return state
    
    log_event(f"Scraping {len(filtered_urls)} URLs")
    print(f"🕷️ Starting PARALLEL scraping of {len(filtered_urls)} URLs...")
    
    # Configure parallel processing
    max_workers = min(10, len(filtered_urls))  # At least 10 workers as requested, but not more than URLs
    print(f"🔧 Using {max_workers} parallel workers for scraping")
    
    # Use ThreadPoolExecutor for parallel scraping
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all scraping tasks
        future_to_url = {}
        for i, url_data in enumerate(filtered_urls, 1):
            future = executor.submit(scrape_and_summarize_single_url, url_data, state, i, len(filtered_urls))
            future_to_url[future] = url_data
        
        # Collect results as they complete
        completed_count = 0
        for future in as_completed(future_to_url):
            completed_count += 1
            url_data = future_to_url[future]
            url = url_data.get("url", "Unknown")
            
            if progress_callback:
                progress_callback("scraping", f" Completed {completed_count}/{len(filtered_urls)}: {url[:50]}...")
            
            try:
                learning_result = future.result()
                if learning_result:
                    current_learnings.append(learning_result)
                    print(f"🎯 SUCCESS: Added learning #{len(current_learnings)} from: {url}")
                    log_event(f"SUCCESS: Added learning from: {url}")
                else:
                    print(f"⚠️ No learning extracted from: {url}")
                    
            except Exception as e:
                log_event(f"ERROR: Future failed for {url}: {str(e)}", "error")
                print(f"❌ ERROR: Future failed for {url}: {str(e)}")
    
    print(f"🏁 Parallel scraping completed! Generated {len(current_learnings)} learnings from {len(filtered_urls)} URLs")
    
    # Mark all scraped URLs
    for url_data in filtered_urls:
        url = url_data.get("url", "")
        if url:
            state["scraped_urls"].add(url)
    
    # Update state with new learnings
    state["current_iteration_learnings"] = current_learnings
    state["global_learnings"].extend(current_learnings)
    
    # Enhanced debug logging
    print(f"📊 ITERATION {state['iteration']} SUMMARY:")
    print(f"   New learnings this iteration: {len(current_learnings)}")
    print(f"   Total global learnings: {len(state['global_learnings'])}")
    print(f"   URLs scraped this iteration: {len([r for r in filtered_urls if r.get('url')])}")
    print(f"   Total URLs scraped overall: {len(state['scraped_urls'])}")
    
    # Log learnings with color
    log_learnings(state["iteration"], current_learnings)
    log_iteration_summary(state["iteration"], len(state["global_learnings"]))
    print("iteration, global_learnings length:   -----------> ")
    print("iteration, global_learnings length:   -----------> ")
    print("iteration:   -----------> ",state["iteration"], "global_learnings length:   ----------->", len(state["global_learnings"]))
    log_event(f"SUMMARY: Iteration {state['iteration']} complete - Added {len(current_learnings)} learnings")
    log_event(f"SUMMARY: Total learnings accumulated: {len(state['global_learnings'])}")
    
    if progress_callback:
        progress_callback("scraping", f" Scraping complete - Added {len(current_learnings)} new learnings (Total: {len(state['global_learnings'])})")
    
    return state

def reflection_node(state: SearchState) -> SearchState:
    """
    Node 4: Reflection - Analyze learnings and determine next steps.
    """
    log_event("=== REFLECTION NODE ===")
    
    progress_callback = state.get("progress_callback")
    if progress_callback:
        progress_callback("reflection", " Analyzing learnings and planning next steps")
    
    # Perform reflection and gap analysis
    reflection_result = llm_reflect(
        user_goal=state["search_goal"],
        search_strategies=state["search_strategies"],
        learnings=state["global_learnings"],
        max_iteration=state["max_iteration"],
        current_iteration=state["iteration"]
    )
    
    # Update state with reflection results
    state["current_reflection"] = reflection_result["gaps"]
    state["reflections"].append(reflection_result["gaps"])
    
    # Determine if more search is needed
    conclusive = reflection_result["conclusive"]
    at_max_iteration = state["iteration"] >= state["max_iteration"]
    
    state["needs_more_search"] = not conclusive and not at_max_iteration
    
    if state["needs_more_search"]:
        log_event(f"Gap analysis indicates more search needed - continuing to iteration {state['iteration'] + 1}")
        state["iteration"] += 1
        
        if progress_callback:
            progress_callback("reflection", f" Continuing search - Starting iteration {state['iteration']}")
            progress_callback("iteration", f"Starting Iteration {state['iteration']}")
    else:
        reason = "max iterations reached" if at_max_iteration else "learnings are conclusive"
        log_event(f"Search complete - {reason}")
        
        if progress_callback:
            progress_callback("reflection", f" Search complete - {reason}")
    
    return state

def finalize_node(state: SearchState) -> SearchState:
    """
    Final node: Prepare final results.
    """
    log_event("=== FINALIZE NODE ===")
    
    progress_callback = state.get("progress_callback")
    if progress_callback:
        progress_callback("final", " Preparing final search report")
    
    # Check if we ended due to clarification needed
    if state.get("clarification_needed", False):
        # Extract the clarification message from message history
        clarification_message = None
        message_history = state.get("message_history", [])
        
        # Find the most recent clarification message
        for msg in reversed(message_history):
            if msg.get("type") == "clarification":
                clarification_message = msg.get("content")
                break
        
        # Fallback protection
        if not clarification_message:
            clarification_message = "The search goal needs clarification. Please provide more specific details about what you're looking for."
        
        final_result = {
            "search_goal": state["search_goal"],
            "status": "clarification_needed",
            "message": clarification_message,
            "total_iterations": 0,
            "total_learnings": 0,
            "total_urls_scraped": 0,
            "learnings": [],
            "reflections": [],
            "search_strategies_used": [],
            "formatted_learnings": "Search could not proceed due to unclear goal. Please provide more specific details."
        }
        
        if progress_callback:
            progress_callback("final", " Clarification needed from user")
    else:
        # Generate polished final report using LLM
        from tools import llm_generate_final_report
        
        if progress_callback:
            progress_callback("final", " Generating comprehensive final report...")
        
        final_report = llm_generate_final_report(
            search_goal=state["search_goal"],
            search_strategies_used=state["search_strategies"],
            global_learnings=state["global_learnings"],
            total_iterations=state["iteration"],
            total_learnings=len(state["global_learnings"]),
            total_urls_scraped=len(state["scraped_urls"]),
            selected_models=state.get("selected_models")
        )
        
        # Store the polished report as the final result
        final_result = final_report
        
        if progress_callback:
            progress_callback("final", f" Final report ready - {len(state['global_learnings'])} learnings from {state['iteration']} iterations")
    
    state["final_result"] = final_result
    log_event("Final result prepared")
    
    return state

def should_continue_search(state: SearchState) -> str:
    """
    Conditional edge function to determine workflow routing.
    """
    if state.get("clarification_needed", False):
        return "clarify"
    elif state.get("needs_more_search", False):
        return "continue"
    else:
        return "finish"

def create_search_workflow() -> StateGraph:
    """
    Create and compile the search workflow graph.
    """
    # Initialize state graph
    workflow = StateGraph(SearchState)
    
    # Add nodes
    workflow.add_node("planning", planning_node)
    workflow.add_node("search_filter", search_filter_node)
    workflow.add_node("scrape_summarize", scrape_summarize_node)
    workflow.add_node("reflection", reflection_node)
    workflow.add_node("finalize", finalize_node)
    
    # Add edges
    workflow.add_edge("search_filter", "scrape_summarize")
    workflow.add_edge("scrape_summarize", "reflection")
    
    # Add conditional edges from planning
    workflow.add_conditional_edges(
        "planning",
        lambda state: "search" if not state.get("clarification_needed", False) else "clarify",
        {
            "search": "search_filter",
            "clarify": "finalize"  # End if clarification needed
        }
    )
    
    # Add conditional edges from reflection
    workflow.add_conditional_edges(
        "reflection",
        should_continue_search,
        {
            "continue": "planning",  # Loop back for more iterations
            "finish": "finalize"     # End the workflow
        }
    )
    
    workflow.add_edge("finalize", END)
    
    # Set entry point
    workflow.set_entry_point("planning")
    
    return workflow.compile()

def initialize_state(
    search_goal: str,
    agent_search_type: str,
    config: Dict[str, Any],
    progress_callback: callable,
    selected_models: Dict[str, str] = None,
    chat_history: List[Dict[str, Any]] = None
) -> SearchState:
    """
    Initialize the workflow state.
    """
    return SearchState(
        search_goal=search_goal,
        original_search_goal=search_goal,
        agent_search_type=agent_search_type,
        config=config,
        selected_models=selected_models or {},
        chat_history=chat_history or [],
        iteration=1,
        max_iteration=config["max_iteration"],
        search_strategies=[],
        current_strategies=[],
        searched_urls=[],
        filtered_urls=[],
        current_iteration_learnings=[],
        global_learnings=[],
        scraped_urls=set(),
        reflections=[],
        current_reflection="",
        clarification_needed=False,
        clarification_message="",
        needs_more_search=True,
        message_history=[],
        history_manager=MessageHistoryManager(),
        final_result={},
        progress_callback=progress_callback,
        clarification_round=0,
        awaiting_user_response=False,
        user_clarification_response="",
        pending_questions=[],
        clarification_history=[]
    )

# Create the compiled workflow
search_workflow = create_search_workflow()

if __name__ == "__main__":
    # Test the workflow
    from configs import get_config
    
    test_goal = "Find information about the latest developments in AI agents and their applications"
    test_config = get_config("fast")
    
    def progress_callback(node, message):
        print(f"[{node}] {message}")
    
    initial_state = initialize_state(test_goal, "fast", test_config, progress_callback)
    
    print("Starting search workflow...")
    result = search_workflow.invoke(initial_state)
    
    print("\n=== FINAL RESULT ===")
    print(result["final_result"]["formatted_learnings"])
