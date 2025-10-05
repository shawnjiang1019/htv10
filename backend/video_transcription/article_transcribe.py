import sys
import os
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
import google.generativeai as genai
from dotenv import load_dotenv
import re
import json



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
    return genai.GenerativeModel('gemini-2.5-pro')




def get_alternative_links(transcript_text, model=None, api_key=None):
    if model is None:
        model = setup_gemini("AIzaSyDGp3xJiFDvgKtFrn9DAjzxV6glb5qu4eM")

    # Truncate very long transcripts to improve performance
    max_length = 6000  # Reduced to avoid JSON parsing issues
    if len(transcript_text) > max_length:
        transcript_text = transcript_text[:max_length] + "... [transcript truncated]"

    # Clean transcript more thoroughly
    cleaned_transcript = (transcript_text
                         .replace('"', "'")
                         .replace('\n', ' ')
                         .replace('\r', ' ')
                         .replace('\t', ' ')
                         .strip())
    
    # Remove multiple spaces
    cleaned_transcript = ' '.join(cleaned_transcript.split())

    prompt = f"""
    You are an AI that provides alternative perspectives on news articles.
    
    Given the following transcript, identify the main viewpoint and provide opposing perspectives.
    
    IMPORTANT RULES:
    - Summary: EXACTLY 1-2 sentences, maximum 40 words
    - Alternative links: Provide exactly 3 articles with opposing viewpoints
    - ALL text must use ONLY single quotes, never double quotes
    - NO line breaks or special characters in any field
    - URLs should be realistic but can be fictional
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
    
    Transcript: {cleaned_transcript}
    
    Respond with valid JSON only. NO additional text before or after.
    """
    
    try:
        print(f"\nGenerating alternative articles for transcript ({len(transcript_text)} chars)...")
        response = model.generate_content(
            contents=prompt,
            generation_config={
                "temperature": 0.1,  # Very low temperature for consistent formatting
                "max_output_tokens": 1000,  # Reduced to ensure shorter responses
                "top_p": 0.8,
            },
        )
        
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
    


@router.post("/alternative")
def get_alternative_articles(request: TranscriptRequest):
    """
    Get alternative articles based on transcript text.
    Accepts larger text inputs via request body.
    """
    try:
        # Clean and preprocess the transcript text
        cleaned_text = request.transcript_text.strip()
        print("text cleaned!!!")
        
        # Log the length for debugging
        print(f"Received transcript with {len(cleaned_text)} characters")
        
        payload = get_alternative_links(transcript_text=cleaned_text)
    
        return {
            "success": True,
            "data": payload,
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
