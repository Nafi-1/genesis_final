import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
let supabase: ReturnType<typeof createClient> | undefined;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your_') && !supabaseKey.includes('your_')) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Webhook service initialized with Supabase database');
} else {
  console.log('⚠️ Webhook service initialized without database persistence');
}

// In-memory storage for development/fallback
const webhookRegistry: Record<string, WebhookConfig> = {};

/**
 * Service for managing webhook triggers
 */
class WebhookService {
  /**
   * Register a new webhook trigger
   */
  async registerWebhook(
    workflowId: string,
    userId: string,
    config: Partial<WebhookConfig>
  ): Promise<WebhookRegistration> {
    console.log(`🔗 Registering webhook for workflow: ${workflowId}`);
    
    const webhookId = uuidv4();
    const path = config.path || `/webhook/${webhookId}`;
    
    // Generate a secret for webhook verification if not provided
    const secret = config.secret || this.generateSecret();
    
    const webhookConfig: WebhookConfig = {
      id: webhookId,
      workflowId,
      userId,
      path,
      method: config.method || 'POST',
      secret,
      headers: config.headers || {},
      authentication: config.authentication || { type: 'none' },
      filtering: config.filtering || { type: 'none' },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store in database if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('workflow_triggers')
          .insert({
            id: webhookId,
            workflow_id: workflowId,
            user_id: userId,
            type: 'webhook',
            config: webhookConfig,
            status: 'active'
          });
        
        if (error) {
          console.error('❌ Failed to store webhook in database:', error);
        } else {
          console.log('✅ Webhook stored in database:', webhookId);
        }
      } catch (error) {
        console.error('❌ Error storing webhook in database:', error);
      }
    }
    
    // Also store in memory for fallback
    webhookRegistry[webhookId] = webhookConfig;
    
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const webhookUrl = `${baseUrl}${path}`;
    
