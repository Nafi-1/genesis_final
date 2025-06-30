import { api } from '../lib/api';

/**
 * Service for analytics and monitoring
 */
export const analyticsService = {
  /**
   * Get agent analysis
   */
  getAgentAnalysis: async (agentId: string, period: 'day' | 'week' | 'month' | 'all' = 'week'): Promise<AgentAnalysis> => {
    try {
      // Try to fetch from the API
      const response = await api.post('/agent-analysis', {
        agent_id: agentId,
        time_period: period
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get agent analysis:', error);
      
      // Return mock data for development
      return generateMockAgentAnalysis(agentId, period);
    }
  },
  
  /**
   * Get guild analytics
   */
  getGuildAnalytics: async (guildId: string, period: 'day' | 'week' | 'month' | 'all' = 'week'): Promise<GuildAnalytics> => {
    try {
      // Try to fetch from the API
      const response = await api.get(`/guilds/${guildId}/analytics?period=${period}`);
      
      return response.data;
    } catch (error) {
      console.error('Failed to get guild analytics:', error);
      
      // Return mock data for development
      return generateMockGuildAnalytics(guildId, period);
    }
  },
  
  /**
   * Get performance metrics for a workflow
   */
  getWorkflowMetrics: async (workflowId: string, period: 'day' | 'week' | 'month' | 'all' = 'week'): Promise<WorkflowMetrics> => {
    try {
      // Try to fetch from the API
      const response = await api.get(`/workflows/${workflowId}/metrics?period=${period}`);
      
      return response.data;
    } catch (error) {
      console.error('Failed to get workflow metrics:', error);
      
      // Return mock data for development
      return generateMockWorkflowMetrics(workflowId, period);
    }
  },
  
  /**
   * Get usage metrics for a user
   */
  getUserMetrics: async (userId?: string, period: 'day' | 'week' | 'month' | 'all' = 'week'): Promise<UserMetrics> => {
    try {
      // Try to fetch from the API
      const response = await api.get(`/users/${userId || 'me'}/metrics?period=${period}`);
      
      return response.data;
    } catch (error) {
      console.error('Failed to get user metrics:', error);
      
      // Return mock data for development
      return generateMockUserMetrics(userId || 'current-user', period);
    }
  }
};

// Types for analytics data

export interface PerformanceMetrics {
  total_conversations: number;
  avg_response_time_ms: number;
  success_rate: number;
  error_rate: number;
  avg_tokens_per_response: number;
  total_tokens_used: number;
  avg_sentiment_score: number;
  common_error_types: {
    type: string;
    count: number;
  }[];
}

export interface MemoryMetrics {
  short_term_entries: number;
  long_term_entries: number;
  avg_importance_score: number;
  memory_types_distribution: {
    type: string;
    count: number;
  }[];
  avg_retrieval_time_ms: number;
}

export interface ToolUsageMetrics {
  tools_used: {
    tool: string;
    count: number;
    success_rate: number;
    avg_execution_time_ms: number;
  }[];
  total_tool_calls: number;
  successful_tool_calls: number;
  failed_tool_calls: number;
}

export interface AgentAnalysis {
  agent_id: string;
  agent_name: string;
  period: string;
  performance_metrics: PerformanceMetrics;
  memory_metrics: MemoryMetrics;
  tool_usage_metrics: ToolUsageMetrics;
  optimization_opportunities: string[];
  improvement_suggestions: string[];
  created_at: string;
}

export interface WorkflowMetrics {
  workflow_id: string;
  workflow_name: string;
  period: string;
  execution_metrics: {
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    avg_execution_time_ms: number;
    total_node_executions: number;
    avg_node_execution_time_ms: number;
    node_success_rate: number;
  };
  time_series_data: {
    timestamps: string[];
    executions: number[];
    avg_execution_times: number[];
    success_rates: number[];
  };
  most_failed_nodes: {
    node_id: string;
    node_name: string;
    failure_count: number;
    common_error: string;
  }[];
  optimization_opportunities: string[];
  created_at: string;
}

export interface GuildAnalytics {
  guild_id: string;
  guild_name: string;
  period: string;
  summary_metrics: {
    total_conversations: number;
    total_messages: number;
    avg_response_time_ms: number;
    overall_success_rate: number;
    total_agents: number;
    total_workflows: number;
    total_executions: number;
    total_tokens_used: number;
  };
  agent_metrics: {
    agent_id: string;
    agent_name: string;
    conversations: number;
    success_rate: number;
    avg_response_time_ms: number;
  }[];
  channel_metrics: {
    channel: string;
    conversations: number;
    messages: number;
    users: number;
  }[];
  time_series_data: {
    timestamps: string[];
    conversations: number[];
    messages: number[];
    avg_response_times: number[];
  };
  insight_highlights: string[];
  created_at: string;
}

export interface UserMetrics {
  user_id: string;
  period: string;
  usage_metrics: {
    total_conversations: number;
    total_messages: number;
    total_guilds_used: number;
    total_agents_interacted: number;
    favorite_agent: {
      agent_id: string;
      agent_name: string;
      interaction_count: number;
    };
    total_tokens_used: number;
    avg_session_duration_minutes: number;
  };
  time_series_data: {
    timestamps: string[];
    conversations: number[];
    messages: number[];
    tokens_used: number[];
  };
  recommendations: string[];
  created_at: string;
}

// Mock data generators

/**
 * Generate mock agent analysis data
 */
function generateMockAgentAnalysis(agentId: string, period: string): AgentAnalysis {
  // Generate mock performance metrics
  const performanceMetrics: PerformanceMetrics = {
    total_conversations: Math.floor(Math.random() * 1000) + 100,
    avg_response_time_ms: Math.floor(Math.random() * 500) + 200,
    success_rate: Math.random() * 0.2 + 0.8, // 80-100%
    error_rate: Math.random() * 0.1, // 0-10%
    avg_tokens_per_response: Math.floor(Math.random() * 200) + 100,
    total_tokens_used: Math.floor(Math.random() * 1000000) + 100000,
    avg_sentiment_score: Math.random() * 0.6 + 0.3, // 0.3-0.9
    common_error_types: [
      { type: "API Timeout", count: Math.floor(Math.random() * 20) + 5 },
      { type: "Authentication Failure", count: Math.floor(Math.random() * 10) + 1 },
      { type: "Invalid Input", count: Math.floor(Math.random() * 15) + 3 }
    ]
  };
  
  // Generate mock memory metrics
  const memoryMetrics: MemoryMetrics = {
    short_term_entries: Math.floor(Math.random() * 100) + 20,
    long_term_entries: Math.floor(Math.random() * 1000) + 100,
    avg_importance_score: Math.random() * 0.6 + 0.2, // 0.2-0.8
    memory_types_distribution: [
      { type: "conversation", count: Math.floor(Math.random() * 500) + 100 },
      { type: "knowledge", count: Math.floor(Math.random() * 300) + 50 },
      { type: "reflection", count: Math.floor(Math.random() * 100) + 10 },
      { type: "plan", count: Math.floor(Math.random() * 50) + 5 }
    ],
    avg_retrieval_time_ms: Math.floor(Math.random() * 100) + 20
  };
  
  // Generate mock tool usage metrics
  const toolUsageMetrics: ToolUsageMetrics = {
    tools_used: [
      {
        tool: "Database Query",
        count: Math.floor(Math.random() * 200) + 50,
        success_rate: Math.random() * 0.2 + 0.8,
        avg_execution_time_ms: Math.floor(Math.random() * 300) + 100
      },
      {
        tool: "API Request",
        count: Math.floor(Math.random() * 150) + 30,
        success_rate: Math.random() * 0.3 + 0.7,
        avg_execution_time_ms: Math.floor(Math.random() * 400) + 150
      },
      {
        tool: "Email Sender",
        count: Math.floor(Math.random() * 50) + 10,
        success_rate: Math.random() * 0.1 + 0.9,
        avg_execution_time_ms: Math.floor(Math.random() * 500) + 200
      }
    ],
    total_tool_calls: 0,
    successful_tool_calls: 0,
    failed_tool_calls: 0
  };
  
  // Calculate totals for tool usage
  toolUsageMetrics.total_tool_calls = toolUsageMetrics.tools_used.reduce((sum, tool) => sum + tool.count, 0);
  toolUsageMetrics.successful_tool_calls = toolUsageMetrics.tools_used.reduce(
    (sum, tool) => sum + Math.floor(tool.count * tool.success_rate), 
    0
  );
  toolUsageMetrics.failed_tool_calls = toolUsageMetrics.total_tool_calls - toolUsageMetrics.successful_tool_calls;
  
  // Generate optimization opportunities based on metrics
  const optimizationOpportunities = [
    performanceMetrics.avg_response_time_ms > 400 
      ? "Response time is higher than optimal. Consider optimizing prompt design or using a faster AI model."
      : "Response time is within optimal range.",
    
    performanceMetrics.error_rate > 0.05
      ? "Error rate is above target threshold. Implement better error handling and recovery mechanisms."
      : "Error rate is within acceptable range.",
    
    memoryMetrics.avg_retrieval_time_ms > 50
      ? "Memory retrieval time is high. Consider optimizing memory indexing or caching strategies."
      : "Memory retrieval performance is good.",
    
    toolUsageMetrics.tools_used.some(tool => tool.success_rate < 0.85)
      ? "Some tools have sub-optimal success rates. Review error patterns and implement retry logic."
      : "Tool success rates are excellent across all integrations."
  ].filter(opportunity => !opportunity.includes("within") && !opportunity.includes("good") && !opportunity.includes("excellent"));
  
  // Generate improvement suggestions
  const improvementSuggestions = [
    "Implement caching for frequently accessed data to reduce API calls",
    "Add more specific examples to agent instructions to improve task understanding",
    "Consider breaking complex workflows into smaller, more focused steps",
    "Increase memory importance thresholds to focus on higher-quality information",
    "Add more context to user inputs to improve response relevance"
  ];
  
  return {
    agent_id: agentId,
    agent_name: `Agent ${agentId.slice(-8)}`,
    period,
    performance_metrics: performanceMetrics,
    memory_metrics: memoryMetrics,
    tool_usage_metrics: toolUsageMetrics,
    optimization_opportunities: optimizationOpportunities,
    improvement_suggestions: improvementSuggestions.slice(0, 3 + Math.floor(Math.random() * 3)), // 3-5 suggestions
    created_at: new Date().toISOString()
  };
}

/**
 * Generate mock workflow metrics data
 */
function generateMockWorkflowMetrics(workflowId: string, period: string): WorkflowMetrics {
  // Generate time series data
  const generateTimeSeries = (daysCount: number, average: number, variance: number) => {
    const result = {
      timestamps: [] as string[],
      executions: [] as number[],
      avg_execution_times: [] as number[],
      success_rates: [] as number[]
    };
    
    const now = Date.now();
    const interval = period === 'day' ? 3600000 : // 1 hour
                     period === 'week' ? 86400000 : // 1 day
                     period === 'month' ? 86400000 * 3 : // 3 days
                     86400000 * 7; // 7 days for 'all'
    
    const count = period === 'day' ? 24 : // 24 hours
                  period === 'week' ? 7 : // 7 days
                  period === 'month' ? 10 : // 10 points (30 days / 3)
                  Math.ceil(daysCount / 7); // Variable for 'all'
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - (count - i - 1) * interval);
      result.timestamps.push(timestamp.toISOString());
      result.executions.push(Math.max(0, Math.floor(average + (Math.random() - 0.5) * variance)));
      result.avg_execution_times.push(Math.max(100, Math.floor(5000 + (Math.random() - 0.5) * 2000)));
      result.success_rates.push(Math.min(1, Math.max(0.7, 0.9 + (Math.random() - 0.5) * 0.2)));
    }
    
    return result;
  };
  
  // Generate time series data
  const timeSeriesData = generateTimeSeries(
    period === 'day' ? 1 : 
    period === 'week' ? 7 : 
    period === 'month' ? 30 : 90,
    10, // average 10 executions per period
    10 // variance of +/- 5
  );
  
  // Calculate totals
  const totalExecutions = timeSeriesData.executions.reduce((sum, val) => sum + val, 0);
  const successRate = Math.min(1, Math.max(0.7, 0.9 + (Math.random() - 0.5) * 0.1));
  const successfulExecutions = Math.floor(totalExecutions * successRate);
  const failedExecutions = totalExecutions - successfulExecutions;
  const avgExecutionTime = timeSeriesData.avg_execution_times.reduce((sum, val) => sum + val, 0) / 
                          timeSeriesData.avg_execution_times.length;
  
  return {
    workflow_id: workflowId,
    workflow_name: `Workflow ${workflowId.slice(-8)}`,
    period,
    execution_metrics: {
      total_executions: totalExecutions,
      successful_executions: successfulExecutions,
      failed_executions: failedExecutions,
      avg_execution_time_ms: Math.floor(avgExecutionTime),
      total_node_executions: totalExecutions * Math.floor(Math.random() * 5 + 3), // 3-7 nodes per workflow
      avg_node_execution_time_ms: Math.floor(avgExecutionTime / (Math.random() * 3 + 2)), // Node execution is faster than workflow
      node_success_rate: Math.min(1, Math.max(successRate, successRate + (Math.random() - 0.5) * 0.05))
    },
    time_series_data: timeSeriesData,
    most_failed_nodes: [
      {
        node_id: `node-1-${workflowId.slice(-4)}`,
        node_name: 'API Connector',
        failure_count: Math.floor(failedExecutions * 0.4),
        common_error: 'API Timeout'
      },
      {
        node_id: `node-2-${workflowId.slice(-4)}`,
        node_name: 'Data Transformer',
        failure_count: Math.floor(failedExecutions * 0.3),
        common_error: 'Invalid Data Format'
      },
      {
        node_id: `node-3-${workflowId.slice(-4)}`,
        node_name: 'Email Sender',
        failure_count: Math.floor(failedExecutions * 0.2),
        common_error: 'SMTP Connection Error'
      }
    ],
    optimization_opportunities: [
      "Add retry logic to API Connector node to handle temporary outages",
      "Implement data validation before the Data Transformer node",
      "Add fallback delivery method for Email Sender node",
      "Consider adding caching for frequently requested data",
      "Optimize database queries to reduce execution time"
    ].slice(0, Math.floor(Math.random() * 3) + 2), // 2-4 opportunities
    created_at: new Date().toISOString()
  };
}

