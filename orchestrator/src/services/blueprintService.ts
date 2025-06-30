import { v4 as uuidv4 } from 'uuid';
import agentService from './agentService';

// Blueprint structure interface
interface Blueprint {
  id: string;
  user_input: string;
  interpretation: string;
  suggested_structure: {
    guild_name: string;
    guild_purpose: string;
    agents: Array<{
      name: string;
      role: string;
      description: string;
      tools_needed: string[];
    }>;
    workflows: Array<{
      name: string;
      description: string;
      trigger_type: string;
    }>;
  };
  status?: string;
  created_at?: string;
}

// Service for blueprint operations
class BlueprintService {
  private blueprintCache: Record<string, Blueprint> = {};
  
  constructor() {
    console.log('🧠 Blueprint Service initialized');
  }

  /**
   * Generate a blueprint from user input
   */
  public async generateBlueprint(userInput: string): Promise<Blueprint> {
    try {
      console.log(`🧠 Generating blueprint from user input: ${userInput.substring(0, 50)}...`);
      
      // Try to generate using the agent service
      try {
        const blueprint = await agentService.generateBlueprint(userInput);
        console.log(`✅ Blueprint generated via agent service: ${blueprint.id}`);
        
        // Store in cache
        this.blueprintCache[blueprint.id] = blueprint;
        
        return blueprint;
      } catch (error) {
        console.warn(`⚠️ Failed to generate blueprint via agent service, using fallback generator`);
        return this.generateFallbackBlueprint(userInput);
      }
    } catch (error: any) {
      console.error(`❌ Error generating blueprint:`, error);
      throw new Error(`Blueprint generation failed: ${error.message}`);
    }
  }

