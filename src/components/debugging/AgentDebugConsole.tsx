import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Play, 
  XCircle, 
  Send, 
  Download, 
  Trash2,
  RefreshCw,
  Clipboard,
  Settings,
  Database,
  Brain,
  Zap,
  MessageSquare,
  X
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

interface AgentDebugConsoleProps {
  agentId: string;
  agentName?: string;
  onClose?: () => void;
}

interface LogEntry {
  timestamp: Date;
  type: 'input' | 'output' | 'error' | 'system' | 'memory' | 'tool';
  content: string;
  metadata?: Record<string, any>;
}

interface MemoryEntry {
  id: string;
  content: string;
  importance: number;
  created: Date;
  type: string;
}

export const AgentDebugConsole: React.FC<AgentDebugConsoleProps> = ({ 
  agentId,
  agentName = 'Agent',
  onClose 
}) => {
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'memory' | 'settings'>('console');
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [agentMemory, setAgentMemory] = useState<MemoryEntry[]>([]);
  const [isLoadingMemory, setIsLoadingMemory] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isSlackEnabled, setIsSlackEnabled] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [logLevel, setLogLevel] = useState<'error' | 'warning' | 'info' | 'verbose' | 'debug'>('info');
  
  const consoleEndRef = useRef<HTMLDivElement>(null);
  
  // Initial system message
  useEffect(() => {
    addSystemLog(`Debug console initialized for ${agentName} (${agentId})`);
    addSystemLog("Type 'help' for available commands");
  }, [agentId]);
  
  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Simulate API connection check
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsConnected(true);
      } catch (error) {
        console.error('Connection check error:', error);
        setIsConnected(false);
      }
    };
    
    checkConnection();
    
    // Check connection periodically
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when logs update
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);
  
  // Add system log
  const addSystemLog = (message: string) => {
    setLogs(prevLogs => [
      ...prevLogs,
      {
        timestamp: new Date(),
        type: 'system',
        content: message
      }
    ]);
  };
  
  // Handle command execution
  const executeCommand = async () => {
    if (!input.trim()) return;
    
    // Log the input
    setLogs(prevLogs => [
      ...prevLogs,
      {
        timestamp: new Date(),
        type: 'input',
        content: input
      }
    ]);
    
    // Check for built-in commands
    const command = input.toLowerCase().trim();
    
    if (command === 'clear') {
      setLogs([]);
      setInput('');
      return;
    }
    
    if (command === 'help') {
      addSystemLog("Available commands:");
      addSystemLog("  help - Show this help message");
      addSystemLog("  clear - Clear the console");
      addSystemLog("  memory - List agent memories");
      addSystemLog("  info - Show agent information");
      addSystemLog("  tools - List available tools");
      addSystemLog("  test [text] - Test agent with provided text");
      addSystemLog("  Any other text will be sent to the agent for processing");
      setInput('');
      return;
    }
    
    if (command === 'memory') {
      fetchAgentMemory();
      setInput('');
      return;
    }
    
    if (command === 'info') {
      fetchAgentInfo();
      setInput('');
      return;
    }
    
    if (command === 'tools') {
      fetchAgentTools();
      setInput('');
      return;
    }
    
    if (command.startsWith('test ')) {
      const testText = input.slice(5);
      runAgentTest(testText);
      setInput('');
      return;
    }
    
    // Process as normal agent input
    processAgentInput(input);
    setInput('');
  };
  
  // Process agent input
  const processAgentInput = async (text: string) => {
    setIsProcessing(true);
    
    try {
      // Simulate API call to agent
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Simulate agent response
      let response: string;
      
      // Generate more contextual responses for common queries
      if (text.toLowerCase().includes('introduce') || text.toLowerCase().includes('who are you')) {
        response = `I'm ${agentName}, an AI assistant designed to help with tasks related to ${agentName.includes('Analyst') ? 'data analysis and insights' : agentName.includes('Support') ? 'customer support and problem-solving' : agentName.includes('Sales') ? 'sales strategies and customer engagement' : 'general assistance'}. I'm equipped with tools to help you accomplish your goals efficiently. How can I assist you today?`;
      } else if (text.toLowerCase().includes('help') || text.toLowerCase().includes('what can you do')) {
        response = `I can assist you with a variety of tasks related to ${agentName.includes('Analyst') ? 'data processing, analytics, and reporting. I can analyze trends, generate insights, and create visualizations.' : agentName.includes('Support') ? 'customer inquiries, technical troubleshooting, and service optimization. I can handle customer tickets and provide resolution steps.' : agentName.includes('Sales') ? 'lead generation, sales strategies, and customer relationship management. I can analyze sales data and suggest optimization strategies.' : 'information retrieval, content creation, and problem-solving.'}`;
      } else if (text.toLowerCase().includes('slack') || text.toLowerCase().includes('webhook')) {
        response = `I can integrate with Slack through webhooks. To set this up, you'll need to provide a Slack webhook URL in the integration settings. Once configured, I can send notifications and updates directly to your Slack channels.`;
      } else {
        response = `I've analyzed your request about "${text}". Based on my understanding, I believe you're asking about ${text.toLowerCase().includes('how') ? 'a process' : 'a concept'}. Could you provide more details so I can assist more effectively?`;
      }
      
      setLogs(prevLogs => [
        ...prevLogs,
        {
          timestamp: new Date(),
          type: 'output',
          content: response
        }
      ]);
      
      // Simulate memory creation
      const memoryType = text.toLowerCase().includes('who') || text.toLowerCase().includes('introduce') ? 'identity' :
                         text.toLowerCase().includes('help') ? 'capability' : 'interaction';
      
      setLogs(prevLogs => [
        ...prevLogs,
        {
          timestamp: new Date(),
          type: 'memory',
          content: `Memory created: ${memoryType} - User asked about "${text.slice(0, 30)}${text.length > 30 ? '...' : ''}"`,
          metadata: {
            importance: 0.7,
            type: memoryType
          }
        }
      ]);
      
      // If Slack integration is enabled, send a notification
      if (isSlackEnabled && slackWebhookUrl) {
        try {
          setLogs(prevLogs => [
            ...prevLogs,
            {
              timestamp: new Date(),
              type: 'system',
              content: `Sending notification to Slack...`
            }
          ]);
          
          await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `*Agent ${agentName} responded to:* "${text}"\n\n*Response:* ${response}`
            })
          });
          
          setLogs(prevLogs => [
            ...prevLogs,
            {
              timestamp: new Date(),
              type: 'system',
              content: `✅ Slack notification sent successfully`
            }
          ]);
        } catch (error: any) {
          setLogs(prevLogs => [
            ...prevLogs,
            {
              timestamp: new Date(),
              type: 'error',
              content: `Failed to send Slack notification: ${error.message}`
            }
          ]);
        }
      }
      
    } catch (error: any) {
      setLogs(prevLogs => [
        ...prevLogs,
        {
          timestamp: new Date(),
          type: 'error',
          content: `Error processing request: ${error.message || 'Unknown error'}`
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Run agent test
  const runAgentTest = async (testText: string) => {
    setIsProcessing(true);
    
    try {
      addSystemLog(`Running test: "${testText}"`);
      
      // Simulate API call for test
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // Simulate test response
      const success = Math.random() > 0.3; // 70% success rate
      
      if (success) {
        setLogs(prevLogs => [
          ...prevLogs,
          {
            timestamp: new Date(),
            type: 'output',
            content: `Test passed with response: "I understand you're asking about ${testText}. I can help with that by providing relevant information and assistance."`,
            metadata: {
              execution_time_ms: Math.floor(Math.random() * 500) + 300,
              token_usage: Math.floor(Math.random() * 300) + 100,
              memory_accessed: Math.floor(Math.random() * 5)
            }
          }
        ]);
      } else {
        setLogs(prevLogs => [
          ...prevLogs,
          {
            timestamp: new Date(),
            type: 'error',
            content: `Test failed: Agent was unable to process "${testText}" correctly. Response was below quality threshold.`,
            metadata: {
              execution_time_ms: Math.floor(Math.random() * 1000) + 500,
              error_type: 'quality',
              quality_score: (Math.random() * 0.3 + 0.2).toFixed(2)
            }
          }
        ]);
      }
      
      // Simulate tool usage
      setLogs(prevLogs => [
        ...prevLogs,
        {
          timestamp: new Date(),
          type: 'tool',
          content: `Tool execution: ${success ? 'Database lookup successful' : 'External API connection timed out'}`,
          metadata: {
            tool_name: success ? 'Database Connector' : 'External API',
            execution_time_ms: Math.floor(Math.random() * 200) + 50
          }
        }
      ]);
      
    } catch (error: any) {
      setLogs(prevLogs => [
        ...prevLogs,
        {
          timestamp: new Date(),
          type: 'error',
          content: `Test execution error: ${error.message || 'Unknown error'}`
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Fetch agent memory
  const fetchAgentMemory = async () => {
    setIsLoadingMemory(true);
    
    try {
      addSystemLog("Fetching agent memories...");
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate memory data
      const mockMemories: MemoryEntry[] = [
        {
          id: 'mem1',
          content: 'User asked about workflow automation capabilities',
          importance: 0.8,
          created: new Date(Date.now() - 3600000 * 24),
          type: 'interaction'
        },
        {
          id: 'mem2',
          content: 'User experienced an error while configuring Slack integration',
          importance: 0.9,
          created: new Date(Date.now() - 3600000 * 12),
          type: 'error'
        },
        {
          id: 'mem3',
          content: 'User successfully deployed their first guild',
          importance: 0.7,
          created: new Date(Date.now() - 3600000 * 6),
          type: 'system'
        },
        {
          id: 'mem4',
          content: 'Agent learned that user prefers detailed technical explanations',
          importance: 0.6,
          created: new Date(Date.now() - 3600000 * 2),
          type: 'learning'
        }
      ];
      
      setAgentMemory(mockMemories);
      
      addSystemLog(`Retrieved ${mockMemories.length} memories`);
      
    } catch (error) {
      addSystemLog(`Error fetching memories: ${error}`);
    } finally {
      setIsLoadingMemory(false);
    }
  };
  
  // Fetch agent info
  const fetchAgentInfo = async () => {
    addSystemLog("Fetching agent information...");
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Display agent info
      addSystemLog(`Agent ID: ${agentId}`);
      addSystemLog(`Name: ${agentName}`);
      addSystemLog(`Role: ${agentName} Specialist`);
      addSystemLog(`Status: Active`);
      addSystemLog(`Model: Google Gemini Pro`);
      addSystemLog(`Tools: 4 connected`);
      addSystemLog(`Memory: Enabled (short-term and long-term)`);
      addSystemLog(`Voice: Enabled`);
      addSystemLog(`Created: ${new Date(Date.now() - 86400000 * 3).toLocaleString()}`);
      
    } catch (error) {
      addSystemLog(`Error fetching agent info: ${error}`);
    }
  };
  
  // Fetch agent tools
  const fetchAgentTools = async () => {
    addSystemLog("Fetching agent tools...");
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Display agent tools
      addSystemLog("Available tools:");
      addSystemLog("1. Database Connector - Access to application database");
      addSystemLog("2. API Integration - Connect to external services");
      addSystemLog("3. File Handler - Read and write files");
      addSystemLog("4. Email Sender - Send emails via SMTP");
      
    } catch (error) {
      addSystemLog(`Error fetching agent tools: ${error}`);
    }
  };
  
  // Download logs
  const downloadLogs = () => {
    // Format logs for export
    const logText = logs.map(log => 
      `[${log.timestamp.toISOString()}] [${log.type.toUpperCase()}] ${log.content}`
    ).join('\n');
    
    // Create download link
    const element = document.createElement('a');
    const file = new Blob([logText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${agentName.toLowerCase().replace(/\s+/g, '-')}-debug-logs.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    addSystemLog("Console cleared");
  };
  
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        addSystemLog("Content copied to clipboard");
      })
      .catch(err => {
        addSystemLog(`Error copying to clipboard: ${err}`);
      });
  };
  
  // Get log entry color based on type
  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'input': return 'text-blue-300';
      case 'output': return 'text-green-300';
      case 'error': return 'text-red-300';
      case 'system': return 'text-gray-300';
      case 'memory': return 'text-purple-300';
      case 'tool': return 'text-yellow-300';
      default: return 'text-white';
    }
  };
  
  // Get log icon based on type
  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'input': return <MessageSquare className="w-4 h-4" />;
      case 'output': return <Brain className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'system': return <Terminal className="w-4 h-4" />;
      case 'memory': return <Database className="w-4 h-4" />;
      case 'tool': return <Zap className="w-4 h-4" />;
      default: return <Terminal className="w-4 h-4" />;
    }
  };
  
  return (
    <GlassCard variant="intense" className="w-full h-full flex flex-col p-1">
      {/* Header */}
      <div className="bg-black/30 rounded-t-lg p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-green-400" />
          <span className="text-green-400 font-mono text-sm">
            {agentName} Debug Console
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <HolographicButton
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('console')}
            className={activeTab === 'console' ? 'text-green-400' : ''}
          >
            <Terminal className="w-3 h-3" />
          </HolographicButton>
          
          <HolographicButton
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('memory')}
            className={activeTab === 'memory' ? 'text-purple-400' : ''}
          >
            <Database className="w-3 h-3" />
          </HolographicButton>
          
          <HolographicButton
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('settings')}
            className={activeTab === 'settings' ? 'text-blue-400' : ''}
          >
            <Settings className="w-3 h-3" />
          </HolographicButton>
          
          <HolographicButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-3 h-3" />
          </HolographicButton>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {/* Console Tab */}
        {activeTab === 'console' && (
          <div className="flex flex-col h-full">
            {/* Console Output */}
            <div className="flex-1 p-3 overflow-y-auto bg-black/40 font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="mb-1 last:mb-0">
                  {/* Log entry */}
                  <div className={`${getLogColor(log.type)}`}>
                    {/* Timestamp */}
                    {showTimestamps && (
                      <span className="text-gray-500 text-xs mr-2">
                        [{log.timestamp.toLocaleTimeString()}]
                      </span>
                    )}
                    
                    {/* Icon and content */}
                    <span className="mr-2 inline-block align-text-bottom">
                      {getLogIcon(log.type)}
                    </span>
                    
                    <span>{log.content}</span>
                    
                    {/* Metadata (if available and not expanded) */}
                    {log.metadata && (
                      <div className="pl-6 mt-1 text-xs text-gray-400">
                        {Object.entries(log.metadata).map(([key, value]) => (
                          <div key={key} className="flex">
                            <span className="w-24 opacity-70">{key.replace(/_/g, ' ')}:</span>
                            <span>
                              {typeof value === 'object' 
                                ? JSON.stringify(value) 
                                : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-2 bg-black/30 border-t border-white/10">
              <div className="flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
                  placeholder={isProcessing ? 'Processing...' : 'Enter command or message...'}
                  disabled={isProcessing}
                  className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-1.5 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 font-mono text-sm"
                />
                <div className="ml-2">
                  <HolographicButton
                    onClick={executeCommand}
                    disabled={isProcessing || !input.trim()}
                    variant="outline"
                    size="sm"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </HolographicButton>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                <div>
                  <button
                    onClick={clearLogs}
                    className="hover:text-white transition-colors"
                  >
                    clear
                  </button>
                  {' | '}
                  <button
                    onClick={downloadLogs}
                    className="hover:text-white transition-colors"
                  >
                    export
                  </button>
                  {' | '}
                  <button
                    onClick={() => setShowTimestamps(!showTimestamps)}
                    className="hover:text-white transition-colors"
                  >
                    {showTimestamps ? 'hide timestamps' : 'show timestamps'}
                  </button>
                </div>
                <div>
                  {logs.length} entries
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="flex justify-between mt-4 items-center border-t border-white/10 pt-4">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} mr-2`}></div>
                  <span className="text-xs text-gray-400">
                    {isConnected ? 'Connected to agent service' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Memory Tab */}
        {activeTab === 'memory' && (
          <div className="p-3 h-full overflow-y-auto bg-black/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Agent Memory</h3>
              <HolographicButton
                variant="ghost"
                size="sm"
                onClick={fetchAgentMemory}
                disabled={isLoadingMemory}
              >
                {isLoadingMemory ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </HolographicButton>
            </div>
            
            {isLoadingMemory ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            ) : (
              <>
                {agentMemory.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">
                      No memories found for this agent.
                    </p>
                    <div className="mt-4">
                      <HolographicButton
                        variant="outline"
                        size="sm"
                        onClick={fetchAgentMemory}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </HolographicButton>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agentMemory.map((memory) => (
                      <div 
                        key={memory.id}
                        className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-white text-sm mb-1">{memory.content}</div>
                            <div className="flex items-center text-xs space-x-4">
                              <span className="text-gray-400">
                                {memory.created.toLocaleString()}
                              </span>
                              <span className={`px-2 py-0.5 rounded ${
                                memory.type === 'interaction' ? 'bg-blue-500/20 text-blue-300' :
                                memory.type === 'error' ? 'bg-red-500/20 text-red-300' :
                                memory.type === 'learning' ? 'bg-green-500/20 text-green-300' :
                                'bg-purple-500/20 text-purple-300'
                              }`}>
                                {memory.type}
                              </span>
                            </div>
                          </div>
                          <div className={`ml-4 w-10 h-10 rounded-full flex items-center justify-center ${
                            memory.importance > 0.8 ? 'bg-red-500/20 text-red-400' :
                            memory.importance > 0.6 ? 'bg-orange-500/20 text-orange-400' :
                            memory.importance > 0.4 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {Math.round(memory.importance * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-4 h-full overflow-y-auto bg-black/40">
            <h3 className="text-white font-medium mb-4">Debug Settings</h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <label className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">Show Timestamps</span>
                  <input
                    type="checkbox"
                    checked={showTimestamps}
                    onChange={(e) => setShowTimestamps(e.target.checked)}
                    className="rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                  />
                </label>
                <p className="text-xs text-gray-400">
                  Display timestamps for each log entry
                </p>
              </div>
              
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <label className="block text-sm text-gray-400 mb-2">Log Level</label>
                <select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value as any)}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="error">Error Only</option>
                  <option value="warning">Warning+</option>
                  <option value="info">Info+</option>
                  <option value="verbose">Verbose</option>
                  <option value="debug">Debug</option>
                </select>
              </div>
              
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Slack Integration</span>
                  <input
                    type="checkbox"
                    checked={isSlackEnabled}
                    onChange={(e) => setIsSlackEnabled(e.target.checked)}
                    className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                  />
                </label>
                
                {isSlackEnabled && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Webhook URL</label>
                    <input
                      type="text"
                      value={slackWebhookUrl}
                      onChange={(e) => setSlackWebhookUrl(e.target.value)}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full p-2 bg-black/40 border border-white/10 rounded text-xs text-white"
                    />
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex space-x-3">
                  <HolographicButton
                    onClick={clearLogs}
                    variant="outline"
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Console
                  </HolographicButton>
                  
                  <div className="flex space-x-2 flex-1">
                    <HolographicButton
                      onClick={downloadLogs}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Logs
                    </HolographicButton>
                    
                    {isSlackEnabled && slackWebhookUrl && (
                      <HolographicButton
                        onClick={() => {
                          // Send test message to Slack
                          fetch(slackWebhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              text: `🧪 *Agent Debug Console* - Test message from ${agentName}`
                            })
                          })
                          .then(() => addSystemLog("Test message sent to Slack"))
                          .catch(err => addSystemLog(`Failed to send Slack message: ${err.message}`));
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Test Slack
                      </HolographicButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
};