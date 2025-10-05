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

def parse_gemini_response_to_json(gemini_response):
    """Parse Gemini response and extract JSON content"""
    import json
    
    if not gemini_response:
        return {"error": "No response received"}
    
    try:
        response_text = gemini_response.strip()
        
        # Check if response is wrapped in markdown code blocks
        if "```json" in response_text:
            # Extract content between ```json and ```
            start_marker = "```json"
            end_marker = "```"
            start_idx = response_text.find(start_marker)
            if start_idx != -1:
                start_idx += len(start_marker)
                end_idx = response_text.find(end_marker, start_idx)
                if end_idx != -1:
                    response_text = response_text[start_idx:end_idx].strip()
        
        # Try to parse as JSON
        try:
            parsed_json = json.loads(response_text)
            return parsed_json
        except json.JSONDecodeError as json_error:
            print(f"JSON decode error: {json_error}")
            # If JSON parsing fails, return the raw text
            return {"raw_response": response_text, "parse_error": str(json_error)}
            
    except Exception as e:
        print(f"Error parsing Gemini response to JSON: {e}")
        return {"error": f"Failed to parse response: {str(e)}", "raw_response": gemini_response}

def fact_check_claim(claim, model=None):
    """Perform actual fact-checking on a specific claim"""
    try:
        if model is None:
            model = setup_gemini()
        
        fact_check_prompt = f"""You are an expert fact-checker. Analyze this claim and provide a fact check result.

Claim: "{claim}"

Provide your analysis in this format:
VERDICT: [VERIFIED/UNVERIFIED/MISLEADING]
EXPLANATION: [Detailed explanation of why this is verified, unverified, or misleading]
SOURCES: [List 2-3 credible sources that support your verdict]

Be specific and cite actual facts, statistics, or events. Use your knowledge to provide accurate information."""
        
        response = model.generate_content(fact_check_prompt)
        return response.text
        
    except Exception as e:
        print(f"Error fact-checking claim: {e}")
        return f"Error fact-checking: {str(e)}"