  /**
   * Generate a fallback blueprint when the agent service is unavailable
   */
  private generateFallbackBlueprint(userInput: string): Blueprint {
    console.log(`🔄 Generating fallback blueprint for: ${userInput.substring(0, 50)}...`);
    
    // Parse the input to determine guild type
    const input = userInput.toLowerCase();
    
    // Generate a guild name based on user input
    let guild_name: string;
    let guild_purpose: string;
    let agents: Array<{ name: string; role: string; description: string; tools_needed: string[] }> = [];
    let workflows: Array<{ name: string; description: string; trigger_type: string }> = [];
    
    if (input.includes('customer') || input.includes('support')) {
      guild_name = 'Customer Success Intelligence Guild';
      guild_purpose = 'Automate and enhance customer support operations';
      
      agents = [
        {
          name: 'Support Specialist',
          role: 'Customer Support Lead',
          description: 'Handles customer inquiries and resolves issues efficiently',
          tools_needed: ['Zendesk API', 'Email API', 'Knowledge Base']
        },
        {
          name: 'Customer Insights Analyst',
          role: 'Support Data Analyst',
          description: 'Analyzes support data to identify trends and improvement opportunities',
          tools_needed: ['Google Analytics', 'Database', 'Reporting Tools']
        }
      ];
      
      workflows = [
        {
          name: 'Support Ticket Resolution',
          description: 'Automatically categorizes and routes customer support tickets',
          trigger_type: 'webhook'
        },
        {
          name: 'Customer Satisfaction Analysis',
          description: 'Analyzes feedback and generates improvement recommendations',
          trigger_type: 'schedule'
        }
      ];
    } else if (input.includes('sales') || input.includes('revenue')) {
      guild_name = 'Revenue Growth Guild';
      guild_purpose = 'Boost sales performance and optimize revenue generation';
      
      agents = [
        {
          name: 'Lead Generation Specialist',
          role: 'Sales Development Agent',
          description: 'Identifies and qualifies potential sales leads',
          tools_needed: ['CRM API', 'LinkedIn API', 'Email API']
        },
        {
          name: 'Sales Analytics Expert',
          role: 'Revenue Analyst',
          description: 'Analyzes sales data and recommends optimization strategies',
          tools_needed: ['Spreadsheet API', 'Data Visualization', 'CRM API']
        }
      ];
      
      workflows = [
        {
          name: 'Lead Qualification Pipeline',
          description: 'Automatically scores and nurtures leads through the sales funnel',
          trigger_type: 'schedule'
        },
        {
          name: 'Sales Performance Dashboard',
          description: 'Generates and distributes sales performance reports',
          trigger_type: 'schedule'
        }
      ];
    } else if (input.includes('marketing') || input.includes('content')) {
      guild_name = 'Marketing Intelligence Guild';
      guild_purpose = 'Drive marketing campaigns and content creation';
      
      agents = [
        {
          name: 'Content Strategist',
          role: 'Content Marketing Specialist',
          description: 'Creates and optimizes marketing content across channels',
          tools_needed: ['CMS API', 'SEO Tools', 'Social Media API']
        },
        {
          name: 'Campaign Manager',
          role: 'Marketing Campaign Orchestrator',
          description: 'Plans and executes integrated marketing campaigns',
          tools_needed: ['Analytics API', 'Email Marketing', 'Ad Platform API']
        }
      ];
      
      workflows = [
        {
          name: 'Content Calendar Management',
          description: 'Manages content planning, creation, and publishing schedule',
          trigger_type: 'schedule'
        },
        {
          name: 'Campaign Performance Tracking',
          description: 'Monitors and reports on marketing campaign metrics',
          trigger_type: 'schedule'
        }
      ];
    } else if (input.includes('data') || input.includes('analytics')) {
      guild_name = 'Data Intelligence Guild';
      guild_purpose = 'Extract insights and value from business data';
      
      agents = [
        {
          name: 'Data Analyst',
          role: 'Business Intelligence Specialist',
          description: 'Analyzes business data and generates actionable insights',
          tools_needed: ['Database', 'BI Tools', 'Data Visualization']
        },
        {
          name: 'Reporting Automation Specialist',
          role: 'Report Automation Expert',
          description: 'Builds and maintains automated reporting systems',
          tools_needed: ['Spreadsheet API', 'Dashboard Tools', 'Data Connectors']
        }
      ];
      
      workflows = [
        {
          name: 'Automated Business Reports',
          description: 'Generates and distributes regular business reports',
          trigger_type: 'schedule'
        },
        {
          name: 'Data Anomaly Detection',
          description: 'Monitors data for anomalies and alerts stakeholders',
          trigger_type: 'event'
        }
      ];
    } else {
      guild_name = 'Business Automation Guild';
      guild_purpose = 'Automate core business processes for greater efficiency';
      
      agents = [
        {
          name: 'Process Automation Specialist',
          role: 'Workflow Optimization Expert',
          description: 'Identifies and implements business process automation',
          tools_needed: ['Workflow API', 'Database', 'Integration Platform']
        },
        {
          name: 'Business Analyst',
          role: 'Process Analysis Expert',
          description: 'Analyzes business operations and recommends improvements',
          tools_needed: ['Analytics Tools', 'Reporting API', 'Process Mining']
        }
      ];
      
      workflows = [
        {
          name: 'Operational Status Report',
          description: 'Generates regular reports on business operations',
          trigger_type: 'schedule'
        },
        {
          name: 'Process Optimization Workflow',
          description: 'Identifies and implements process improvements',
          trigger_type: 'manual'
        }
      ];
    }
    
    // Create blueprint ID
    const id = `blueprint-${uuidv4()}`;
    
    // Create the blueprint
    const blueprint: Blueprint = {
      id,
      user_input: userInput,
      interpretation: `I understand you want to ${userInput}. I've created a blueprint to help you achieve this through an intelligent AI guild.`,
      suggested_structure: {
        guild_name,
        guild_purpose,
        agents,
        workflows
      },
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    // Store in cache
    this.blueprintCache[id] = blueprint;
    
    return blueprint;
  }

  /**
   * Enhance a blueprint with additional intelligent recommendations
   */
  public async enhanceBlueprint(blueprint: Blueprint): Promise<Blueprint> {
    try {
      console.log(`🧠 Enhancing blueprint: ${blueprint.id}`);
      
      // In a full implementation, we would use AI to enhance the blueprint
      // For now, we'll just add some basic enhancements
      
      // Add an additional agent if there are fewer than 3
      if (blueprint.suggested_structure.agents.length < 3) {
        const existingRoles = blueprint.suggested_structure.agents.map(agent => agent.role.toLowerCase());
        
        // Add a complementary agent
        if (!existingRoles.some(role => role.includes('analyst') || role.includes('data'))) {
          blueprint.suggested_structure.agents.push({
            name: 'Data Intelligence Expert',
            role: 'Analytics Specialist',
            description: 'Analyzes data and provides actionable insights to optimize operations',
            tools_needed: ['Data Visualization API', 'Database', 'Reporting Tools']
          });
        } else if (!existingRoles.some(role => role.includes('automation') || role.includes('process'))) {
          blueprint.suggested_structure.agents.push({
            name: 'Automation Engineer',
            role: 'Process Automation Specialist',
            description: 'Designs and implements automated workflows to improve efficiency',
            tools_needed: ['Workflow Engine', 'Integration API', 'Script Runner']
          });
        }
      }
      
      // Add an additional workflow if there is only one
      if (blueprint.suggested_structure.workflows.length < 2) {
        blueprint.suggested_structure.workflows.push({
          name: 'Performance Monitoring',
          description: 'Continuously monitors system performance and sends alerts on anomalies',
          trigger_type: 'schedule'
        });
      }
      
      // Update the cache
      this.blueprintCache[blueprint.id] = blueprint;
      
      return blueprint;
    } catch (error: any) {
      console.error(`❌ Error enhancing blueprint:`, error);
      return blueprint; // Return the original blueprint if enhancement fails
    }
  }

  /**
   * Get a blueprint by ID
   */
  public getBlueprint(blueprintId: string): Blueprint | null {
    return this.blueprintCache[blueprintId] || null;
  }

  /**
   * Store a blueprint
   */
  public storeBlueprint(blueprint: Blueprint): Blueprint {
    this.blueprintCache[blueprint.id] = blueprint;
    return blueprint;
  }

  /**
   * Update a blueprint
   */
  public updateBlueprint(blueprintId: string, updates: Partial<Blueprint>): Blueprint | null {
    const blueprint = this.blueprintCache[blueprintId];
    if (!blueprint) return null;
    
    const updatedBlueprint = {
      ...blueprint,
      ...updates,
      suggested_structure: {
        ...blueprint.suggested_structure,
        ...(updates.suggested_structure || {})
      }
    };
    
    this.blueprintCache[blueprintId] = updatedBlueprint;
    return updatedBlueprint;
  }

  /**
   * Generate canvas nodes and edges from a blueprint
   */
  public generateCanvasFromBlueprint(blueprint: Blueprint): { nodes: any[]; edges: any[] } {
    console.log(`🎨 Generating canvas from blueprint: ${blueprint.id}`);
    
    const nodes: any[] = [];
    const edges: any[] = [];
    
    // Create trigger node
    nodes.push({
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 50, y: 200 },
      data: {
        label: 'Guild Activation',
        triggerType: 'manual',
        description: `Initiates the ${blueprint.suggested_structure.guild_name} workflow`,
        icon: 'Rocket',
        color: 'from-emerald-500 to-teal-500',
        status: 'ready'
      },
    });
    
    // Create agent nodes with smart layout algorithm
    blueprint.suggested_structure.agents.forEach((agent, index) => {
      const angle = (index * 2 * Math.PI) / blueprint.suggested_structure.agents.length;
      const radius = 300;
      const centerX = 500;
      const centerY = 300;
      
      // Determine agent icon based on role
      const getAgentIcon = (role: string) => {
        const roleKeywords = {
          'analyst': 'BarChart',
          'support': 'MessageSquare',
          'sales': 'DollarSign',
          'marketing': 'Sparkles',
          'finance': 'DollarSign',
          'operations': 'Settings',
          'hr': 'Users',
          'customer': 'Heart',
          'data': 'Database',
          'content': 'FileText',
          'social': 'Share2',
          'email': 'Mail',
          'report': 'FileText',
          'intelligence': 'Brain',
          'specialist': 'Target',
        };

        // Find matching role keyword
        for (const keyword in roleKeywords) {
          if (role.toLowerCase().includes(keyword)) {
            return roleKeywords[keyword as keyof typeof roleKeywords];
          }
        }

        return 'Bot';
      };
      
      // Determine agent color
      const getAgentColor = (index: number) => {
        const colors = [
          'from-purple-500 to-pink-500',
          'from-blue-500 to-cyan-500',
          'from-emerald-500 to-teal-500',
          'from-orange-500 to-red-500',
          'from-violet-500 to-purple-500',
          'from-indigo-500 to-blue-500',
        ];
        return colors[index % colors.length];
      };
      
      const agentNode = {
        id: `agent-${index + 1}`,
        type: 'agent',
        position: { 
          x: centerX + Math.cos(angle) * radius, 
          y: centerY + Math.sin(angle) * radius 
        },
        data: {
          label: agent.name,
          role: agent.role,
          description: agent.description,
          tools: agent.tools_needed,
          icon: getAgentIcon(agent.role),
          color: getAgentColor(index),
          status: 'ready'
        },
      };
      nodes.push(agentNode);

      // Create connections between agents and trigger
      if (index === 0) {
        edges.push({
          id: `trigger-agent-${index + 1}`,
          source: 'trigger-1',
          target: `agent-${index + 1}`,
          type: 'smoothstep',
          animated: true, 
          style: { stroke: '#10b981', strokeWidth: 3 },
          markerEnd: { type: 'arrowclosed', color: '#10b981' },
          sourceHandle: null,
          targetHandle: null
        });
      }

      // Create connections between agents
      if (index > 0) {
        edges.push({
          id: `agent-${index}-agent-${index + 1}`,
          source: `agent-${index}`,
          target: `agent-${index + 1}`,
          type: 'smoothstep',
          animated: true, 
          style: { stroke: '#8b5cf6', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#8b5cf6' },
          sourceHandle: null,
          targetHandle: null
        });
      }
    });

    // Create workflow action nodes
    const getWorkflowIcon = (triggerType: string) => {
      const triggerIcons: Record<string, string> = {
        'schedule': 'Clock',
        'webhook': 'Globe',
        'manual': 'Play',
        'event': 'Zap',
      };
      return triggerIcons[triggerType] || 'Workflow';
    };

    // Get workflow color
    const getWorkflowColor = (triggerType: string) => {
      const triggerColors: Record<string, string> = {
        'schedule': 'from-blue-500 to-indigo-500',
        'webhook': 'from-green-500 to-emerald-500',
        'manual': 'from-purple-500 to-violet-500',
        'event': 'from-yellow-500 to-orange-500',
      };
      return triggerColors[triggerType] || 'from-gray-500 to-slate-500';
    };

    // Map trigger type to action type
    const mapTriggerTypeToActionType = (triggerType: string) => {
      const mapping: Record<string, string> = {
        'schedule': 'database',
        'webhook': 'api',
        'manual': 'notification',
        'event': 'webhook',
      };
      return mapping[triggerType] || 'api';
    };

    blueprint.suggested_structure.workflows.forEach((workflow, index) => {
      const workflowNode = {
        id: `workflow-${index + 1}`,
        type: 'action',
        position: { 
          x: 200 + (index * 400), 
          y: 600 
        },
        data: {
          label: workflow.name,
          description: workflow.description,
          actionType: mapTriggerTypeToActionType(workflow.trigger_type),
          icon: getWorkflowIcon(workflow.trigger_type),
          color: getWorkflowColor(workflow.trigger_type),
          status: 'pending'
        },
      };
      nodes.push(workflowNode);

      // Connect agents to workflows
      if (blueprint.suggested_structure.agents.length > 0) {
        const targetAgentIndex = Math.min(index + 1, blueprint.suggested_structure.agents.length);
        edges.push({
          id: `agent-${targetAgentIndex}-workflow-${index + 1}`,
          source: `agent-${targetAgentIndex}`,
          target: `workflow-${index + 1}`,
          type: 'smoothstep',
          animated: true, 
          style: { stroke: '#f59e0b', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#f59e0b' },
          sourceHandle: null,
          targetHandle: null
        });
      }
    });

    return { nodes, edges };
  }
}

// Create singleton instance
const blueprintService = new BlueprintService();

export default blueprintService;