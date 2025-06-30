import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar, 
  ChevronDown, 
  Download, 
  RefreshCw, 
  Settings, 
  HelpCircle, 
  Filter, 
  FileText, 
  AlertCircle,
  Brain,
  MessageSquare,
  Database,
  Zap,
  Check,
  Timer,
  Target,
  ChevronRight
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

interface AnalyticsDashboardProps {
  guildId: string;
  className?: string;
}

interface MetricTile {
  id: string;
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
  tooltip?: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

interface Insight {
  id: string;
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
  category: 'performance' | 'usage' | 'efficiency' | 'security';
  timestamp: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  guildId,
  className = ''
}) => {
  const [timePeriod, setTimePeriod] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [metrics, setMetrics] = useState<{
    topLevelMetrics: MetricTile[];
    conversationMetrics: MetricTile[];
    performanceMetrics: MetricTile[];
    errorMetrics: MetricTile[];
    agentActivityChart: ChartData;
    responseTimeChart: ChartData;
    successRateChart: ChartData;
    usageByChannelChart: ChartData;
    topIntents: { intent: string; count: number; }[];
    topErrors: { error: string; count: number; module: string; }[];
    insights: Insight[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'agents' | 'workflows' | 'users' | 'errors'>('overview');
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);
  
  useEffect(() => {
    loadMetrics();
  }, [timePeriod, guildId]);
  
  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      setTimeout(() => {
        setMetrics(generateMockMetrics());
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load analytics metrics:', error);
      setIsLoading(false);
    }
  };
  
  const generateMockMetrics = () => {
    const generateTrend = (): 'up' | 'down' | 'neutral' => {
      const random = Math.random();
      if (random < 0.33) return 'up';
      if (random < 0.66) return 'down';
      return 'neutral';
    };
    
    const generateChange = (trend: 'up' | 'down' | 'neutral') => {
      const change = Math.round(Math.random() * 30);
      return trend === 'up' ? `+${change}%` : trend === 'down' ? `-${change}%` : '0%';
    };
    
    const totalConversations = Math.floor(Math.random() * 5000) + 1000;
    const avgResponseTime = (Math.random() * 0.5 + 0.2).toFixed(1);
    const userSatisfaction = Math.floor(Math.random() * 20) + 80;
    const uptime = (99 + Math.random()).toFixed(2);
    
    const generateTimeSeriesData = (daysCount: number, baseValue: number, volatility: number) => {
      const data = [];
      let currentValue = baseValue;
      
      for (let i = 0; i < daysCount; i++) {
        currentValue += (Math.random() - 0.5) * volatility;
        data.push(Math.max(0, currentValue));
      }
      
      return data;
    };
    
    const generateLabels = () => {
      const labels = [];
      const today = new Date();
      
      let increment = 1;
      let count = 7;
      let format = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
      
      if (timePeriod === '24h') {
        increment = 1;
        count = 24;
        format = (d: Date) => `${d.getHours()}:00`;
      } else if (timePeriod === '7d') {
        increment = 1;
        count = 7;
      } else if (timePeriod === '30d') {
        increment = 3;
        count = 10;
      } else if (timePeriod === '90d') {
        increment = 7;
        count = 13;
      }
      
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(today);
        
        if (timePeriod === '24h') {
          date.setHours(today.getHours() - i * increment);
        } else {
          date.setDate(today.getDate() - i * increment);
        }
        
        labels.push(format(date));
      }
      
      return labels;
    };
    
    const labels = generateLabels();
    
    const topLevelMetrics: MetricTile[] = [
      {
        id: 'total-conversations',
        title: 'Total Conversations',
        value: totalConversations.toLocaleString(),
        change: generateChange(generateTrend()),
        trend: generateTrend(),
        icon: MessageSquare,
        color: 'text-purple-400'
      },
      {
        id: 'avg-response-time',
        title: 'Avg Response Time',
        value: `${avgResponseTime}s`,
        change: generateChange(generateTrend()),
        trend: generateTrend(),
        icon: Clock,
        color: 'text-blue-400'
      },
      {
        id: 'user-satisfaction',
        title: 'User Satisfaction',
        value: `${userSatisfaction}%`,
        change: generateChange(generateTrend()),
        trend: generateTrend(),
        icon: Users,
        color: 'text-green-400'
      },
      {
        id: 'system-uptime',
        title: 'System Uptime',
        value: `${uptime}%`,
        change: '0%',
        trend: 'neutral',
        icon: Zap,
        color: 'text-yellow-400'
      }
    ];
    
    const conversationMetrics: MetricTile[] = [
      {
        id: 'total-messages',
        title: 'Total Messages',
        value: (totalConversations * (Math.random() * 5 + 3)).toFixed(0),
        icon: MessageSquare,
        color: 'text-purple-400'
      },
      {
        id: 'avg-conversation-length',
        title: 'Avg Conversation Length',
        value: `${(Math.random() * 10 + 3).toFixed(1)} msgs`,
        icon: MessageSquare,
        color: 'text-indigo-400'
      },
      {
        id: 'peak-hour',
        title: 'Peak Hour',
        value: `${Math.floor(Math.random() * 12) + 9}:00`,
        icon: Clock,
        color: 'text-blue-400'
      },
      {
        id: 'busiest-agent',
        title: 'Busiest Agent',
        value: 'Support Specialist',
        icon: Brain,
        color: 'text-pink-400'
      }
    ];
    
    const performanceMetrics: MetricTile[] = [
      {
        id: 'avg-token-count',
        title: 'Avg Token Count',
        value: `${(Math.random() * 1000 + 500).toFixed(0)}`,
        icon: FileText,
        color: 'text-emerald-400'
      },
      {
        id: 'memory-usage',
        title: 'Memory Usage',
        value: `${(Math.random() * 200 + 50).toFixed(0)} MB`,
        icon: Database,
        color: 'text-cyan-400'
      },
      {
        id: 'token-efficiency',
        title: 'Token Efficiency',
        value: `${(Math.random() * 20 + 80).toFixed(0)}%`,
        icon: Target,
        color: 'text-green-400'
      },
      {
        id: 'api-latency',
        title: 'API Latency',
        value: `${(Math.random() * 100 + 50).toFixed(0)} ms`,
        icon: Timer,
        color: 'text-orange-400'
      }
    ];
    
    const errorMetrics: MetricTile[] = [
      {
        id: 'error-rate',
        title: 'Error Rate',
        value: `${(Math.random() * 2).toFixed(2)}%`,
        icon: AlertCircle,
        color: 'text-red-400'
      },
      {
        id: 'avg-recovery-time',
        title: 'Avg Recovery Time',
        value: `${(Math.random() * 2 + 1).toFixed(1)}s`,
        icon: RefreshCw,
        color: 'text-orange-400'
      },
      {
        id: 'error-distribution',
        title: 'Top Error Type',
        value: 'API Timeout',
        icon: AlertCircle,
        color: 'text-yellow-400'
      },
      {
        id: 'error-trend',
        title: 'Error Trend',
        value: `${generateTrend() === 'down' ? 'Decreasing' : 'Stable'}`,
        icon: TrendingUp,
        color: 'text-blue-400'
      }
    ];
    
    const agentActivityChart: ChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Support Agent',
          data: generateTimeSeriesData(labels.length, 40, 10),
          color: '#8B5CF6'
        },
        {
          label: 'Sales Agent',
          data: generateTimeSeriesData(labels.length, 30, 8),
          color: '#3B82F6'
        },
        {
          label: 'Analyst Agent',
          data: generateTimeSeriesData(labels.length, 20, 5),
          color: '#10B981'
        }
      ]
    };
    
    const responseTimeChart: ChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Response Time (ms)',
          data: generateTimeSeriesData(labels.length, 500, 100),
          color: '#F59E0B'
        }
      ]
    };
    
    const successRateChart: ChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Success Rate',
          data: generateTimeSeriesData(labels.length, 95, 5),
          color: '#10B981'
        }
      ]
    };
    
    const usageByChannelChart: ChartData = {
      labels: ['Web', 'Slack', 'Email', 'API', 'Mobile'],
      datasets: [
        {
          label: 'Conversations',
          data: [
            Math.floor(Math.random() * 1000) + 500,
            Math.floor(Math.random() * 800) + 200,
            Math.floor(Math.random() * 500) + 100,
            Math.floor(Math.random() * 300) + 50,
            Math.floor(Math.random() * 200) + 20
          ],
          color: '#8B5CF6'
        }
      ]
    };
    
    const topIntents = [
      { intent: 'Ask for product information', count: Math.floor(Math.random() * 300) + 100 },
      { intent: 'Request customer support', count: Math.floor(Math.random() * 250) + 80 },
      { intent: 'Check order status', count: Math.floor(Math.random() * 200) + 60 },
      { intent: 'Pricing inquiry', count: Math.floor(Math.random() * 150) + 40 },
      { intent: 'Technical help', count: Math.floor(Math.random() * 100) + 30 }
    ];
    
    const topErrors = [
      { error: 'API Connection Timeout', count: Math.floor(Math.random() * 50) + 10, module: 'External API' },
      { error: 'Rate Limit Exceeded', count: Math.floor(Math.random() * 30) + 5, module: 'API Gateway' },
      { error: 'Memory Retrieval Failed', count: Math.floor(Math.random() * 20) + 3, module: 'Memory Service' },
      { error: 'Token Limit Exceeded', count: Math.floor(Math.random() * 15) + 2, module: 'AI Model' },
      { error: 'Authentication Failed', count: Math.floor(Math.random() * 10) + 1, module: 'Auth Service' }
    ];
    
    const insights: Insight[] = [
      {
        id: 'insight-1',
        title: 'Response Time Optimization',
        description: 'The Support Agent has shown a 23% increase in response time during peak hours (2PM-5PM). Consider optimizing memory retrieval for this agent or adding an additional agent to handle load during these hours.',
        importance: 'high',
        category: 'performance',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'insight-2',
        title: 'User Satisfaction Correlation',
        description: 'We\'ve detected a strong correlation between response times under 800ms and positive user feedback. Agents that consistently respond in under 800ms receive 35% more positive ratings.',
        importance: 'medium',
        category: 'efficiency',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'insight-3',
        title: 'Potential API Issue',
        description: 'The system has detected an unusual number of API timeouts (17) when accessing the CRM service. This might indicate an issue with the CRM API or network connectivity.',
        importance: 'high',
        category: 'performance',
        timestamp: new Date(Date.now() - 10800000).toISOString()
      },
      {
        id: 'insight-4',
        title: 'Memory Efficiency',
        description: 'The Data Analyst agent is storing 2.3x more memory entries than other agents, but only retrieving 5% of them. Consider adjusting memory importance thresholds for this agent.',
        importance: 'medium',
        category: 'efficiency',
        timestamp: new Date(Date.now() - 14400000).toISOString()
      },
      {
        id: 'insight-5',
        title: 'Usage Pattern Change',
        description: 'There has been a 45% increase in usage during weekend hours (Sat-Sun, 10AM-6PM) over the last 2 weeks. This represents a shift from previous patterns where weekday usage dominated.',
        importance: 'medium',
        category: 'usage',
        timestamp: new Date(Date.now() - 18000000).toISOString()
      }
    ];
    
    return {
      topLevelMetrics,
      conversationMetrics,
      performanceMetrics,
      errorMetrics,
      agentActivityChart,
      responseTimeChart,
      successRateChart,
      usageByChannelChart,
      topIntents,
      topErrors,
      insights
    };
  };
  
  const toggleInsight = (id: string) => {
    setExpandedInsightId(expandedInsightId === id ? null : id);
  };
  
  const renderLoading = () => (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Loading analytics data...</p>
      </div>
    </div>
  );
  
  const renderChart = (chartData: ChartData, height: number = 200) => {
    const maxValue = Math.max(
      ...chartData.datasets.flatMap(dataset => dataset.data),
      1
    );
    
    return (
      <div style={{ height: `${height}px` }} className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
          <div>{maxValue}</div>
          <div>{Math.round(maxValue / 2)}</div>
          <div>0</div>
        </div>
        
        <div className="ml-12 h-full flex items-end">
          {chartData.labels.map((label, labelIndex) => (
            <div 
              key={label} 
              className="flex-1 flex flex-col justify-end items-center"
            >
              <div className="w-full flex justify-center space-x-1">
                {chartData.datasets.map((dataset, datasetIndex) => {
                  const value = dataset.data[labelIndex];
                  const height = (value / maxValue) * 100;
                  
                  return (
                    <div 
                      key={`${label}-${dataset.label}`} 
                      className={`w-${100 / (chartData.datasets.length + 1)}% max-w-[20px]`}
                    >
                      <div 
                        className={`w-full rounded-t transition-all duration-500`}
                        style={{ 
                          height: `${height}%`,
                          backgroundColor: dataset.color,
                          minHeight: value > 0 ? '2px' : '0'
                        }}
                        title={`${dataset.label}: ${value}`}
                      />
                    </div>
                  );
                })}
              </div>
              
              <div className="text-xs text-gray-500 mt-2 whitespace-nowrap overflow-hidden text-ellipsis" style={{ maxWidth: '100%' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex justify-center space-x-4">
          {chartData.datasets.map((dataset) => (
            <div key={dataset.label} className="flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: dataset.color }}
              />
              <span className="text-xs text-gray-400">{dataset.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderOverview = () => {
    if (!metrics) return renderLoading();
    
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          {metrics.topLevelMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <GlassCard variant="subtle" className="p-4">
            <h4 className="text-white font-medium mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 text-purple-400 mr-2" />
              Agent Activity
            </h4>
            {renderChart(metrics.agentActivityChart)}
          </GlassCard>
          
          <GlassCard variant="subtle" className="p-4">
            <h4 className="text-white font-medium mb-4 flex items-center">
              <Clock className="w-5 h-5 text-yellow-400 mr-2" />
              Response Time
            </h4>
            {renderChart(metrics.responseTimeChart)}
          </GlassCard>
        </div>
        
        <GlassCard variant="subtle" className="p-4">
          <h4 className="text-white font-medium mb-4 flex items-center">
            <Brain className="w-5 h-5 text-blue-400 mr-2" />
            AI-Generated Insights
          </h4>
          
          <div className="space-y-3">
            {metrics.insights.map((insight) => (
              <div 
                key={insight.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  insight.importance === 'high' 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : insight.importance === 'medium'
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                } ${expandedInsightId === insight.id ? 'border-opacity-100' : 'border-opacity-50'}`}
                onClick={() => toggleInsight(insight.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {insight.importance === 'high' && <AlertCircle className="w-4 h-4 text-red-400 mr-2" />}
                    {insight.importance === 'medium' && <AlertCircle className="w-4 h-4 text-yellow-400 mr-2" />}
                    {insight.importance === 'low' && <Check className="w-4 h-4 text-blue-400 mr-2" />}
                    
                    <span className="text-white font-medium">{insight.title}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      {new Date(insight.timestamp).toLocaleTimeString()}
                    </span>
                    {expandedInsightId === insight.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedInsightId === insight.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3 text-gray-300 text-sm overflow-hidden"
                    >
                      <p className="mb-2">{insight.description}</p>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Category: {insight.category}</span>
                        <span>{new Date(insight.timestamp).toLocaleString()}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </GlassCard>
        
        <div className="grid md:grid-cols-2 gap-6">
          <GlassCard variant="subtle" className="p-4">
            <h4 className="text-white font-medium mb-4 flex items-center">
              <Target className="w-5 h-5 text-emerald-400 mr-2" />
              Top User Intents
            </h4>
            
            <div className="space-y-2">
              {metrics.topIntents.map((intent, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-xs">
                      {index + 1}
                    </div>
                    <span className="text-sm text-white">{intent.intent}</span>
                  </div>
                  <span className="text-sm text-emerald-400">{intent.count}</span>
                </div>
              ))}
            </div>
          </GlassCard>
          
          <GlassCard variant="subtle" className="p-4">
            <h4 className="text-white font-medium mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              Top Errors
            </h4>
            
            <div className="space-y-2">
              {metrics.topErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 text-xs">
                      {index + 1}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-white">{error.error}</span>
                      <span className="text-xs text-gray-400">{error.module}</span>
                    </div>
                  </div>
                  <span className="text-sm text-red-400">{error.count}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    );
  };
  
  const renderAgentsTab = () => {
    if (!metrics) return renderLoading();
    
    return (
      <div className="text-center py-20 text-gray-400">
        <Brain className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-white mb-2">Agent Analytics</h3>
        <p className="max-w-md mx-auto">
          Detailed agent performance metrics will be available in a future update.
          Check back soon for comprehensive agent analytics!
        </p>
      </div>
    );
  };
  
  const renderWorkflowsTab = () => {
    if (!metrics) return renderLoading();
    
    return (
      <div className="text-center py-20 text-gray-400">
        <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-white mb-2">Workflow Analytics</h3>
        <p className="max-w-md mx-auto">
          Detailed workflow performance metrics will be available in a future update.
          Check back soon for comprehensive workflow analytics!
        </p>
      </div>
    );
  };
  
  const renderUsersTab = () => {
    if (!metrics) return renderLoading();
    
    return (
      <div className="text-center py-20 text-gray-400">
        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-xl font-semibold text-white mb-2">User Analytics</h3>
        <p className="max-w-md mx-auto">
          Detailed user engagement metrics will be available in a future update.
          Check back soon for comprehensive user analytics!
        </p>
      </div>
    );
  };
  
  const renderErrorsTab = () => {
    if (!metrics) return renderLoading();
    
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          {metrics.errorMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
        
        <GlassCard variant="subtle" className="p-4">
          <h4 className="text-white font-medium mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            Error Details
          </h4>
          
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-2 text-gray-400 font-medium">Error</th>
                <th className="pb-2 text-gray-400 font-medium">Module</th>
                <th className="pb-2 text-gray-400 font-medium text-center">Count</th>
                <th className="pb-2 text-gray-400 font-medium text-right">Last Occurred</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {metrics.topErrors.map((error, index) => (
                <tr key={index} className="border-b border-white/5">
                  <td className="py-3 text-white">{error.error}</td>
                  <td className="py-3 text-gray-300">{error.module}</td>
                  <td className="py-3 text-center text-red-400">{error.count}</td>
                  <td className="py-3 text-right text-gray-400">{new Date().toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
        
        <GlassCard variant="subtle" className="p-4">
          <h4 className="text-white font-medium mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 text-orange-400 mr-2" />
            Error Trend
          </h4>
          
          {renderChart({
            labels: metrics.responseTimeChart.labels,
            datasets: [
              {
                label: 'Errors',
                data: metrics.responseTimeChart.datasets[0].data.map(d => d * 0.02),
                color: '#F87171'
              }
            ]
          })}
        </GlassCard>
      </div>
    );
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
            <p className="text-gray-300">Performance insights and usage metrics</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/15 transition-colors px-4 py-2 rounded-lg text-white"
              onClick={() => {}}
            >
              <Calendar className="w-4 h-4" />
              <span>
                {timePeriod === '24h' ? 'Last 24 Hours' :
                 timePeriod === '7d' ? 'Last 7 Days' :
                 timePeriod === '30d' ? 'Last 30 Days' :
                 'Last 90 Days'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            <div className="absolute right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10 hidden">
              {['24h', '7d', '30d', '90d'].map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period as any)}
                  className="block w-full text-left px-4 py-2 hover:bg-white/10 text-white text-sm"
                >
                  {period === '24h' ? 'Last 24 Hours' :
                   period === '7d' ? 'Last 7 Days' :
                   period === '30d' ? 'Last 30 Days' :
                   'Last 90 Days'}
                </button>
              ))}
            </div>
          </div>
          
          <HolographicButton variant="ghost" size="sm" onClick={loadMetrics}>
            <RefreshCw className="w-4 h-4" />
          </HolographicButton>
          
          <HolographicButton variant="ghost" size="sm">
            <Download className="w-4 h-4" />
          </HolographicButton>
        </div>
      </div>
      
      <div className="flex border-b border-white/10 pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'agents', label: 'Agents', icon: Brain },
          { id: 'workflows', label: 'Workflows', icon: Zap },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'errors', label: 'Errors', icon: AlertCircle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 ${
              selectedTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'agents' && renderAgentsTab()}
          {selectedTab === 'workflows' && renderWorkflowsTab()}
          {selectedTab === 'users' && renderUsersTab()}
          {selectedTab === 'errors' && renderErrorsTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const MetricCard: React.FC<{ metric: MetricTile }> = ({ metric }) => {
  const Icon = metric.icon;
  
  return (
    <GlassCard variant="subtle" className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${metric.color}`} />
          <span className="text-gray-300 text-sm">{metric.title}</span>
        </div>
        
        {metric.tooltip && (
          <HelpCircle className="w-4 h-4 text-gray-500" />
        )}
      </div>
      
      <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
      
      {metric.change && (
        <div className={`flex items-center text-xs ${
          metric.trend === 'up' ? 'text-green-400' :
          metric.trend === 'down' ? 'text-red-400' :
          'text-gray-400'
        }`}>
          {metric.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
          {metric.trend === 'down' && <TrendingUp className="w-3 h-3 mr-1 transform rotate-180" />}
          {metric.change} vs. previous period
        </div>
      )}
    </GlassCard>
  );
};