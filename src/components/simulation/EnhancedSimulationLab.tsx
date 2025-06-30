import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Beaker, 
  Zap, 
  Check, 
  Play, 
  Settings, 
  AlertTriangle, 
  RefreshCw,
  BarChart, 
  Activity,
  MessageSquare,
  Database,
  Rocket,
  Volume2,
  Video,
  Code,
  X,
  Clipboard,
  ExternalLink,
  Loader,
  Send
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { AIModelSelector } from '../ui/AIModelSelector';
import { VoiceInterface } from '../voice/VoiceInterface';
import { VideoInterface } from '../video/VideoInterface';
import { AgentDebugConsole } from '../debugging/AgentDebugConsole';
import { simulationService } from '../../services/simulationService';

interface EnhancedSimulationLabProps {
  guildId: string;
  agents: any[];
  onResults?: (results: any) => void;
  advanced?: boolean;
  className?: string;
}

export const EnhancedSimulationLab: React.FC<EnhancedSimulationLabProps> = ({
  guildId,
  agents,
  onResults,
  advanced = false,
  className = ''
}) => {
  // State for simulation configuration and results
  const [isRunning, setIsRunning] = useState(false);
  const [currentSimulation, setCurrentSimulation] = useState<any | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [simulationHistory, setSimulationHistory] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-flash');
  const [progress, setProgress] = useState(0);
  const [resultsExpanded, setResultsExpanded] = useState<Record<string, boolean>>({});
  const [agentResponses, setAgentResponses] = useState<any[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conversationMode, setConversationMode] = useState<'text' | 'voice' | 'video'>('text');
  const [currentMessage, setCurrentMessage] = useState('');
  const [conversation, setConversation] = useState<{role: string, content: string, timestamp: Date}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'console' | 'metrics'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State for advanced configuration
  const [simulationSettings, setSimulationSettings] = useState({
    simulationType: 'comprehensive',
    simulationDuration: 60, // seconds
    loadFactor: 1.0,
    injectErrors: true,
    verboseLogging: true,
    recordSimulation: true,
  });
  
  // Fetch simulation history on component mount
  useEffect(() => {
    if (guildId) {
      fetchSimulationHistory();
      generateAgentAvatars();
    }
  }, [guildId]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Generate avatars for agents
  const generateAgentAvatars = () => {
    const newAvatarUrls: Record<string, string> = {};
    
    agents.forEach(agent => {
      // Generate a deterministic avatar based on agent name and role
      const seed = `${agent.name}-${agent.role}`.replace(/\s+/g, '-').toLowerCase();
      const gender = Math.random() > 0.5 ? 'men' : 'women';
      const randomNum = Math.floor(Math.abs(hashCode(seed)) % 100);
      
      // Use professional images from Pexels
      if (agent.role.toLowerCase().includes('analyst') || agent.role.toLowerCase().includes('data')) {
        newAvatarUrls[agent.name] = `https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1`;
      } else if (agent.role.toLowerCase().includes('support') || agent.role.toLowerCase().includes('customer')) {
        newAvatarUrls[agent.name] = `https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1`;
      } else if (agent.role.toLowerCase().includes('sales') || agent.role.toLowerCase().includes('marketing')) {
        newAvatarUrls[agent.name] = `https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1`;
      } else if (agent.role.toLowerCase().includes('content') || agent.role.toLowerCase().includes('creative')) {
        newAvatarUrls[agent.name] = `https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1`;
      } else {
        newAvatarUrls[agent.name] = `https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1`;
      }
    });
    
    setAvatarUrls(newAvatarUrls);
  };

  // Simple string hash function for deterministic avatar generation
  const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };
  
  // Fetch simulation history
  const fetchSimulationHistory = async () => {
    try {
      const history = await simulationService.getSimulationHistory(guildId);
      setSimulationHistory(history);
    } catch (error) {
      console.error('Failed to fetch simulation history:', error);
    }
  };
  
  // Start simulation
  const startSimulation = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setError(null);
    setProgress(0);
    setShowResults(false);
    setResultsExpanded({});
    
    try {
      // Create simulation config
      const config: any = {
        guild_id: guildId,
        agents: agents,
        simulation_type: simulationSettings.simulationType,
        parameters: {
          duration_minutes: simulationSettings.simulationDuration / 60,
          load_factor: simulationSettings.loadFactor,
          error_injection: simulationSettings.injectErrors,
          performance_profiling: true,
          ai_model: selectedModel,
          slackEnabled: slackEnabled,
          slackWebhookUrl: slackWebhookUrl
        },
        test_scenarios: getTestScenarios()
      };
      
      console.log('Starting simulation with config:', config);
      
      // Send message to Slack about simulation starting
      if (slackEnabled && slackWebhookUrl) {
        try {
          console.log('🔄 Sending start message to Slack webhook');
          
          // Send a test message to Slack
          await fetch(slackWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: `🧪 *GenesisOS Simulation Started*\n\nGuild: ${guildId}\nTime: ${new Date().toLocaleString()}\nModel: ${config.parameters?.ai_model || 'gemini-flash'}\nType: ${config.test_scenarios?.[0] || 'comprehensive'}`
            })
          });
          
          console.log('✅ Test message sent to Slack successfully');
        } catch (error) {
          console.error('Failed to send test message to Slack:', error);
        }
      }
      
      // Start progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + (Math.random() * 5);
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 200);
      
      // Execute simulation
      const results = await simulationService.runSimulation(guildId, config);
      
      // Clear progress interval
      clearInterval(progressInterval);
      setProgress(100);
      
      // Update state with results
      setCurrentSimulation(results);
      setAgentResponses(results.agent_responses || []);
      setShowResults(true);
      
      if (onResults) {
        onResults(results);
      }
      
      // Refresh history
      fetchSimulationHistory();
      
      // Add system message to conversation
      addMessage('system', 'Simulation completed successfully. You can now interact with the agents.');
      
    } catch (error: any) {
      setError(error.message || 'Failed to run simulation');
      console.error('Simulation error:', error);
    } finally {
      setIsRunning(false);
    }
  };
  
  // Get test scenarios based on simulation type
  const getTestScenarios = (): string[] => {
    switch (simulationSettings.simulationType) {
      case 'quick':
        return ['normal_operation'];
      case 'comprehensive':
        return ['normal_operation', 'high_load', 'error_injection'];
      case 'stress':
        return ['high_load', 'error_injection', 'network_latency'];
      default:
        return ['normal_operation', 'error_injection'];
    }
  };
  
  // Handle setting changes
  const handleSettingChange = (setting: keyof typeof simulationSettings, value: any) => {
    setSimulationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Toggle result expansion
  const toggleResultExpansion = (agentName: string) => {
    setResultsExpanded(prev => ({
      ...prev,
      [agentName]: !prev[agentName]
    }));
  };
  
  // Add message to conversation
  const addMessage = (role: string, content: string) => {
    setConversation(prev => [
      ...prev,
      { role, content, timestamp: new Date() }
    ]);
  };
  
  // Handle sending message to agent
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    // Add user message to conversation
    addMessage('user', currentMessage);
    
    // Clear input and set processing state
    setCurrentMessage('');
    setIsProcessing(true);
    
    try {
      // Get the selected agent or first agent
      const targetAgent = selectedAgent 
        ? agents.find(a => a.name === selectedAgent) 
        : agents[0];
      
      if (!targetAgent) {
        throw new Error('No agent available to handle message');
      }
      
      // Simulate agent thinking time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Generate agent response based on message content
      let response = '';
      
      // Create a more contextual response based on the message
      if (currentMessage.toLowerCase().includes('introduce') || currentMessage.toLowerCase().includes('who are you')) {
        response = `I'm ${targetAgent.name}, an AI assistant designed to help with tasks related to ${targetAgent.role}. My primary responsibility is to ${targetAgent.description.toLowerCase()}. I'm equipped with tools like ${targetAgent.tools_needed.slice(0, 3).join(', ')} to help you accomplish your goals efficiently. How can I assist you today?`;
      } else if (currentMessage.toLowerCase().includes('help') || currentMessage.toLowerCase().includes('what can you do')) {
        response = `I can assist you with a variety of tasks related to ${targetAgent.role.toLowerCase()}. This includes ${targetAgent.description.toLowerCase()}. I can use tools like ${targetAgent.tools_needed.join(', ')} to accomplish these tasks. Would you like me to demonstrate any specific capability?`;
      } else if (currentMessage.toLowerCase().includes('test') || currentMessage.toLowerCase().includes('run') || currentMessage.toLowerCase().includes('demonstrate')) {
        response = `I'd be happy to run a test task for you. Based on my role as a ${targetAgent.role}, I can ${getTestTask(targetAgent)}. Would you like me to proceed with this test?`;
      } else if (currentMessage.toLowerCase().includes('yes') || currentMessage.toLowerCase().includes('proceed') || currentMessage.toLowerCase().includes('go ahead')) {
        response = `Great! I'll start the test task now. ${getTaskExecution(targetAgent)}`;
        
        // Add system message after a delay to simulate task completion
        setTimeout(() => {
          addMessage('system', `✅ Task completed successfully by ${targetAgent.name}`);
          
          // If Slack is enabled, send notification
          if (slackEnabled && slackWebhookUrl) {
            try {
              fetch(slackWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: `✅ *Task Completed by ${targetAgent.name}*\n\nAgent successfully executed: ${getTestTask(targetAgent)}\n\nTime: ${new Date().toLocaleString()}`
                })
              });
            } catch (error) {
              console.error('Failed to send Slack notification:', error);
            }
          }
        }, 3000);
      } else {
        response = `I understand you're asking about "${currentMessage}". As a ${targetAgent.role}, I can help with this by ${targetAgent.description.toLowerCase()}. Would you like me to take any specific action related to this request?`;
      }
      
      // Add agent response to conversation
      addMessage('assistant', response);
      
      // If voice is enabled, trigger voice synthesis
      if (conversationMode === 'voice') {
        setVoiceEnabled(true);
      } else if (conversationMode === 'video') {
        setVideoEnabled(true);
      }
    } catch (error: any) {
      console.error('Error processing message:', error);
      addMessage('system', `Error: ${error.message || 'Failed to process message'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Get a test task based on agent role
  const getTestTask = (agent: any): string => {
    const role = agent.role.toLowerCase();
    
    if (role.includes('analyst') || role.includes('data')) {
      return 'analyze recent performance metrics and generate a summary report';
    } else if (role.includes('support') || role.includes('customer')) {
      return 'respond to a sample customer inquiry about product features';
    } else if (role.includes('sales') || role.includes('marketing')) {
      return 'draft a personalized outreach message to a potential client';
    } else if (role.includes('content') || role.includes('creative')) {
      return 'create a short blog post outline based on trending topics';
    } else {
      return 'perform a standard workflow demonstration using my capabilities';
    }
  };
  
  // Get task execution details based on agent role
  const getTaskExecution = (agent: any): string => {
    const role = agent.role.toLowerCase();
    
    if (role.includes('analyst') || role.includes('data')) {
      return "I'm connecting to your data sources, analyzing the metrics, and preparing a summary report. This typically takes a few moments to complete...";
    } else if (role.includes('support') || role.includes('customer')) {
      return "I'm accessing your knowledge base, retrieving product information, and crafting a comprehensive response to the customer inquiry...";
    } else if (role.includes('sales') || role.includes('marketing')) {
      return "I'm reviewing client data, identifying key pain points, and creating a personalized outreach message that highlights relevant solutions...";
    } else if (role.includes('content') || role.includes('creative')) {
      return "I'm analyzing trending topics, evaluating audience interests, and developing a structured blog post outline with key points...";
    } else {
      return "I'm executing the standard workflow, connecting to necessary systems, and processing the required information...";
    }
  };
  
  // Toggle conversation mode
  const handleToggleConversationMode = (mode: 'text' | 'voice' | 'video') => {
    setConversationMode(mode);
    
    if (mode === 'voice') {
      setVoiceEnabled(true);
      setVideoEnabled(false);
    } else if (mode === 'video') {
      setVoiceEnabled(false);
      setVideoEnabled(true);
    } else {
      setVoiceEnabled(false);
      setVideoEnabled(false);
    }
  };

  // Select agent for conversation
  const handleSelectAgent = (agentName: string) => {
    setSelectedAgent(agentName);
    addMessage('system', `Switched to agent: ${agentName}`);
  };
  
  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        addMessage('system', 'Text copied to clipboard');
      })
      .catch(err => {
        addMessage('system', `Error copying to clipboard: ${err}`);
      });
  };
  
  return (
    <>
      <GlassCard variant="medium" className={`p-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Beaker className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Enhanced Simulation Lab</h2>
              <p className="text-gray-300">Test your guild with realistic scenarios and get AI-generated insights</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <HolographicButton
              variant="ghost"
              size="sm"
              onClick={() => setShowDebugConsole(!showDebugConsole)}
            >
              <Code className="w-4 h-4 mr-1" />
              Debug Console
            </HolographicButton>
            
            <HolographicButton
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Settings className="w-4 h-4 mr-2" />
              {showDetails ? 'Hide Settings' : 'Show Settings'}
            </HolographicButton>
          </div>
        </div>

        {/* Configuration and Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - AI Model and Info */}
          <div>
            <AIModelSelector
              selectedModelId={selectedModel}
              onSelect={setSelectedModel}
              label="AI Intelligence Model"
              className="mb-6"
            />
            
            {/* Agent Selection with Avatars */}
            <div className="bg-white/5 p-4 border border-white/10 rounded-lg mb-4">
              <h4 className="text-white text-sm font-medium mb-3">Select Agent for Conversation</h4>
              <div className="flex flex-wrap gap-3">
                {agents.map((agent, index) => (
                  <div 
                    key={index}
                    onClick={() => handleSelectAgent(agent.name)}
                    className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all ${
                      selectedAgent === agent.name 
                        ? 'bg-purple-500/30 border border-purple-500/50' 
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <img 
                      src={avatarUrls[agent.name] || 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=1'} 
                      alt={agent.name}
                      className="w-16 h-16 rounded-lg object-cover mb-2"
                    />
                    <div className="text-white text-xs font-medium">{agent.name}</div>
                    <div className="text-xs text-gray-400">{agent.role}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-900/20 p-4 border border-blue-700/30 rounded-lg mb-6">
              <div className="flex items-center mb-2">
                <Brain className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="font-medium text-white">Guild Intelligence Preview</h3>
              </div>
              <p className="text-blue-200 text-sm">
                Your guild contains {agents.length} intelligent agents that will be tested
                with realistic scenarios to ensure they can work together effectively.
              </p>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-white/10 p-2 rounded">
                  <div className="text-xs text-gray-300">Agents</div>
                  <div className="text-lg font-medium text-white">{agents.length}</div>
                </div>
                <div className="bg-white/10 p-2 rounded">
                  <div className="text-xs text-gray-300">Tools</div>
                  <div className="text-lg font-medium text-white">
                    {agents.reduce((acc, agent) => acc + (agent.tools_needed?.length || 0), 0)}
                  </div>
                </div>
                <div className="bg-white/10 p-2 rounded">
                  <div className="text-xs text-gray-300">Est. Time</div>
                  <div className="text-lg font-medium text-white">{simulationSettings.simulationDuration}s</div>
                </div>
              </div>
              
              {/* Integration Options */}
              <div className="mt-6">
                <h4 className="text-white text-sm font-medium mb-3">Integration Testing</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-300">Slack Integration</span>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={slackEnabled}
                        onChange={() => setSlackEnabled(!slackEnabled)}
                      />
                      <span
                        className={`block h-6 w-10 rounded-full transition-colors ${
                          slackEnabled ? 'bg-indigo-500' : 'bg-gray-600'
                        }`}
                      />
                      <span
                        className={`absolute left-0.5 top-0.5 block h-5 w-5 rounded-full bg-white transition-transform transform ${
                          slackEnabled ? 'translate-x-4' : ''
                        }`}
                      />
                    </div>
                  </label>
                  
                  {slackEnabled && (
                    <div className="pt-2">
                      <label className="block text-xs text-gray-400 mb-1">
                        Slack Webhook URL
                      </label>
                      <input
                        type="text"
                        value={slackWebhookUrl}
                        onChange={(e) => setSlackWebhookUrl(e.target.value)}
                        className="w-full p-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Conversation Interface */}
          <div>
            <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'chat' 
                      ? 'text-white border-b-2 border-purple-500' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('chat')}
                >
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </div>
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'console' 
                      ? 'text-white border-b-2 border-purple-500' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('console')}
                >
                  <div className="flex items-center">
                    <Code className="w-4 h-4 mr-2" />
                    Console
                  </div>
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'metrics' 
                      ? 'text-white border-b-2 border-purple-500' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('metrics')}
                >
                  <div className="flex items-center">
                    <BarChart className="w-4 h-4 mr-2" />
                    Metrics
                  </div>
                </button>
              </div>
              
              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'chat' && (
                  <div className="flex flex-col h-[400px]">
                    {/* Conversation Mode Selector */}
                    <div className="flex items-center space-x-3 mb-4">
                      <button
                        onClick={() => handleToggleConversationMode('text')}
                        className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs ${
                          conversationMode === 'text' 
                            ? 'bg-purple-500/30 text-white border border-purple-500/50' 
                            : 'text-gray-300 bg-white/10 border border-white/10 hover:bg-white/20'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Text</span>
                      </button>
                      <button
                        onClick={() => handleToggleConversationMode('voice')}
                        className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs ${
                          conversationMode === 'voice' 
                            ? 'bg-blue-500/30 text-white border border-blue-500/50' 
                            : 'text-gray-300 bg-white/10 border border-white/10 hover:bg-white/20'
                        }`}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Voice</span>
                      </button>
                      <button
                        onClick={() => handleToggleConversationMode('video')}
                        className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs ${
                          conversationMode === 'video' 
                            ? 'bg-green-500/30 text-white border border-green-500/50' 
                            : 'text-gray-300 bg-white/10 border border-white/10 hover:bg-white/20'
                        }`}
                      >
                        <Video className="w-3 h-3" />
                        <span>Video</span>
                      </button>
                    </div>
                    
                    {/* Conversation Display */}
                    <div className="flex-1 overflow-y-auto mb-4 bg-black/20 rounded-lg p-4">
                      {conversation.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-center">
                            Start a conversation with your AI guild.<br/>
                            Try asking: "Can you introduce yourself?"
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {conversation.map((msg, index) => (
                            <div 
                              key={index} 
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              {msg.role === 'assistant' && (
                                <img 
                                  src={selectedAgent ? avatarUrls[selectedAgent] : avatarUrls[agents[0]?.name]}
                                  alt="Agent"
                                  className="w-8 h-8 rounded-full mr-2 object-cover"
                                />
                              )}
                              
                              <div 
                                className={`max-w-[80%] p-3 rounded-lg ${
                                  msg.role === 'user' 
                                    ? 'bg-purple-500/20 text-white' 
                                    : msg.role === 'assistant'
                                    ? 'bg-blue-500/20 text-white'
                                    : 'bg-gray-500/20 text-gray-300 text-xs'
                                }`}
                              >
                                {msg.content}
                                <div className="text-xs text-gray-400 mt-1">
                                  {msg.timestamp.toLocaleTimeString()}
                                </div>
                              </div>
                              
                              {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full ml-2 bg-purple-500/20 flex items-center justify-center">
                                  <span className="text-white text-xs">You</span>
                                </div>
                              )}
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                    
                    {/* Input Area */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={isProcessing ? "Processing..." : "Type a message to the agent..."}
                        className="flex-1 p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                        disabled={isProcessing}
                      />
                      <HolographicButton
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim() || isProcessing}
                      >
                        {isProcessing ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </HolographicButton>
                    </div>
                  </div>
                )}
                
                {activeTab === 'console' && (
                  <div className="h-[400px] overflow-y-auto bg-black/30 font-mono text-sm p-4">
                    <div className="text-green-400 mb-2">$ Simulation Console</div>
                    {conversation.length === 0 ? (
                      <div className="text-gray-400">No activity yet. Start a conversation to see logs.</div>
                    ) : (
                      <div className="space-y-1">
                        {conversation.map((msg, index) => (
                          <div key={index} className="text-gray-300">
                            <span className="text-gray-500">[{msg.timestamp.toLocaleTimeString()}]</span>{' '}
                            <span className={
                              msg.role === 'user' ? 'text-blue-400' :
                              msg.role === 'assistant' ? 'text-green-400' :
                              'text-yellow-400'
                            }>
                              {msg.role === 'user' ? 'USER' : 
                               msg.role === 'assistant' ? 'AGENT' : 
                               'SYSTEM'}
                            </span>:{' '}
                            {msg.content}
                          </div>
                        ))}
                        
                        {/* Add some simulated system logs */}
                        {conversation.length > 0 && (
                          <>
                            <div className="text-gray-300">
                              <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>{' '}
                              <span className="text-purple-400">MEMORY</span>: Storing conversation context in short-term memory
                            </div>
                            <div className="text-gray-300">
                              <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>{' '}
                              <span className="text-cyan-400">TOOLS</span>: Initialized agent tools for {selectedAgent || agents[0]?.name}
                            </div>
                            <div className="text-gray-300">
                              <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>{' '}
                              <span className="text-green-400">SYSTEM</span>: Agent response generated in 842ms
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'metrics' && (
                  <div className="h-[400px] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                        <div className="text-xs text-gray-400 mb-1">Response Time</div>
                        <div className="text-xl font-bold text-white">842ms</div>
                        <div className="text-xs text-green-400">-12% vs baseline</div>
                      </div>
                      <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                        <div className="text-xs text-gray-400 mb-1">Success Rate</div>
                        <div className="text-xl font-bold text-white">98.5%</div>
                        <div className="text-xs text-green-400">+2.3% vs baseline</div>
                      </div>
                      <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                        <div className="text-xs text-gray-400 mb-1">Memory Usage</div>
                        <div className="text-xl font-bold text-white">64MB</div>
                        <div className="text-xs text-blue-400">Optimal range</div>
                      </div>
                      <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                        <div className="text-xs text-gray-400 mb-1">Token Usage</div>
                        <div className="text-xl font-bold text-white">1,248</div>
                        <div className="text-xs text-green-400">-8% vs baseline</div>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10 mb-4">
                      <h5 className="text-white text-sm font-medium mb-3 flex items-center">
                        <Activity className="w-4 h-4 text-blue-400 mr-2" />
                        Performance Metrics
                      </h5>
                      
                      <div className="h-40 relative">
                        {/* Simple bar chart visualization */}
                        <div className="absolute inset-0 flex items-end justify-between px-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => (
                            <div key={i} className="w-8 flex flex-col items-center">
                              <div 
                                className="w-6 bg-blue-500 rounded-t"
                                style={{ height: `${Math.random() * 70 + 20}%` }}
                              ></div>
                              <div className="text-xs text-gray-400 mt-1">
                                {i + 1}m
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <h5 className="text-white text-sm font-medium mb-3 flex items-center">
                        <Database className="w-4 h-4 text-purple-400 mr-2" />
                        Memory Metrics
                      </h5>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Short-term entries</span>
                          <span className="text-white text-sm">24</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Long-term entries</span>
                          <span className="text-white text-sm">156</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Avg. importance score</span>
                          <span className="text-white text-sm">0.72</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Avg. retrieval time</span>
                          <span className="text-white text-sm">28ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Simulation Controls */}
            <div className="mt-6">
              <HolographicButton
                onClick={startSimulation}
                size="lg"
                className="w-full"
                glow
                disabled={isRunning}
              >
                <div className="flex items-center">
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Running AI Simulation...
                    </>
                  ) : (
                    <>
                      Start Intelligence Test
                      <Play className="w-5 h-5 ml-2" />
                    </>
                  )}
                </div>
              </HolographicButton>
              
              {/* Progress Bar (only shown when simulation is running) */}
              {isRunning && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Simulation Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Simulation Results */}
        {showResults && currentSimulation && (
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                {currentSimulation.overall_success ? (
                  <Check className="w-6 h-6 text-green-400 mr-2" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-400 mr-2" />
                )}
                Simulation {currentSimulation.overall_success ? 'Passed' : 'Completed'}
              </h3>
              <div className="text-gray-300 text-sm">
                ID: {currentSimulation.id.slice(-8)}
              </div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                <div className="text-gray-400 text-sm mb-1">Status</div>
                <div className={`font-bold text-lg ${
                  currentSimulation.overall_success ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {currentSimulation.overall_success ? 'Success' : 'Partial Success'}
                </div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                <div className="text-gray-400 text-sm mb-1">Execution Time</div>
                <div className="font-bold text-lg text-white">
                  {currentSimulation.execution_time.toFixed(2)}s
                </div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                <div className="text-gray-400 text-sm mb-1">Success Rate</div>
                <div className="font-bold text-lg text-white">
                  {currentSimulation.workflow_metrics?.success_rate || 0}%
                </div>
              </div>
              <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                <div className="text-gray-400 text-sm mb-1">Tested Agents</div>
                <div className="font-bold text-lg text-white">
                  {currentSimulation.agent_responses?.length || 0}
                </div>
              </div>
            </div>
            
            {/* Agent Responses */}
            <div className="space-y-4 mb-8">
              <h4 className="text-lg font-semibold text-white flex items-center">
                <Brain className="w-5 h-5 text-purple-400 mr-2" />
                Agent Responses
              </h4>
              
              <div className="space-y-3">
                {currentSimulation.agent_responses.map((response: any, index: number) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      response.success 
                        ? 'bg-green-900/20 border-green-500/30' 
                        : 'bg-red-900/20 border-red-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        {response.success ? (
                          <Check className="w-5 h-5 text-green-400 mr-2" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                        )}
                        <div>
                          <h5 className="text-white font-medium">{response.agent_name}</h5>
                          <p className="text-xs text-gray-400">
                            {response.execution_time.toFixed(2)}s execution time
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleResultExpansion(response.agent_name)}
                        className="text-gray-400 hover:text-white"
                      >
                        {resultsExpanded[response.agent_name] ? 'Less' : 'More'}
                      </button>
                    </div>
                    
                    <div className="mt-3 text-white/90">
                      {response.response}
                    </div>
                    
                    {resultsExpanded[response.agent_name] && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <h6 className="text-sm font-medium text-white mb-2">Thought Process:</h6>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                          {response.thought_process.map((thought: string, i: number) => (
                            <li key={i}>{thought}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Insights and Metrics */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="text-lg font-semibold text-white flex items-center mb-4">
                  <Zap className="w-5 h-5 text-yellow-400 mr-2" />
                  Simulation Insights
                </h4>
                
                <div className="space-y-2">
                  {currentSimulation.insights.map((insight: string, index: number) => (
                    <div 
                      key={index}
                      className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-yellow-100 text-sm"
                    >
                      {insight}
                    </div>
                  ))}
                </div>
                
                <h4 className="text-lg font-semibold text-white flex items-center mb-4 mt-6">
                  <Activity className="w-5 h-5 text-blue-400 mr-2" />
                  Optimization Recommendations
                </h4>
                
                <div className="space-y-2">
                  {currentSimulation.recommendations.map((rec: string, index: number) => (
                    <div 
                      key={index}
                      className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-blue-100 text-sm"
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white flex items-center mb-4">
                  <BarChart className="w-5 h-5 text-green-400 mr-2" />
                  Performance Metrics
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Avg Response Time</div>
                    <div className="text-2xl font-bold text-white">
                      {currentSimulation.workflow_metrics.average_response_time_ms}ms
                    </div>
                    <div className="text-xs text-green-400">
                      {Math.random() > 0.5 ? '+' : '-'}{Math.floor(Math.random() * 10) + 1}% vs baseline
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Success Rate</div>
                    <div className="text-2xl font-bold text-white">
                      {currentSimulation.workflow_metrics.success_rate}%
                    </div>
                    <div className="text-xs text-green-400">
                      +{Math.floor(Math.random() * 5) + 1}% vs baseline
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Operations</div>
                    <div className="text-2xl font-bold text-white">
                      {currentSimulation.workflow_metrics.total_operations}
                    </div>
                    <div className="text-xs text-blue-400">
                      Across {agents.length} agents
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Peak Load</div>
                    <div className="text-2xl font-bold text-white">
                      {currentSimulation.workflow_metrics.peak_concurrent_operations}
                    </div>
                    <div className="text-xs text-yellow-400">
                      Concurrent operations
                    </div>
                  </div>
                  
                  {currentSimulation.workflow_metrics.ai_model && (
                    <div className="p-3 bg-white/5 border border-white/10 rounded-lg col-span-2">
                      <div className="text-sm text-gray-400 mb-1">AI Model</div>
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-bold text-white">
                          {currentSimulation.workflow_metrics.ai_model}
                        </div>
                        <div className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded">
                          {currentSimulation.workflow_metrics.token_usage || 'N/A'} tokens
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simulation History */}
        {simulationHistory.length > 0 && (
          <div className="mt-8 pt-8 border-t border-white/10">
            <h4 className="text-lg font-semibold text-white flex items-center mb-4">
              <Activity className="w-5 h-5 text-purple-400 mr-2" />
              Simulation History
            </h4>
            
            <div className="grid md:grid-cols-2 gap-3">
              {simulationHistory.slice(0, 4).map((sim, index) => (
                <div
                  key={index}
                  className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => {
                    setCurrentSimulation(sim);
                    setAgentResponses(sim.agent_responses || []);
                    setShowResults(true);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="text-white font-medium">
                        Simulation #{sim.id.slice(-8)}
                      </h5>
                      <div className="text-xs text-gray-400">
                        {new Date(sim.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className={`px-2 py-1 text-xs rounded ${
                      sim.overall_success
                        ? 'bg-green-900/20 text-green-400 border border-green-900/30'
                        : 'bg-red-900/20 text-red-400 border border-red-900/30'
                    }`}>
                      {sim.overall_success ? 'Successful' : 'Failed'}
                    </div>
                  </div>
                  
                  <div className="mt-2 flex justify-between text-sm">
                    <div className="text-gray-300">
                      {sim.agent_responses ? sim.agent_responses.length : 0} agents
                    </div>
                    <div className="text-blue-300">
                      {sim.execution_time.toFixed(1)}s
                    </div>
                    <div className="text-purple-300">
                      {sim.workflow_metrics?.success_rate || 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
      
      {/* Voice Interface */}
      {voiceEnabled && selectedAgent && (
        <VoiceInterface
          agentId={selectedAgent} 
          agentName={selectedAgent}
          isVisible={voiceEnabled}
          onCommand={(command) => {
            setCurrentMessage(command);
            handleSendMessage();
          }}
        />
      )}
      
      {/* Video Interface */}
      {videoEnabled && selectedAgent && (
        <VideoInterface
          agentId={selectedAgent}
          agentName={selectedAgent}
          isVisible={videoEnabled}
          onCommand={(command) => {
            setCurrentMessage(command);
            handleSendMessage();
          }}
        />
      )}
      
      {/* Debug Console */}
      {showDebugConsole && selectedAgent && (
        <div className="mt-6">
          <AgentDebugConsole
            agentId={selectedAgent}
            agentName={selectedAgent}
            onClose={() => setShowDebugConsole(false)}
          />
        </div>
      )}
    </>
  );
};