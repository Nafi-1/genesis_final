import { v4 as uuid } from 'uuid';
import { api } from '../lib/api';

// Trigger system types
export type TriggerConditionType = 'schedule' | 'webhook' | 'event' | 'threshold';

export interface TriggerCondition {
  type: TriggerConditionType;
  config: Record<string, any>;
}

export interface TriggerAction {
  type: string;
  target: string;
  payload: Record<string, any>;
}

export interface Trigger {
  id: string;
  guildId: string;
  agentId?: string;
  name: string;
  description?: string;
  condition: TriggerCondition;
  action: TriggerAction;
  status: 'active' | 'inactive';
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// Event bus for trigger system
class EventBus {
  private listeners: Record<string, Array<(data: any) => Promise<void>>> = {};

  on(eventType: string, callback: (data: any) => Promise<void>): void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
  }

  off(eventType: string, callback: (data: any) => Promise<void>): void {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType] = this.listeners[eventType].filter(
      cb => cb !== callback
    );
  }

  async emit(eventType: string, data: any): Promise<void> {
    if (!this.listeners[eventType]) return;
    
    await Promise.all(
      this.listeners[eventType].map(callback => callback(data))
    );
  }
}

// Singleton event bus
export const eventBus = new EventBus();

/**
 * Service for managing and executing triggers
 */
export class TriggerService {
  private static instance: TriggerService;
  private activeTriggers: Map<string, Trigger> = new Map();
  private db: any; // Replace with actual DB service

  private constructor() {
    // Initialize
    this.loadExistingTriggers();
  }

  public static getInstance(): TriggerService {
    if (!TriggerService.instance) {
      TriggerService.instance = new TriggerService();
    }
    return TriggerService.instance;
  }

  /**
   * Load existing triggers from database
   */
  private async loadExistingTriggers(): Promise<void> {
    try {
      // In a real implementation, fetch from database
      // For now, we'll simulate with a timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ Loaded existing triggers');
    } catch (error) {
      console.error('Failed to load existing triggers:', error);
    }
  }

