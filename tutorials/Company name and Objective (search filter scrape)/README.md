## 🚀 Objective-Driven Web Crawling with WaterCrawl, LiteLLM, and Rank-BM25

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.8%2B-brightgreen" alt="Python Version" />
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/Status-Active-green" alt="Status" />
</div>

### 🌟 Introduction

In the fast-paced digital era, harnessing the power of Generative AI and Large Language Models (LLMs) relies on accessing and analyzing accurate web data swiftly. Imagine inputting a website URL and a specific objective—such as "Find pricing details" or "Locate API authentication methods"—and receiving a structured, detailed response almost instantly. This is the vision behind **ObjectiveCrawler**, a tool designed to transform how we extract meaningful insights from the web.

This project implements a sophisticated goal-oriented web crawler. It uses **WaterCrawl** for comprehensive search and content scraping, and integrates with **LiteLLM** to leverage various LLMs for intelligent content analysis and strategy generation. The tool autonomously navigates websites to fulfill user-defined objectives with precision, whether you're targeting a specific domain or searching broadly for company information.

> **Use Case**: Simply provide a company name or a URL (even a base URL of a website) along with an objective (what you want to find), and the tool will search for relevant pages, filter URLs using a two-stage process (BM25 for keyword relevance and LLMs for semantic ranking), scrape the content of nominated pages, and analyze it using tailored LLMs to deliver the information you seek.

This tool supports multiple LLM providers—including DeepSeek, Claude 4, GPT-4.1, and the advanced O3 reasoning model—allowing for customizable AI performance across different tasks like search strategy generation, URL ranking, content analysis, and result synthesis.

**Motivation**: In an era where data is the new currency, manually searching through websites for specific information is inefficient. ObjectiveCrawler was born out of the need to automate and optimize web data extraction for businesses, researchers, and developers who require precise, real-time insights without the hassle of manual browsing or complex scripting.

### 🎯 High-Level Workflow

Here's a detailed, yet easy-to-follow diagram explaining the process:

```
👤 User Input (Company Name or Website URL + Objective)
        ⬇️
 🧠 Generate Diverse Search Strategies via LiteLLM (Search LLM)
        ⬇️
🕸️ Fetch Search Results with WaterCrawl
        ⬇️
🔍 Filter & Rank Relevant URLs using Rank-BM25
        ⬇️
🔍 Refine Ranking of URLs using LiteLLM (Ranking LLM)
        ⬇️
📄 Scrape Content from Top URLs (WaterCrawl)
        ⬇️
🤖 Analyze Content for Relevance (Content Analysis with LLM)
        ⬇️
📌 Compile Results into Structured JSON Response (Reasoning with LLM)
        ⬇️
✅ Deliver Final Outcome with Fulfillment Status and References
```

> 📊 **For a detailed visual workflow diagram with comprehensive explanations, see [WORKFLOW_DIAGRAM.md](./WORKFLOW_DIAGRAM.md)**

### 📁 Project Structure

<div style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">

```
.
├── objective_crawler/
│   ├── __init__.py
│   ├── clients.py        # API client wrappers for WaterCrawl and LLM interactions
│   ├── config.py         # Configuration constants for models and search parameters
│   ├── core.py           # Core ObjectiveCrawler logic for workflow orchestration
│   ├── prompts.py        # Predefined prompts for LLM tasks
│   └── utils.py          # Helper functions for text processing and debugging
├── .env.example          # Example environment variables for API keys
├── main.py               # Main script entry point for running the crawler
├── requirements.txt      # Python dependencies
└── README.md             # This comprehensive guide
```

</div>

### 🔧 Requirements and Environment Setup

To effectively utilize ObjectiveCrawler, please follow these steps to set up the environment. This process ensures all dependencies are installed and API keys are configured correctly.

1. **Install Dependencies**:
   Ensure you have Python 3.8 or higher installed. Then, install the required packages:
   ```bash
   pip install -r requirements.txt
   ```
   This will install essential libraries like `litellm`, `rank-bm25`, `watercrawl-sdk`, and `python-dotenv`.

2. **Set Up Environment Variables**:
   - Copy the `.env.example` file to a new file named `.env`.
   - Open the `.env` file and fill in your API keys for WaterCrawl and the LLM providers you intend to use (e.g., OpenAI, Anthropic, DeepSeek). These keys are crucial for accessing the respective services.
   ```bash
   cp .env.example .env
   ```
   > **Note**: Keep your `.env` file secure and never commit it to version control to protect your API keys.

