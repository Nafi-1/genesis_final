import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import memoryService from './memoryService';

dotenv.config();

// API URL from environment
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';

// Interface for agent execution input
interface AgentExecutionInput {
  input: string;
  context?: Record<string, any>;
}

// Interface for agent execution output
interface AgentExecutionOutput {
  output: string;
  chain_of_thought: string;
  status: string;
  audio?: string;
}

// Interface for agent configuration
interface AgentConfig {
  name: string;
  role: string;
  description: string;
  tools?: string[];
  personality?: string;
  memory_enabled?: boolean;
  voice_enabled?: boolean;
  voice_config?: Record<string, any>;
}

class AgentService {
  private apiClient: AxiosInstance;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // ms

  constructor() {
    this.apiClient = axios.create({
      baseURL: AGENT_SERVICE_URL,
      timeout: 60000, // 1 minute timeout for agent operations
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`🤖 Agent Service initialized with URL: ${AGENT_SERVICE_URL}`);
  }

  /**
   * Execute an agent with the given input
   */
  public async executeAgent(
    agent_id: string,
    input: string,
    context: Record<string, any> = {}
  ): Promise<AgentExecutionOutput> {
    // Add execution ID if not present
    if (!context.executionId) {
      context.executionId = `exec-${Date.now()}`;
    }
    
    // Prepare request payload
    const agentInput: AgentExecutionInput = {
      input,
      context
    };
    
    console.log(`🤖 Executing agent ${agent_id} with input: ${input.substring(0, 50)}...`);
    
    // Try to execute the agent with retries
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.apiClient.post(
          `/agent/${agent_id}/execute`,
          agentInput
        );
        
        const result = response.data as AgentExecutionOutput;
        console.log(`✅ Agent ${agent_id} executed successfully`);
        
        // Store in memory if enabled
        if (context.memory_enabled !== false) {
          const memoryContent = JSON.stringify({
            user_input: input,
            agent_response: result.output,
            agent_id,
            execution_id: context.executionId
          });
          
          await memoryService.storeMemory(
            agent_id,
            memoryContent,
            'interaction',
            { execution_id: context.executionId },
            0.7, // default importance
            context.user_id
          );
        }
        
        return result;
      } catch (error: any) {
        console.error(`❌ Attempt ${attempt}/${this.retryAttempts} - Error executing agent ${agent_id}:`, error.message);
        
        if (attempt === this.retryAttempts) {
          // If all retries failed, return a fallback response
          console.warn(`⚠️ All ${this.retryAttempts} attempts failed, using fallback response`);
          return this.getFallbackResponse(agent_id, input);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
    
    // Shouldn't reach here, but TypeScript wants a return
    return this.getFallbackResponse(agent_id, input);
  }

  /**
   * Configure an agent with the given settings
   */
  public async configureAgent(
    agent_id: string,
    config: AgentConfig
  ): Promise<{ success: boolean; message: string; agent_id: string }> {
    try {
      console.log(`🤖 Configuring agent ${agent_id} with name: ${config.name}`);
      
      const response = await this.apiClient.post(
        `/agent/${agent_id}/configure`,
        config
      );
      
      console.log(`✅ Agent ${agent_id} configured successfully`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error configuring agent ${agent_id}:`, error.message);
      throw new Error(`Failed to configure agent: ${error.message}`);
    }
  }

  /**
   * Clear an agent's memory
   */
  public async clearAgentMemory(agent_id: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🤖 Clearing memory for agent ${agent_id}`);
      
      const response = await this.apiClient.post(
        `/agent/${agent_id}/clear-memory`
      );
      
      console.log(`✅ Memory cleared for agent ${agent_id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error clearing memory for agent ${agent_id}:`, error.message);
      
      // Also try to clear memory in the local memory service
      await memoryService.clearAgentMemories(agent_id);
      
      return {
        success: false,
        message: `Failed to clear agent memory: ${error.message}`
      };
    }
  }

  /**
   * Get an agent's memories
   */
  public async getAgentMemories(
    agent_id: string,
    limit: number = 10
  ): Promise<{ memories: any[]; count: number }> {
    try {
      console.log(`🤖 Retrieving memories for agent ${agent_id}`);
      
      const response = await this.apiClient.get(
        `/agent/${agent_id}/memories?limit=${limit}`
      );
      
      console.log(`✅ Retrieved ${response.data.count} memories for agent ${agent_id}`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error retrieving memories for agent ${agent_id}:`, error.message);
      
      // Try to get memories from the local memory service as fallback
      const memories = await memoryService.retrieveRecentMemories(agent_id, limit);
      
      return {
        memories,
        count: memories.length
      };
    }
  }

  /**
   * Generate a blueprint based on user input
   */
  public async generateBlueprint(userInput: string): Promise<any> {
    try {
      console.log(`🧠 Generating blueprint for: ${userInput.substring(0, 50)}...`);
      
      const response = await this.apiClient.post(
        `/generate-blueprint`,
        { user_input: userInput }
      );
      
      console.log(`✅ Blueprint generated successfully`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error generating blueprint:`, error.message);
      throw new Error(`Failed to generate blueprint: ${error.message}`);
    }
  }

  /**
   * Synthesize speech from text
   */
  public async synthesizeSpeech(
    text: string,
    voice_id?: string
  ): Promise<string | null> {
    try {
      console.log(`🔊 Synthesizing speech: ${text.substring(0, 50)}...`);
      
      const response = await this.apiClient.post(
        `/synthesize-speech`,
        { text, voice_id }
      );
      
      if (response.data.success && response.data.audio) {
        console.log(`✅ Speech synthesized successfully`);
        return response.data.audio;
      } else {
        console.warn(`⚠️ Speech synthesis returned no audio data`);
        return null;
      }
    } catch (error: any) {
      console.error(`❌ Error synthesizing speech:`, error.message);
      return null;
    }
  }

  /**
   * Check if the agent service is healthy
   */
  public async checkHealth(): Promise<{ status: string; integrations: Record<string, string> }> {
    try {
      console.log(`🏥 Checking agent service health`);
      
      const response = await this.apiClient.get('/');
      
      console.log(`✅ Agent service is healthy`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error checking agent service health:`, error.message);
      throw new Error(`Agent service health check failed: ${error.message}`);
    }
  }

  /**
   * Generate a fallback response when agent service fails
   */
  private getFallbackResponse(
    agent_id: string,
    input: string
  ): AgentExecutionOutput {
    // Generate a generic fallback response
    return {
      output: `I processed your request about "${input}" and have generated a response using my fallback capabilities. For optimal results, please ensure the agent service is running.`,
      chain_of_thought: "Using fallback response generator since agent service is unavailable.",
      status: "completed_fallback"
    };
  }
}

// Create singleton instance
const agentService = new AgentService();

export default agentService;