def parse_fact_checks_response(gemini_response, video_id):
    """Parse Gemini response into FlashEvent format array"""
    import json
    import uuid
    
    if not gemini_response:
        return []
    
    try:
        response_text = gemini_response.strip()
        
        # Check if response is wrapped in markdown code blocks
        if "```json" in response_text:
            # Extract content between ```json and ```
            start_marker = "```json"
            end_marker = "```"
            start_idx = response_text.find(start_marker)
            if start_idx != -1:
                start_idx += len(start_marker)
                end_idx = response_text.find(end_marker, start_idx)
                if end_idx != -1:
                    response_text = response_text[start_idx:end_idx].strip()
        
        # Try to parse as JSON array
        try:
            fact_checks = json.loads(response_text)
            
            # Validate and clean up the fact checks
            cleaned_fact_checks = []
            for i, fact_check in enumerate(fact_checks):
                if isinstance(fact_check, dict):
                    # Always use SerpAPI to find real URLs instead of trusting Gemini's fake URLs
                    try:
                        # Create a search query from the fact check content
                        content = fact_check.get('content', '')
                        # Extract key terms from the content for better search
                        search_query = f"fact check {content[:100]}"
                        
                        print(f"Searching for real URLs for: {search_query}")
                        search_results = search_web(search_query)
                        
                        # Prioritize credible fact-checking sources
                        credible_sources = []
                        news_sources = []
                        other_sources = []
                        
                        for result in search_results:
                            url = result.get("url", "").lower()
                            if any(domain in url for domain in ['snopes.com', 'politifact.com', 'factcheck.org', 'fullfact.org']):
                                credible_sources.append(result)
                            elif any(domain in url for domain in ['reuters.com', 'ap.org', 'bbc.com', 'washingtonpost.com', 'nytimes.com', 'cnn.com', 'npr.org']):
                                news_sources.append(result)
                            else:
                                other_sources.append(result)
                        
                        # Use the best available source
                        if credible_sources:
                            url_field = credible_sources[0].get("url", "")
                            print(f"Using credible source: {url_field}")
                        elif news_sources:
                            url_field = news_sources[0].get("url", "")
                            print(f"Using news source: {url_field}")
                        elif other_sources:
                            url_field = other_sources[0].get("url", "")
                            print(f"Using other source: {url_field}")
                        else:
                            # Fallback to Google search
                            url_field = f"https://www.google.com/search?q={search_query.replace(' ', '+')}+fact+check"
                            print(f"Using Google search fallback: {url_field}")
                            
                    except Exception as e:
                        print(f"Error using SerpAPI for fact check URL: {e}")
                        # Fallback to Google search URL
                        search_query = f"fact check {fact_check.get('content', '')[:50]}"
                        url_field = f"https://www.google.com/search?q={search_query.replace(' ', '+')}+fact+check"
                    
                    cleaned_fact_check = {
                        "id": fact_check.get("id", f"{video_id}_{fact_check.get('timestamp', 0)}_{i}"),
                        "timestamp": int(float(fact_check.get("timestamp", 0))),
                        "content": str(fact_check.get("content", "")),
                        "duration": int(float(fact_check.get("duration", 3))),
                        "url": url_field
                    }
                    
                    # Validate required fields
                    if (cleaned_fact_check["content"] and 
                        cleaned_fact_check["timestamp"] >= 0 and 
                        cleaned_fact_check["duration"] > 0):
                        cleaned_fact_checks.append(cleaned_fact_check)
            
            return cleaned_fact_checks
            
        except json.JSONDecodeError as json_error:
            print(f"JSON decode error: {json_error}")
            print(f"Response text: {response_text}")
            return []
            
    except Exception as e:
        print(f"Error parsing fact checks response: {e}")
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
    """Extract transcript and return fact checks in FlashEvent format"""
    try:
        print(f"\n=== Processing YouTube video: {video_id} ===")
        
        # Get the transcript first
        transcript_obj = get_transcript(video_id=video_id)
        transcript_text = transcript_obj.raw_text
        
        # Setup Gemini model
        model = setup_gemini()
        
        # The fact-checking prompt that returns FlashEvent format
        prompt = f"""You are an expert fact-checker. Analyze this YouTube video transcript and identify factual claims that need verification.

Video ID: {video_id}
Transcript: {transcript_text}

For each factual claim you find that needs fact-checking, return a JSON array with objects in this EXACT format:
{{
    "id": "unique_string_id",
    "timestamp": number_in_seconds,
    "content": "FACT_CHECK_RESULT: [VERIFIED/UNVERIFIED/MISLEADING] - Detailed fact check result with sources",
    "duration": number_in_seconds,
    "url": "placeholder_url"
}}

Requirements:
- Return ONLY a JSON array of fact check objects
- Each object must have exactly these 5 fields: id, timestamp, content, duration, url
- id should be unique (use video_id + timestamp + index)
- timestamp should be the time in seconds when the claim is made
- content should contain the actual fact check result, not just a description
- Format content as: "FACT_CHECK_RESULT: [STATUS] - [Detailed explanation with specific facts and sources]"
- Status should be: VERIFIED (claim is accurate), UNVERIFIED (insufficient evidence), or MISLEADING (claim is false/misleading)
- duration should be how long to show the fact check (5-8 seconds for detailed results)
- url should be "placeholder_url" - we will replace this with real URLs from fact-checking websites
- Use your knowledge to provide actual fact-checking, not just search suggestions
- Focus on providing detailed, accurate fact checks in the content field

Return maximum 8 fact checks. If no fact-checkable claims are found, return an empty array []."""
        
        # Generate response from Gemini
        response = model.generate_content(prompt)
        
        # Parse the response to get FlashEvent array
        fact_checks = parse_fact_checks_response(response.text, video_id)
        
        print(f"Generated {len(fact_checks)} fact checks successfully")
        return fact_checks
        
    except Exception as e:
        print(f"Error in getYouTubeTranscript: {str(e)}")
        return []

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
