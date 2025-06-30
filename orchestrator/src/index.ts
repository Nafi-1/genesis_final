import dotenv from 'dotenv';
dotenv.config();
import express, { response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createClient as createRedisClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import blueprintService from './services/blueprintService';
import agentService from './services/agentService';
import http from 'http';
import workflowService from './services/workflowService';
import memoryService from './services/memoryService';
import simulationService from './services/simulationService';
import deploymentService from './services/deploymentService';
import analyticsService from './services/analyticsService';
import voiceService from './services/voiceService';
import videoService from './services/videoService';
import communicationService from './services/communicationService';
import { error } from 'console';

// Configure rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

// Define node structure interface
interface NodeData {
  label: string;
  [key: string]: any;
}

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: NodeData;
}

// Initialize Express app
const app = express();
let PORT = parseInt(process.env.PORT || "3000");
const NODE_ENV = process.env.NODE_ENV || 'development';
const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';
console.log(`🚀 GenesisOS Orchestrator starting up at port ${PORT}`);
console.log(`🤖 Agent Service URL: ${AGENT_SERVICE_URL}`);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
let supabase: SupabaseClient | undefined;

// Initialize Redis client
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient: RedisClientType | undefined;

// Setup middleware
app.use(cors());
app.use(helmet()); // Adds security headers
app.use(express.json());
app.use(morgan('dev'));

// Apply rate limiting to API routes in production
if (NODE_ENV === 'production') {
  app.use('/api/', apiLimiter);
}

// Initialize clients
async function initializeClients() {
  // Initialize Supabase if URL and key are provided
  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your_supabase') && !supabaseKey.includes('your_supabase')) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized successfully');
  } else {
    console.warn('⚠️ Supabase credentials not configured - using mock data');
  }

  // Initialize Redis if URL is provided
  if (redisUrl && !redisUrl.includes('your_redis')) {
    try {
      console.log('🔄 Connecting to Redis:', redisUrl.substring(0, redisUrl.indexOf('@') + 1) + '***');
      redisClient = createRedisClient({ url: redisUrl });
      
      // Add connection event handlers for better logging
      redisClient.on('connect', () => console.log('✅ Redis client connected'));
      redisClient.on('error', (err) => console.error('❌ Redis client error:', err));
      redisClient.on('reconnecting', () => console.log('🔄 Redis client reconnecting...'));
      
      // Connect to Redis
      await redisClient.connect();
      
      // Test Redis connection
      try {
        await redisClient.set('orchestrator_test_key', 'connected', { EX: 60 });
        const testResult = await redisClient.get('orchestrator_test_key');
        if (testResult === 'connected') {
          console.log('✅ Redis connection test successful');
        } else {
          console.warn('⚠️ Redis connection test failed: unexpected result');
        }
      } catch (testError) {
        console.error('❌ Redis connection test failed:', testError);
      }
      
      console.log('✅ Redis client connected');
    } catch (error) {
      console.warn('⚠️ Redis connection failed - using in-memory cache instead');
      console.warn('⚠️ Using in-memory cache instead');
    }
  } else {
    if (redisUrl.includes('localhost')) {
      console.log('⚠️ Using localhost Redis URL. This may not work in all environments.');
      try {
        console.log('🔄 Attempting to connect to localhost Redis...');
        redisClient = createRedisClient({ url: redisUrl });
        await redisClient.connect();
        console.log('✅ Connected to localhost Redis successfully');
      } catch (error) {
        console.warn('⚠️ Failed to connect to localhost Redis:', error);
        console.log('ℹ️ Using in-memory cache instead');
      }
    } else {
      console.log('ℹ️ Redis not configured - using in-memory cache');
    }
  }
}

