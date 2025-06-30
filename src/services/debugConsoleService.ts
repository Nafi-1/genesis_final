import { v4 as uuid } from 'uuid';

export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface ExecutionLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  nodeId?: string;
  details?: any;
}

export interface NodeExecutionState {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  output?: any;
  error?: string;
}

export interface Execution {
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

export interface Issue {
  id: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  nodeId?: string;
  details?: any;
  suggestions: string[];
  actionable: boolean;
  timestamp: Date;
}

export interface QuickFix {
  id: string;
  issueId: string;
  label: string;
  action: () => Promise<void>;
}

/**
 * Service for debugging workflow execution
 */
export class DebugConsoleService {
  private static instance: DebugConsoleService;
  private issues: Issue[] = [];
  private logs: ExecutionLog[] = [];
  private quickFixes: Map<string, QuickFix[]> = new Map();
  private currentExecution: Execution | null = null;
  private subscribers: ((update: 'issues' | 'logs' | 'execution') => void)[] = [];

  private constructor() {}

  public static getInstance(): DebugConsoleService {
    if (!DebugConsoleService.instance) {
      DebugConsoleService.instance = new DebugConsoleService();
    }
    return DebugConsoleService.instance;
  }

  /**
   * Subscribe to debug console updates
   */
  public subscribe(callback: (update: 'issues' | 'logs' | 'execution') => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  /**
   * Notify subscribers of an update
   */
  private notifySubscribers(update: 'issues' | 'logs' | 'execution'): void {
    this.subscribers.forEach(subscriber => subscriber(update));
  }

  /**
   * Start debugging a workflow execution
   */
  public async analyzeExecution(execution: Execution): Promise<void> {
    this.currentExecution = execution;
    this.notifySubscribers('execution');
    
    // Clear previous issues for this execution
    this.issues = this.issues.filter(issue => !issue.nodeId || !execution.nodes[issue.nodeId]);
    
    // Detect issues
    const newIssues = await this.detectIssues(execution);
    if (newIssues.length > 0) {
      this.issues = [...this.issues, ...newIssues];
      this.notifySubscribers('issues');
      
      // Generate quick fixes
      await this.generateQuickFixes(newIssues);
    }
    
    // Add an execution started log
    this.addLog({
      level: 'info',
      message: `Execution ${execution.id} started for workflow ${execution.flowId}`,
      details: { 
        status: execution.status,
        nodeCount: Object.keys(execution.nodes).length
      }
    });
  }

  /**
   * Update execution status
   */
  public updateExecutionStatus(executionId: string, status: Execution['status']): void {
    if (this.currentExecution?.id === executionId) {
      this.currentExecution = {
        ...this.currentExecution,
        status,
        ...(status === 'completed' || status === 'failed' ? { endTime: new Date() } : {})
      };
      this.notifySubscribers('execution');
      
      // Add a log entry
      this.addLog({
        level: status === 'failed' ? 'error' : 'info',
        message: `Execution status changed to ${status}`,
        details: { executionId }
      });
    }
  }

  /**
   * Update node status
   */
  public updateNodeStatus(
    executionId: string, 
    nodeId: string, 
    status: NodeExecutionState['status'],
    output?: any,
    error?: string
  ): void {
    if (this.currentExecution?.id === executionId) {
      if (this.currentExecution.nodes[nodeId]) {
        this.currentExecution.nodes[nodeId] = {
          ...this.currentExecution.nodes[nodeId],
          status,
          ...(output ? { output } : {}),
          ...(error ? { error } : {}),
          ...(status === 'running' ? { startTime: new Date() } : {}),
          ...(status === 'completed' || status === 'failed' ? { endTime: new Date() } : {})
        };
        
        if (status === 'running') {
          this.currentExecution.currentNodeId = nodeId;
        } else if (this.currentExecution.currentNodeId === nodeId) {
          // Find next running node or clear current node
          const runningNode = Object.entries(this.currentExecution.nodes)
            .find(([, node]) => node.status === 'running');
          
          this.currentExecution.currentNodeId = runningNode ? runningNode[0] : undefined;
        }
        
        this.notifySubscribers('execution');
        
        // Add a log entry
        this.addLog({
          level: status === 'failed' ? 'error' : 'info',
          message: `Node ${nodeId} ${status}`,
          nodeId,
          details: { 
            ...(output ? { output: this.summarizeOutput(output) } : {}),
            ...(error ? { error } : {})
          }
        });
        
        // If node failed, detect issues
        if (status === 'failed') {
          this.detectNodeIssues(this.currentExecution, nodeId, error);
        }
      }
    }
  }

  /**
   * Summarize node output for logging
   */
  private summarizeOutput(output: any): any {
    if (!output) return null;
    
    // If it's a primitive, return as is
    if (typeof output !== 'object' || output === null) {
      return output;
    }
    
    // If it's an array, summarize the first few elements
    if (Array.isArray(output)) {
      return {
        type: 'array',
        length: output.length,
        preview: output.slice(0, 3)
      };
    }
    
    // If it's an object, return a summary of keys and values
    return {
      type: 'object',
      keys: Object.keys(output),
      preview: Object.fromEntries(
        Object.entries(output).slice(0, 5).map(([k, v]) => [
          k, 
          typeof v === 'object' && v !== null 
            ? (Array.isArray(v) ? `Array(${v.length})` : `Object`)
            : v
        ])
      )
    };
  }

  /**
   * Detect issues in an execution
   */
  private async detectIssues(execution: Execution): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // Check for long-running nodes
    Object.entries(execution.nodes).forEach(([nodeId, node]) => {
      if (node.status === 'running' && node.startTime) {
        const runningTime = new Date().getTime() - node.startTime.getTime();
        if (runningTime > 10000) { // 10 seconds threshold
          issues.push({
            id: uuid(),
            severity: 'warning',
            message: `Node ${nodeId} has been running for ${Math.round(runningTime / 1000)}s`,
            nodeId,
            details: { runningTime },
            suggestions: [
              'Check for infinite loops',
              'Verify external API connections',
              'Consider adding timeout handling'
            ],
            actionable: true,
            timestamp: new Date()
          });
        }
      }
    });
    
    // Check for failed nodes
    Object.entries(execution.nodes).forEach(([nodeId, node]) => {
      if (node.status === 'failed') {
        issues.push({
          id: uuid(),
          severity: 'error',
          message: `Node ${nodeId} failed: ${node.error || 'Unknown error'}`,
          nodeId,
          details: { error: node.error },
          suggestions: [
            'Check node configuration',
            'Verify input data',
            'Check external service status'
          ],
          actionable: true,
          timestamp: new Date()
        });
      }
    });
    
    // Check for skipped nodes
    Object.entries(execution.nodes).forEach(([nodeId, node]) => {
      if (node.status === 'skipped') {
        issues.push({
          id: uuid(),
          severity: 'info',
          message: `Node ${nodeId} was skipped`,
          nodeId,
          details: {},
          suggestions: [
            'Verify conditional logic',
            'Check upstream node outputs'
          ],
          actionable: false,
          timestamp: new Date()
        });
      }
    });
    
    return issues;
  }

