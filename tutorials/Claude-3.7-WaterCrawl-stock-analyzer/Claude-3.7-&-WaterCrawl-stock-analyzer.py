#!/usr/bin/env python3
"""
Stock Analyzer using WaterCrawl and Claude 3.7
This script analyzes stocks by scraping financial data and using Claude 3.7 for analysis.
"""

import os
import json
import requests
import matplotlib.pyplot as plt
from dotenv import load_dotenv
from watercrawl import WaterCrawlAPIClient
import anthropic
from e2b_code_interpreter import Sandbox
from IPython.display import Image

# ANSI color codes
class Colors:
    CYAN = '\033[96m'
    YELLOW = '\033[93m'
    GREEN = '\033[92m'
    RED = '\033[91m'
    MAGENTA = '\033[95m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def load_environment():
    """Load environment variables and initialize API clients"""
    load_dotenv()
    
    # Retrieve API keys
    watercrawl_api_key = os.getenv("WATERCRAWL_API_KEY")
    anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
    e2b_api_key = os.getenv("E2B_API_KEY")
    tavily_api_key = os.getenv("TAVILY_API_KEY")
    
    if not all([watercrawl_api_key, anthropic_api_key, e2b_api_key, tavily_api_key]):
        raise ValueError("Missing required API keys in environment variables")
    
    # Initialize clients
    watercrawl_client = WaterCrawlAPIClient(api_key=watercrawl_api_key)
    claude_client = anthropic.Anthropic(api_key=anthropic_api_key)
    sandbox = Sandbox(api_key=e2b_api_key)
    
    return watercrawl_client, claude_client, sandbox, tavily_api_key

def find_relevant_stock_pages(stock_symbol, base_url, tavily_api_key):
    """
    Find relevant stock pages using Tavily Search API
    """
    print(f"Searching for stock: {stock_symbol}")
    print(f"Base URL: {base_url}")
    
    try:
        # Use Tavily Search API to find relevant URLs
        url = "https://api.tavily.com/search"
        payload = {
            "query": f"{stock_symbol} stock analysis {base_url}",
            "topic": "finance",
            "search_depth": "basic",
            "max_results": 5,
            "include_answer": False,
            "include_raw_content": False,
            "include_domains": [base_url],
            "exclude_domains": []
        }
        headers = {
            "Authorization": f"Bearer {tavily_api_key}",
            "Content-Type": "application/json"
        }
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        results = response.json()
        
        # Extract URLs from results
        urls = [item.get("url") for item in results.get("results", []) if item.get("url")]
        print(f"Found {len(urls)} relevant pages")
        return urls
    except Exception as e:
        print(f"Error finding stock pages: {str(e)}")
        return None

def analyze_stock_data(stock_pages, watercrawl_client, claude_client):
    """
    Analyze stock data using Claude 3.7
    """
    try:
        # Scrape the pages
        stock_contents = []
        for page_url in stock_pages[:5]:  # Limit to top 5 pages
            try:
                scrape_result = watercrawl_client.scrape_url(
                    url=page_url,
                    page_options={
                        "exclude_tags": ["nav", "footer"],
                        "include_tags": ["article", "main"],
                        "wait_time": 2000,
                        "include_html": False,
                        "only_main_content": True
                    }
                )
                stock_contents.append({
                    'url': page_url,
                    'content': scrape_result.get('content', '')
                })
            except Exception as e:
                print(f"Error scraping {page_url}: {str(e)}")
        
        if not stock_contents:
            print("No content was successfully scraped from any pages")
            return None
        
        # Prepare analysis prompt
        analyze_prompt = """
        Based on the following stock information, analyze and provide:
        1. Company overview
        2. Financial health indicators
        3. Growth potential
        4. Risk factors
        5. Investment recommendation (score out of 100)
        
        Return the analysis in JSON format:
        {
            "company_overview": "...",
            "financial_health": "...",
            "growth_potential": "...",
            "risk_factors": "...",
            "investment_score": 0-100
        }
        
        Stock Information:
        """
        
        for stock in stock_contents:
            analyze_prompt += f"\nURL: {stock['url']}\nContent: {stock['content']}\n"
        
        # Get analysis from Claude
        completion = claude_client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=1000,
            temperature=0,
            system="You are a financial analyst. Provide detailed, accurate analysis in valid JSON format.",
            messages=[
                {
                    "role": "user",
                    "content": analyze_prompt
                }
            ]
        )
        
        # Extract the response text
        response_text = completion.content[0].text
        
        # Try to find JSON in the response
        try:
            # Look for JSON content between curly braces
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end != 0:
                json_str = response_text[json_start:json_end]
                return json.loads(json_str)
            else:
                print("No JSON found in Claude's response")
                print("Response text:", response_text)
                return None
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON from Claude's response: {str(e)}")
            print("Response text:", response_text)
            return None
            
    except Exception as e:
        print(f"Error analyzing stock data: {str(e)}")
        return None

def visualize_analysis(analysis_result):
    """
    Visualize the stock analysis results
    """
    try:
        # Create a bar chart of the investment score
        plt.figure(figsize=(10, 6))
        plt.bar(['Investment Score'], [analysis_result['investment_score']], color='blue')
        plt.ylim(0, 100)
        plt.title('Stock Investment Analysis Score')
        plt.ylabel('Score (out of 100)')
        plt.savefig('stock_analysis.png')
        plt.close()
        
        # Print detailed analysis
        print("\nDetailed Analysis:")
        print(f"Company Overview: {analysis_result['company_overview']}")
        print(f"Financial Health: {analysis_result['financial_health']}")
        print(f"Growth Potential: {analysis_result['growth_potential']}")
        print(f"Risk Factors: {analysis_result['risk_factors']}")
        print(f"Investment Score: {analysis_result['investment_score']}/100")
        
        print("\nAnalysis visualization saved as 'stock_analysis.png'")
        
    except Exception as e:
        print(f"Error visualizing analysis: {str(e)}")

def analyze_stock(stock_symbol):
    """
    Main function to analyze a stock
    """
    try:
        # Load environment and initialize clients
        watercrawl_client, claude_client, sandbox, tavily_api_key = load_environment()
        
        # Define the base URL for stock information
        base_url = "https://finance.yahoo.com"
        
        # Find relevant pages
        stock_pages = find_relevant_stock_pages(stock_symbol, base_url, tavily_api_key)
        
        if not stock_pages:
            print("No relevant stock pages found.")
            return
        
        # Analyze the data
        analysis_result = analyze_stock_data(stock_pages, watercrawl_client, claude_client)
        
        if analysis_result:
            # Visualize the results
            visualize_analysis(analysis_result)
        else:
            print("Failed to analyze stock data.")
            
    except Exception as e:
        print(f"Error in stock analysis: {str(e)}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Analyze a stock using WaterCrawl and Claude 3.7')
    parser.add_argument('stock_symbol', help='Stock symbol to analyze (e.g., AAPL)')
    args = parser.parse_args()
    
    analyze_stock(args.stock_symbol)