3. **Verify Setup**:
   After installation, you can verify that dependencies are correctly installed by running:
   ```bash
   python -c "import litellm, rank_bm25, watercrawl_sdk; print('Setup successful!')"
   ```
   If no errors appear, your environment is ready.

### 📖 Detailed Overview of Core Technologies

#### 🌊 WaterCrawl: Simplified Web search and Scraping

WaterCrawl provides robust web search and scraping capabilities, from extracting content from searching the entire web,to scraping single pages to mapping entire websites through deep, structured crawls. Its real-time data retrieval and ease of integration make it a cornerstone for AI-driven content ingestion in ObjectiveCrawler. With WaterCrawl, users can configure search depth, filter results by language or country, and focus on main content for efficient processing.

#### 🧩 LiteLLM: Unified LLM Integration

LiteLLM offers a seamless interface to interact with multiple advanced LLM providers, enabling effortless switching between models like GPT-4.1, Claude 4, and DeepSeek. This flexibility enhances reliability, cost management, and performance optimization by allowing specific models for distinct tasks such as search strategy generation, URL ranking, content analysis, and result synthesis. ObjectiveCrawler leverages this to assign cost-effective models for simpler tasks and powerful models for complex reasoning.

#### 🎯 Rank-BM25: Precision Keyword Retrieval

Rank-BM25 is a powerful algorithm for keyword-based URL filtering and ranking. It ensures precise initial filtering of URLs by matching search strategies, significantly boosting the accuracy of results before semantic analysis by LLMs, creating a hybrid retrieval system that combines keyword precision with contextual understanding. This dual approach minimizes irrelevant results and maximizes efficiency.

### 🛠️ In-depth Code Explanation

ObjectiveCrawler operates through a meticulously designed Python solution, detailed step-by-step below to provide a thorough understanding of its components and workflow. Whether you're a developer looking to extend the tool or a user wanting to grasp its inner workings, this section is your guide.

#### 🗂️ Key Classes and Functions

<div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; border: 1px solid #ced4da; margin-bottom: 15px;">

- **`ObjectiveCrawler`**: The central orchestrator that manages the entire web search website crawling and analysis workflow, from URL collection to final result generation. It supports configurable LLM selection for different tasks.
- **`WaterCrawler`**: Handles interactions with the WaterCrawl API, performing tasks like sitemap extraction, search operations, and content scraping with configurable options for depth and focus.
- **`LLMClient`**: A provider-agnostic wrapper for LLM interactions via LiteLLM, supporting diverse models for tailored performance in search, ranking, analysis, and reasoning tasks.

</div>

#### 🔍 Detailed Workflow Steps

1. **🌐 Initialization & User Input**  
   The journey begins with user input. Provide a website URL or company name along with a specific objective (e.g., "Find pricing information"). Command-line arguments allow customization of parameters like the number of search strategies, top URLs to analyze, and specific LLMs for each task. For example, use a lightweight model for search strategies and a robust model for final reasoning.
   - **Key Customization**: Use `--search-llm`, `--ranking-llm`, `--content-analysis-llm`, and `--reasoning-llm` to specify models.

2. **💡 Generation of Multiple Search Strategies (LiteLLM - Search LLM)**  
   A dedicated LLM generates diverse search queries in Google search format, tailored to the objective. These strategies include site-specific searches (e.g., `site:example.com pricing`), keyword combinations, and advanced operators to ensure comprehensive coverage of potential content.
   - **Behind the Scenes**: The tool parses these strategies into keywords and site filters for precise matching.

3. **📡 Data Source Acquisition (WaterCrawl)**  
   If a URL is provided, ObjectiveCrawler search the web using WaterCrawl to get candidate pages.  It performs a search via the WaterCrawl API with configurable depth (basic, advanced, ultimate), language, and country settings to gather candidate URLs. This step ensures a broad pool of potential sources.
   - **Tip**: Use `--search-depth advanced` for deeper searches when dealing with obscure company data.

4. **🔎 Initial URL Filtering and Ranking (Rank-BM25)**  
   Using the BM25 algorithm, URLs are filtered and ranked based on keyword relevance to the generated search strategies. This step efficiently narrows down a large set of URLs (potentially thousands) to a more manageable, relevant subset, focusing on keyword matches.
   - **Efficiency**: BM25 is lightning-fast for keyword ranking, ensuring scalability even with massive sitemaps.

