import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import agentService from './agentService';
import memoryService from './memoryService';

// Type definitions for workflow components
interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string;
  animated?: boolean;
  style?: any;
}

interface ExecutionContext {
  id: string;
  flowId: string;
  status: 'initializing' | 'running' | 'completed' | 'failed' | 'paused';
  startTime: Date;
  endTime?: Date;
  nodes: Record<string, NodeExecutionState>;
  variables: Record<string, any>;
  logs: ExecutionLog[];
  currentNodeId?: string;
}

interface NodeExecutionState {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  output?: any;
  error?: string;
}

interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  nodeId?: string;
  details?: any;
}

class WorkflowService {
  private executionContexts: Record<string, ExecutionContext> = {};

  constructor() {
    console.log('⚙️ Workflow Service initialized');
  }

  /**
   * Execute a workflow with the given nodes and edges
   */
  public async executeWorkflow(
    flowId: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    context: Record<string, any> = {}
  ): Promise<{ executionId: string }> {
    // Create a unique execution ID
    const executionId = uuidv4();
    
    // Initialize execution context
    const executionContext: ExecutionContext = {
      id: executionId,
      flowId,
      status: 'initializing',
      startTime: new Date(),
      nodes: {},
      variables: {
        ...context,
        executionId
      },
      logs: []
    };
    
    // Initialize node states
    nodes.forEach(node => {
      executionContext.nodes[node.id] = {
        id: node.id,
        status: 'pending'
      };
    });
    
    // Store the execution context
    this.executionContexts[executionId] = executionContext;
    
    // Log the start of execution
    this.addExecutionLog(executionId, 'info', `Workflow execution started: ${flowId}`, null, {
      nodeCount: nodes.length,
      edgeCount: edges.length
    });
    
    // Start the workflow execution (non-blocking)
    this.processWorkflow(executionId, nodes, edges).catch(error => {
      console.error(`❌ Error executing workflow:`, error);
      
      // Update execution context
      const context = this.executionContexts[executionId];
      if (context) {
        context.status = 'failed';
        context.endTime = new Date();
        
        this.addExecutionLog(executionId, 'error', `Workflow execution failed: ${error.message}`);
      }
    });
    
    // Return the execution ID immediately
    return { executionId };
  }

