import React, { useEffect, useState } from 'react';
import { Play, CheckCircle, AlertCircle, ArrowRight, Brain, Zap, Clock, Settings, Cpu, Beaker, RefreshCw, MessageSquare } from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { GlassCard } from '../../ui/GlassCard';
import { SimulationLab } from '../../simulation/SimulationLab';
import { HolographicButton } from '../../ui/HolographicButton';
import { AIModelSelector } from '../../ui/AIModelSelector';
import { Card, CardContent } from '../../ui/Card';

export const SimulationStep: React.FC = () => {
  // Get state from wizard store
  const { 
    blueprint,
    credentials,
    simulationResults,
    isLoading,
    runSimulation,
    setStep,
    errors 
  } = useWizardStore();
  
  // Component state
  const [showDetails, setShowDetails] = useState(false);
  const [showLabView, setShowLabView] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-flash');
  const [simulationSettings, setSimulationSettings] = useState({
    llmChoice: 'gemini_2_flash', // Updated to use Gemini 2.0 Flash
    simulationType: 'comprehensive',
    simulationDuration: 60, // Shorter duration for faster results
    voiceEnabled: false,
    slackEnabled: false,
    slackWebhookUrl: credentials.slack_webhook_url || ''
  });

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

  // When credentials change, update Slack settings
  useEffect(() => {
    if (credentials.slack_webhook_url) {
      setSimulationSettings(prev => ({
        ...prev,
        slackEnabled: true,
        slackWebhookUrl: credentials.slack_webhook_url
      }));
    }
  }, [credentials]);

  const handleSettingChange = (setting: string, value: any) => {
    setSimulationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleRunSimulation = async () => {
    // Pass the simulation settings to the runSimulation function
    try {
      console.log('🧪 Running simulation with settings:', simulationSettings);
      
      // Create enhanced simulation config
      const simulationConfig = {
        blueprint_id: blueprint?.id,
        agents: blueprint?.suggested_structure.agents || [],
        workflows: blueprint?.suggested_structure.workflows || [],
        test_credentials: credentials,
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
      await runSimulation();
    } catch (error) {
      console.error('Simulation failed:', error);
    }
  };

  const handleDeploy = () => {
    setStep('deployment');
  };
  const hasValidCredentials = Object.keys(credentials).length > 0;

  // Extract agents from blueprint for use in JSX
  const agents = blueprint?.suggested_structure.agents || [];
  
  // When the model changes, store it in localStorage for system-wide use
  useEffect(() => {
    localStorage.setItem('preferred_ai_model', selectedModel);
  }, [selectedModel]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-4">
            Guild Simulation Lab
          </h1>
          <p className="text-lg text-gray-300">
            {showLabView ? "Simple View" : "Interactive Lab"}
          </p>
        </div>

        <GlassCard variant="medium" className="p-6 mb-6">
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
            <SimulationLab
              guildId={blueprint?.suggested_structure.guild_name || 'test-guild'}
              agents={blueprint?.suggested_structure.agents || []}
              onResults={(results) => {
                console.log('✅ Simulation completed successfully:', results?.id);
                runSimulation();
                // Store results in local storage as a backup
                try {
                  localStorage.setItem('last_simulation_results', JSON.stringify(results));
                } catch (error) {
                  console.warn('Failed to save simulation results to localStorage:', error);
                }
              }}
            />
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
                  
                  {/* Avatar Examples */}
                  <div className="mt-6">
                    <h4 className="text-white text-sm font-medium mb-3">Agent Avatars</h4>
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                      {blueprint?.suggested_structure.agents.map((agent, index) => (
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

                {errors.length > 0 && (
                  <div className="bg-red-500/20 border border-red-500/30 p-3 rounded-lg text-red-300 mb-6">
                    {errors.join(', ')}
                  </div>
                )}

                <div className="flex justify-center">
                  <HolographicButton
                    onClick={handleRunSimulation}
                    size="lg"
                    className="w-full sm:w-auto"
                    glow
                    disabled={isLoading}
                  >
                    <div className="flex items-center">
                      {isLoading ? (
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
        </GlassCard>

        {simulationResults && (
          <div className="flex justify-center">
            <HolographicButton onClick={handleDeploy} size="lg" glow>
              <Beaker className="w-5 h-5 mr-2" />
              Deploy Live Guild
              <ArrowRight className="w-5 h-5 ml-2" />
            </HolographicButton>
          </div>
        )}
      </div>
    </div>
  );
};