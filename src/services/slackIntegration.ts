import { api } from '../lib/api';
import { v4 as uuid } from 'uuid';

export interface SlackChannel {
  id: string;
  name: string;
}

export interface SlackMessage {
  id: string;
  text: string;
  blocks?: any[];
  channel: string;
  timestamp: string;
  sender?: string;
}

export interface SlackIntegrationConfig {
  webhookUrl?: string;
  botToken?: string;
  defaultChannel?: string;
  signingSecret?: string;
  teamId?: string;
}

/**
 * Manages Slack integration for GenesisOS
 */
export class SlackIntegration {
  private static instance: SlackIntegration;
  private webhookUrl?: string;
  private botToken?: string;
  private defaultChannel: string = 'general';
  private signingSecret?: string;
  private isConnected: boolean = false;
  private messageListeners: Set<(message: SlackMessage) => Promise<void>> = new Set();

  private constructor() {}

  public static getInstance(): SlackIntegration {
    if (!SlackIntegration.instance) {
      SlackIntegration.instance = new SlackIntegration();
    }
    return SlackIntegration.instance;
  }

  /**
   * Initialize the Slack integration
   */
  public async initialize(config: SlackIntegrationConfig): Promise<boolean> {
    try {
      // Store configuration
      this.webhookUrl = config.webhookUrl;
      this.botToken = config.botToken;
      this.defaultChannel = config.defaultChannel || 'general';
      this.signingSecret = config.signingSecret;
      
      // Validate configuration
      if (!this.webhookUrl && !this.botToken) {
        throw new Error('Either webhookUrl or botToken is required');
      }
      
      // Test connection
      await this.test();
      
      // Setup message event handlers if bot token is provided
      if (this.botToken) {
        this.setupEventHandlers();
      }
      
      this.isConnected = true;
      console.log('✅ Slack integration initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Slack integration:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Test the Slack connection
   */
  public async test(): Promise<boolean> {
    try {
      if (this.webhookUrl) {
        // Test webhook URL
        await this.sendMessage({
          text: 'GenesisOS Slack integration test message',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*GenesisOS Slack Integration Test*'
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'This is a test message to verify the Slack integration is working correctly.'
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `_Test timestamp: ${new Date().toISOString()}_`
                }
              ]
            }
          ]
        });
        
        return true;
      } else if (this.botToken) {
        // Test bot token by listing channels
        const response = await fetch('https://slack.com/api/conversations.list', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.botToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (!data.ok) {
          throw new Error(`Slack API error: ${data.error}`);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to test Slack integration:', error);
      return false;
    }
  }

  /**
   * Send a message to a Slack channel
   */
  public async sendMessage(
    options: {
      text: string;
      blocks?: any[];
      channel?: string;
      thread_ts?: string;
    }
  ): Promise<SlackMessage | null> {
    try {
      if (!this.isConnected) {
        throw new Error('Slack integration not connected');
      }
      
      const channel = options.channel || this.defaultChannel;
      
      if (this.webhookUrl) {
        // Use webhook
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: options.text,
            blocks: options.blocks,
            channel: channel.startsWith('#') ? channel : `#${channel}`
          })
        });
        
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Slack webhook error: ${response.status} ${text}`);
        }
        
        return {
          id: uuid(),
          text: options.text,
          blocks: options.blocks,
          channel,
          timestamp: new Date().toISOString(),
          sender: 'GenesisOS'
        };
      } else if (this.botToken) {
        // Use bot token
        const response = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.botToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: options.text,
            blocks: options.blocks,
            channel,
            thread_ts: options.thread_ts
          })
        });
        
        const data = await response.json();
        
        if (!data.ok) {
          throw new Error(`Slack API error: ${data.error}`);
        }
        
        return {
          id: data.ts,
          text: options.text,
          blocks: options.blocks,
          channel,
          timestamp: data.ts,
          sender: 'GenesisOS'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to send message to Slack:', error);
      return null;
    }
  }

  /**
   * Update a message in Slack
   */
  public async updateMessage(
    options: {
      channel: string;
      ts: string;
      text: string;
      blocks?: any[];
    }
  ): Promise<SlackMessage | null> {
    try {
      if (!this.isConnected || !this.botToken) {
        throw new Error('Slack bot not connected');
      }
      
      const response = await fetch('https://slack.com/api/chat.update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: options.channel,
          ts: options.ts,
          text: options.text,
          blocks: options.blocks
        })
      });
      
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }
      
      return {
        id: options.ts,
        text: options.text,
        blocks: options.blocks,
        channel: options.channel,
        timestamp: options.ts,
        sender: 'GenesisOS'
      };
    } catch (error) {
      console.error('Failed to update Slack message:', error);
      return null;
    }
  }

  /**
   * Set up event handlers for real-time messaging
   */
  private setupEventHandlers(): void {
    // In a real implementation, this would set up a WebSocket connection
    // or event API listener for Slack events
    
    console.log('📣 Setting up Slack event handlers');
    
    // Since we're using webhooks, we would register an endpoint to receive events
    
    // For this demo, we'll simulate incoming messages
    setTimeout(async () => {
      // Create a simulated incoming message
      const message: SlackMessage = {
        id: uuid(),
        text: 'Hello from Slack! Ready for your GenesisOS demo.',
        channel: this.defaultChannel,
        timestamp: new Date().toISOString(),
        sender: 'U12345678'
      };
      
      // Notify listeners
      await this.notifyMessageListeners(message);
    }, 3000);
    
    // And another simulated message after 15 seconds
    setTimeout(async () => {
      // Create a simulated incoming message
      const message: SlackMessage = {
        id: uuid(),
        text: 'How can I help test your intelligent agent capabilities today?',
        channel: this.defaultChannel,
        timestamp: new Date().toISOString(),
        sender: 'U12345678'
      };
      
      // Notify listeners
      await this.notifyMessageListeners(message);
    }, 15000);
  }

  /**
   * Register a message listener
   */
  public onMessage(listener: (message: SlackMessage) => Promise<void>): () => void {
    this.messageListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  /**
   * Notify all message listeners
   */
  private async notifyMessageListeners(message: SlackMessage): Promise<void> {
    for (const listener of this.messageListeners) {
      try {
        await listener(message);
      } catch (error) {
        console.error('Error in Slack message listener:', error);
      }
    }
  }

  /**
   * List channels
   */
  public async listChannels(): Promise<SlackChannel[]> {
    try {
      if (!this.isConnected || !this.botToken) {
        throw new Error('Slack bot not connected');
      }
      
      const response = await fetch('https://slack.com/api/conversations.list', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }
      
      return data.channels.map((channel: any) => ({
        id: channel.id,
        name: channel.name
      }));
    } catch (error) {
      console.error('Failed to list Slack channels:', error);
      return [];
    }
  }

  /**
   * Get connection status
   */
  public isConfigured(): boolean {
    return Boolean(this.webhookUrl || this.botToken);
  }
}

// Export singleton instance
export const slackIntegration = SlackIntegration.getInstance();