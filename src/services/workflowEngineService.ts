import { Node, Edge } from '@xyflow/react';
import { v4 as uuid } from 'uuid';
import { api } from '../lib/api';

/**
 * Enhanced service for workflow engine operations with full trigger system support
 */
export const workflowEngineService = {
  /**
   * Execute a workflow with the given nodes and edges
   */
  executeWorkflow: async (
    flowId: string,
    nodes: Node[],
    edges: Edge[],
    context: Record<string, any> = {},
    options: ExecuteOptions = {}
  ): Promise<ExecutionResult> => {
    console.log('🔄 Executing workflow:', flowId);
    console.log(`Workflow contains ${nodes.length} nodes and ${edges.length} edges`);
    
    try {
      // Try to use the real API endpoint
      const response = await api.post('/executeFlow', {
        flowId,
        nodes,
        edges,
        context: {
          ...context,
          executionId: options.executionId || `exec-${uuid()}`,
          startTime: new Date().toISOString(),
          triggerType: options.triggerType || 'manual',
          triggerSource: options.triggerSource || 'user',
          priority: options.priority || 'normal',
          timeout: options.timeout || 60000
        }
      });
      
      console.log('✅ Workflow execution started successfully:', response.data.executionId);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to execute workflow:', error);
      
      // Create a fallback execution result for development
      const executionId = options.executionId || `exec-${uuid()}`;
      
      // Start local execution tracking
      startLocalExecution(executionId, nodes, edges, context, options);
      
      return {
        executionId,
        status: 'running',
        message: 'Workflow execution started (local mode)',
        startTime: new Date().toISOString()
      };
    }
  },
  
  /**
   * Create a workflow trigger schedule
   */
  createTriggerSchedule: async (
    flowId: string,
    schedule: ScheduleConfig
  ): Promise<TriggerScheduleResult> => {
    try {
      // Try to use the real API endpoint
      const response = await api.post(`/workflows/${flowId}/schedule`, schedule);
      return response.data;
    } catch (error) {
      console.error('Failed to create trigger schedule:', error);
      
      // Return mock data for development
      return {
        id: `schedule-${uuid()}`,
        flowId,
        schedule: {
          frequency: schedule.frequency,
          time: schedule.time,
          timezone: schedule.timezone,
          daysOfWeek: schedule.daysOfWeek,
          daysOfMonth: schedule.daysOfMonth
        },
        nextExecution: new Date(Date.now() + 3600000).toISOString(),
        status: 'active',
        createdAt: new Date().toISOString()
      };
    }
  },
  
  /**
   * Register a webhook trigger
   */
  registerWebhookTrigger: async (
    flowId: string,
    config: WebhookConfig
  ): Promise<WebhookTriggerResult> => {
    try {
      // Try to use the real API endpoint
      const response = await api.post(`/workflows/${flowId}/webhook`, config);
      return response.data;
    } catch (error) {
      console.error('Failed to register webhook trigger:', error);
      
      // Return mock data for development
      const webhookId = uuid();
      const webhookUrl = `${window.location.origin}/api/webhooks/${webhookId}`;
      
      return {
        id: webhookId,
        flowId,
        url: webhookUrl,
        method: config.method || 'POST',
        secret: config.secret || generateWebhookSecret(),
        createdAt: new Date().toISOString(),
        status: 'active'
      };
    }
  },
  
  /**
   * Register an event trigger
   */
  registerEventTrigger: async (
    flowId: string,
    config: EventTriggerConfig
  ): Promise<EventTriggerResult> => {
    try {
      // Try to use the real API endpoint
      const response = await api.post(`/workflows/${flowId}/event-trigger`, config);
      return response.data;
    } catch (error) {
      console.error('Failed to register event trigger:', error);
      
      // Return mock data for development
      return {
        id: `event-${uuid()}`,
        flowId,
        eventType: config.eventType,
        filter: config.filter || {},
        createdAt: new Date().toISOString(),
        status: 'active'
      };
    }
  },
  
  /**
   * Get all workflow triggers
   */
  getWorkflowTriggers: async (flowId: string): Promise<WorkflowTriggers> => {
    try {
      // Try to use the real API endpoint
      const response = await api.get(`/workflows/${flowId}/triggers`);
      return response.data;
    } catch (error) {
      console.error('Failed to get workflow triggers:', error);
      
      // Return mock data for development
      return {
        flowId,
        schedules: [{
          id: `schedule-${uuid()}`,
          flowId,
          schedule: {
            frequency: 'daily',
            time: '09:00',
            timezone: 'UTC',
            daysOfWeek: [],
            daysOfMonth: []
          },
          nextExecution: new Date(Date.now() + 3600000).toISOString(),
          status: 'active',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }],
        webhooks: [{
          id: `webhook-${uuid()}`,
          flowId,
          url: `${window.location.origin}/api/webhooks/${uuid()}`,
          method: 'POST',
          secret: generateWebhookSecret(),
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          status: 'active'
        }],
        events: [{
          id: `event-${uuid()}`,
          flowId,
          eventType: 'data_updated',
          filter: { entity: 'users' },
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          status: 'active'
        }]
      };
    }
  },
  
  /**
   * Get execution status
   */
  getExecutionStatus: async (executionId: string): Promise<ExecutionStatus> => {
    try {
      // Try to use the real API endpoint
      const response = await api.get(`/execution/${executionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get execution status:', error);
      
      // Check local execution status
      const status = getLocalExecutionStatus(executionId);
      if (status) {
        return status;
      }
      
      // Default fallback status
      return {
        id: executionId,
        status: 'running',
        progress: Math.random() * 100,
        startTime: new Date(Date.now() - 30000).toISOString(),
        currentNodeId: null,
        nodes: {},
        logs: [{
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Execution status unavailable, using fallback'
        }]
      };
    }
  },
  
  /**
   * Cancel a workflow execution
   */
  cancelExecution: async (executionId: string): Promise<boolean> => {
    try {
      // Try to use the real API endpoint
      const response = await api.post(`/execution/${executionId}/cancel`);
      return response.data.success;
    } catch (error) {
      console.error('Failed to cancel execution:', error);
      
      // Simulate cancellation locally
      cancelLocalExecution(executionId);
      return true;
    }
  },
  
  /**
   * Get execution history for a workflow
   */
  getExecutionHistory: async (
    flowId: string, 
    options: { limit?: number; offset?: number; filter?: string }
  ): Promise<ExecutionHistoryEntry[]> => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.filter) params.append('filter', options.filter);
      
      // Try to use the real API endpoint
      const response = await api.get(`/workflow/${flowId}/history?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get execution history:', error);
      
      // Return mock data for development
      return [
        {
          executionId: `exec-${uuid()}`,
          flowId,
          status: 'completed',
          startTime: new Date(Date.now() - 86400000).toISOString(), // yesterday
          endTime: new Date(Date.now() - 86340000).toISOString(),
          executionTime: 60000,
          nodeCount: 5,
          successCount: 5,
          failureCount: 0
        },
        {
          executionId: `exec-${uuid()}`,
          flowId,
          status: 'failed',
          startTime: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          endTime: new Date(Date.now() - 43150000).toISOString(),
          executionTime: 50000,
          nodeCount: 5,
          successCount: 3,
          failureCount: 2,
          error: 'External API timeout'
        },
        {
          executionId: `exec-${uuid()}`,
          flowId,
          status: 'completed',
          startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          endTime: new Date(Date.now() - 3540000).toISOString(), 
          executionTime: 60000,
          nodeCount: 5,
          successCount: 5,
          failureCount: 0
        }
      ];
    }
  }
};

// Local execution tracking system for development
const localExecutions: Record<string, LocalExecution> = {};

interface LocalExecution {
  executionId: string;
  nodes: Node[];
  edges: Edge[];
  context: Record<string, any>;
  options: ExecuteOptions;
  startTime: Date;
  endTime?: Date;
  status: 'initializing' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentNodeId?: string;
  completedNodeIds: string[];
  failedNodeIds: string[];
  logs: ExecutionLog[];
  intervalId?: number;
}

interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  nodeId?: string;
  details?: any;
}

