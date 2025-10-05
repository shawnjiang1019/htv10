from elevenlabs import ElevenLabs
from dotenv import load_dotenv
import os
import pygame

load_dotenv()
elevenlabs_key = os.getenv('ELEVENLABS_API_KEY')

# Initialize the ElevenLabs client with API key
elevenlabs_client = ElevenLabs(api_key=elevenlabs_key)

def text_to_speech(text, voice_name="Rachel", model="eleven_multilingual_v2"):
    """
    Convert text to speech using ElevenLabs API and play it
    """
    try:
        # Generate audio using the new API
        audio = elevenlabs_client.text_to_speech.convert(
            text=text,
            voice=voice_name,
            model=model
        )
        
        # Initialize pygame mixer for audio playback
        pygame.mixer.init()
        
        # Save audio to a temporary file
        temp_file = "temp_audio.wav"
        with open(temp_file, "wb") as f:
            for chunk in audio:
                f.write(chunk)
        
        # Play the audio
        pygame.mixer.music.load(temp_file)
        pygame.mixer.music.play()
        
        # Wait for playback to finish
        while pygame.mixer.music.get_busy():
            pygame.time.wait(100)
        
        # Clean up temporary file
        os.remove(temp_file)
        
        print(f"Successfully played: {text}")
        return True
        
    except Exception as e:
        print(f"Error in text-to-speech: {e}")
        return False

def stop_audio():
    """Stop any currently playing audio"""
    pygame.mixer.music.stop()

def pause_audio():
    """Pause currently playing audio"""
    pygame.mixer.music.pause()

def resume_audio():
    """Resume paused audio"""
    pygame.mixer.music.unpause()