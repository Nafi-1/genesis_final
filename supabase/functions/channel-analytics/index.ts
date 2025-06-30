// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

serve(async (req) => {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers, status: 200 });
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { headers, status: 405 }
    );
  }

  try {
    // Create Supabase client using environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
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
    
    // Parse URL parameters
    const url = new URL(req.url);
    const guildId = url.searchParams.get("guild_id");
    const channelId = url.searchParams.get("channel_id");
    const timeframe = url.searchParams.get("timeframe") || "7d";
    
    if (!guildId) {
      throw new Error("Guild ID is required");
    }
    
    // Verify the guild belongs to the user
    const { data: guild, error: guildError } = await supabase
      .from("guilds")
      .select("*")
      .eq("id", guildId)
      .eq("user_id", user.id)
      .single();
      
    if (guildError || !guild) {
      throw new Error(guildError?.message || "Guild not found or access denied");
    }
    
    // Get the channel data if channelId is provided
    let channel = null;
    if (channelId) {
      const { data, error } = await supabase
        .from("guild_channels")
        .select("*")
        .eq("id", channelId)
        .eq("guild_id", guildId)
        .eq("user_id", user.id)
        .single();
        
      if (error || !data) {
        throw new Error(error?.message || "Channel not found or access denied");
      }
      
      channel = data;
    }
    
    // Get all channels for the guild if channelId is not provided
    let channels = [];
    if (!channelId) {
      const { data, error } = await supabase
        .from("guild_channels")
        .select("*")
        .eq("guild_id", guildId)
        .eq("user_id", user.id);
        
      if (error) {
        throw new Error(error.message);
      }
      
      channels = data || [];
    }
    
    // In a real implementation, we would fetch analytics data from a database
    // For now, generate mock data
    
    // Helper to generate date points
    const generateDatePoints = (timeframe: string) => {
      const now = new Date();
      const dates = [];
      
      const days = timeframe === "24h" ? 1 : 
                  timeframe === "7d" ? 7 :
                  timeframe === "30d" ? 30 : 7;
                  
      const points = timeframe === "24h" ? 24 : 
                    timeframe === "7d" ? 7 : 
                    timeframe === "30d" ? 30 : 7;
                    
      const intervalMs = (days * 24 * 60 * 60 * 1000) / points;
      
      for (let i = points - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * intervalMs);
        const label = timeframe === "24h" 
          ? `${date.getHours()}:00` 
          : `${date.getMonth() + 1}/${date.getDate()}`;
        dates.push(label);
      }
      
      return dates;
    };
    
    // Generate mock analytics for a channel
    const generateChannelAnalytics = (channelData: any, timeframe: string) => {
      const dates = generateDatePoints(timeframe);
      
      return {
        id: channelData.id,
        name: channelData.name,
        type: channelData.type,
        timeframe,
        dates,
        metrics: {
          conversations: dates.map(() => Math.floor(Math.random() * 100) + 1),
          messages: dates.map(() => Math.floor(Math.random() * 500) + 50),
          users: dates.map(() => Math.floor(Math.random() * 50) + 5),
          response_times: dates.map(() => Math.floor(Math.random() * 500) + 200),
          success_rates: dates.map(() => Math.floor(Math.random() * 10) + 90),
        },
        summary: {
          total_conversations: Math.floor(Math.random() * 1000) + 100,
          total_messages: Math.floor(Math.random() * 5000) + 500,
          unique_users: Math.floor(Math.random() * 500) + 50,
          avg_response_time: Math.floor(Math.random() * 500) + 200,
          avg_conversation_length: Math.floor(Math.random() * 5) + 3,
          success_rate: Math.floor(Math.random() * 10) + 90,
          common_topics: [
            { name: "Product questions", count: Math.floor(Math.random() * 500) + 100 },
            { name: "Technical support", count: Math.floor(Math.random() * 300) + 50 },
            { name: "Pricing inquiries", count: Math.floor(Math.random() * 200) + 50 },
            { name: "Account issues", count: Math.floor(Math.random() * 100) + 20 },
            { name: "Feature requests", count: Math.floor(Math.random() * 100) + 10 }
          ]
        }
      };
    };
    
    // Generate analytics data
    let analyticsData;
    if (channel) {
      // Single channel analytics
      analyticsData = generateChannelAnalytics(channel, timeframe);
    } else {
      // All channels analytics
      analyticsData = {
        guild_id: guildId,
        timeframe,
        channels: channels.map(ch => generateChannelAnalytics(ch, timeframe)),
        summary: {
          total_channels: channels.length,
          active_channels: channels.filter(ch => ch.status === "active").length,
          total_conversations: Math.floor(Math.random() * 5000) + 500,
          total_messages: Math.floor(Math.random() * 25000) + 2500,
          unique_users: Math.floor(Math.random() * 2000) + 200,
          avg_response_time: Math.floor(Math.random() * 500) + 200,
        }
      };
    }
    
    return new Response(
      JSON.stringify(analyticsData),
      { headers }
    );
  } catch (error) {
    console.error("Error in channel analytics:", error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers, status: 500 }
    );
  }
});