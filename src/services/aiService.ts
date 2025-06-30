/**
 * Service for interacting with AI models
 */
export const aiService = {
  /**
   * Get the list of available AI models
   */
  getAvailableModels: (): AIModel[] => {
    return AVAILABLE_MODELS;
  },
  
  /**
   * Get model by ID
   */
  getModelById: (id: string): AIModel | undefined => {
    return AVAILABLE_MODELS.find(model => model.id === id);
  },
  
  /**
   * Generate text with Gemini model
   */
  generateWithGemini: async (
    prompt: string, 
    options?: {
      modelId?: string;
      temperature?: number;
      maxOutputTokens?: number;
      system?: string;
      safetySettings?: any;
    }
  ): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    // If API key is not available, return a mock response
    if (!apiKey || apiKey === 'your_gemini_api_key' || import.meta.env.DEV) {
      console.log('🧠 Using mock Gemini response for prompt:', prompt.substring(0, 50) + '...');
      return generateMockResponse(prompt, options?.system);
    }
    
    try {
      // Determine which model to use
      const modelId = options?.modelId || 'gemini-pro';
      // Use Gemini 1.5 API for Sprint 3 enhanced intelligence
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelId}:generateContent?key=${apiKey}`;
      
      // Prepare the request body
      const requestBody: any = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generation_config: {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: options?.maxOutputTokens || 1024,
        }
      };
      
      // Add system instructions if provided
      if (options?.system) {
        requestBody.systemInstruction = {
          parts: [
            {
              text: options.system
            }
          ]
        };
      }
      
      // Add safety settings if provided
      if (options?.safetySettings) {
        requestBody.safetySettings = options.safetySettings;
      }
      
      // Make the API request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract the generated text from the response
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return generatedText;
    } catch (error) {
      console.error('Failed to generate text with Gemini:', error);
      return generateMockResponse(prompt, options?.system);
    }
  },
  
  /**
   * Generate embeddings with Gemini
   */
  generateEmbeddings: async (text: string): Promise<number[]> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    // If API key is not available, return a mock embedding
    if (!apiKey || apiKey === 'your_gemini_api_key' || import.meta.env.DEV) {
      console.log('🧠 Using mock embedding for text:', text.substring(0, 50) + '...');
      return generateMockEmbedding();
    }
    
    try {
      // Make the API request to the embeddings endpoint
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/embedding-001:embedContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'models/embedding-001',
          content: {
            parts: [
              {
                text
              }
            ]
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Gemini embedding API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract the embedding from the response
      return data.embedding.values || [];
    } catch (error) {
      console.error('Failed to generate embeddings:', error);
      return generateMockEmbedding();
    }
  },
  
  /**
   * Create a system prompt for a guild/agent
   */
  createSystemPrompt: (type: 'agent' | 'guild', data: any): string => {
    if (type === 'agent') {
      return createAgentSystemPrompt(data);
    } else {
      return createGuildSystemPrompt(data);
    }
  }
};

/**
 * Interface for AI model metadata
 */
export interface AIModel {
  id: string;
  name: string;
  provider: 'google' | 'openai' | 'anthropic';
  description: string;
  capabilities: string[];
  contextWindow: number;
  tokenLimit: number;
  pricing: {
    input: number; // per 1M tokens
    output: number; // per 1M tokens
  };
  status: 'available' | 'coming_soon' | 'deprecated';
}

/**
 * Available AI models
 */
export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'gemini-flash',
    name: 'Gemini Flash',
    provider: 'google',
    description: 'Fast, efficient model for everyday tasks',
    capabilities: ['text generation', 'chat', 'summarization'],
    contextWindow: 128000,
    tokenLimit: 2048,
    pricing: {
      input: 0.25,
      output: 0.50
    },
    status: 'available'
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    description: 'Advanced model with stronger reasoning capabilities',
    capabilities: ['text generation', 'chat', 'reasoning', 'code generation'],
    contextWindow: 1000000,
    tokenLimit: 8192,
    pricing: {
      input: 0.50,
      output: 1.50
    },
    status: 'available'
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    description: 'Balanced model for a wide range of tasks',
    capabilities: ['text generation', 'chat', 'reasoning', 'code generation', 'vision'],
    contextWindow: 200000,
    tokenLimit: 4096,
    pricing: {
      input: 3.0,
      output: 15.0
    },
    status: 'available'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'OpenAI\'s most powerful model',
    capabilities: ['text generation', 'chat', 'reasoning', 'code generation', 'vision'],
    contextWindow: 128000,
    tokenLimit: 4096,
    pricing: {
      input: 10.0,
      output: 30.0
    },
    status: 'available'
  }
];

/**
 * Generate a mock response for development
 */
function generateMockResponse(prompt: string, system?: string): string {
  // Simulate some processing time
  const promptLower = prompt.toLowerCase();
  
  // Parse the prompt to generate a relevant response
  if (promptLower.includes('hello') || promptLower.includes('hi ')) {
    return "Hello! I'm your AI assistant powered by Gemini. How can I help you today?";
  }
  
  if (promptLower.includes('help') || promptLower.includes('what can you do')) {
    return "I can help you with a variety of tasks, including answering questions, generating content, analyzing data, brainstorming ideas, and much more. Just let me know what you need assistance with!";
  }
  
  if (promptLower.includes('weather')) {
    return "I don't have real-time weather data, but I can help you find weather information from reliable sources or assist with weather-related analyses.";
  }
  
  if (promptLower.includes('blueprint') || promptLower.includes('design')) {
    return "I can help design an AI-powered workflow that meets your business needs. This would involve identifying key agents, their responsibilities, and how they coordinate to achieve your goals efficiently.";
  }
  
  if (promptLower.includes('code') || promptLower.includes('program')) {
    return "I can assist with code generation, debugging, and explaining programming concepts. What specifically would you like help with?";
  }
  
  // Default response that seems smart and contextual
  return `I've analyzed your request: "${prompt}"\n\nBased on my understanding, I can assist by providing insights, generating relevant content, or helping you implement a solution. Could you specify what aspect you'd like me to focus on?`;
}

/**
 * Generate a mock embedding for development
 */
function generateMockEmbedding(): number[] {
  return Array.from({ length: 768 }, () => Math.random() * 2 - 1);
}

/**
 * Create a system prompt for an agent
 */
function createAgentSystemPrompt(agent: any): string {
  return `You are ${agent.name}, an advanced AI agent serving as a ${agent.role}. 

Your primary responsibility: ${agent.description}

Your expertise includes: ${agent.tools?.join(', ') || 'various professional tools and techniques'}

Operating principles:
- Focus on delivering measurable business value
- Maintain high standards of quality and professionalism  
- Collaborate effectively with other agents in the guild
- Continuously learn and adapt to improve performance
- Escalate complex issues that require human intervention

Always think strategically, act efficiently, and communicate clearly.

Personality: ${agent.personality || 'Professional, intelligent, and focused on delivering exceptional results through strategic thinking and efficient execution.'}`;
}

/**
 * Create a system prompt for a guild
 */
function createGuildSystemPrompt(guild: any): string {
  return `You are the coordinating intelligence for ${guild.name}, an AI-powered guild designed to ${guild.purpose}

Guild capabilities:
- Orchestration of multiple specialized AI agents
- Workflow automation and optimization
- Intelligent task routing and prioritization
- Memory management across all agents
- Learning and adaptation over time

Operating principles:
- Optimize for business outcomes and user satisfaction
- Maintain data privacy and security
- Ensure transparency in decision-making
- Provide clear explanations of actions taken
- Escalate to human supervision when appropriate

Your guild contains the following agents:
${guild.agents?.map((agent: any) => `- ${agent.name} (${agent.role}): ${agent.description}`).join('\n') || 'No agents configured yet.'}

Always prioritize coordination efficiency and overall goal achievement.`;
}