5. **🔍 Contextual URL Ranking (LiteLLM - Ranking LLM)**  
   A specialized LLM further refines the filtered URLs by assessing their semantic relevance to the objective. This ensures the top URLs (default top 5, configurable via `--top-k`) are not just keyword matches but contextually aligned with the user's goal.
   - **Precision**: Semantic ranking catches nuances that keywords miss, like implied relevance.

6. **📥 Content Scraping (WaterCrawl)**  
   Content from the top-ranked URLs is scraped using WaterCrawl, focusing on main content in markdown format for efficient processing. Options to include links or exclude irrelevant HTML elements (like ads or navigation bars) enhance the quality of data extracted.
   - **Focus**: Emphasis on main content reduces noise for LLM analysis.

7. **🔬 Content Analysis and Extraction (LiteLLM - Content Analysis LLM)**  
   The scraped content of each URL is analyzed by a dedicated LLM to determine its relevance to the objective and extract specific information. Individual analysis results are stored in the output metadata for transparency and debugging, allowing users to trace how conclusions were drawn.
   - **Granularity**: Each page gets its own analysis, stored in `result['_metadata']['individual_analyses']`.

8. **📑 Results Compilation and Synthesis (LiteLLM - Reasoning LLM)**  
   A reasoning-focused LLM integrates analyses from multiple pages into a coherent, structured JSON response. It clearly indicates whether the objective was fulfilled, provides a comprehensive answer, and lists reference URLs for credibility and further exploration.
   - **Synthesis**: This step ties disparate findings into a unified narrative or dataset.

9. **📤 Output Delivery**  
   The final JSON output is delivered to the console, detailing the fulfillment status (`fulfilled: true/false`), the answer to the objective, and reference URLs. Additional metadata, such as pages analyzed and execution time, are logged for user insight, with `--debug` and `--verbose` modes available for detailed logging.
   - **Transparency**: Execution summaries provide metrics like time taken and URLs processed.

### 🧐 Why we have developed ObjectiveCrawler?

<div style="background-color: #fff3cd; padding: 10px; border-radius: 5px; border: 1px solid #ffeeba; margin-bottom: 15px;">

- **⚡ Efficiency**: Handles vast and complex website data quickly by leveraging WaterCrawl's rapid scraping and BM25's fast keyword ranking.
- **🔄 Flexibility**: Supports seamless switching among multiple LLM providers and models via LiteLLM, with command-line configurable options for each task (search, ranking, analysis, reasoning).
- **🎯 Precision**: Combines BM25's keyword accuracy with LLMs' semantic intelligence for superior result relevance, ensuring the most pertinent information is extracted.
- **🛠️ Customizability**: Allows users to tailor search depth, language, country, and model selection to optimize performance for specific needs or cost considerations.
- **📊 Transparency**: Offers detailed logging with debug and verbose modes to track every step, aiding in troubleshooting and understanding.

</div>

### 📌 Conclusion

By integrating WaterCrawl's robust scraping, LiteLLM's versatile LLM interactions, and Rank-BM25's precise filtering, **ObjectiveCrawler** offers a groundbreaking solution for web data extraction. Whether you're automating information retrieval for business intelligence, enhancing customer support with real-time data, or building AI agents for specific tasks, this tool provides a powerful, scalable, and precise approach to achieving your web data objectives. 🌟✨

**Get Started Today**: Dive into automated web data extraction with ObjectiveCrawler and turn the vast web into your personal database. From competitive analysis to academic research, the possibilities are endless!

### 🌟 Usage

Run the crawler from your terminal by providing a target URL or company name and your objective in quotes. Customize the process with various optional parameters to fine-tune performance and output.

<div style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; border: 1px solid #dee2e6; margin-bottom: 15px;">

**Syntax:**
```bash
python main.py <INPUT> "<OBJECTIVE>" [OPTIONS]
```

