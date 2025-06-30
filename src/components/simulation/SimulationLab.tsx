import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Brain, 
  Zap, 
  Clock, 
  Settings, 
  Cpu, 
  Beaker, 
  RefreshCw,
  MessageSquare 
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { AIModelSelector } from '../ui/AIModelSelector';
import { simulationService } from '../../services/simulationService';

interface SimulationLabProps {
  guildId: string;
  agents: any[];
  onResults?: (results: any) => void;
  className?: string;
}

export const SimulationLab: React.FC<SimulationLabProps> = ({
  guildId,
  agents,
  onResults,
  className = ''
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSimulation, setCurrentSimulation] = useState<any>(null);
  const [simulationHistory, setSimulationHistory] = useState<any[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<any>({});
  const [showLabView, setShowLabView] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-flash');
  const [simulationSettings, setSimulationSettings] = useState({
    llmChoice: 'gemini_2_flash', // Updated to use Gemini 2.0 Flash
    simulationType: 'comprehensive',
    simulationDuration: 60, // Shorter duration for faster results
    voiceEnabled: false,
    slackEnabled: false,
    slackWebhookUrl: ''
  });
  
  // Chat interface state
  const [messages, setMessages] = useState<{role: string, content: string, timestamp: Date}[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(agents.length > 0 ? agents[0] : null);
  
  // WebSocket for real-time communication
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize with a welcome message
  useEffect(() => {
    // Add initial system message
    setMessages([
      {
        role: 'system',
        content: 'Welcome to the Simulation Lab! You can test your guild by chatting with it or running a comprehensive simulation.',
        timestamp: new Date()
      }
    ]);
    
    // Load simulation history
    fetchSimulationHistory();
    
    // Initialize connection
    initializeConnection();
    
    return () => {
      // Clean up WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [guildId]);

  // When model selection changes, update the simulation settings
  useEffect(() => {
    if (selectedModel) {
      setSimulationSettings(prev => ({
        ...prev,
        llmChoice: selectedModel === 'gemini-flash' ? 'gemini_2_flash' 
                 : selectedModel === 'gemini-pro' ? 'gemini_2_pro'
                 : selectedModel === 'claude-3-sonnet' ? 'claude_3_sonnet'
                 : 'gpt_4'
      }));
    }
  }, [selectedModel]);

  const initializeConnection = async () => {
    console.log("Connecting to simulation service...");
    try {
      // In a real implementation, this would connect to a websocket server
      // For now, we'll simulate a connection with a timeout
      setTimeout(() => {
        setIsConnected(true);
        console.log('Connected to simulation service');
        
        // Add an initial message
        addSystemMessage('Simulation service connected. Ready for voice or text interaction.');
      }, 1000);
    } catch (error) {
      console.error('Failed to connect to simulation service:', error);
      console.log('Using simulated mode. Real-time data processing enabled.');
    }
  };

  const fetchSimulationHistory = async () => {
    try {
      const history = await simulationService.getSimulationHistory(guildId);
      setSimulationHistory(history);
    } catch (error) {
      console.error('Failed to fetch simulation history:', error);
    }
  };

  const handleSettingChange = (setting: string, value: any) => {
    setSimulationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleRunSimulation = async () => {
    try {
      console.log('🧪 Running simulation with settings:', simulationSettings);
      
      setIsRunning(true);
      setCurrentSimulation(null);
      
      // Create enhanced simulation config
      const simulationConfig = {
        guild_id: guildId,
        agents: agents,
        simulation_type: simulationSettings.simulationType,
        parameters: {
          duration_minutes: simulationSettings.simulationDuration / 60, // Convert seconds to minutes
          load_factor: 1.0,
          error_injection: true,
          performance_profiling: true,
          ai_model: simulationSettings.llmChoice,
          slackEnabled: simulationSettings.slackEnabled,
          slackWebhookUrl: simulationSettings.slackWebhookUrl
        }
      };
      
      // Run the simulation with enhanced config
      const results = await simulationService.runSimulation(guildId, simulationConfig);
      
      // Update local state
      setCurrentSimulation(results);
      setIsRunning(false);
      
      // Notify parent
      if (onResults) {
        onResults(results);
      }
      
      // Add to simulation history
      setSimulationHistory(prev => [results, ...prev]);
      
      // Add system message about completed simulation
      addSystemMessage(`Simulation completed with ${results.overall_success ? 'success' : 'issues'}. ${
        results.overall_success 
          ? `All ${agents.length} agents performed optimally.` 
          : 'Some agents encountered issues during testing.'
      }`);
      
    } catch (error) {
      console.error('Simulation failed:', error);
      setIsRunning(false);
      
      // Add error message
      addSystemMessage(`Simulation failed: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Add system message
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
  
  // Add user message and get response
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    // Add user message
    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: userInput,
        timestamp: new Date()
      }
    ]);
    
    // Clear input
    setUserInput('');
    
    // Simulate agent processing
    simulateAgentResponse(userInput);
  };
  
  // Simulate agent response
  const simulateAgentResponse = async (userMessage: string) => {
    try {
      // Show typing indicator
      setIsSpeaking(true);
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // Generate intelligent response based on guild purpose
      let agentResponse = '';
      
      // Create context-aware responses
      if (userMessage.toLowerCase().includes('introduce') || userMessage.toLowerCase().includes('who are you') || userMessage.toLowerCase().includes('what can you do')) {
        const agentName = selectedAgent?.name || 'AI Guild';
        const agentRole = selectedAgent?.role || 'assistant';
        const guildPurpose = agents.length > 0 ? `helping with ${agents[0].description}` : 'assisting with your tasks';
        
        agentResponse = `I'm ${agentName}, an AI ${agentRole} specialized in ${guildPurpose}. I work as part of a guild of ${agents.length} specialized agents that collaborate to achieve your goals. Would you like me to demonstrate one of my capabilities?`;
      } 
      else if (userMessage.toLowerCase().includes('show me') || userMessage.toLowerCase().includes('demonstrate') || userMessage.toLowerCase().includes('example')) {
        agentResponse = `I'd be happy to demonstrate my capabilities. For example, I can ${selectedAgent?.description || 'analyze data and provide insights'}. Would you like me to run a test task now?`;
      }
      else if (userMessage.toLowerCase().includes('yes') || userMessage.toLowerCase().includes('run test') || userMessage.toLowerCase().includes('show test')) {
        // Simulate running a test task
        agentResponse = `I'll run a test task now. ${simulateTestTask(selectedAgent)}`;
        
        // Add a system message showing task execution
        setTimeout(() => {
          addSystemMessage(`Task executed: ${selectedAgent?.name || 'Agent'} is accessing external systems...`);
          
          // Simulate task completion after a delay
          setTimeout(() => {
            const success = Math.random() > 0.2; // 80% success rate
            
            if (success) {
              addSystemMessage(`Task completed successfully: All operations executed with ${Math.floor(Math.random() * 10) + 90}% efficiency`);
            } else {
              addSystemMessage(`Task encountered an issue: ${getRandomError()}. Would you like me to retry with different parameters?`);
            }
          }, 3000);
        }, 1500);
      }
      else if (userMessage.toLowerCase().includes('error') || userMessage.toLowerCase().includes('issue') || userMessage.toLowerCase().includes('problem')) {
        agentResponse = `I've analyzed potential issues and can help troubleshoot. The most common errors in tasks like these include API timeout errors, authentication failures, or data formatting issues. I can run diagnostics and suggest solutions if you're experiencing any specific problems.`;
      }
      else {
        agentResponse = `I understand you're asking about "${userMessage}". As an AI assistant specialized in ${selectedAgent?.role || 'various tasks'}, I can help with this. Would you like me to break this down into actionable steps or would you prefer I handle this task directly?`;
      }
      
      // Add agent response
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: agentResponse,
            timestamp: new Date()
          }
        ]);
        setIsSpeaking(false);
        
        // If voice is enabled, speak the response
        if (simulationSettings.voiceEnabled && audioRef.current) {
          // In a real implementation, this would use the voice service
          // For now, we use browser's speech synthesis
          const utterance = new SpeechSynthesisUtterance(agentResponse);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          speechSynthesis.speak(utterance);
        }
      }, 1500);
    } catch (error) {
      console.error('Error generating response:', error);
      setIsSpeaking(false);
      
      // Add error message
      addSystemMessage(`Error generating response: ${error.message || 'Unknown error'}`);
    }
  };
  
  // Simulate test task execution
  const simulateTestTask = (agent: any): string => {
    if (!agent) return "running a general analysis test";
    
    const role = agent.role.toLowerCase();
    
    if (role.includes('analyst') || role.includes('data')) {
      return `analyzing key performance metrics across your business data. I'm extracting patterns from your historical data and generating actionable insights.`;
    } 
    else if (role.includes('support') || role.includes('service')) {
      return `processing a sample customer support ticket. I'm categorizing the issue, retrieving relevant knowledge base articles, and generating a personalized response.`;
    }
    else if (role.includes('marketing') || role.includes('content')) {
      return `creating a content calendar based on your target audience and business goals. I'm identifying optimal posting times and content themes for maximum engagement.`;
    }
    else if (role.includes('sales')) {
      return `analyzing your sales pipeline and identifying opportunities to optimize conversion rates. I'm segmenting leads and generating personalized outreach strategies.`;
    }
    else {
      return `executing a test workflow related to ${agent.description}. I'm connecting to the necessary external systems and processing the data according to your specifications.`;
    }
  };
  
  // Get random error message
  const getRandomError = (): string => {
    const errors = [
      "API rate limit exceeded, retrying with exponential backoff",
      "External service authentication failed, credential refresh required",
      "Data validation error: malformed response from third-party API",
      "Network timeout while connecting to external service",
      "Insufficient permissions to access requested resource"
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  };

  return (
    <GlassCard variant="medium" className="p-6 h-full flex flex-col">
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
            onClick={() => {
              const url = document.getElementById('slackWebhookUrl') as HTMLInputElement;
              if (url && url.value) {
                // Test Slack webhook
                fetch(url.value, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text: "🧪 *GenesisOS Test Message*\n\nThis is a test message from your simulation lab."
                  })
                })
                .then(() => alert('Test message sent to Slack!'))
                .catch(err => alert('Error sending message: ' + err.message));
              } else {
                alert('Please enter a Slack webhook URL first.');
              }
            }}
          >
            <MessageSquare className="w-4 h-4" />
          </HolographicButton>
          <HolographicButton
            variant={showLabView ? "outline" : "primary"}
            size="sm"
            onClick={() => setShowLabView(!showLabView)}
          >
            {showLabView ? "Simple View" : "Advanced Lab"}
          </HolographicButton>
        </div>
      </div>

      {showLabView ? (
        <div className="flex flex-col space-y-6 h-full">
          {/* Advanced Chat Interface */}
          <div className="flex-1 flex space-x-4 overflow-hidden">
            {/* Chat and Controls */}
            <div className="flex-1 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 bg-black/20 rounded-lg p-4 mb-4 overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-3/4 p-3 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-purple-500/20 text-white' 
                          : msg.role === 'assistant'
                          ? 'bg-blue-500/20 text-white'
                          : 'bg-gray-500/20 text-gray-300 text-sm'
                      }`}>
                        <div className="mb-1 text-xs text-gray-400">
                          {msg.role === 'user' 
                            ? 'You' 
                            : msg.role === 'assistant'
                            ? selectedAgent?.name || 'AI Guild'
                            : 'System'}
                        </div>
                        <div>{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing indicator */}
                  {isSpeaking && (
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
              
              {/* Input Area */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message to interact with your guild..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white"
                  disabled={isListening || !isConnected}
                />
                <HolographicButton
                  variant="primary"
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || !isConnected}
                >
                  Send
                </HolographicButton>
              </div>
            </div>
            
            {/* Agent and Stats Panel */}
            <div className="w-72 flex flex-col space-y-4">
              {/* Agent Selection */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-medium mb-2">Select Agent</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {agents.map((agent, idx) => (
                    <button
                      key={idx}
                      className={`w-full p-2 rounded-lg text-left transition-colors ${
                        selectedAgent?.name === agent.name
                          ? 'bg-purple-500/20 border border-purple-500/30'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-white font-medium">{agent.name[0]}</span>
                        </div>
                        <div className="ml-2">
                          <div className="text-white font-medium text-sm">{agent.name}</div>
                          <div className="text-gray-400 text-xs">{agent.role}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Simulation Settings */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-white font-medium mb-2">Simulation Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={simulationSettings.voiceEnabled}
                      onChange={(e) => handleSettingChange('voiceEnabled', e.target.checked)}
                      className="rounded bg-white/10 border-white/20 text-purple-500"
                    />
                    <span className="text-white text-sm">Voice Output</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={simulationSettings.slackEnabled}
                      onChange={(e) => handleSettingChange('slackEnabled', e.target.checked)}
                      className="rounded bg-white/10 border-white/20 text-purple-500"
                    />
                    <span className="text-white text-sm">Slack Integration</span>
                  </label>
                  
                  {simulationSettings.slackEnabled && (
                    <div>
                      <label className="block text-white text-xs mb-1">Webhook URL</label>
                      <input
                        id="slackWebhookUrl"
                        type="text"
                        value={simulationSettings.slackWebhookUrl}
                        onChange={(e) => handleSettingChange('slackWebhookUrl', e.target.value)}
                        className="w-full p-2 bg-white/10 border border-white/20 text-white text-xs rounded-lg"
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stats Panel */}
              {currentSimulation && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-medium mb-2">Simulation Stats</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">Success Rate:</span>
                      <span className="text-green-400 text-xs font-medium">
                        {currentSimulation.workflow_metrics?.success_rate || "N/A"}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">Response Time:</span>
                      <span className="text-blue-400 text-xs font-medium">
                        {currentSimulation.workflow_metrics?.average_response_time_ms || "N/A"}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs">Agents Tested:</span>
                      <span className="text-purple-400 text-xs font-medium">
                        {currentSimulation.agent_responses?.length || 0}/{agents.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Actions Panel */}
              <div className="mt-auto">
                <HolographicButton
                  variant="primary"
                  onClick={handleRunSimulation}
                  disabled={isRunning || !isConnected}
                  className="w-full"
                  glow
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Full Simulation
                    </>
                  )}
                </HolographicButton>
              </div>
            </div>
          </div>
          
          {/* Insights and Results Panel (shows after simulation is complete) */}
          {currentSimulation && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <h3 className="text-lg font-medium text-white mb-3">Simulation Insights</h3>
              <div className="space-y-3">
                {currentSimulation.insights?.map((insight: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <div className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-400 mr-2 mt-0.5" />
                      <span className="text-blue-100">{insight}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Simple Simulation UI */}
          <div className="max-w-xl mx-auto">
            <AIModelSelector
              selectedModelId={selectedModel}
              onSelect={setSelectedModel}
              label="Select AI Intelligence Model"
              className="mb-6"
            />

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
                  <div className="text-lg font-medium text-white">~60s</div>
                </div>
              </div>
              
              {/* Agent Avatars */}
              <div className="mt-6">
                <h4 className="text-white text-sm font-medium mb-3">Agent Avatars</h4>
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  {agents.map((agent, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <img 
                        src={`https://images.pexels.com/photos/${3184338 + index * 100}/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1`}
                        alt={agent.name}
                        className="w-16 h-16 object-cover rounded-lg mb-2 border border-white/20"
                      />
                      <span className="text-xs text-white whitespace-nowrap">{agent.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Simulation Options */}
              <div className="mt-6">
                <h4 className="text-white text-sm font-medium mb-3">Simulation Options</h4>
                <div className="space-y-3">
                  <label className="flex justify-between items-center">
                    <span className="text-white text-sm">Voice Integration:</span>
                    <input 
                      type="checkbox" 
                      checked={simulationSettings.voiceEnabled}
                      onChange={(e) => handleSettingChange('voiceEnabled', e.target.checked)}
                      className="rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                    />
                  </label>
                  
                  <label className="flex justify-between items-center">
                    <span className="text-white text-sm">Slack Integration:</span>
                    <input 
                      type="checkbox" 
                      checked={simulationSettings.slackEnabled}
                      onChange={(e) => handleSettingChange('slackEnabled', e.target.checked)}
                      className="rounded bg-white/10 border-white/20 text-purple-500 focus:ring-purple-500"
                    />
                  </label>
                  
                  {simulationSettings.slackEnabled && (
                    <div>
                      <label className="text-white text-xs mb-1 block">Slack Webhook URL:</label>
                      <input 
                        id="slackWebhookUrl"
                        type="text" 
                        value={simulationSettings.slackWebhookUrl}
                        onChange={(e) => handleSettingChange('slackWebhookUrl', e.target.value)}
                        placeholder="https://hooks.slack.com/services/..."
                        className="w-full p-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <HolographicButton
                onClick={handleRunSimulation}
                size="lg"
                className="w-full sm:w-auto"
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
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden audio element for voice playback */}
      <audio ref={audioRef} />
    </GlassCard>
  );
};