  /**
   * Create a new trigger
   */
  public async createTrigger(triggerData: Omit<Trigger, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trigger> {
    try {
      const trigger: Trigger = {
        ...triggerData,
        id: uuid(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store in database
      try {
        // In a real implementation, store in database
        // For now, add to in-memory map
        this.activeTriggers.set(trigger.id, trigger);
        
        // Initialize trigger listener
        await this.initializeTriggerListener(trigger);
        
        console.log(`✅ Created trigger: ${trigger.name} (${trigger.id})`);
        return trigger;
      } catch (error) {
        console.error('Failed to create trigger:', error);
        throw new Error('Failed to create trigger');
      }
    } catch (error) {
      console.error('Error in createTrigger:', error);
      throw error;
    }
  }

  /**
   * Initialize event listeners for a trigger
   */
  private async initializeTriggerListener(trigger: Trigger): Promise<void> {
    const { condition } = trigger;
    
    switch (condition.type) {
      case 'schedule':
        this.setupScheduleTrigger(trigger);
        break;
      case 'webhook':
        this.setupWebhookTrigger(trigger);
        break;
      case 'event':
        this.setupEventTrigger(trigger);
        break;
      case 'threshold':
        this.setupThresholdTrigger(trigger);
        break;
      default:
        console.warn(`Unsupported trigger condition type: ${condition.type}`);
    }
  }

  /**
   * Set up a schedule-based trigger
   */
  private setupScheduleTrigger(trigger: Trigger): void {
    const { condition, id } = trigger;
    const { schedule } = condition.config;
    
    // For now, we'll use a simple interval for demonstration
    // In production, use a proper scheduling library
    const intervalMs = this.parseScheduleToMs(schedule);
    
    if (intervalMs) {
      const intervalId = setInterval(() => {
        this.executeTriggerAction(trigger);
      }, intervalMs);
      
      // Store interval ID for cleanup
      trigger.metadata = {
        ...trigger.metadata,
        intervalId
      };
    }
  }

  /**
   * Parse schedule string to milliseconds
   */
  private parseScheduleToMs(schedule: string): number | null {
    // Simple parsing for demo - would be more robust in production
    if (schedule === 'every_minute') return 60 * 1000;
    if (schedule === 'every_hour') return 60 * 60 * 1000;
    if (schedule === 'every_day') return 24 * 60 * 60 * 1000;
    
    // For cron-like expressions, would use a proper cron parser
    return null;
  }

  /**
   * Set up a webhook-based trigger
   */
  private setupWebhookTrigger(trigger: Trigger): void {
    // In a real implementation, this would register a webhook endpoint
    // For now, we'll just add a listener to the event bus
    eventBus.on(`webhook:${trigger.id}`, async (data) => {
      if (this.evaluateCondition(trigger.condition, data)) {
        await this.executeTriggerAction(trigger);
      }
    });
  }

  /**
   * Set up an event-based trigger
   */
  private setupEventTrigger(trigger: Trigger): void {
    const { condition } = trigger;
    const { eventType } = condition.config;
    
    eventBus.on(eventType, async (event) => {
      if (this.evaluateCondition(trigger.condition, event)) {
        await this.executeTriggerAction(trigger);
      }
    });
  }

  /**
   * Set up a threshold-based trigger
   */
  private setupThresholdTrigger(trigger: Trigger): void {
    const { condition } = trigger;
    const { metric, threshold, operator } = condition.config;
    
    // Subscribe to metric updates
    eventBus.on(`metric:${metric}`, async (value) => {
      if (this.evaluateThreshold(value, threshold, operator)) {
        await this.executeTriggerAction(trigger);
      }
    });
  }

  /**
   * Create a Slack message trigger
   */
  public async createSlackMessageTrigger(
    guildId: string,
    webhookUrl: string,
    agentId: string,
    name: string
  ): Promise<Trigger> {
    // Create trigger data
    const triggerData: Omit<Trigger, 'id' | 'createdAt' | 'updatedAt'> = {
      guildId,
      agentId,
      name: name || 'Slack Message Trigger',
      description: 'Sends a message to Slack when triggered',
      condition: {
        type: 'event',
        config: {
          eventType: 'agent_response',
          filters: {
            agent_id: agentId
          }
        }
      },
      action: {
        type: 'webhook',
        target: webhookUrl,
        payload: {
          text: "Agent {{agent_name}} responded: {{response_text}}",
          channel: "general",
          username: "GenesisOS Bot",
          icon_emoji: ":robot_face:"
        }
      },
      status: 'active'
    };
    
    // Create the trigger
    return await this.createTrigger(triggerData);
  }
  
  /**
   * Create a scheduled trigger
   */
  public async createScheduledTrigger(
    guildId: string,
    agentId: string,
    name: string,
    schedule: string,
    input: string
  ): Promise<Trigger> {
    // Create trigger data
    const triggerData: Omit<Trigger, 'id' | 'createdAt' | 'updatedAt'> = {
      guildId,
      agentId,
      name: name || 'Scheduled Trigger',
      description: 'Executes an agent on a schedule',
      condition: {
        type: 'schedule',
        config: {
          schedule
        }
      },
      action: {
        type: 'agent_execute',
        target: agentId,
        payload: {
          input,
          context: {
            scheduled: true,
            trigger_id: uuid()
          }
        }
      },
      status: 'active'
    };
    
    // Create the trigger
    return await this.createTrigger(triggerData);
  }
  
  /**
   * Create a webhook trigger
   */
  public async createWebhookTrigger(
    guildId: string,
    agentId: string,
    name: string,
    path: string
  ): Promise<Trigger> {
    // Create trigger data
    const triggerData: Omit<Trigger, 'id' | 'createdAt' | 'updatedAt'> = {
      guildId,
      agentId,
      name: name || 'Webhook Trigger',
      description: 'Executes an agent when a webhook is received',
      condition: {
        type: 'webhook',
        config: {
          path
        }
      },
      action: {
        type: 'agent_execute',
        target: agentId,
        payload: {
          input: "{{webhook_body}}",
          context: {
            webhook_data: true,
            trigger_id: uuid()
          }
        }
      },
      status: 'active'
    };
    
    // Create the trigger
    return await this.createTrigger(triggerData);
  }
  
  /**
   * Create a threshold trigger
   */
  public async createThresholdTrigger(
    guildId: string,
    agentId: string,
    name: string,
    metric: string,
    threshold: number,
    operator: string
  ): Promise<Trigger> {
    // Create trigger data
    const triggerData: Omit<Trigger, 'id' | 'createdAt' | 'updatedAt'> = {
      guildId,
      agentId,
      name: name || 'Threshold Trigger',
      description: 'Executes an agent when a metric exceeds a threshold',
      condition: {
        type: 'threshold',
        config: {
          metric,
          threshold,
          operator
        }
      },
      action: {
        type: 'agent_execute',
        target: agentId,
        payload: {
          input: `The metric ${metric} has ${operator} the threshold of ${threshold}`,
          context: {
            metric_data: true,
            trigger_id: uuid(),
            metric,
            threshold,
            operator
          }
        }
      },
      status: 'active'
    };
    
    // Create the trigger
    return await this.createTrigger(triggerData);
  }

  /**
   * Evaluate if a threshold condition is met
   */
  private evaluateThreshold(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '>=': return value >= threshold;
      case '<': return value < threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  /**
   * Evaluate if a trigger condition is met
   */
  private evaluateCondition(condition: TriggerCondition, event: any): boolean {
    // This would be more sophisticated in a real implementation
    // For now, just check if the event matches basic criteria
    
    switch (condition.type) {
      case 'webhook':
        // Check if webhook payload matches expected format
        return true;
      case 'event':
        // Check if event type matches and any filters apply
        const { eventType, filters } = condition.config;
        if (event.type !== eventType) return false;
        
        // Apply filters if they exist
        if (filters && Object.keys(filters).length > 0) {
          return Object.entries(filters).every(([key, value]) => {
            return event[key] === value;
          });
        }
        return true;
      case 'threshold':
        // Already handled by evaluateThreshold
        return true;
      default:
        return true;
    }
  }

  /**
   * Execute the action of a trigger
   */
  public async executeTriggerAction(trigger: Trigger): Promise<void> {
    try {
      const { action } = trigger;
      console.log(`🔥 Executing trigger action: ${trigger.name} (${trigger.id})`);
      
      // Update last triggered time
      this.activeTriggers.set(trigger.id, {
        ...trigger,
        lastTriggered: new Date(),
        updatedAt: new Date()
      });
      
      // Execute based on action type
      switch (action.type) {
        case 'agent_execute':
          await this.executeAgentAction(action);
          break;
        case 'workflow_execute':
          await this.executeWorkflowAction(action);
          break;
        case 'notification':
          await this.executeNotificationAction(action);
          break;
        case 'webhook':
          await this.executeWebhookAction(action);
          break;
        default:
          console.warn(`Unsupported action type: ${action.type}`);
      }
    } catch (error) {
      console.error('Failed to execute trigger action:', error);
    }
  }

  /**
   * Execute an agent action
   */
  private async executeAgentAction(action: TriggerAction): Promise<void> {
    const { target: agentId, payload } = action;
    
    try {
      // Call agent service
      await api.post(`/agent/${agentId}/execute`, {
        input: payload.input,
        context: payload.context || {}
      });
    } catch (error) {
      console.error('Failed to execute agent action:', error);
    }
  }

  /**
   * Execute a workflow action
   */
  private async executeWorkflowAction(action: TriggerAction): Promise<void> {
    const { target: workflowId, payload } = action;
    
    try {
      // Call workflow service
      await api.post(`/workflow/${workflowId}/execute`, {
        context: payload.context || {}
      });
    } catch (error) {
      console.error('Failed to execute workflow action:', error);
    }
  }

  /**
   * Execute a notification action
   */
  private async executeNotificationAction(action: TriggerAction): Promise<void> {
    const { payload } = action;
    
    try {
      // Call notification service
      await api.post('/notifications/send', {
        channel: payload.channel,
        message: payload.message,
        recipients: payload.recipients
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Execute a webhook action
   */
  private async executeWebhookAction(action: TriggerAction): Promise<void> {
    const { target: webhookUrl, payload } = action;
    
    try {
      // Send webhook
      await api.post(webhookUrl, payload);
    } catch (error) {
      console.error('Failed to execute webhook action:', error);
    }
  }

  /**
   * Update an existing trigger
   */
  public async updateTrigger(triggerId: string, updates: Partial<Trigger>): Promise<Trigger> {
    const trigger = this.activeTriggers.get(triggerId);
    if (!trigger) {
      throw new Error(`Trigger not found: ${triggerId}`);
    }
    
    const updatedTrigger = {
      ...trigger,
      ...updates,
      updatedAt: new Date()
    };
    
    // Update in database
    // In a real implementation, update in database
    this.activeTriggers.set(triggerId, updatedTrigger);
    
    // If condition or action changed, reinitialize the trigger
    if (updates.condition || updates.action) {
      await this.initializeTriggerListener(updatedTrigger);
    }
    
    return updatedTrigger;
  }

  /**
   * Delete a trigger
   */
  public async deleteTrigger(triggerId: string): Promise<void> {
    const trigger = this.activeTriggers.get(triggerId);
    if (!trigger) {
      throw new Error(`Trigger not found: ${triggerId}`);
    }
    
    // Clean up any intervals or listeners
    if (trigger.metadata?.intervalId) {
      clearInterval(trigger.metadata.intervalId);
    }
    
    // Remove from database
    // In a real implementation, delete from database
    this.activeTriggers.delete(triggerId);
  }
}

// Export singleton instance
export const triggerService = TriggerService.getInstance();