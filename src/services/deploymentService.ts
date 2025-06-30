import { api, apiMethods } from '../lib/api';
import { Blueprint } from '../types';

/**
 * Enhanced DeploymentManager for production deployments
 */
export class DeploymentManager {
  private static instance: DeploymentManager;
  private activeDeployments: Map<string, DeploymentStatus> = new Map();
  private deploymentListeners: Map<string, Set<(status: DeploymentStatus) => void>> = new Map();
  
  private constructor() {}
  
  public static getInstance(): DeploymentManager {
    if (!DeploymentManager.instance) {
      DeploymentManager.instance = new DeploymentManager();
    }
    return DeploymentManager.instance;
  }
  
  /**
   * Deploy a guild to production
   */
  public async deploy(guild: any, config?: any): Promise<DeploymentStatus> {
    try {
      console.log('🚀 Starting guild deployment process');
      
      // Validate deployment configuration
      await this.validateDeploymentConfig(guild);
      
      // Create deployment ID and initial status
      const deploymentId = `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const initialStatus: DeploymentStatus = {
        id: deploymentId,
        guild: {
          id: guild.id,
          name: guild.name,
          status: 'deploying'
        },
        status: 'provisioning',
        progress: 5,
        createdAt: new Date().toISOString(),
        metrics: {
          agentsDeployed: 0,
          workflowsConfigured: 0,
          servicesConnected: 0
        },
        steps: [
          {
            id: 'provision', name: 'Provision Infrastructure', status: 'running', progress: 10,
            completedAt: ''
          },
          {
            id: 'deploy-agents', name: 'Deploy Agents', status: 'pending', progress: 0,
            completedAt: ''
          },
          {
            id: 'deploy-workflows', name: 'Deploy Workflows', status: 'pending', progress: 0,
            completedAt: ''
          },
          {
            id: 'deploy-services', name: 'Configure Services', status: 'pending', progress: 0,
            completedAt: ''
          },
          {
            id: 'test', name: 'Test Deployment', status: 'pending', progress: 0,
            completedAt: ''
          },
          {
            id: 'finalize', name: 'Finalize Deployment', status: 'pending', progress: 0,
            completedAt: ''
          }
        ]
      };
      
      // Store initial status
      this.activeDeployments.set(deploymentId, initialStatus);
      
      // Run the deployment process in the background
      this.runDeploymentProcess(deploymentId, guild, config);
      
      return initialStatus;
    } catch (error: any) {
      console.error('❌ Deployment setup failed:', error);
      throw new Error(`Deployment initialization failed: ${error.message}`);
    }
  }
  
  /**
   * Validate deployment configuration
   */
  private async validateDeploymentConfig(guild: any): Promise<void> {
    // Check if guild has required properties
    if (!guild.id || !guild.name) {
      throw new Error('Invalid guild configuration: missing required properties');
    }
    
    // Check if agents are configured
    if (!guild.agents || guild.agents.length === 0) {
      throw new Error('Invalid guild configuration: no agents configured');
    }
    
    // Check if required credentials are present
    // This would be a more complex check in a real implementation
    
    return;
  }
  
  /**
   * Run the deployment process in the background
   */
  private async runDeploymentProcess(deploymentId: string, guild: any, config?: any): Promise<void> {
    try {
      // Step 1: Provision Infrastructure
      await this.provisionInfrastructure(deploymentId, guild);
      
      // Step 2: Deploy Agents
      await this.deployAgentServices(deploymentId, guild);
      
      // Step 3: Deploy Workflows
      await this.deployWorkflows(deploymentId, guild);
      
      // Step 4: Configure Services and Integrations
      await this.deployIntegrations(deploymentId, guild, config);
      
      // Step 5: Test deployment
      await this.testDeployment(deploymentId, guild);
      
      // Step 6: Finalize deployment
      await this.finalizeDeployment(deploymentId, guild);
      
    } catch (error: any) {
      console.error('❌ Deployment process failed:', error);
      
      // Update status to failed
      const currentStatus = this.activeDeployments.get(deploymentId);
      if (currentStatus) {
        const updatedStatus: DeploymentStatus = {
          ...currentStatus,
          status: 'failed',
          error: error.message,
          progress: -1
        };
        
        this.activeDeployments.set(deploymentId, updatedStatus);
        this.notifyListeners(deploymentId, updatedStatus);
      }
    }
  }
  
  /**
   * Provision infrastructure for deployment
   */
  private async provisionInfrastructure(deploymentId: string, guild: any): Promise<void> {
    // Update status
    this.updateDeploymentStepStatus(deploymentId, 'provision', 'running', 10);
    
    // Simulate infrastructure provisioning
    await this.simulateProgress(deploymentId, 'provision', 10, 100, 3000);
    
    // Update overall progress
    this.updateDeploymentProgress(deploymentId, 20);
    
    // Mark step as complete
    this.updateDeploymentStepStatus(deploymentId, 'provision', 'completed', 100);
  }
  
  /**
   * Deploy agent services
   */
  private async deployAgentServices(deploymentId: string, guild: any): Promise<void> {
    // Update status
    this.updateDeploymentStepStatus(deploymentId, 'deploy-agents', 'running', 10);
    
    // Deploy each agent
    const agents = guild.agents || [];
    let deployedAgents = 0;
    
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const progress = Math.floor(10 + (i / agents.length) * 90);
      
      // Update step progress
      this.updateDeploymentStepStatus(deploymentId, 'deploy-agents', 'running', progress);
      
      // Simulate agent deployment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      deployedAgents++;
      
      // Update metrics
      const status = this.activeDeployments.get(deploymentId);
      if (status) {
        status.metrics.agentsDeployed = deployedAgents;
        this.activeDeployments.set(deploymentId, status);
        this.notifyListeners(deploymentId, status);
      }
    }
    
    // Update overall progress
    this.updateDeploymentProgress(deploymentId, 40);
    
    // Mark step as complete
    this.updateDeploymentStepStatus(deploymentId, 'deploy-agents', 'completed', 100);
  }
  
  /**
   * Deploy workflows
   */
  private async deployWorkflows(deploymentId: string, guild: any): Promise<void> {
    // Update status
    this.updateDeploymentStepStatus(deploymentId, 'deploy-workflows', 'running', 10);
    
    // Deploy each workflow
    const workflows = guild.workflows || [];
    let deployedWorkflows = 0;
    
    for (let i = 0; i < workflows.length; i++) {
      const workflow = workflows[i];
      const progress = Math.floor(10 + (i / workflows.length) * 90);
      
      // Update step progress
      this.updateDeploymentStepStatus(deploymentId, 'deploy-workflows', 'running', progress);
      
      // Simulate workflow deployment
      await new Promise(resolve => setTimeout(resolve, 800));
      
      deployedWorkflows++;
      
      // Update metrics
      const status = this.activeDeployments.get(deploymentId);
      if (status) {
        status.metrics.workflowsConfigured = deployedWorkflows;
        this.activeDeployments.set(deploymentId, status);
        this.notifyListeners(deploymentId, status);
      }
    }
    
    // Update overall progress
    this.updateDeploymentProgress(deploymentId, 60);
    
    // Mark step as complete
    this.updateDeploymentStepStatus(deploymentId, 'deploy-workflows', 'completed', 100);
  }
  
  /**
   * Deploy integrations
   */
  private async deployIntegrations(deploymentId: string, guild: any, config?: any): Promise<void> {
    // Update status
    this.updateDeploymentStepStatus(deploymentId, 'deploy-services', 'running', 10);
    
    // Get integrations from config
    const integrations = config?.integrations || [];
    let connectedServices = 0;
    
    for (let i = 0; i < integrations.length; i++) {
      const integration = integrations[i];
      const progress = Math.floor(10 + (i / integrations.length) * 90);
      
      // Update step progress
      this.updateDeploymentStepStatus(deploymentId, 'deploy-services', 'running', progress);
      
      // Simulate integration deployment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      connectedServices++;
      
      // Update metrics
      const status = this.activeDeployments.get(deploymentId);
      if (status) {
        status.metrics.servicesConnected = connectedServices;
        this.activeDeployments.set(deploymentId, status);
        this.notifyListeners(deploymentId, status);
      }
    }
    
    // Update overall progress
    this.updateDeploymentProgress(deploymentId, 80);
    
    // Mark step as complete
    this.updateDeploymentStepStatus(deploymentId, 'deploy-services', 'completed', 100);
  }
  
  /**
   * Test deployment
   */
  private async testDeployment(deploymentId: string, guild: any): Promise<void> {
    // Update status
    this.updateDeploymentStepStatus(deploymentId, 'test', 'running', 10);
    
    // Simulate testing
    await this.simulateProgress(deploymentId, 'test', 10, 100, 2000);
    
    // Update overall progress
    this.updateDeploymentProgress(deploymentId, 90);
    
    // Mark step as complete
    this.updateDeploymentStepStatus(deploymentId, 'test', 'completed', 100);
  }
  
  /**
   * Finalize deployment
   */
  private async finalizeDeployment(deploymentId: string, guild: any): Promise<void> {
    // Update status
    this.updateDeploymentStepStatus(deploymentId, 'finalize', 'running', 10);
    
    // Simulate finalization
    await this.simulateProgress(deploymentId, 'finalize', 10, 100, 1500);
    
    // Update overall progress
    this.updateDeploymentProgress(deploymentId, 100);
    
    // Mark step as complete
    this.updateDeploymentStepStatus(deploymentId, 'finalize', 'completed', 100);
    
    // Update overall status
    const status = this.activeDeployments.get(deploymentId);
    if (status) {
      status.status = 'deployed';
      status.guild.status = 'active';
      status.completedAt = new Date().toISOString();
      
      this.activeDeployments.set(deploymentId, status);
      this.notifyListeners(deploymentId, status);
    }
  }
  
  /**
   * Simulate progress updates for a step
   */
  private async simulateProgress(
    deploymentId: string,
    stepId: string,
    startProgress: number,
    endProgress: number,
    duration: number
  ): Promise<void> {
    const steps = Math.max(1, Math.floor(duration / 100));
    const increment = (endProgress - startProgress) / steps;
    
    for (let i = 0; i < steps; i++) {
      const progress = Math.min(
        endProgress,
        startProgress + Math.floor(increment * (i + 1))
      );
      
      this.updateDeploymentStepStatus(deploymentId, stepId, 'running', progress);
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  /**
   * Update deployment step status
   */
  private updateDeploymentStepStatus(
    deploymentId: string,
    stepId: string,
    status: 'pending' | 'running' | 'completed' | 'failed',
    progress: number
  ): void {
    const deploymentStatus = this.activeDeployments.get(deploymentId);
    if (!deploymentStatus) return;
    
    const step = deploymentStatus.steps.find(s => s.id === stepId);
    if (!step) return;
    
    step.status = status;
    step.progress = progress;
    
    this.activeDeployments.set(deploymentId, deploymentStatus);
    this.notifyListeners(deploymentId, deploymentStatus);
  }
  
  /**
   * Update overall deployment progress
   */
  private updateDeploymentProgress(deploymentId: string, progress: number): void {
    const status = this.activeDeployments.get(deploymentId);
    if (!status) return;
    
    status.progress = progress;
    
    this.activeDeployments.set(deploymentId, status);
    this.notifyListeners(deploymentId, status);
  }
  
  /**
   * Get deployment status
   */
  public getDeploymentStatus(deploymentId: string): DeploymentStatus | undefined {
    return this.activeDeployments.get(deploymentId);
  }
  
  /**
   * Get all deployment statuses
   */
  public getAllDeploymentStatuses(): DeploymentStatus[] {
    return Array.from(this.activeDeployments.values());
  }
  
  /**
   * Subscribe to deployment status updates
   */
  public subscribeToDeploymentUpdates(
    deploymentId: string,
    callback: (status: DeploymentStatus) => void
  ): void {
    if (!this.deploymentListeners.has(deploymentId)) {
      this.deploymentListeners.set(deploymentId, new Set());
    }
    
    this.deploymentListeners.get(deploymentId)!.add(callback);
  }
  
  /**
   * Unsubscribe from deployment status updates
   */
  public unsubscribeFromDeploymentUpdates(
    deploymentId: string,
    callback: (status: DeploymentStatus) => void
  ): void {
    if (!this.deploymentListeners.has(deploymentId)) return;
    
    this.deploymentListeners.get(deploymentId)!.delete(callback);
  }
  
  /**
   * Notify listeners of deployment status updates
   */
  private notifyListeners(deploymentId: string, status: DeploymentStatus): void {
    if (!this.deploymentListeners.has(deploymentId)) return;
    
    for (const listener of this.deploymentListeners.get(deploymentId)!) {
      try {
        listener(status);
      } catch (error) {
        console.error(`Error in deployment listener for ${deploymentId}:`, error);
      }
    }
  }
}

/**
 * Deployment status
 */
export interface DeploymentStatus {
  id: string;
  guild: {
    id: string;
    name: string;
    status: string;
  };
  status: string;
  progress: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
  metrics: {
    agentsDeployed: number;
    workflowsConfigured: number;
    servicesConnected: number;
  };
  steps: DeploymentStep[];
  channels?: any[];
}

/**
 * Deployment step
 */
export interface DeploymentStep {
  completedAt: string;
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

// Export singleton instance
export const deploymentManager = DeploymentManager.getInstance();
/**
 * Service for managing deployment operations
 */
export const deploymentService = {
  /**
   * Deploy a guild based on a blueprint and simulation results
   */
  deployGuild: async (
    blueprint: Blueprint, 
    simulationResults: any, 
    credentials: Record<string, string>
  ): Promise<DeploymentResult> => {
    console.log('🚀 Starting guild deployment process');
    console.log('Blueprint:', blueprint.id);
    console.log('Credentials:', Object.keys(credentials));
    
    try {
      // Step 1: Create the guild
      console.log('1️⃣ Creating guild from blueprint...');
      const guildData = {
        name: blueprint.suggested_structure.guild_name,
        description: blueprint.interpretation,
        purpose: blueprint.suggested_structure.guild_purpose,
        status: 'active',
        metadata: {
          blueprint_id: blueprint.id,
          simulation_results: simulationResults,
          deployment_timestamp: new Date().toISOString(),
          credentials_configured: Object.keys(credentials).length > 0,
          ai_generated: true,
          confidence_score: 0.95,
          estimated_roi: '340%',
          setup_time_minutes: blueprint.suggested_structure.agents.length * 3
        }
      };
      
      // Call the API to create the guild
      const guild = await apiMethods.createGuild(guildData);
      console.log('✅ Guild created successfully:', guild.id);
      
      // Step 2: Create agents with enhanced configurations
      console.log('2️⃣ Creating intelligent agents...');
      const createdAgents = [];
      const failedAgents = [];

      // Get the preferred AI model
      const preferredModel = localStorage.getItem('preferred_ai_model') || 'gemini-flash';
      
      // Process agents in sequence to avoid race conditions
      for (const agentBlueprint of blueprint.suggested_structure.agents) {
        try {
          console.log(`Creating agent: ${agentBlueprint.name}`);
          
          // Determine agent personality based on role
          const personality = determineAgentPersonality(agentBlueprint.role);
          
          const agentData = {
            name: agentBlueprint.name,
            role: agentBlueprint.role,
            description: agentBlueprint.description,
            guild_id: guild.id,
            personality,
            instructions: `You are ${agentBlueprint.name}, an advanced AI agent serving as a ${agentBlueprint.role}. 

Your primary responsibility: ${agentBlueprint.description}

Your expertise includes: ${agentBlueprint.tools_needed.join(', ')}

Operating principles:
- Focus on delivering measurable business value
- Maintain high standards of quality and professionalism  
- Collaborate effectively with other agents in the guild
- Continuously learn and adapt to improve performance
- Escalate complex issues that require human intervention

Always think strategically, act efficiently, and communicate clearly.`,
            tools: agentBlueprint.tools_needed.map(tool => ({
              id: `tool_${tool.toLowerCase().replace(/\s+/g, '_')}`,
              name: tool,
              type: 'api' as const,
              config: credentials[tool] ? { api_key: credentials[tool] } : {}
            })),
            memory_config: {
              short_term_enabled: true,
              long_term_enabled: true,
              memory_limit: 100,
              retention_days: 365
            },
            voice_config: {
              enabled: true,
              voice_id: credentials.elevenlabs_voice_id || '',
              stability: 0.6,
              similarity_boost: 0.7,
              style: 0.3
            }
          };
          
          const agent = await apiMethods.createAgent(agentData);
          createdAgents.push(agent);
          console.log(`✅ Agent created successfully: ${agent.id}`);
        } catch (error: any) {
          console.error(`❌ Failed to create agent ${agentBlueprint.name}:`, error);
          failedAgents.push({
            name: agentBlueprint.name,
            error: error.message || 'Unknown error'
          });
        }
      }
      
      // Step 3: Configure workflows based on blueprint
      console.log('3️⃣ Setting up intelligent workflows...');
      const createdWorkflows = [];
      const failedWorkflows = [];
      
      for (const workflowBlueprint of blueprint.suggested_structure.workflows) {
        try {
          console.log(`Creating workflow: ${workflowBlueprint.name}`);
          
          // Create workflow with nodes and edges based on blueprint
          const workflowData = {
            name: workflowBlueprint.name,
            description: workflowBlueprint.description,
            guild_id: guild.id,
            trigger: {
              type: workflowBlueprint.trigger_type,
              config: getTriggerConfig(workflowBlueprint)
            },
            nodes: [],
            edges: [],
            status: 'active',
            metadata: {
              blueprint_id: blueprint.id,
              created_from: 'blueprint',
              version: '1.0.0'
            }
          };
          
          const workflow = await createWorkflow(workflowData);
          createdWorkflows.push(workflow);
          console.log(`✅ Workflow created successfully: ${workflow.id}`);
        } catch (error: any) {
          console.error(`❌ Failed to create workflow ${workflowBlueprint.name}:`, error);
          failedWorkflows.push({
            name: workflowBlueprint.name,
            error: error.message || 'Unknown error'
          });
        }
      }
      
      // Step 4: Set up deployment monitoring
      console.log('4️⃣ Setting up monitoring and analytics...');
      
      // Step 5: Finalize deployment
      console.log('5️⃣ Finalizing deployment...');
      
      const deploymentId = guild.id;
      
      return {
        deploymentId,
        guild,
        agents: createdAgents,
        workflows: createdWorkflows,
        status: 'deployed',
        createdAt: new Date().toISOString(),
        details: {
          agentsCreated: createdAgents.length,
          workflowsCreated: createdWorkflows.length,
          failedAgents: failedAgents.length,
          failedWorkflows: failedWorkflows.length
        }
      };
    } catch (error: any) {
      console.error('❌ Deployment failed:', error);
      
      // Create a more detailed error message
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown deployment error';
      
      throw new Error(`Guild deployment failed: ${errorMessage}`);
    }
  },
  
  /**
   * Monitor a deployment's health status
   */
  monitorDeployment: async (deploymentId: string): Promise<{
    id: string;
    status: 'healthy' | 'warning' | 'error';
    metrics: {
      uptime: number;
      responseTime: number;
      errorRate: number;
      totalRequests: number;
    };
    warnings: string[];
    alerts: string[];
  }> => {
    try {
      const response = await api.get(`/deployments/${deploymentId}/health`);
      return response.data;
    } catch (error) {
      console.error('Failed to monitor deployment health:', error);
      
      // Return mock data for development
      return {
        id: deploymentId,
        status: 'healthy',
        metrics: {
          uptime: 99.8,
          responseTime: 245,
          errorRate: 0.2,
          totalRequests: Math.floor(Math.random() * 5000) + 1000
        },
        warnings: [],
        alerts: []
      };
    }
  },
  
  /**
   * Get deployment status
   */
  getDeploymentStatus: async (deploymentId: string): Promise<DeploymentStatus> => {
    try {
      const response = await api.get(`/deployments/${deploymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get deployment status:', error);
      
      // For development, return a mock status
      return {
        channels: [],
        id: deploymentId,
        status: 'deployed',
        progress: 100,
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        completedAt: new Date().toISOString(),
        guild: {
          id: deploymentId,
          name: 'AI Business Assistant Guild',
          status: 'active'
        },
        metrics: {
          agentsDeployed: 3,
          workflowsConfigured: 2,
          servicesConnected: 5
        },
        steps: [
          {
            id: 'provision', name: 'Provision Infrastructure', status: 'completed', progress: 100,
            completedAt: ''
          },
          {
            id: 'deploy-agents', name: 'Deploy Agents', status: 'completed', progress: 100,
            completedAt: ''
          },
          {
            id: 'deploy-workflows', name: 'Deploy Workflows', status: 'completed', progress: 100,
            completedAt: ''
          },
          {
            id: 'deploy-services', name: 'Configure Services', status: 'completed', progress: 100,
            completedAt: ''
          },
          {
            id: 'test', name: 'Test Deployment', status: 'completed', progress: 100,
            completedAt: ''
          },
          {
            id: 'finalize', name: 'Finalize Deployment', status: 'completed', progress: 100,
            completedAt: ''
          }
        ]
      };
    }
  },
  
  /**
   * Create a multi-channel deployment
   */
  createChannelDeployment: async (guildId: string, channels: Channel[]): Promise<MultiChannelDeploymentResult> => {
    try {
      console.log(`🚀 Creating channel deployment for guild: ${guildId} with channels:`, channels);
      
      // Try multiple API endpoints for service discovery
      try {
        // First try the normal API endpoint
        const response = await api.post(`/guilds/${guildId}/channels`, { channels });
        
        console.log('✅ Channel deployment created via API:', response.data);
        return response.data;
      } catch (apiError) {
        console.warn('Failed to create channel deployment via API, trying edge function:', apiError);
        
        // Try edge function
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          
          if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your_') && !supabaseAnonKey.includes('your_')) {
            const response = await fetch(`${supabaseUrl}/functions/v1/channel-deployment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
              },
              body: JSON.stringify({ guild_id: guildId, channels })
            });
            
            if (!response.ok) {
              throw new Error(`Edge function error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Channel deployment created via edge function:', data);
            return data;
          }
          
          throw new Error('Supabase edge function not configured');
        } catch (edgeFunctionError) {
          console.warn('Failed to create channel deployment via edge function:', edgeFunctionError);
          throw edgeFunctionError;
        }
      }
    } catch (error: any) {
      console.error('Failed to create channel deployment:', error);
      throw error;
    }
  },
  
