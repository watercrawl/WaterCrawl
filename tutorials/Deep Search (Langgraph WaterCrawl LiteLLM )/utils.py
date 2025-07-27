"""
Utility functions for the search agent project.
Includes tokenization, deduplication, logging, and prompt templates.
"""

import re
from typing import List, Set, Dict, Any
from datetime import datetime

# ANSI color codes for terminal output
class Colors:
    # Basic colors
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    
    # Bright colors
    BRIGHT_RED = '\033[91;1m'
    BRIGHT_GREEN = '\033[92;1m'
    BRIGHT_YELLOW = '\033[93;1m'
    BRIGHT_BLUE = '\033[94;1m'
    BRIGHT_MAGENTA = '\033[95;1m'
    BRIGHT_CYAN = '\033[96;1m'
    
    # Background colors
    BG_RED = '\033[101m'
    BG_GREEN = '\033[102m'
    BG_YELLOW = '\033[103m'
    BG_BLUE = '\033[104m'
    BG_MAGENTA = '\033[105m'
    BG_CYAN = '\033[106m'
    
    # Reset
    RESET = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def colorize_text(text: str, color: str) -> str:
    """Add color to text for terminal output."""
    return f"{color}{text}{Colors.RESET}"

def log_search_strategies(iteration: int, strategies: List[str]) -> None:
    """Log search strategies with bright blue color."""
    print(f"\n{colorize_text('=' * 80, Colors.BRIGHT_BLUE)}")
    print(f"{colorize_text(f'🔍 ITERATION {iteration} - SEARCH STRATEGIES', Colors.BRIGHT_BLUE + Colors.BOLD)}")
    print(f"{colorize_text('=' * 80, Colors.BRIGHT_BLUE)}")
    
    for i, strategy in enumerate(strategies, 1):
        print(f"{colorize_text(f'Strategy {i}:', Colors.BRIGHT_BLUE)} {colorize_text(strategy, Colors.CYAN)}")
    print()

def log_search_results(strategy: str, results: List[Dict[str, Any]]) -> None:
    """Log search results with green color."""
    print(f"{colorize_text('📊 SEARCH RESULTS', Colors.BRIGHT_GREEN + Colors.BOLD)}")
    print(f"{colorize_text(f'Strategy: {strategy}', Colors.GREEN)}")
    print(f"{colorize_text(f'Raw Results Found: {len(results)}', Colors.BRIGHT_GREEN)}")
    
    if results:
        print(f"{colorize_text('Sample URLs:', Colors.GREEN)}")
        for i, result in enumerate(results[:3], 1):  # Show first 3 URLs
            url = result.get('url', 'No URL')
            title = result.get('title', 'No Title')[:60]
            print(f"  {colorize_text(f'{i}.', Colors.GREEN)} {colorize_text(url, Colors.CYAN)}")
            print(f"     {colorize_text(title, Colors.WHITE)}")
    else:
        print(f"{colorize_text('❌ No search results returned from WaterCrawl API!', Colors.RED)}")
        print(f"{colorize_text('   This means the search function failed to find any URLs for this strategy.', Colors.RED)}")
    print()

def log_bm25_filter(strategy: str, before_count: int, after_count: int, filtered_results: List[Dict[str, Any]]) -> None:
    """Log BM25 filtering results with yellow color."""
    print(f"{colorize_text('🔧 BM25 FILTERING', Colors.BRIGHT_YELLOW + Colors.BOLD)}")
    print(f"{colorize_text(f'Strategy: {strategy}', Colors.YELLOW)}")
    print(f"{colorize_text(f'Before BM25: {before_count} results', Colors.YELLOW)}")
    print(f"{colorize_text(f'After BM25: {after_count} results', Colors.BRIGHT_YELLOW)}")
    
    if filtered_results:
        print(f"{colorize_text('Top BM25 Results:', Colors.YELLOW)}")
        for i, result in enumerate(filtered_results[:3], 1):  # Show top 3
            url = result.get('url', 'No URL')
            title = result.get('title', 'No Title')[:60]
            score = result.get('bm25_score', 'N/A')
            print(f"  {colorize_text(f'{i}.', Colors.YELLOW)} {colorize_text(f'Score: {score:.3f}' if isinstance(score, (int, float)) else f'Score: {score}', Colors.BRIGHT_YELLOW)}")
            print(f"     {colorize_text(url, Colors.CYAN)}")
            print(f"     {colorize_text(title, Colors.WHITE)}")
    else:
        print(f"{colorize_text('❌ All results filtered out by BM25 relevance scoring!', Colors.RED)}")
        print(f"{colorize_text('   This means BM25 found no URLs relevant enough for the search query.', Colors.RED)}")
    print()

