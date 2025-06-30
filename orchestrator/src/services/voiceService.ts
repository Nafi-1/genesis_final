import axios from 'axios';
import { v4 as uuid } from 'uuid';

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Default voice ID

/**
 * Service for voice synthesis capabilities
 */
class VoiceService {
  private client: any;
  // Add synthesizeSpeech as an optional property for backward compatibility
  synthesizeSpeech?: typeof this.synthesize;

  constructor() {
    try {
      // Initialize ElevenLabs client if credentials are available
      if (ELEVENLABS_API_KEY) {
        // Use direct API calls instead of the SDK to avoid compatibility issues
        this.client = { apiKey: ELEVENLABS_API_KEY };
        console.log('🔊 ElevenLabs client initialized using HTTP client');
      }
    } catch (error) {
      console.error('Failed to initialize ElevenLabs client:', error);
      this.client = null;
    }
  }

  async synthesize(
    text: string,
    voiceId?: string,
    options?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speakerBoost?: boolean;
    }
  ): Promise<string> {
    try {
      console.log(`🔊 Synthesizing speech: ${text.substring(0, 50)}...`);
      
      // If ElevenLabs client is available, use it directly
      if (this.client) {
        return await this.synthesizeDirectly(text, voiceId, options);
      }
      
      // Otherwise, use agent service
      return await this.synthesizeViaAgentService(text, voiceId, options);
    } catch (error: any) {
      console.error('❌ Speech synthesis failed:', error);
      throw new Error(`Speech synthesis failed: ${error.message}`);
    }
  }
  
  /**
   * Synthesize speech directly using ElevenLabs API
   */
  synthesizeDirectly: async (
    text: string,
    voiceId?: string,
    options?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speakerBoost?: boolean;
    }
  ): Promise<string> => {
    try {
      const voice = voiceId || ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
      
      // Use direct HTTP client
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;
      const response = await axios.post(url, {
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: options?.stability || 0.5,
          similarity_boost: options?.similarityBoost || 0.75,
          style: options?.style || 0.0,
          use_speaker_boost: options?.speakerBoost !== false
        }
      }, {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': voiceService.client.apiKey
        },
        responseType: 'arraybuffer'
      });

      // Convert arraybuffer to base64
      const audioBase64 = Buffer.from(response.data).toString('base64');

      // Convert to data URL for direct use in browsers
      return `data:audio/mpeg;base64,${audioBase64}`;
    } catch (error: any) {
      console.error('❌ Direct speech synthesis failed:', error);
      
      // Fall back to agent service if direct synthesis fails
      console.log('⚠️ Falling back to agent service for speech synthesis');
      return await voiceService.synthesizeViaAgentService(text, voiceId, options);
    }
  },
  
  /**
   * Synthesize speech via the agent service
   */
  synthesizeViaAgentService: async (
    text: string,
    voiceId?: string,
    options?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speakerBoost?: boolean;
    }
  ): Promise<string> => {
    try {
      const response = await axios.post(`${AGENT_SERVICE_URL}/voice/synthesize`, {
        text,
        voice_id: voiceId,
        stability: options?.stability,
        similarity_boost: options?.similarityBoost,
        style: options?.style,
        use_speaker_boost: options?.speakerBoost
      });
      
      if (!response.data.audio) {
        throw new Error('No audio data received from agent service');
      }
      
      // Return as data URL
      return `data:audio/mpeg;base64,${response.data.audio}`;
    } catch (error: any) {
      console.error('❌ Agent service speech synthesis failed:', error);
      
      if (error.response) {
        throw new Error(`Agent service error: ${error.response.status} ${error.response.data?.error || error.message}`);
      }
      
      throw error;
    }
  },
  
  /**
   * Synthesize speech directly using ElevenLabs API
   */
  private async synthesizeDirectly(
    text: string,
    voiceId?: string,
    options?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speakerBoost?: boolean;
    }
  ): Promise<string> {
    try {
      const voice = voiceId || ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
      
      // Use direct HTTP client
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;
      const response = await axios.post(url, {
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: options?.stability || 0.5,
          similarity_boost: options?.similarityBoost || 0.75,
          style: options?.style || 0.0,
          use_speaker_boost: options?.speakerBoost !== false
        }
      }, {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.client.apiKey
        },
        responseType: 'arraybuffer'
      });

      // Convert arraybuffer to base64
      const audioBase64 = Buffer.from(response.data).toString('base64');

      // Convert to data URL for direct use in browsers
      return `data:audio/mpeg;base64,${audioBase64}`;
    } catch (error: any) {
      console.error('❌ Direct speech synthesis failed:', error);
      
      // Fall back to agent service if direct synthesis fails
      console.log('⚠️ Falling back to agent service for speech synthesis');
      return await this.synthesizeViaAgentService(text, voiceId, options);
    }
  }
  
  /**
   * Synthesize speech via the agent service
   */
  private async synthesizeViaAgentService(
    text: string,
    voiceId?: string,
    options?: {
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speakerBoost?: boolean;
    }
  ): Promise<string> {
    try {
      const response = await axios.post(`${AGENT_SERVICE_URL}/voice/synthesize`, {
        text,
        voice_id: voiceId,
        stability: options?.stability,
        similarity_boost: options?.similarityBoost,
        style: options?.style,
        use_speaker_boost: options?.speakerBoost
      });
      
      if (!response.data.audio) {
        throw new Error('No audio data received from agent service');
      }
      
      // Return as data URL
      return `data:audio/mpeg;base64,${response.data.audio}`;
    } catch (error: any) {
      console.error('❌ Agent service speech synthesis failed:', error);
      
      if (error.response) {
        throw new Error(`Agent service error: ${error.response.status} ${error.response.data?.error || error.message}`);
      }
      
      throw error;
    }
  }
  
  /**
   * List available voices
   */
  async listVoices(): Promise<any[]> {
    try {
      console.log('🔊 Listing available voices');
      
      // If ElevenLabs client is available, use it directly
      if (this.client && typeof this.client.getVoices === 'function') {
        try {
          const voicesData = await this.client.getVoices();
          return voicesData.voices;
        } catch (error) {
          console.warn('Failed to get voices using client, falling back to HTTP request:', error);
        }
      }
      
      // Otherwise, use agent service
      const response = await axios.get(`${AGENT_SERVICE_URL}/voice/voices`);
      return response.data.voices || [];
    } catch (error: any) {
      console.error('❌ Failed to list voices:', error);
      
      // Return mock voices if real ones can't be fetched
      return this.getMockVoices();
    }
  }
  
  /**
   * Get mock voices for development/fallback
   */
  private getMockVoices(): any[] {
    return [
      {
        voice_id: "21m00Tcm4TlvDq8ikWAM",
        name: "Rachel",
        category: "premade",
        description: "A friendly and professional female voice"
      },
      {
        voice_id: "AZnzlk1XvdvUeBnXmlld",
        name: "Domi",
        category: "premade",
        description: "An authoritative and clear male voice"
      },
      {
        voice_id: "EXAVITQu4vr4xnSDxMaL",
        name: "Bella",
        category: "premade",
        description: "A warm and engaging female voice"
      },
      {
        voice_id: "ErXwobaYiN019PkySvjV",
        name: "Antoni",
        category: "premade",
        description: "A confident and articulate male voice"
      }
    ];
  }
}

// Create singleton instance
const voiceService = new VoiceService();

export default voiceService;

// Add synthesizeSpeech as an alias of synthesize for backward compatibility
voiceService.synthesizeSpeech = voiceService.synthesize;