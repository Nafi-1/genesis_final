// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

interface DeploymentRequest {
  blueprint_id: string;
  simulation_id?: string;
  credentials?: Record<string, string>;
  configuration?: Record<string, any>;
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
    const { blueprint_id, simulation_id, credentials, configuration }: DeploymentRequest = await req.json();
    
    if (!blueprint_id) {
      throw new Error("Blueprint ID is required");
    }
    
    // Get the blueprint
    const { data: blueprint, error: blueprintError } = await supabase
      .from("blueprints")
      .select("*")
      .eq("id", blueprint_id)
      .single();
      
    if (blueprintError || !blueprint) {
      throw new Error(blueprintError?.message || "Blueprint not found");
    }
    
    // Create the guild
    const guildData = {
      name: blueprint.suggested_structure.guild_name,
      description: blueprint.interpretation,
      purpose: blueprint.suggested_structure.guild_purpose,
      user_id: user.id,
      status: "active",
      metadata: {
        blueprint_id: blueprint_id,
        simulation_id: simulation_id,
        deployment_timestamp: new Date().toISOString(),
        credentials_configured: credentials ? Object.keys(credentials).length > 0 : false,
        configuration
      }
    };
    
    const { data: guild, error: guildError } = await supabase
      .from("guilds")
      .insert(guildData)
      .select()
      .single();
      
    if (guildError || !guild) {
      throw new Error(guildError?.message || "Failed to create guild");
    }
    
    // Create agents for the guild
    const agentPromises = blueprint.suggested_structure.agents.map(async (agentBlueprint: any) => {
      const agentData = {
        name: agentBlueprint.name,
        role: agentBlueprint.role,
        description: agentBlueprint.description,
        guild_id: guild.id,
        user_id: user.id,
        personality: `Professional, intelligent, and focused on delivering exceptional results.`,
        instructions: `You are ${agentBlueprint.name}, an advanced AI agent serving as a ${agentBlueprint.role}. 

Your primary responsibility: ${agentBlueprint.description}

Your expertise includes: ${agentBlueprint.tools_needed.join(', ')}`,
        tools: JSON.stringify(agentBlueprint.tools_needed.map((tool: string) => ({
          id: `tool_${tool.toLowerCase().replace(/\s+/g, '_')}`,
          name: tool,
          type: 'api',
          config: {}
        }))),
        status: "active"
      };
      
      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .insert(agentData)
        .select()
        .single();
        
      if (agentError) {
        console.error(`Error creating agent ${agentBlueprint.name}:`, agentError);
        return { error: agentError.message, name: agentBlueprint.name };
      }
      
      return agent;
    });
    
    // Wait for all agent creations to complete
    const agentResults = await Promise.allSettled(agentPromises);
    const createdAgents = agentResults
      .filter(result => result.status === 'fulfilled' && !('error' in result.value))
      .map(result => (result as PromiseFulfilledResult<any>).value);
    
    const failedAgents = agentResults
      .filter(result => result.status === 'rejected' || ('error' in (result as PromiseFulfilledResult<any>).value))
      .map(result => {
        if (result.status === 'rejected') {
          return { error: result.reason, name: 'Unknown' };
        } else {
          return (result as PromiseFulfilledResult<any>).value;
        }
      });
    
    // Create workflows for the guild
    const workflowPromises = blueprint.suggested_structure.workflows.map(async (workflowBlueprint: any) => {
      const workflowData = {
        name: workflowBlueprint.name,
        description: workflowBlueprint.description,
        guild_id: guild.id,
        user_id: user.id,
        trigger: JSON.stringify({
          type: workflowBlueprint.trigger_type,
          config: {}
        }),
        status: "active"
      };
      
      const { data: workflow, error: workflowError } = await supabase
        .from("workflows")
        .insert(workflowData)
        .select()
        .single();
        
      if (workflowError) {
        console.error(`Error creating workflow ${workflowBlueprint.name}:`, workflowError);
        return { error: workflowError.message, name: workflowBlueprint.name };
      }
      
      return workflow;
    });
    
    // Wait for all workflow creations to complete
    const workflowResults = await Promise.allSettled(workflowPromises);
    const createdWorkflows = workflowResults
      .filter(result => result.status === 'fulfilled' && !('error' in result.value))
      .map(result => (result as PromiseFulfilledResult<any>).value);
    
    const failedWorkflows = workflowResults
      .filter(result => result.status === 'rejected' || ('error' in (result as PromiseFulfilledResult<any>).value))
      .map(result => {
        if (result.status === 'rejected') {
          return { error: result.reason, name: 'Unknown' };
        } else {
          return (result as PromiseFulfilledResult<any>).value;
        }
      });
    
    // If credentials were provided, store them securely
    if (credentials && Object.keys(credentials).length > 0) {
      for (const [key, value] of Object.entries(credentials)) {
        if (!value) continue;
        
        // Encrypt the credential (in a real implementation)
        const encryptedValue = value; // This would be encrypted in production
        
        const credentialData = {
          user_id: user.id,
          guild_id: guild.id,
          service_name: key.split('_')[0], // Extract service name from key
          credential_type: key,
          encrypted_value: encryptedValue,
          is_active: true
        };
        
        try {
          await supabase.from("credentials").insert(credentialData);
        } catch (error) {
          console.error(`Error storing credential ${key}:`, error);
          // Non-blocking error, continue with deployment
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        deployment: {
          id: guild.id,
          guild,
          agents: createdAgents,
          workflows: createdWorkflows,
          status: "deployed",
          createdAt: new Date().toISOString(),
          details: {
            agentsCreated: createdAgents.length,
            workflowsCreated: createdWorkflows.length,
            failedAgents: failedAgents.length,
            failedWorkflows: failedWorkflows.length
          }
        }
      }),
      { headers }
    );
  } catch (error) {
    console.error("Error in guild deployment:", error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers, status: 500 }
    );
  }
});