def log_llm_filter(strategy: str, before_count: int, after_count: int, filtered_results: List[Dict[str, Any]]) -> None:
    """Log LLM filtering results with magenta color."""
    print(f"{colorize_text('🤖 LLM FILTERING', Colors.BRIGHT_MAGENTA + Colors.BOLD)}")
    print(f"{colorize_text(f'Strategy: {strategy}', Colors.MAGENTA)}")
    print(f"{colorize_text(f'Before LLM: {before_count} results', Colors.MAGENTA)}")
    print(f"{colorize_text(f'After LLM: {after_count} results', Colors.BRIGHT_MAGENTA)}")
    
    if filtered_results:
        print(f"{colorize_text('Top LLM-Ranked Results:', Colors.MAGENTA)}")
        for i, result in enumerate(filtered_results[:3], 1):  # Show top 3
            url = result.get('url', 'No URL')
            title = result.get('title', 'No Title')[:60]
            relevance = result.get('llm_relevance_score', 'N/A')
            print(f"  {colorize_text(f'{i}.', Colors.MAGENTA)} {colorize_text(f'Relevance: {relevance}', Colors.BRIGHT_MAGENTA)}")
            print(f"     {colorize_text(url, Colors.CYAN)}")
            print(f"     {colorize_text(title, Colors.WHITE)}")
    else:
        print(f"{colorize_text('❌ All results filtered out by LLM relevance ranking!', Colors.RED)}")
        print(f"{colorize_text('   This means the LLM found no URLs relevant enough for the user goal.', Colors.RED)}")
    print()

def log_learnings(iteration: int, learnings: List[Dict[str, Any]]) -> None:
    """Log learnings with bright cyan color."""
    print(f"{colorize_text('🎓 LEARNINGS ACCUMULATED', Colors.BRIGHT_CYAN + Colors.BOLD)}")
    print(f"{colorize_text(f'Iteration {iteration} Learnings: {len(learnings)}', Colors.CYAN)}")
    
    if learnings:
        for i, learning in enumerate(learnings, 1):
            url = learning.get('url', 'No URL')
            title = learning.get('title', 'No Title')[:50]
            learning_text = learning.get('learning', 'No learning text')[:100]
            strategy = learning.get('search_strategy', 'No strategy')
            
            print(f"\n{colorize_text(f'Learning {i}:', Colors.BRIGHT_CYAN)}")
            print(f"  {colorize_text('Strategy:', Colors.CYAN)} {colorize_text(strategy, Colors.WHITE)}")
            print(f"  {colorize_text('Source:', Colors.CYAN)} {colorize_text(url, Colors.BLUE)}")
            print(f"  {colorize_text('Title:', Colors.CYAN)} {colorize_text(title, Colors.WHITE)}")
            print(f"  {colorize_text('Learning:', Colors.CYAN)} {colorize_text(learning_text + '...', Colors.GREEN)}")
    else:
        print(f"{colorize_text('❌ No learnings extracted from scraped content!', Colors.RED)}")
        print(f"{colorize_text('   This means the summarization step found no relevant information.', Colors.RED)}")
    print()

def log_iteration_summary(iteration: int, total_learnings: int) -> None:
    """Log iteration summary with bold white color."""
    print(f"{colorize_text('=' * 80, Colors.WHITE)}")
    print(f"{colorize_text(f'📋 ITERATION {iteration} SUMMARY', Colors.WHITE + Colors.BOLD)}")
    print(f"{colorize_text(f'Total Learnings So Far: {total_learnings}', Colors.BRIGHT_GREEN if total_learnings > 0 else Colors.RED)}")
    print(f"{colorize_text('=' * 80, Colors.WHITE)}")
    print()

def tokenize_text(text: str) -> List[str]:
    """
    Simple tokenization for BM25 (as per rank-bm25 documentation).
    No advanced preprocessing - just split on spaces.
    
    Args:
        text: Input text to tokenize
        
    Returns:
        List of tokens
    """
    if not text:
        return []
    return text.lower().split()

