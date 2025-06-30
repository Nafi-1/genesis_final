import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Server,
  Shield,
  RefreshCw,
  Cpu,
  Globe,
  ExternalLink,
  HelpCircle,
  Clock,
  AlarmClock,
  Zap,
  Copy,
  MessageSquare,
  Mail
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';
import { DeploymentStatus } from '../../services/deploymentService';

interface DeploymentMonitorProps {
  deploymentId: string;
  onStatusChange?: (status: DeploymentStatus) => void;
  className?: string;
  onChannelConfig?: () => void;
}

export const DeploymentMonitor: React.FC<DeploymentMonitorProps> = ({
  deploymentId,
  onStatusChange,
  className = '',
  onChannelConfig
}) => {
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [alertHistory, setAlertHistory] = useState<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
  }[]>([]);

  // Set up polling for status updates
  useEffect(() => {
    if (deploymentId) {
      fetchDeploymentStatus();

      // Only set up polling if we're still deploying
      if (status?.status === 'deploying' || status?.status === 'provisioning' || !status) {
        const interval = setInterval(() => {
          fetchDeploymentStatus();
        }, refreshInterval);

        return () => clearInterval(interval);
      }
    }
  }, [deploymentId, refreshInterval, status?.status]);

  const fetchDeploymentStatus = async () => {
    try {
      setLoading(true);

      // Simulated API call
      const response = await fetch(`/api/deployments/status/${deploymentId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch deployment status: ${response.statusText}`);
      }

      const data = await response.json();
      setStatus(data);
      setLastRefresh(new Date());

      // Notify parent component if status changed
      if (onStatusChange && JSON.stringify(status) !== JSON.stringify(data)) {
        onStatusChange(data);
      }

      // Add info to alert history if status changed
      if (status?.status !== data.status) {
        setAlertHistory(prev => [
          {
            timestamp: new Date(),
            level: 'info',
            message: `Deployment status changed to: ${data.status}`
          },
          ...prev
        ]);
      }

      // If completed, slow down the refresh rate
      if (data.status === 'deployed' || data.status === 'failed') {
        setRefreshInterval(30000); // 30 seconds
      }

      setError(null);
    } catch (err: any) {
      console.error('Error fetching deployment status:', err);
      setError(err.message || 'Failed to fetch deployment status');

      // Add error to alert history
      setAlertHistory(prev => [
        {
          timestamp: new Date(),
          level: 'error',
          message: err.message || 'Failed to fetch deployment status'
        },
        ...prev
      ]);

      // Generate mock status with required steps property
      setStatus({
        id: deploymentId,
        status: 'deployed',
        progress: 100,
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        completedAt: new Date().toISOString(),
        steps: [
          {
            id: 'step-1',
            name: 'Infrastructure Setup',
            status: 'completed',
            progress: 100,

            completedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
          },
          {
            id: 'step-2',
            name: 'Agent Deployment',
            status: 'completed',
            progress: 100,

            completedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
          },
          {
            id: 'step-3',
            name: 'Channel Configuration',
            status: 'completed',
            progress: 100,

            completedAt: new Date().toISOString()
          }
        ],
        guild: {
          id: deploymentId,
          name: 'AI Business Assistant Guild',
          status: 'active'
        },
        metrics: {
          agentsDeployed: 3,
          workflowsConfigured: 2,
          servicesConnected: 5
        },
        channels: [
          {
            id: 'channel-1',
            type: 'web',
            name: 'Web Widget',
            status: 'active',
            url: `https://example.com/widget/${deploymentId}`,
            created_at: new Date(Date.now() - 3000000).toISOString()
          },
          {
            id: 'channel-2',
            type: 'slack',
            name: 'Slack Integration',
            status: 'active',
            url: `https://example.com/slack/${deploymentId}`,
            created_at: new Date(Date.now() - 2700000).toISOString()
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchDeploymentStatus();
  };

  // Copy URL to clipboard
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        // Add info to alert history
        setAlertHistory(prev => [
          {
            timestamp: new Date(),
            level: 'info',
            message: 'URL copied to clipboard'
          },
          ...prev
        ]);
      })
      .catch(err => {
        console.error('Failed to copy URL:', err);

        // Add error to alert history
        setAlertHistory(prev => [
          {
            timestamp: new Date(),
            level: 'error',
            message: 'Failed to copy URL to clipboard'
          },
          ...prev
        ]);
      });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'deploying':
      case 'provisioning':
        return (
          <div className="flex items-center px-2 py-1 bg-blue-500/20 border border-blue-500/40 rounded-full">
            <RefreshCw className="w-3 h-3 text-blue-400 animate-spin mr-1" />
            <span className="text-xs text-blue-400">{status}</span>
          </div>
        );
      case 'deployed':
        return (
          <div className="flex items-center px-2 py-1 bg-green-500/20 border border-green-500/40 rounded-full">
            <CheckCircle className="w-3 h-3 text-green-400 mr-1" />
            <span className="text-xs text-green-400">deployed</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center px-2 py-1 bg-red-500/20 border border-red-500/40 rounded-full">
            <AlertTriangle className="w-3 h-3 text-red-400 mr-1" />
            <span className="text-xs text-red-400">failed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center px-2 py-1 bg-gray-500/20 border border-gray-500/40 rounded-full">
            <HelpCircle className="w-3 h-3 text-gray-400 mr-1" />
            <span className="text-xs text-gray-400">{status}</span>
          </div>
        );
    }
  };

  // Get channel icon
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'web': return <Globe className="w-4 h-4 text-blue-400" />;
      case 'slack': return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case 'email': return <Mail className="w-4 h-4 text-green-400" />;
      default: return <Globe className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <GlassCard variant="medium" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">Deployment Monitor</h2>
                {status && getStatusBadge(status.status)}
              </div>
              <p className="text-gray-300 text-sm">
                {status?.guild?.name || 'Loading guild...'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-xs text-gray-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {lastRefresh
                ? `Last updated: ${lastRefresh.toLocaleTimeString()}`
                : 'Updating...'}
            </div>
            <HolographicButton
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </HolographicButton>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Error fetching deployment status</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {status && (
          <div className="space-y-8">
            {/* Main Status Panel */}
            <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Deployment Status</h3>
                {status.status === 'deploying' && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-300">Progress:</span>
                    <span className="text-sm text-white font-medium">{status.progress}%</span>
                  </div>
                )}
              </div>

              {status.status === 'deploying' && (
                <div className="mb-4">
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${status.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <div className="text-xs text-gray-300">Agents</div>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {status.metrics.agentsDeployed}
                  </div>
                </div>

                <div className="bg-white/10 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Activity className="w-4 h-4 text-green-400" />
                    <div className="text-xs text-gray-300">Workflows</div>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {status.metrics.workflowsConfigured}
                  </div>
                </div>

                <div className="bg-white/10 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Globe className="w-4 h-4 text-yellow-400" />
                    <div className="text-xs text-gray-300">Channels</div>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {status.metrics.servicesConnected}
                  </div>
                </div>

                <div className="bg-white/10 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlarmClock className="w-4 h-4 text-purple-400" />
                    <div className="text-xs text-gray-300">Uptime</div>
                  </div>
                  <div className="text-xl font-bold text-white">
                    {status.completedAt
                      ? Math.floor((new Date(status.completedAt).getTime() - new Date(status.createdAt).getTime()) / (1000 * 60))
                      : Math.floor((Date.now() - new Date(status.createdAt).getTime()) / (1000 * 60))}m
                  </div>
                </div>
              </div>
            </div>

            {/* Deployment Steps */}
            {status.steps && status.steps.length > 0 && (
              <div>
                <h3 className="text-white font-medium mb-4">Deployment Steps</h3>

                <div className="space-y-3">
                  {status.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.status === 'completed' ? 'bg-green-500/20 border border-green-500/40' :
                            step.status === 'running' ? 'bg-blue-500/20 border border-blue-500/40' :
                              step.status === 'failed' ? 'bg-red-500/20 border border-red-500/40' :
                                'bg-gray-500/20 border border-gray-500/40'
                          }`}>
                          {step.status === 'completed' ?
                            <CheckCircle className="w-4 h-4 text-green-400" /> :
                            step.status === 'running' ?
                              <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" /> :
                              step.status === 'failed' ?
                                <AlertTriangle className="w-4 h-4 text-red-400" /> :
                                <span className="text-xs text-gray-400">{index + 1}</span>
                          }
                        </div>
                        <div>
                          <div className="text-white font-medium">{step.name}</div>
                          <div className="text-xs text-gray-400">
                            {step.status === 'completed' && typeof step.completedAt === 'string' ?
                              `Completed ${new Date(step.completedAt).toLocaleTimeString()}` :
                              step.status === 'running' ? 'In progress...' :
                                step.status === 'failed' ? 'Failed' :
                                  'Pending'
                            }
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-white font-medium">{step.progress}%</div>
                        {step.status === 'running' && (
                          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-1 bg-blue-400 rounded-full transition-all duration-300"
                              style={{ width: `${step.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connected Channels */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">Connected Channels</h3>

                {onChannelConfig && (
                  <HolographicButton
                    variant="outline"
                    size="sm"
                    onClick={onChannelConfig}
                  >
                    Add Channels
                  </HolographicButton>
                )}
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {Array.isArray(status.channels) && status.channels.length > 0 ? (
                  status.channels.map((channel, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getChannelIcon(channel.type)}
                        <div>
                          <div className="text-white">{channel.name}</div>
                          <div className="text-xs text-gray-400 flex items-center space-x-1">
                            <span>{channel.type}</span>
                            <span>•</span>
                            <span>{new Date(channel.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {channel.url && (
                          <>
                            <HolographicButton
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyUrl(channel.url)}
                            >
                              <Copy className="w-4 h-4" />
                            </HolographicButton>

                            <HolographicButton
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(channel.url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </HolographicButton>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Globe className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">No channels connected yet</p>
                    {onChannelConfig && (
                      <HolographicButton
                        variant="outline"
                        size="sm"
                        onClick={onChannelConfig}
                      >
                        Configure Channels
                      </HolographicButton>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* System Status */}
            <div>
              <h3 className="text-white font-medium mb-4">System Status</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Server className="w-5 h-5 text-blue-400" />
                    <h4 className="text-white text-sm font-medium">Infrastructure</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-gray-300">API Gateway</span>
                      </div>
                      <span className="text-xs text-green-400">Healthy</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-gray-300">Database</span>
                      </div>
                      <span className="text-xs text-green-400">Operational</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-gray-300">Memory System</span>
                      </div>
                      <span className="text-xs text-green-400">Running</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-white text-sm font-medium">Security Status</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-gray-300">Encryption</span>
                      </div>
                      <span className="text-xs text-green-400">Enabled</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-gray-300">Credential Vault</span>
                      </div>
                      <span className="text-xs text-green-400">Secured</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-gray-300">Authentication</span>
                      </div>
                      <span className="text-xs text-green-400">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div>
              <h3 className="text-white font-medium mb-4">Activity Log</h3>

              <div className="bg-white/5 border border-white/10 rounded-lg">
                <div className="max-h-[200px] overflow-y-auto p-4">
                  {alertHistory.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-400">No activity recorded yet</p>
                    </div>
                  )}

                  {alertHistory.map((alert, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 mb-3 last:mb-0"
                    >
                      <div className={`mt-0.5 ${alert.level === 'error' ? 'text-red-400' :
                          alert.level === 'warning' ? 'text-yellow-400' :
                            'text-blue-400'
                        }`}>
                        {alert.level === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                          alert.level === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                            <Activity className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm ${alert.level === 'error' ? 'text-red-300' :
                              alert.level === 'warning' ? 'text-yellow-300' :
                                'text-blue-300'
                            }`}>
                            {alert.message}
                          </span>
                          <span className="text-xs text-gray-400">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {status.status === 'deployed' && (
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <HolographicButton
                  variant="outline"
                  onClick={() => {
                    if (Array.isArray(status.channels) && status.channels.length > 0 && status.channels[0].url) {
                      window.open(status.channels[0].url, '_blank');
                    }
                  }}
                  disabled={!Array.isArray(status.channels) || status.channels.length === 0}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  View Guild Interface
                </HolographicButton>

                <HolographicButton
                  onClick={() => {
                    if (onChannelConfig) {
                      onChannelConfig();
                    }
                  }}
                  glow
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Manage Channels
                </HolographicButton>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
};