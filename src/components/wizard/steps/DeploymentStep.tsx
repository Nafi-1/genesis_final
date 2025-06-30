import React, { useEffect } from 'react';
import { CheckCircle, Sparkles, ArrowRight, Bot, Workflow, Brain, Rocket, MessageSquare, Shield, BarChart } from 'lucide-react';
import { useWizardStore } from '../../../stores/wizardStore';
import { GuildDeploymentPanel } from '../../deployment/GuildDeploymentPanel';
import { DeploymentMonitor } from '../../deployment/DeploymentMonitor';
import { ChannelDeployment } from '../../deployment/ChannelDeployment';
import { ChannelMonitor } from '../../deployment/ChannelMonitor';
import { GlassCard } from '../../ui/GlassCard';
import { HolographicButton } from '../../ui/HolographicButton';
import { useState } from 'react';

export const DeploymentStep: React.FC = () => {
  const { 
    blueprint, 
    simulationResults,
    deploymentId,
    isLoading,
    deployGuild,
    reset,
    errors 
  } = useWizardStore();

  const [localErrors, setLocalErrors] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'deploy' | 'monitor' | 'channels' | 'analytics'>('deploy');
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null);

  useEffect(() => {
    // Only deploy if we have simulation results and haven't deployed yet
    if (simulationResults && !deploymentId && !isLoading) {
      deployGuild();
    }
  }, [simulationResults, deploymentId, isLoading, deployGuild]);

  // Handle successful deployment
  const handleDeploymentSuccess = (deploymentId: string) => {
    console.log('✅ Guild deployed successfully:', deploymentId);
    // You could store the deploymentId in the wizardStore if needed
    
    // Store the deployment ID in localStorage for persistence
    try {
      localStorage.setItem('last_deployment_id', deploymentId);
    } catch (e) {
      console.warn('Failed to save deployment ID to localStorage:', e);
    }
  };

  // Handle deployment error
  const handleDeploymentError = (errorMessage: string) => {
    console.error('❌ Guild deployment failed:', errorMessage);
    setLocalErrors([errorMessage]);
  };

  const handleGoToDashboard = () => {
    reset();
    // In a real app, this would navigate to the dashboard
    window.location.href = '/dashboard';
  };

  const handleCreateAnother = () => {
    reset();
  };

  const isDeploying = isLoading || (!deploymentId && simulationResults);
  const isDeployed = deploymentId && !isLoading;

  // Handle channel configuration
  const handleChannelConfig = () => {
    setActiveView('channels');
  };

  // Handle deployment status change
  const handleDeploymentStatusChange = (status: any) => {
    setDeploymentStatus(status);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {isDeploying ? 'Deploying Your Guild...' : 'Guild Deployed Successfully!'}
          </h1>
          <p className="text-lg text-gray-600">
            {isDeploying 
              ? 'Setting up your AI-native infrastructure with intelligent agents'
              : 'Your autonomous digital workspace is live and ready for action'
            }
          </p>
        </div>

        {/* Tab Switcher (only shown when deployed) */}
        {isDeployed && (
          <div className="mb-6 flex justify-center">
            <div className="flex items-center space-x-2 bg-white/10 p-1 rounded-lg">
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'deploy' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveView('deploy')}
              >
                <div className="flex items-center">
                  <Rocket className="w-4 h-4 mr-2" />
                  Overview
                </div>
              </button>
              
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'monitor' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveView('monitor')}
              >
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Monitoring
                </div>
              </button>
              
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'channels' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveView('channels')}
              >
                <div className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Channels
                </div>
              </button>
              
              <button
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === 'analytics' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setActiveView('analytics')}
              >
                <div className="flex items-center">
                  <BarChart className="w-4 h-4 mr-2" />
                  Analytics
                </div>
              </button>
            </div>
          </div>
        )}
        
        {(errors.length > 0 || localErrors.length > 0) && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-6">
            {errors.concat(localErrors).join(', ')}
          </div>
        )}

        {isDeploying ? (
          blueprint ? (
            <GlassCard variant="medium" className="p-6">
              <GuildDeploymentPanel 
                blueprint={blueprint}
                onSuccess={handleDeploymentSuccess}
                onError={handleDeploymentError}
              />
            </GlassCard>
          ) : null
        ) : isDeployed ? (
          <div className="space-y-8">
            {activeView === 'deploy' && (
              <GlassCard variant="medium" className="p-6">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mr-4">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold">
                    {blueprint?.suggested_structure.guild_name}
                  </h2>
                  <p className="text-gray-300">
                    Guild ID: {deploymentId}
                  </p>
                </div>
              </div>
              </GlassCard>
            )}

            {activeView === 'monitor' && deploymentId && (
              <DeploymentMonitor 
                deploymentId={deploymentId}
                onStatusChange={handleDeploymentStatusChange}
                onChannelConfig={() => setActiveView('channels')}
              />
            )}
            
            {activeView === 'channels' && deploymentId && (
              <ChannelDeployment
                guildId={deploymentId}
                guildName={blueprint?.suggested_structure.guild_name || 'AI Guild'}
                onDeploymentComplete={(result) => {
                  console.log('Channel deployment complete:', result);
                  setActiveView('monitor');
                }}
              />
            )}
            
            {activeView === 'analytics' && deploymentId && (
              <div>
              <ChannelMonitor
                guildId={deploymentId}
                channelId={undefined}
              />
            </div>
          )}

            <div className="flex justify-center space-x-4">
              <HolographicButton 
                variant="outline" 
                onClick={handleCreateAnother}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Another Guild
              </HolographicButton>
              
              <HolographicButton 
                onClick={handleGoToDashboard} 
                size="lg" 
                glow
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </HolographicButton>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};