    return {
      id: webhookId,
      url: webhookUrl,
      method: webhookConfig.method,
      secret: webhookConfig.secret,
      workflowId,
      status: 'active',
      createdAt: webhookConfig.createdAt
    };
  }
  
  /**
   * Get webhook configuration by ID
   */
  async getWebhook(webhookId: string): Promise<WebhookConfig | null> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('workflow_triggers')
          .select('*')
          .eq('id', webhookId)
          .eq('type', 'webhook')
          .single();
        
        if (error || !data) {
          console.warn(`⚠️ Webhook not found in database: ${webhookId}`);
        } else {
          return data.config as WebhookConfig;
        }
      } catch (error) {
        console.error('❌ Error retrieving webhook from database:', error);
      }
    }
    
    // Fallback to in-memory storage
    return webhookRegistry[webhookId] || null;
  }
  
  /**
   * Get all webhooks for a workflow
   */
  async getWorkflowWebhooks(workflowId: string): Promise<WebhookConfig[]> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('workflow_triggers')
          .select('*')
          .eq('workflow_id', workflowId)
          .eq('type', 'webhook')
          .eq('status', 'active');
        
        if (error) {
          console.error('❌ Failed to retrieve webhooks from database:', error);
        } else if (data && data.length > 0) {
          return data.map(item => item.config as WebhookConfig);
        }
      } catch (error) {
        console.error('❌ Error retrieving webhooks from database:', error);
      }
    }
    
    // Fallback to in-memory storage
    return Object.values(webhookRegistry).filter(
      webhook => webhook.workflowId === workflowId && webhook.status === 'active'
    );
  }
  
  /**
   * Update a webhook configuration
   */
  async updateWebhook(
    webhookId: string, 
    userId: string,
    updates: Partial<WebhookConfig>
  ): Promise<WebhookConfig | null> {
    const webhook = await this.getWebhook(webhookId);
    
    if (!webhook) {
      console.warn(`⚠️ Webhook not found: ${webhookId}`);
      return null;
    }
    
    // Check ownership
    if (webhook.userId !== userId) {
      console.warn(`⚠️ User ${userId} does not own webhook ${webhookId}`);
      return null;
    }
    
    // Update webhook
    const updatedWebhook: WebhookConfig = {
      ...webhook,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Update in database if available
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('workflow_triggers')
          .update({
            config: updatedWebhook,
            updated_at: new Date().toISOString()
          })
          .eq('id', webhookId)
          .eq('user_id', userId)
          .select()
          .single();
        
        if (error) {
          console.error('❌ Failed to update webhook in database:', error);
        } else {
          console.log('✅ Webhook updated in database:', webhookId);
        }
      } catch (error) {
        console.error('❌ Error updating webhook in database:', error);
      }
    }
    
    // Update in memory as fallback
    webhookRegistry[webhookId] = updatedWebhook;
    
    return updatedWebhook;
  }
  
  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string, userId: string): Promise<boolean> {
    const webhook = await this.getWebhook(webhookId);
    
    if (!webhook) {
      console.warn(`⚠️ Webhook not found: ${webhookId}`);
      return false;
    }
    
    // Check ownership
    if (webhook.userId !== userId) {
      console.warn(`⚠️ User ${userId} does not own webhook ${webhookId}`);
      return false;
    }
    
    // Delete from database if available
    if (supabase) {
      try {
        const { error } = await supabase
          .from('workflow_triggers')
          .delete()
          .eq('id', webhookId)
          .eq('user_id', userId);
        
        if (error) {
          console.error('❌ Failed to delete webhook from database:', error);
        } else {
          console.log('✅ Webhook deleted from database:', webhookId);
        }
      } catch (error) {
        console.error('❌ Error deleting webhook from database:', error);
      }
    }
    
    // Delete from memory
    delete webhookRegistry[webhookId];
    
    return true;
  }
  
  /**
   * Process an incoming webhook request
   */
  async processWebhookRequest(
    path: string,
    method: string,
    headers: Record<string, string>,
    body: any
  ): Promise<WebhookProcessResult> {
    console.log(`📨 Received webhook request: ${method} ${path}`);
    
    // Find the webhook configuration for this path
    let webhook: WebhookConfig | null = null;
    
    if (supabase) {
      try {
        // Query for webhook by path
        const { data, error } = await supabase
          .from('workflow_triggers')
          .select('*')
          .eq('type', 'webhook')
          .eq('status', 'active');
        
        if (!error && data && data.length > 0) {
          // Find the webhook that matches this path
          const match = data.find(item => 
            (item.config as WebhookConfig).path === path
          );
          
          if (match) {
            webhook = match.config as WebhookConfig;
          }
        }
      } catch (error) {
        console.error('❌ Error retrieving webhook from database:', error);
      }
    }
    
    // Fallback to in-memory storage
    if (!webhook) {
      webhook = Object.values(webhookRegistry).find(wh => 
        wh.path === path && wh.status === 'active'
      ) || null;
    }
    
    if (!webhook) {
      console.warn(`⚠️ No webhook found for path: ${path}`);
      return {
        success: false,
        error: 'Webhook not found',
        webhookId: '',
        workflowId: ''
      };
    }
    
    // Verify method
    if (webhook.method !== method && webhook.method !== 'ANY') {
      console.warn(`⚠️ Method mismatch: ${method} (expected ${webhook.method})`);
      return {
        success: false,
        error: `Invalid method: ${method}, expected ${webhook.method}`,
        webhookId: webhook.id,
        workflowId: webhook.workflowId
      };
    }
    
    // Verify signature if required
    if (webhook.authentication.type === 'signature' && webhook.secret) {
      const signature = headers['x-webhook-signature'];
      
      if (!signature) {
        console.warn('⚠️ Missing webhook signature header');
        return {
          success: false,
          error: 'Missing webhook signature',
          webhookId: webhook.id,
          workflowId: webhook.workflowId
        };
      }
      
      const isValid = this.verifySignature(
        webhook.secret,
        signature,
        body
      );
      
      if (!isValid) {
        console.warn('⚠️ Invalid webhook signature');
        return {
          success: false,
          error: 'Invalid webhook signature',
          webhookId: webhook.id,
          workflowId: webhook.workflowId
        };
      }
    }
    
    // Apply filtering if configured
    if (webhook.filtering.type === 'json_path' && webhook.filtering.rules) {
      const matches = this.applyJsonPathFiltering(
        body,
        webhook.filtering.rules
      );
      
      if (!matches) {
        console.log('📋 Webhook request filtered out (does not match rules)');
        return {
          success: false,
          filtered: true,
          error: 'Request filtered out (does not match rules)',
          webhookId: webhook.id,
          workflowId: webhook.workflowId
        };
      }
    }
    
    console.log('✅ Webhook request validated successfully');
    
    // Return success with details needed for workflow execution
    return {
      success: true,
      webhookId: webhook.id,
      workflowId: webhook.workflowId,
      payload: body,
      headers
    };
  }
  
  /**
   * Generate a secure webhook secret
   */
  generateSecret(): string {
    return Array.from(
      { length: 32 },
      () => Math.floor(Math.random() * 36).toString(36)
    ).join('');
  }
  
  /**
   * Verify webhook signature
   */
  verifySignature(secret: string, signature: string, body: any): boolean {
    // In a real implementation, this would verify the signature using HMAC
    // For example, using crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex')
    // For now, we'll return true for development
    console.log('🔐 Verifying webhook signature (development mode - always valid)');
    return true;
  }
  
  /**
   * Apply JSON path filtering rules
   */
  applyJsonPathFiltering(body: any, rules: FilteringRule[]): boolean {
    // In a real implementation, this would apply JSONPath rules to the body
    // For now, we'll return true for development
    console.log('🔍 Applying JSON path filtering (development mode - always matches)');
    return true;
  }
}

// Create singleton instance
const webhookService = new WebhookService();
export default webhookService;

// Types
export interface WebhookConfig {
  id: string;
  workflowId: string;
  userId: string;
  path: string;
  method: string;
  secret: string;
  headers: Record<string, string>;
  authentication: {
    type: 'none' | 'signature' | 'basic' | 'bearer';
    config?: Record<string, any>;
  };
  filtering: {
    type: 'none' | 'json_path';
    rules?: FilteringRule[];
  };
  status: 'active' | 'paused' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface FilteringRule {
  path: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'exists' | 'greater_than' | 'less_than';
  value?: any;
}

export interface WebhookRegistration {
  id: string;
  url: string;
  method: string;
  secret: string;
  workflowId: string;
  status: string;
  createdAt: string;
}

export interface WebhookProcessResult {
  success: boolean;
  webhookId: string;
  workflowId: string;
  error?: string;
  filtered?: boolean;
  payload?: any;
  headers?: Record<string, string>;
}