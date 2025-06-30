// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface TtsRequest {
  text: string;
  voice_id?: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

const defaultVoiceId = "21m00Tcm4TlvDq8ikWAM"; // Default ElevenLabs voice ID

serve(async (req) => {
  // CORS headers for development and production
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
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.startsWith("your_")) {
      throw new Error("ElevenLabs API key is not configured");
    }
    
    // Parse request body
    const { text, voice_id, stability, similarity_boost, style, use_speaker_boost }: TtsRequest = await req.json();
    
    if (!text) {
      throw new Error("Text is required");
    }

    // Prepare request to ElevenLabs
    const voiceId = voice_id || defaultVoiceId;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    
    const body = JSON.stringify({
      text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: stability !== undefined ? stability : 0.5,
        similarity_boost: similarity_boost !== undefined ? similarity_boost : 0.75,
        style: style !== undefined ? style : 0.0,
        use_speaker_boost: use_speaker_boost !== undefined ? use_speaker_boost : true
      }
    });

    // Send request to ElevenLabs
    console.log(`Sending TTS request to ElevenLabs for text: ${text.substring(0, 50)}...`);
    
    const elevenlabsResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
      },
      body
    });

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text();
      throw new Error(`ElevenLabs API error (${elevenlabsResponse.status}): ${errorText}`);
    }

    // Get audio data from ElevenLabs
    const audioData = await elevenlabsResponse.arrayBuffer();
    
    // Convert audio data to base64
    const audioBase64 = btoa(
      String.fromCharCode(...new Uint8Array(audioData))
    );

    console.log(`Successfully generated speech: ${audioBase64.length} bytes`);

    return new Response(
      JSON.stringify({
        success: true,
        audio: audioBase64,
        format: "audio/mpeg",
        stats: {
          characters: text.length,
          processing_time: new Date().getTime()
        }
      }),
      { headers }
    );
  } catch (error) {
    console.error("Error in voice synthesis:", error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers, status: 500 }
    );
  }
});