**Examples:**
```bash
# Find the REST authentication endpoint on a website with default settings
python main.py https://example.com "Find the REST authentication endpoint"

# Find pricing information with a different number of search strategies and top URLs
python main.py https://example.com "Find pricing information" --strategies 5 --top-k 7

# Use specific LLMs for different tasks with debug mode enabled for detailed logs
python main.py https://watercrawl.dev "Find rates or pricing" --top-k 10 --strategies 5 --search-llm gpt-4o-mini --ranking-llm anthropic/claude-3-haiku-20240307 --content-analysis-llm deepseek/deepseek-chat --reasoning-llm gpt-4.1 --debug

# Search for company information when input is not a URL, with advanced search depth
python main.py "Example Inc." "Find company information" --is-url False --search-depth advanced

# Enable verbose logging for detailed insights during execution
python main.py "Tesla" "Find information about stock value" --debug --search-llm "gpt-4.1" --ranking-llm "gpt-4.1-mini" --reasoning-llm "o3" --content-analysis-llm "gpt-4.1-mini"

# Adjust search parameters for language and country for localized results
python main.py https://example.de "Find support contacts" --search-language de --search-country de
```

</div>

The program will exit with a non-zero code if the objective cannot be fulfilled. Successful execution prints a compact JSON object containing the information that satisfies the user's objective, with additional execution summaries logged to the console for performance insights.

**Sample Output (JSON)**:
```json
{
  "fulfilled": true,
  "answer": "The pricing for Example Inc. starts at $9.99/month for the basic plan.",
  "references": ["https://example.com/pricing", "https://example.com/plans"],
  "_metadata": {
    "execution_time": 45.3,
    "pages_analyzed": 2,
    "individual_analyses": [...]
  }
}
```

### 🛠️ Troubleshooting and Tips

<div style="background-color: #f8d7da; color: #842029; padding: 10px; border-radius: 5px; border: 1px solid #f5c2c7; margin-bottom: 15px;">

- **API Key Issues**: Ensure your WaterCrawl and LLM provider API keys are correctly set in the `.env` file. Invalid or expired keys will cause authentication errors.
- **Rate Limits**: If you encounter rate limit errors, consider staggering your requests or using a different LLM provider with higher limits. Check provider documentation for limits.
- **No Results Found**: If the objective isn't fulfilled, try increasing `--top-k` to analyze more URLs or adjust `--strategies` for broader search coverage. Also, verify the input URL or company name is correct.
- **Performance Optimization**: For faster execution, use lighter models (e.g., `gpt-4o-mini`) for search and ranking, reserving powerful models (e.g., `gpt-4.1`) for reasoning. Adjust `--search-depth` to `basic` for quicker searches.
- **Debugging**: Use `--debug` to see detailed logs of each step, helping identify where failures occur (e.g., scraping issues, LLM errors).
- **Network Issues**: Ensure a stable internet connection as WaterCrawl requires online access for scraping and API calls.

</div>

**Need Help?**: If issues persist, consider checking the console logs with `--verbose` enabled or reaching out to the community for support. Common fixes and updates will be posted as the project evolves.

### Models

<div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px;">

<div style="flex: 1; min-width: 200px; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">

**Anthropic Models:**
- anthropic/claude-sonnet-4-20250514
- anthropic/claude-opus-4-20250514
- anthropic/claude-3-7-sonnet-20250219
- anthropic/claude-3-5-sonnet-20240620
- anthropic/claude-3-sonnet-20240229
- anthropic/claude-3-haiku-20240307
- anthropic/claude-3-opus-20240229

</div>

<div style="flex: 1; min-width: 200px; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">

**DeepSeek Models:**
- deepseek/deepseek-chat
- deepseek/deepseek-coder

</div>

<div style="flex: 1; min-width: 200px; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">

**OpenAI Models:**
- o4-mini
- o3
- o3-mini
- o1-mini
- o1-preview
- gpt-4.1
- gpt-4.1-mini
- gpt-4.1-nano
- gpt-4o
- gpt-4o-mini

</div>

</div>

### 🌐 Extending ObjectiveCrawler

ObjectiveCrawler is designed to be extensible. Developers can:
- **Add New LLM Providers**: Extend `LLMClient` to support additional providers by updating LiteLLM configurations.
- **Customize Prompts**: Modify prompts in `prompts.py` to adjust how LLMs interpret objectives or rank URLs.
- **Enhance Output Formats**: Alter the JSON structure in `core.py`’s `_generate_final_result` to support CSV, YAML, or other formats.
- **Integrate with Other Tools**: Pipe the JSON output to other scripts for further processing or visualization.

**Contribution**: If you have ideas for improvements or bug fixes, feel free to fork the repository, make changes, and submit a pull request. Community contributions are welcome!

<div align="center">
  <strong>Happy Crawling with ObjectiveCrawler! 🕷️✨</strong>
</div>