// API version endpoint
app.get(["/wizard/health", "/api/wizard/health"], async (req, res) => {
  const gemini_key = process.env.GEMINI_API_KEY;
  const elevenlabs_key = process.env.ELEVENLABS_API_KEY;
  const pinecone_key = process.env.PINECONE_API_KEY;
  const redis_url = process.env.REDIS_URL;
  
  const gemini_configured = Boolean(gemini_key && !gemini_key.startsWith('your_'));
  const elevenlabs_configured = Boolean(elevenlabs_key && !elevenlabs_key.startsWith('your_'));
  const pinecone_configured = Boolean(pinecone_key && !pinecone_key.startsWith('your_'));
  const redis_configured = Boolean(redis_url && !redis_url.startsWith('your_'));
  
  console.log(`Health check requested. Services: Gemini=${gemini_configured}, ElevenLabs=${elevenlabs_configured}, Pinecone=${pinecone_configured}, Redis=${redis_configured}`);
  
  return res.json({
    status: "healthy",
    message: "GenesisOS API is running",
    version: "1.0.0",
    phase: "4 - AI & Automation Core",
    integrations: {
      gemini: gemini_configured ? "configured" : "not configured",
      elevenlabs: elevenlabs_configured ? "configured" : "not configured",
      pinecone: pinecone_configured ? "configured" : "not configured",
      redis: redis_configured ? "configured" : "not configured"
    },
    features: {
      memory: true,
      voice: elevenlabs_configured,
      blueprint_generation: gemini_configured,
      workflow_execution: true,
      simulation: true,
      agent_memory: true,
      voice_synthesis: true
    }
  });
});

// Health check endpoint
app.get("/", (req, res) => {
  const gemini_key = process.env.GEMINI_API_KEY;
  const elevenlabs_key = process.env.ELEVENLABS_API_KEY;
  const pinecone_key = process.env.PINECONE_API_KEY;
  const redis_url = process.env.REDIS_URL;
  const agentServiceUrl = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';
  
  const gemini_configured = Boolean(gemini_key && !gemini_key.startsWith('your_'));
  const elevenlabs_configured = Boolean(elevenlabs_key && !elevenlabs_key.startsWith('your_'));
  const pinecone_configured = Boolean(pinecone_key && !pinecone_key.startsWith('your_'));
  const redis_configured = Boolean(redis_url && !redis_url.startsWith('your_'));
  
  // Determine available services
  const availableServices = [];
  if (gemini_configured) availableServices.push('Gemini AI');
  if (elevenlabs_configured) availableServices.push('ElevenLabs Voice');
  if (pinecone_configured) availableServices.push('Pinecone Vector DB');
  if (redis_configured) availableServices.push('Redis Cache');

  // Determine active service
  const activeService = gemini_configured ? 'Gemini AI' : 
                       elevenlabs_configured ? 'ElevenLabs Voice' : 
                       'Development Fallback';

  res.status(200).json({
    status: "healthy",
    message: "GenesisOS Orchestrator is running",
    version: process.env.npm_package_version || "1.0.0",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    phase: "3 - Backend Integration",
    availableServices,
    activeService,
    integrations: {
      gemini: gemini_configured ? "configured" : "not configured",
      elevenlabs: elevenlabs_configured ? "configured" : "not configured",
      pinecone: pinecone_configured ? "configured" : "not configured",
      redis: redis_configured ? "configured" : "not configured"
    },
    features: {
      memory: true,
      voice: elevenlabs_configured,
      blueprint_generation: gemini_configured
    }
  });
});

