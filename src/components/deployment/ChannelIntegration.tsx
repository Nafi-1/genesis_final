import React, { useState, useEffect } from 'react';
import { 
  Webhook, 
  MessageSquare, 
  Mail, 
  Globe, 
  Database, 
  Code, 
  Copy, 
  CheckCircle, 
  Link, 
  ArrowRight, 
  Check,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

interface ChannelIntegrationProps {
  guildId: string;
  guildName: string;
  channels: any[];
  onStatusUpdate?: (status: any) => void;
  className?: string;
}

export const ChannelIntegration: React.FC<ChannelIntegrationProps> = ({
  guildId,
  guildName,
  channels = [],
  onStatusUpdate,
  className = ''
}) => {
  const [selectedChannelType, setSelectedChannelType] = useState<'web' | 'slack' | 'email' | 'api' | 'all'>('all');
  const [integrationInProgress, setIntegrationInProgress] = useState<string | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    // Initialize integration status for all channels
    const initialStatus: Record<string, 'pending' | 'success' | 'error'> = {};
    channels.forEach(channel => {
      initialStatus[channel.id] = 'pending';
    });
    setIntegrationStatus(initialStatus);
  }, [channels]);

  // Filter channels based on selected type
  const filteredChannels = selectedChannelType === 'all' 
    ? channels 
    : channels.filter(channel => channel.type === selectedChannelType);

  // Test connection for a channel
  const testConnection = async (channelId: string) => {
    setIntegrationInProgress(channelId);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 90% success rate for testing
      if (Math.random() < 0.9) {
        setIntegrationStatus(prev => ({ ...prev, [channelId]: 'success' }));
      } else {
        setIntegrationStatus(prev => ({ ...prev, [channelId]: 'error' }));
      }
    } catch (error) {
      setIntegrationStatus(prev => ({ ...prev, [channelId]: 'error' }));
    } finally {
      setIntegrationInProgress(null);
    }
  };

  // Copy integration code to clipboard
  const copyCode = (code: string, channelId: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(channelId);
      setTimeout(() => setCopiedCode(null), 3000);
    });
  };

  // Get integration code based on channel type
  const getIntegrationCode = (channel: any) => {
    switch (channel.type) {
      case 'web':
        return `<script>
  (function(d, t) {
    var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
    g.src = "https://cdn.genesisOS.ai/widget.js";
    g.defer = true; g.async = true;
    g.onload = function() {
      window.GenesisWidget.init({
        guildId: "${guildId}",
        theme: "${channel.config.theme || 'light'}",
        position: "${channel.config.position || 'bottom-right'}"
      });
    };
    s.parentNode.insertBefore(g, s);
  })(document, 'script');
</script>`;
      
      case 'api':
        return `curl -X POST "https://api.genesisOS.ai/v1/guilds/${guildId}/chat" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"message": "Hello, I need assistance with..."}'`;
      
      case 'slack':
        return `/invite @${guildName.replace(/\s+/g, '')} to this channel`;
      
      default:
        return `# No integration code available for this channel type`;
    }
  };

  // Get status badge
  const getStatusBadge = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return (
          <div className="flex items-center px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            <span>Connected</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span>Error</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
            <RefreshCw className="w-3 h-3 mr-1" />
            <span>Pending</span>
          </div>
        );
    }
  };

  return (
    <GlassCard variant="medium" className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2 flex items-center">
            <Link className="w-5 h-5 text-blue-400 mr-2" />
            Channel Integrations
          </h2>
          <p className="text-gray-300">
            Connect your AI guild to your digital workspace
          </p>
        </div>
        
        <div className="flex flex-wrap gap-1">
          <HolographicButton
            variant={selectedChannelType === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedChannelType('all')}
          >
            All
          </HolographicButton>
          
          <HolographicButton
            variant={selectedChannelType === 'web' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedChannelType('web')}
          >
            <Globe className="w-4 h-4" />
          </HolographicButton>
          
          <HolographicButton
            variant={selectedChannelType === 'slack' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedChannelType('slack')}
          >
            <MessageSquare className="w-4 h-4" />
          </HolographicButton>
          
          <HolographicButton
            variant={selectedChannelType === 'email' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedChannelType('email')}
          >
            <Mail className="w-4 h-4" />
          </HolographicButton>
          
          <HolographicButton
            variant={selectedChannelType === 'api' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedChannelType('api')}
          >
            <Code className="w-4 h-4" />
          </HolographicButton>
        </div>
      </div>
      
      <div className="space-y-6">
        {filteredChannels.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg">
            <Webhook className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Channels Found</h3>
            <p className="text-gray-300 mb-6">
              {selectedChannelType === 'all' ? 
                'No channels have been configured yet.' : 
                `No ${selectedChannelType} channels have been configured.`}
            </p>
          </div>
        ) : (
          <>
            {filteredChannels.map(channel => (
              <div
                key={channel.id}
                className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {channel.type === 'web' && <Globe className="w-5 h-5 text-blue-400" />}
                      {channel.type === 'slack' && <MessageSquare className="w-5 h-5 text-purple-400" />}
                      {channel.type === 'email' && <Mail className="w-5 h-5 text-green-400" />}
                      {channel.type === 'api' && <Code className="w-5 h-5 text-orange-400" />}
                      
                      <div>
                        <h3 className="text-white font-medium">{channel.name}</h3>
                        <p className="text-xs text-gray-400">
                          {channel.type === 'web' ? 'Web Widget' : 
                           channel.type === 'slack' ? 'Slack Integration' :
                           channel.type === 'email' ? 'Email Channel' :
                           channel.type === 'api' ? 'API Access' : 'Integration'}
                        </p>
                      </div>
                    </div>
                    
                    {getStatusBadge(integrationStatus[channel.id])}
                  </div>
                  
                  {/* Integration details */}
                  {['web', 'api', 'slack'].includes(channel.type) && (
                    <div className="mb-4">
                      <h4 className="text-sm text-white font-medium mb-2">Integration Code</h4>
                      <div className="bg-black/30 p-3 rounded-lg overflow-auto">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-xs text-gray-400">{channel.type === 'web' ? 'HTML' : channel.type === 'api' ? 'cURL' : 'Slack Command'}</div>
                          <button 
                            className="text-blue-400 hover:text-blue-300 text-xs flex items-center"
                            onClick={() => copyCode(getIntegrationCode(channel), channel.id)}
                          >
                            {copiedCode === channel.id ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                          {getIntegrationCode(channel)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {/* Channel-specific details */}
                  {channel.type === 'web' && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/10 p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Position</div>
                        <div className="text-sm text-white capitalize">{channel.config.position || 'bottom-right'}</div>
                      </div>
                      
                      <div className="bg-white/10 p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Theme</div>
                        <div className="text-sm text-white capitalize">{channel.config.theme || 'light'}</div>
                      </div>
                    </div>
                  )}
                  
                  {channel.type === 'slack' && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/10 p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Default Channel</div>
                        <div className="text-sm text-white">{channel.config.channel || '#general'}</div>
                      </div>
                      
                      <div className="bg-white/10 p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Bot Name</div>
                        <div className="text-sm text-white">{channel.config.botName || guildName}</div>
                      </div>
                    </div>
                  )}
                  
                  {channel.type === 'email' && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/10 p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Email Address</div>
                        <div className="text-sm text-white break-all">{channel.config.email || `guild-${guildId.substring(0, 8)}@genesisOS.ai`}</div>
                      </div>
                      
                      <div className="bg-white/10 p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Reply To</div>
                        <div className="text-sm text-white break-all">{channel.config.replyTo || channel.config.email || 'Not configured'}</div>
                      </div>
                    </div>
                  )}
                  
                  {channel.type === 'api' && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/10 p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Auth Type</div>
                        <div className="text-sm text-white capitalize">{channel.config.authType || 'api_key'}</div>
                      </div>
                      
                      <div className="bg-white/10 p-3 rounded-lg">
                        <div className="text-xs text-gray-400 mb-1">Rate Limit</div>
                        <div className="text-sm text-white">{channel.config.rateLimit || 60}/min</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex justify-end space-x-2">
                    {channel.url && (
                      <HolographicButton
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(channel.url, '_blank')}
                      >
                        <Globe className="w-4 h-4 mr-1" />
                        Open
                      </HolographicButton>
                    )}
                    
                    <HolographicButton
                      variant="ghost"
                      size="sm"
                      onClick={() => testConnection(channel.id)}
                      disabled={integrationInProgress === channel.id}
                    >
                      {integrationInProgress === channel.id ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Link className="w-4 h-4 mr-1" />
                      )}
                      Test
                    </HolographicButton>
                  </div>
                </div>
                
                {/* Status bar */}
                <div className={`h-1 ${
                  integrationStatus[channel.id] === 'success' ? 'bg-green-500' :
                  integrationStatus[channel.id] === 'error' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}></div>
              </div>
            ))}
          </>
        )}
        
        {/* Helpful Tips */}
        <div className="mt-8 bg-blue-900/20 border border-blue-700/30 p-4 rounded-lg">
          <h3 className="text-blue-300 font-medium mb-2 flex items-center">
            <Database className="w-4 h-4 mr-2" />
            Integration Tips
          </h3>
          
          <ul className="space-y-2 text-blue-200 text-sm">
            <li className="flex items-start">
              <ArrowRight className="w-3 h-3 mr-2 mt-1 flex-shrink-0" />
              <span>For web integration, add the code snippet to your website's &lt;head&gt; section.</span>
            </li>
            <li className="flex items-start">
              <ArrowRight className="w-3 h-3 mr-2 mt-1 flex-shrink-0" />
              <span>For Slack, create a webhook in your Slack workspace admin panel first.</span>
            </li>
            <li className="flex items-start">
              <ArrowRight className="w-3 h-3 mr-2 mt-1 flex-shrink-0" />
              <span>API keys are rotated every 90 days for security. You'll receive email notifications.</span>
            </li>
            <li className="flex items-start">
              <ArrowRight className="w-3 h-3 mr-2 mt-1 flex-shrink-0" />
              <span>Need custom integration? Contact support for assistance with advanced use cases.</span>
            </li>
          </ul>
        </div>
      </div>
    </GlassCard>
  );
};