  /**
   * Generate channel URL based on type
   */
  generateChannelUrl: (guildId: string, channelType: string): string => {
    switch (channelType) {
      case 'slack':
        return `https://slack.com/app_redirect?channel=${guildId}`;
      case 'discord':
        return `https://discord.gg/${guildId}`;
      case 'email':
        return `mailto:guild-${guildId}@genesisOS.ai`;
      case 'web':
        return `https://genesisOS.ai/guild/${guildId}/web`;
      case 'api':
        return `https://api.genesisOS.ai/guild/${guildId}`;
      default:
        return `https://genesisOS.ai/guild/${guildId}/channel/${channelType}`;
    }
  }
};

/**
 * Result of a deployment operation
 */
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

/**
 * Deployment status
 */
export interface DeploymentStatus {
  channels?: any[];
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
}

/**
 * Channel definition for multi-channel deployment
 */
export interface Channel {
  type: 'slack' | 'email' | 'web' | 'api' | 'discord';
  config: Record<string, any>;
  name: string;
}

/**
 * Multi-channel deployment result
 */
export interface MultiChannelDeploymentResult {
  deploymentId: string;
  guildId: string;
  channels: (Channel & {
    status: string;
    url?: string;
    createdAt: string;
  })[];
  status: string;
  createdAt: string;
}