  /**
   * Detect issues for a specific node
   */
  private async detectNodeIssues(execution: Execution, nodeId: string, error?: string): Promise<void> {
    const issues: Issue[] = [];
    
    // Create an issue for the failed node
    issues.push({
      id: uuid(),
      severity: 'error',
      message: `Node ${nodeId} failed: ${error || 'Unknown error'}`,
      nodeId,
      details: { error },
      suggestions: this.generateSuggestions(error),
      actionable: true,
      timestamp: new Date()
    });
    
    if (issues.length > 0) {
      this.issues = [...this.issues, ...issues];
      this.notifySubscribers('issues');
      
      // Generate quick fixes
      await this.generateQuickFixes(issues);
    }
  }

  /**
   * Generate suggestions based on error message
   */
  private generateSuggestions(error?: string): string[] {
    if (!error) return ['Check node configuration', 'Verify input data'];
    
    const suggestions: string[] = [];
    
    if (error.includes('timeout')) {
      suggestions.push('Increase timeout settings');
      suggestions.push('Check service availability');
    }
    
    if (error.includes('permission') || error.includes('unauthorized')) {
      suggestions.push('Verify credentials');
      suggestions.push('Check permission settings');
    }
    
    if (error.includes('not found')) {
      suggestions.push('Check resource exists');
      suggestions.push('Verify ID or path is correct');
    }
    
    if (error.includes('syntax') || error.includes('parse')) {
      suggestions.push('Fix syntax error in configuration');
      suggestions.push('Validate JSON structure');
    }
    
    // Add some general suggestions
    suggestions.push('Check node configuration');
    suggestions.push('Verify input data format');
    
    return suggestions;
  }

