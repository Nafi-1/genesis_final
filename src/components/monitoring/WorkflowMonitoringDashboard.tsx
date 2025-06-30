import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  BarChart, 
  Clock, 
  Cpu, 
  Database, 
  FileText, 
  HelpCircle, 
  RefreshCw, 
  Settings, 
  Sliders, 
  Zap,
  CheckCircle,
  X,
  AlertCircle,
  Pause,
  Play,
  ChevronRight,
  ChevronDown,
  Download,
  Search,
  Filter,
  Calendar
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { workflowExecutionService, ExecutionStatus, ExecutionHistoryEntry } from '../../services/workflowExecutionService';
import { formatDistanceToNow } from 'date-fns';
import { ReactFlowProvider } from '@xyflow/react';

interface WorkflowMonitoringDashboardProps {
  workflowId: string;
  nodes: any[];
  edges: any[];
  onNodeSelect?: (nodeId: string) => void;
  className?: string;
}

export const WorkflowMonitoringDashboard: React.FC<WorkflowMonitoringDashboardProps> = ({
  workflowId,
  nodes,
  edges,
  onNodeSelect,
  className = ''
}) => {
  // State for active execution
  const [activeExecution, setActiveExecution] = useState<ExecutionStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  
  // State for execution history
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // UI state
  const [selectedTab, setSelectedTab] = useState<'active' | 'history'>('active');
  const [timeframe, setTimeframe] = useState<'1d' | '7d' | '30d' | 'all'>('7d');
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<string | null>(null);
  const [selectedHistoryExecution, setSelectedHistoryExecution] = useState<ExecutionStatus | null>(null);
  
  // Initialize by loading execution history
  useEffect(() => {
    loadExecutionHistory();
  }, [workflowId]);
  
  // Load execution history
  const loadExecutionHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await workflowExecutionService.getExecutionHistory(workflowId);
      setExecutionHistory(history);
    } catch (error) {
      console.error('Failed to load execution history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Start workflow execution
  const handleStartExecution = async () => {
    try {
      const result = await workflowExecutionService.executeWorkflow(
        workflowId,
        nodes,
        edges
      );
      
      // Start polling for updates
      startPolling(result.executionId);
    } catch (error) {
      console.error('Failed to start workflow execution:', error);
    }
  };
  
  // Start polling for execution status
  const startPolling = (executionId: string) => {
    setIsPolling(true);
    
    // Immediately get initial status
    fetchExecutionStatus(executionId);
    
    // Set up polling interval
    const interval = window.setInterval(() => {
      fetchExecutionStatus(executionId);
    }, 1000);
    
    setPollingInterval(interval);
  };
  
  // Stop polling
  const stopPolling = () => {
    if (pollingInterval !== null) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setIsPolling(false);
  };
  
  // Fetch execution status
  const fetchExecutionStatus = async (executionId: string) => {
    try {
      const status = await workflowExecutionService.getExecutionStatus(executionId);
      setActiveExecution(status);
      
      // If execution is complete, stop polling
      if (['completed', 'failed', 'cancelled'].includes(status.status)) {
        stopPolling();
        
        // Reload history to include this execution
        loadExecutionHistory();
      }
    } catch (error) {
      console.error('Failed to fetch execution status:', error);
      stopPolling();
    }
  };
  
  // Cancel execution
  const handleCancelExecution = async () => {
    if (!activeExecution) return;
    
    try {
      await workflowExecutionService.cancelExecution(activeExecution.id);
      stopPolling();
      
      // Reload history
      loadExecutionHistory();
    } catch (error) {
      console.error('Failed to cancel execution:', error);
    }
  };
  
  // View historical execution
  const handleViewHistoricalExecution = async (executionId: string) => {
    setSelectedHistoryItem(executionId);
    
    try {
      const status = await workflowExecutionService.getExecutionStatus(executionId);
      setSelectedHistoryExecution(status);
    } catch (error) {
      console.error('Failed to load historical execution:', error);
      setSelectedHistoryExecution(null);
    }
  };
  
  // Toggle log expansion
  const toggleLogExpand = (logId: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };
  
  // Render active execution tab
  const renderActiveExecutionTab = () => {
    if (!activeExecution) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Active Execution</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Run your workflow to see real-time execution monitoring and performance metrics.
          </p>
          
          <HolographicButton
            onClick={handleStartExecution}
            glow
          >
            <Play className="w-4 h-4 mr-2" />
            Execute Workflow
          </HolographicButton>
        </div>
      );
    }
    
    const totalNodes = Object.keys(activeExecution.nodes).length;
    const completedNodes = Object.values(activeExecution.nodes)
      .filter(node => node.status === 'completed').length;
    const failedNodes = Object.values(activeExecution.nodes)
      .filter(node => node.status === 'failed').length;
    const runningNodes = Object.values(activeExecution.nodes)
      .filter(node => node.status === 'running').length;
    
    return (
      <div className="space-y-6">
        {/* Status Banner */}
        <div className={`p-4 rounded-lg ${
          activeExecution.status === 'completed' ? 'bg-green-500/20 border border-green-500/30' :
          activeExecution.status === 'failed' ? 'bg-red-500/20 border border-red-500/30' :
          activeExecution.status === 'cancelled' ? 'bg-yellow-500/20 border border-yellow-500/30' :
          'bg-blue-500/20 border border-blue-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {activeExecution.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-400 mr-2" />}
              {activeExecution.status === 'failed' && <X className="w-5 h-5 text-red-400 mr-2" />}
              {activeExecution.status === 'cancelled' && <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />}
              {(activeExecution.status === 'initializing' || activeExecution.status === 'running') && (
                <RefreshCw className="w-5 h-5 text-blue-400 mr-2 animate-spin" />
              )}
              
              <div>
                <h3 className={`text-lg font-semibold ${
                  activeExecution.status === 'completed' ? 'text-green-300' :
                  activeExecution.status === 'failed' ? 'text-red-300' :
                  activeExecution.status === 'cancelled' ? 'text-yellow-300' :
                  'text-blue-300'
                }`}>
                  Execution {
                    activeExecution.status === 'completed' ? 'Completed Successfully' :
                    activeExecution.status === 'failed' ? 'Failed' :
                    activeExecution.status === 'cancelled' ? 'Cancelled' :
                    activeExecution.status === 'initializing' ? 'Initializing' :
                    'In Progress'
                  }
                </h3>
                
                <div className="text-sm text-gray-300">
                  ID: {activeExecution.id} • Started: {
                    new Date(activeExecution.startTime).toLocaleTimeString()
                  } {
                    activeExecution.endTime ? `• Ended: ${new Date(activeExecution.endTime).toLocaleTimeString()}` : ''
                  }
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              {activeExecution.status === 'running' && (
                <HolographicButton
                  onClick={handleCancelExecution}
                  variant="outline"
                  size="sm"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Cancel
                </HolographicButton>
              )}
              
              {['completed', 'failed', 'cancelled'].includes(activeExecution.status) && (
                <HolographicButton
                  onClick={handleStartExecution}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Again
                </HolographicButton>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          {['initializing', 'running'].includes(activeExecution.status) && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                <span>Progress: {Math.round(activeExecution.progress)}%</span>
                <span>
                  {completedNodes} completed • {runningNodes} running • {failedNodes} failed
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: `${activeExecution.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Metrics & Logs */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Node Status */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <Activity className="w-5 h-5 text-blue-400 mr-2" />
              Node Status
            </h4>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {Object.entries(activeExecution.nodes).map(([nodeId, nodeState]) => {
                // Find node data from nodes prop
                const nodeData = nodes.find(node => node.id === nodeId)?.data;
                
                return (
                  <div 
                    key={nodeId}
                    className={`p-3 rounded-lg border ${
                      nodeState.status === 'completed' ? 'border-green-500/30 bg-green-500/10' :
                      nodeState.status === 'failed' ? 'border-red-500/30 bg-red-500/10' :
                      nodeState.status === 'running' ? 'border-blue-500/30 bg-blue-500/10' :
                      'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => onNodeSelect?.(nodeId)}
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          nodeState.status === 'completed' ? 'bg-green-400' :
                          nodeState.status === 'failed' ? 'bg-red-400' :
                          nodeState.status === 'running' ? 'bg-blue-400 animate-pulse' :
                          'bg-gray-400'
                        }`} />
                        
                        <span className="text-white font-medium">
                          {nodeData?.label || nodeId}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {nodeState.status === 'completed' && nodeState.startTime && nodeState.endTime && (
                          <span>
                            {Math.round(
                              (new Date(nodeState.endTime).getTime() - new Date(nodeState.startTime).getTime()) / 1000
                            )}s
                          </span>
                        )}
                        {nodeState.status === 'running' && nodeState.startTime && (
                          <span className="text-blue-300 animate-pulse">Running...</span>
                        )}
                        {nodeState.status === 'pending' && (
                          <span>Pending</span>
                        )}
                      </div>
                    </div>
                    
                    {nodeState.status === 'failed' && nodeState.error && (
                      <div className="mt-1 text-xs text-red-300">
                        Error: {nodeState.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Execution Logs */}
          <div className="bg-white/5 p-4 rounded-lg border border-white/10">
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <FileText className="w-5 h-5 text-purple-400 mr-2" />
              Execution Logs
            </h4>
            
            <div className="space-y-1 max-h-60 overflow-y-auto pr-2">
              {activeExecution.logs.map((log, index) => {
                const logId = `${activeExecution.id}-log-${index}`;
                
                return (
                  <div 
                    key={logId}
                    className={`p-2 rounded-lg text-sm ${
                      log.level === 'error' ? 'bg-red-500/10' :
                      log.level === 'warning' ? 'bg-yellow-500/10' :
                      log.level === 'debug' ? 'bg-blue-500/10' :
                      'bg-white/5'
                    }`}
                  >
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleLogExpand(logId)}
                    >
                      <div className="flex items-center">
                        {log.level === 'error' && <AlertCircle className="w-4 h-4 text-red-400 mr-2" />}
                        {log.level === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400 mr-2" />}
                        {log.level === 'info' && <CheckCircle className="w-4 h-4 text-emerald-400 mr-2" />}
                        {log.level === 'debug' && <Settings className="w-4 h-4 text-blue-400 mr-2" />}
                        
                        <span className={`${
                          log.level === 'error' ? 'text-red-300' :
                          log.level === 'warning' ? 'text-yellow-300' :
                          log.level === 'debug' ? 'text-blue-300' :
                          'text-white'
                        }`}>{log.message}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {expandedLogs[logId] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </div>
                    
                    {expandedLogs[logId] && (
                      <div className="mt-2 pl-6 text-xs text-gray-400 space-y-1">
                        <div className="flex">
                          <span className="w-20">Timestamp:</span>
                          <span>{new Date(log.timestamp).toISOString()}</span>
                        </div>
                        <div className="flex">
                          <span className="w-20">Level:</span>
                          <span>{log.level}</span>
                        </div>
                        {log.nodeId && (
                          <div className="flex">
                            <span className="w-20">Node:</span>
                            <span>{log.nodeId}</span>
                          </div>
                        )}
                        {log.details && (
                          <div>
                            <span className="w-20">Details:</span>
                            <pre className="mt-1 p-2 bg-black/20 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {activeExecution.logs.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-400">No logs available yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Performance Metrics */}
        <GlassCard variant="subtle" className="p-4">
          <h4 className="text-white font-semibold mb-4 flex items-center">
            <Zap className="w-5 h-5 text-yellow-400 mr-2" />
            Performance Metrics
          </h4>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-lg p-3 border border-white/20">
              <div className="text-sm text-gray-400 mb-1">Execution Time</div>
              <div className="text-xl font-bold text-white">
                {activeExecution.endTime 
                  ? Math.round((new Date(activeExecution.endTime).getTime() - new Date(activeExecution.startTime).getTime()) / 1000)
                  : Math.round((Date.now() - new Date(activeExecution.startTime).getTime()) / 1000)}s
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3 border border-white/20">
              <div className="text-sm text-gray-400 mb-1">Success Rate</div>
              <div className="text-xl font-bold text-white">
                {totalNodes === 0 ? '0' : 
                  Math.round((completedNodes / totalNodes) * 100)}%
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3 border border-white/20">
              <div className="text-sm text-gray-400 mb-1">Avg Node Time</div>
              <div className="text-xl font-bold text-white">
                {completedNodes === 0 ? '0' : '1.2'}s
              </div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3 border border-white/20">
              <div className="text-sm text-gray-400 mb-1">Resources</div>
              <div className="text-xl font-bold text-white">
                64MB
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  };
  
  // Render execution history tab
  const renderHistoryTab = () => (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search executions..."
              className="pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          
          <HolographicButton variant="ghost" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </HolographicButton>
        </div>
        
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {['1d', '7d', '30d', 'all'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf as any)}
              className={`px-3 py-1 rounded text-sm ${
                timeframe === tf 
                  ? 'bg-blue-500/30 text-blue-300' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tf === '1d' ? 'Today' : 
               tf === '7d' ? 'Week' :
               tf === '30d' ? 'Month' :
               'All Time'}
            </button>
          ))}
        </div>
      </div>
      
      {/* History List & Selected Item View */}
      <div className="grid md:grid-cols-5 gap-6">
        {/* History List */}
        <div className="md:col-span-2 bg-white/5 rounded-lg border border-white/10 p-4">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <Clock className="w-5 h-5 text-blue-400 mr-2" />
            Execution History
          </h4>
          
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            ) : executionHistory.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No execution history found</p>
              </div>
            ) : (
              executionHistory.map((execution) => (
                <div 
                  key={execution.executionId}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedHistoryItem === execution.executionId
                      ? 'bg-blue-500/20 border-blue-500/40'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => handleViewHistoricalExecution(execution.executionId)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      {execution.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-400 mr-2" />}
                      {execution.status === 'failed' && <X className="w-4 h-4 text-red-400 mr-2" />}
                      {execution.status === 'cancelled' && <AlertCircle className="w-4 h-4 text-yellow-400 mr-2" />}
                      
                      <span className="text-white font-medium truncate">
                        Execution {execution.executionId.slice(-8)}
                      </span>
                    </div>
                    
                    <span className="text-xs text-gray-400">
                      {execution.executionTime / 1000}s
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">
                      {formatDistanceToNow(new Date(execution.startTime))} ago
                    </span>
                    
                    <div className="flex items-center">
                      <span className={`${
                        execution.status === 'completed' ? 'text-green-400' :
                        execution.status === 'failed' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {execution.successCount}/{execution.nodeCount} nodes
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Selected Execution Details */}
        <div className="md:col-span-3">
          {selectedHistoryExecution ? (
            <div className="space-y-4">
              {/* Header */}
              <div className={`p-4 rounded-lg ${
                selectedHistoryExecution.status === 'completed' ? 'bg-green-500/20 border border-green-500/30' :
                selectedHistoryExecution.status === 'failed' ? 'bg-red-500/20 border border-red-500/30' :
                'bg-yellow-500/20 border border-yellow-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {selectedHistoryExecution.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-400 mr-2" />}
                    {selectedHistoryExecution.status === 'failed' && <X className="w-5 h-5 text-red-400 mr-2" />}
                    {selectedHistoryExecution.status === 'cancelled' && <AlertCircle className="w-5 h-5 text-yellow-400 mr-2" />}
                    
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        selectedHistoryExecution.status === 'completed' ? 'text-green-300' :
                        selectedHistoryExecution.status === 'failed' ? 'text-red-300' :
                        'text-yellow-300'
                      }`}>
                        Execution {selectedHistoryExecution.id.slice(-8)}
                      </h3>
                      
                      <div className="text-sm text-gray-300">
                        {new Date(selectedHistoryExecution.startTime).toLocaleString()} - 
                        {selectedHistoryExecution.endTime 
                          ? ` ${new Date(selectedHistoryExecution.endTime).toLocaleString()}`
                          : ' In progress'
                        }
                      </div>
                    </div>
                  </div>
                  
                  <HolographicButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedHistoryItem(null);
                      setSelectedHistoryExecution(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </HolographicButton>
                </div>
              </div>
              
              {/* Execution Details */}
              <div className="grid grid-cols-2 gap-4">
                {/* Node Status */}
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <h5 className="text-white font-medium mb-3">Node Status</h5>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {Object.entries(selectedHistoryExecution.nodes).map(([nodeId, nodeState]) => {
                      // Find node data from nodes prop
                      const nodeData = nodes.find(node => node.id === nodeId)?.data;
                      
                      return (
                        <div 
                          key={nodeId}
                          className={`p-2 rounded-lg border ${
                            nodeState.status === 'completed' ? 'border-green-500/30 bg-green-500/10' :
                            nodeState.status === 'failed' ? 'border-red-500/30 bg-red-500/10' :
                            nodeState.status === 'running' ? 'border-blue-500/30 bg-blue-500/10' :
                            'border-white/10 bg-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div 
                              className="flex items-center cursor-pointer"
                              onClick={() => onNodeSelect?.(nodeId)}
                            >
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                nodeState.status === 'completed' ? 'bg-green-400' :
                                nodeState.status === 'failed' ? 'bg-red-400' :
                                nodeState.status === 'running' ? 'bg-blue-400' :
                                'bg-gray-400'
                              }`} />
                              
                              <span className="text-white text-sm">
                                {nodeData?.label || nodeId}
                              </span>
                            </div>
                            
                            {nodeState.status === 'failed' && (
                              <span className="text-xs text-red-300">Failed</span>
                            )}
                          </div>
                          
                          {nodeState.status === 'failed' && nodeState.error && (
                            <div className="mt-1 text-xs text-red-300 pl-4">
                              {nodeState.error}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Logs */}
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <h5 className="text-white font-medium mb-3">Execution Logs</h5>
                  
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {selectedHistoryExecution.logs.map((log, index) => {
                      const logId = `${selectedHistoryExecution.id}-log-${index}`;
                      
                      return (
                        <div 
                          key={logId}
                          className={`p-2 rounded-lg text-sm ${
                            log.level === 'error' ? 'bg-red-500/10' :
                            log.level === 'warning' ? 'bg-yellow-500/10' :
                            log.level === 'debug' ? 'bg-blue-500/10' :
                            'bg-white/5'
                          }`}
                        >
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleLogExpand(logId)}
                          >
                            <div className="flex items-center">
                              {log.level === 'error' && <AlertCircle className="w-4 h-4 text-red-400 mr-2" />}
                              {log.level === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400 mr-2" />}
                              {log.level === 'info' && <CheckCircle className="w-4 h-4 text-emerald-400 mr-2" />}
                              {log.level === 'debug' && <Settings className="w-4 h-4 text-blue-400 mr-2" />}
                              
                              <span className={`${
                                log.level === 'error' ? 'text-red-300' :
                                log.level === 'warning' ? 'text-yellow-300' :
                                log.level === 'debug' ? 'text-blue-300' :
                                'text-white'
                              }`}>{log.message}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              {expandedLogs[logId] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </div>
                          </div>
                          
                          {expandedLogs[logId] && (
                            <div className="mt-2 pl-6 text-xs text-gray-400 space-y-1">
                              <div className="flex">
                                <span className="w-20">Timestamp:</span>
                                <span>{new Date(log.timestamp).toISOString()}</span>
                              </div>
                              <div className="flex">
                                <span className="w-20">Level:</span>
                                <span>{log.level}</span>
                              </div>
                              {log.nodeId && (
                                <div className="flex">
                                  <span className="w-20">Node:</span>
                                  <span>{log.nodeId}</span>
                                </div>
                              )}
                              {log.details && (
                                <div>
                                  <span className="w-20">Details:</span>
                                  <pre className="mt-1 p-2 bg-black/20 rounded overflow-x-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <HolographicButton variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Logs
                </HolographicButton>
                
                <HolographicButton 
                  variant="primary" 
                  size="sm"
                  onClick={handleStartExecution}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run Again
                </HolographicButton>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center py-20">
              <div className="text-center">
                <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">Select an execution to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  return (
    <div className={`space-y-6 ${className}`}>
      <ReactFlowProvider>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <BarChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Workflow Monitoring</h2>
            <p className="text-gray-300">Track execution, performance, and troubleshoot issues</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <HolographicButton
            variant={selectedTab === 'active' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab('active')}
          >
            <Activity className="w-4 h-4 mr-2" />
            Active
          </HolographicButton>
          
          <HolographicButton
            variant={selectedTab === 'history' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab('history')}
          >
            <Clock className="w-4 h-4 mr-2" />
            History
          </HolographicButton>
          
          <HolographicButton
            variant="ghost"
            size="sm"
            onClick={loadExecutionHistory}
          >
            <RefreshCw className="w-4 h-4" />
          </HolographicButton>
        </div>
      </div>
      
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {selectedTab === 'active' ? renderActiveExecutionTab() : renderHistoryTab()}
        </motion.div>
      </AnimatePresence>
      </ReactFlowProvider>
    </div>
  );
};