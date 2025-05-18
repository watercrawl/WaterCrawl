#!/usr/bin/env python3
"""
Enhanced Stock Analyzer using WaterCrawl and Claude 3.7

This script provides comprehensive stock analysis by:
1. Searching for stock information using WaterCrawl
2. Scraping financial data from relevant pages
3. Analyzing the data using Claude 3.7
4. Generating visualizations and detailed reports

Dependencies:
- python-dotenv
- requests
- matplotlib
- watercrawl
- anthropic
- e2b-code-interpreter
"""

import os
import json
import logging
import argparse
from typing import Dict, List, Optional, Any
import matplotlib.pyplot as plt
from dotenv import load_dotenv
from watercrawl import WaterCrawlAPIClient
import anthropic
from e2b_code_interpreter import Sandbox
from IPython.display import Image, display

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class StockAnalyzer:
    """
    A class to analyze stocks using WaterCrawl and Claude 3.7.
    """
    
    def __init__(self):
        """Initialize the StockAnalyzer with required API clients."""
        self.watercrawl_client = None
        self.claude_client = None
        self.sandbox = None
        self.initialize_clients()
    
    def initialize_clients(self) -> None:
        """
        Initialize all required API clients using environment variables.
        
        Raises:
            ValueError: If any required API key is missing
        """
        load_dotenv()
        
        # Retrieve API keys
        api_keys = {
            'WATERCRAWL_API_KEY': os.getenv("WATERCRAWL_API_KEY"),
            'ANTHROPIC_API_KEY': os.getenv("ANTHROPIC_API_KEY"),
            'E2B_API_KEY': os.getenv("E2B_API_KEY")
        }
        
        missing_keys = [k for k, v in api_keys.items() if not v]
        if missing_keys:
            raise ValueError(f"Missing required API keys: {', '.join(missing_keys)}")
        
        # Initialize clients
        self.watercrawl_client = WaterCrawlAPIClient(api_key=api_keys['WATERCRAWL_API_KEY'])
        self.claude_client = anthropic.Anthropic(api_key=api_keys['ANTHROPIC_API_KEY'])
        self.sandbox = Sandbox(api_key=api_keys['E2B_API_KEY'])
        
        logger.info("Successfully initialized all API clients")
    
    def find_relevant_stock_pages(self, stock_symbol: str, base_url: str) -> Optional[List[str]]:
        """
        Find relevant stock pages using WaterCrawl Web Search.
        
        Args:
            stock_symbol: The stock symbol to search for (e.g., 'AAPL')
            base_url: The base URL to search within (e.g., 'https://finance.yahoo.com')
            
        Returns:
            List of relevant URLs or None if an error occurs
        """
        logger.info(f"Searching WaterCrawl for stock: {stock_symbol} on {base_url}")
        
        try:
            search = self.watercrawl_client.create_search_request(
                query=f"{stock_symbol} stock analysis site:{base_url}",
                search_options={
                    "depth": "basic",
                    "language": "en",
                    "country": "us",
                    "time_range": "month",
                    "search_type": "web"
                },
                result_limit=4,
                sync=True,
                download=True
            )
            
            urls = [hit.get("url") for hit in search.get('result', []) if hit.get("url")]
            
            logger.info(f"Found {len(urls)} relevant pages for {stock_symbol}")
            return urls
            
        except Exception as e:
            logger.error(f"Error finding stock pages with WaterCrawl: {str(e)}")
            return None
    
    def scrape_stock_data(self, urls: List[str]) -> List[Dict[str, str]]:
        """
        Scrape content from the given URLs using WaterCrawl.
        
        Args:
            urls: List of URLs to scrape
            
        Returns:
            List of dictionaries containing URL and scraped content
        """
        stock_contents = []
        
        for page_url in urls[:5]:  # Limit to top 5 pages
            try:
                logger.info(f"Scraping URL: {page_url}")
                scrape_result = self.watercrawl_client.scrape_url(
                    url=page_url,
                    page_options={
                        "exclude_tags": ["nav", "footer"],
                        "include_tags": ["article", "main"],
                        "wait_time": 1500,
                        "include_html": False,
                        "only_main_content": True
                    }
                )
                
                if scrape_result and 'result' in scrape_result and 'markdown' in scrape_result['result']:
                    stock_contents.append({
                        'url': page_url,
                        'content': scrape_result['result']['markdown']
                    })
                    logger.info(f"Successfully scraped content from {page_url}")
                
            except Exception as e:
                logger.error(f"Error scraping {page_url}: {str(e)}")
        
        return stock_contents
    
    def analyze_with_claude(self, stock_symbol: str, stock_contents: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
        """
        Analyze stock data using Claude 3.7.
        
        Args:
            stock_symbol: The stock symbol being analyzed
            stock_contents: List of dictionaries containing scraped content
            
        Returns:
            Dictionary containing analysis results or None if analysis fails
        """
        if not stock_contents:
            logger.warning("No content available for analysis")
            return None
        
        try:
            analyze_prompt = """
You are a financial analyst. Based on the following stock information, analyze and provide your analysis in VALID JSON format.

IMPORTANT:
1. Your ENTIRE response must be valid JSON that can be parsed by Python's json.loads() function
2. Use double quotes for JSON keys and string values, not single quotes
3. Ensure all strings are properly escaped
4. Do not include any text, explanations, or markdown before or after the JSON

The JSON structure must follow exactly this format:
{
  "company_overview": "Brief overview of the company",
  "financial_health": "Analysis of financial position",
  "growth_potential": "Assessment of growth opportunities",
  "risk_factors": "Key risks to consider",
  "investment_score": 75, // A number between 0-100
  "summary": "Brief summary of the analysis"
}

Stock Information:
"""
            # Add stock contents to the prompt
            for stock in stock_contents:
                analyze_prompt += f"\nURL: {stock['url']}\nContent: {stock['content']}\n"
            
            # Get analysis from Claude
            logger.info("Sending request to Claude API...")
            completion = self.claude_client.messages.create(
                model="claude-3-7-sonnet-20250219",
                max_tokens=1300,
                temperature=0,
                system="You are a financial analyst who ALWAYS returns responses in valid, parseable JSON format. Never include explanations or text outside the JSON object.",
                messages=[
                    {
                        "role": "user",
                        "content": analyze_prompt
                    }
                ]
            )
            
            response_text = completion.content[0].text
            
            # Extract JSON from response
            try:
                json_start = response_text.find('{')
                json_end = response_text.rfind('}') + 1
                if json_start != -1 and json_end != 0:
                    json_str = response_text[json_start:json_end]
                    result = json.loads(json_str)
                    
                    # Validate required fields
                    required_fields = [
                        'company_overview', 'financial_health',
                        'growth_potential', 'risk_factors',
                        'investment_score', 'summary'
                    ]
                    if all(field in result for field in required_fields):
                        logger.info("Successfully parsed analysis results")
                        return result
                    else:
                        logger.warning("Missing required fields in analysis result")
                
                logger.warning("No valid JSON found in Claude's response")
                logger.debug(f"Response text: {response_text}")
                return None
                
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing JSON from Claude's response: {str(e)}")
                logger.debug(f"Response text: {response_text}")
                return None
                
        except Exception as e:
            logger.error(f"Error during Claude analysis: {str(e)}")
            return None
    
    def generate_visualization(self, analysis_result: Dict[str, Any], output_path: str = 'stock_analysis.png') -> None:
        """
        Generate visualization of the analysis results.
        
        Args:
            analysis_result: Dictionary containing analysis results
            output_path: Path to save the visualization
        """
        try:
            # Create a simple figure with score and details
            plt.figure(figsize=(5, 5))
            plt.bar(['Investment Score'], [analysis_result['investment_score']], color='skyblue')
            plt.ylim(0, 100)
            plt.title('Stock Investment Analysis Score')
            plt.ylabel('Score (higher = better)')
            
            # Add score value on the bar
            plt.text(0, analysis_result['investment_score'] + 1, 
                    str(analysis_result['investment_score']), 
                    ha='center', va='bottom')
            
            plt.tight_layout()
            plt.savefig(output_path, dpi=300, bbox_inches='tight')
            plt.close()
            
            logger.info(f"Visualization saved to {output_path}")
            
            # Print detailed analysis
            print("\n **Detailed Insights**")
            print(f"- **Company Overview**: {analysis_result['company_overview']}")
            print(f"- **Financial Health**: {analysis_result['financial_health']}")
            print(f"- **Growth Potential**: {analysis_result['growth_potential']}")
            print(f"- **Risk Factors**: {analysis_result['risk_factors']}")
            print(f"- **Investment Score**: {analysis_result['investment_score']}/100")
            
            # Display the image in notebook if running in IPython
            try:
                display(Image(output_path))
            except:
                pass
            
        except Exception as e:
            logger.error(f"Error generating visualization: {str(e)}")
    
    def analyze(self, stock_symbol: str) -> Optional[Dict[str, Any]]:
        """
        Main method to analyze a stock.
        
        Args:
            stock_symbol: The stock symbol to analyze (e.g., 'AAPL')
            
        Returns:
            Dictionary containing analysis results or None if analysis fails
        """
        try:
            logger.info(f"Starting analysis for {stock_symbol}")
            
            # Define the base URL for stock information
            base_url = "https://finance.yahoo.com"
            
            # Find relevant pages
            stock_pages = self.find_relevant_stock_pages(stock_symbol, base_url)
            if not stock_pages:
                logger.warning("No relevant stock pages found")
                return None
            
            # Scrape content from the pages
            stock_contents = self.scrape_stock_data(stock_pages)
            if not stock_contents:
                logger.warning("No content was successfully scraped")
                return None
            
            # Analyze the data using Claude
            analysis_result = self.analyze_with_claude(stock_symbol, stock_contents)
            if not analysis_result:
                logger.warning("Failed to analyze stock data")
                return None
            
            # Generate visualization
            self.generate_visualization(analysis_result)
            
            # Print summary
            print("\n" + "="*50)
            print(f"ANALYSIS FOR {stock_symbol.upper()}")
            print("="*50)
            print(f"Investment Score: {analysis_result['investment_score']}/100\n")
            print("Summary:", analysis_result['summary'])
            print("\n" + "-"*50)
            print("Detailed Analysis:")
            print(f"Company Overview: {analysis_result['company_overview']}")
            print(f"\nFinancial Health: {analysis_result['financial_health']}")
            print(f"\nGrowth Potential: {analysis_result['growth_potential']}")
            print(f"\nRisk Factors: {analysis_result['risk_factors']}")
            print("\n" + "="*50)
            print(f"Analysis complete. Check 'stock_analysis.png' for visualization.")
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error in stock analysis: {str(e)}")
            return None

def main():
    """Main function to run the stock analyzer from command line."""
    parser = argparse.ArgumentParser(description='Enhanced Stock Analyzer using WaterCrawl and Claude 3.7')
    parser.add_argument('stock_symbol', help='Stock symbol to analyze (e.g., AAPL, MSFT, GOOGL)')
    parser.add_argument('-v', '--verbose', action='store_true', help='Enable verbose logging')
    parser.add_argument('-b', '--base-url', default='https://finance.yahoo.com', 
                       help='Base URL to search for stock information')
    
    args = parser.parse_args()
    
    # Configure logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        print(f"\n=== 🏦 Starting analysis for: {args.stock_symbol.upper()} ===")
        analyzer = StockAnalyzer()
        
        # Find relevant pages
        stock_pages = analyzer.find_relevant_stock_pages(args.stock_symbol, args.base_url)
        if not stock_pages:
            print('❌ Could not find relevant stock pages')
            return
            
        # Scrape and analyze
        stock_contents = analyzer.scrape_stock_data(stock_pages)
        if not stock_contents:
            print('❌ No content was successfully scraped')
            return
            
        # Analyze with Claude
        analysis_result = analyzer.analyze_with_claude(args.stock_symbol, stock_contents)
        if not analysis_result:
            print('❌ Failed to analyze stock data')
            return
            
        # Generate and display visualization
        analyzer.generate_visualization(analysis_result)
        
    except Exception as e:
        logger.critical(f"Fatal error: {str(e)}", exc_info=True)
        print(f"An error occurred. Please check the logs for details.")

if __name__ == "__main__":
    main()

# call the script like this:
# python stock_analyzer_enhanced.py AAPL