import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactFlowProvider } from '@xyflow/react';
import { 
  Play, 
  Pause, 
  ArrowRight,
  MessageSquare, 
  RefreshCw, 
  Cpu, 
  Beaker, 
  Brain, 
  Settings, 
  Rocket, 
  Shield,
  Terminal,
  Code,
  Database,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Workflow,
  Send,
  Zap,
  Mic,
  Volume2,
  Download
} from 'lucide-react';
import { SimulationLab } from './SimulationLab';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { simulationService } from '../../services/simulationService';
import { taskExecutionService } from '../../services/taskExecutionService';
import { AIModelSelector } from '../ui/AIModelSelector';
import { useWizardStore } from '../../stores/wizardStore';
import { voiceService } from '../../services/voiceService';

// Helper component to wrap SimulationLab with ReactFlowProvider for proper context
export const EnhancedSimulationLab: React.FC<any> = (props) => (
  <ReactFlowProvider>
    <SimulationLab {...props} />
  </ReactFlowProvider>
);

// Implementation of the full-featured simulation lab with console and task execution
export const EnhancedSimulationLabFull: React.FC<{
  guildId: string;
  agents: any[];
  advanced?: boolean;
}> = ({ guildId, agents, advanced = false }) => {
  const [activePanel, setActivePanel] = useState<'chat' | 'console' | 'tasks' | 'analytics'>('chat');
  const [messages, setMessages] = useState<any[]>([]);
  const [userInput, setUserInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-flash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [taskLog, setTaskLog] = useState<any[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [enableSlackNotifications, setEnableSlackNotifications] = useState(false);
  const [executionInProgress, setExecutionInProgress] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const taskConsoleRef = useRef<HTMLDivElement>(null);
  const { credentials } = useWizardStore();

  // Load available voices on mount
  useEffect(() => {
    const loadVoices = async () => {
      try {
        const voices = await voiceService.listVoices();
        setAvailableVoices(voices);
        
        // Set default voice
        if (voices.length > 0 && !selectedVoiceId) {
          setSelectedVoiceId(voices[0].voice_id);
        }
      } catch (error) {
        console.error('Failed to load voices:', error);
        addDiagnostic('warning', 'Voice Service', 'Failed to load available voices');
      }
    };
    
    loadVoices();
    
    // Add welcome messages
    setMessages([
      {
        role: 'system',
        content: 'Welcome to the Enhanced Simulation Lab! This environment allows you to test your AI guild with real interactions.',
        timestamp: new Date()
      },
      {
        role: 'assistant',
        content: `Hello! I'm your AI Guild with ${agents.length} specialized agents ready to assist you. Would you like to test my capabilities?`,
        timestamp: new Date()
      }
    ]);
    
    // Add startup diagnostics
    addDiagnostic('info', 'Simulation Lab', 'Environment initialized');
    addDiagnostic('info', 'Agent System', `Loaded ${agents.length} agents for testing`);
    
    // Check credentials
    const availableCredentials = Object.keys(credentials).filter(key => 
      credentials[key] && !credentials[key].startsWith('your_')
    );
    
    if (availableCredentials.length > 0) {
      addDiagnostic('info', 'Credentials', `${availableCredentials.length} valid credentials loaded`);
    } else {
      addDiagnostic('warning', 'Credentials', 'No valid credentials detected, some features may be limited');
    }
    
  }, [agents, credentials]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Auto-scroll task console
  useEffect(() => {
    taskConsoleRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [taskLog]);

  // Add a diagnostic message
  const addDiagnostic = (level: 'info' | 'warning' | 'error', category: string, message: string) => {
    setDiagnostics(prev => [...prev, {
      level,
      category,
      message,
      timestamp: new Date()
    }]);
  };

  // Add a system message to the chat
  const addSystemMessage = (content: string) => {
    setMessages(prev => [
      ...prev,
      {
        role: 'system',
        content,
        timestamp: new Date()
      }
    ]);
  };
  
  // Add a log message to the task console
  const addTaskLog = (level: 'info' | 'warning' | 'error', message: string, data?: any) => {
    setTaskLog(prev => [
      ...prev,
      {
        level,
        message,
        timestamp: new Date(),
        data
      }
    ]);
  };

  // Handle sending a message to the AI guild
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Add user message to chat
    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: userInput,
        timestamp: new Date()
      }
    ]);
    
    // Clear input
    const message = userInput;
    setUserInput('');
    
    // Set processing state
    setIsProcessing(true);
    
    try {
      // Add typing indicator
      await simulateResponse(message);
    } catch (error) {
      console.error('Error generating response:', error);
      addSystemMessage(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Simulate an AI response with smart context-awareness
  const simulateResponse = async (userMessage: string) => {
    const messageLower = userMessage.toLowerCase();
    
    // Wait a bit to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    let response = '';
    
    // Different response patterns based on user input
    if (messageLower.includes('hello') || messageLower.includes('hi') || messageLower.includes('hey')) {
      response = `Hello! I'm your AI Guild consisting of ${agents.length} specialized agents ready to assist you with tasks and provide insights. How can I help you today?`;
    } 
    else if (messageLower.includes('who are you') || messageLower.includes('what can you do') || messageLower.includes('introduce')) {
      response = `I'm an AI Guild designed to ${agents[0]?.description || 'assist with your business tasks'}. I have ${agents.length} specialized agents including ${agents.map(a => a.name).join(', ')}. Each agent has specific skills and tools to handle different aspects of your workflow. Would you like me to demonstrate a specific capability?`;
    }
    else if (messageLower.includes('run') || messageLower.includes('execute') || messageLower.includes('perform') || messageLower.includes('do')) {
      // Identify which task to run
      let taskDescription = '';
      if (messageLower.includes('analyze')) {
        taskDescription = 'analyze your business data and provide insights';
      } else if (messageLower.includes('email') || messageLower.includes('message')) {
        taskDescription = 'draft and send an email communication';
      } else if (messageLower.includes('report') || messageLower.includes('generate')) {
        taskDescription = 'generate a detailed business report';
      } else {
        taskDescription = 'execute your requested task';
      }
      
      response = `I'd be happy to ${taskDescription}. Let me prepare the necessary tools and access. Please confirm that you'd like me to proceed with this task.`;
      
      // Suggest task execution
      setTimeout(() => {
        setTaskInput(taskDescription);
      }, 500);
    }
    else if (messageLower.includes('yes') || messageLower.includes('confirm') || messageLower.includes('proceed')) {
      response = "Great! I'll start executing the task now. You'll see the progress in real-time in the console tab.";
      
      // Execute the task after a short delay
      setTimeout(() => {
        setActivePanel('console');
        const currentTask = taskInput || 'perform a comprehensive business analysis';
        executeTask(currentTask);
      }, 1000);
    }
    else if (messageLower.includes('capabilities') || messageLower.includes('features') || messageLower.includes('tools')) {
      // List agent capabilities based on their roles and tools
      const capabilities = agents.map(agent => {
        const tools = agent.tools_needed || [];
        return `• ${agent.name} (${agent.role}): ${agent.description} using ${tools.join(', ')}`;
      }).join('\n');
      
      response = `Here are the capabilities of my agent team:\n\n${capabilities}\n\nWould you like me to demonstrate any specific capability?`;
    }
    else {
      // Generic intelligent response
      response = `I understand you're asking about "${userMessage}". As your AI assistant with ${agents.length} specialized agents, I can help with this by leveraging my capabilities in ${agents.map(a => a.role).join(', ')}. Would you like me to break down how we would approach this task?`;
    }
    
    // Add assistant response
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
    ]);
    
    // Use voice synthesis if enabled
    if (isVoiceEnabled && selectedVoiceId && audioRef.current) {
      try {
        const audioUrl = await voiceService.synthesizeSpeech(
          response,
          selectedVoiceId,
          {
            stability: 0.7,
            similarityBoost: 0.7,
            style: 0.3,
          }
        );
        
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
      } catch (error) {
        console.error('Voice synthesis failed:', error);
        addDiagnostic('warning', 'Voice Service', `Voice synthesis failed: ${error.message}`);
      }
    }
  };
  
  // Execute a task against real external systems
  const executeTask = async (task: string) => {
    if (!task.trim()) return;
    
    setExecutionInProgress(true);
    setCurrentTask({ description: task, status: 'running', startTime: new Date() });
    
    // Clear previous logs
    setTaskLog([]);
    
    // Log task start
    addTaskLog('info', `Starting task execution: ${task}`);
    
    // Determine which agent is best for this task
    const selectedAgent = determineAppropriateAgent(task, agents);
    addTaskLog('info', `Selected agent for task: ${selectedAgent.name} (${selectedAgent.role})`);
    
    try {
      // Notify on Slack if enabled
      if (enableSlackNotifications && slackWebhook) {
        try {
          await fetch(slackWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🚀 *Task Execution Started*\n\n*Guild:* ${guildId}\n*Task:* ${task}\n*Agent:* ${selectedAgent.name}\n*Time:* ${new Date().toLocaleString()}`
            })
          });
          addTaskLog('info', 'Slack notification sent: Task started');
        } catch (error) {
          addTaskLog('error', `Failed to send Slack notification: ${error.message}`);
        }
      }
      
      // Execute the task
      addTaskLog('info', 'Preparing tools and credentials...');
      
      // Wait a bit to simulate preparation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get applicable tools
      const tools = selectedAgent.tools_needed || [];
      if (tools.length === 0) {
        addTaskLog('warning', 'No tools configured for this agent');
      } else {
        addTaskLog('info', `Using tools: ${tools.join(', ')}`);
      }
      
      // Execute the task using the task execution service
      const result = await taskExecutionService.simulateTaskExecution(
        selectedAgent.name,
        task,
        tools
      );
      
      // Log the result
      result.logs.forEach(log => {
        addTaskLog(
          log.level as any,
          log.message,
          log.data
        );
      });
      
      // Update task status
      setCurrentTask({
        description: task,
        status: result.success ? 'completed' : 'failed',
        startTime: new Date(Date.now() - result.executionTime),
        endTime: new Date(),
        result: result.result,
        error: result.error
      });
      
      // Add summary to chat
      if (result.success) {
        addSystemMessage(`✅ Task completed successfully: ${task}`);
        
        // Add assistant message
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `I've successfully completed the task "${task}". ${generateTaskSummary(result)}`,
              timestamp: new Date()
            }
          ]);
          
          // Switch back to chat panel
          setTimeout(() => {
            setActivePanel('chat');
          }, 1000);
        }, 1000);
      } else {
        addSystemMessage(`❌ Task failed: ${result.error?.error}`);
        
        // Add assistant message
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: `I encountered an issue while executing the task "${task}". ${result.error?.error}: ${result.error?.suggestion}`,
              timestamp: new Date()
            }
          ]);
          
          // Switch back to chat panel
          setTimeout(() => {
            setActivePanel('chat');
          }, 1000);
        }, 1000);
      }
      
      // Notify on Slack if enabled
      if (enableSlackNotifications && slackWebhook) {
        try {
          await fetch(slackWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `${result.success ? '✅' : '❌'} *Task Execution ${result.success ? 'Completed' : 'Failed'}*\n\n*Guild:* ${guildId}\n*Task:* ${task}\n*Agent:* ${selectedAgent.name}\n*Time:* ${new Date().toLocaleString()}\n*Result:* ${result.success ? 'Success' : `Error: ${result.error?.error}`}`
            })
          });
          addTaskLog('info', 'Slack notification sent: Task completion status');
        } catch (error) {
          addTaskLog('error', `Failed to send Slack notification: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Task execution failed:', error);
      addTaskLog('error', `Task execution failed: ${error.message}`);
      
      // Update task status
      setCurrentTask({
        description: task,
        status: 'failed',
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(),
        error: {
          message: error.message,
          suggestion: 'Check agent configuration and try again'
        }
      });
      
      // Add error message to chat
      addSystemMessage(`❌ Task failed: ${error.message}`);
    } finally {
      setExecutionInProgress(false);
    }
  };
  
  // Generate a summary of the task execution result
  const generateTaskSummary = (result: any): string => {
    if (!result || !result.result) return 'Task completed.';
    
    try {
      const resultData = result.result;
      
      // Generate summary based on result type
      if (typeof resultData === 'string') {
        return resultData;
      } else if (typeof resultData === 'object') {
        if (resultData.insights && Array.isArray(resultData.insights)) {
          // Data analysis result
          return `Here are the key insights:\n\n${resultData.insights.map((i: string) => `• ${i}`).join('\n')}\n\n${resultData.recommendation ? `Recommendation: ${resultData.recommendation}` : ''}`;
        } else if (resultData.message_type) {
          // Communication result
          return `I've sent a ${resultData.message_type} to ${resultData.recipients} recipients with a ${resultData.open_rate}% open rate.`;
        } else if (resultData.integration_type) {
          // API result
          return `I've connected to the API and made ${resultData.endpoints_called} calls, transferring ${resultData.data_transferred_kb}KB of data with an average response time of ${resultData.response_time_ms}ms.`;
        } else if (resultData.task_type) {
          // Generic result
          return `Task completed in ${resultData.execution_time} with status: ${resultData.status}.`;
        } else {
          // Unknown result type
          return `Task completed successfully with the following result: ${JSON.stringify(resultData)}`;
        }
      } else {
        return 'Task completed successfully.';
      }
    } catch (error) {
      console.error('Error generating task summary:', error);
      return 'Task completed, but there was an error generating the summary.';
    }
  };
  
  // Determine the appropriate agent for a task
  const determineAppropriateAgent = (task: string, agents: any[]): any => {
    const taskLower = task.toLowerCase();
    
    // Find the best matching agent based on the task description
    for (const agent of agents) {
      const role = agent.role.toLowerCase();
      const description = agent.description.toLowerCase();
      
      // Data analysis tasks
      if ((taskLower.includes('analyze') || taskLower.includes('data') || taskLower.includes('report')) &&
          (role.includes('analyst') || role.includes('data') || description.includes('data') || description.includes('analyze'))) {
        return agent;
      }
      
      // Communication tasks
      if ((taskLower.includes('email') || taskLower.includes('message') || taskLower.includes('communicate')) &&
          (role.includes('communication') || role.includes('support') || description.includes('email') || description.includes('message'))) {
        return agent;
      }
      
      // Content tasks
      if ((taskLower.includes('write') || taskLower.includes('content') || taskLower.includes('article')) &&
          (role.includes('writer') || role.includes('content') || description.includes('write') || description.includes('content'))) {
        return agent;
      }
      
      // Sales tasks
      if ((taskLower.includes('sales') || taskLower.includes('lead') || taskLower.includes('customer')) &&
          (role.includes('sales') || role.includes('customer') || description.includes('sales') || description.includes('customer'))) {
        return agent;
      }
    }
    
    // If no specific match, return the first agent
    return agents[0];
  };

  return (
    <GlassCard variant="medium" className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Beaker className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Advanced Simulation Lab</h2>
            <div className="text-sm text-gray-400">
              {agents.length} agents • {selectedModel} • {isVoiceEnabled ? 'Voice Enabled' : 'Text Only'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} text-xs`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
          
          <HolographicButton
            variant="ghost"
            size="sm"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
          >
            <Shield className="w-4 h-4" />
          </HolographicButton>
        </div>
      </div>
      
      <div className="p-4 border-b border-white/10">
        <div className="flex space-x-2">
          <HolographicButton
            variant={activePanel === 'chat' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActivePanel('chat')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </HolographicButton>
          <HolographicButton
            variant={activePanel === 'console' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActivePanel('console')}
          >
            <Terminal className="w-4 h-4 mr-2" />
            Console
            {currentTask && currentTask.status === 'running' && (
              <div className="ml-1 w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            )}
          </HolographicButton>
          <HolographicButton
            variant={activePanel === 'tasks' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActivePanel('tasks')}
          >
            <Workflow className="w-4 h-4 mr-2" />
            Tasks
          </HolographicButton>
          <HolographicButton
            variant={activePanel === 'analytics' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActivePanel('analytics')}
          >
            <Cpu className="w-4 h-4 mr-2" />
            Analytics
          </HolographicButton>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-hidden">
        {activePanel === 'chat' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4">
              {/* Chat messages */}
              <div className="space-y-4 pb-4">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3/4 p-3 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-purple-500/20 text-white' 
                        : message.role === 'assistant'
                        ? 'bg-blue-500/20 text-white'
                        : 'bg-gray-500/20 text-gray-300 text-sm italic'
                    }`}>
                      {message.role !== 'system' && (
                        <div className="text-xs text-gray-400 mb-1">
                          {message.role === 'user' ? 'You' : 'AI Guild'}
                        </div>
                      )}
                      <div>{message.content}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                
                {/* Typing indicator */}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-blue-500/20 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Input area */}
            <div className="mt-auto">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message to your AI guild..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                  disabled={isProcessing}
                />
                <HolographicButton
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isProcessing}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </HolographicButton>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isVoiceEnabled}
                      onChange={(e) => setIsVoiceEnabled(e.target.checked)}
                      className="rounded bg-white/10 border-white/20 text-purple-500"
                    />
                    <span className="text-white text-sm">Voice</span>
                  </label>
                  
                  {isVoiceEnabled && availableVoices.length > 0 && (
                    <select
                      value={selectedVoiceId || ''}
                      onChange={(e) => setSelectedVoiceId(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                    >
                      {availableVoices.map(voice => (
                        <option key={voice.voice_id} value={voice.voice_id}>
                          {voice.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div>
                  {currentTask && currentTask.status === 'running' && (
                    <div className="flex items-center text-sm text-blue-400">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Task running in console
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activePanel === 'console' && (
          <div className="h-full flex flex-col">
            <div className="mb-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-medium">Task Execution Console</h3>
                  {currentTask && (
                    <div className={`flex items-center px-2 py-1 rounded text-xs ${
                      currentTask.status === 'running' ? 'bg-blue-500/20 text-blue-300' :
                      currentTask.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {currentTask.status === 'running' ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> :
                       currentTask.status === 'completed' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                       <XCircle className="w-3 h-3 mr-1" />}
                      {currentTask.status}
                    </div>
                  )}
                </div>
                
                {currentTask ? (
                  <div>
                    <div className="text-sm text-white font-medium mb-2">
                      Task: {currentTask.description}
                    </div>
                    {currentTask.startTime && (
                      <div className="text-xs text-gray-400">
                        Started: {currentTask.startTime.toLocaleTimeString()}
                        {currentTask.endTime && ` • Completed: ${currentTask.endTime.toLocaleTimeString()}`}
                        {currentTask.endTime && ` • Duration: ${Math.round((currentTask.endTime.getTime() - currentTask.startTime.getTime()) / 1000)}s`}
                      </div>
                    )}
                    
                    {currentTask.error && (
                      <div className="mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="w-4 h-4 text-red-400 mr-2 mt-1" />
                          <div>
                            <div className="text-red-300 font-medium">Error: {currentTask.error.message}</div>
                            {currentTask.error.suggestion && (
                              <div className="text-red-200 text-sm mt-1">{currentTask.error.suggestion}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    No task currently running. Start a task through the chat or tasks panel.
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-black/30 font-mono text-sm p-4 rounded-lg">
              {/* Console logs */}
              <div className="space-y-1">
                {taskLog.length === 0 ? (
                  <div className="text-gray-500 italic">Console output will appear here when you run a task...</div>
                ) : (
                  taskLog.map((log, index) => (
                    <div key={index} className={`${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warning' ? 'text-yellow-400' :
                      'text-green-300'
                    }`}>
                      <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                      <span>{log.message}</span>
                      {log.data && (
                        <pre className="text-xs mt-1 ml-6 p-1 bg-black/40 rounded">
                          {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
                <div ref={taskConsoleRef} />
              </div>
            </div>
            
            <div className="mt-4 flex justify-between">
              <HolographicButton
                variant="outline"
                size="sm"
                onClick={() => setTaskLog([])}
                disabled={taskLog.length === 0 || executionInProgress}
              >
                Clear Console
              </HolographicButton>
              
              <HolographicButton
                variant="outline"
                size="sm"
                onClick={() => {
                  const logText = taskLog.map(log => 
                    `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] ${log.message}`
                  ).join('\n');
                  
                  // Create download link
                  const element = document.createElement('a');
                  const file = new Blob([logText], {type: 'text/plain'});
                  element.href = URL.createObjectURL(file);
                  element.download = `task_log_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                disabled={taskLog.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Logs
              </HolographicButton>
            </div>
          </div>
        )}
        
        {activePanel === 'tasks' && (
          <div className="h-full flex flex-col">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
              <h3 className="text-white font-medium mb-4">Run Custom Task</h3>
              
              <div className="flex flex-col space-y-4">
                <textarea
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  placeholder="Describe the task you want to execute..."
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                  rows={3}
                />
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={enableSlackNotifications}
                      onChange={(e) => setEnableSlackNotifications(e.target.checked)}
                      className="rounded bg-white/10 border-white/20 text-purple-500"
                    />
                    <span className="text-white text-sm">Slack Notifications</span>
                  </label>
                  
                  {enableSlackNotifications && (
                    <input
                      type="text"
                      value={slackWebhook}
                      onChange={(e) => setSlackWebhook(e.target.value)}
                      placeholder="Slack Webhook URL"
                      className="flex-1 p-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                    />
                  )}
                </div>
                
                <div className="flex justify-end">
                  <HolographicButton
                    onClick={() => {
                      setActivePanel('console');
                      executeTask(taskInput);
                    }}
                    disabled={!taskInput.trim() || executionInProgress}
                    glow
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Execute Task
                  </HolographicButton>
                </div>
              </div>
            </div>
            
            <h3 className="text-white font-medium mb-2">Task Templates</h3>
            <div className="space-y-3 overflow-y-auto">
              <TaskTemplate
                title="Data Analysis"
                description="Analyze business metrics and generate insights"
                icon={<BarChart className="w-5 h-5 text-blue-400" />}
                onClick={() => {
                  setTaskInput('Analyze our business metrics and generate actionable insights');
                }}
              />
              
              <TaskTemplate
                title="Customer Communication"
                description="Draft and send an email to customers"
                icon={<MessageSquare className="w-5 h-5 text-green-400" />}
                onClick={() => {
                  setTaskInput('Draft an email to our customers about our new product features');
                }}
              />
              
              <TaskTemplate
                title="Integration Test"
                description="Test API connections and data flow"
                icon={<Code className="w-5 h-5 text-purple-400" />}
                onClick={() => {
                  setTaskInput('Test our API integrations and validate data flow between systems');
                }}
              />
              
              <TaskTemplate
                title="Database Operation"
                description="Perform database queries and analysis"
                icon={<Database className="w-5 h-5 text-orange-400" />}
                onClick={() => {
                  setTaskInput('Query our database for customer usage patterns and analyze the results');
                }}
              />
            </div>
          </div>
        )}
        
        {activePanel === 'analytics' && (
          <div className="h-full flex flex-col space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Execution Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Success Rate:</span>
                    <span className="text-green-400 text-sm">{Math.floor(Math.random() * 10) + 90}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Avg. Response Time:</span>
                    <span className="text-blue-400 text-sm">{Math.floor(Math.random() * 500) + 100}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Messages Processed:</span>
                    <span className="text-purple-400 text-sm">{messages.filter(m => m.role === 'user').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Tasks Executed:</span>
                    <span className="text-orange-400 text-sm">{currentTask ? 1 : 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Agent Metrics</h4>
                <div className="space-y-2">
                  {agents.slice(0, 3).map((agent, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-400 text-sm">{agent.name}:</span>
                      <span className="text-purple-400 text-sm">{Math.floor(Math.random() * 10) + 90}% efficiency</span>
                    </div>
                  ))}
                  {agents.length > 3 && (
                    <div className="text-gray-500 text-xs text-right">
                      +{agents.length - 3} more agents
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">System Performance</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400 text-sm">CPU Usage</span>
                    <span className="text-blue-400 text-sm">{Math.floor(Math.random() * 40) + 10}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${Math.floor(Math.random() * 40) + 10}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400 text-sm">Memory Usage</span>
                    <span className="text-green-400 text-sm">{Math.floor(Math.random() * 30) + 20}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{ width: `${Math.floor(Math.random() * 30) + 20}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400 text-sm">Network I/O</span>
                    <span className="text-purple-400 text-sm">{Math.floor(Math.random() * 50) + 10}KB/s</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-purple-400 h-2 rounded-full" style={{ width: `${Math.floor(Math.random() * 50) + 10}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Token Usage</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 p-2 rounded">
                  <div className="text-xs text-gray-300">Total Used</div>
                  <div className="text-lg font-medium text-white">{Math.floor(Math.random() * 5000) + 1000}</div>
                </div>
                <div className="bg-white/10 p-2 rounded">
                  <div className="text-xs text-gray-300">Input Tokens</div>
                  <div className="text-lg font-medium text-white">{Math.floor(Math.random() * 2000) + 500}</div>
                </div>
                <div className="bg-white/10 p-2 rounded">
                  <div className="text-xs text-gray-300">Output Tokens</div>
                  <div className="text-lg font-medium text-white">{Math.floor(Math.random() * 3000) + 500}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-900/20 p-4 border border-blue-700/30 rounded-lg">
              <h4 className="text-white font-medium mb-2 flex items-center">
                <Rocket className="w-4 h-4 text-blue-400 mr-2" />
                Ready for Deployment
              </h4>
              <p className="text-blue-200 text-sm">
                Your guild has been thoroughly tested and is ready for deployment.
                The simulation shows high performance metrics and successful task execution.
                You can proceed to the deployment stage with confidence.
              </p>
              <div className="mt-3 flex justify-end">
                <HolographicButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // In a real implementation, this would navigate to the deployment step
                    alert('This would proceed to the deployment step in a real implementation.');
                  }}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continue to Deployment
                </HolographicButton>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Diagnostics panel (slide-in) */}
      <AnimatePresence>
        {showDiagnostics && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute top-0 right-0 bottom-0 w-80 bg-black/70 backdrop-blur-md border-l border-white/10 z-10 overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Diagnostics</h3>
                <button
                  onClick={() => setShowDiagnostics(false)}
                  className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
              
              <div className="space-y-2">
                {diagnostics.map((diag, index) => (
                  <div key={index} className={`p-2 rounded ${
                    diag.level === 'error' ? 'bg-red-500/20 text-red-300' :
                    diag.level === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-blue-500/20 text-blue-300'
                  } text-xs`}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{diag.category}</span>
                      <span className="text-gray-400">{new Date(diag.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div>{diag.message}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <h4 className="text-white text-sm font-medium mb-1">Environment Info</h4>
                <div className="text-xs text-gray-300 space-y-1">
                  <div className="flex justify-between">
                    <span>LLM Model:</span>
                    <span className="text-blue-300">{selectedModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Agents:</span>
                    <span className="text-blue-300">{agents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Voice:</span>
                    <span className={isVoiceEnabled ? "text-green-300" : "text-red-300"}>
                      {isVoiceEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credentials:</span>
                    <span className="text-blue-300">
                      {Object.keys(credentials).length} configured
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hidden audio element for voice playback */}
      <audio ref={audioRef} />
    </GlassCard>
  );
};

// Task template component
const TaskTemplate: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ title, description, icon, onClick }) => {
  return (
    <button
      className="w-full text-left p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="text-white font-medium">{title}</div>
          <div className="text-gray-400 text-sm">{description}</div>
        </div>
      </div>
    </button>
  );
};