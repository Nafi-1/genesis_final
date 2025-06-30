import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessagesSquare,
  Mail, 
  Globe, 
  Check,
  Copy,
  Rocket,
  Code
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { deploymentService, Channel } from '../../services/deploymentService';
import { MultiChannelConfigForm } from './MultiChannelConfigForm';

// Import the ChannelIntegration component
import { ChannelIntegration } from './ChannelIntegration';

interface ChannelDeploymentProps {
  guildId: string;
  guildName: string;
  onDeploymentComplete?: (result: any) => void;
}

export const ChannelDeployment: React.FC<ChannelDeploymentProps> = ({
  guildId,
  guildName,
  onDeploymentComplete
}) => {  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'deploy' | 'manage'>('config');

  const getInitialChannels = () => {
    // Load saved channels from local storage if available
    try {
      const savedChannels = localStorage.getItem(`guild_${guildId}_channels`);
      if (savedChannels) {
        const parsedChannels = JSON.parse(savedChannels);
        return parsedChannels;
      }
    } catch (error) {
      console.error('Failed to load saved channels:', error);
    }

    // Default channel configuration
    return [{
      type: 'web',
      name: 'Web Widget',
      config: {
        position: 'bottom-right',
        theme: 'light',
        greeting: `Welcome! How can ${guildName} help you today?`
      }
    }];
  };

  // Handle saving channel configuration
  const handleSaveChannels = (channels: any[]) => {
    setActiveTab('deploy');
    handleDeployChannels(channels);
  };
  
  // Deploy channels to the backend
  const handleDeployChannels = async (channels: Channel[]) => {
    if (channels.length === 0) {
      setError('Please add at least one channel to deploy');
      return;
    }
    
    setIsDeploying(true);
    setError(null);
    
    try {
      const result = await deploymentService.createChannelDeployment(guildId, channels);
      setDeploymentResult(result);
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem(`guild_${guildId}_channels`, JSON.stringify(channels));
      } catch (e) {
        console.warn('Failed to save channels to localStorage:', e);
      }
      
      if (onDeploymentComplete) {
        onDeploymentComplete(result);
      }
    } catch (error: any) {
      console.error('Channel deployment failed:', error);
      setError(error.message || 'Failed to deploy channels');
    } finally {
      setIsDeploying(false);
    }
  };
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        alert('Code copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };
  
  // Get web widget installation code
  const getWebWidgetCode = () => {
    const widgetConfig = {
      guildId,
      theme: 'light',
      position: 'bottom-right',
      greeting: `Welcome! How can ${guildName} help you?`
    };
    
    return `<script>
  (function(d, t) {
    var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
    g.src = "https://cdn.genesisOS.ai/widget.js";
    g.defer = true;
    g.async = true;
    g.onload = function() {
      window.GenesisWidget.init(${JSON.stringify(widgetConfig, null, 2)});
    };
    s.parentNode.insertBefore(g, s);
  })(document, 'script');
</script>`;
  };
  
  return (
    <GlassCard variant="medium" className="p-6">
      {/* Tab navigation */}
      <div className="mb-6">
        <div className="flex border-b border-white/10">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'config' 
                ? 'text-white border-b-2 border-purple-500' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('config')}
          >
            Configure
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'deploy' 
                ? 'text-white border-b-2 border-purple-500' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('deploy')}
          >
            Deploy
          </button>
          {deploymentResult && (
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'manage' 
                  ? 'text-white border-b-2 border-purple-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('manage')}
            >
              Manage
            </button>
          )}
        </div>
      </div>

      {activeTab === 'config' ? (
        <MultiChannelConfigForm
          guildId={guildId}
          guildName={guildName}
          initialChannels={getInitialChannels()}
          onSave={handleSaveChannels}
          onCancel={() => {
            if (onDeploymentComplete) {
              onDeploymentComplete(null);
            }
          }}
        />
      ) : activeTab === 'deploy' ? (
        <>
          {isDeploying && (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Rocket className="w-8 h-8 text-blue-400 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Deploying Channels</h3>
                <p className="text-gray-300">
                  Setting up your channel integrations across platforms...
                </p>
              </div>
            </div>
          )}
          
          {/* Deployment Results */}
          {deploymentResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-white/5 p-4 rounded-lg border border-white/10"
            >
              <div className="flex items-center justify-center mb-4">
                <Check className="w-5 h-5 text-green-400 mr-2" />
                <h3 className="text-white font-medium flex items-center">
                  Deployment Complete
                </h3>
              </div>
              
              <div className="space-y-3">
                {deploymentResult.channels?.map((channel: any, index: number) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/10 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        {channel.type === 'web' && <Globe className="w-5 h-5 text-blue-400" />}
                        {channel.type === 'slack' && <MessagesSquare className="w-5 h-5 text-purple-400" />}
                        {channel.type === 'email' && <Mail className="w-5 h-5 text-green-400" />}
                        {channel.type === 'api' && <Code className="w-5 h-5 text-orange-400" />}
                        {channel.type === 'discord' && <MessagesSquare className="w-5 h-5 text-indigo-400" />}
                        
                        <div>
                          <div className="text-white">{channel.name}</div>
                          <div className="text-xs text-gray-400">Status: {channel.status}</div>
                        </div>
                      </div>
                    </div>
                    
                    {channel.url && (
                      <HolographicButton
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(channel.url, '_blank')}
                      >
                        <Globe className="w-4 h-4" />
                      </HolographicButton>
                    )}
                  </div>
                ))}
              </div>

              {/* Return to config button */}
              <div className="mt-6 text-center">
                <HolographicButton
                  variant="ghost"
                  onClick={() => {
                    setActiveTab('config');
                  }}
                >
                  Back to Configuration
                </HolographicButton>
                {deploymentResult && (
                  <HolographicButton
                    variant="outline"
                    className="ml-3"
                    onClick={() => {
                      setActiveTab('manage');
                    }}
                  >
                    Manage Channels
                  </HolographicButton>
                )}
              </div>
            </motion.div>
          )}
        </>
      ) : (
        /* Manage tab content */
        <ChannelIntegration 
          guildId={guildId}
          guildName={guildName}
          channels={deploymentResult?.channels || []}
        />
      )}
      
      {activeTab === 'manage' && (
        <div className="mt-6 text-center">
          <HolographicButton
            variant="outline"
            onClick={() => {
              setActiveTab('config');
            }}
          >
            Edit Channel Configuration
          </HolographicButton>
        </div>
      )}
    </GlassCard>
  );
};