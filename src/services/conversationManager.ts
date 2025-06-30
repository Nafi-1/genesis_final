import { v4 as uuid } from 'uuid';
import { voiceService, Voice } from './voiceService';
import { videoService, Avatar } from './videoService';
import { api } from '../lib/api';

export interface ConversationConfig {
  guild: {
    id: string;
    name: string;
    personality?: string;
    profile?: string;
  };
  voice?: {
    enabled: boolean;
    voiceId?: string;
    stability?: number;
    similarity?: number;
    style?: number;
  };
  video?: {
    enabled: boolean;
    avatarId?: string;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audio?: string;  // Base64 audio data
  video?: string;  // Video URL
  metadata?: Record<string, any>; // Additional metadata (e.g., videoId, thumbnailUrl)
}

export interface Session {
  id: string;
  guildId: string;
  messages: Message[];
  config: ConversationConfig;
  startTime: Date;
  endTime?: Date;
  active: boolean;
}

/**
 * Service for managing voice/video conversations with agents
 */
export class ConversationManager {
  private static instance: ConversationManager;
  private activeSessions: Map<string, Session> = new Map();
  private voiceConfig: Map<string, {voiceId: string, config: any}> = new Map();
  private videoConfig: Map<string, {avatarId: string, config: any}> = new Map();
  private eventListeners: Map<string, Set<(event: any) => void>> = new Map();

  private constructor() {}

  public static getInstance(): ConversationManager {
    if (!ConversationManager.instance) {
      ConversationManager.instance = new ConversationManager();
    }
    return ConversationManager.instance;
  }

  /**
   * Initialize a conversation session
   */
  public async initializeConversation(config: ConversationConfig): Promise<Session> {
    try {
      const sessionId = uuid();
      
      // Set up voice configuration if enabled
      if (config.voice?.enabled) {
        await this.setupVoiceConfig(sessionId, config);
      }
      
      // Set up video configuration if enabled
      if (config.video?.enabled) {
        await this.setupVideoConfig(sessionId, config);
      }
      
      // Create a new session
      const session: Session = {
        id: sessionId,
        guildId: config.guild.id,
        messages: [],
        config,
        startTime: new Date(),
        active: true
      };
      
      this.activeSessions.set(sessionId, session);
      
      // Add initial system message
      await this.addSystemMessage(
        sessionId,
        `Conversation with ${config.guild.name} started.`
      );
      
      return session;
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      throw new Error('Failed to initialize conversation');
    }
  }

  /**
   * Set up voice configuration
   */
  private async setupVoiceConfig(sessionId: string, config: ConversationConfig): Promise<void> {
    try {
      // Get voice ID from config or select a default
      let voiceId = config.voice?.voiceId;
      
      // If no voice ID provided, get available voices and select one
      if (!voiceId) {
        const voices = await voiceService.listVoices();
        if (voices.length > 0) {
          // Select a voice - could be more sophisticated based on guild personality
          voiceId = voices[0].voice_id;
        } else {
          throw new Error('No voices available');
        }
      }
      
      // Store voice configuration
      this.voiceConfig.set(sessionId, {
        voiceId,
        config: {
          stability: config.voice?.stability || 0.5,
          similarity: config.voice?.similarity || 0.75,
          style: config.voice?.style || 0.0
        }
      });
      
      console.log(`✅ Voice configuration set up for session ${sessionId}`);
    } catch (error) {
      console.error('Failed to set up voice configuration:', error);
      throw error;
    }
  }

  /**
   * Set up video configuration
   */
  private async setupVideoConfig(sessionId: string, config: ConversationConfig): Promise<void> {
    try {
      // Get avatar ID from config or select a default
      let avatarId = config.video?.avatarId;
      
      // If no avatar ID provided, get available avatars and select one
      if (!avatarId) {
        const avatars = await videoService.listAvatars();
        if (avatars.length > 0) {
          // Select an avatar - could be more sophisticated based on guild profile
          avatarId = avatars[0].id;
        } else {
          throw new Error('No avatars available');
        }
      }
      
      // Store video configuration
      this.videoConfig.set(sessionId, {
        avatarId,
        config: {}
      });
      
      console.log(`✅ Video configuration set up for session ${sessionId}`);
    } catch (error) {
      console.error('Failed to set up video configuration:', error);
      throw error;
    }
  }

  /**
   * Send a message in a conversation
   */
  public async sendMessage(sessionId: string, content: string): Promise<Message> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      
      // Create user message
      const message: Message = {
        id: uuid(),
        role: 'user',
        content,
        timestamp: new Date()
      };
      
      // Add to session
      session.messages.push(message);
      
      // Emit event
      this.emit('messageSent', {
        sessionId,
        message
      });
      
      // Generate response
      const response = await this.generateResponse(session, message);
      
      return message;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Generate a response to a user message
   */
  private async generateResponse(session: Session, userMessage: Message): Promise<Message> {
    try {
      const { guildId } = session;
      
      // Get response from agent service
      const response = await api.post(`/agent/${guildId}/chat`, {
        message: userMessage.content,
        session_id: session.id,
        history: session.messages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role,
            content: m.content
          }))
      });
      
