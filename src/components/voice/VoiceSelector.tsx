import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Play, Pause, Check, X, Loader, Volume } from 'lucide-react';
import { HolographicButton } from '../ui/HolographicButton';
import { voiceService } from '../../services/voiceService';
import { GlassCard } from '../ui/GlassCard';

interface VoiceSelectorProps {
  onSelect: (voiceId: string) => void;
  selectedVoiceId?: string;
  label?: string;
  className?: string;
}

interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
  description?: string;
  category?: string;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  onSelect,
  selectedVoiceId,
  label = 'Select Voice',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get the currently selected voice
  const selectedVoice = voices.find(voice => voice.voice_id === selectedVoiceId);
  
  useEffect(() => {
    // Load available voices when component mounts
    fetchVoices();
  }, []);
  
  // Effect to scroll to the selected voice when the dropdown opens
  useEffect(() => {
    if (isOpen && selectedVoiceId && listRef.current) {
      // Find the index of the selected voice
      const selectedIndex = voices.findIndex(voice => voice.voice_id === selectedVoiceId);
      if (selectedIndex >= 0) {
        // Find all voice buttons in the list
        const buttons = listRef.current.querySelectorAll('button[data-voice-id]');
        if (buttons[selectedIndex]) {
          // Scroll to the selected voice with some offset
          buttons[selectedIndex].scrollIntoView({ behavior: 'auto', block: 'center' });
        }
      }
    }
  }, [isOpen, selectedVoiceId, voices]);
  
  const fetchVoices = async () => {
    setIsLoading(true);
    setError(null);
    
    console.log('🔊 Fetching available voices...');
    try {
      const voiceList = await voiceService.listVoices();
      
      if (voiceList && voiceList.length > 0) {
        console.log(`✅ Retrieved ${voiceList.length} voices:`, voiceList);
        setVoices(voiceList);
        
        // If no voice is selected yet but we have voices, select the first one
        if (!selectedVoiceId && voiceList.length > 0) {
          onSelect(voiceList[0].voice_id);
        }
      } else {
        console.warn('⚠️ No voices returned from service');
        setError('No voices available. Using default voices.');
        // Fall back to default voices
        const defaultVoices = getMockVoices();
        setVoices(defaultVoices);
        
        // Log available voices for debugging
        console.log('📢 Using default voices:', defaultVoices);
        
        if (!selectedVoiceId && defaultVoices.length > 0) {
          onSelect(defaultVoices[0].voice_id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      setError('Failed to load voices. Using default options.');
      
      // Fall back to default voices
      const defaultVoices = getMockVoices();
      setVoices(defaultVoices);
      
      // Log available voices for debugging
      console.log('📢 Using default voices:', defaultVoices);
      
      if (!selectedVoiceId && defaultVoices.length > 0) {
        onSelect(defaultVoices[0].voice_id);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to get mock voices if API fails
  const getMockVoices = (): Voice[] => {
    return [
      {
        voice_id: "21m00Tcm4TlvDq8ikWAM",
        name: "Rachel",
        preview_url: "https://example.com/voice-preview.mp3",
        category: "premade",
        description: "A friendly and professional female voice"
      },
      {
        voice_id: "AZnzlk1XvdvUeBnXmlld",
        name: "Domi",
        preview_url: "https://example.com/voice-preview.mp3",
        category: "premade",
        description: "An authoritative and clear male voice"
      },
      {
        voice_id: "EXAVITQu4vr4xnSDxMaL",
        name: "Bella",
        preview_url: "https://example.com/voice-preview.mp3",
        category: "premade",
        description: "A warm and engaging female voice"
      },
      {
        voice_id: "ErXwobaYiN019PkySvjV",
        name: "Antoni",
        preview_url: "https://example.com/voice-preview.mp3",
        category: "premade",
        description: "A confident and articulate male voice"
      }
    ];
  };
  
  const playVoiceSample = async (voiceId: string) => {
    // Don't do anything if we're already playing this voice
    if (playingVoice === voiceId) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingVoice(null);
      return;
    }
    
    setPlayingVoice(voiceId);
    
    try {
      // Generate sample text for voice
      const sampleText = "Hello, I'm your AI assistant. How can I help you today?";
      const audioUrl = await voiceService.synthesizeSpeech(sampleText, voiceId);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        
        audioRef.current.onended = () => {
          setPlayingVoice(null);
        };
      }
    } catch (error) {
      console.error('Failed to play voice sample:', error);
      setPlayingVoice(null);
    }
  };
  
  return (
    <div className={`relative w-full ${className}`} data-testid="voice-selector">
      {/* Debug info */}
      {voices.length > 0 && (
        <div className="hidden">Available voices: {voices.map(v => v.name).join(', ')}</div>
      )}
      
      {label && (
        <label className="block text-sm text-gray-300 mb-1">{label}</label>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/15 transition-colors relative z-10"
        data-testid="voice-selector-trigger"
      >
        <div className="flex items-center space-x-2">
          <Volume2 className="w-5 h-5 text-purple-400" />
          <span className="text-sm">{selectedVoice?.name || 'Select a voice'}</span>
        </div>
        <div className={`text-white text-xs bg-white/10 rounded-full w-6 h-6 flex items-center justify-center transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</div>
      </button>
      
      <AnimatePresence initial={false} mode="wait">
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-1 w-full"
            style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
          >
            <GlassCard variant="medium" className="w-full p-0">
              <div 
                className="p-2 max-h-[300px] overflow-y-auto" 
                ref={listRef} 
                data-testid="voice-list"
                style={{ scrollbarWidth: 'thin' }}
              >
                {isLoading ? (
                  <div className="py-4 flex items-center justify-center">
                    <Loader className="w-5 h-5 text-purple-400 animate-spin mr-2" />
                    <span className="text-gray-300">Loading voices...</span>
                  </div>
                ) : voices.length === 0 ? (
                  <div className="py-4 text-center text-gray-300">
                    No voices available. Please check your connection.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {voices.map(voice => (
                      <button
                        key={voice.voice_id}
                        data-voice-id={voice.voice_id}
                        onClick={() => {
                          console.log(`✅ Selected voice: ${voice.name} (${voice.voice_id})`);
                          onSelect(voice.voice_id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg ${
                          selectedVoiceId === voice.voice_id
                            ? 'bg-purple-500/20 border border-purple-500/30'
                            : 'hover:bg-white/10 border border-transparent'
                        } transition-colors mb-1 last:mb-0`}
                      >
                        <div className="flex items-center space-x-2">
                          {selectedVoiceId === voice.voice_id ? (
                            <Check className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Volume className="w-4 h-4 text-gray-400" />
                          )}
                          <div className="text-left">
                            <div className="text-white">{voice.name}</div>
                            {voice.description && (
                              <div className="text-xs text-gray-400">{voice.description}</div>
                            )}
                          </div>
                        </div>
                        
                        <HolographicButton
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            playVoiceSample(voice.voice_id);
                          }}
                        >
                          {playingVoice === voice.voice_id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </HolographicButton>
                      </button>
                    ))}
                  </div>
                )}
                
                {error && (
                  <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}
                
                <audio ref={audioRef} className="hidden" />
              </div>
              
              <div className="flex justify-between pt-3 mt-2 border-t border-white/10">
                <HolographicButton
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Close
                </HolographicButton>
                
                <HolographicButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔄 Manually refreshing voice list');
                    fetchVoices();
                  }}
                >
                  <Loader className="w-4 h-4 mr-1" />
                  Refresh
                </HolographicButton>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};