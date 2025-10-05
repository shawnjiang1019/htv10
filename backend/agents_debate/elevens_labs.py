from elevenlabs import ElevenLabs
from dotenv import load_dotenv
import os
import pygame
import tempfile
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
elevenlabs_key = os.getenv('ELEVENLABS_API_KEY')

# Initialize the ElevenLabs client with API key
elevenlabs_client = ElevenLabs(api_key=elevenlabs_key)

# Global Pygame Mixer Initialization - Initialize at module level
try:
    pygame.mixer.pre_init(frequency=22050, size=-16, channels=2, buffer=512)
    pygame.mixer.init()
    logger.info("✅ Pygame mixer initialized successfully")
except pygame.error as e:
    logger.error(f"❌ Failed to initialize pygame mixer: {e}")
    pygame.mixer = None

def get_voice_id(voice_name):
    """
    Map voice names to their corresponding voice IDs
    """
    voice_mapping = {
        "Rachel": "21m00Tcm4TlvDq8ikWAM",  # Rachel - Female, clear and professional
        "Adam": "pNInz6obpgDQGcFmaJgB",    # Adam - Male, confident and articulate
        "Bella": "EXAVITQu4vr4xnSDxMaL",   # Bella - Female, warm and friendly
        "Josh": "TxGEqnHWrfWFTfGW9XjX",    # Josh - Male, energetic and engaging
        "Sam": "yoZ06aMxZJJ28mfd3POQ",     # Sam - Male, calm and authoritative
        "Antoni": "ErXwobaYiN019PkySvjV",  # Antoni - Male, deep and smooth
        "Arnold": "VR6AewLTigWG4xSOukaG",  # Arnold - Male, deep and authoritative
        "Bella": "EXAVITQu4vr4xnSDxMaL",   # Bella - Female, warm and friendly
        "Elli": "MF3mGyEYCl7XYWbV9V6O",    # Elli - Female, young and energetic
        "Josh": "TxGEqnHWrfWFTfGW9XjX",    # Josh - Male, energetic and engaging
        "Rachel": "21m00Tcm4TlvDq8ikWAM",  # Rachel - Female, clear and professional
        "Sam": "yoZ06aMxZJJ28mfd3POQ",     # Sam - Male, calm and authoritative
    }
    return voice_mapping.get(voice_name, "21m00Tcm4TlvDq8ikWAM")  # Default to Rachel

def text_to_speech(text, voice_name="Rachel", model_id="eleven_multilingual_v2"):
    """
    Convert text to speech using ElevenLabs API and play it
    """
    try:
        # Check if mixer is initialized
        if not pygame.mixer or not pygame.mixer.get_init():
            logger.error("❌ Pygame mixer not initialized")
            return False
            
        # Get the correct voice ID
        voice_id = get_voice_id(voice_name)
        logger.info(f"🎤 Converting text to speech with voice: {voice_name} (ID: {voice_id})")
        
        # Generate audio using the correct API parameters
        audio = elevenlabs_client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,  # Use the mapped voice ID
            model_id=model_id,    # Use model_id parameter
            output_format="mp3_44100_128"  # Use MP3 format for better compatibility
        )
        
        # Create a temporary file with proper cleanup
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
            temp_file_path = temp_file.name
            
            # Write audio data to temporary file
            for chunk in audio:
                temp_file.write(chunk)
        
        try:
            # Load and play the audio
            pygame.mixer.music.load(temp_file_path)
            pygame.mixer.music.play()
            
            # Wait for playback to finish
            while pygame.mixer.music.get_busy():
                pygame.time.wait(100)
            
            logger.info(f"✅ Successfully played audio: {text[:50]}...")
            return True
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except OSError as e:
                logger.warning(f"Could not delete temporary file: {e}")
        
    except Exception as e:
        logger.error(f"❌ Error in text-to-speech: {e}")
        return False

def stop_audio():
    """Stop any currently playing audio"""
    try:
        if pygame.mixer and pygame.mixer.get_init():
            pygame.mixer.music.stop()
            logger.info("🛑 Audio stopped successfully")
            return True
        else:
            logger.warning("⚠️ Pygame mixer not initialized")
            return False
    except Exception as e:
        logger.error(f"❌ Error stopping audio: {e}")
        return False

def pause_audio():
    """Pause currently playing audio"""
    try:
        if pygame.mixer and pygame.mixer.get_init():
            pygame.mixer.music.pause()
            logger.info("⏸️ Audio paused successfully")
            return True
        else:
            logger.warning("⚠️ Pygame mixer not initialized")
            return False
    except Exception as e:
        logger.error(f"❌ Error pausing audio: {e}")
        return False

def resume_audio():
    """Resume paused audio"""
    try:
        if pygame.mixer and pygame.mixer.get_init():
            pygame.mixer.music.unpause()
            logger.info("▶️ Audio resumed successfully")
            return True
        else:
            logger.warning("⚠️ Pygame mixer not initialized")
            return False
    except Exception as e:
        logger.error(f"❌ Error resuming audio: {e}")
        return False

def is_audio_playing():
    """Check if audio is currently playing"""
    try:
        if pygame.mixer and pygame.mixer.get_init():
            return pygame.mixer.music.get_busy()
        return False
    except Exception as e:
        logger.error(f"❌ Error checking audio status: {e}")
        return False

def get_available_voices():
    """Fetch available voices from ElevenLabs API"""
    try:
        voices = elevenlabs_client.voices.get_all()
        logger.info(f"✅ Retrieved {len(voices.voices)} available voices")
        return voices.voices
    except Exception as e:
        logger.error(f"❌ Error fetching voices: {e}")
        return []

def test_voice_connection():
    """Test the connection to ElevenLabs API"""
    try:
        voices = get_available_voices()
        if voices:
            logger.info("✅ ElevenLabs API connection successful")
            return True
        else:
            logger.error("❌ No voices found - check API key")
            return False
    except Exception as e:
        logger.error(f"❌ ElevenLabs API connection failed: {e}")
        return False