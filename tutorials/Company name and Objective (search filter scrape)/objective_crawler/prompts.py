"""Prompt configurations for the ObjectiveCrawler class."""

# Prompt for generating search strategies in Google search format
SEARCH_STRATEGIES_PROMPT = """
Given this objective: "{objective}" for company or website: "{company_part}"

{hint}

Generate exactly {num_strategies} different search queries in Google search format as a JSON array of strings. Each query should target different aspects and use operators like site:, intitle:, AND, OR, etc.:

1. **Direct Objective Match**: The first query must be very close or exactly the same as the user's objective, combined with the company or website name, to directly reflect the user's input. Use minimal variation for this query.
2. **Specific Domain Search**: Use site: operator with specific keywords related to the objective.
3. **Combined Terms**: Use AND/OR operators with related terms.
4. **Title Search**: Use intitle: operator with company name or keywords (if more than 3 strategies are requested).

Examples:
- Objective: "Find pricing information" for "example.com" → 
  ["pricing information example.com", "site:example.com pricing", "price list AND (tariff OR rates)", "intitle:pricing example.com"]
- Objective: "Find API documentation" for "techcorp" → 
  ["api documentation techcorp", "site:techcorp.com api documentation", "api AND (developer OR docs)", "intitle:api techcorp"]
- Objective: "Find contact information" for "companyx" → 
  ["contact information companyx", "site:companyx.com contact", "contact AND (support OR help)", "intitle:contact companyx"]

Return only a JSON array of {num_strategies} strings, no other text.
"""

# Prompt for ranking URLs by relevance to the objective
URL_RANKING_PROMPT = """
Analyze these URLs and rank them by relevance to the objective for company/website: {company_or_url}. Consider:
- URL path segments and file names
- Common web patterns for this type of content
- Subdirectory structure indicating content organization
- Domain relevance to the target company/website

Objective: {objective}

URLs to rank:
{url_list_json}

Return exactly {top_k} JSON objects in order of relevance (most relevant first).
Each object must have: url, relevance_score (0.0-1.0), reason

Format as a JSON array only, no other text:
"""

# Prompt for analyzing webpage content for relevance to objective
CONTENT_ANALYSIS_PROMPT = """
Analyze this webpage content to determine if it contains information relevant to the user's objective.

OBJECTIVE: {objective}
SOURCE URL: {url}

CONTENT:
{content}

TASK:
Carefully analyze the content and provide a concise response:

1. If the content DOES contain information that answers the objective:
   - Summarize the relevant information in a brief, to-the-point manner.
   - Include only key details (numbers, dates, specifications, etc.) necessary for completeness.
   - Format as: "Relevant: [brief summary with key details]"

2. If the content does NOT contain relevant information:
   - Format as: "Irrelevant: No information related to the objective found."

Examples of good responses:
- "Relevant: Pricing is $29/month for Basic, $79/month for Pro, and $199/month for Enterprise, with a 14-day free trial."
- "Relevant: API authentication uses Bearer tokens via POST /api/v1/auth/login with email and password."
- "Irrelevant: No information related to the objective found."

Keep your response under 300 words for brevity while ensuring completeness.

Response:
"""

# Prompt for generating final consolidated result from page analyses
FINAL_RESULT_PROMPT = """
You are provided with analysis results from multiple web pages for a specific objective. 
Your task is to synthesize this information into a comprehensive final answer.

OBJECTIVE: {objective}

ANALYSIS RESULTS:
{analysis_results_json}

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