/**
 * Generate mock guild analytics data
 */
function generateMockGuildAnalytics(guildId: string, period: string): GuildAnalytics {
  // Generate time series data
  const generateTimeSeries = (daysCount: number, averageConversations: number, varianceConversations: number) => {
    const result = {
      timestamps: [] as string[],
      conversations: [] as number[],
      messages: [] as number[],
      avg_response_times: [] as number[]
    };
    
    const now = Date.now();
    const interval = period === 'day' ? 3600000 : // 1 hour
                     period === 'week' ? 86400000 : // 1 day
                     period === 'month' ? 86400000 * 3 : // 3 days
                     86400000 * 7; // 7 days for 'all'
    
    const count = period === 'day' ? 24 : // 24 hours
                  period === 'week' ? 7 : // 7 days
                  period === 'month' ? 10 : // 10 points (30 days / 3)
                  Math.ceil(daysCount / 7); // Variable for 'all'
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - (count - i - 1) * interval);
      
      const conversations = Math.max(0, Math.floor(averageConversations + (Math.random() - 0.5) * varianceConversations));
      const avgMessagesPerConversation = Math.floor(Math.random() * 3) + 3; // 3-5 messages per conversation
      
      result.timestamps.push(timestamp.toISOString());
      result.conversations.push(conversations);
      result.messages.push(conversations * avgMessagesPerConversation);
      result.avg_response_times.push(Math.floor(Math.random() * 300) + 200); // 200-500ms
    }
    
    return result;
  };
  
  // Generate agent metrics
  const generateAgentMetrics = (agentCount: number) => {
    return Array.from({ length: agentCount }, (_, i) => ({
      agent_id: `agent-${i}-${guildId.slice(-4)}`,
      agent_name: `Agent ${i + 1}`,
      conversations: Math.floor(Math.random() * 500) + 50,
      success_rate: Math.min(1, Math.max(0.7, 0.9 + (Math.random() - 0.5) * 0.1)),
      avg_response_time_ms: Math.floor(Math.random() * 300) + 200
    }));
  };
  
  // Generate channel metrics
  const generateChannelMetrics = () => {
    const channels = ['Web Widget', 'Slack', 'Email', 'API', 'Mobile'];
    
    return channels.map(channel => ({
      channel,
      conversations: Math.floor(Math.random() * 300) + 50,
      messages: Math.floor(Math.random() * 1500) + 200,
      users: Math.floor(Math.random() * 50) + 5
    }));
  };
  
  // Generate time series data
  const agentCount = Math.floor(Math.random() * 3) + 2; // 2-4 agents
  const timeSeriesData = generateTimeSeries(
    period === 'day' ? 1 : 
    period === 'week' ? 7 : 
    period === 'month' ? 30 : 90,
    20, // average 20 conversations per period
    20 // variance of +/- 10
  );
  
  // Calculate totals
  const totalConversations = timeSeriesData.conversations.reduce((sum, val) => sum + val, 0);
  const totalMessages = timeSeriesData.messages.reduce((sum, val) => sum + val, 0);
  const avgResponseTime = timeSeriesData.avg_response_times.reduce((sum, val) => sum + val, 0) / 
                          timeSeriesData.avg_response_times.length;
  
  // Generate agent metrics
  const agentMetrics = generateAgentMetrics(agentCount);
  
  // Generate channel metrics
  const channelMetrics = generateChannelMetrics();
  
  // Generate insight highlights
  const insights = [
    `User engagement increased by ${Math.floor(Math.random() * 30) + 10}% compared to previous period`,
    `Average conversation length is ${Math.floor(Math.random() * 3) + 3} messages`,
    `Peak usage time is between ${Math.floor(Math.random() * 3) + 9}AM and ${Math.floor(Math.random() * 3) + 2}PM`,
    `Most common user intent is "${['Product Information', 'Customer Support', 'Account Management', 'Pricing Inquiry'][Math.floor(Math.random() * 4)]}"`,
    `${Math.floor(Math.random() * 30) + 70}% of users received responses within 1 second`,
    `Channel with highest engagement is ${channelMetrics.sort((a, b) => b.conversations - a.conversations)[0].channel}`
  ];
  
  return {
    guild_id: guildId,
    guild_name: `Guild ${guildId.slice(-8)}`,
    period,
    summary_metrics: {
      total_conversations: totalConversations,
      total_messages: totalMessages,
      avg_response_time_ms: Math.floor(avgResponseTime),
      overall_success_rate: agentMetrics.reduce((sum, agent) => sum + agent.success_rate, 0) / agentCount,
      total_agents: agentCount,
      total_workflows: Math.floor(Math.random() * 3) + 1, // 1-3 workflows
      total_executions: Math.floor(Math.random() * 1000) + 100,
      total_tokens_used: Math.floor(Math.random() * 10000000) + 1000000
    },
    agent_metrics: agentMetrics,
    channel_metrics: channelMetrics,
    time_series_data: {
      timestamps: timeSeriesData.timestamps,
      conversations: timeSeriesData.conversations,
      messages: timeSeriesData.messages,
      avg_response_times: timeSeriesData.avg_response_times
    },
    insight_highlights: insights.sort(() => Math.random() - 0.5).slice(0, 4), // Random 4 insights
    created_at: new Date().toISOString()
  };
}

