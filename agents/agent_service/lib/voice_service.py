import os
import base64
import logging
import asyncio
import json
import json
from typing import Dict, Any, Optional
import httpx
from typing import List
import redis.asyncio as redis
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Voice cache settings
VOICE_CACHE_ENABLED = os.getenv("VOICE_CACHE_ENABLED", "true").lower() == "true"
VOICE_CACHE_EXPIRY = int(os.getenv("VOICE_CACHE_EXPIRY", "3600"))  # Default 1 hour

# Get environment variables
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default voice ID
REDIS_URL = os.getenv("REDIS_URL")

class VoiceService:
    """Service for text-to-speech synthesis using ElevenLabs."""
    
    def __init__(self):
        """Initialize the voice service."""
        self.api_key = ELEVENLABS_API_KEY
        self.voice_id = ELEVENLABS_VOICE_ID
        self.client = httpx.AsyncClient(timeout=60.0)
        self.redis_client = None

        # Voice cache configuration
        self.cache_enabled = VOICE_CACHE_ENABLED
        self.cache_expiry = VOICE_CACHE_EXPIRY

        # Initialize Redis for caching if available
        if VOICE_CACHE_ENABLED and REDIS_URL and not REDIS_URL.startswith("your_"):
            try:
                self.redis_client = redis.from_url(REDIS_URL)
                logger.info("✅ Connected to Redis for voice cache")
            except Exception as e:
                logger.error(f"❌ Failed to connect to Redis for voice cache: {str(e)}")
                logger.info("⚠️ Voice caching will be disabled")
        
        if not self.api_key or self.api_key.startswith("your_"):
            logger.warning("⚠️ No valid ElevenLabs API key found. Voice synthesis will be unavailable.")
            self.enabled = False
        else:
            self.enabled = True
            logger.info(f"🔊 Voice service initialized with voice ID: {self.voice_id}")
    
    async def synthesize_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        stability: float = 0.5,
        similarity_boost: float = 0.5,
        style: float = 0.0,
        use_speaker_boost: bool = True
    ) -> Optional[str]:
        """Convert text to speech using ElevenLabs API.
        
        Args:
            text: The text to convert to speech.
            voice_id: Optional voice ID to use. Defaults to the one in environment.
            stability: Voice stability (0-1).
            similarity_boost: Voice similarity boost (0-1).
            style: Speaking style (0-1).
            use_speaker_boost: Whether to use speaker boost.
            
        Returns:
            Base64-encoded audio data or None if synthesis failed.
        """
        # First check cache if Redis is available
        if self.redis_client and VOICE_CACHE_ENABLED:
            try:
                cache_key = f"voice:{voice_id or self.voice_id}:{hash(text)}:{hash(json.dumps({
                    'stability': stability,
                    'similarity_boost': similarity_boost,
                    'style': style,
                    'use_speaker_boost': use_speaker_boost
                }))}"
                
                cached_audio = await self.redis_client.get(cache_key)
                if cached_audio:
                    logger.info("✅ Using cached voice audio")
                    return cached_audio.decode('utf-8')
            except Exception as e:
                logger.warning(f"⚠️ Error checking voice cache: {str(e)}")

        if not self.enabled:
            logger.warning("⚠️ ElevenLabs voice synthesis is not enabled.")
            return None
        
        voice_id_to_use = voice_id or self.voice_id
        
        try:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id_to_use}"
            
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.api_key
            }
            
            data = {
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": stability,
                    "similarity_boost": similarity_boost,
                    "style": style,
                    "use_speaker_boost": use_speaker_boost
                }
            }
            
            response = await self.client.post(url, json=data, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"❌ ElevenLabs API error: {response.status_code} {response.text}")
                return None
            
            # Get audio data
            audio_data = response.content
            
            # Convert to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # Store in cache if Redis is available
            if self.redis_client and VOICE_CACHE_ENABLED:
                try:
                    cache_key = f"voice:{voice_id_to_use}:{hash(text)}:{hash(json.dumps({
                        'stability': stability,
                        'similarity_boost': similarity_boost,
                        'style': style,
                        'use_speaker_boost': use_speaker_boost
                    }))}"
                    
                    await self.redis_client.set(cache_key, audio_base64, ex=VOICE_CACHE_EXPIRY)
                    logger.info(f"✅ Stored voice in cache with expiry {VOICE_CACHE_EXPIRY}s")
                except Exception as e:
                    logger.warning(f"⚠️ Error storing voice in cache: {str(e)}")
            
            logger.info(f"✅ Speech synthesized successfully: {len(audio_data)} bytes")
            return audio_base64
        except Exception as e:
            logger.error(f"❌ Error calling ElevenLabs API: {str(e)}")
            return None
    
    async def get_available_voices(self) -> List[Dict[str, Any]]:
        """Get available voices from ElevenLabs.
        
        Returns:
            List of voice objects with ID, name, and other metadata.
        """
        if not self.enabled:
            logger.warning("⚠️ ElevenLabs voice synthesis is not enabled.")
            return []
        
        try:
            url = "https://api.elevenlabs.io/v1/voices"
            
            headers = {
                "Accept": "application/json",
                "xi-api-key": self.api_key
            }
            
            response = await self.client.get(url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"❌ ElevenLabs API error: {response.status_code} {response.text}")
                return []
            
            voices = response.json().get("voices", [])
            logger.info(f"✅ Retrieved {len(voices)} voices from ElevenLabs")
            
            # Sort voices by name
            voices = sorted(voices, key=lambda v: v.get("name", ""))
            
            return voices
        except Exception as e:
            logger.error(f"❌ Error calling ElevenLabs API: {str(e)}")
            return []
    
    async def get_voice_settings(self, voice_id: Optional[str] = None) -> Dict[str, Any]:
        """Get voice settings from ElevenLabs.
        
        Args:
            voice_id: Optional voice ID to get settings for. Defaults to the default voice.
            
        Returns:
            Voice settings object with defaults if unavailable
        """
        if not self.enabled:
            logger.warning("⚠️ ElevenLabs voice synthesis is not enabled.")
            return {
                "stability": 0.5,
                "similarity_boost": 0.5,
                "style": 0.0,
                "use_speaker_boost": True
            }
        
        voice_id_to_use = voice_id or self.voice_id
        
        try:
            url = f"https://api.elevenlabs.io/v1/voices/{voice_id_to_use}/settings"
            
            headers = {
                "Accept": "application/json",
                "xi-api-key": self.api_key
            }
            
            response = await self.client.get(url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"❌ ElevenLabs API error: {response.status_code} {response.text}")
                return {
                    "stability": 0.5,
                    "similarity_boost": 0.5,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            
            settings = response.json()
            logger.info(f"✅ Retrieved voice settings for {voice_id_to_use}")
            return settings
        except Exception as e:
            logger.error(f"❌ Error calling ElevenLabs API: {str(e)}")
            return {
                "stability": 0.5,
                "similarity_boost": 0.5,
                "style": 0.0,
                "use_speaker_boost": True
            }
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
        
        if self.redis_client:
            await self.redis_client.close()
            logger.info("✅ Redis client closed")


# Enhanced voice service methods
    async def generate_conversational_voice(
        self,
        messages: List[Dict[str, str]],
        voice_id: Optional[str] = None,
        stability: float = 0.5,
        similarity_boost: float = 0.5,
        style: float = 0.0,
        use_speaker_boost: bool = True
    ) -> Optional[str]:
        """Generate a conversational voice response from a message history.
        
        Args:
            messages: List of message objects with "role" and "content" keys
            voice_id: Optional voice ID to use
            stability: Voice stability (0-1)
            similarity_boost: Voice similarity boost (0-1)
            style: Speaking style (0-1)
            use_speaker_boost: Whether to use speaker boost
            
        Returns:
            Base64-encoded audio data or None if synthesis failed
        """
        if not self.enabled:
            logger.warning("⚠️ ElevenLabs voice synthesis is not enabled.")
            return None
        
        # Extract the last assistant message as the text to synthesize
        assistant_messages = [m for m in messages if m.get("role") == "assistant"]
        if not assistant_messages:
            logger.warning("⚠️ No assistant messages found to synthesize")
            return None
        
        text = assistant_messages[-1].get("content", "")
        if not text:
            logger.warning("⚠️ Empty text content in assistant message")
            return None
        
        # Check cache with the full messages context as key
        cache_key = None
        if self.redis_client and self.cache_enabled:
            try:
                cache_key = f"voice:conversation:{voice_id or self.voice_id}:{hash(json.dumps(messages))}"
                cached_audio = await self.redis_client.get(cache_key)
                if cached_audio:
                    logger.info("✅ Using cached conversational voice audio")
                    return cached_audio.decode('utf-8')
            except Exception as e:
                logger.warning(f"⚠️ Error checking voice cache: {str(e)}")
        
        # If not in cache, synthesize the speech
        audio_base64 = await self.synthesize_speech(
            text=text,
            voice_id=voice_id,
            stability=stability,
            similarity_boost=similarity_boost,
            style=style,
            use_speaker_boost=use_speaker_boost
        )
        
        # Store in cache if successful
        if audio_base64 and self.redis_client and self.cache_enabled and cache_key:
            try:
                await self.redis_client.set(cache_key, audio_base64, ex=self.cache_expiry)
                logger.info(f"✅ Stored conversational voice in cache with expiry {self.cache_expiry}s")
            except Exception as e:
                logger.warning(f"⚠️ Error storing conversational voice in cache: {str(e)}")
        
        return audio_base64
# Create a singleton instance for the service
_voice_service = None

def get_voice_service() -> VoiceService:
    """Get the singleton VoiceService instance.
    
    Returns:
        VoiceService instance.
    """
    global _voice_service
    if _voice_service is None:
        _voice_service = VoiceService()
    return _voice_service