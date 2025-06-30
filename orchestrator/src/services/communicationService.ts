import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';
import memoryService from './memoryService';
import agentService from './agentService';

/**
 * Service for handling agent-to-agent communication
 */
class CommunicationService {
  private io: Server | null = null;
  private activeSessions: Map<string, {
    agents: Set<string>;
    messages: Message[];
    metadata: Record<string, any>;
    startTime: Date;
    lastActivity: Date;
  }> = new Map();
  
  /**
   * Initialize the communication service with a Socket.IO server
   */
  initialize(io: Server) {
    this.io = io;
    
    // Set up socket.io event handlers
    io.on('connection', (socket) => {
      console.log(`🔌 New socket connection: ${socket.id}`);
      
      // Handle joining a communication session
      socket.on('join-session', async (data: { 
        sessionId: string;
        agentId: string;
        metadata?: Record<string, any>
      }) => {
        await this.joinSession(socket, data);
      });
      
      // Handle sending a message
      socket.on('send-message', async (data: {
        sessionId: string;
        from: string;
        to: string;
        content: string;
        type: MessageType;
        metadata?: Record<string, any>;
      }) => {
        await this.sendMessage(socket, data);
      });
      
      // Handle disconnections
      socket.on('disconnect', () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
      });
    });
    
    console.log('🔄 Communication service initialized with Socket.IO');
    
