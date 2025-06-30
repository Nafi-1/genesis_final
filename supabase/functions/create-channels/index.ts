// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface ChannelConfig {
  type: 'web' | 'slack' | 'email' | 'api' | 'discord' | 'custom';
  name: string;
  config: Record<string, any>;
}

interface CreateChannelsRequest {
  guild_id: string;
  channels: ChannelConfig[];
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
    
    // Parse request body
    const { guild_id, channels }: CreateChannelsRequest = await req.json();
    
    if (!guild_id) {
      throw new Error("Guild ID is required");
    }
    
    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      throw new Error("At least one channel is required");
    }
    
    // Verify the guild exists and belongs to the user
    const { data: guild, error: guildError } = await supabase
      .from("guilds")
      .select("*")
      .eq("id", guild_id)
      .eq("user_id", user.id)
      .single();
      
    if (guildError || !guild) {
      throw new Error(guildError?.message || "Guild not found or access denied");
    }
    
    // Process each channel
    const processedChannels = [];
    
    for (const channel of channels) {
      try {
        // Generate channel URL
        const channelUrl = generateChannelUrl(guild_id, channel.type, channel.config);
        
        // Insert the channel
        const { data, error } = await supabase
          .from("guild_channels")
          .insert({
            guild_id,
            user_id: user.id,
            type: channel.type,
            name: channel.name,
            config: channel.config,
            status: "active",
            url: channelUrl
          })
          .select()
          .single();
          
        if (error) {
          processedChannels.push({
            ...channel,
            status: "error",
            error: error.message,
            createdAt: new Date().toISOString()
          });
        } else {
          processedChannels.push({
            ...channel,
            id: data.id,
            status: "deployed",
            url: channelUrl,
            createdAt: data.created_at
          });
        }
      } catch (error) {
        processedChannels.push({
          ...channel,
          status: "error",
          error: error.message,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    // Return the processed channels
    return new Response(
      JSON.stringify({
        success: true,
        deploymentId: `channel-${Date.now()}`,
        guildId: guild_id,
        channels: processedChannels,
        status: "deployed",
        createdAt: new Date().toISOString()
      }),
      { headers }
    );
  } catch (error) {
    console.error("Error in channel creation:", error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers, status: 500 }
    );
  }
});

// Generate channel URL
function generateChannelUrl(guildId: string, channelType: string, config: Record<string, any>): string {
  const baseUrl = Deno.env.get("API_BASE_URL") || "https://genesisOS.ai";
  
  switch (channelType) {
    case "web":
      return `${baseUrl}/widget/${guildId}`;
    case "slack":
      return `${baseUrl}/slack/${guildId}`;
    case "email":
      return `mailto:${config.email || `guild-${guildId.slice(0, 8)}@genesisOS.ai`}`;
    case "api":
      return `${baseUrl}/api/guilds/${guildId}`;
    case "discord":
      return `${baseUrl}/discord/${guildId}`;
    default:
      return `${baseUrl}/guild/${guildId}`;
  }
}