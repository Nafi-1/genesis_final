import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  MessageSquare, 
  Mail, 
  Settings, 
  Code, 
  X, 
  Plus, 
  Save, 
  ExternalLink, 
  AlertTriangle,
  Check,
  Trash2
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { Channel } from '../../services/deploymentService';

export interface ChannelConfig extends Channel {
  id?: string;
}

interface MultiChannelConfigFormProps {
  initialChannels?: ChannelConfig[];
  onSave: (channels: ChannelConfig[]) => void;
  onCancel: () => void;
  guildId: string;
  guildName: string;
}

interface EditableChannelConfig extends ChannelConfig {
  index?: number;
}

export const MultiChannelConfigForm: React.FC<MultiChannelConfigFormProps> = ({
  initialChannels = [],
  onSave,
  onCancel,
  guildId,
  guildName
}) => {
  const [channels, setChannels] = useState<ChannelConfig[]>(initialChannels);
  const [currentChannel, setCurrentChannel] = useState<EditableChannelConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Channel type options
  const channelTypes = [
    { id: 'web', name: 'Web Widget', icon: Globe, description: 'Embed on your website' },
    { id: 'slack', name: 'Slack', icon: MessageSquare, description: 'Connect to Slack workspace' },
    { id: 'email', name: 'Email', icon: Mail, description: 'Email integration' },
    { id: 'api', name: 'API', icon: Code, description: 'REST API access' },
    { id: 'discord', name: 'Discord', icon: MessageSquare, description: 'Discord bot integration' }
  ];
  
  // Initialize with a web channel if none exist
  useEffect(() => {
    if (channels.length === 0) {
      const defaultWebChannel: ChannelConfig = {
        type: 'web',
        name: 'Web Widget',
        config: {
          position: 'bottom-right',
          theme: 'light',
          greeting: `Welcome! How can ${guildName} help you today?`
        }
      };
      
      setChannels([defaultWebChannel]);
    }
  }, []);
  
  // Add a new channel
  const handleAddChannel = () => {
    setCurrentChannel({
      type: 'web',
      name: 'New Channel',
      config: {}
    });
    setIsEditing(true);
    setErrors({});
  };
  
  // Edit an existing channel
  const handleEditChannel = (channel: ChannelConfig, index: number) => {
    setCurrentChannel({ ...channel, index });
    setIsEditing(true);
    setErrors({});
  };
  
  // Remove a channel
  const handleRemoveChannel = (index: number) => {
    const updatedChannels = [...channels];
    updatedChannels.splice(index, 1);
    setChannels(updatedChannels);
  };
  
  // Save the current channel
  const handleSaveChannel = () => {
    if (!currentChannel) return;
    
    // Validate channel data
    const validationErrors: Record<string, string> = {};
    
    if (!currentChannel.name.trim()) {
      validationErrors.name = 'Channel name is required';
    }
    
    if (currentChannel.type === 'slack' && (!currentChannel.config.webhookUrl || !currentChannel.config.webhookUrl.startsWith('https://hooks.slack.com/'))) {
      validationErrors.webhookUrl = 'Valid Slack webhook URL is required';
    }
    
    if (currentChannel.type === 'email' && (!currentChannel.config.email || !currentChannel.config.email.includes('@'))) {
      validationErrors.email = 'Valid email address is required';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    if ('index' in currentChannel) {
      // Update existing channel
      const updatedChannels = [...channels];
      const index = currentChannel.index as number;
      delete currentChannel.index;
      updatedChannels[index] = currentChannel;
      setChannels(updatedChannels);
    } else {
      // Add new channel
      setChannels([...channels, currentChannel]);
    }
    
    setCurrentChannel(null);
    setIsEditing(false);
    setErrors({});
  };
  
  // Handle input changes for the current channel
  const handleInputChange = (key: string, value: any) => {
    if (!currentChannel) return;
    
    setCurrentChannel({
      ...currentChannel,
      [key]: value
    });
  };
  
  // Handle config changes for the current channel
  const handleConfigChange = (key: string, value: any) => {
    if (!currentChannel) return;
    
    setCurrentChannel({
      ...currentChannel,
      config: {
        ...currentChannel.config,
        [key]: value
      }
    });
  };
  
  // Get channel type label
  const getChannelTypeLabel = (type: string) => {
    const channelType = channelTypes.find(t => t.id === type);
    return channelType ? channelType.name : 'Unknown Type';
  };
  
  // Get channel icon component
  const getChannelIcon = (type: string) => {
    const channelType = channelTypes.find(t => t.id === type);
    return channelType ? channelType.icon : Settings;
  };
  
  // Render channel config form based on type
  const renderChannelConfigForm = () => {
    if (!currentChannel) return null;
    
    const ChannelIcon = getChannelIcon(currentChannel.type);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
            <ChannelIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">
              {isEditing && 'index' in currentChannel ? 'Edit Channel' : 'Add New Channel'}
            </h3>
            <p className="text-sm text-gray-300">
              Configure channel settings for {getChannelTypeLabel(currentChannel.type)}
            </p>
          </div>
        </div>
        
        {/* Common fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Channel Type</label>
            <select
              value={currentChannel.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {channelTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-1">Channel Name</label>
            <input
              type="text"
              value={currentChannel.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full p-3 bg-white/10 border ${
                errors.name ? 'border-red-500/50' : 'border-white/20'
              } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="My Channel"
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name}</p>
            )}
          </div>
          
          {/* Channel-specific fields */}
          {currentChannel.type === 'web' && (
            <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Widget Position</label>
                <select
                  value={currentChannel.config.position || 'bottom-right'}
                  onChange={(e) => handleConfigChange('position', e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Theme</label>
                <select
                  value={currentChannel.config.theme || 'light'}
                  onChange={(e) => handleConfigChange('theme', e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Greeting Message</label>
                <textarea
                  value={currentChannel.config.greeting || `Welcome! How can ${guildName} help you today?`}
                  onChange={(e) => handleConfigChange('greeting', e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter greeting message"
                />
              </div>
            </div>
          )}
          
          {currentChannel.type === 'slack' && (
            <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Webhook URL</label>
                <input
                  type="text"
                  value={currentChannel.config.webhookUrl || ''}
                  onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
                  className={`w-full p-3 bg-white/10 border ${
                    errors.webhookUrl ? 'border-red-500/50' : 'border-white/20'
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="https://hooks.slack.com/services/..."
                />
                {errors.webhookUrl && (
                  <p className="text-red-400 text-xs mt-1">{errors.webhookUrl}</p>
                )}
                
                <div className="mt-2 flex items-center text-xs text-blue-300">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Learn how to create a Slack webhook
                  </a>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Default Channel</label>
                <input
                  type="text"
                  value={currentChannel.config.channel || '#general'}
                  onChange={(e) => handleConfigChange('channel', e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#channel-name"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Bot Name</label>
                <input
                  type="text"
                  value={currentChannel.config.botName || guildName}
                  onChange={(e) => handleConfigChange('botName', e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Bot Name"
                />
              </div>
            </div>
          )}
          
          {currentChannel.type === 'email' && (
            <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={currentChannel.config.email || ''}
                  onChange={(e) => handleConfigChange('email', e.target.value)}
                  className={`w-full p-3 bg-white/10 border ${
                    errors.email ? 'border-red-500/50' : 'border-white/20'
                  } rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="guild@yourdomain.com"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email Signature</label>
                <textarea
                  value={currentChannel.config.signature || `Best regards,\n${guildName}`}
                  onChange={(e) => handleConfigChange('signature', e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Email signature"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Reply To</label>
                <input
                  type="email"
                  value={currentChannel.config.replyTo || ''}
                  onChange={(e) => handleConfigChange('replyTo', e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="replies@yourdomain.com"
                />
              </div>
            </div>
          )}
          
          {currentChannel.type === 'api' && (
            <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Authentication Type</label>
                <select
                  value={currentChannel.config.authType || 'api_key'}
                  onChange={(e) => handleConfigChange('authType', e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="api_key">API Key</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="none">None</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Rate Limit (requests per minute)</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={currentChannel.config.rateLimit || 60}
                  onChange={(e) => handleConfigChange('rateLimit', parseInt(e.target.value))}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                <h4 className="text-blue-300 text-sm font-medium mb-2 flex items-center">
                  <Code className="w-4 h-4 mr-2" />
                  API Endpoint URL
                </h4>
                <p className="text-blue-100 text-sm font-mono break-all">
                  https://api.genesisOS.ai/v1/guilds/{guildId}
                </p>
                <p className="text-xs text-blue-300 mt-2">
                  Your API key will be generated when you save this configuration
                </p>
              </div>
            </div>
          )}
          
          {currentChannel.type === 'discord' && (
            <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Bot Token</label>
                <input
                  type="password"
                  value={currentChannel.config.botToken || ''}
                  onChange={(e) => handleConfigChange('botToken', e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Discord bot token"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-1">Default Channel</label>
                <input
                  type="text"
                  value={currentChannel.config.defaultChannel || 'general'}
                  onChange={(e) => handleConfigChange('defaultChannel', e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="general"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="publicCommands"
                  checked={currentChannel.config.publicCommands || false}
                  onChange={(e) => handleConfigChange('publicCommands', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="publicCommands" className="text-sm text-gray-300">
                  Enable public commands (anyone can interact)
                </label>
              </div>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
          <HolographicButton
            variant="ghost"
            onClick={() => {
              setCurrentChannel(null);
              setIsEditing(false);
              setErrors({});
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </HolographicButton>
          
          <HolographicButton
            onClick={handleSaveChannel}
            glow
          >
            <Save className="w-4 h-4 mr-2" />
            Save Channel
          </HolographicButton>
        </div>
      </div>
    );
  };
  
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Multi-Channel Deployment</h2>
            <p className="text-gray-300">Configure and deploy your AI guild across multiple channels</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isEditing && (
            <HolographicButton
              onClick={handleAddChannel}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Channel
            </HolographicButton>
          )}
        </div>
      </div>
      
      {isEditing ? (
        renderChannelConfigForm()
      ) : (
        <>
          {/* Channel list */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-medium text-white mb-2">Configured Channels</h3>
            
            {channels.length === 0 ? (
              <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg">
                <Globe className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h4 className="text-xl font-medium text-white mb-2">No Channels Configured</h4>
                <p className="text-gray-300 max-w-md mx-auto mb-6">
                  Add channels to deploy your AI guild across multiple platforms
                </p>
                <HolographicButton
                  onClick={handleAddChannel}
                  glow
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Channel
                </HolographicButton>
              </div>
            ) : (
              <div className="space-y-3">
                {channels.map((channel, index) => {
                  const ChannelIcon = getChannelIcon(channel.type);
                  
                  return (
                    <div 
                      key={index} 
                      className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                            <ChannelIcon className="w-5 h-5 text-white" />
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-white">{channel.name}</h4>
                            <div className="text-sm text-gray-400">
                              {getChannelTypeLabel(channel.type)}
                              {channel.type === 'web' && channel.config.position && (
                                <span> • {channel.config.position}</span>
                              )}
                              {channel.type === 'slack' && channel.config.channel && (
                                <span> • {channel.config.channel}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <HolographicButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditChannel(channel, index)}
                          >
                            <Settings className="w-4 h-4" />
                          </HolographicButton>
                          
                          <HolographicButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveChannel(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </HolographicButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <motion.div
                  className="mt-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={handleAddChannel}
                    className="w-full p-3 border border-dashed border-purple-500/50 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Channel
                  </button>
                </motion.div>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-between space-x-4 border-t border-white/10 pt-6">
            <HolographicButton 
              variant="ghost" 
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </HolographicButton>
            
            <HolographicButton
              onClick={() => onSave(channels)}
              disabled={channels.length === 0}
              glow
            >
              <Check className="w-4 h-4 mr-2" />
              Save Channels
            </HolographicButton>
          </div>
        </>
      )}
    </>
  );
};