      // Create assistant message
      const message: Message = {
        id: uuid(),
        role: 'assistant',
        content: response.data.response || 'I\'m not sure how to respond to that.',
        timestamp: new Date()
      };
      
      // Generate audio if voice is enabled
      if (session.config.voice?.enabled) {
        try {
          const voiceConfig = this.voiceConfig.get(session.id);
          if (voiceConfig) {
            const audio = await voiceService.synthesizeSpeech(
              message.content,
              voiceConfig.voiceId,
              {
                stability: voiceConfig.config.stability,
                similarityBoost: voiceConfig.config.similarity,
                style: voiceConfig.config.style
              }
            );
            
            message.audio = audio;
          }
        } catch (error) {
          console.error('Failed to synthesize speech:', error);
        }
      }
      
      // Generate video if video is enabled
      if (session.config.video?.enabled) {
        try {
          const videoConfig = this.videoConfig.get(session.id);
          if (videoConfig) {
            const videoResult = await videoService.generateVideo(
              message.content,
              {
                avatarId: videoConfig.avatarId
              }
            );
            
            if (videoResult.success && videoResult.video) {
              // Store the video ID for status checking
              message.metadata = {
                ...message.metadata,
                videoId: videoResult.video.id
              };
              
              // Set thumbnail URL if available
              if (videoResult.video.thumbnail_url) {
                message.metadata = {
                  ...message.metadata,
                  thumbnailUrl: videoResult.video.thumbnail_url
                };
              }
              
              // Check status in a few seconds
              setTimeout(() => {
                this.checkVideoStatus(session.id, message.id, videoResult.video.id);
              }, 5000);
            }
          }
        } catch (error) {
          console.error('Failed to generate video:', error);
        }
      }
      
      // Add to session
      session.messages.push(message);
      
      // Emit event
      this.emit('messageReceived', {
        sessionId: session.id,
        message
      });
      
      return message;
    } catch (error) {
      console.error('Failed to generate response:', error);
      
      // Create error message
      const errorMessage: Message = {
        id: uuid(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again later.',
        timestamp: new Date()
      };
      
      // Add to session
      session.messages.push(errorMessage);
      
      // Emit event
      this.emit('messageError', {
        sessionId: session.id,
        message: errorMessage,
        error
      });
      
      return errorMessage;
    }
  }

  /**
   * Check the status of a generated video
   */
  private async checkVideoStatus(sessionId: string, messageId: string, videoId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) return;
      
      const messageIndex = session.messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) return;
      
      // Get video status
      const status = await videoService.getVideoStatus(videoId);
      
      if (status.status === 'completed' && status.url) {
        // Update the message with the video URL
        const updatedMessage = {
          ...session.messages[messageIndex],
          video: status.url
        };
        
        session.messages[messageIndex] = updatedMessage;
        
        // Emit event
        this.emit('videoReady', {
          sessionId,
          messageId,
          videoUrl: status.url
        });
      } else if (status.status === 'processing') {
        // Check again in a few seconds
        setTimeout(() => {
          this.checkVideoStatus(sessionId, messageId, videoId);
        }, 5000);
      } else if (status.status === 'failed') {
        logger.error(`Video generation failed: ${status.error || 'Unknown error'}`);
        
        // Emit event
        this.emit('videoError', {
          sessionId,
          messageId,
          error: status.error
        });
      }
    } catch (error) {
      console.error('Failed to check video status:', error);
    }
  }

  /**
   * Add a system message to a conversation
   */
  public async addSystemMessage(sessionId: string, content: string): Promise<Message> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    const message: Message = {
      id: uuid(),
      role: 'system',
      content,
      timestamp: new Date()
    };
    
    session.messages.push(message);
    
    return message;
  }

  /**
   * End a conversation
   */
  public endConversation(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    session.active = false;
    session.endTime = new Date();
    
    // Clean up resources
    this.voiceConfig.delete(sessionId);
    this.videoConfig.delete(sessionId);
    
    // Emit event
    this.emit('conversationEnded', {
      sessionId,
      duration: session.endTime.getTime() - session.startTime.getTime()
    });
  }

  /**
   * Get a conversation session
   */
  public getSession(sessionId: string): Session {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    
    return session;
  }

  /**
   * Get all sessions for a guild
   */
  public getSessionsForGuild(guildId: string): Session[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.guildId === guildId);
  }

  /**
   * Event system
   */
  public on(event: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(listener);
  }

  public off(event: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(event)) return;
    
    this.eventListeners.get(event)!.delete(listener);
  }

  private emit(event: string, data: any): void {
    if (!this.eventListeners.has(event)) return;
    
    for (const listener of this.eventListeners.get(event)!) {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }
  }
}

// Export singleton instance
export const conversationManager = ConversationManager.getInstance();

// Simple logger
const logger = {
  info: console.info,
  error: console.error,
  warn: console.warn,
  debug: console.debug
};