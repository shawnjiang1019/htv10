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

load_dotenv()


class Link(BaseModel):
    title: str
    url: str
    source: str
    description: str

class Article_Summary(BaseModel):
    summary: str
    alternatelinks: list[Link]
    



class video_transcription(BaseModel):
    view: str
    args: list[str]
    op_view: str
    bias: float
    video_url: int


def split_by_punctuation(text: str) -> list[str]:
    """
    Split a string into a list of strings based on punctuation marks.
    Removes empty strings from the result.
    """
    # Split by common punctuation marks: . ! ? ; :
    sentences = re.split(r'[.!?:]+', text)
    # Remove empty strings and strip whitespace
    return [sentence.strip() for sentence in sentences if sentence.strip()]

def setup_gemini(api_key=None):
    """Setup Gemini API with API key from environment or parameter"""
    if api_key is None:
        api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        raise ValueError("Gemini API key not found. Please set GEMINI_API_KEY environment variable or pass api_key parameter.")
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.5-pro')

def create_summary(transcript_text, model=None, api_key=None):
    """Create a summary of the transcript using Gemini"""
    if model is None:
        model = setup_gemini(api_key)
    
    prompt = f"""
    Please provide a comprehensive summary of the following YouTube video transcript. 
    Include the main topics discussed, key points, and any important insights or conclusions.
    
    Transcript:
    {transcript_text}
    
    Summary:
    """
    
    try:
        print("\nGenerating summary with Gemini...")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating summary: {e}")
        return None

def get_bias(transcript_text, model=None, api_key=None,):
    """Get bias of the article and find specific sentences"""
    if model is None:
        model = setup_gemini("AIzaSyDGp3xJiFDvgKtFrn9DAjzxV6glb5qu4eM")
    prompt = f"""
    If the provided transcript is biased find the sentences that are the most biased towards the  
    view point of the transcript, keep it concise, if the transcript is neutral then do not give any sentences. 
    Also give a numeric score for the bias between 0 and 1. Also give the view point of the transcript.
    Give the data in this json format. YOU MUST GIVE THE OUTPUT IN JSON FORMAT AND NOTHING ELSE: 
    {{
        'sentences': []
        'bias_score': 0.0
        'view point': ""
    }}
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


def get_metadata(video_id): 
    ydl_opts = {}
    url = f"https://www.youtube.com/watch?v={video_id}"
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
    return info

def get_transcript(video_id, languages=['en']):
    
    print(f'Getting transcript for id ${video_id}')
    ytt_api = YouTubeTranscriptApi()
    transcript_obj = ytt_api.fetch(video_id, languages=languages)
    print(f'Transcript acquired for id ${video_id}')

    def get_raw_text(transcript_obj):
        return ' '.join([snippet['text'] for snippet in transcript_obj.to_raw_data()])

    transcript_obj.raw_text = get_raw_text(transcript_obj)
    transcript_obj.sentences = split_by_punctuation(transcript_obj.raw_text)
    print(f'Converted to raw text: added to attribute .raw_text')
    
    # Generate summary using Gemini
    try:
        summary = create_summary(transcript_obj.raw_text)
        transcript_obj.summary = summary
        print(f'Generated summary with Gemini')
    except Exception as e:
        print(f'Error generating summary: {e}')
        transcript_obj.summary = None
    
    # Get video metadata
    try:
        metadata = get_metadata(video_id)
        transcript_obj.metadata = metadata
        print(f'Retrieved video metadata')
    except Exception as e:
        print(f'Error getting metadata: {e}')
        transcript_obj.metadata = None
    
    print(transcript_obj)
    return transcript_obj




@router.get("/get-transcript")
def getTranscript(video_id: str):
    transcript = get_transcript(video_id=video_id)
    
    # classify the text to see if it is biased or not

    payload: video_transcription = None
    
    # Return comprehensive response
    response = {
        "video_id": video_id,
        "sentences": transcript.sentences,
        "raw_text": transcript.raw_text,
        "summary": transcript.summary,
        "metadata": transcript.metadata
    }
    
    return response


@router.get("/analyze-bias")
def analyzeBias(video_id: str):
    """
    Analyze bias in a video transcript towards a specific viewpoint
    """
    try:
        # Get the transcript first
        transcript = get_transcript(video_id=video_id)
        
        # Analyze bias using the get_bias function
        bias_analysis = get_bias(
            transcript_text=transcript.raw_text,
        )
        
        # Return comprehensive response
        # response = {
        #     "video_id": video_id,
        #     "bias_analysis": bias_analysis
        # }
        
        # return response
        return bias_analysis
        
    except Exception as e:
        return {
            "error": f"Error analyzing bias: {str(e)}",
            "video_id": video_id,
        }