def dedup_urls(urls: List[str], scraped_urls: Set[str]) -> List[str]:
    """
    Remove URLs that have already been scraped.
    
    Args:
        urls: List of URLs to check
        scraped_urls: Set of already scraped URLs
        
    Returns:
        List of URLs not in scraped_urls
    """
    return [url for url in urls if url not in scraped_urls]

def log_event(message: str, event_type: str = "info") -> None:
    """
    Log an event message (can be extended for callbacks).
    
    Args:
        message: Message to log
        event_type: Type of event (info, warning, error)
    """
    print(f"[{event_type.upper()}] {message}")

def clean_text_for_llm(text: str) -> str:
    """
    Clean text for LLM processing by removing excessive whitespace and formatting.
    
    Args:
        text: Raw text to clean
        
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    # Limit length to avoid token limits
    if len(text) > 8000:
        text = text[:8000] + "..."
    
    return text

def extract_search_strategies_from_response(response: str) -> List[str]:
    """
    Extract search strategies from LLM response.
    Handles various formats and returns clean list.
    
    Args:
        response: LLM response containing search strategies
        
    Returns:
        List of search strategy strings
    """
    strategies = []
    
    # Check if response needs clarification
    if "CLARIFY:" in response.upper():
        return []
    
    # Try to extract numbered list
    lines = response.strip().split('\n')
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Remove numbering (1., 2., -, *, etc.)
        cleaned = re.sub(r'^[\d\.\-\*\s]+', '', line)
        if cleaned and len(cleaned) > 3:  # Minimum length check
            strategies.append(cleaned)
    
    # If no strategies found, try splitting by common delimiters
    if not strategies:
        potential_strategies = re.split(r'[,;\n]', response)
        for strategy in potential_strategies:
            strategy = strategy.strip()
            if strategy and len(strategy) > 3:
                strategies.append(strategy)
    
    return strategies[:10]  # Limit to reasonable number

def format_learnings_for_display(learnings: List[Dict[str, Any]]) -> str:
    """
    Format learnings for display in UI or final output.
    
    Args:
        learnings: List of learning dictionaries
        
    Returns:
        Formatted string representation
    """
    if not learnings:
        return "No learnings found."
    
    formatted = []
    for i, learning in enumerate(learnings, 1):
        formatted.append(f"{i}. {learning.get('learning', 'N/A')}")
        if learning.get('url'):
            formatted.append(f"   Source: {learning['url']}")
        formatted.append("")  # Empty line for spacing
    
    return "\n".join(formatted)

class MessageHistoryManager:
    """
    Enhanced message history manager for interactive clarification and real-time UI updates.
    Handles both session history and UI callback notifications.
    """
    
    def __init__(self):
        self.session_history = []  # Current session messages
        self.ui_callbacks = []     # Real-time UI update callbacks
        self.session_id = None
    
    def add_message(self, node: str, msg_type: str, content: str, 
                   metadata: dict = None, notify_ui: bool = True):
        """
        Add a message to the history and optionally notify UI callbacks.
        
        Args:
            node: The workflow node generating the message
            msg_type: Type of message (analysis, feedback, question, etc.)
            content: The message content
            metadata: Additional metadata for the message
            notify_ui: Whether to trigger UI callbacks
        """
        message = {
            "node": node,
            "type": msg_type,
            "content": content,
            "metadata": metadata or {},
            "timestamp": datetime.now().isoformat()
        }
        
        # Store in session history
        self.session_history.append(message)
        
        # Notify UI callbacks for real-time updates
        if notify_ui:
            for callback in self.ui_callbacks:
                try:
                    callback(message)
                except Exception as e:
                    print(f"UI callback error: {e}")
    
    def register_ui_callback(self, callback):
        """Register a callback function for real-time UI updates."""
        self.ui_callbacks.append(callback)
    
    def get_history(self, node=None, msg_type=None, limit=None):
        """
        Get filtered message history.
        
        Args:
            node: Filter by specific node
            msg_type: Filter by message type
            limit: Limit number of messages returned
        """
        history = self.session_history
        
        if node:
            history = [m for m in history if m["node"] == node]
        if msg_type:
            history = [m for m in history if m["type"] == msg_type]
        
        if limit:
            history = history[-limit:]
            
        return history
    
    def get_planning_messages(self):
        """Get all planning node messages for UI display."""
        return self.get_history(node="planning")
    
    def clear_session(self):
        """Clear current session history."""
        self.session_history = []

# Prompt templates
PROMPT_TEMPLATES = {
    "planning": """System: You are a search strategy planning agent. Analyze the user's goal and create a list of specific search phrases/queries that will help gather comprehensive information.