    // Start periodic cleanup of inactive sessions
    setInterval(() => this.cleanupInactiveSessions(), 3600000); // Every hour
  }
  
  /**
   * Handle a client joining a communication session
   */
  private async joinSession(socket: any, data: {
    sessionId: string;
    agentId: string;
    metadata?: Record<string, any>;
  }) {
    const { sessionId, agentId, metadata } = data;
    
    // Create new session if it doesn't exist
    if (!this.activeSessions.has(sessionId)) {
      this.activeSessions.set(sessionId, {
        agents: new Set<string>(),
        messages: [],
        metadata: metadata || {},
        startTime: new Date(),
        lastActivity: new Date()
      });
      
      console.log(`🔄 Created new communication session: ${sessionId}`);
    }
    
    // Join the session
    const session = this.activeSessions.get(sessionId)!;
    session.agents.add(agentId);
    session.lastActivity = new Date();
    
    // Join the socket room
    socket.join(sessionId);
    
    console.log(`✅ Agent ${agentId} joined session ${sessionId}`);
    
    // Send session history to the new participant
    socket.emit('session-history', {
      sessionId,
      agents: Array.from(session.agents),
      messages: session.messages,
      metadata: session.metadata
    });
    
    // Notify other participants
    socket.to(sessionId).emit('agent-joined', {
      sessionId,
      agentId,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Handle sending a message in a session
   */
  private async sendMessage(socket: any, data: {
    sessionId: string;
    from: string;
    to: string;
    content: string;
    type: MessageType;
    metadata?: Record<string, any>;
  }) {
    const { sessionId, from, to, content, type, metadata } = data;
    
    // Ensure session exists
    if (!this.activeSessions.has(sessionId)) {
      socket.emit('error', { 
        message: 'Session not found',
        code: 'SESSION_NOT_FOUND'
      });
      return;
    }
    
    // Get session
    const session = this.activeSessions.get(sessionId)!;
    session.lastActivity = new Date();
    
    // Create message object
    const message: Message = {
      id: uuid(),
      sessionId,
      from,
      to,
      content,
      type,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    };
    
    // Add to session history
    session.messages.push(message);
    
    // Broadcast to all participants in the session
    if (this.io) {
      this.io.to(sessionId).emit('message', message);
    }
    
    console.log(`✅ Message from ${from} to ${to} in session ${sessionId}`);
    
    // Store in memory service for persistence
    if (from !== 'system') {
      try {
        await memoryService.storeMemory(
          from,
          JSON.stringify({
            type: 'message_sent',
            to,
            content,
            sessionId
          }),
          'communication',
          { 
            sessionId, 
            type, 
            recipientId: to 
          }
        );
      } catch (error) {
        console.error('❌ Failed to store outgoing message in memory:', error);
      }
    }
    
    if (to !== 'broadcast') {
      try {
        await memoryService.storeMemory(
          to,
          JSON.stringify({
            type: 'message_received',
            from,
            content,
            sessionId
          }),
          'communication',
          { 
            sessionId, 
            type, 
            senderId: from 
          }
        );
      } catch (error) {
        console.error('❌ Failed to store incoming message in memory:', error);
      }
    }
    
    // Process the message with the recipient agent if it's a real agent
    if (to !== 'system' && to !== 'broadcast' && type === 'request') {
      this.processAgentMessage(message);
    }
  }
  
  /**
   * Process a message with an agent
   */
  private async processAgentMessage(message: Message) {
    try {
      // Execute the recipient agent with the message content
      const response = await agentService.executeAgent(
        message.to,
        message.content,
        {
          sessionId: message.sessionId,
          senderId: message.from,
          messageId: message.id,
          messageType: message.type,
          messageMetadata: message.metadata
        }
      );
      
      // If response successful, send reply
      if (response && response.output) {
        // Create reply message
        const replyMessage: Message = {
          id: uuid(),
          sessionId: message.sessionId,
          from: message.to,
          to: message.from,
          content: response.output,
          type: 'response',
          metadata: {
            ...message.metadata,
            replyTo: message.id,
            processingTimeMs: Date.now() - new Date(message.timestamp).getTime()
          },
          timestamp: new Date().toISOString()
        };
        
        // Get session
        const session = this.activeSessions.get(message.sessionId);
        
        if (session) {
          // Add to session history
          session.messages.push(replyMessage);
          session.lastActivity = new Date();
          
          // Broadcast to all participants
          if (this.io) {
            this.io.to(message.sessionId).emit('message', replyMessage);
          }
          
          console.log(`✅ Agent ${message.to} replied to ${message.from} in session ${message.sessionId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error processing agent message:', error);
      
      // Send error notification
      if (this.io) {
        this.io.to(message.sessionId).emit('error', {
          messageId: message.id,
          error: 'Failed to process message',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  /**
   * Create a new communication session
   */
  async createSession(
    initialAgents: string[],
    metadata: Record<string, any> = {}
  ): Promise<{ sessionId: string }> {
    const sessionId = `session-${uuid()}`;
    
    // Create session
    this.activeSessions.set(sessionId, {
      agents: new Set<string>(initialAgents),
      messages: [],
      metadata,
      startTime: new Date(),
      lastActivity: new Date()
    });
    
    console.log(`🔄 Created communication session ${sessionId} with ${initialAgents.length} initial agents`);
    
    // Send welcome message from system
    if (this.io) {
      const welcomeMessage: Message = {
        id: uuid(),
        sessionId,
        from: 'system',
        to: 'broadcast',
        content: `Communication session created with ${initialAgents.length} participants`,
        type: 'system',
        timestamp: new Date().toISOString()
      };
      
      this.activeSessions.get(sessionId)!.messages.push(welcomeMessage);
      this.io.to(sessionId).emit('message', welcomeMessage);
    }
    
    return { sessionId };
  }
  
  /**
   * Get session details
   */
  getSession(sessionId: string): SessionDetails | null {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) return null;
    
    return {
      sessionId,
      agents: Array.from(session.agents),
      messageCount: session.messages.length,
      metadata: session.metadata,
      startTime: session.startTime.toISOString(),
      lastActivity: session.lastActivity.toISOString()
    };
  }
  
  /**
   * Get session history
   */
  getSessionHistory(sessionId: string): Message[] {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) return [];
    
    return session.messages;
  }
  
  /**
   * Close a communication session
   */
  async closeSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) return false;
    
    // Send session closed message
    if (this.io) {
      const closedMessage: Message = {
        id: uuid(),
        sessionId,
        from: 'system',
        to: 'broadcast',
        content: `Communication session closed after ${session.messages.length} messages`,
        type: 'system',
        timestamp: new Date().toISOString()
      };
      
      session.messages.push(closedMessage);
      this.io.to(sessionId).emit('message', closedMessage);
      
      // Notify all participants that the session is closed
      this.io.to(sessionId).emit('session-closed', {
        sessionId,
        timestamp: new Date().toISOString(),
        messageCount: session.messages.length
      });
    }
    
    // Remove from active sessions
    this.activeSessions.delete(sessionId);
    
    console.log(`🔄 Closed communication session ${sessionId}`);
    
    return true;
  }
  
  /**
   * Clean up inactive sessions
   */
  private cleanupInactiveSessions() {
    const now = new Date();
    const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [sessionId, session] of this.activeSessions.entries()) {
      const inactiveDuration = now.getTime() - session.lastActivity.getTime();
      
      if (inactiveDuration > inactiveThreshold) {
        console.log(`🧹 Cleaning up inactive session ${sessionId} (inactive for ${inactiveDuration / 3600000} hours)`);
        this.closeSession(sessionId);
      }
    }
  }
}

// Create singleton instance
const communicationService = new CommunicationService();

export default communicationService;

// Type definitions
export type MessageType = 'request' | 'response' | 'broadcast' | 'system';

export interface Message {
  id: string;
  sessionId: string;
  from: string;
  to: string;
  content: string;
  type: MessageType;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface SessionDetails {
  sessionId: string;
  agents: string[];
  messageCount: number;
  metadata: Record<string, any>;
  startTime: string;
  lastActivity: string;
}