// API status endpoint
app.get(['/status', '/api/status'], async (req, res) => {
  try {
    // Check connection to agent service
    let agentServiceStatus = "unavailable";
    let agentServiceMessage = "Could not connect to agent service";
    
    try {
      const response = await axios.get(`${AGENT_SERVICE_URL}/`);
      agentServiceStatus = response.data.status || "unknown";
      agentServiceMessage = response.data.message || "Connected";
    } catch (error) {
      console.error('❌ Agent service health check failed:', error);
    }
    
    // Return comprehensive status
    res.json({
      orchestrator: {
        status: "healthy",
        message: "GenesisOS Orchestrator is running",
        version: process.env.npm_package_version || "1.0.0",
        uptime: process.uptime()
      },
      agent_service: {
        status: agentServiceStatus,
        message: agentServiceMessage,
        url: AGENT_SERVICE_URL
      },
      database: {
        status: supabase ? "connected" : "not configured",
        type: "supabase"
      },
      cache: {
        status: redisClient ? "connected" : "not configured",
        type: "redis"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      status: "error",
      message: `Failed to get service status: ${error.message}`
    });
  }
});

// Blueprint to Canvas generation endpoint
app.post(['/generateCanvas', '/canvas/generate', '/api/canvas/generate'], async (req, res) => {
  try {
    console.log('🎨 Canvas generation request received by Orchestrator');
    const blueprint = req.body.blueprint;
    
    try {
      // Validate blueprint
      if (!blueprint) {
        return res.status(400).json({ 
          error: 'Missing blueprint',
          message: 'Blueprint data is required'
        });
      }
      
      if (!blueprint.suggested_structure) {
        return res.status(400).json({ 
          error: 'Invalid blueprint structure',
          message: 'Blueprint must include suggested_structure'
        });
      }

      // Generate canvas nodes and edges using the blueprint service
      const { nodes, edges } = blueprintService.generateCanvasFromBlueprint(blueprint);
    
      console.log(`✅ Generated canvas with ${nodes.length} nodes and ${edges.length} edges`);
    
      return res.status(200).json({ 
        success: true,
        nodes,
        edges,
        message: 'Canvas generated successfully'
      });
    } catch (error: any) {
      console.error('❌ Error generating canvas:', error);
      return res.status(500).json({ 
        error: 'Failed to generate canvas',
        message: error.message || 'An unexpected error occurred'
      });
    }
  } catch (error: any) {
    console.error('❌ Error generating canvas:', error);
    return res.status(500).json({ 
      error: 'Failed to generate canvas',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Execute workflow endpoint
app.post(['/executeFlow', '/workflow/execute', '/api/workflow/execute'], async (req, res) => {
  try {
    console.log('🔄 Workflow execution request received by Orchestrator');
    const { flowId, nodes, edges, context = {} }: {
      flowId?: string;
      nodes: WorkflowNode[];
      edges: any[];
      context?: any;
    } = req.body;
    
    // Validate input
    if (!nodes || !nodes.length) {
      throw new Error('Workflow nodes are required');
    }

    console.log(`🔄 Starting flow execution with ${nodes.length} nodes`);
    
    // Execute the workflow using the workflow service
    const result = await workflowService.executeWorkflow(
      flowId || `flow-${uuidv4()}`,
      nodes,
      edges,
      context
    );
    
    console.log(`✅ Execution started: ${result.executionId}`);
    
    // Return execution ID immediately for async processing
    return res.status(202).json({ 
      executionId: result.executionId,
      message: 'Workflow execution started',
      status: 'running'
    });
  } catch (error: any) {
    console.error('❌ Error executing workflow:', error);
    return res.status(500).json({ 
      error: 'Failed to execute workflow',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Agent dispatch endpoint
app.post('/agentDispatch', async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('🤖 Agent dispatch request received');
    
    const { agent_id, input, context = {} } = req.body;
    
    if (!agent_id || !input) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'agent_id and input are required'
      });
    }

    console.log(`Dispatching to agent ${agent_id} with input: ${input.substring(0, 50)}...`);
    
    // Add request metadata
    const enhancedContext = {
      ...context,
      request_id: uuidv4(),
      timestamp: new Date().toISOString(),
      source: 'orchestrator',
      client_info: {
        ip: req.ip,
        user_agent: req.get('user-agent')
      },
      ...context
    };

    try {
      // Execute the agent using the agent service
      const response = await agentService.executeAgent(agent_id, input, context);
      
      console.log('Agent response received');
      res.json(response);
    } catch (error: any) {
      console.error('❌ Error dispatching to agent:', error);
      
      if (error.code === 'ECONNREFUSED' || error.message?.includes('connect')) {
        console.log('⚠️ Agent service unreachable, using fallback response');
        return res.json({
          output: `I processed your request about "${input}" and have generated a response using my fallback capabilities. For optimal results, please ensure the agent service is running.`,
          chain_of_thought: "Using fallback response generator since agent service is unavailable.",
          metadata: {
            processing_time_ms: Date.now() - startTime,
            model: "fallback"
          },
          status: "completed_fallback"
        });
      }
      
      res.status(500).json({ 
        error: error.message || 'Failed to dispatch to agent',
        status: 'error'
      });
    }
  } catch (error: any) {
    console.error('❌ Error in agent dispatch route:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process agent dispatch request',
      status: 'error'
    });
  }
});

// Create a new router for agent endpoints
const agentRouter = express.Router();

// Voice synthesis endpoint
agentRouter.post('/voice/synthesize', async (req, res) => {
  try {
    const { text, voice_id, stability, similarity_boost, style } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    // Try to use the method directly
    if (!voiceService.synthesizeSpeech) {
      console.log('🔊 synthesizeSpeech method not found, checking for synthesize method');
      // For backward compatibility, copy the synthesize method if it exists
      if (voiceService.synthesize) {
        voiceService.synthesizeSpeech = voiceService.synthesize;
      } else {
        return res.status(500).json({
          error: 'Voice synthesis method not available',
          success: false
        });
      }
    }
    
    if (!voiceService.synthesizeSpeech) {
      return res.status(500).json({
        error: 'Voice synthesis method not available',
        success: false
      });
    }
    
    const audio = await voiceService.synthesizeSpeech(text, voice_id, {
      stability,
      similarityBoost: similarity_boost,
      style
    });
    
    res.json({ 
      audio, 
      success: true, 
      format: 'audio/mpeg' 
    });
  } catch (error: any) {
    console.error('❌ Voice synthesis failed:', error);
    res.status(500).json({
      error: error.message || 'Failed to synthesize speech',
      success: false
    });
  }
});

// List available voices
agentRouter.get('/voice/voices', async (req, res) => {
  try {
    const voices = await voiceService.listVoices();
    res.json({ voices, count: voices.length, success: true });
  } catch (error: any) {
    console.error('❌ Failed to list voices:', error);
    res.status(500).json({
      error: error.message || 'Failed to list voices',
      success: false
    });
  }
});

// Video generation endpoint
agentRouter.post('/video/generate', async (req, res) => {
  try {
    const { text, avatar_id, webhook_url, metadata } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const result = await videoService.generateVideo(text, {
      avatarId: avatar_id,
      webhookUrl: webhook_url,
      metadata
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ Video generation failed:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate video',
      success: false
    });
  }
});

// Get video status
agentRouter.get('/video/status/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const status = await videoService.getVideoStatus(videoId);
    res.json(status);
  } catch (error: any) {
    console.error('❌ Failed to get video status:', error);
    res.status(500).json({
      error: error.message || 'Failed to get video status',
      success: false
    });
  }
});

// List available avatars
agentRouter.get('/video/avatars', async (req, res) => {
  try {
    const avatars = await videoService.listAvatars();
    res.json({ avatars, count: avatars.length, success: true });
  } catch (error: any) {
    console.error('❌ Failed to list avatars:', error);
    res.status(500).json({
      error: error.message || 'Failed to list avatars',
      success: false
    });
  }
});

// Mount the agent router
app.use('/api/agent', agentRouter);

// Analytics endpoints
const analyticsRouter = express.Router();

// Get agent analysis
analyticsRouter.post('/agent-analysis', async (req, res) => {
  try {
    const { agent_id, time_period } = req.body;
    
    if (!agent_id) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }
    
    const analysis = await analyticsService.getAgentAnalysis(agent_id, time_period);
    res.json(analysis);
  } catch (error: any) {
    console.error('❌ Failed to get agent analysis:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze agent',
      success: false
    });
  }
});

// Get guild analytics
analyticsRouter.get('/guilds/:guildId/analytics', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { period } = req.query;
    
    const analytics = await analyticsService.getGuildAnalytics(
      guildId, 
      period as string || 'week'
    );
    
    res.json(analytics);
  } catch (error: any) {
    console.error('❌ Failed to get guild analytics:', error);
    res.status(500).json({
      error: error.message || 'Failed to get analytics',
      success: false
    });
  }
});