CRITICAL INSTRUCTIONS:
1. ANALYZE THE CHAT HISTORY: Look at previous user responses to understand what they're looking for
2. BUILD UPON CLARIFICATIONS: If the user has provided clarifications, incorporate them into a refined search goal
3. ONLY ask for clarification if the goal is truly unclear after considering all context
4. AVOID REPETITIVE QUESTIONS: Don't ask similar questions that have already been addressed

Chat History Context: {chat_history}
User Goal: {search_goal}
Previous Strategies: {previous_strategies}
Reflection Feedback: {reflection_feedback}

DECISION LOGIC:
- If the goal contains specific topics/concepts (even if broad), generate search strategies
- If the user has provided clarifications in chat history, use them to refine the goal
- Only use '<CLARIFY>' for truly vague single-word requests or completely unclear goals

Examples of goals that should generate strategies (NOT ask for clarification):
- "llm serving" → Generate strategies about LLM serving/deployment
- "llm serving deployment" → Generate strategies about LLM deployment practices
- "llm serving deployment best practices" → Generate strategies about LLM deployment best practices
- "machine learning" → Generate strategies about ML concepts
- "React components" → Generate strategies about React components

Examples that truly need clarification:
- Single unclear words: "help", "stuff", "things"
- Meta-questions: "what can you do", "how does this work"

INSTRUCTIONS:
1. If the goal is searchable (contains identifiable topics), generate 3-10 specific search phrases as a numbered list
2. If truly unclear after considering all context, respond with '<CLARIFY>' followed by a brief, specific question

Example response for searchable goal:
1. "LLM serving infrastructure deployment"
2. "large language model production serving"
3. "LLM deployment best practices"

Example clarification (only when truly needed):
<CLARIFY>I can help you search for information! What specific topic would you like me to research?""",
    "filtering": """System: You are an expert relevance ranking agent. Your mission is to evaluate search results and assign precise relevance scores based on how well they align with the user's goal and the search strategy that found them.

**EVALUATION CONTEXT:**
User Goal: {user_goal}
Search Strategy Used: {search_strategy}
Result #{current_index} of {total_results}

**CONTENT TO EVALUATE:**
{content}

**RANKING INSTRUCTIONS:**

1. **GOAL ALIGNMENT ANALYSIS**: Evaluate how directly this result addresses the user's specific goal. Consider:
   - Does the title indicate content that directly answers the user's question?
   - Does the description suggest comprehensive coverage of the topic?
   - Would this source likely contain actionable information for the goal?

2. **SEARCH STRATEGY RELEVANCE**: Consider why this specific search strategy led to this result:
   - Does this result align with what the search strategy was designed to find?
   - Is this the type of source that would provide the depth/breadth needed?

3. **SOURCE QUALITY INDICATORS**: Evaluate the likely quality and usefulness:
   - Authority and credibility signals in title/description
   - Specificity vs. generality (more specific to goal = higher score)
   - Recency and relevance indicators
   - Depth of coverage suggested by description

**SCORING SCALE (1-10):**
- **9-10**: Perfect match - directly addresses goal with high-quality, comprehensive content
- **7-8**: Highly relevant - strong alignment with goal, likely very useful
- **5-6**: Moderately relevant - partially addresses goal, some useful information expected
- **3-4**: Somewhat relevant - tangentially related, limited usefulness
- **1-2**: Minimally relevant - weak connection to goal, unlikely to be useful
- **0**: Completely irrelevant - no connection to goal

**RESPONSE FORMAT:**
SCORE: [numerical score 0-10]
REASONING: [2-3 sentences explaining the score based on goal alignment, search strategy relevance, and source quality]
KEY INSIGHTS: [brief summary of what valuable information this source likely contains for the goal, or 'IRRELEVANT' if score is 0]

