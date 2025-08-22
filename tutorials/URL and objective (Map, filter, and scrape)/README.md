## 🚀 Web Data Extraction and Analysis with WaterCrawl (Map and Scrape functions), LiteLLM, and Rank-BM25

### 🌟 Introduction

In today's rapidly evolving digital landscape, the true power of Generative AI and Large Language Models (LLMs) hinges on the ability to swiftly access and interpret accurate, timely web data. Imagine asking your AI assistant a question like "Find pricing details" or "Locate API authentication methods" on any given website and instantly receiving a detailed, structured response. 

This project implements a goal-oriented web crawler that uses WaterCrawl for site mapping and Large Language Models (LLMs) for content analysis to fulfill a user-defined objective on a target website.

##### you give a URL (even a base URL of a website) and an objective (what you want to find on the website), then the tool will use WaterCrawl to map the whole website, find the relevant pages using two stage filtering (1st using BM25, then using LLMs to filter out the best URLs), scrape the content of the nominated  pages, and then use LLMs to analyze the content of the nominated pages to find the information you want.

This  tool leverages various  LLM providers—including DeepSeek, Claude 4, GPT-4.1, and the powerful O3 reasoning model—to autonomously navigate and analyze websites to fulfill specific user-defined objectives.

### 🎯 High-Level Workflow

Here's a detailed, yet easy-to-follow diagram explaining the process:

```
👤 User Input (Website URL + Objective)
        ⬇️
🕸️ Fetch Complete Sitemap with WaterCrawl map function
        ⬇️
🧠 Generate Diverse Search Strategies via LiteLLM
        ⬇️
🔍 Filter & Rank Relevant URLs using Rank-BM25
        ⬇️
🔍 Filter & Rank nominated URLs using LiteLLM
        ⬇️
📄 Scrape Content from Top URLs (WaterCrawl)
        ⬇️
🤖 Analyze and Extract Information (LiteLLM)
        ⬇️
📌 Compile Results into Structured Response (LiteLLM)
        ⬇️
✅ Provide Final Outcome and Detailed Report
```


📊 **For a detailed visual workflow diagram, see:** [WORKFLOW_DIAGRAM.md](./WORKFLOW_DIAGRAM.md)

### 📁 Project Structure

```
.
├── objective_crawler/
│   ├── __init__.py
│   ├── clients.py        # API client wrappers (WaterCrawl, LLM)
│   ├── config.py         # Configuration constants
│   ├── core.py           # Core ObjectiveCrawler logic
│   └── utils.py          # Helper functions and text processing
├── .env.example          # Example environment variables
├── main.py               # Main script entry point
├── requirements.txt      # Python dependencies
└── README.md             # This file
```


### 🔧 Requirements and Environment Setup

To effectively utilize this solution, please install the following essential packages:

1.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Set up environment variables**:
    - Copy the `.env.example` file to a new file named `.env`.
    - Open the `.env` file and fill in your API keys for WaterCrawl and the LLM providers you intend to use.
    ```bash
    cp .env.example .env
    ```

### 📖 Detailed Overview of Core Technologies

#### 🌊 WaterCrawl: Simplified Web Scraping

WaterCrawl delivers streamlined web crawling, from extracting single pages to managing deep, structured crawls. Its ease of use and powerful, real-time capabilities make it an essential tool for AI-driven content ingestion.

#### 🧩 LiteLLM: Unified LLM Integration

LiteLLM simplifies using multiple advanced LLM providers, allowing seamless switching between providers such as GPT-4.1, Claude 4, and DeepSeek through a single, intuitive API. This flexibility dramatically enhances reliability and cost management.

#### 🎯 Rank-BM25: Precision Keyword Retrieval

Rank-BM25 ensures precise and efficient keyword-based URL filtering and ranking, significantly boosting the accuracy of search results in hybrid retrieval systems by combining keyword precision with semantic context.

### 🛠️ In-depth Code Explanation

