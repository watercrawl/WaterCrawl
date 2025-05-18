#!/usr/bin/env python3
"""
DeepSeek R1 WaterCrawl Live Chat with Your Website

This script allows users to have interactive conversations about website content using:
- WaterCrawl for web crawling and content extraction
- DeepSeek R1 for natural language understanding and responses

Key Features:
- Interactive chat interface for website analysis
- Web content extraction and summarization
- Context-aware responses based on website content
- Support for multiple websites in a single session

Dependencies:
- python-dotenv
- requests
- watercrawl-py
- deepseek-ai
- rich (for better console output)
"""

import os
import json
import logging
import requests
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from watercrawl import WaterCrawlAPIClient


class DeepSeekClient:
    """A simple HTTP client for interacting with the DeepSeek API."""
    
    def __init__(self, api_key: str, base_url: str = "https://api.deepseek.com"):
        """Initialize the DeepSeek client with an API key."""
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        })
    
    def chat(self, messages: List[Dict[str, str]], model: str = "deepseek-chat", **kwargs) -> Dict[str, Any]:
        """
        Send a chat completion request to the DeepSeek API.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            model: The model to use for completion
            **kwargs: Additional parameters for the API request
            
        Returns:
            The API response as a dictionary
        """
        url = f"{self.base_url}/v1/chat/completions"
        
        payload = {
            "model": model,
            "messages": messages,
            **kwargs
        }
        
        try:
            response = self.session.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling DeepSeek API: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response content: {e.response.text}")
            raise
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.progress import Progress, SpinnerColumn, TextColumn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("webpage_chat.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Console for rich output
console = Console()

class MessageType(Enum):
    """Types of messages in the chat."""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    WEBSITE = "website"

@dataclass
class ChatMessage:
    """A single message in the chat history."""
    role: MessageType
    content: str
    timestamp: datetime = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()
        if self.metadata is None:
            self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary for serialization."""
        return {
            "role": self.role.value,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ChatMessage':
        """Create message from dictionary."""
        return cls(
            role=MessageType(data['role']),
            content=data['content'],
            timestamp=datetime.fromisoformat(data['timestamp']),
            metadata=data.get('metadata', {})
        )

class WebsiteChatBot:
    """A chatbot that can interact with website content using WaterCrawl and DeepSeek R1."""
    
    def __init__(self, api_keys: Dict[str, str]):
        """
        Initialize the chatbot with API keys.
        
        Args:
            api_keys: Dictionary containing 'watercrawl' and 'deepseek' API keys
        """
        self.watercrawl = WaterCrawlAPIClient(api_key=api_keys['watercrawl'])
        self.deepseek = DeepSeekClient(api_key=api_keys['deepseek'])
        self.chat_history: List[ChatMessage] = []
        self.current_website: Optional[str] = None
        self.website_content: Dict[str, str] = {}
        
        # Add system message
        self.add_system_message("""You are a helpful AI assistant that helps users interact with and understand website content. 
You can browse websites, extract information, and answer questions based on the content.""")
    
    def add_message(self, message: ChatMessage) -> None:
        """Add a message to the chat history."""
        self.chat_history.append(message)
        logger.info(f"Added {message.role.value} message to chat history")
    
    def add_system_message(self, content: str) -> None:
        """Add a system message to the chat history."""
        self.add_message(ChatMessage(role=MessageType.SYSTEM, content=content))
    
    def add_user_message(self, content: str) -> None:
        """Add a user message to the chat history."""
        self.add_message(ChatMessage(role=MessageType.USER, content=content))
    
    def add_assistant_message(self, content: str, metadata: Dict[str, Any] = None) -> None:
        """Add an assistant message to the chat history."""
        self.add_message(ChatMessage(
            role=MessageType.ASSISTANT, 
            content=content,
            metadata=metadata or {}
        ))
    
    def add_website_content(self, url: str, content: str) -> None:
        """Add website content to the chat context."""
        self.website_content[url] = content
        self.add_message(ChatMessage(
            role=MessageType.WEBSITE,
            content=f"Content loaded from {url}",
            metadata={"url": url, "content_length": len(content)}
        ))
    
    def extract_website_content(self, url: str) -> Optional[str]:
        """
        Extract content from a website using WaterCrawl.
        
        Args:
            url: URL of the website to extract content from
            
        Returns:
            Extracted content as markdown or None if extraction fails
        """
        try:
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                transient=True,
            ) as progress:
                task = progress.add_task(f"Extracting content from {url}...", total=None)
                
                # Scrape the URL
                result = self.watercrawl.scrape_url(
                    url=url,
                    page_options={
                        "exclude_tags": ["nav", "footer", "header"],
                        "include_tags": ["article", "main", "section"],
                        "wait_time": 2000,
                        "include_html": False,
                        "only_main_content": True,
                        "include_links": True
                    }
                )
                
                if result and 'result' in result and 'markdown' in result['result']:
                    content = result['result']['markdown']
                    self.website_content[url] = content
                    progress.update(task, completed=1, description=f"Extracted {len(content)} characters from {url}")
                    return content
                
                progress.update(task, completed=1, description=f"Failed to extract content from {url}")
                return None
                
        except Exception as e:
            logger.error(f"Error extracting content from {url}: {str(e)}")
            return None
    
    def process_user_query(self, query: str) -> str:
        """
        Process a user query and generate a response.
        
        Args:
            query: User's query
            
        Returns:
            Assistant's response
        """
        # Add user message to history
        self.add_user_message(query)
        
        # Check if the user wants to visit a website
        if query.lower().startswith(('visit', 'go to', 'check out', 'look at')) or 'http' in query.lower():
            # Extract URL from query
            url = self._extract_url_from_query(query)
            if url:
                content = self.extract_website_content(url)
                if content:
                    self.current_website = url
                    self.add_website_content(url, content)
                    
                    # Generate a summary of the website
                    summary = self._summarize_website_content(content)
                    self.add_assistant_message(
                        f"I've loaded the content from {url}. Here's a summary:\n\n{summary}",
                        {"website_url": url, "content_length": len(content), "summary": summary}
                    )
                    return f"I've loaded the content from {url}. How can I help you with it?"
                else:
                    error_msg = f"I couldn't extract content from {url}. The site may be blocking automated access or the URL might be incorrect."
                    self.add_assistant_message(error_msg)
                    return error_msg
        
        # If we have website content, use it to answer the question
        context = self._get_context_for_query()
        
        # Generate response using DeepSeek R1
        response = self._generate_response(query, context)
        
        # Add assistant's response to history
        self.add_assistant_message(response)
        
        return response
    
    def _extract_url_from_query(self, query: str) -> Optional[str]:
        """Extract URL from user query."""
        # Simple URL extraction - in a real app, you'd want more robust parsing
        import re
        url_match = re.search(r'https?://[^\s\n]+', query)
        return url_match.group(0) if url_match else None
    
    def _get_context_for_query(self) -> str:
        """Get relevant context for the current query."""
        if not self.website_content:
            return ""
        
        # In a real implementation, you'd want to use embeddings and similarity search
        # to find the most relevant parts of the website content
        context = "Current website content:\n\n"
        for url, content in self.website_content.items():
            context += f"--- {url} ---\n{content[:5000]}...\n\n"  # Limit context length
        
        return context
    
    def _summarize_website_content(self, content: str, max_length: int = 5000) -> str:
        """Generate an AI-powered summary of website content using DeepSeek R1."""
        # Truncate content to avoid token limits
        truncated_content = content[:max_length]
        
        # Send to DeepSeek R1 with a summarization prompt
        messages = [
            {"role": "system", "content": "You are a helpful assistant that summarizes website content, make sure you keep allthe facts"},
            {"role": "user", "content": f"Summarize the main fascts and numbers so the user can ask any questions from the webcontent\n\n{truncated_content}"}
        ]
        
        response = self.deepseek.chat(
            messages=messages,
            model="deepseek-reasoner",
            temperature=0.3  # Lower temp for factual summaries
        )
        return response['choices'][0]['message']['content']
    
    def _generate_response(self, query: str, context: str = "") -> str:
        """Generate a response using DeepSeek R1."""
        try:
            # Filter chat history to only include supported message types and ensure proper alternation
            supported_roles = {'system', 'user', 'assistant'}
            
            # Start with system messages
            messages = [
                {"role": "system", "content": "You are a helpful AI assistant that helps users understand and interact with website content."}
            ]
            
            # Add context if available
            if context:
                messages.append({"role": "system", "content": f"Context: {context}"})
            
            # Add conversation history with proper alternation
            last_role = None
            for msg in self.chat_history[-10:]:  # Limit to last 10 messages for context
                if msg.role.value in supported_roles:
                    # Skip if same role as last message
                    if msg.role.value == last_role:
                        continue
                    messages.append({"role": msg.role.value, "content": msg.content})
                    last_role = msg.role.value
            
            # Add current user query if not a duplicate of last message
            if not (messages and messages[-1]["role"] == "user" and messages[-1]["content"] == query):
                messages.append({"role": "user", "content": query})
            
            # Call DeepSeek API
            response = self.deepseek.chat(
                messages=messages,
                max_tokens=1000,
                temperature=0.7,
                top_p=0.9,
                model="deepseek-reasoner"
            )
            
            # Extract the content from the response
            if 'choices' in response and len(response['choices']) > 0:
                return response['choices'][0]['message']['content']
            else:
                logger.error(f"Unexpected API response format: {response}")
                return "I'm sorry, I encountered an issue with the AI service. Please try again later."
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return "I'm sorry, I encountered an error while processing your request. Please try again."

def main():
    """Run the website chat bot in the console."""
    # Load environment variables
    load_dotenv()
    
    # Get API keys
    api_keys = {
        'watercrawl': os.getenv('WATERCRAWL_API_KEY'),
        'deepseek': os.getenv('DEEPSEEK_API_KEY')
    }
    
    # Check for missing API keys
    missing_keys = [k for k, v in api_keys.items() if not v]
    if missing_keys:
        console.print(f"[red]Error: Missing required API keys: {', '.join(missing_keys)}[/red]")
        console.print("Please set these environment variables in a .env file or in your environment.")
        return
    
    # Initialize the chatbot
    try:
        bot = WebsiteChatBot(api_keys)
        console.print(Panel.fit("Chat with your webpage", style="bold blue"))
        console.print("Type a webpage URL or ask a question. Type 'quit' to exit.")
        
        # Main chat loop
        while True:
            try:
                # Get user input
                user_input = console.input("\n[bold cyan]You:[/bold cyan] ").strip()
                
                # Check for exit command
                if user_input.lower() in ('quit', 'exit', 'bye'):
                    console.print("Thank you for using the WaterCrawl Chatbot! Goodbye!")
                    break
                
                if not user_input:
                    continue
                
                # Process the query and get response
                with console.status("Thinking..."):
                    response = bot.process_user_query(user_input)
                
                # Print the response with formatting
                console.print("\n[bold green]WaterCrawl AI Assistant:[/bold green]")
                console.print(Markdown(response))
                
            except KeyboardInterrupt:
                console.print("\nGoodbye!")
                break
            except Exception as e:
                logger.error(f"Error in chat loop: {str(e)}")
                console.print("[red]An error occurred. Please try again.[/red]")
    
    except Exception as e:
        console.print(f"[red]Error initializing the chatbot: {str(e)}[/red]")
        logger.exception("Fatal error in main")

if __name__ == "__main__":
    main()