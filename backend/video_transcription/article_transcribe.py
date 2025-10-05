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

# BRAVE_KEY = os.getenv('BRAVE_API')
# BASE_URL = os.getenv('BASE_URL')


BRAVE_KEY="BSAcXlD8dkCTJhhNQQe87Z76DyCZzQb"
BASE_URL="https://api.search.brave.com/res/v1/web/search"
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict

router = APIRouter()


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
    

def get_alternative_links(transcript_text, model=None, api_key=None):
    if model is None:
        model = setup_gemini("AIzaSyDGp3xJiFDvgKtFrn9DAjzxV6glb5qu4eM")

    # Truncate very long transcripts to improve performance
    max_length = 6000  # Reduced to avoid JSON parsing issues
    if len(transcript_text) > max_length:
        transcript_text = transcript_text[:max_length] + "... [transcript truncated]"

    # Clean transcript more thoroughly
    # cleaned_transcript = (transcript_text
    #                      .replace('"', "'")
    #                      .replace('\n', ' ')
    #                      .replace('\r', ' ')
    #                      .replace('\t', ' ')
    #                      .strip())
    
    # # Remove multiple spaces
    # cleaned_transcript = ' '.join(cleaned_transcript.split())

    prompt = f"""
    You are an AI that provides alternative perspectives on news articles.
    
    Given the following transcript, identify the main viewpoint and provide different perspectives.
    
    IMPORTANT RULES:
    - Summary: EXACTLY 1-2 sentences, maximum 40 words
    - Alternative links: Provide exactly 3 articles with differing viewpoints
    - ALL text must use ONLY single quotes, never double quotes
    - NO line breaks or special characters in any field
    - The URLS MUST BE TO ACTUAL ARTICLES, DO NOT MAKE UP YOUR OWN
    - Keep descriptions under 80 characters each

    Expected JSON format (use ONLY single quotes in content):
    {{
        "summary": "Brief summary using only single quotes",
        "alternatelinks": [
            {{
                "title": "Article title with single quotes only",
                "url": "https://example.com/article1",
                "source": "Source Name", 
                "description": "Brief description with single quotes only"
            }},
            {{
                "title": "Second article title",
                "url": "https://example.com/article2",
                "source": "Another Source", 
                "description": "Another brief description"
            }},
            {{
                "title": "Third article title",
                "url": "https://example.com/article3",
                "source": "Third Source", 
                "description": "Third brief description"
            }}
        ]
    }}
    
    Transcript: {transcript_text}
    
    Respond with valid JSON only. NO additional text before or after.
    """
    
    try:
        print(f"\nGenerating alternative articles for transcript ({len(transcript_text)} chars)...")
        response = model.generate_content(
            contents=prompt,
            generation_config={
                "temperature": 0.1,  # Very low temperature for consistent formatting
                "max_output_tokens": 2048,  # Reduced to ensure shorter responses
                "top_p": 0.8,
            },
        )
        print(response.text)
        
        # Check if response exists
        if not response or not response.text:
            print("❌ Empty response from Gemini")
            return
        
        print(f"Raw response: {response.text}")
        
        # Clean the response text more thoroughly
        response_text = response.text.strip()
        
        # Remove any markdown formatting
        if response_text.startswith("```json"):
            response_text = response_text.replace("```json", "").replace("```", "").strip()
        elif response_text.startswith("```"):
            response_text = response_text.replace("```", "").strip()
        
        # Additional cleaning for common JSON issues
        response_text = (response_text
                        .replace('\n', ' ')
                        .replace('\r', ' ')
                        .replace('\t', ' '))
        
        # Remove extra whitespace
        response_text = ' '.join(response_text.split())
        
        try:
            # Parse the JSON
            parsed_data = json.loads(response_text)
            
            # Validate structure
            if not isinstance(parsed_data, dict):
                raise ValueError("Response is not a dictionary")
            
            if "summary" not in parsed_data or "alternatelinks" not in parsed_data:
                raise ValueError("Missing required fields")
            
            # Validate using Pydantic model
            article_summary = Article_Summary(**parsed_data)
            
            print(f"✅ Generated summary with {len(article_summary.alternatelinks)} alternative links")
            return article_summary
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing error: {e}")
            print(f"Problematic response text: {response_text}")
            return 
        except ValueError as e:
            print(f"❌ Validation error: {e}")
            return
            
    except Exception as e:
        print(f"❌ Error generating alternative articles: {e}")
        return
    


@router.get("/alternative")
def get_alternative_articles(url: str):
    """
    Get alternative articles based on transcript text.
    Accepts larger text inputs via request body.
    """
    try:
        print("getting the payload...")
        # get the raw article        
        payload = get_article_raw(url=url)

        result = get_alternative_links(payload)
        return {
            "success": True,
            "data": result,
            "message": "Alternative articles generated successfully"
        }
    except Exception as e:
        print(f"Error in get_alternative_articles: {str(e)}")
        return {
            "success": False,
            "data": None,
            "error": str(e),
            "message": "Failed to generate alternative articles"
        }