/**
 * Start a local execution simulation
 */
function startLocalExecution(
  executionId: string,
  nodes: Node[],
  edges: Edge[],
  context: Record<string, any>,
  options: ExecuteOptions = {}
): void {
  // Create local execution object
  const execution: LocalExecution = {
    executionId,
    nodes,
    edges,
    context,
    options,
    startTime: new Date(),
    status: 'initializing',
    progress: 0,
    completedNodeIds: [],
    failedNodeIds: [],
    logs: [{
      timestamp: new Date(),
      level: 'info',
      message: 'Local execution started',
      details: { triggerType: options.triggerType || 'manual' }
    }]
  };
  
  // Store execution
  localExecutions[executionId] = execution;
  
  // Simulate initialization
  setTimeout(() => {
    execution.status = 'running';
    execution.logs.push({
      timestamp: new Date(),
      level: 'info',
      message: 'Execution initialized, starting nodes'
    });
    
    // Start execution simulation
    simulateExecution(executionId);
  }, 500);
}

/**
 * Simulate execution progress
 */
function simulateExecution(executionId: string): void {
  const execution = localExecutions[executionId];
  if (!execution) return;
  
  // Find nodes to execute (not yet completed or failed)
  const pendingNodes = execution.nodes.filter(
    node => !execution.completedNodeIds.includes(node.id) && 
            !execution.failedNodeIds.includes(node.id)
  );
  
  if (pendingNodes.length === 0) {
    // All nodes processed
    completeExecution(executionId);
    return;
  }
  
  // Sort nodes by their position in the graph
  const sortedNodes = sortNodesByExecutionOrder(pendingNodes, execution.edges);
  
  // Get next node to execute
  const nextNode = sortedNodes[0];
  
  // Update current node
  execution.currentNodeId = nextNode.id;
  execution.logs.push({
    timestamp: new Date(),
    level: 'info',
    message: `Executing node: ${nextNode.id} - ${nextNode.data?.label || 'Unnamed node'}`,
    nodeId: nextNode.id
  });
  
  // Simulate node execution
  const nodeExecutionTime = 1000 + Math.random() * 2000; // 1-3 seconds
  
  setTimeout(() => {
    // Simulate success or failure (90% success rate)
    if (Math.random() > 0.1) {
      // Success
      execution.completedNodeIds.push(nextNode.id);
      execution.logs.push({
        timestamp: new Date(),
        level: 'info',
        message: `Node executed successfully: ${nextNode.id}`,
        nodeId: nextNode.id
      });
    } else {
      // Failure
      execution.failedNodeIds.push(nextNode.id);
      execution.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Node execution failed: ${nextNode.id}`,
        nodeId: nextNode.id,
        details: {
          error: 'Simulated failure',
          node: nextNode.id
        }
      });
    }
    
    // Update progress
    execution.progress = (
      (execution.completedNodeIds.length + execution.failedNodeIds.length) / 
      execution.nodes.length * 100
    );
    
    // Continue execution
    simulateExecution(executionId);
  }, nodeExecutionTime);
}

/**
 * Complete a local execution
 */
function completeExecution(executionId: string): void {
  const execution = localExecutions[executionId];
  if (!execution) return;
  
  execution.status = execution.failedNodeIds.length > 0 ? 'failed' : 'completed';
  execution.endTime = new Date();
  execution.progress = 100;
  execution.currentNodeId = undefined;
  
  execution.logs.push({
    timestamp: new Date(),
    level: execution.failedNodeIds.length > 0 ? 'error' : 'info',
    message: execution.failedNodeIds.length > 0 
      ? `Execution completed with ${execution.failedNodeIds.length} failures` 
      : 'Execution completed successfully'
  });
  
  console.log(`✅ Local execution ${executionId} completed with status: ${execution.status}`);
}

/**
 * Cancel a local execution
 */
function cancelLocalExecution(executionId: string): void {
  const execution = localExecutions[executionId];
  if (!execution) return;
  
  execution.status = 'cancelled';
  execution.endTime = new Date();
  
  execution.logs.push({
    timestamp: new Date(),
    level: 'warning',
    message: 'Execution cancelled by user'
  });
  
  console.log(`🛑 Local execution ${executionId} cancelled`);
}

/**
 * Get local execution status
 */
function getLocalExecutionStatus(executionId: string): ExecutionStatus | null {
  const execution = localExecutions[executionId];
  if (!execution) return null;
  
  // Format node status
  const nodeStatus: Record<string, { 
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped',
    startTime?: string,
    endTime?: string,
    output?: any,
    error?: string
  }> = {};
  
  execution.nodes.forEach(node => {
    if (execution.completedNodeIds.includes(node.id)) {
      nodeStatus[node.id] = {
        status: 'completed',
        startTime: new Date(execution.startTime.getTime() + 1000).toISOString(),
        endTime: new Date(execution.startTime.getTime() + 3000).toISOString(),
        output: { success: true, data: { message: 'Node execution simulated' } }
      };
    } else if (execution.failedNodeIds.includes(node.id)) {
      nodeStatus[node.id] = {
        status: 'failed',
        startTime: new Date(execution.startTime.getTime() + 1000).toISOString(),
        endTime: new Date(execution.startTime.getTime() + 2000).toISOString(),
        error: 'Simulated error in node execution'
      };
    } else if (node.id === execution.currentNodeId) {
      nodeStatus[node.id] = {
        status: 'running',
        startTime: new Date().toISOString()
      };
    } else {
      nodeStatus[node.id] = {
        status: 'pending'
      };
    }
  });
  
  return {
    id: executionId,
    status: execution.status,
    progress: execution.progress,
    startTime: execution.startTime.toISOString(),
    endTime: execution.endTime?.toISOString(),
    currentNodeId: execution.currentNodeId,
    nodes: nodeStatus,
    logs: execution.logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      message: log.message,
      nodeId: log.nodeId,
      details: log.details
    }))
  };
}

/**
 * Sort nodes by their position in the execution graph
 */
function sortNodesByExecutionOrder(nodes: Node[], edges: Edge[]): Node[] {
  // Simple topological sort based on edges
  const nodeMap = new Map<string, Node>();
  nodes.forEach(node => nodeMap.set(node.id, node));
  
  // Count incoming edges for each node
  const incomingEdges: Record<string, number> = {};
  nodes.forEach(node => {
    incomingEdges[node.id] = 0;
  });
  
  edges.forEach(edge => {
    if (incomingEdges[edge.target] !== undefined) {
      incomingEdges[edge.target]++;
    }
  });
  
  // Find nodes with no incoming edges (start nodes)
  const sortedNodes: Node[] = [];
  const startNodes = nodes.filter(node => incomingEdges[node.id] === 0);
  
  // Add start nodes to sorted list
  sortedNodes.push(...startNodes);
  
  // For each remaining node, add it if all its dependencies are in the sorted list
  const remainingNodes = nodes.filter(node => !startNodes.includes(node));
  
  // Simple approach for sorting remaining nodes (not a full topological sort)
  // In a real implementation, this would be a proper topological sort algorithm
  while (remainingNodes.length > 0) {
    let nodeAdded = false;
    
    for (let i = 0; i < remainingNodes.length; i++) {
      const node = remainingNodes[i];
      
      // Find incoming edges to this node
      const incomingNodes = edges
        .filter(edge => edge.target === node.id)
        .map(edge => edge.source);
      
      // Check if all incoming nodes are in the sorted list
      const allDependenciesSorted = incomingNodes.every(nodeId => 
        sortedNodes.some(sortedNode => sortedNode.id === nodeId)
      );
      
      if (allDependenciesSorted) {
        sortedNodes.push(node);
        remainingNodes.splice(i, 1);
        nodeAdded = true;
        break;
      }
    }
    
    // If no node was added in this iteration, there might be a cycle
    // In that case, just add the next node in the list
    if (!nodeAdded && remainingNodes.length > 0) {
      sortedNodes.push(remainingNodes[0]);
      remainingNodes.splice(0, 1);
    }
  }
  
  return sortedNodes;
}

/**
 * Generate a random webhook secret
 */
function generateWebhookSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Type definitions
export interface ExecuteOptions {
  executionId?: string;
  triggerType?: 'manual' | 'schedule' | 'webhook' | 'event';
  triggerSource?: string;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
}

export interface ExecutionResult {
  executionId: string;
  status: string;
  message: string;
  startTime: string;
}

export interface ExecutionStatus {
  id: string;
  status: 'initializing' | 'running' | 'completed' | 'failed' | 'cancelled' | string;
  progress: number;
  startTime: string;
  endTime?: string;
  currentNodeId?: string | null;
  nodes: Record<string, {
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startTime?: string;
    endTime?: string;
    output?: any;
    error?: string;
  }>;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    nodeId?: string;
    details?: any;
  }>;
}

export interface ExecutionHistoryEntry {
  executionId: string;
  flowId: string;
  status: string;
  startTime: string;
  endTime?: string;
  executionTime: number;
  nodeCount: number;
  successCount: number;
  failureCount: number;
  error?: string;
}

export interface ScheduleConfig {
  frequency: 'minutely' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  time?: string; // Format: 'HH:MM' for daily/weekly/monthly
  timezone?: string; // IANA timezone
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  daysOfMonth?: number[]; // 1-31
  cronExpression?: string; // For custom frequency
}

export interface TriggerScheduleResult {
  id: string;
  flowId: string;
  schedule: ScheduleConfig;
  nextExecution: string;
  status: string;
  createdAt: string;
}

export interface WebhookConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path?: string;
  secret?: string;
  requireSignature?: boolean;
  allowedIPs?: string[];
}

export interface WebhookTriggerResult {
  id: string;
  flowId: string;
  url: string;
  method: string;
  secret: string;
  createdAt: string;
  status: string;
}

export interface EventTriggerConfig {
  eventType: string;
  filter?: Record<string, any>;
}

export interface EventTriggerResult {
  id: string;
  flowId: string;
  eventType: string;
  filter: Record<string, any>;
  createdAt: string;
  status: string;
}

export interface WorkflowTriggers {
  flowId: string;
  schedules: TriggerScheduleResult[];
  webhooks: WebhookTriggerResult[];
  events: EventTriggerResult[];
}