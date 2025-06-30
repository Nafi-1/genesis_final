import { useState, useEffect, useCallback } from 'react';
import { voiceService, Voice } from '../services/voiceService';

/**
 * Hook for using voice capabilities
 */
export function useVoice() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load available voices
  useEffect(() => {
    loadVoices();
  }, []);
  
  // Load available voices
  const loadVoices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const availableVoices = await voiceService.listVoices();
      setVoices(availableVoices);
      
      // Set default voice if available
      if (availableVoices.length > 0) {
        // Try to find a previously selected voice from local storage
        const savedVoiceId = localStorage.getItem('selectedVoiceId');
        const savedVoice = savedVoiceId 
          ? availableVoices.find(v => v.voice_id === savedVoiceId)
          : null;
        
        setSelectedVoice(savedVoice || availableVoices[0]);
      }
    } catch (err: any) {
      console.error('Failed to load voices:', err);
      setError(err.message || 'Failed to load available voices');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Select a voice
  const selectVoice = useCallback((voice: Voice | string) => {
    if (typeof voice === 'string') {
      const voiceObj = voices.find(v => v.voice_id === voice);
      if (voiceObj) {
        setSelectedVoice(voiceObj);
        localStorage.setItem('selectedVoiceId', voiceObj.voice_id);
      }
    } else {
      setSelectedVoice(voice);
      localStorage.setItem('selectedVoiceId', voice.voice_id);
    }
  }, [voices]);
  
  // Speak text with the selected voice
  const speak = useCallback(async (
    text: string, 
    options?: {
      voiceId?: string;
      stability?: number;
      similarityBoost?: number;
      style?: number;
      speakerBoost?: boolean;
    }
  ) => {
    if (!text) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const voiceId = options?.voiceId || selectedVoice?.voice_id;
      if (!voiceId) {
        throw new Error('No voice selected');
      }
      
      const audioUrl = await voiceService.synthesizeSpeech(text, voiceId, {
        stability: options?.stability,
        similarityBoost: options?.similarityBoost,
        style: options?.style,
        speakerBoost: options?.speakerBoost
      });
      
      // Play the audio
      const audio = new Audio(audioUrl);
      setIsPlaying(true);
      
      audio.onended = () => setIsPlaying(false);
      audio.onerror = (err) => {
        console.error('Audio playback error:', err);
        setError('Failed to play audio');
        setIsPlaying(false);
      };
      
      await audio.play();
      
      return audioUrl;
    } catch (err: any) {
      console.error('Speech synthesis failed:', err);
      setError(err.message || 'Failed to synthesize speech');
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVoice]);
  
  // Stop speech
  const stop = useCallback(() => {
    // This would stop any currently playing audio
    setIsPlaying(false);
  }, []);
  
  // Check if browser supports speech recognition
  const isSpeechRecognitionSupported = (): boolean => {
    return !!(
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    );
  };
  
  return {
    voices,
    selectedVoice,
    isPlaying,
    isLoading,
    error,
    loadVoices,
    selectVoice,
    speak,
    stop,
    isSpeechRecognitionSupported
  };
}