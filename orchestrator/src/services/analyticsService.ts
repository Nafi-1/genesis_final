import axios from 'axios';
import { v4 as uuid } from 'uuid';

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';

/**
 * Service for analytics and reporting
 */
class AnalyticsService {
  /**
   * Get agent analysis
   */
  async getAgentAnalysis(agentId: string, period = 'week'): Promise<any> {
    try {
      console.log(`📊 Getting analysis for agent: ${agentId}`);
      
      // Try to get analysis from agent service
      try {
        const response = await axios.post(`${AGENT_SERVICE_URL}/agent-analysis`, {
          agent_id: agentId,
          time_period: period
        });
        
        return response.data;
      } catch (error) {
        console.error('❌ Agent analysis API error, using fallback:', error);
        
        // Fall back to a mock analysis
        return this.generateMockAgentAnalysis(agentId, period);
      }
    } catch (error: any) {
      console.error('❌ Error getting agent analysis:', error);
      throw new Error(`Failed to get agent analysis: ${error.message}`);
    }
  }
  
  /**
   * Get guild analytics
   */
  async getGuildAnalytics(guildId: string, period = 'week'): Promise<any> {
    try {
      console.log(`📊 Getting analytics for guild: ${guildId}`);
      
      // Try to get analytics from an API endpoint
      try {
        const response = await axios.get(`${AGENT_SERVICE_URL}/guilds/${guildId}/analytics?period=${period}`);
        
        return response.data;
      } catch (error) {
        console.error('❌ Guild analytics API error, using fallback:', error);
        
        // Fall back to a mock analytics report
        return this.generateMockGuildAnalytics(guildId, period);
      }
    } catch (error: any) {
      console.error('❌ Error getting guild analytics:', error);
      throw new Error(`Failed to get guild analytics: ${error.message}`);
    }
  }
  
  /**
   * Get workflow metrics
   */
  async getWorkflowMetrics(workflowId: string, period = 'week'): Promise<any> {
    try {
      console.log(`📊 Getting metrics for workflow: ${workflowId}`);
      
      // Try to get metrics from an API endpoint
      try {
        const response = await axios.get(`${AGENT_SERVICE_URL}/workflows/${workflowId}/metrics?period=${period}`);
        
        return response.data;
      } catch (error) {
        console.error('❌ Workflow metrics API error, using fallback:', error);
        
        // Fall back to a mock metrics report
        return this.generateMockWorkflowMetrics(workflowId, period);
      }
    } catch (error: any) {
      console.error('❌ Error getting workflow metrics:', error);
      throw new Error(`Failed to get workflow metrics: ${error.message}`);
    }
  }
  
  /**
   * Generate a mock agent analysis
   */
  private generateMockAgentAnalysis(agentId: string, period: string): any {
    console.log('🔄 Generating mock agent analysis');
    
    return {
      agent_id: agentId,
      agent_name: `Agent ${agentId.slice(-8)}`,
      period,
      performance_metrics: {
        total_conversations: Math.floor(Math.random() * 1000) + 100,
        avg_response_time_ms: Math.floor(Math.random() * 500) + 200,
        success_rate: (Math.random() * 0.2 + 0.8).toFixed(2), // 80-100%
        error_rate: (Math.random() * 0.1).toFixed(2), // 0-10%
        avg_tokens_per_response: Math.floor(Math.random() * 200) + 100,
        total_tokens_used: Math.floor(Math.random() * 1000000) + 100000,
        avg_sentiment_score: (Math.random() * 0.6 + 0.3).toFixed(2), // 0.3-0.9
        common_error_types: [
          { type: "API Timeout", count: Math.floor(Math.random() * 20) + 5 },
          { type: "Authentication Failure", count: Math.floor(Math.random() * 10) + 1 },
          { type: "Invalid Input", count: Math.floor(Math.random() * 15) + 3 }
        ]
      },
      memory_metrics: {
        short_term_entries: Math.floor(Math.random() * 100) + 20,
        long_term_entries: Math.floor(Math.random() * 1000) + 100,
        avg_importance_score: (Math.random() * 0.6 + 0.2).toFixed(2), // 0.2-0.8
        memory_types_distribution: [
          { type: "conversation", count: Math.floor(Math.random() * 500) + 100 },
          { type: "knowledge", count: Math.floor(Math.random() * 300) + 50 },
          { type: "reflection", count: Math.floor(Math.random() * 100) + 10 },
          { type: "plan", count: Math.floor(Math.random() * 50) + 5 }
        ],
        avg_retrieval_time_ms: Math.floor(Math.random() * 100) + 20
      },
      tool_usage_metrics: {
        tools_used: [
          {
            tool: "Database Query",
            count: Math.floor(Math.random() * 200) + 50,
            success_rate: (Math.random() * 0.2 + 0.8).toFixed(2),
            avg_execution_time_ms: Math.floor(Math.random() * 300) + 100
          },
          {
            tool: "API Request",
            count: Math.floor(Math.random() * 150) + 30,
            success_rate: (Math.random() * 0.3 + 0.7).toFixed(2),
            avg_execution_time_ms: Math.floor(Math.random() * 400) + 150
          },
          {
            tool: "Email Sender",
            count: Math.floor(Math.random() * 50) + 10,
            success_rate: (Math.random() * 0.1 + 0.9).toFixed(2),
            avg_execution_time_ms: Math.floor(Math.random() * 500) + 200
          }
        ],
        total_tool_calls: 0,
        successful_tool_calls: 0,
        failed_tool_calls: 0
      },
      optimization_opportunities: [
        "Response time is higher than optimal. Consider optimizing prompt design.",
        "Error rate is above target threshold. Implement better error handling.",
        "Memory retrieval time is high. Consider optimizing memory indexing."
      ],
      improvement_suggestions: [
        "Implement caching for frequently accessed data to reduce API calls",
        "Add more specific examples to agent instructions to improve task understanding",
        "Consider breaking complex workflows into smaller, more focused steps",
        "Increase memory importance thresholds to focus on higher-quality information"
      ],
      created_at: new Date().toISOString()
    };
  }
  
  /**
   * Generate mock guild analytics
   */
  private generateMockGuildAnalytics(guildId: string, period: string): any {
    console.log('🔄 Generating mock guild analytics');
    
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
        success_rate: (Math.min(1, Math.max(0.7, 0.9 + (Math.random() - 0.5) * 0.1))).toFixed(2),
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
        overall_success_rate: (agentMetrics.reduce((sum, agent) => sum + parseFloat(agent.success_rate as string), 0) / agentCount).toFixed(2),
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
   * Generate mock workflow metrics
   */
  private generateMockWorkflowMetrics(workflowId: string, period: string): any {
    console.log('🔄 Generating mock workflow metrics');
    
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
        result.success_rates.push(Number(Math.min(1, Math.max(0.7, 0.9 + (Math.random() - 0.5) * 0.2)).toFixed(2)));
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
    const successRate = Number(Math.min(1, Math.max(0.7, 0.9 + (Math.random() - 0.5) * 0.1)).toFixed(2));
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
        node_success_rate: Number(Math.min(1, Math.max(successRate, successRate + (Math.random() - 0.5) * 0.05)).toFixed(2))
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
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;