// Mount the analytics router
app.use('/api/analytics', analyticsRouter);

// Deployment endpoints
const deploymentRouter = express.Router();

// Deploy a guild
deploymentRouter.post('/guild', async (req, res) => {
  try {
    const { blueprint, simulation_results, credentials } = req.body;
    
    if (!blueprint) {
      return res.status(400).json({ error: 'Blueprint is required' });
    }
    
    const result = await deploymentService.deployGuild(
      blueprint,
      simulation_results,
      credentials || {}
    );
    
    res.json(result);
  } catch (error: any) {
    console.error('❌ Guild deployment failed:', error);
    res.status(500).json({
      error: error.message || 'Failed to deploy guild',
      success: false
    });
  }
});

// Get deployment status
deploymentRouter.get('/status/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const status = await deploymentService.getDeploymentStatus(deploymentId);
    res.json(status);
  } catch (error: any) {
    console.error('❌ Failed to get deployment status:', error);
    res.status(500).json({
      error: error.message || 'Failed to get deployment status',
      success: false
    });
  }
});

// Mount the deployment router
app.use('/api/deployments', deploymentRouter);

// Get execution status endpoint
app.get('/execution/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    
    if (!executionId) {
      return res.status(400).json({ error: 'Execution ID is required' });
    }

    // Get the execution status from the workflow service
    const executionStatus = workflowService.getExecutionStatus(executionId);
    
    if (!executionStatus) {
      return res.status(404).json({
        error: 'Execution not found',
        message: `No execution found with ID: ${executionId}`
      });
    }
    
    res.json(executionStatus);
  } catch (error: any) {
    handleApiError(res, error, 'Failed to get execution status');
  }
});

