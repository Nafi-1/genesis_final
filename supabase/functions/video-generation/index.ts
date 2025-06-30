// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Add Deno type declarations
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

interface VideoRequest {
  text: string;
  avatar_id?: string;
  webhook_url?: string;
  metadata?: Record<string, any>;
}

// Simulated video generation for development
function generateMockVideoResponse() {
  return {
    id: crypto.randomUUID(),
    status: "processing",
    estimated_completion: new Date(Date.now() + 1000 * 60 * 5).toISOString(), // 5 min from now
    thumbnail_url: "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    metadata: {
      model: "advanced-personalized-avatar",
      processing_started: new Date().toISOString(),
      is_priority: true
    }
  };
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
    // In a real implementation, you would use your Tavus API key
    const TAVUS_API_KEY = Deno.env.get("TAVUS_API_KEY");
    
    if (!TAVUS_API_KEY || TAVUS_API_KEY.startsWith("your_")) {
      console.log("Tavus API key not configured, using mock response");
      return new Response(
        JSON.stringify({
          success: true,
          video: generateMockVideoResponse(),
          message: "Video generation initiated (mock)"
        }),
        { headers }
      );
    }
    
    // Parse request body
    const { text, avatar_id, webhook_url, metadata }: VideoRequest = await req.json();
    
    if (!text) {
      throw new Error("Text is required");
    }

    // This would be the actual Tavus API call
    console.log(`Would generate video with Tavus for text: ${text.substring(0, 50)}...`);
    
    /*
    // In a real implementation, you would call Tavus API like:
    const tavusResponse = await fetch("https://api.tavus.io/v1/videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TAVUS_API_KEY}`
      },
      body: JSON.stringify({
        script: text,
        avatar_id: avatar_id || "default",
        webhook_url,
        metadata
      })
    });

    if (!tavusResponse.ok) {
      const errorData = await tavusResponse.json();
      throw new Error(`Tavus API error: ${JSON.stringify(errorData)}`);
    }

    const videoData = await tavusResponse.json();
    */
    
    // Using mock response for development
    const videoData = generateMockVideoResponse();

    return new Response(
      JSON.stringify({
        success: true,
        video: videoData,
        message: "Video generation initiated"
      }),
      { headers }
    );
  } catch (error) {
    console.error("Error in video generation:", error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers, status: 500 }
    );
  }
});