import sys
import os
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
import google.generativeai as genai
from dotenv import load_dotenv
import re




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

    prompt = f"""
    Given the following transcript, give me a brief and concise summary no longer than 2 sentences. Ideally it should be 1 sentence. After identifying the
    dominant perspective of the transcript, find articles that show an opposing perspective on the same topic as the original transcript. 
    transcript:
    {transcript_text}
    """
    try:
        print("\nGenerating summary with Gemini...")
        response = model.generate_content(contents=prompt, config={
            "response_mime_type": "application/json",
            "response_schema": list[Article_Summary]
        })
        return response.text
    except Exception as e:
        print(f"Error generating summary: {e}")
        return None
    


@router.get("/alternative")
def get_alternative_articles(transcript_text):
    """
    Get alternative articles based on transcript text.
    Accepts larger text inputs via request body.
    """
    try:
        payload = get_alternative_links(transcript_text=transcript_text)
        return payload
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "error": str(e),
            "message": "Failed to generate alternative articles"
        }
