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
    // Get the deployment ID from the URL
    const url = new URL(req.url);
    const deploymentId = url.pathname.split('/').pop();
    
    if (!deploymentId) {
      throw new Error("Deployment ID is required");
    }
    
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
    
    // Get the guild (deployment)
    const { data: guild, error: guildError } = await supabase
      .from("guilds")
      .select(`
        *,
        agents:agents(id, name, role, status),
        workflows:workflows(id, name, status)
      `)
      .eq("id", deploymentId)
      .eq("user_id", user.id)
      .single();
      
    if (guildError || !guild) {
      throw new Error(guildError?.message || "Deployment not found");
    }
    
    // Get channels
    const { data: channels, error: channelsError } = await supabase
      .from("guild_channels")
      .select("*")
      .eq("guild_id", deploymentId)
      .eq("user_id", user.id);
    
    // Generate deployment status
    const deploymentStatus = {
      id: deploymentId,
      status: "deployed",
      progress: 100,
      createdAt: guild.created_at,
      completedAt: guild.updated_at,
      guild: {
        id: guild.id,
        name: guild.name,
        status: guild.status
      },
      metrics: {
        agentsDeployed: guild.agents?.length || 0,
        workflowsConfigured: guild.workflows?.length || 0,
        servicesConnected: channels?.length || 0
      },
      channels: channels || []
    };
    
    return new Response(
      JSON.stringify(deploymentStatus),
      { headers }
    );
  } catch (error) {
    console.error("Error in deployment status:", error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers, status: 500 }
    );
  }
});