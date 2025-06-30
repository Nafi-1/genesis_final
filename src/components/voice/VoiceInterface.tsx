import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Brain, AudioWaveform as Waveform, Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { voiceService } from '../../services/voiceService';

interface VoiceInterfaceProps {
  agentId?: string;
  agentName?: string;
  onCommand?: (command: string) => void;
  isVisible?: boolean;
}

interface VoiceMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  agentId,
  agentName = 'AI Assistant',
  onCommand,
  isVisible = true
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    voiceId: '',
    stability: 0.6,
    similarityBoost: 0.8,
    style: 0.3
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  
  // Initialize WebSocket connection for real-time voice
  useEffect(() => {
    if (isVisible) {
      initializeVoiceInterface();
    }
    
    return () => {
      cleanup();
    };
  }, [isVisible, agentId]);

  const initializeVoiceInterface = async () => {
    try {
      // Initialize WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:8000/api/voice/chat/user-${Date.now()}`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        addSystemMessage('Voice interface connected');
      };
      
      wsRef.current.onmessage = handleWebSocketMessage;
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        addSystemMessage('Voice interface disconnected');
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        addSystemMessage('Connection error - using fallback mode');
      };

      // Initialize speech recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = handleSpeechResult;
        recognitionRef.current.onerror = handleSpeechError;
        recognitionRef.current.onend = () => setIsListening(false);
      }

    } catch (error) {
      console.error('Voice interface initialization failed:', error);
      addSystemMessage('Voice features may be limited');
    }
  };

  const handleWebSocketMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'voice_response':
          handleVoiceResponse(message);
          break;
        case 'agent_voice_response':
          handleAgentVoiceResponse(message);
          break;
        case 'text_response':
        case 'agent_text_response':
          handleTextResponse(message);
          break;
        case 'error':
          addSystemMessage(`Error: ${message.message}`);
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  const handleVoiceResponse = (message: any) => {
    addMessage('agent', message.text);
    
    if (message.audio) {
      playAudioResponse(message.audio);
    }
  };

  const handleAgentVoiceResponse = (message: any) => {
    addMessage('agent', message.text, message.agent_name);
    
    if (message.audio) {
      playAudioResponse(message.audio);
    }
  };

  const handleTextResponse = (message: any) => {
    const agentDisplayName = message.agent_name || agentName;
    addMessage('agent', message.text, agentDisplayName);
  };

  const playAudioResponse = async (audioBase64: string) => {
    try {
      setIsSpeaking(true);
      
      const audioBlob = base64ToBlob(audioBase64, 'audio/mpeg');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsSpeaking(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const startListening = async () => {
    try {
      if (recognitionRef.current) {
        setIsListening(true);
        recognitionRef.current.start();
        
        // Start audio level monitoring
        await initializeAudioMonitoring();
      } else {
        addSystemMessage('Speech recognition not supported in this browser');
      }
    } catch (error) {
      console.error('Failed to start listening:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
  };

  const initializeAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      monitorAudioLevel();
    } catch (error) {
      console.error('Audio monitoring setup failed:', error);
    }
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (analyserRef.current && isListening) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  const handleSpeechResult = (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0].transcript)
      .join('');
    
    if (event.results[event.results.length - 1].isFinal) {
      processVoiceCommand(transcript);
    }
  };

  const handleSpeechError = (event: any) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
    
    if (event.error === 'no-speech') {
      addSystemMessage('No speech detected. Try speaking again.');
    } else {
      addSystemMessage(`Speech recognition error: ${event.error}`);
    }
  };

  const processVoiceCommand = (transcript: string) => {
    addMessage('user', transcript);
    
    if (onCommand) {
      onCommand(transcript);
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = agentId ? {
        type: 'agent_chat',
        agent_id: agentId,
        text: transcript
      } : {
        type: 'voice_command',
        command: transcript,
        context: { interface: 'canvas' }
      };
      
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const addMessage = (type: 'user' | 'agent' | 'system', content: string, sender?: string) => {
    const message: VoiceMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type,
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev.slice(-4), message]); // Keep last 5 messages
  };

  const addSystemMessage = (content: string) => {
    addMessage('system', content);
  };

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setIsListening(false);
    setIsConnected(false);
    setIsSpeaking(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`fixed ${isMinimized ? 'bottom-20 right-4' : 'bottom-20 right-4 w-96 max-h-[80vh]'} z-40`}
      >
        {isMinimized ? (
          <HolographicButton
            onClick={() => setIsMinimized(false)}
            className="w-16 h-16 rounded-full"
            glow
          >
            <Mic className="w-6 h-6" />
          </HolographicButton>
        ) : (
          <GlassCard variant="medium" className="p-6 overflow-hidden flex flex-col max-h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center relative overflow-hidden"
                  animate={{ 
                    scale: isSpeaking ? [1, 1.1, 1] : 1,
                    rotate: isListening ? 360 : 0
                  }}
                  transition={{ 
                    scale: { duration: 0.5, repeat: isSpeaking ? Infinity : 0 },
                    rotate: { duration: 2, repeat: isListening ? Infinity : 0, ease: "linear" }
                  }}
                >
                  <Brain className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-white font-semibold">{agentName}</h3>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-xs text-gray-300">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  ₋
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-3 mb-4 max-h-32 overflow-y-auto">
              {messages.slice(-3).map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm ${
                    message.type === 'user' 
                      ? 'text-blue-300 text-right' 
                      : message.type === 'agent'
                      ? 'text-white'
                      : 'text-gray-400 italic'
                  }`}
                >
                  {message.type === 'user' && '🗣️ '}
                  {message.type === 'agent' && '🤖 '}
                  {message.content}
                </motion.div>
              ))}
            </div>

            {/* Audio Level Indicator */}
            {isListening && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4"
              >
                <div className="flex items-center space-x-2">
                  <Waveform className="w-4 h-4 text-blue-400" />
                  <div className="flex-1 bg-white/10 rounded-full h-2">
                    <motion.div
                      className="h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                      style={{ width: `${audioLevel * 100}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <span className="text-xs text-gray-300">{Math.round(audioLevel * 100)}%</span>
                </div>
              </motion.div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HolographicButton
                  onClick={isListening ? stopListening : startListening}
                  variant={isListening ? "primary" : "outline"}
                  size="sm"
                  glow={isListening}
                  disabled={!isConnected}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </HolographicButton>
                
                <HolographicButton
                  onClick={() => setIsSpeaking(!isSpeaking)}
                  variant="ghost"
                  size="sm"
                  disabled={!isConnected}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </HolographicButton>
              </div>
              
              <div className="text-xs text-gray-400">
                {isListening ? 'Listening...' : 
                 isSpeaking ? 'Speaking...' : 
                 isConnected ? 'Ready' : 'Connecting...'}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (onCommand) onCommand('show me performance analytics');
                  }}
                  className="text-xs text-gray-300 hover:text-white transition-colors p-2 rounded border border-white/10 hover:border-white/20"
                >
                  📊 Show Analytics
                </button>
                <button
                  onClick={() => {
                    if (onCommand) onCommand('save current canvas');
                  }}
                  className="text-xs text-gray-300 hover:text-white transition-colors p-2 rounded border border-white/10 hover:border-white/20"
                >
                  💾 Save Canvas
                </button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          onEnded={() => setIsSpeaking(false)}
          onError={() => setIsSpeaking(false)}
        />
      </motion.div>
    </AnimatePresence>
  );
};