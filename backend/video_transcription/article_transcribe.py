import sys
import os
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
import google.generativeai as genai
from dotenv import load_dotenv
import re
import json
import trafilatura
import requests
from serpapi import GoogleSearch

# BRAVE_KEY = os.getenv('BRAVE_API')
# BASE_URL = os.getenv('BASE_URL')


BRAVE_KEY="BSAcXlD8dkCTJhhNQQe87Z76DyCZzQb"
BASE_URL="https://api.search.brave.com/res/v1/web/search"
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict

router = APIRouter()
load_dotenv()


class Link(BaseModel):
    title: str
    url: str
    source: str
    description: str

class Article_Summary(BaseModel):
    summary: str
    alternatelinks: list[Link]

class TranscriptRequest(BaseModel):
    transcript_text: str


def setup_gemini(api_key=None):
    """Setup Gemini API with API key from environment or parameter"""
    if api_key is None:
        api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        raise ValueError("Gemini API key not found. Please set GEMINI_API_KEY environment variable or pass api_key parameter.")
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.5-flash')



def get_article_raw(url):
    dl = trafilatura.fetch_url(url)
    return trafilatura.extract(dl, url, favor_precision=True)


@router.get("/urls")
def get_news_articles(query: str, count=4):
    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_KEY
    }
    params = {
        "q": query,
        #"result_filter": "news",  # Filter to only get news results
        "count": count,
        "search_lang": "en"
    }

    response = requests.get(BASE_URL, headers=headers, params=params)
    return response.json()
    articles = []
    if 'results' in data:
        for result in data['results']:
            article = {
                'title': result.get('title', ''),
                'url': result.get('url', ''),
                'description': result.get('description', ''),
                'source': result.get('source', ''),
                'published': result.get('published', '')
            }
            articles.append(article)
    
    return articles
    
def create_summary(transcript_text, model=None, api_key=None):
    """Create a summary of the transcript using Gemini"""
    if model is None:
        model = setup_gemini(api_key)
    
    prompt = f"""
    Summarize this video transcript in exactly 2 sentences with no special characters or quotes:
    
    {transcript_text}
    """
    
    try:
        print("\nGenerating summary with Gemini...")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating summary: {e}")
        return None



def generate_alternate_links(article_text, article_title=None, model=None, api_key=None):
    """Generate alternate links with opposing perspectives using web search"""
    try:
        if model is None:
            model = setup_gemini(api_key)
        
        # Truncate very long articles
        max_length = 800
        if len(article_text) > max_length:
            article_text = article_text[:max_length]
        
        # Analyze bias and get opposing search terms
        bias_prompt = f"""
        Analyze this article's perspective and suggest 3 search terms for finding opposing viewpoints:
        
        Title: {article_title or "Unknown"}
        Content: {article_text}
        
        Identify the main topic and viewpoint, then suggest 3 search terms that would find opposing or different perspectives.
        Return only the 3 search terms separated by commas:
        """
        
        print("\nAnalyzing bias and finding opposing perspectives...")
        response = model.generate_content(bias_prompt)
        search_terms = response.text.strip().replace('\n', ', ')
        print(f"Opposing search terms: {search_terms}")
        
        # Split terms and search each one
        term_list = [term.strip() for term in search_terms.split(',')][:3]
        
        all_results = []
        for term in term_list:
            search_results = search_web(term)
            all_results.extend(search_results)
        
        # Return top 3 results from all searches
        return all_results[:3]
        
    except Exception as e:
        print(f"Error generating alternate links: {e}")
        return []

def search_web(query):
    """Search the web using SerpAPI with fallback"""
    try:
        serpapi_key = os.getenv('SERPAPI_API_KEY')
        if not serpapi_key:
            print("No SerpAPI key found, using fallback")
            return create_fallback_results(query)
        
        print(f"Searching for: {query}")
        search = GoogleSearch({
            "q": query,
            "api_key": serpapi_key,
            "num": 3  # Get 3 results
        })
        
        results = search.get_dict()
        
        # Check for API errors
        if "error" in results:
            print(f"SerpAPI error: {results['error']}")
            return create_fallback_results(query)
        
        organic_results = results.get("organic_results", [])
        
        if not organic_results:
            print("No organic results found, using fallback")
            return create_fallback_results(query)
        
        formatted_results = []
        for result in organic_results:
            url = result.get("link", "")
            title = result.get("title", "")
            
            # Validate URL format
            if url and (url.startswith("http://") or url.startswith("https://")):
                formatted_results.append({
                    "title": title or "Article Title",
                    "url": url,
                    "source": result.get("displayed_link", "Unknown Source"),
                    "description": result.get("snippet", "")[:100] + "..." if result.get("snippet") else ""
                })
        
        # If we got valid results, return them
        if formatted_results:
            return formatted_results
        else:
            print("No valid URLs found, using fallback")
            return create_fallback_results(query)
        
    except Exception as e:
        print(f"Web search error: {e}")
        return create_fallback_results(query)

def create_fallback_results(query):
    """Create fallback search results with reliable URLs"""
    query_encoded = query.replace(" ", "+")
    
    fallback_results = [
        {
            "title": f"Google Search: {query}",
            "url": f"https://www.google.com/search?q={query_encoded}",
            "source": "Google",
            "description": f"Search results for {query}"
        },
        {
            "title": f"Wikipedia: {query}",
            "url": f"https://en.wikipedia.org/wiki/{query.replace(' ', '_')}",
            "source": "Wikipedia",
            "description": f"Wikipedia article about {query}"
        },
        {
            "title": f"BBC News: {query}",
            "url": "https://www.bbc.com/news",
            "source": "BBC News",
            "description": f"BBC News coverage related to {query}"
        }
    ]
    
    return fallback_results
    


@router.get("/alternative")
def get_alternative_articles(url: str):
    """
    Get alternative articles based on article URL.
    """
    try:
        print(f"Processing article from URL: {url}")
        
        # Get the raw article content
        payload = get_article_raw(url=url)
        
        if not payload:
            return {
                "summary": "Could not extract article content",
                "alternateLinks": []
            }
        
        print(f"Extracted article content: {len(payload)} characters")
        
        # Generate summary
        summary = create_summary(transcript_text=payload)
        
        # Generate alternative links using web search
        alternate_links = generate_alternate_links(payload)
        
        return {
            "summary": summary or "Summary not available",
            "alternateLinks": alternate_links
        }
    except Exception as e:
        print(f"Error in get_alternative_articles: {str(e)}")
        return {
            "summary": f"Error: {str(e)}",
            "alternateLinks": []
        }