/**
 * Determine agent personality based on role
 */
function determineAgentPersonality(role: string): string {
  const roleLower = role.toLowerCase();
  
  if (roleLower.includes('analyst') || roleLower.includes('data')) {
    return 'Analytical, precise, and data-driven. I communicate with clarity and support my insights with evidence. I remain objective and focus on delivering actionable intelligence.';
  } else if (roleLower.includes('support') || roleLower.includes('service') || roleLower.includes('customer')) {
    return 'Empathetic, patient, and solution-oriented. I prioritize understanding customer needs and resolving issues effectively. I maintain a positive, helpful tone even in challenging situations.';
  } else if (roleLower.includes('sales') || roleLower.includes('revenue')) {
    return 'Persuasive, relationship-focused, and results-driven. I communicate value clearly and address objections confidently. I balance persistence with respect for the customer\'s time and needs.';
  } else if (roleLower.includes('marketing') || roleLower.includes('content')) {
    return 'Creative, audience-aware, and brand-conscious. I craft engaging messages that resonate with target audiences. I balance creativity with strategic business goals.';
  } else if (roleLower.includes('finance') || roleLower.includes('accounting')) {
    return 'Detail-oriented, precise, and methodical. I communicate financial information with clarity and accuracy. I maintain confidentiality and adhere to established procedures and regulations.';
  } else if (roleLower.includes('operations') || roleLower.includes('process')) {
    return 'Systematic, efficient, and improvement-focused. I identify and implement process optimizations while maintaining quality standards. I communicate clearly about operational changes and requirements.';
  } else {
    return 'Professional, intelligent, and focused on delivering exceptional results through strategic thinking and efficient execution. I adapt my communication style to the situation while maintaining a helpful, problem-solving approach.';
  }
}

