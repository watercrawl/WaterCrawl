# ────────────────────────── configuration & constants ────────────────────────── #
MODEL_NAME = "o4-mini"
DEFAULT_SEARCH_LLM = "o4-mini"
DEFAULT_RANKING_LLM = "o4-mini"
DEFAULT_CONTENT_ANALYSIS_LLM = "o4-mini"
DEFAULT_REASONING_LLM = "o4-mini"
CHAT_TEMPERATURE = 0.0
MAX_CONTENT_CHARS = 6000  # amount of scraped markdown passed back to GPT
DEFAULT_TOP_K = 5  # Increased from 3 for better coverage
DEFAULT_NUM_SEARCH_STRATEGIES = 3  # Default number of search strategies
DEFAULT_RELEVANCE_THRESHOLD = 0.3  # New default threshold