/**
 * Generate mock user metrics data
 */
function generateMockUserMetrics(userId: string, period: string): UserMetrics {
  // Generate time series data
  const generateTimeSeries = (daysCount: number, averageConversations: number, varianceConversations: number) => {
    const result = {
      timestamps: [] as string[],
      conversations: [] as number[],
      messages: [] as number[],
      tokens_used: [] as number[]
    };
    
    const now = Date.now();
    const interval = period === 'day' ? 3600000 : // 1 hour
                     period === 'week' ? 86400000 : // 1 day
                     period === 'month' ? 86400000 * 3 : // 3 days
                     86400000 * 7; // 7 days for 'all'
    
    const count = period === 'day' ? 24 : // 24 hours
                  period === 'week' ? 7 : // 7 days
                  period === 'month' ? 10 : // 10 points (30 days / 3)
                  Math.ceil(daysCount / 7); // Variable for 'all'
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - (count - i - 1) * interval);
      
      const conversations = Math.max(0, Math.floor(averageConversations + (Math.random() - 0.5) * varianceConversations));
      const avgMessagesPerConversation = Math.floor(Math.random() * 3) + 3; // 3-5 messages per conversation
      const messages = conversations * avgMessagesPerConversation;
      
      result.timestamps.push(timestamp.toISOString());
      result.conversations.push(conversations);
      result.messages.push(messages);
      result.tokens_used.push(messages * (Math.floor(Math.random() * 100) + 100)); // 100-200 tokens per message
    }
    
    return result;
  };
  
  // Generate time series data
  const timeSeriesData = generateTimeSeries(
    period === 'day' ? 1 : 
    period === 'week' ? 7 : 
    period === 'month' ? 30 : 90,
    5, // average 5 conversations per period
    5 // variance of +/- 2.5
  );
  
  // Calculate totals
  const totalConversations = timeSeriesData.conversations.reduce((sum, val) => sum + val, 0);
  const totalMessages = timeSeriesData.messages.reduce((sum, val) => sum + val, 0);
  const totalTokens = timeSeriesData.tokens_used.reduce((sum, val) => sum + val, 0);
  
  return {
    user_id: userId,
    period,
    usage_metrics: {
      total_conversations: totalConversations,
      total_messages: totalMessages,
      total_guilds_used: Math.floor(Math.random() * 3) + 1, // 1-3 guilds
      total_agents_interacted: Math.floor(Math.random() * 5) + 2, // 2-6 agents
      favorite_agent: {
        agent_id: `agent-${Math.floor(Math.random() * 5)}`,
        agent_name: `Agent ${Math.floor(Math.random() * 5) + 1}`,
        interaction_count: Math.floor(Math.random() * 50) + 10
      },
      total_tokens_used: totalTokens,
      avg_session_duration_minutes: Math.floor(Math.random() * 10) + 5 // 5-15 minutes
    },
    time_series_data: timeSeriesData,
    recommendations: [
      "Try using the Data Analyst agent for your reporting needs",
      "Consider setting up a daily workflow for automated updates",
      "Explore voice interaction for a more natural experience",
      "Configure email notifications to stay updated on important events",
      "Check out the new simulation lab to test your AI workforce"
    ].sort(() => Math.random() - 0.5).slice(0, 3), // Random 3 recommendations
    created_at: new Date().toISOString()
  };
}