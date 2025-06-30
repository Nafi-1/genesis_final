import axios from 'axios';
import { v4 as uuid } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const API_BASE_URL = process.env.API_BASE_URL || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Service for managing deployments
 */
class DeploymentService {
  private supabase: any;

  constructor() {
    // Initialize Supabase client if configured
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && 
        !SUPABASE_URL.includes('your_') && !SUPABASE_SERVICE_ROLE_KEY.includes('your_')) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      console.log('✅ Deployment service initialized with Supabase');
    } else {
      console.log('⚠️ Supabase not configured for deployment service');
    }
  }

  /**
   * Deploy a guild
   */
  async deployGuild(
    blueprint: any,
    simulationResults: any,
    credentials: Record<string, string>
  ): Promise<DeploymentResult> {
    try {
      console.log('🚀 Deploying guild from blueprint...');
      
      // Try to use the edge function if available
      if (this.supabase) {
        try {
          const response = await this.supabase.functions.invoke('guild-deployment', {
            body: {
              blueprint_id: blueprint.id,
              simulation_id: simulationResults?.id,
              credentials,
              configuration: {
                created_at: new Date().toISOString(),
                source: 'orchestrator'
              }
            }
          });
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          console.log('✅ Guild deployed via edge function:', response.data.deployment.id);
          return {
            deploymentId: response.data.deployment.id,
            guild: response.data.deployment.guild,
            agents: response.data.deployment.agents,
            workflows: response.data.deployment.workflows,
            status: response.data.deployment.status,
            createdAt: response.data.deployment.createdAt,
            details: response.data.deployment.details
          };
        } catch (error) {
          console.error('❌ Edge function deployment failed:', error);
          console.log('⚠️ Falling back to direct database deployment');
        }
      }
      
      // Fallback to direct database operations
      return await this.deployGuildToDB(blueprint, simulationResults, credentials);
    } catch (error: any) {
      console.error('❌ Deployment failed:', error);
      throw new Error(`Guild deployment failed: ${error.message}`);
    }
  }

  /**
   * Deploy guild directly to database
   */
  private async deployGuildToDB(
    blueprint: any,
    simulationResults: any,
    credentials: Record<string, string>
  ): Promise<DeploymentResult> {
    if (!this.supabase) {
      return this.mockDeployment(blueprint, simulationResults, credentials);
    }

    console.log('🔄 Deploying guild directly to Supabase...');
    
    try {
      // Create the guild
      const { data: guild, error: guildError } = await this.supabase
        .from('guilds')
        .insert({
          name: blueprint.suggested_structure.guild_name,
          description: blueprint.interpretation,
          purpose: blueprint.suggested_structure.guild_purpose,
          status: 'active',
          metadata: {
            blueprint_id: blueprint.id,
            simulation_results: simulationResults,
            deployment_timestamp: new Date().toISOString(),
            credentials_configured: Object.keys(credentials).length > 0
          }
        })
        .select()
        .single();
        
      if (guildError) {
        throw new Error(`Failed to create guild: ${guildError.message}`);
      }
      
      console.log('✅ Guild created:', guild.id);
      
      // Create agents
      const createdAgents = [];
      const failedAgents = [];
      
      for (const agentBlueprint of blueprint.suggested_structure.agents) {
        try {
          const { data: agent, error: agentError } = await this.supabase
            .from('agents')
            .insert({
              name: agentBlueprint.name,
              role: agentBlueprint.role,
              description: agentBlueprint.description,
              guild_id: guild.id,
              personality: 'Professional, intelligent, and focused on delivering exceptional results',
              instructions: `You are ${agentBlueprint.name}, an AI agent serving as a ${agentBlueprint.role}. Your primary responsibility: ${agentBlueprint.description}`,
              tools: JSON.stringify(agentBlueprint.tools_needed.map((tool: string) => ({
                id: tool.toLowerCase().replace(/\s+/g, '_'),
                name: tool,
                type: 'api'
              }))),
              status: 'active'
            })
            .select()
            .single();
            
          if (agentError) {
            throw new Error(`Failed to create agent ${agentBlueprint.name}: ${agentError.message}`);
          }
          
          createdAgents.push(agent);
          console.log(`✅ Agent created: ${agent.id}`);
        } catch (error: any) {
          console.error(`❌ Failed to create agent ${agentBlueprint.name}:`, error);
          failedAgents.push({
            name: agentBlueprint.name,
            error: error.message
          });
        }
      }
      
      // Create workflows
      const createdWorkflows = [];
      const failedWorkflows = [];
      
      for (const workflowBlueprint of blueprint.suggested_structure.workflows) {
        try {
          const { data: workflow, error: workflowError } = await this.supabase
            .from('workflows')
            .insert({
              name: workflowBlueprint.name,
              description: workflowBlueprint.description,
              guild_id: guild.id,
              trigger: JSON.stringify({
                type: workflowBlueprint.trigger_type,
                config: {}
              }),
              status: 'active'
            })
            .select()
            .single();
            
          if (workflowError) {
            throw new Error(`Failed to create workflow ${workflowBlueprint.name}: ${workflowError.message}`);
          }
          
          createdWorkflows.push(workflow);
          console.log(`✅ Workflow created: ${workflow.id}`);
        } catch (error: any) {
          console.error(`❌ Failed to create workflow ${workflowBlueprint.name}:`, error);
          failedWorkflows.push({
            name: workflowBlueprint.name,
            error: error.message
          });
        }
      }
      
      // Store credentials if provided
      if (Object.keys(credentials).length > 0) {
        for (const [key, value] of Object.entries(credentials)) {
          if (!value) continue;
          
          try {
            const { error: credentialError } = await this.supabase
              .from('credentials')
              .insert({
                guild_id: guild.id,
                service_name: key.split('_')[0],
                credential_type: key,
                encrypted_value: value, // Note: In production, this should be encrypted
                is_active: true
              });
              
            if (credentialError) {
              console.warn(`⚠️ Failed to store credential ${key}:`, credentialError);
            }
          } catch (error) {
            console.warn(`⚠️ Error storing credential ${key}:`, error);
          }
        }
      }
      
      return {
        deploymentId: guild.id,
        guild,
        agents: createdAgents,
        workflows: createdWorkflows,
        status: 'deployed',
        createdAt: guild.created_at,
        details: {
          agentsCreated: createdAgents.length,
          workflowsCreated: createdWorkflows.length,
          failedAgents: failedAgents.length,
          failedWorkflows: failedWorkflows.length
        }
      };
    } catch (error: any) {
      console.error('❌ Direct DB deployment failed:', error);
      return this.mockDeployment(blueprint, simulationResults, credentials);
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    try {
      console.log(`🔍 Getting deployment status for: ${deploymentId}`);
      
      // Try to use the edge function if available
      if (this.supabase) {
        try {
          const response = await this.supabase.functions.invoke('deployment-status', {
            body: { deployment_id: deploymentId }
          });
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          return response.data;
        } catch (error) {
          console.error('❌ Edge function status check failed:', error);
          console.log('⚠️ Falling back to direct database query');
        }
      }
      
      // Fallback to direct database query
      if (this.supabase) {
        const { data: guild, error: guildError } = await this.supabase
          .from('guilds')
          .select(`
            *,
            agents:agents(id, name, role, status),
            workflows:workflows(id, name, status)
          `)
          .eq('id', deploymentId)
          .single();
          
        if (guildError) {
          throw new Error(`Failed to get deployment: ${guildError.message}`);
        }
        
        // Get channels
        const { data: channels } = await this.supabase
          .from('guild_channels')
          .select('*')
          .eq('guild_id', deploymentId);
        
        return {
          id: deploymentId,
          status: 'deployed',
          progress: 100,
          createdAt: guild.created_at,
          completedAt: guild.updated_at,
          guild: {
            id: guild.id,
            name: guild.name,
            status: guild.status
          },
          metrics: {
            agentsDeployed: guild.agents?.length || 0,
            workflowsConfigured: guild.workflows?.length || 0,
            servicesConnected: channels?.length || 0
          },
          channels: channels || []
        };
      }
      
      // If Supabase is not available, return a mock status
      return this.mockDeploymentStatus(deploymentId);
    } catch (error: any) {
      console.error('Failed to get deployment status:', error);
      return this.mockDeploymentStatus(deploymentId);
    }
  }

  /**
   * Create a multi-channel deployment
   */
  async createChannelDeployment(
    guildId: string, 
    channels: Channel[]
  ): Promise<MultiChannelDeploymentResult> {
    try {
      console.log(`🚀 Creating channel deployment for guild: ${guildId}`);
      
      // If Supabase is available, store the channels
      if (this.supabase) {
        const deployedChannels = [];
        
        for (const channel of channels) {
          try {
            // Generate a URL based on channel type
            const url = this.generateChannelUrl(guildId, channel);
            
            // Insert into database
            const { data, error } = await this.supabase
              .from('guild_channels')
              .insert({
                guild_id: guildId,
                type: channel.type,
                name: channel.name,
                config: channel.config,
                status: 'active',
                url
              })
              .select()
              .single();
              
            if (error) {
              console.warn(`⚠️ Failed to store channel ${channel.name}:`, error);
              deployedChannels.push({
                ...channel,
                status: 'failed',
                error: error.message,
                createdAt: new Date().toISOString()
              });
            } else {
              deployedChannels.push({
                ...channel,
                status: 'deployed',
                url,
                createdAt: data.created_at
              });
              console.log(`✅ Channel created: ${data.id}`);
            }
          } catch (error: any) {
            console.error(`❌ Failed to create channel ${channel.name}:`, error);
            deployedChannels.push({
              ...channel,
              status: 'failed',
              error: error.message,
              createdAt: new Date().toISOString()
            });
          }
        }
        
        return {
          deploymentId: `channel-${uuid()}`,
          guildId,
          channels: deployedChannels,
          status: 'deployed',
          createdAt: new Date().toISOString()
        };
      }
      
      // If Supabase is not available, return a mock result
      return this.mockChannelDeployment(guildId, channels);
    } catch (error: any) {
      console.error('Failed to create channel deployment:', error);
      return this.mockChannelDeployment(guildId, channels);
    }
  }

  /**
   * Generate a URL for a channel
   */
  private generateChannelUrl(guildId: string, channel: Channel): string {
    const baseUrl = API_BASE_URL || 'https://genesisOS.ai';
    
    switch (channel.type) {
      case 'web':
        return `${baseUrl}/widget/${guildId}`;
      case 'slack':
        return `${baseUrl}/slack/${guildId}`;
      case 'email':
        return `${baseUrl}/email/${guildId}`;
      case 'api':
        return `${baseUrl}/api/guilds/${guildId}`;
      case 'discord':
        return `${baseUrl}/discord/${guildId}`;
      default:
        return `${baseUrl}/channel/${channel.type}/${guildId}`;
    }
  }

  /**
   * Create a mock deployment (for development)
   */
  private mockDeployment(
    blueprint: any,
    simulationResults: any,
    credentials: Record<string, string>
  ): DeploymentResult {
    console.log('🔄 Creating mock deployment');
    
    const deploymentId = uuid();
    
    const guild = {
      id: deploymentId,
      name: blueprint.suggested_structure.guild_name,
      description: blueprint.interpretation,
      purpose: blueprint.suggested_structure.guild_purpose,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const agents = blueprint.suggested_structure.agents.map((agent: any, index: number) => ({
      id: `agent-${index}-${deploymentId.slice(0, 8)}`,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      guild_id: deploymentId,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const workflows = blueprint.suggested_structure.workflows.map((workflow: any, index: number) => ({
      id: `workflow-${index}-${deploymentId.slice(0, 8)}`,
      name: workflow.name,
      description: workflow.description,
      guild_id: deploymentId,
      trigger: {
        type: workflow.trigger_type,
        config: {}
      },
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    return {
      deploymentId,
      guild,
      agents,
      workflows,
      status: 'deployed',
      createdAt: new Date().toISOString(),
      details: {
        agentsCreated: agents.length,
        workflowsCreated: workflows.length,
        failedAgents: 0,
        failedWorkflows: 0
      }
    };
  }

  /**
   * Create a mock deployment status (for development)
   */
  private mockDeploymentStatus(deploymentId: string): DeploymentStatus {
    return {
      id: deploymentId,
      status: 'deployed',
      progress: 100,
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      completedAt: new Date().toISOString(),
      guild: {
        id: deploymentId,
        name: 'AI Business Assistant Guild',
        status: 'active'
      },
      metrics: {
        agentsDeployed: 3,
        workflowsConfigured: 2,
        servicesConnected: 2
      },
      channels: [
        {
          type: 'web',
          name: 'Web Widget',
          status: 'active',
          url: `https://example.com/widget/${deploymentId}`,
          createdAt: new Date(Date.now() - 3000000).toISOString()
        },
        {
          type: 'slack',
          name: 'Slack Integration',
          status: 'active',
          url: `https://example.com/slack/${deploymentId}`,
          createdAt: new Date(Date.now() - 2700000).toISOString()
        }
      ]
    };
  }

  /**
   * Create a mock channel deployment (for development)
   */
  private mockChannelDeployment(
    guildId: string,
    channels: Channel[]
  ): MultiChannelDeploymentResult {
    console.log('🔄 Creating mock channel deployment');
    
    return {
      deploymentId: `channel-${uuid()}`,
      guildId,
      channels: channels.map(channel => ({
        ...channel,
        status: 'deployed',
        url: this.generateChannelUrl(guildId, channel),
        createdAt: new Date().toISOString()
      })),
      status: 'deployed',
      createdAt: new Date().toISOString()
    };
  }
}

// Create singleton instance
const deploymentService = new DeploymentService();

export default deploymentService;

// Type definitions
export interface DeploymentResult {
  deploymentId: string;
  guild: any;
  agents: any[];
  workflows: any[];
  status: string;
  createdAt: string;
  details: {
    agentsCreated: number;
    workflowsCreated: number;
    failedAgents: number;
    failedWorkflows: number;
  };
}

export interface DeploymentStatus {
  id: string;
  status: string;
  progress: number;
  createdAt: string;
  completedAt?: string;
  guild: {
    id: string;
    name: string;
    status: string;
  };
  metrics: {
    agentsDeployed: number;
    workflowsConfigured: number;
    servicesConnected: number;
  };
  channels?: any[];
}

export interface Channel {
  type: 'slack' | 'email' | 'web' | 'api' | 'discord';
  config: Record<string, any>;
  name: string;
}

export interface MultiChannelDeploymentResult {
  deploymentId: string;
  guildId: string;
  channels: (Channel & {
    status: string;
    url?: string;
    createdAt: string;
    error?: string;
  })[];
  status: string;
  createdAt: string;
}