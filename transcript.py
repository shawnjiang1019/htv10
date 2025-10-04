import sys
import os
from youtube_transcript_api import YouTubeTranscriptApi
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def get_transcript(video_id, languages=['en']):
    print(f'Getting transcript for id ${video_id}')
    ytt_api = YouTubeTranscriptApi()
    transcript_obj = ytt_api.fetch(video_id, languages=languages)
    print(f'Transcript acquired for id ${video_id}')

    def get_raw_text(transcript_obj):
        return ' '.join([snippet['text'] for snippet in transcript_obj.to_raw_data()])

    transcript_obj.raw_text = get_raw_text(transcript_obj)
    print(f'Converted to raw text: added to attribute .raw_text')

    return transcript_obj

def setup_gemini(api_key=None):
    """Setup Gemini API with API key from environment or parameter"""
    if api_key is None:
        api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        raise ValueError("Gemini API key not found. Please set GEMINI_API_KEY environment variable or pass api_key parameter.")
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-2.0-flash')

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

if __name__ == '__main__':
    id = 'eJENP0Rr8p0'
    if len(sys.argv) > 1:
        id = sys.argv[1]
    
    # Get transcript
    z = get_transcript(id)
    print(f"\n--- TRANSCRIPT ---")
    print(z.raw_text)
    
    # Generate summary
    try:
        summary = create_summary(z.raw_text)
        if summary:
            print(f"\n--- SUMMARY ---")
            print(summary)
        else:
            print("\nFailed to generate summary.")
    except ValueError as e:
        print(f"\nError: {e}")
        print("To use the summary feature, please set your GEMINI_API_KEY environment variable.")
        print("You can get an API key from: https://makersuite.google.com/app/apikey")
    except Exception as e:
        print(f"\nUnexpected error: {e}")