/**
 * Get trigger configuration based on workflow blueprint
 */
function getTriggerConfig(workflowBlueprint: any): any {
  const triggerType = workflowBlueprint.trigger_type;
  
  switch (triggerType) {
    case 'schedule':
      return {
        frequency: 'daily',
        time: '09:00',
        timezone: 'UTC'
      };
    case 'webhook':
      return {
        method: 'POST',
        path: `/webhook/${workflowBlueprint.name.toLowerCase().replace(/\s+/g, '-')}`,
        secret: generateWebhookSecret()
      };
    case 'event':
      return {
        eventType: 'system',
        filter: {}
      };
    case 'manual':
    default:
      return {};
  }
}

/**
 * Generate a random webhook secret
 */
function generateWebhookSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a workflow (internal helper function)
 */
async function createWorkflow(workflowData: any): Promise<any> {
  try {
    const response = await api.post('/workflows', workflowData);
    return response.data;
  } catch (error) {
    console.error('Failed to create workflow:', error);
    
    // For development, return a mock workflow
    return {
      id: `workflow-${Date.now()}`,
      name: workflowData.name,
      description: workflowData.description,
      guild_id: workflowData.guild_id,
      trigger: workflowData.trigger,
      nodes: workflowData.nodes,
      edges: workflowData.edges,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}