The provided Python solution operates through a clear, strategic approach, detailed step-by-step below:

#### 🗂️ Key Classes and Functions:

* **`ObjectiveCrawler`**: Oversees the entire website crawling and analysis workflow.
* **`WaterCrawler`**: Manages interactions with the WaterCrawl API, including scraping and sitemap extraction.
* **`LLMClient`**: Handles LLM interactions via LiteLLM for content analysis and strategy generation.

#### 🔍 Detailed Workflow Steps:

1. **🌐 Initialization & User Input**

   * Accepts user-defined website URL and specific objective.

2. **📡 Complete Sitemap Extraction (WaterCrawl)**

   * Fetches all website URLs rapidly and comprehensively.

3. **💡 Generation of Multiple Search Strategies (LiteLLM)**

   * Produces optimized search strategies, ensuring comprehensive URL filtering.

4. **🔎 URL Filtering and Ranking (Rank-BM25)**

   * Applies keyword-based retrieval techniques to efficiently filter and rank the relevance of URLs.

5. **📥 Content Scraping (WaterCrawl)**

   * Scrapes and prepares top-ranked URLs for deeper analysis.

6. **🔬 Content Analysis and Extraction (LiteLLM)**

   * Analyzes each URL's content to determine relevancy and extracts targeted information to answer the user's query precisely.

7. **📑 Results Compilation and Synthesis (LiteLLM)**

   * Integrates multiple page analyses into a coherent, structured response, clearly indicating whether the objective has been met and providing detailed context.

8. **📤 Output Delivery**

   * Delivers a structured JSON output, clearly showing whether the objective was successfully achieved along with comprehensive references.

### 🧐 Why Choose This Method?

* **⚡ Efficiency**: Quickly handles vast and complex website data.
* **🔄 Flexibility**: Allows seamless switching among multiple LLM providers.
* **🎯 Precision**: Combines semantic intelligence with keyword accuracy for superior results.

### 📌 Conclusion

By integrating WaterCrawl, LiteLLM, and Rank-BM25, this innovative Python solution significantly enhances how developers and businesses extract and leverage web data. Whether you're enhancing real-time customer support, automating information retrieval, or building sophisticated AI agents, this approach offers powerful, scalable, and precise web data solutions. 🌟✨



### 🌟 Usage

Run the crawler from your terminal by providing a target URL and your objective in quotes.

**Syntax:**
```bash
python main.py <URL> "<OBJECTIVE>" [OPTIONS]
```

**Examples:**
```bash
# Find the REST authentication endpoint on a website
python main.py https://example.com "Find the REST authentication endpoint" 
# Use a different number of search strategies
python main.py https://example.com "Find pricing information" --strategies 5

python main.py "https://watercrawl.dev/" "rates or pricing" --top-k 10 --strategies 5 --model anthropic/claude-sonnet-4-20250514  --debug
# Find pricing information with debug output enabled
python main.py https://example.com "Find pricing information" --debug
python main.py "https://watercrawl.dev/" "rates or pricing" --top-k 4 --strategies 5 --model deepseek/deepseek-chat --debug
```
The program will exit with a non-zero code if the objective cannot be fulfilled. Successful execution prints a compact JSON object containing the information that satisfies the user's objective.

### Models
Anthropic Models:
anthropic/claude-sonnet-4-20250514
anthropic/claude-opus-4-20250514
anthropic/claude-3-7-sonnet-20250219
anthropic/claude-3-5-sonnet-20240620
anthropic/claude-3-sonnet-20240229
anthropic/claude-3-haiku-20240307
anthropic/claude-3-opus-20240229

DeepSeek Models:
deepseek/deepseek-chat
deepseek/deepseek-coder

OpenAI Models:
o4-mini
o3
o3-mini
o1-mini
o1-preview
gpt-4.1
gpt-4.1-mini
gpt-4.1-nano
gpt-4o
gpt-4o-mini