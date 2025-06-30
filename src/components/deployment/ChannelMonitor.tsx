import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  ExternalLink,
  Globe,
  Mail,
  Code,
  Eye,
  ChevronDown,
  Download,
  Users,
  ArrowRight,
  ChevronRight,
  Activity
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

interface ChannelMonitorProps {
  guildId: string;
  channelId?: string;
  className?: string;
}

export const ChannelMonitor: React.FC<ChannelMonitorProps> = ({
  guildId,
  channelId,
  className = ''
}) => {
  const [activeChannel, setActiveChannel] = useState<string | null>(channelId || null);
  const [channels, setChannels] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('7d');
  const [expandedSection, setExpandedSection] = useState<string | null>('activity');

  // Fetch channels when component mounts
  useEffect(() => {
    fetchChannels();
  }, [guildId]);

  // Fetch channel metrics when active channel changes
  useEffect(() => {
    if (activeChannel) {
      fetchChannelMetrics(activeChannel);
    }
  }, [activeChannel, timeframe]);

  // Fetch channels
  const fetchChannels = async () => {
    setLoading(true);
    try {
      // For now, let's use mock data
      const mockChannels = [
        {
          id: 'channel-1',
          type: 'web',
          name: 'Web Widget',
          status: 'active',
          created_at: new Date(Date.now() - 3000000).toISOString(),
          url: `https://example.com/widget/${guildId}`,
          stats: {
            conversations: 156,
            messages: 892,
            users: 94
          }
        },
        {
          id: 'channel-2',
          type: 'slack',
          name: 'Slack Integration',
          status: 'active',
          created_at: new Date(Date.now() - 2700000).toISOString(),
          url: `https://example.com/slack/${guildId}`,
          stats: {
            conversations: 78,
            messages: 412,
            users: 23
          }
        },
        {
          id: 'channel-3',
          type: 'email',
          name: 'Email Channel',
          status: 'active',
          created_at: new Date(Date.now() - 1500000).toISOString(),
          url: `mailto:guild-${guildId}@genesisOS.ai`,
          stats: {
            conversations: 42,
            messages: 128,
            users: 35
          }
        }
      ];
      
      setChannels(mockChannels);
      
      // Set active channel if not already set
      if (!activeChannel && mockChannels.length > 0) {
        setActiveChannel(mockChannels[0].id);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch channels');
      setLoading(false);
    }
  };

  // Fetch metrics for a specific channel
  const fetchChannelMetrics = async (channelId: string) => {
    setLoading(true);
    try {
      // For now, let's use mock data
      const mockMetrics = generateMockMetrics(channelId, timeframe);
      setMetrics(prevMetrics => ({
        ...prevMetrics,
        [channelId]: mockMetrics
      }));
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch channel metrics');
      setLoading(false);
    }
  };

  // Generate mock metrics
  const generateMockMetrics = (channelId: string, timeframe: string) => {
    const getDatePoints = () => {
      const points = [];
      const now = new Date();
      const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : 30;
      const interval = timeframe === '24h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const count = timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
      
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * interval);
        const formattedDate = timeframe === '24h' ? 
          `${date.getHours()}:00` : 
          `${date.getMonth() + 1}/${date.getDate()}`;
        points.push(formattedDate);
      }
      
      return points;
    };

    const dates = getDatePoints();
    
    // Get channel type from channels
    const channel = channels.find(c => c.id === channelId);
    const channelType = channel?.type || 'web';
    
    // Random data based on channel type
    const conversationFactor = channelType === 'web' ? 5 : channelType === 'slack' ? 3 : 2;
    const messageFactor = channelType === 'web' ? 6 : channelType === 'slack' ? 8 : 3;
    const userFactor = channelType === 'web' ? 4 : channelType === 'slack' ? 2 : 1;
    
    return {
      timeframe,
      dates,
      conversations: dates.map(() => Math.floor(Math.random() * 20 * conversationFactor) + 5),
      messages: dates.map(() => Math.floor(Math.random() * 50 * messageFactor) + 10),
      users: dates.map(() => Math.floor(Math.random() * 10 * userFactor) + 2),
      responseTime: dates.map(() => Math.floor(Math.random() * 500) + 300),
      successRate: dates.map(() => Math.floor(Math.random() * 10) + 90),
      topQuestions: [
        { text: "How do I upgrade my account?", count: Math.floor(Math.random() * 20) + 10 },
        { text: "What are your pricing options?", count: Math.floor(Math.random() * 20) + 10 },
        { text: "How do I reset my password?", count: Math.floor(Math.random() * 15) + 5 },
        { text: "Is there a mobile app available?", count: Math.floor(Math.random() * 15) + 5 },
        { text: "How do I contact support?", count: Math.floor(Math.random() * 10) + 5 }
      ],
      topFeedback: [
        { text: "Very helpful assistant!", sentiment: "positive", count: Math.floor(Math.random() * 20) + 10 },
        { text: "Answered my question quickly", sentiment: "positive", count: Math.floor(Math.random() * 15) + 5 },
        { text: "Couldn't solve my technical issue", sentiment: "negative", count: Math.floor(Math.random() * 10) + 2 },
        { text: "Great experience overall", sentiment: "positive", count: Math.floor(Math.random() * 15) + 5 }
      ],
      summary: {
        total_conversations: channel?.stats.conversations || 0,
        total_messages: channel?.stats.messages || 0,
        unique_users: channel?.stats.users || 0,
        avg_response_time: Math.floor(Math.random() * 500) + 300,
        avg_conversation_length: Math.floor(Math.random() * 5) + 3,
        success_rate: Math.floor(Math.random() * 10) + 90,
      }
    };
  };

  // Get channel icon
  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'web': return <Globe className="w-5 h-5 text-blue-400" />;
      case 'slack': return <MessageSquare className="w-5 h-5 text-purple-400" />;
      case 'email': return <Mail className="w-5 h-5 text-green-400" />;
      case 'api': return <Code className="w-5 h-5 text-orange-400" />;
      default: return <Globe className="w-5 h-5 text-gray-400" />;
    }
  };

  // Toggle expanded section
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className={className}>
      <GlassCard variant="medium" className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <BarChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Channel Analytics</h2>
              <p className="text-gray-300">Monitor performance across communication channels</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            
            <HolographicButton
              variant="ghost"
              size="sm"
              onClick={() => {
                // Refresh the metrics
                if (activeChannel) {
                  fetchChannelMetrics(activeChannel);
                }
              }}
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
                <p className="font-medium mb-1">Error fetching channel data</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid md:grid-cols-4 gap-6">
          {/* Channel list */}
          <div className="md:col-span-1">
            <h3 className="text-white font-medium mb-4">Channels</h3>
            
            <div className="space-y-2">
              {channels.map(channel => (
                <button
                  key={channel.id}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    activeChannel === channel.id
                      ? 'bg-white/10 border border-white/30'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => setActiveChannel(channel.id)}
                >
                  {getChannelIcon(channel.type)}
                  <div className="ml-3 text-left">
                    <div className="text-white text-sm font-medium">{channel.name}</div>
                    <div className="text-gray-400 text-xs">{channel.stats.conversations} conversations</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Channel metrics */}
          <div className="md:col-span-3">
            {loading && !metrics[activeChannel!] ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-300">Loading channel metrics...</p>
                </div>
              </div>
            ) : activeChannel && metrics[activeChannel] ? (
              <>
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-4 flex items-center">
                    {getChannelIcon(channels.find(c => c.id === activeChannel)?.type || 'web')}
                    <span className="ml-2">{channels.find(c => c.id === activeChannel)?.name || 'Channel'} Overview</span>
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white/10 p-3 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Conversations</div>
                      <div className="text-xl font-bold text-white">{metrics[activeChannel].summary.total_conversations}</div>
                      <div className="text-xs text-green-400">+{Math.floor(Math.random() * 20) + 5}%</div>
                    </div>
                    
                    <div className="bg-white/10 p-3 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Messages</div>
                      <div className="text-xl font-bold text-white">{metrics[activeChannel].summary.total_messages}</div>
                      <div className="text-xs text-green-400">+{Math.floor(Math.random() * 20) + 5}%</div>
                    </div>
                    
                    <div className="bg-white/10 p-3 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Users</div>
                      <div className="text-xl font-bold text-white">{metrics[activeChannel].summary.unique_users}</div>
                      <div className="text-xs text-green-400">+{Math.floor(Math.random() * 20) + 5}%</div>
                    </div>
                    
                    <div className="bg-white/10 p-3 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">Success Rate</div>
                      <div className="text-xl font-bold text-white">{metrics[activeChannel].summary.success_rate}%</div>
                      <div className="text-xs text-green-400">+{Math.floor(Math.random() * 5) + 1}%</div>
                    </div>
                  </div>
                  
                  {/* Conversation Activity */}
                  <div className="bg-white/5 border border-white/10 rounded-lg mb-6">
                    <div 
                      className="p-4 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleSection('activity')}
                    >
                      <h4 className="text-white font-medium flex items-center">
                        <Activity className="w-4 h-4 text-blue-400 mr-2" />
                        Conversation Activity
                      </h4>
                      
                      {expandedSection === 'activity' ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    
                    {expandedSection === 'activity' && (
                      <div className="p-4 pt-0 border-t border-white/10">
                        <div className="h-64 relative">
                          {/* Simple bar chart visualization */}
                          <div className="flex h-48 items-end justify-between mt-4 mb-2">
                            {metrics[activeChannel].dates.map((date: string, index: number) => {
                              const conversationHeight = metrics[activeChannel].conversations[index] / Math.max(...metrics[activeChannel].conversations) * 100;
                              
                              return (
                                <div key={index} className="flex-1 flex flex-col items-center">
                                  <div className="w-full flex justify-center">
                                    <div 
                                      className="w-4/5 bg-blue-500 rounded-t-sm" 
                                      style={{ height: `${conversationHeight}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="flex justify-between">
                            {metrics[activeChannel].dates.map((date: string, index: number) => (
                              <div key={index} className="text-xs text-gray-400 text-center">
                                {date}
                              </div>
                            ))}
                          </div>
                          
                          <div className="absolute top-0 left-0 text-xs text-gray-400">
                            {Math.max(...metrics[activeChannel].conversations)}
                          </div>
                          <div className="absolute bottom-8 left-0 text-xs text-gray-400">
                            0
                          </div>
                        </div>
                        
                        <div className="flex justify-center space-x-6 border-t border-white/10 pt-4 mt-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
                            <span className="text-xs text-gray-300">Conversations</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Message Distribution */}
                  <div className="bg-white/5 border border-white/10 rounded-lg mb-6">
                    <div 
                      className="p-4 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleSection('messages')}
                    >
                      <h4 className="text-white font-medium flex items-center">
                        <MessageSquare className="w-4 h-4 text-purple-400 mr-2" />
                        Message Analytics
                      </h4>
                      
                      {expandedSection === 'messages' ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    
                    {expandedSection === 'messages' && (
                      <div className="p-4 pt-0 border-t border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-white/10 p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Avg. Response Time</div>
                            <div className="text-xl font-bold text-white">{metrics[activeChannel].summary.avg_response_time}ms</div>
                          </div>
                          
                          <div className="bg-white/10 p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Avg. Conversation Length</div>
                            <div className="text-xl font-bold text-white">{metrics[activeChannel].summary.avg_conversation_length} msgs</div>
                          </div>
                          
                          <div className="bg-white/10 p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Peak Usage Time</div>
                            <div className="text-xl font-bold text-white">{Math.floor(Math.random() * 4) + 9}:00 - {Math.floor(Math.random() * 4) + 13}:00</div>
                          </div>
                        </div>
                        
                        <div className="bg-white/5 p-4 rounded-lg">
                          <h5 className="text-sm text-white font-medium mb-3">Top Questions</h5>
                          
                          <div className="space-y-3">
                            {metrics[activeChannel].topQuestions.map((q: any, index: number) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="text-sm text-gray-300">{q.text}</div>
                                <div className="text-sm text-blue-400">{q.count}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* User Activity */}
                  <div className="bg-white/5 border border-white/10 rounded-lg mb-6">
                    <div 
                      className="p-4 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleSection('users')}
                    >
                      <h4 className="text-white font-medium flex items-center">
                        <Users className="w-4 h-4 text-green-400 mr-2" />
                        User Engagement
                      </h4>
                      
                      {expandedSection === 'users' ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    
                    {expandedSection === 'users' && (
                      <div className="p-4 pt-0 border-t border-white/10">
                        <div className="bg-white/10 p-3 rounded-lg mb-4">
                          <h5 className="text-sm text-white font-medium mb-2">User Feedback</h5>
                          
                          <div className="space-y-2">
                            {metrics[activeChannel].topFeedback.map((feedback: any, index: number) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="text-sm text-gray-300">{feedback.text}</div>
                                <div className={`text-sm ${
                                  feedback.sentiment === 'positive' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {feedback.count}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/10 p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">New Users</div>
                            <div className="text-xl font-bold text-white">{Math.floor(metrics[activeChannel].summary.unique_users * 0.3)}</div>
                            <div className="text-xs text-green-400">+{Math.floor(Math.random() * 20) + 10}%</div>
                          </div>
                          
                          <div className="bg-white/10 p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Returning Users</div>
                            <div className="text-xl font-bold text-white">{Math.floor(metrics[activeChannel].summary.unique_users * 0.7)}</div>
                            <div className="text-xs text-green-400">+{Math.floor(Math.random() * 15) + 5}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex justify-between">
                  <div>
                    {activeChannel && (
                      <HolographicButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const channel = channels.find(c => c.id === activeChannel);
                          if (channel && channel.url) {
                            window.open(channel.url, '_blank');
                          }
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Channel
                      </HolographicButton>
                    )}
                  </div>
                  
                  <HolographicButton
                    variant="ghost"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Analytics
                  </HolographicButton>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <h4 className="text-white text-lg font-medium mb-2">No Channel Selected</h4>
                  <p className="text-gray-400">
                    Select a channel from the list to view its performance metrics
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};