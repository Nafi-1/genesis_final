import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam';
import RecordRTC from 'recordrtc';
import { 
  Video, 
  Pause, 
  Play, 
  Camera, 
  CameraOff, 
  X, 
  Settings, 
  RefreshCw,
  Check,
  Download,
  Share2,
  MoreHorizontal,
  Loader,
  MessageSquare,
  Upload,
  Clock
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { videoService, Avatar } from '../../services/videoService';

interface VideoInterfaceProps {
  agentId?: string;
  agentName?: string;
  onCommand?: (command: string) => void;
  onVideoGenerated?: (videoUrl: string) => void;
  isVisible?: boolean;
}

export const VideoInterface: React.FC<VideoInterfaceProps> = ({
  agentId,
  agentName = 'AI Assistant',
  onCommand,
  onVideoGenerated,
  isVisible = true
}) => {
  const [isWebcamEnabled, setIsWebcamEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [scriptText, setScriptText] = useState<string>('');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<RecordRTC | null>(null);
  const generationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isVisible) {
      fetchAvatars();
    }
    
    return () => {
      cleanup();
    };
  }, [isVisible]);

  const fetchAvatars = async () => {
    try {
      const avatarList = await videoService.listAvatars();
      setAvatars(avatarList);
      
      if (avatarList.length > 0) {
        setSelectedAvatar(avatarList[0]);
      }
    } catch (error) {
      console.error('Failed to fetch avatars:', error);
    }
  };

  const handleStartWebcam = async () => {
    setIsWebcamEnabled(true);
  };

  const handleStopWebcam = () => {
    setIsWebcamEnabled(false);
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stopRecording();
      mediaRecorderRef.current = null;
    }
    
    setIsRecording(false);
  };

  const handleStartRecording = () => {
    if (!webcamRef.current?.stream) return;
    
    setIsRecording(true);
    setRecordedVideo(null);
    
    const stream = webcamRef.current.stream;
    
    const options = {
      type: "video" as const,
      mimeType: "video/webm" as "video/webm",
      bitsPerSecond: 128000
    };
    
    mediaRecorderRef.current = new RecordRTC(stream, options);
    mediaRecorderRef.current.startRecording();
  };

  const handleStopRecording = () => {
    if (!mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.stopRecording(() => {
      const blob = mediaRecorderRef.current?.getBlob();
      if (blob) {
        const videoURL = URL.createObjectURL(blob);
        setRecordedVideo(videoURL);
      }
      
      setIsRecording(false);
      mediaRecorderRef.current = null;
    });
  };

  const handleGenerateVideo = async () => {
    if (!selectedAvatar) {
      console.error('No avatar selected');
      return;
    }
    
    if (!scriptText.trim()) {
      console.error('No script text provided');
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // Start a timer to simulate progress
    generationTimerRef.current = window.setInterval(() => {
      setGenerationProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 500);
    
    try {
      // Try to use the agent service directly first
      let result;
      try {
        const agentServiceUrl = import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:8001';
        console.log(`🎬 Attempting to generate video via agent service at ${agentServiceUrl}`);
        
        const response = await fetch(`${agentServiceUrl}/agent/video/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: scriptText,
            avatar_id: selectedAvatar.id,
            metadata: {
              agentId,
              agentName,
              timestamp: new Date().toISOString()
            }
          })
        });
        
        if (response.ok) {
          result = await response.json();
        } else {
          throw new Error(`API responded with status ${response.status}`);
        }
      } catch (error) {
        console.log('Falling back to video service:', error);
        result = await videoService.generateVideo(scriptText, {
          avatarId: selectedAvatar.id,
          metadata: {
            agentId,
            agentName,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      console.log('Video generation initiated:', result);
      
      // Poll for status until complete
      const checkStatus = async () => {
        // Use the correct property from VideoGenerationResult
        let status;
        try {
          const agentServiceUrl = import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:8001';
          const response = await fetch(`${agentServiceUrl}/agent/video/status/${result.video.id}`);
          
          if (response.ok) {
            status = await response.json();
          } else {
            throw new Error(`API responded with status ${response.status}`);
          }
        } catch (error) {
          console.log('Falling back to video service for status check:', error);
          status = await videoService.getVideoStatus(result.video.id);
        }
        
        if (status.status === 'completed' && status.url) {
          clearInterval(generationTimerRef.current!);
          setGenerationProgress(100);
          setGeneratedVideo(status.url);
          setIsGenerating(false);
          
          if (onVideoGenerated) {
            onVideoGenerated(status.url);
          }
        } else if (status.status === 'failed') {
          clearInterval(generationTimerRef.current!);
          setIsGenerating(false);
          console.error('Video generation failed');
        } else {
          // Continue polling
          setTimeout(checkStatus, 5000);
        }
      };
      
      // Start polling after a short delay
      setTimeout(checkStatus, 5000);
      
    } catch (error) {
      console.error('Failed to generate video:', error);
      clearInterval(generationTimerRef.current!);
      setIsGenerating(false);
      
      // For development, simulate a successful generation after a delay
      if (import.meta.env.DEV) {
        setTimeout(() => {
          setGeneratedVideo('https://example.com/mock-video.mp4');
          setGenerationProgress(100);
        }, 10000);
      }
    }
  };

  const handleDownloadVideo = () => {
    if (!generatedVideo) return;
    
    const a = document.createElement('a');
    a.href = generatedVideo;
    a.download = `${agentName.replace(/\s+/g, '-').toLowerCase()}-video.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareVideo = () => {
    if (!generatedVideo) return;
    
    if (navigator.share) {
      navigator.share({
        title: `Video from ${agentName}`,
        text: 'Check out this AI-generated video',
        url: generatedVideo
      }).catch(error => {
        console.error('Error sharing video:', error);
      });
    } else {
      // Fallback - copy link to clipboard
      navigator.clipboard.writeText(generatedVideo)
        .then(() => {
          alert('Video link copied to clipboard!');
        })
        .catch(error => {
          console.error('Failed to copy link:', error);
        });
    }
  };

  const cleanup = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stopRecording();
      mediaRecorderRef.current = null;
    }
    
    if (generationTimerRef.current) {
      clearInterval(generationTimerRef.current);
    }
    
    setIsWebcamEnabled(false);
    setIsRecording(false);
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
            <Video className="w-6 h-6" />
          </HolographicButton>
        ) : (
          <GlassCard variant="medium" className="p-6 overflow-hidden flex flex-col max-h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <motion.div
                  className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center relative overflow-hidden"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Video className="w-5 h-5 text-white relative z-10" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
                
                <div>
                  <h3 className="text-white font-semibold">{isGenerating ? 'Generating Video' : 'Video Avatar'}</h3>
                  <p className="text-xs text-gray-300">
                    {selectedAvatar ? selectedAvatar.name : 'No avatar selected'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto mb-4">
              {/* Avatar Selector */}
              {showAvatarSelector && (
                <div className="mb-4">
                  <h4 className="text-white text-sm font-medium mb-2">Select Avatar</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {avatars.map(avatar => (
                      <button
                        key={avatar.id}
                        onClick={() => {
                          setSelectedAvatar(avatar);
                          setShowAvatarSelector(false);
                        }}
                        className={`flex flex-col items-center p-2 rounded-lg border ${
                          selectedAvatar?.id === avatar.id 
                            ? 'border-purple-500 bg-purple-500/20' 
                            : 'border-white/10 hover:bg-white/10'
                        } transition-colors`}
                      >
                        <img 
                          src={avatar.thumbnailUrl} 
                          alt={avatar.name}
                          className="w-16 h-16 object-cover rounded-lg mb-2"
                        />
                        <span className="text-xs text-white font-medium">{avatar.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Video Preview */}
              <div className="relative rounded-xl overflow-hidden bg-black/30 aspect-video mb-4">
                {isWebcamEnabled && !recordedVideo && !generatedVideo ? (
                  <Webcam
                    ref={webcamRef}
                    audio={true}
                    muted={true}
                    className="w-full h-full object-cover"
                  />
                ) : recordedVideo ? (
                  <video
                    src={recordedVideo}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : generatedVideo ? (
                  <video
                    src={generatedVideo}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    {selectedAvatar ? (
                      <img 
                        src={selectedAvatar.thumbnailUrl} 
                        alt={selectedAvatar.name}
                        className="w-full h-full object-cover opacity-70"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <Video className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No video available</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-2 right-2 flex items-center bg-red-500/80 text-white text-xs py-1 px-2 rounded-full">
                    <div className="w-2 h-2 bg-red-100 rounded-full mr-1 animate-pulse" />
                    Recording
                  </div>
                )}
                
                {/* Generation Progress */}
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <Loader className="w-10 h-10 text-purple-400 animate-spin mb-2" />
                    <p className="text-white text-sm mb-2">Generating video...</p>
                    <div className="w-3/4 bg-white/20 rounded-full h-2 mb-1">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-300">{Math.round(generationProgress)}%</p>
                  </div>
                )}
              </div>
              
              {/* Script Input */}
              <div className="mb-4">
                <h4 className="text-white text-sm font-medium mb-2">Script Text</h4>
                <textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Enter what you want the avatar to say..."
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[100px]"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col space-y-2">
              {/* Top Controls */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <HolographicButton
                    variant={isWebcamEnabled ? "primary" : "outline"}
                    size="sm"
                    onClick={isWebcamEnabled ? handleStopWebcam : handleStartWebcam}
                    disabled={isGenerating}
                  >
                    {isWebcamEnabled ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  </HolographicButton>
                  
                  <HolographicButton
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                    disabled={isGenerating}
                  >
                    <Settings className="w-4 h-4" />
                  </HolographicButton>
                </div>
                
                <div className="flex space-x-2">
                  {generatedVideo && (
                    <>
                      <HolographicButton
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadVideo}
                      >
                        <Download className="w-4 h-4" />
                      </HolographicButton>
                      
                      <HolographicButton
                        variant="outline"
                        size="sm"
                        onClick={handleShareVideo}
                      >
                        <Share2 className="w-4 h-4" />
                      </HolographicButton>
                    </>
                  )}
                </div>
              </div>
              
              {/* Bottom Controls - Recording/Generation */}
              <div className="flex justify-center">
                {isWebcamEnabled ? (
                  // Webcam recording controls
                  <HolographicButton
                    variant={isRecording ? "primary" : "outline"}
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    glow={isRecording}
                    disabled={isGenerating}
                  >
                    {isRecording ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </HolographicButton>
                ) : (
                  // AI Video generation controls
                  <HolographicButton
                    variant="primary"
                    onClick={handleGenerateVideo}
                    glow
                    disabled={isGenerating || !scriptText.trim() || !selectedAvatar}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : generatedVideo ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Generate Video
                      </>
                    )}
                  </HolographicButton>
                )}
              </div>
            </div>
          </GlassCard>
        )}
      </motion.div>
    </AnimatePresence>
  );
};