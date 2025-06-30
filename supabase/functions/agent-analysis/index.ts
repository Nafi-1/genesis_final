// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

interface AnalysisRequest {
  agent_id: string;
  context?: Record<string, any>;
  time_period?: string; // 'day', 'week', 'month', 'all'
}

interface PerformanceMetrics {
  total_conversations: number;
  avg_response_time_ms: number;
  success_rate: number; 
  error_rate: number;
  avg_tokens_per_response: number;
  total_tokens_used: number;
  avg_sentiment_score: number; // -1 to 1
  common_error_types: {
    type: string;
    count: number;
  }[];
}

interface MemoryMetrics {
  short_term_entries: number;
  long_term_entries: number;
  avg_importance_score: number;
  memory_types_distribution: {
    type: string;
    count: number;
  }[];
  avg_retrieval_time_ms: number;
}

interface ToolUsageMetrics {
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

interface AgentAnalysis {
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

serve(async (req) => {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers, status: 200 });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { headers, status: 405 }
    );
  }

  try {
    // Create Supabase client using environment variables
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials are not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the authenticated user
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      throw new Error("Invalid authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error(authError?.message || "Unauthorized");
    }
    
    // Parse request body
    const { agent_id, context, time_period = 'week' }: AnalysisRequest = await req.json();
    
    if (!agent_id) {
      throw new Error("Agent ID is required");
    }
    
    // Get the agent
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agent_id)
      .eq("user_id", user.id)
      .single();
      
    if (agentError || !agent) {
      throw new Error(agentError?.message || "Agent not found or access denied");
    }
    
    // In a real implementation, we would analyze the agent's performance, memory, and tool usage
    // by querying the relevant tables and calculating metrics
    // For now, we'll generate mock data for demonstration
    
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
    
    // Create the analysis response
    const analysis: AgentAnalysis = {
      agent_id,
      agent_name: agent.name,
      period: time_period,
      performance_metrics: performanceMetrics,
      memory_metrics: memoryMetrics,
      tool_usage_metrics: toolUsageMetrics,
      optimization_opportunities: optimizationOpportunities,
      improvement_suggestions: improvementSuggestions.slice(0, 3 + Math.floor(Math.random() * 3)), // 3-5 suggestions
      created_at: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(analysis),
      { headers }
    );
  } catch (error) {
    console.error("Error in agent analysis:", error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers, status: 500 }
    );
  }
});