"""
Streamlit frontend for the search agent project.
Provides a chat interface for users to interact with the search agent.
"""

import streamlit as st
import os
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# Local imports
from graph import search_workflow, initialize_state
from configs import get_config, SEARCH_PROFILES
from utils import log_event

# Page configuration
st.set_page_config(
    page_title="🔍 Objective Search Agent",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS to make sidebar wider
st.markdown("""
<style>
    .css-1d391kg {
        width: 400px;
    }
    .css-1lcbmhc {
        width: 400px;
    }
    .sidebar .sidebar-content {
        width: 400px;
    }
    /* Streamlit sidebar width */
    section[data-testid="stSidebar"] {
        width: 400px !important;
    }
    section[data-testid="stSidebar"] > div {
        width: 400px !important;
    }
    /* Main content adjustment */
    .main .block-container {
        padding-left: 2rem;
        padding-right: 2rem;
        max-width: none;
    }
    /* Better spacing for dropdowns */
    .stSelectbox > div > div {
        min-width: 300px;
    }
</style>
""", unsafe_allow_html=True)

def init_session_state():
    """Initialize Streamlit session state variables."""
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "search_running" not in st.session_state:
        st.session_state.search_running = False
    if "current_result" not in st.session_state:
        st.session_state.current_result = None
    # Workflow session management
    if "active_workflow_instance" not in st.session_state:
        st.session_state.active_workflow_instance = None
    if "workflow_is_active" not in st.session_state:
        st.session_state.workflow_is_active = False
    if "workflow_session_id" not in st.session_state:
        st.session_state.workflow_session_id = None


def classify_message_type(message, workflow_state):
    """Determine if message is initial goal, clarification, or new goal"""
    if workflow_state is None:
        return "INITIAL_GOAL"
    elif workflow_state.get("awaiting_user_response", False):
        return "CLARIFICATION"
    else:
        return "NEW_GOAL"  # User wants to start fresh search


def update_search_goal_consistently(state, new_goal_component, update_type="clarification"):
    """Single function to update search goal across all state locations"""
    if update_type == "clarification":
        current_goal = state.get("search_goal", "")
        combined_goal = f"{current_goal} {new_goal_component}".strip()
        state["search_goal"] = combined_goal
        log_event(f"[GOAL UPDATE] Combined: '{current_goal}' + '{new_goal_component}' = '{combined_goal}'")
    else:
        state["search_goal"] = new_goal_component
        log_event(f"[GOAL UPDATE] Set new goal: '{new_goal_component}'")
    
    # Sync to UI state
    if "workflow_state" in st.session_state:
        st.session_state.workflow_state["search_goal"] = state["search_goal"]
    
    return state["search_goal"]


def get_current_search_goal():
    """Get the current search goal from the single source of truth"""
    if (st.session_state.active_workflow_instance and 
        st.session_state.active_workflow_instance.get("search_goal")):
        return st.session_state.active_workflow_instance["search_goal"]
    elif ("workflow_state" in st.session_state and 
          st.session_state.workflow_state.get("search_goal")):
        return st.session_state.workflow_state["search_goal"]
    return "No active search goal"


def is_workflow_complete(workflow_result):
    """Check if workflow has truly finished"""
    return (
        workflow_result.get("final_result") is not None and
        not workflow_result.get("awaiting_user_response", False) and
        not workflow_result.get("clarification_needed", False)
    )


def generate_session_id() -> str:
    """Generate a unique session ID for workflow tracking"""
    return str(uuid.uuid4())[:8]


def update_progress_display(progress_expander, log_type: str, content: str, iteration: int = None):
    """Update the real-time progress display in the UI"""
    try:
        # Add to progress logs
        if 'progress_logs' not in st.session_state:
            st.session_state.progress_logs = []
        
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = {
            "timestamp": timestamp,
            "type": log_type,
            "content": content,
            "iteration": iteration or st.session_state.get('current_iteration', 0)
        }
        
        st.session_state.progress_logs.append(log_entry)
        
        # Update the progress display
        with progress_expander:
            # Clear and rebuild the progress display
            st.empty()
            
            # Show current iteration info
            if st.session_state.get('current_iteration', 0) > 0:
                st.markdown(f"### 🔄 **Iteration {st.session_state.current_iteration}**")
                st.markdown(f"**Total Learnings So Far:** {st.session_state.get('total_learnings', 0)}")
                st.markdown("---")
            
            # Show recent progress (last 20 entries)
            recent_logs = st.session_state.progress_logs[-20:]
            
            for log in recent_logs:
                icon = get_log_icon(log["type"])
                if log["type"] == "iteration_start":
                    st.markdown(f"## {icon} **{log['content']}**")
                elif log["type"] == "strategies":
                    st.markdown(f"### {icon} **Search Strategies**")
                    st.code(log["content"], language="text")
                elif log["type"] == "search_results":
                    st.markdown(f"### {icon} **Search Results**")
                    st.markdown(log["content"])
                elif log["type"] == "filtering":
                    st.markdown(f"### {icon} **Filtering Results**")
                    st.markdown(log["content"])
                elif log["type"] == "learning":
                    st.markdown(f"### {icon} **New Learning**")
                    st.info(log["content"])
                elif log["type"] == "summary":
                    st.markdown(f"### {icon} **Iteration Summary**")
                    st.success(log["content"])
                else:
                    st.markdown(f"{icon} {log['content']}")
                
                # Add small separator
                st.markdown("<div style='margin: 5px 0;'></div>", unsafe_allow_html=True)
    
    except Exception as e:
        # Fail silently to not disrupt the main workflow
        pass


def get_log_icon(log_type: str) -> str:
    """Get appropriate icon for log type"""
    icons = {
        "iteration_start": "🔄",
        "strategies": "🎯",
        "search_results": "📊",
        "filtering": "🔧",
        "learning": "💡",
        "summary": "📋",
        "scraping": "🌐",
        "reflection": "🤔",
        "planning": "📝",
        "info": "ℹ️",
        "success": "✅",
        "warning": "⚠️",
        "error": "❌"
    }
    return icons.get(log_type, "📌")


def handle_user_message_with_persistent_workflow(
    prompt: str, 
    search_type: str, 
    config: Dict[str, Any], 
    progress_placeholder, 
    messages_placeholder, 
    progress_expander,
    selected_models: Dict[str, str] = None
):
    """Handle user message with persistent workflow session management"""
    try:
        # Import intent classification
        from tools import classify_user_intent
        
        # Step 1: Classify user intent first
        intent_result = classify_user_intent(
            user_message=prompt,
            chat_history=st.session_state.messages,
            selected_models=selected_models
        )
        
        log_event(f"[INTENT] Classified as: {intent_result['intent']} (confidence: {intent_result['confidence']})")
        
        # Step 2: Handle conversational responses directly
        if not intent_result["needs_search"] and intent_result["direct_response"]:
            st.markdown(intent_result["direct_response"])
            st.session_state.messages.append({
                "role": "assistant",
                "content": intent_result["direct_response"],
                "type": "conversational"
            })
            return None
        
        # Step 3: Determine message type for workflow management
        message_type = classify_message_type(prompt, st.session_state.active_workflow_instance)
        log_event(f"[WORKFLOW] Message type: {message_type}")
        
        # Step 4: Handle workflow based on message type
        if message_type == "INITIAL_GOAL":
            # Start new workflow
            log_event(f"[WORKFLOW] Starting new workflow for goal: '{prompt}'")
            
            # Reset progress tracking for new workflow
            st.session_state.progress_logs = []
            st.session_state.current_iteration = 0
            st.session_state.total_learnings = 0
            
            # Create enhanced progress callback
            def enhanced_progress_callback(node: str, msg: str):
                # Update basic progress placeholder
                progress_placeholder.info(f"🔄 {node}: {msg}")
                # Update detailed progress display
                update_progress_display(progress_expander, "info", f"**{node}**: {msg}")
            
            st.session_state.active_workflow_instance = initialize_state(
                search_goal=prompt,
                agent_search_type=search_type,
                config=config,
                progress_callback=enhanced_progress_callback,
                selected_models=selected_models,
                chat_history=st.session_state.messages
            )
            st.session_state.workflow_is_active = True
            st.session_state.workflow_session_id = generate_session_id()
            
        elif message_type == "CLARIFICATION":
            # Continue existing workflow with clarification
            log_event(f"[WORKFLOW] Continuing workflow with clarification: '{prompt}'")
            
            current_state = st.session_state.active_workflow_instance
            
            # Update goal consistently
            update_search_goal_consistently(current_state, prompt, "clarification")
            
            # Set clarification response
            current_state["user_clarification_response"] = prompt
            current_state["awaiting_user_response"] = False
            current_state["clarification_needed"] = False
            
        elif message_type == "NEW_GOAL":
            # User wants to start a completely new search
            log_event(f"[WORKFLOW] Starting fresh workflow for new goal: '{prompt}'")
            
            # Clear previous workflow
            st.session_state.active_workflow_instance = None
            st.session_state.workflow_is_active = False
            
            # Start new workflow
            st.session_state.active_workflow_instance = initialize_state(
                search_goal=prompt,
                agent_search_type=search_type,
                config=config,
                progress_callback=lambda node, msg: progress_placeholder.info(f"🔄 {node}: {msg}"),
                selected_models=selected_models,
                chat_history=st.session_state.messages
            )
            st.session_state.workflow_is_active = True
            st.session_state.workflow_session_id = generate_session_id()
        
        # Step 5: Execute the workflow
        from graph import search_workflow
        
        log_event(f"[WORKFLOW] Executing workflow (session: {st.session_state.workflow_session_id})")
        result = search_workflow.invoke(st.session_state.active_workflow_instance)
        
        # Step 6: Update persistent state
        st.session_state.active_workflow_instance = result
        
        # Sync workflow state for UI display
        st.session_state.workflow_state = result
        
        # Step 7: Check if workflow completed
        if is_workflow_complete(result):
            log_event(f"[WORKFLOW] Workflow completed (session: {st.session_state.workflow_session_id})")
            st.session_state.workflow_is_active = False
            # Keep the instance for goal display but mark as inactive
        
        return result
        
    except Exception as e:
        log_event(f"Error in persistent workflow handler: {str(e)}", "error")
        st.error(f"❌ Error processing message: {str(e)}")
        return None


def get_custom_config():
    """Get custom configuration from sidebar inputs."""
    st.sidebar.subheader("Custom Configuration")
    
    custom_config = {}
    
    col1, col2 = st.sidebar.columns(2)
    
    with col1:
        custom_config["max_search_strategy"] = st.number_input(
            "Max Search Strategies", 
            min_value=1, 
            max_value=15, 
            value=5
        )
        custom_config["search_result_limit"] = st.number_input(
            "Search Result Limit", 
            min_value=10, 
            max_value=100, 
            value=40
        )
        custom_config["bm25_filter_limit"] = st.number_input(
            "BM25 Filter Limit", 
            min_value=5, 
            max_value=50, 
            value=25
        )
    
    with col2:
        custom_config["llm_filter_limit"] = st.number_input(
            "LLM Filter Limit", 
            min_value=5, 
            max_value=30, 
            value=10
        )
        custom_config["max_iteration"] = st.number_input(
            "Max Iterations", 
            min_value=1, 
            max_value=15, 
            value=4
        )
        custom_config["llm_rank_flag"] = st.checkbox(
            "Enable LLM Ranking", 
            value=True
        )
    
    return custom_config

def display_progress_updates(placeholder):
    """Display real-time progress updates."""
    progress_messages = [
        "🔍 Analyzing your search goal...",
        "📝 Generating search strategies...",
        "🌐 Executing parallel web searches...",
        "🔧 Applying BM25 filtering...",
        "🤖 Applying LLM-based filtering...",
        "📄 Scraping relevant URLs...",
        "📊 Summarizing content with AI...",
        "🧠 Performing reflection and gap analysis...",
        "🔄 Determining if more search is needed...",
        "✅ Finalizing comprehensive results..."
    ]
    
    for i, message in enumerate(progress_messages):
        placeholder.write(f"**Step {i+1}:** {message}")
        time.sleep(0.5)  # Simulate processing time

def format_final_result(result):
    """Format the final result for display."""
    if not result:
        return "No results available."
    
    # Handle new string format (polished report)
    if isinstance(result, str):
        return result  # The polished report is already formatted
    
    # Handle old dictionary format (backward compatibility)
    if isinstance(result, dict):
        formatted = f"""
## 🎯 Search Results for: "{result.get('search_goal', 'N/A')}"

### 📈 Summary Statistics
- **Total Iterations:** {result.get('total_iterations', 0)}
- **Total Learnings:** {result.get('total_learnings', 0)}
- **URLs Scraped:** {result.get('total_urls_scraped', 0)}

### 🔍 Search Strategies Used
"""
        
        strategies = result.get('search_strategies_used', [])
        for i, strategy_list in enumerate(strategies, 1):
            formatted += f"\n**Iteration {i}:**\n"
            for j, strategy in enumerate(strategy_list, 1):
                formatted += f"  {j}. {strategy}\n"
        
        formatted += f"\n### 📚 Key Learnings\n\n{result.get('formatted_learnings', 'No learnings found.')}"
        
        # Add reflections if available
        reflections = result.get('reflections', [])
        if reflections:
            formatted += "\n### 🤔 AI Reflections\n"
            for i, reflection in enumerate(reflections, 1):
                formatted += f"\n**Iteration {i} Analysis:**\n{reflection}\n"
        
        return formatted
    
    # Fallback for unexpected format
    return str(result)

def display_planning_messages(history_manager, container):
    """
    Display planning agent messages in real-time with proper formatting.
    
    Args:
        history_manager: MessageHistoryManager instance
        container: Streamlit container for displaying messages
    """
    if not history_manager:
        return
        
    # Get recent planning messages
    planning_messages = history_manager.get_planning_messages()
    
    with container:
        for message in planning_messages:
            msg_type = message["type"]
            content = message["content"]
            
            if msg_type == "analysis":
                st.info(f"🔍 **Planning Agent**: {content}")
            
            elif msg_type == "feedback":
                st.warning(f"💭 **Planning Agent**: {content}")
            
            elif msg_type == "question":
                st.error(f"❓ **Planning Agent**: {content}")
            
            elif msg_type == "user_response":
                st.success(f"👤 **You**: {content}")
            
            elif msg_type == "goal_confirmed":
                st.success(f"✅ **Planning Agent**: {content}")
            
            elif msg_type == "strategy_start":
                st.info(f"🎯 **Planning Agent**: {content}")
            
            elif msg_type == "strategy":
                st.info(f"🎯 **Planning Agent**: {content}")
            
            elif msg_type == "complete":
                st.success(f"✅ **Planning Agent**: {content}")
            
            elif msg_type == "warning":
                st.warning(f"⚠️ **Planning Agent**: {content}")

def handle_clarification_input(state, container):
    """
    Handle user clarification input during the interactive planning phase.
    
    Args:
        state: Current workflow state
        container: Streamlit container for input elements
        
    Returns:
        bool: True if clarification was submitted, False otherwise
    """
    if not state.get("awaiting_user_response"):
        return False
    
    with container:
        st.markdown("---")
        st.markdown("### 🤔 **The Planning Agent Needs Your Help!**")
        
        # Show pending questions if available
        if "pending_questions" in state and state["pending_questions"]:
            st.markdown("**Please help me understand your search goal better:**")
            for i, question in enumerate(state["pending_questions"]):
                st.markdown(f"**{i+1}.** {question}")
        
        # User input for clarification
        clarification_key = f"clarification_round_{state.get('clarification_round', 0)}"
        clarification = st.text_area(
            "Your clarification:",
            key=clarification_key,
            height=100,
            placeholder="Please provide more details about what you're looking for..."
        )
        
        col1, col2 = st.columns([1, 4])
        
        with col1:
            submit_clarification = st.button(
                "Submit", 
                key=f"submit_{clarification_key}",
                type="primary"
            )
        
        with col2:
            if st.button(f"Skip Clarification", key=f"skip_{clarification_key}"):
                # User wants to skip clarification - use original goal
                return "skip"
        
        if submit_clarification:
            if clarification.strip():
                return clarification.strip()
            else:
                st.error("Please provide a clarification response before submitting.")
                return False
    
    return False

def run_interactive_workflow(search_goal, search_type, config, progress_container, messages_container, selected_models=None):
    """
    Run the workflow with interactive clarification support.
    
    Args:
        search_goal: Initial search goal
        search_type: Type of search (fast, normal, etc.)
        config: Search configuration
        progress_container: Container for progress updates
        messages_container: Container for planning messages
        selected_models: Dictionary of user-selected LLM models
        
    Returns:
        Final workflow result or None if still in clarification phase
    """
    # Initialize state if not exists
    if "workflow_state" not in st.session_state:
        def progress_callback(update_type: str, content: str):
            """Enhanced progress callback with message history integration"""
            with progress_container:
                st.write(f"[{update_type}] {content}")
        
        from graph import initialize_state
        # Get chat history from session state
        chat_history = st.session_state.get("messages", [])
        st.session_state.workflow_state = initialize_state(
            search_goal=search_goal,
            agent_search_type=search_type,
            config=config,
            progress_callback=progress_callback,
            selected_models=selected_models,
            chat_history=chat_history
        )
        st.session_state.workflow_step = "planning"
    
    current_state = st.session_state.workflow_state
    
    # Display planning messages
    if "history_manager" in current_state:
        display_planning_messages(current_state["history_manager"], messages_container)
    
    # Handle clarification if needed
    if current_state.get("awaiting_user_response"):
        clarification_response = handle_clarification_input(current_state, messages_container)
        
        if clarification_response == "skip":
            # User wants to skip clarification
            current_state["awaiting_user_response"] = False
            current_state["clarification_needed"] = False
            current_state["user_clarification_response"] = "User chose to skip clarification"
            st.rerun()
            
        elif clarification_response:
            # User provided clarification
            current_state["user_clarification_response"] = clarification_response
            
            print(f"DEBUG APP: Before workflow - search_goal: '{current_state.get('search_goal')}', clarification: '{clarification_response}'")
            
            # Continue workflow with clarification
            with st.spinner("Processing your clarification..."):
                from graph import search_workflow
                result = search_workflow.invoke(current_state)
                st.session_state.workflow_state = result
                
                print(f"DEBUG APP: After workflow - result search_goal: '{result.get('search_goal')}', session search_goal: '{st.session_state.workflow_state.get('search_goal')}'")
            
            st.rerun()
        
        # Still waiting for user input
        return None
    
    # If no clarification needed, run the full workflow
    if not current_state.get("clarification_needed"):
        with st.spinner("Running search workflow..."):
            from graph import search_workflow
            result = search_workflow.invoke(current_state)
            
            # Only clear workflow state if we got final results (not if still need clarification)
            if result and result.get("final_result"):
                final_result = result["final_result"]
                # Only clear if we have actual results, not if still asking for clarification
                if not (isinstance(final_result, dict) and final_result.get("status") == "clarification_needed"):
                    if "workflow_state" in st.session_state:
                        del st.session_state.workflow_state
                    if "workflow_step" in st.session_state:
                        del st.session_state.workflow_step
            
            return result
    
    # If clarification needed, keep the workflow state alive and return None
    # This ensures the workflow state persists for the next user input
    return None

def main():
    """Main Streamlit application."""
    init_session_state()
    
    # Header
    st.title("🔍 Objective Search Agent")
    st.markdown("*Powered by LangGraph, WaterCrawl, and LiteLLM*")
    
    # Sidebar configuration
    st.sidebar.title("⚙️ Configuration")
    st.sidebar.markdown("---")
    
    # Search type selection with better spacing
    st.sidebar.subheader("🚀 Search Configuration")
    search_type = st.sidebar.selectbox(
        "Search Type",
        ["fast", "normal", "extensive", "custom"],
        index=0,
        help="🚀 Fast: Quick search with basic filtering (2 iterations max)\n⚡ Normal: Balanced search with LLM filtering (4 iterations max)\n🔬 Extensive: Comprehensive search with deep analysis (10 iterations max)\n⚙️ Custom: Customizable parameters for specific needs"
    )
    
    # Custom configuration if selected
    custom_overrides = None
    if search_type == "custom":
        custom_overrides = get_custom_config()
    
    # Search parameters with better spacing
    st.sidebar.markdown("")
    st.sidebar.subheader("🌍 Search Parameters")
    
    col1, col2 = st.sidebar.columns(2)
    with col1:
        language = st.selectbox(
            "Language", 
            [None, "en", "fr", "es", "de", "it", "pt", "ru", "ja", "ko", "zh"],
            index=0,
            help="Filter results by language"
        )
    
    with col2:
        country = st.selectbox(
            "Country",
            [None, "us", "uk", "ca", "au", "fr", "de", "it", "es", "jp", "kr", "cn"],
            index=0,
            help="Filter results by country"
        )
    
    time_range = st.sidebar.selectbox(
        "Time Range",
        ["any", "hour", "day", "week", "month", "year"],
        index=0,
        help="Filter results by recency"
    )
    
    # API Key check
    st.sidebar.subheader("🔑 API Configuration")
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Check if API keys are already in environment
    env_watercrawl_key = os.getenv("WATERCRAWL_API_KEY")
    env_openai_key = os.getenv("OPENAI_API_KEY")
    env_anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    env_deepseek_key = os.getenv("DEEPSEEK_API_KEY")
    
    # Show status of API keys with smaller font
    if env_watercrawl_key:
        st.sidebar.markdown('<small style="color: green;">✅ WaterCrawl API Key loaded from .env</small>', unsafe_allow_html=True)
    else:
        st.sidebar.markdown('<small style="color: orange;">⚠️ WaterCrawl API Key not found in .env</small>', unsafe_allow_html=True)
    
    if env_openai_key:
        st.sidebar.markdown('<small style="color: green;">✅ OpenAI API Key loaded from .env</small>', unsafe_allow_html=True)
    else:
        st.sidebar.markdown('<small style="color: orange;">⚠️ OpenAI API Key not found in .env</small>', unsafe_allow_html=True)
    
    if env_anthropic_key:
        st.sidebar.markdown('<small style="color: green;">✅ Anthropic API Key loaded from .env</small>', unsafe_allow_html=True)
    else:
        st.sidebar.markdown('<small style="color: orange;">⚠️ Anthropic API Key not found in .env</small>', unsafe_allow_html=True)
    
    if env_deepseek_key:
        st.sidebar.markdown('<small style="color: green;">✅ DeepSeek API Key loaded from .env</small>', unsafe_allow_html=True)
    else:
        st.sidebar.markdown('<small style="color: orange;">⚠️ DeepSeek API Key not found in .env</small>', unsafe_allow_html=True)
    
    # Only show input fields if keys are missing from environment
    watercrawl_key = None
    openai_key = None
    anthropic_key = None
    deepseek_key = None
    
    if not env_watercrawl_key:
        watercrawl_key = st.sidebar.text_input(
            "WaterCrawl API Key", 
            type="password",
            help="Enter your WaterCrawl API key"
        )
    
    if not env_openai_key:
        openai_key = st.sidebar.text_input(
            "OpenAI API Key", 
            type="password",
            help="Enter your OpenAI API key"
        )
    
    if not env_anthropic_key:
        anthropic_key = st.sidebar.text_input(
            "Anthropic API Key", 
            type="password",
            help="Enter your Anthropic API key"
        )
    
    if not env_deepseek_key:
        deepseek_key = st.sidebar.text_input(
            "DeepSeek API Key", 
            type="password",
            help="Enter your DeepSeek API key"
        )
    
    # Set environment variables if provided via UI
    if watercrawl_key:
        os.environ["WATERCRAWL_API_KEY"] = watercrawl_key
    if openai_key:
        os.environ["OPENAI_API_KEY"] = openai_key
    if anthropic_key:
        os.environ["ANTHROPIC_API_KEY"] = anthropic_key
    if deepseek_key:
        os.environ["DEEPSEEK_API_KEY"] = deepseek_key
    
    # Final check - determine if we have all required keys
    has_watercrawl = bool(env_watercrawl_key or watercrawl_key)
    has_openai = bool(env_openai_key or openai_key)
    has_anthropic = bool(env_anthropic_key or anthropic_key)
    has_deepseek = bool(env_deepseek_key or deepseek_key)
    
    # LLM Model Selection with better organization
    st.sidebar.markdown("")
    st.sidebar.subheader("🤖 LLM Model Selection")
    
    # Import supported models
    from configs import ALL_MODELS, DEFAULT_MODEL_SELECTIONS
    
    # Create dropdowns for each model type with better spacing
    selected_models = {}
    
    model_types = {
        "planning": "🎯 Planning",
        "filtering": "🔍 Filtering", 
        "summary": "📝 Summary",
        "reflection": "🤔 Reflection",
        "default": "⚙️ Default"
    }
    
    # Organize models in a more compact layout
    for model_type, display_name in model_types.items():
        selected_models[model_type] = st.sidebar.selectbox(
            display_name,
            options=ALL_MODELS,
            index=ALL_MODELS.index(DEFAULT_MODEL_SELECTIONS[model_type]) if DEFAULT_MODEL_SELECTIONS[model_type] in ALL_MODELS else 0,
            help=f"Select the LLM model to use for {model_type} tasks",
            key=f"model_{model_type}"
        )
    
    # Show selected models summary in a more compact format
    with st.sidebar.expander("📋 Model Summary", expanded=False):
        for model_type, model_name in selected_models.items():
            # Show just the model name without the full display name
            short_name = model_name.split('/')[-1] if '/' in model_name else model_name
            st.text(f"{model_types[model_type]}: {short_name}")
    
    # Main chat interface
    st.subheader("💬 Chat Interface")
    
    # Display chat history
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            if message["role"] == "assistant" and "result" in message:
                # Show search goal if available
                if "search_goal" in message:
                    st.info(f"🎯 **Search Goal:** {message['search_goal']}")
                st.markdown(message["content"])
            else:
                st.write(message["content"])
    
    # User input
    if prompt := st.chat_input("What would you like to search for?", disabled=st.session_state.search_running):
        # Add user message to chat
        st.session_state.messages.append({"role": "user", "content": prompt})
        
        with st.chat_message("user"):
            st.write(prompt)
        
        # Check if API keys are available (from .env or sidebar)
        if not has_watercrawl or not has_openai:
            with st.chat_message("assistant"):
                missing_keys = []
                if not has_watercrawl:
                    missing_keys.append("WaterCrawl")
                if not has_openai:
                    missing_keys.append("OpenAI")
                st.error(f"Missing API keys: {', '.join(missing_keys)}. Please add them to your .env file or enter them in the sidebar.")
            return
        
        # Use the new persistent workflow handler
        with st.chat_message("assistant"):
            st.session_state.search_running = True
            
            try:
                # Show progress containers
                progress_placeholder = st.empty()
                
                # Create progress display area
                progress_container = st.container()
                with progress_container:
                    st.markdown("---")
                    st.markdown("### 🔍 **Search Progress**")
                    progress_expander = st.expander("📊 Real-time Search Progress", expanded=True)
                    
                # Initialize progress tracking in session state
                if 'progress_logs' not in st.session_state:
                    st.session_state.progress_logs = []
                if 'current_iteration' not in st.session_state:
                    st.session_state.current_iteration = 0
                if 'total_learnings' not in st.session_state:
                    st.session_state.total_learnings = 0
                
                messages_placeholder = st.empty()
                
                # Get configuration
                config = get_config(search_type, custom_overrides)
                
                # Update search parameters
                if language or country or time_range != "any":
                    config["search_params"].update({
                        "language": language,
                        "country": country,
                        "time_range": time_range
                    })
                
                # Use the new persistent workflow handler
                result = handle_user_message_with_persistent_workflow(
                    prompt=prompt,
                    search_type=search_type,
                    config=config,
                    progress_placeholder=progress_placeholder,
                    messages_placeholder=messages_placeholder,
                    progress_expander=progress_expander,
                    selected_models=selected_models
                )
                
                # Handle the result if it's not a conversational response
                if result is not None:
                    # Display the current search goal using the single source of truth
                    current_search_goal = get_current_search_goal()
                    st.info(f"🎯 **Search Goal:** {current_search_goal}")
                    
                    # Display results
                    if result and "final_result" in result:
                        final_result = result["final_result"]
                        
                        # Check if final_result is a dictionary (clarification case) or string (normal case)
                        if isinstance(final_result, dict) and final_result.get("status") == "clarification_needed":
                            # Handle clarification needed case
                            clarification_message = final_result.get("message", "Please provide more specific details about your search goal.")
                            
                            # Display clarification request in a friendly way
                            st.info("🤔 **I need a bit more information to help you better!**")
                            st.markdown(clarification_message)
                            
                            # Add to chat history
                            st.session_state.messages.append({
                                "role": "assistant", 
                                "content": f"🤔 **I need a bit more information to help you better!**\n\n{clarification_message}",
                                "result": final_result
                            })
                            
                        else:
                            # Normal search results - final_result is now a polished report string
                            if isinstance(final_result, str):
                                # Display the polished report directly
                                st.markdown(final_result)
                                
                                # Add to chat history
                                st.session_state.messages.append({
                                    "role": "assistant", 
                                    "content": final_result,
                                    "result": final_result,
                                    "search_goal": current_search_goal
                                })
                            else:
                                # Fallback for old dictionary format (backward compatibility)
                                formatted_result = format_final_result(final_result)
                                st.markdown(formatted_result)
                                
                                # Add to chat history
                                st.session_state.messages.append({
                                    "role": "assistant", 
                                    "content": formatted_result,
                                    "result": final_result,
                                    "search_goal": current_search_goal
                                })
                            
                            # Success message - extract stats from result state if available
                            total_learnings = len(result.get('global_learnings', []))
                            total_iterations = result.get('iteration', 1)
                            st.success(f"✅ Search completed! Found {total_learnings} key learnings across {total_iterations} iterations.")
                        
                        # Store result in session state
                        st.session_state.current_result = final_result
                        
                    else:
                        st.error("❌ Search failed. Please check your API keys and try again.")
                        
            except Exception as e:
                st.error(f"❌ An error occurred: {str(e)}")
                log_event(f"Streamlit error: {str(e)}", "error")
            
            finally:
                st.session_state.search_running = False
    
    # Download results button
    if st.session_state.current_result:
        st.sidebar.subheader("📥 Export Results")
        
        # JSON download
        import json
        result_json = json.dumps(st.session_state.current_result, indent=2, default=str)
        st.sidebar.download_button(
            label="Download JSON",
            data=result_json,
            file_name=f"search_results_{int(time.time())}.json",
            mime="application/json"
        )
        
        # Text download
        formatted_text = format_final_result(st.session_state.current_result)
        st.sidebar.download_button(
            label="Download Text",
            data=formatted_text,
            file_name=f"search_results_{int(time.time())}.txt",
            mime="text/plain"
        )

if __name__ == "__main__":
    main()
