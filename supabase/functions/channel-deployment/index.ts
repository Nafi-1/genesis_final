import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface ChannelConfig {
  type: 'slack' | 'email' | 'web' | 'api' | 'discord';
  name: string;
  config: Record<string, any>;
}

interface ChannelDeploymentRequest {
  guild_id: string;
  channels: ChannelConfig[];
}

interface DeployedChannel extends ChannelConfig {
  status: string;
  url: string;
  createdAt: string;
}

interface ChannelDeploymentResponse {
  success: boolean;
  deploymentId?: string;
  guildId?: string;
  channels?: DeployedChannel[];
  status?: string;
  createdAt?: string;
  error?: string;
}

// For Express.js/Node.js environment
export async function handleChannelDeployment(
  req: any, 
  res: any
): Promise<void> {
  // CORS headers
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Create Supabase client using environment variables
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials are not configured");
    }
    
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
    
    // Get the authenticated user
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      throw new Error("Invalid authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error(authError?.message || "Unauthorized");
    }
    
    // Parse request body
    const { guild_id, channels }: ChannelDeploymentRequest = req.body;
    
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
    
    // Process each channel deployment
    const deploymentId = generateUUID();
    const deployedChannels: DeployedChannel[] = [];
    
    for (const channel of channels) {
      // In a real implementation, we would:
      // 1. Configure each channel
      // 2. Store channel configs in database
      // 3. Return real endpoints and access URLs
      
      // For now, we'll simulate channel creation
      const channelUrl = getChannelUrl(guild_id, channel.type, channel.config);
      
      deployedChannels.push({
        ...channel,
        status: "deployed",
        url: channelUrl,
        createdAt: new Date().toISOString()
      });
      
      // Save channel config to database (in a real implementation)
      try {
        await supabase.from("guild_channels").insert({
          guild_id,
          user_id: user.id,
          type: channel.type,
          name: channel.name,
          config: channel.config,
          status: "active",
          url: channelUrl
        });
      } catch (error) {
        console.error(`Error saving channel ${channel.name}:`, error);
        // Non-blocking error, continue with deployment
      }
    }
    
    const response: ChannelDeploymentResponse = {
      success: true,
      deploymentId,
      guildId: guild_id,
      channels: deployedChannels,
      status: "deployed",
      createdAt: new Date().toISOString()
    };
    
    return res.status(200).json(response);
  } catch (error: any) {
    console.error("Error in channel deployment:", error.message);
    
    const errorResponse: ChannelDeploymentResponse = {
      success: false,
      error: error.message
    };
    
    return res.status(500).json(errorResponse);
  }
}

// For serverless/edge function environments (Vercel, Netlify, etc.)
export async function channelDeploymentHandler(request: Request): Promise<Response> {
  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, { headers, status: 200 });
  }

  // Only allow POST requests
  if (request.method !== "POST") {
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
    
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
    
    // Get the authenticated user
    const authHeader = request.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      throw new Error("Invalid authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error(authError?.message || "Unauthorized");
    }
    
    // Parse request body
    const { guild_id, channels }: ChannelDeploymentRequest = await request.json();
    
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
    
    // Process each channel deployment
    const deploymentId = generateUUID();
    const deployedChannels: DeployedChannel[] = [];
    
    for (const channel of channels) {
      const channelUrl = getChannelUrl(guild_id, channel.type, channel.config);
      
      deployedChannels.push({
        ...channel,
        status: "deployed",
        url: channelUrl,
        createdAt: new Date().toISOString()
      });
      
      // Save channel config to database
      try {
        await supabase.from("guild_channels").insert({
          guild_id,
          user_id: user.id,
          type: channel.type,
          name: channel.name,
          config: channel.config,
          status: "active",
          url: channelUrl
        });
      } catch (error) {
        console.error(`Error saving channel ${channel.name}:`, error);
      }
    }
    
    const response: ChannelDeploymentResponse = {
      success: true,
      deploymentId,
      guildId: guild_id,
      channels: deployedChannels,
      status: "deployed",
      createdAt: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(response), { headers });
  } catch (error: any) {
    console.error("Error in channel deployment:", error.message);
    
    const errorResponse: ChannelDeploymentResponse = {
      success: false,
      error: error.message
    };
    
    return new Response(JSON.stringify(errorResponse), { headers, status: 500 });
  }
}

// Helper function to generate UUID (replaces crypto.randomUUID for broader compatibility)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to generate channel URLs
function getChannelUrl(guildId: string, channelType: string, config: Record<string, any>): string {
  switch (channelType) {
    case 'web':
      return `https://widget.genesisOS.ai/${guildId}`;
    case 'slack':
      return `https://slack.com/apps/genesisOS-${guildId.slice(0, 8)}`;
    case 'email':
      return `mailto:${config.email_address || `guild-${guildId.slice(0, 8)}@genesisOS.ai`}`;
    case 'api':
      return `https://api.genesisOS.ai/v1/guilds/${guildId}`;
    case 'discord':
      return `https://discord.com/oauth2/authorize?client_id=GUILD_${guildId.slice(0, 8)}&scope=bot`;
    default:
      return `https://genesisOS.ai/guild/${guildId}`;
  }
}