// Blueprint generation endpoint
app.post(['/generateBlueprint', '/wizard/generate-blueprint', '/api/wizard/generate-blueprint'], async (req, res) => {
  try {
    console.log('🧠 Blueprint generation request received by Orchestrator');
    const { user_input } = req.body;
    
    if (!user_input) {
      return res.status(400).json({ 
        error: 'Missing user input',
        message: 'User input is required'
      });
    }
    
    console.log(`Generating blueprint for: ${user_input.substring(0, 50)}...`);
    
    try {
      // First try to use agent service for better blueprint generation
      try {
        console.log('🧪 Attempting to use agent service for blueprint generation');
        const agentServiceUrl = process.env.AGENT_SERVICE_URL || 'http://localhost:8001';
        
        // Try multiple endpoints that might work
        const endpoints = [
          '/generate-blueprint',
          '/v1/generate-blueprint',
          '/api/generate-blueprint'
        ];
        
        for (const endpoint of endpoints) {
          try {
            console.log(`🔄 Trying agent service endpoint: ${agentServiceUrl}${endpoint}`);
            
            const response = await axios.post(`${agentServiceUrl}${endpoint}`, {
              user_input
            }, {
              timeout: 10000,
              headers: { 'Content-Type': 'application/json' }
            });
            
              // If the error is an AxiosError, log the response status if available
              // Add type annotation to error
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (error && typeof error === 'object' && 'response' in (error as any) && (error as any).response) {
                console.error('Agent service responded with status:', (error as any).response.status);
              }
              console.error('Failed to parse JSON from Gemini response:', onerror instanceof Error ? onerror.message : String(onerror));
              return res.json(response.data);
            
          } catch (endpointError) {
            console.warn(`⚠️ Agent service endpoint ${endpoints} failed:`, endpointError instanceof Error ? endpointError.message : String(endpointError));
          }
        }
        
        throw new Error('All agent service endpoints failed');
      } catch (agentError) {
        console.warn('⚠️ Agent service unavailable, falling back to blueprint service:', agentError instanceof Error ? agentError.message : String(agentError));
        
        // Fall back to local blueprint service
        const blueprint = await blueprintService.generateBlueprint(user_input);
        console.log(`✅ Blueprint generated via blueprint service:`, blueprint.id);
        return res.json(blueprint);
      }
      
    } catch (error: any) {
      console.error('❌ Error generating blueprint:', error);
      return res.status(500).json({ 
        error: 'Failed to generate blueprint',
        message: error.message || 'An unexpected error occurred'
      });
    }
  } catch (error: any) {
    console.error('❌ Error in blueprint generation route:', error);
    return res.status(500).json({ 
      error: 'Failed to process blueprint generation request',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Run simulation endpoint
app.post(['/simulation/run', '/api/simulation/run'], async (req, res) => {
  try {
    console.log('🧪 Simulation request received');
    const config = req.body;
    
    if (!config.guild_id || !config.agents) {
      return res.status(400).json({ 
        error: 'Invalid simulation config',
        message: 'Guild ID and agents are required'
      });
    }
    
    try {
      // Run the simulation
      const results = await simulationService.runSimulation(config);
      
      console.log(`✅ Simulation completed: ${results.id}`);
      
      // Return the simulation results
      return res.json(results);
    } catch (error: any) {
      console.error('❌ Error running simulation:', error);
      return res.status(500).json({ 
        error: 'Failed to run simulation',
        message: error.message || 'An unexpected error occurred'
      });
    }
  } catch (error: any) {
    console.error('❌ Error in simulation route:', error);
    return res.status(500).json({ 
      error: 'Failed to process simulation request',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// Get simulation results endpoint
app.get('/simulation/:simulationId', async (req, res) => {
  try {
    const { simulationId } = req.params;
    
    if (!simulationId) {
      return res.status(400).json({ error: 'Simulation ID is required' });
    }
    
    // Get the simulation results
    const results = simulationService.getSimulationResults(simulationId);
    
    if (!results) {
      return res.status(404).json({
        error: 'Simulation not found',
        message: `No simulation found with ID: ${simulationId}`
      });
    }
    
    res.json(results);
  } catch (error: any) {
    console.error('❌ Error getting simulation results:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get simulation results',
      status: 'error'
    });
  }
});

// Centralized error handling for API endpoints
function handleApiError(res: express.Response, error: any, defaultMessage: string) {
  console.error(`❌ API Error: ${error}`);
  
  let statusCode = 500;
  let errorMessage = error.message || defaultMessage;
  
  // Determine appropriate status code based on error type
  if (error.status === 404 || errorMessage.includes('not found')) {
    statusCode = 404;
  } else if (error.status === 400 || 
            errorMessage.includes('invalid') || 
            errorMessage.includes('required')) {
    statusCode = 400;
  } else if (error.status === 401 || errorMessage.includes('unauthorized')) {
    statusCode = 401;
  } else if (error.status === 403 || errorMessage.includes('forbidden')) {
    statusCode = 403;
  }
  
  res.status(statusCode).json({ 
    error: errorMessage,
    status: 'error',
    timestamp: new Date().toISOString()
  });
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    const { source, event, payload } = req.body;
    
    console.log(`📡 Webhook received from ${source || 'unknown source'}`);
    console.log(`📡 Event: ${event || 'unspecified event'}`);
    
    // Process webhook event
    // In a real implementation, this would trigger relevant workflows
    
    res.status(200).json({ 
      received: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process webhook',
      status: 'error'
    });
  }
});

// Function to try starting the server on a port, and increment if already in use
function startServer(port: number) {
  const server = http.createServer(app);
  
  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is already in use. Trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('❌ Error starting orchestrator server:', err);
    }
  });
  
  server.on('listening', async () => {
    PORT = port; // Update the global PORT variable
    await initializeClients();
    console.log(`🚀 GenesisOS Orchestrator ready at http://localhost:${port}`);
    console.log(`📋 API Endpoints available:
    - POST /generateBlueprint
    - POST /generateCanvas
    - POST /executeFlow
    - GET /execution/:executionId
    - POST /agentDispatch
    - POST /simulation/run
    - GET /simulation/:simulationId
    - POST /webhook
    `);
  });
  
  server.listen(port);
}

// Start the server with the initial port
startServer(PORT);

process.on('SIGINT', async () => {
  console.log('🛑 GenesisOS Orchestrator shutting down...');
  
  // Close Redis client if it exists
  if (redisClient) {
    console.log('Closing Redis connection...');
    await redisClient.quit();
    console.log('✅ Redis client closed');
  }
  
  console.log('✅ GenesisOS Orchestrator shutdown complete - goodbye!');
  process.exit(0);
});