import { api } from '../lib/api';

/**
 * Service for voice synthesis and recognition
 */
export const voiceService = {
  /**
   * Synthesize speech from text using ElevenLabs
   */
  synthesizeSpeech: async (
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
      // Try to use the real API endpoint
      console.log('🔊 Synthesizing speech:', text.substring(0, 50) + '...');
      
      try {
        const response = await api.post('/agent/voice/synthesize', {
          text,
          voice_id: voiceId,
          stability: options?.stability,
          similarity_boost: options?.similarityBoost,
          style: options?.style,
          use_speaker_boost: options?.speakerBoost
        });
        
        if (response.data.success && response.data.audio) {
          // If the API returns base64 audio, convert to a data URL
          if (!response.data.audio.startsWith('data:')) {
            return `data:audio/mpeg;base64,${response.data.audio}`;
          }
          return response.data.audio;
        }
      } catch (error) {
        console.warn('Failed to synthesize speech via API, using fallback:', error);
      }
      
      // Fall back to Supabase Edge Function if available
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('🔊 Attempting to use Supabase Edge Function for voice synthesis');

      if (supabaseUrl && supabaseAnonKey && 
          !supabaseUrl.includes('your_') && !supabaseAnonKey.includes('your_')) {
        try {
          const response = await fetch(
            `${supabaseUrl}/functions/v1/voice-synthesis`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
              },
              body: JSON.stringify({
                text,
                voice_id: voiceId,
                stability: options?.stability,
                similarity_boost: options?.similarityBoost,
                style: options?.style,
                use_speaker_boost: options?.speakerBoost
              })
            }
          );
          
          const data = await response.json();
          
          if (data.success && data.audio) {
            return `data:audio/mpeg;base64,${data.audio}`;
          }
        } catch (error) {
          console.warn('Failed to synthesize speech via Edge Function, using browser fallback:', error);
        }
      }
      
      // If all else fails, use the browser's speech synthesis
      return synthesizeWithBrowser(text);
    } catch (error) {
      console.error('Failed to synthesize speech:', error);
      return synthesizeWithBrowser(text);
    }
  },
  
  /**
   * List available voices
   */
  listVoices: async (): Promise<Voice[]> => {
    try {
      // Try to use the real API endpoint
      console.log('🔊 Attempting to list voices via API endpoint');
      
      let voicesList: Voice[] = [];
      
      try {
        const response = await api.get('/agent/voice/voices');
        
        if (response.data.voices && response.data.voices.length > 0) {
          console.log(`✅ Retrieved ${response.data.voices.length} voices from API`);
          voicesList = response.data.voices;
          return voicesList;
        }
      } catch (error) {
        console.warn('Failed to list voices via API, using fallback:', error);
      }
      
      // Try agent service directly
      try {
        const agentServiceUrl = import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:8001';
        console.log('🔊 Attempting to list voices via agent service:', agentServiceUrl);
        
        // Try multiple endpoints that might work
        const endpoints = [
          '/voice/voices',           // Standard endpoint
          '/v1/voice/voices',        // Versioned endpoint
          '/api/voice/voices',       // API prefix endpoint
          '/agent/voice/voices'      // Agent-specific endpoint
        ];
        
        // Try each endpoint until one works
        for (const endpoint of endpoints) {
          try {
            console.log(`🔍 Trying endpoint: ${agentServiceUrl}${endpoint}`);
            const response = await fetch(`${agentServiceUrl}${endpoint}`, {
              method: 'GET'
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.voices && data.voices.length > 0) {
                console.log(`✅ Retrieved ${data.voices.length} voices from agent service via ${endpoint}`);
                voicesList = data.voices;
                return voicesList;
              } else if (Array.isArray(data) && data.length > 0) {
                // Sometimes the API returns the array directly
                console.log(`✅ Retrieved ${data.length} voices directly from agent service via ${endpoint}`);
                voicesList = data;
                return voicesList;
              }
            } else {
              console.warn(`Agent service endpoint ${endpoint} returned: ${response.status}`);
            }
          } catch (endpointError) {
            console.warn(`Failed to connect to endpoint ${endpoint}:`, endpointError);
          }
        }
      } catch (agentServiceError) {
        console.warn('Failed to list voices via agent service:', agentServiceError);
      }
      
      // Return mock voices
      console.log('🔊 All voice endpoints failed - using mock voices');
      voicesList = getMockVoices();
      return voicesList;
    } catch (error) {
      console.error('Failed to list voices:', error);
      return getMockVoices();
    }
  },
  
  /**
   * Recognize speech from audio
   */
  recognizeSpeech: async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Check if browser supports speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }
      
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        console.log('Speech recognized:', speechResult);
        resolve(speechResult);
      };
      
      recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };
      
      recognition.start();
    });
  },
  
  /**
   * Check if browser supports speech synthesis
   */
  isSpeechSynthesisSupported: (): boolean => {
    return 'speechSynthesis' in window;
  },
  
  /**
   * Check if browser supports speech recognition
   */
  isSpeechRecognitionSupported: (): boolean => {
    return !!(
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    );
  }
};

/**
 * Synthesize speech using the browser's built-in Web Speech API
 */
function synthesizeWithBrowser(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported in this browser'));
      return;
    }
    
    // Create a new audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const destination = audioContext.createMediaStreamDestination();
    const mediaRecorder = new MediaRecorder(destination.stream);
    const chunks: BlobPart[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/wav' });
      const reader = new FileReader();
      
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    };
    
    // Start recording
    mediaRecorder.start();
    
    // Create a speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find a good voice (preferably female)
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter(voice => voice.lang.includes('en-'));
    
    if (englishVoices.length > 0) {
      // Try to find a female voice first
      const femaleVoice = englishVoices.find(voice => voice.name.includes('female') || voice.name.includes('Female'));
      utterance.voice = femaleVoice || englishVoices[0];
    }
    
    // Set utterance properties
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // When speech is done, stop recording
    utterance.onend = () => {
      mediaRecorder.stop();
      audioContext.close();
    };
    
    // Start speaking
    window.speechSynthesis.speak(utterance);
    
    // Fallback in case onend doesn't fire
    setTimeout(() => {
      if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        audioContext.close();
      }
    }, text.length * 100); // Estimate speech duration based on text length
  });
}

/**
 * Get mock voices for development
 */
function getMockVoices(): Voice[] {
  console.log('📢 Creating mock voice list for development');
  
  return [
    {
      voice_id: "21m00Tcm4TlvDq8ikWAM",
      name: "Rachel",
      preview_url: "https://example.com/voices/rachel-preview.mp3",
      category: "premade",
      description: "A friendly and professional female voice"
    },
    {
      voice_id: "AZnzlk1XvdvUeBnXmlld",
      name: "Domi",
      preview_url: "https://example.com/voices/domi-preview.mp3",
      category: "premade",
      description: "An authoritative and clear male voice"
    },
    {
      voice_id: "EXAVITQu4vr4xnSDxMaL",
      name: "Bella",
      preview_url: "https://example.com/voices/bella-preview.mp3",
      category: "premade",
      description: "A warm and engaging female voice"
    },
    {
      voice_id: "ErXwobaYiN019PkySvjV",
      name: "Antoni",
      preview_url: "https://example.com/voices/antoni-preview.mp3",
      category: "premade",
      description: "A confident and articulate male voice"
    }
  ];
}

// Voice interface
export interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
  description?: string;
  category?: string;
}