  /**
   * Generate quick fixes for issues
   */
  private async generateQuickFixes(issues: Issue[]): Promise<void> {
    for (const issue of issues) {
      const fixes: QuickFix[] = [];
      
      // Generate fixes based on issue type
      if (issue.severity === 'error' && issue.nodeId) {
        // Add skip node fix
        fixes.push({
          id: uuid(),
          issueId: issue.id,
          label: 'Skip this node',
          action: async () => {
            // Implementation would skip the node and continue execution
            console.log(`Skipping node ${issue.nodeId}`);
          }
        });
        
        // Add retry fix
        fixes.push({
          id: uuid(),
          issueId: issue.id,
          label: 'Retry node',
          action: async () => {
            // Implementation would retry the node
            console.log(`Retrying node ${issue.nodeId}`);
          }
        });
      }
      
      if (fixes.length > 0) {
        this.quickFixes.set(issue.id, fixes);
      }
    }
  }

  /**
   * Get quick fixes for an issue
   */
  public getQuickFixes(issueId: string): QuickFix[] {
    return this.quickFixes.get(issueId) || [];
  }

  /**
   * Apply a quick fix
   */
  public async applyQuickFix(fixId: string): Promise<void> {
    // Find the fix
    for (const [issueId, fixes] of this.quickFixes.entries()) {
      const fix = fixes.find(f => f.id === fixId);
      if (fix) {
        await fix.action();
        
        // Add a log entry
        this.addLog({
          level: 'info',
          message: `Applied quick fix: ${fix.label}`,
          details: { issueId, fixId }
        });
        
        return;
      }
    }
    
    throw new Error(`Quick fix not found: ${fixId}`);
  }

  /**
   * Add a log entry
   */
  public addLog(log: Omit<ExecutionLog, 'id' | 'timestamp'>): void {
    const newLog: ExecutionLog = {
      id: uuid(),
      timestamp: new Date(),
      ...log
    };
    
    this.logs.push(newLog);
    
    // Keep logs trimmed to last 1000 entries
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(this.logs.length - 1000);
    }
    
    this.notifySubscribers('logs');
  }

  /**
   * Get all logs
   */
  public getLogs(filter?: { level?: LogLevel; nodeId?: string }): ExecutionLog[] {
    let filteredLogs = this.logs;
    
    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level);
      }
      
      if (filter.nodeId) {
        filteredLogs = filteredLogs.filter(log => log.nodeId === filter.nodeId);
      }
    }
    
    return filteredLogs;
  }

  /**
   * Get all issues
   */
  public getIssues(filter?: { severity?: Issue['severity']; nodeId?: string }): Issue[] {
    let filteredIssues = this.issues;
    
    if (filter) {
      if (filter.severity) {
        filteredIssues = filteredIssues.filter(issue => issue.severity === filter.severity);
      }
      
      if (filter.nodeId) {
        filteredIssues = filteredIssues.filter(issue => issue.nodeId === filter.nodeId);
      }
    }
    
    return filteredIssues;
  }

  /**
   * Get current execution
   */
  public getCurrentExecution(): Execution | null {
    return this.currentExecution;
  }

  /**
   * Clear issues
   */
  public clearIssues(): void {
    this.issues = [];
    this.notifySubscribers('issues');
  }

  /**
   * Clear logs
   */
  public clearLogs(): void {
    this.logs = [];
    this.notifySubscribers('logs');
  }
}

// Export singleton instance
export const debugConsoleService = DebugConsoleService.getInstance();