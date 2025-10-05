import sys
import os
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
import google.generativeai as genai
from dotenv import load_dotenv
import re
from fastapi import APIRouter
from serpapi import GoogleSearch

router = APIRouter()
load_dotenv()

def setup_gemini(api_key=None):
    """Setup Gemini API with API key from environment or parameter"""
    if api_key is None:
        api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        raise ValueError("Gemini API key not found. Please set GEMINI_API_KEY environment variable or pass api_key parameter.")
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.5-flash')

def get_transcript(video_id, languages=['en']):
    """Get YouTube video transcript"""
    print(f'Getting transcript for id {video_id}')
    ytt_api = YouTubeTranscriptApi()
    transcript_obj = ytt_api.fetch(video_id, languages=languages)
    print(f'Transcript acquired for id {video_id}')

    def get_raw_text(transcript_obj):
        return ' '.join([snippet['text'] for snippet in transcript_obj.to_raw_data()])

    transcript_obj.raw_text = get_raw_text(transcript_obj)
    print(f'Converted to raw text: {len(transcript_obj.raw_text)} characters')
    
    return transcript_obj

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

def generate_alternate_links(transcript_text, video_title=None, model=None, api_key=None):
    """Generate alternate links with opposing perspectives using web search"""
    try:
        if model is None:
            model = setup_gemini(api_key)
        
        # Analyze bias and get opposing search terms
        bias_prompt = f"""
        Analyze this video's perspective and suggest 3 search terms for finding opposing viewpoints:
        
        Title: {video_title or "Unknown"}
        Content: {transcript_text[:800]}
        
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
        return format_search_results(all_results[:3])
        
    except Exception as e:
        print(f"Error generating alternate links: {e}")
        return "Error finding alternate links"

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
                    "snippet": result.get("snippet", "")[:100] + "..." if result.get("snippet") else ""
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
            "snippet": f"Search results for {query}"
        },
        {
            "title": f"Wikipedia: {query}",
            "url": f"https://en.wikipedia.org/wiki/{query.replace(' ', '_')}",
            "snippet": f"Wikipedia article about {query}"
        },
        {
            "title": f"BBC News: {query}",
            "url": "https://www.bbc.com/news",
            "snippet": f"BBC News coverage related to {query}"
        }
    ]
    
    return fallback_results

def format_search_results(results):
    """Format search results into the expected format"""
    if not results:
        return "No alternate sources found"
    
    formatted = ""
    for i, result in enumerate(results, 1):
        formatted += f"{i}. {result['title']} - {result['url']}\n"
    
    return formatted.strip()

def parse_alternate_links_to_json(alternate_links_response):
    """Parse the formatted alternate links response into JSON array"""
    if not alternate_links_response or alternate_links_response == "No alternate sources found":
        return []
    
    try:
        # Split by lines and parse each line
        lines = alternate_links_response.strip().split('\n')
        json_links = []
        
        for line in lines:
            if line.strip():
                # Parse format: "1. Title - URL"
                parts = line.split(' - ', 1)
                if len(parts) == 2:
                    # Remove the number prefix (e.g., "1. ")
                    title_part = parts[0].split('. ', 1)
                    title = title_part[1] if len(title_part) > 1 else title_part[0]
                    url = parts[1].strip()
                    
                    json_links.append({
                        "title": title,
                        "url": url
                    })
        
        return json_links
        
    except Exception as e:
        print(f"Error parsing alternate links to JSON: {e}")
        return []

@router.get("/youtube-summary/{video_id}")
def getYouTubeSummary(video_id: str):
    """Generate summary and alternate links for a YouTube video"""
    try:
        print(f"\n=== Processing video ID: {video_id} ===")
        
        # Get the transcript
        transcript = get_transcript(video_id=video_id)
        
        # Generate summary
        summary_text = create_summary(transcript.raw_text) or "Summary not available"
        
        # Generate alternate links
        alternate_links_response = generate_alternate_links(transcript.raw_text) or "No alternate links found"
        
        # Parse alternate links into JSON format
        alternate_links_json = parse_alternate_links_to_json(alternate_links_response)
        
        # Return response
        response = {
            "video_id": video_id,
            "summary": summary_text,
            "alternateLinks": alternate_links_json
        }
        
        print(f"Response prepared successfully")
        return response
        
    except Exception as e:
        print(f"Error in getYouTubeSummary: {str(e)}")
        return {
            "error": f"Error generating YouTube summary: {str(e)}",
            "video_id": video_id,
        }

@router.get("/youtube-transcript/{video_id}")
def getYouTubeTranscript(video_id: str):
    """Get YouTube video transcript with timestamps for real-time fact-checking"""
    try:
        print(f"\n=== Getting transcript with timestamps for video ID: {video_id} ===")
        
        # Get the transcript
        transcript_obj = get_transcript(video_id=video_id)
        
        # Extract raw transcript data with timestamps
        raw_data = transcript_obj.to_raw_data()
        
        # Format into list of sentences with timestamps
        transcript_sentences = []
        for snippet in raw_data:
            transcript_sentences.append({
                "text": snippet['text'].strip(),
                "time": snippet['start']
            })
        
        print(f"Transcript formatted successfully: {len(transcript_sentences)} sentences")
        return transcript_sentences
        
    except Exception as e:
        print(f"Error in getYouTubeTranscript: {str(e)}")
        return {
            "error": f"Error getting YouTube transcript: {str(e)}",
            "video_id": video_id,
        }

@router.get("/test-gemini")
def testGemini():
    """Test if Gemini API is working"""
    try:
        model = setup_gemini()
        response = model.generate_content("What is 2+2?")
        return {
            "status": "success",
            "message": response.text
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