  /**
   * Process the workflow execution (internal method)
   */
  private async processWorkflow(
    executionId: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<void> {
    const context = this.executionContexts[executionId];
    if (!context) {
      throw new Error(`Execution context not found: ${executionId}`);
    }
    
    // Update context status
    context.status = 'running';
    
    try {
      // Find the start nodes (trigger nodes or those with no incoming edges)
      const startNodes = this.findStartNodes(nodes, edges);
      
      if (startNodes.length === 0) {
        throw new Error('No start nodes found in workflow');
      }
      
      // Log start nodes
      this.addExecutionLog(executionId, 'info', `Starting workflow from ${startNodes.length} entry points`, null, {
        startNodeIds: startNodes.map(node => node.id)
      });
      
      // Execute each start node
      for (const startNode of startNodes) {
        await this.executeNode(executionId, startNode, nodes, edges);
      }
      
      // Mark execution as completed
      context.status = 'completed';
      context.endTime = new Date();
      
      this.addExecutionLog(executionId, 'info', `Workflow execution completed successfully`);
    } catch (error: any) {
      // Mark execution as failed
      context.status = 'failed';
      context.endTime = new Date();
      
      this.addExecutionLog(executionId, 'error', `Workflow execution failed: ${error.message}`);
      
      throw error;
    }
  }

  /**
   * Find start nodes in the workflow
   */
  private findStartNodes(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): WorkflowNode[] {
    // Find nodes that have no incoming edges or are trigger nodes
    const nodesWithIncomingEdges = new Set(
      edges.map(edge => edge.target)
    );
    
    return nodes.filter(node => 
      node.type === 'trigger' || !nodesWithIncomingEdges.has(node.id)
    );
  }

  /**
   * Execute a single node in the workflow
   */
  private async executeNode(
    executionId: string,
    node: WorkflowNode,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
  ): Promise<any> {
    const context = this.executionContexts[executionId];
    if (!context) {
      throw new Error(`Execution context not found: ${executionId}`);
    }
    
    // Skip if node already executed
    if (
      context.nodes[node.id].status === 'completed' ||
      context.nodes[node.id].status === 'failed'
    ) {
      return context.nodes[node.id].output;
    }
    
    // Update node state
    context.nodes[node.id].status = 'running';
    context.nodes[node.id].startTime = new Date();
    context.currentNodeId = node.id;
    
    // Log node execution start
    this.addExecutionLog(
      executionId,
      'info',
      `Executing node: ${node.id}`,
      node.id,
      { nodeType: node.type, nodeData: node.data }
    );
    
    try {
      // Execute based on node type
      let output;
      
      switch (node.type) {
        case 'trigger':
          // Trigger nodes just pass through their data
          output = {
            triggered: true,
            timestamp: new Date(),
            data: node.data
          };
          break;
          
        case 'agent':
          // Execute an agent node
          output = await this.executeAgentNode(node, context.variables);
          break;
          
        case 'action':
          // Execute an action node
          output = await this.executeActionNode(node, context.variables);
          break;
          
        case 'condition':
          // Execute a condition node
          output = await this.executeConditionNode(node, context.variables);
          break;
          
        case 'delay':
          // Execute a delay node
          output = await this.executeDelayNode(node, context.variables);
          break;
          
        default:
          throw new Error(`Unsupported node type: ${node.type}`);
      }
      
      // Update node state with output
      context.nodes[node.id].status = 'completed';
      context.nodes[node.id].endTime = new Date();
      context.nodes[node.id].output = output;
      
      // Log node execution completion
      this.addExecutionLog(
        executionId,
        'info',
        `Node executed successfully: ${node.id}`,
        node.id,
        { output }
      );
      
      // Find outgoing edges from this node
      let nextEdges: WorkflowEdge[] = edges.filter(edge => edge.source === node.id);
      
      // For condition nodes, filter edges based on evaluation result
      if (node.type === 'condition') {
        const sourceHandle = output.result ? 'true' : 'false';
        nextEdges = nextEdges.filter(edge => 
          !edge.sourceHandle || edge.sourceHandle === sourceHandle
        );
      }
      
      // Execute next nodes
      for (const edge of nextEdges) {
        const nextNode = nodes.find(n => n.id === edge.target);
        if (nextNode) {
          // Pass output to next node's variables
          context.variables[`${node.id}_output`] = output;
          
          // Execute the next node
          await this.executeNode(executionId, nextNode, nodes, edges);
        }
      }
      
      return output;
    } catch (error: any) {
      // Update node state with error
      context.nodes[node.id].status = 'failed';
      context.nodes[node.id].endTime = new Date();
      context.nodes[node.id].error = error.message;
      
      // Log node execution failure
      this.addExecutionLog(
        executionId,
        'error',
        `Node execution failed: ${node.id} - ${error.message}`,
        node.id,
        { error: error.message, stack: error.stack }
      );
      
      throw error;
    }
  }

  /**
   * Execute an agent node
   */
  private async executeAgentNode(
    node: WorkflowNode,
    variables: Record<string, any>
  ): Promise<any> {
    const { label, role, description, tools = [], status } = node.data;
    
    // Skip if the agent is not in a ready state
    if (status !== 'ready' && status !== 'completed') {
      throw new Error(`Agent not ready: ${node.id}`);
    }
    
    // Get agent ID from data or generate one
    const agentId = node.data.agentId || `agent-${node.id}`;
    
    // Extract input from variables or use a default
    let input = variables.input || `Execute agent task for ${label}`;
    
    // Use node-specific input if available
    if (variables[`${node.id}_input`]) {
      input = variables[`${node.id}_input`];
    }
    
    // Execute the agent
    try {
      const result = await agentService.executeAgent(
        agentId,
        input,
        {
          executionId: variables.executionId,
          agent_name: label,
          agent_role: role,
          agent_description: description,
          agent_tools: tools,
          memory_enabled: true,
          user_id: variables.userId || variables.user_id
        }
      );
      
      return {
        output: result.output,
        status: result.status,
        agentId,
        metadata: {
          role,
          chain_of_thought: result.chain_of_thought
        }
      };
    } catch (error: any) {
      throw new Error(`Agent execution failed: ${error.message}`);
    }
  }

  /**
   * Execute an action node
   */
  private async executeActionNode(
    node: WorkflowNode,
    variables: Record<string, any>
  ): Promise<any> {
    const { label, actionType, config = {} } = node.data;
    
    // Process different action types
    switch (actionType) {
      case 'api':
        return this.executeApiAction(node, variables);
        
      case 'email':
        return this.executeEmailAction(node, variables);
        
      case 'database':
        return this.executeDatabaseAction(node, variables);
        
      case 'webhook':
        return this.executeWebhookAction(node, variables);
        
      case 'notification':
        return this.executeNotificationAction(node, variables);
        
      default:
        throw new Error(`Unsupported action type: ${actionType}`);
    }
  }

  /**
   * Execute a condition node
   */
  private async executeConditionNode(
    node: WorkflowNode,
    variables: Record<string, any>
  ): Promise<any> {
    const { label, conditionType, condition } = node.data;
    
    // Simple condition evaluation
    try {
      // Prepare a function to evaluate the condition in the context of variables
      const evaluateCondition = new Function(
        ...Object.keys(variables),
        `return ${condition};`
      );
      
      // Evaluate the condition
      const result = evaluateCondition(...Object.values(variables));
      
      return {
        result: !!result,
        condition,
        evaluatedCondition: condition,
        variables: { ...variables }  // Clone to avoid reference issues
      };
    } catch (error: any) {
      throw new Error(`Condition evaluation failed: ${error.message}`);
    }
  }

  /**
   * Execute a delay node
   */
  private async executeDelayNode(
    node: WorkflowNode,
    variables: Record<string, any>
  ): Promise<any> {
    const { label, delayType, duration } = node.data;
    
    // Parse duration (e.g., "5s", "2m", "1h")
    let delayMs = 1000; // Default to 1 second
    
    if (duration) {
      const match = duration.match(/^(\d+)([smh])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        
        switch (unit) {
          case 's':
            delayMs = value * 1000;
            break;
          case 'm':
            delayMs = value * 60 * 1000;
            break;
          case 'h':
            delayMs = value * 60 * 60 * 1000;
            break;
        }
      }
    }
    
    // In a production workflow engine, we would use a more sophisticated
    // delay mechanism that doesn't block the thread. For this prototype,
    // we'll use a simple setTimeout.
    await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 5000)));
    
    return {
      delayed: true,
      duration,
      delayMs,
      timestamp: new Date()
    };
  }

  /**
   * Execute an API action
   */
  private async executeApiAction(
    node: WorkflowNode,
    variables: Record<string, any>
  ): Promise<any> {
    const { config = {} } = node.data;
    
    // Extract API configuration
    const method = config.method || 'GET';
    const url = this.replaceVariables(config.url || '', variables);
    const headers = config.headers || {};
    const body = config.body || {};
    
    // Make the API request
    try {
      const response = await axios({
        method,
        url,
        headers,
        data: method !== 'GET' ? body : undefined,
        params: method === 'GET' ? body : undefined
      });
      
      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
        config: {
          method,
          url,
          requestHeaders: headers
        }
      };
    } catch (error: any) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  /**
   * Execute an email action
   */
  private async executeEmailAction(
    node: WorkflowNode,
    variables: Record<string, any>
  ): Promise<any> {
    // In a real implementation, this would integrate with an email service
    // For now, we'll simulate a successful email send
    
    const { config = {} } = node.data;
    
    // Extract email configuration
    const recipients = config.recipients || [];
    const subject = this.replaceVariables(config.subject || '', variables);
    const body = this.replaceVariables(config.body || '', variables);
    const template = config.template || 'default';
    
    // Simulate email sending
    console.log(`📧 Simulating email send:
      To: ${recipients.join(', ')}
      Subject: ${subject}
      Template: ${template}
      Body: ${body.substring(0, 100)}...`);
    
    // Simulate a delay for email sending
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      sent: true,
      to: recipients,
      subject,
      template,
      timestamp: new Date()
    };
  }

  /**
   * Execute a database action
   */
  private async executeDatabaseAction(
    node: WorkflowNode,
    variables: Record<string, any>
  ): Promise<any> {
    // In a real implementation, this would interact with a database
    // For now, we'll simulate database operations
    
    const { config = {} } = node.data;
    
    // Extract database configuration
    const operation = config.operation || 'SELECT';
    const table = config.table || '';
    const data = config.data || {};
    const conditions = config.conditions || {};
    
    // Simulate database operation
    console.log(`🗄️ Simulating database operation:
      Operation: ${operation}
      Table: ${table}
      Data: ${JSON.stringify(data).substring(0, 100)}...
      Conditions: ${JSON.stringify(conditions).substring(0, 100)}...`);
    
    // Simulate a delay for database operation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      operation,
      table,
      success: true,
      affected_rows: Math.floor(Math.random() * 5) + 1,
      timestamp: new Date()
    };
  }

  /**
   * Execute a webhook action
   */
  private async executeWebhookAction(
    node: WorkflowNode,
    variables: Record<string, any>
  ): Promise<any> {
    const { config = {} } = node.data;
    
    // Extract webhook configuration
    const url = this.replaceVariables(config.url || '', variables);
    const method = config.method || 'POST';
    const headers = config.headers || {};
    const payload = config.payload || {};
    
    // In a production environment, we'd make the actual webhook call
    // For now, simulate it for safety
    console.log(`🌐 Simulating webhook call:
      URL: ${url}
      Method: ${method}
      Payload: ${JSON.stringify(payload).substring(0, 100)}...`);
    
    // Simulate a delay for webhook call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      sent: true,
      url,
      method,
      timestamp: new Date(),
      simulated: true
    };
  }

  /**
   * Execute a notification action
   */
  private async executeNotificationAction(
    node: WorkflowNode,
    variables: Record<string, any>
  ): Promise<any> {
    const { config = {} } = node.data;
    
    // Extract notification configuration
    const service = config.service || 'generic';
    const channel = this.replaceVariables(config.channel || '', variables);
    const message = this.replaceVariables(config.message || '', variables);
    
    // Simulate different notification services
    switch (service.toLowerCase()) {
      case 'slack':
        console.log(`💬 Simulating Slack notification to ${channel}: ${message.substring(0, 100)}...`);
        break;
      case 'teams':
        console.log(`💬 Simulating MS Teams notification to ${channel}: ${message.substring(0, 100)}...`);
        break;
      case 'discord':
        console.log(`💬 Simulating Discord notification to ${channel}: ${message.substring(0, 100)}...`);
        break;
      default:
        console.log(`💬 Simulating generic notification: ${message.substring(0, 100)}...`);
    }
    
    // Simulate a delay for notification
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      sent: true,
      service,
      channel,
      timestamp: new Date(),
      simulated: true
    };
  }

  /**
   * Get execution status
   */
  public getExecutionStatus(executionId: string): ExecutionContext | null {
    return this.executionContexts[executionId] || null;
  }

  /**
   * Add a log entry to the execution context
   */
  private addExecutionLog(
    executionId: string,
    level: 'info' | 'warning' | 'error' | 'debug',
    message: string,
    nodeId: string | null = null,
    details: any = null
  ): void {
    const context = this.executionContexts[executionId];
    if (!context) return;
    
    const log: ExecutionLog = {
      timestamp: new Date(),
      level,
      message
    };
    
    if (nodeId) {
      log.nodeId = nodeId;
    }
    
    if (details) {
      log.details = details;
    }
    
    context.logs.push(log);
  }

  /**
   * Helper to replace variables in strings
   */
  private replaceVariables(text: string, variables: Record<string, any>): string {
    return text.replace(/\${([^}]+)}/g, (match, key) => {
      const value = key.split('.')
        .reduce((obj: any, prop: string) => obj && obj[prop], variables);
      
      return value !== undefined ? String(value) : match;
    });
  }
}

// Create singleton instance
const workflowService = new WorkflowService();

export default workflowService;