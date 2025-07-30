"""
Configuration settings for the search agent project.
Defines search profiles and default parameters.
"""

import os
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class SearchProfile:
    """Configuration profile for different search types."""
    max_search_strategy: int
    search_result_limit: int
    llm_rank_flag: bool
    bm25_filter_limit: int
    llm_filter_limit: int
    max_iteration: int

# Predefined search profiles as specified in requirements
SEARCH_PROFILES = {
    "fast": SearchProfile(
        max_search_strategy=3,
        search_result_limit=10,
        llm_rank_flag=False,
        bm25_filter_limit=5,
        llm_filter_limit=3,
        max_iteration=2
    ),
    "normal": SearchProfile(
        max_search_strategy=5,
        search_result_limit=40,
        llm_rank_flag=True,
        bm25_filter_limit=25,
        llm_filter_limit=10,
        max_iteration=4
    ),
    "extensive": SearchProfile(
        max_search_strategy=10,
        search_result_limit=60,
        llm_rank_flag=True,
        bm25_filter_limit=40,
        llm_filter_limit=20,
        max_iteration=10
    ),
    "custom": SearchProfile(
        max_search_strategy=5,  # Default values for custom
        search_result_limit=40,
        llm_rank_flag=True,
        bm25_filter_limit=25,
        llm_filter_limit=10,
        max_iteration=4
    )
}

# Default search parameters for WaterCrawl
DEFAULT_SEARCH_PARAMS = {
    "language": None,
    "country": None,
    "time_range": "any",
    "depth": "advanced"
}

# Default page options for WaterCrawl scraping
DEFAULT_PAGE_OPTIONS = {
    "only_main_content": True,
    "include_links": True,
    "wait_time": 1500,
    "include_html": False,
    "timeout": 30000
}

def get_config(agent_search_type: str, custom_overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Get configuration for the specified search type.
    
    Args:
        agent_search_type: One of 'fast', 'normal', 'extensive', 'custom'
        custom_overrides: Optional overrides for custom configuration
        
    Returns:
        Configuration dictionary
    """
    if agent_search_type not in SEARCH_PROFILES:
        raise ValueError(f"Invalid search type: {agent_search_type}")
    
    profile = SEARCH_PROFILES[agent_search_type]
    config = {
        "max_search_strategy": profile.max_search_strategy,
        "search_result_limit": profile.search_result_limit,
        "llm_rank_flag": profile.llm_rank_flag,
        "bm25_filter_limit": profile.bm25_filter_limit,
        "llm_filter_limit": profile.llm_filter_limit,
        "max_iteration": profile.max_iteration,
        "search_params": DEFAULT_SEARCH_PARAMS.copy(),
        "page_options": DEFAULT_PAGE_OPTIONS.copy()
    }
    
    # Apply custom overrides if provided
    if agent_search_type == "custom" and custom_overrides:
        config.update(custom_overrides)
    
    return config


# Supported LLM Models for UI Selection
SUPPORTED_MODELS = {
    "Anthropic Models": [
        "anthropic/claude-sonnet-4-20250514",
        "anthropic/claude-opus-4-20250514",
        "anthropic/claude-3-7-sonnet-20250219",
        "anthropic/claude-3-5-sonnet-20240620",
        "anthropic/claude-3-sonnet-20240229",
        "anthropic/claude-3-haiku-20240307",
        "anthropic/claude-3-opus-20240229"
    ],
    "DeepSeek Models": [
        "deepseek/deepseek-chat",
        "deepseek/deepseek-coder"
    ],
    "OpenAI Models": [
        "o4-mini",
        "o3",
        "o3-mini",
        "o1-mini",
        "o1-preview",
        "gpt-4.1",
        "gpt-4.1-mini",
        "gpt-4.1-nano",
        "gpt-4o",
        "gpt-4o-mini"
    ]
}

# Flatten the models list for dropdown usage
ALL_MODELS = []
for category, models in SUPPORTED_MODELS.items():
    ALL_MODELS.extend(models)

# Default model selections
DEFAULT_MODEL_SELECTIONS = {
    "planning": "gpt-4o-mini",
    "filtering": "gpt-4o-mini",
    "summary": "gpt-4o-mini",
    "reflection": "gpt-4o-mini",
    "default": "gpt-4o-mini"
}


def get_model_for_task(task_type: str, selected_models: Dict[str, str] = None) -> str:
    """
    Get the selected model for a specific task type.
    
    Args:
        task_type: One of 'planning', 'filtering', 'summary', 'reflection', 'default'
        selected_models: Dictionary of user-selected models from UI
        
    Returns:
        Model name string
    """
    if selected_models and task_type in selected_models:
        return selected_models[task_type]
    
    # Fallback to environment variables or defaults
    env_var_map = {
        "planning": "PLANNING_MODEL",
        "filtering": "FILTERING_MODEL",
        "summary": "SUMMARY_MODEL",
        "reflection": "REFLECTION_MODEL",
        "default": "LITELLM_MODEL"
    }
    
    env_var = env_var_map.get(task_type, "LITELLM_MODEL")
    return os.getenv(env_var, DEFAULT_MODEL_SELECTIONS.get(task_type, "gpt-4o-mini"))