**QUALITY STANDARDS:**
- Be precise with scoring - use the full 0-10 range
- Focus on the user's specific goal, not general topic relevance
- Consider the search strategy context when evaluating fit
- Prioritize sources that promise comprehensive, actionable information
- Don't be overly generous - reserve high scores for truly excellent matches""",

    "summarization": """System: You are an expert content summarization agent. Your mission is to create comprehensive, goal-focused summaries that extract maximum value from scraped content to help achieve the user's specific research objective.

**CONTEXT:**
User Goal: {user_goal}
Search Strategy Used: {search_strategy}
Source URL: {url}

**CONTENT TO ANALYZE:**
{content}

**COMPREHENSIVE SUMMARIZATION INSTRUCTIONS:**

1. **GOAL-CENTRIC ANALYSIS**: Analyze the content specifically through the lens of the user's goal. Every piece of information should be evaluated for its relevance to achieving this objective.

2. **STRATEGY-AWARE EXTRACTION**: Consider why this specific search strategy led to this URL. Extract information that aligns with the search strategy's intent and the user's goal.

3. **COMPREHENSIVE COVERAGE**: Create a thorough summary that includes:
   - Key facts, statistics, and data points directly relevant to the goal
   - Methodologies, processes, and best practices mentioned
   - Expert insights, opinions, and recommendations
   - Case studies, examples, and real-world applications
   - Current trends, developments, and future predictions
   - Technical details and implementation guidance
   - Challenges, limitations, and potential solutions
   - Comparative information and benchmarks

4. **STRUCTURED OUTPUT**: Organize your summary with clear sections when appropriate:
   - Main insights relevant to the goal
   - Supporting details and evidence
   - Actionable recommendations or next steps
   - Additional context or background information

5. **QUALITY STANDARDS**:
   - Be specific and detailed rather than vague or general
   - Include quantitative data (numbers, percentages, metrics) when available
   - Preserve important technical terminology and concepts
   - Maintain accuracy while being comprehensive
   - Focus on information that directly or indirectly supports the user's goal

6. **RELEVANCE THRESHOLD**: Only respond with 'NO_RELEVANT_INFO' if the content is completely unrelated to the user's goal (e.g., 404 errors, pure navigation content, or entirely different topics with no connection to the goal).

**SPECIAL CONSIDERATIONS FOR DIFFERENT DOMAINS:**
- **Technology/AI**: Include implementation details, performance metrics, scalability considerations, integration approaches
- **Business**: Include market analysis, competitive insights, ROI considerations, strategic implications
- **Research**: Include methodologies, findings, limitations, future research directions
- **How-to/Tutorials**: Include step-by-step processes, prerequisites, common pitfalls, success factors

**OUTPUT FORMAT**: Provide a comprehensive, well-structured summary that maximizes the learning value for the user's specific goal. Make every sentence count toward achieving their objective.""",

    "reflection": """System: You are a reflection and gap analysis agent. Analyze the accumulated learnings and determine if they comprehensively address the user's goal. Identify any information gaps and suggest new search strategies if needed.

User Goal: {user_goal}
Search Strategies Used: {search_strategies}
Current Learnings: {learnings}
Current Iteration: {current_iteration}
Max Iterations: {max_iteration}

Analyze the learnings and determine:
1. Are the learnings comprehensive enough to address the user's goal?
2. What information gaps exist?
3. What new search strategies would help fill these gaps?

IMPORTANT: Respond with a JSON object in exactly this format:
{{
  "conclusive": true/false,
  "gaps": "Your detailed gap analysis and suggestions here"
}}

Set "conclusive" to true if:
- The learnings comprehensively address the user's goal, OR
- Max iterations have been reached

Set "conclusive" to false if:
- Important information gaps remain and more iterations are available
""",
    "reflection_old": """System: You are a reflection and gap analysis agent. Analyze the accumulated learnings and determine if they comprehensively address the user's goal. Identify any information gaps and suggest new search strategies if needed.

User Goal: {user_goal}
Search Strategies Used: {search_strategies}
Current Learnings: {learnings}
Current Iteration: {current_iteration}
Max Iterations: {max_iteration}

Analyze the learnings and determine:
1. Are the learnings comprehensive enough to address the user's goal?
2. What information gaps exist?
3. What new search strategies would help fill these gaps?

If the learnings are conclusive OR max iterations reached, respond with 'CONCLUSIVE'.
Otherwise, provide gap analysis and suggest new search strategies."""
}

def get_prompt_template(template_name: str) -> str:
    """
    Get a prompt template by name.
    
    Args:
        template_name: Name of the template
        
    Returns:
        Prompt template string
    """
    return PROMPT_TEMPLATES.get(template_name, "")

def truncate_for_context(text: str, max_length: int = 4000) -> str:
    """
    Truncate text to fit within context limits.
    
    Args:
        text: Text to truncate
        max_length: Maximum length in characters
        
    Returns:
        Truncated text
    """
    if len(text) <= max_length:
        return text
    return text[:max_length] + "... [truncated]"
