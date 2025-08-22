# ────────────────────────── configuration & constants ────────────────────────── #
DEFAULT_SEARCH_LLM = "o4-mini"
DEFAULT_RANKING_LLM = "o4-mini"
DEFAULT_CONTENT_ANALYSIS_LLM = "o4-mini"
DEFAULT_REASONING_LLM = "o4-mini"

CHAT_TEMPERATURE = 0.0
MAX_CONTENT_CHARS = 6000  # amount of scraped markdown passed back to GPT
DEFAULT_TOP_K = 5  # Number of final URLs to crawl and analyze
DEFAULT_NUM_SEARCH_STRATEGIES = 3  # Default number of search strategies
DEFAULT_RELEVANCE_THRESHOLD = 0.3  # New default threshold

# Search-related constants
DEFAULT_SEARCH_RESULT_LIMIT = 20  # 4 * DEFAULT_TOP_K (get more results initially for filtering)
DEFAULT_BM25_RESULT_COUNT = 10  # 2 * DEFAULT_TOP_K (intermediate filtering step)
DEFAULT_SEARCH_DEPTH = "basic"  # Options: "basic", "advanced", "ultimate"
DEFAULT_SEARCH_LANGUAGE = None  # None means auto-detect
DEFAULT_SEARCH_COUNTRY = None  # None means auto-detect
