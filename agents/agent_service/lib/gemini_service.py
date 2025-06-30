import os
import time
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, Tuple, Union
import httpx
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get API key from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Gemini API configuration with corrected model names
GEMINI_API_URL = os.getenv("GEMINI_API_URL", "https://generativelanguage.googleapis.com/v1beta/models")
# Updated model names to match the current Gemini API
GEMINI_PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "gemini-1.5-pro")
GEMINI_PRO_VISION_MODEL = os.getenv("GEMINI_PRO_VISION_MODEL", "gemini-1.5-pro-vision")
GEMINI_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-1.5-flash-latest")  # Using the latest flash model
GEMINI_EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "embedding-001")
GEMINI_DEFAULT_MODEL = os.getenv("GEMINI_DEFAULT_MODEL", GEMINI_PRO_MODEL)
GEMINI_RETRY_ATTEMPTS = int(os.getenv("GEMINI_RETRY_ATTEMPTS", "3"))
GEMINI_RETRY_DELAY = float(os.getenv("GEMINI_RETRY_DELAY", "1.0"))
GEMINI_TIMEOUT = float(os.getenv("GEMINI_TIMEOUT", "60.0"))
GEMINI_REQUEST_CACHE_ENABLED = os.getenv("GEMINI_REQUEST_CACHE_ENABLED", "true").lower() == "true"
GEMINI_REQUEST_CACHE_TTL = int(os.getenv("GEMINI_REQUEST_CACHE_TTL", "3600"))
GEMINI_FALLBACK_TO_MOCK = os.getenv("GEMINI_FALLBACK_TO_MOCK", "true").lower() == "true"

class GeminiService:
    """Service for interacting with Google's Gemini AI models."""
    
    def __init__(self, 
                 api_key: Optional[str] = None, 
                 model: str = GEMINI_DEFAULT_MODEL, 
                 timeout: float = GEMINI_TIMEOUT,
                 retry_attempts: int = GEMINI_RETRY_ATTEMPTS,
                 retry_delay: float = GEMINI_RETRY_DELAY):
        """Initialize the Gemini service with API key and default model.
        
        Args:
            api_key: The Gemini API key. If None, will use environment variable.
            model: The Gemini model to use. Defaults to gemini-pro.
            timeout: Request timeout in seconds.
            retry_attempts: Number of retry attempts for failed requests.
            retry_delay: Delay between retry attempts in seconds.
        """
        self.api_key = api_key or GEMINI_API_KEY
        self.model = model
        self.client = httpx.AsyncClient(timeout=timeout)
        self.redis_client = None
        self.retry_attempts = retry_attempts
        self.retry_delay = retry_delay
        
        if not self.api_key or self.api_key.startswith("your_"):
            logger.warning("⚠️ No valid Gemini API key found. Using mock responses.")
            self.use_mock = True
        else:
            self.use_mock = False
            logger.info(f"🧠 Gemini service initialized with model: {model} (timeout: {timeout}s, retries: {retry_attempts})")
            
    async def initialize_cache(self, redis_url: Optional[str] = None):
        """Initialize Redis cache for request caching.
        
        Args:
            redis_url: Redis connection URL. If None, will use environment variable.
        """
        if not GEMINI_REQUEST_CACHE_ENABLED:
            logger.info("🧠 Gemini request caching is disabled")
            return
            
        redis_url = redis_url or os.getenv("REDIS_URL")
        if not redis_url or redis_url.startswith("your_"):
            logger.warning("⚠️ No valid Redis URL found. Request caching disabled.")
            return
            
        try:
            import redis.asyncio as redis
            self.redis_client = redis.from_url(redis_url)
            await self.redis_client.ping()
            logger.info("✅ Connected to Redis for Gemini request caching")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis: {str(e)}")
            logger.info("⚠️ Gemini request caching disabled")
            self.redis_client = None

    async def generate_content(
        self, 
        prompt: str, 
        system_instruction: Optional[str] = None, 
        temperature: float = 0.7,
        max_tokens: int = 1024, 
        top_p: float = 0.95, 
        top_k: int = 40,
        cache_key: Optional[str] = None,
        fallback_to_mock: Optional[bool] = None
    ) -> Tuple[str, str]:
        """Generate text content using Gemini model.
        
        Args:
            prompt: The text prompt to send to the model.
            system_instruction: Optional system instruction to guide the model.
            temperature: Controls randomness. Lower values make output more deterministic.
            max_tokens: Maximum number of tokens to generate.
            top_p: Nucleus sampling parameter.
            top_k: Top-k sampling parameter.
            cache_key: Optional key for caching. If None, will be generated from prompt.
            fallback_to_mock: Whether to fall back to mock responses if API fails.
            
        Returns:
            Tuple of (generated_text, chain_of_thought)
        """
        # Use mock if API key isn't valid or explicitly requested
        if self.use_mock or (fallback_to_mock is not None and fallback_to_mock):
            return self._generate_mock_response(prompt, system_instruction)
        
        # Check cache if enabled
        if self.redis_client and GEMINI_REQUEST_CACHE_ENABLED:
            cache_result = await self._check_cache(prompt, system_instruction, cache_key)
            if cache_result:
                logger.info("✅ Retrieved response from cache")
                return cache_result
        
        try:
            output_text, chain_of_thought = await self._make_api_request(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                top_k=top_k
            )
            
            # Store in cache if enabled
            if self.redis_client and GEMINI_REQUEST_CACHE_ENABLED:
                await self._store_in_cache(
                    prompt, system_instruction, output_text, chain_of_thought, cache_key
                )
            
            return output_text, chain_of_thought
        except Exception as error:
            logger.error(f"❌ Error calling Gemini API: {str(error)}")
            
            # If fallback is enabled, use mock response
            if GEMINI_FALLBACK_TO_MOCK:
                return (
                    f"I encountered an error while processing your request but I'll try to help based on my general knowledge.",
                    f"Exception: {str(error)}"
                )
            else:
                raise
                
    async def _make_api_request(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        top_p: float = 0.95,
        top_k: int = 40
    ) -> Tuple[str, str]:
        """Make an API request to Gemini with retry logic.
        
        Args:
            prompt: The text prompt to send to the model.
            system_instruction: Optional system instruction.
            temperature: Controls randomness.
            max_tokens: Maximum tokens to generate.
            top_p: Nucleus sampling parameter.
            top_k: Top-k sampling parameter.
        
        Returns:
            Tuple of (generated_text, chain_of_thought)
        """
        url = f"{GEMINI_API_URL}/{self.model}:generateContent?key={self.api_key}"
        
        # Construct request body
        request_body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
                "topP": top_p,
                "topK": top_k
            },
            "safetySettings": [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        }
        
        # Add system instruction if provided
        if system_instruction:
            request_body["systemInstruction"] = {"parts": [{"text": system_instruction}]}
            
        # Implement retry logic
        for attempt in range(self.retry_attempts):
            try:
                # Make API request
                start_time = time.time()
                response = await self.client.post(
                    url,
                    json=request_body
                )
                response_time = time.time() - start_time
                
                if response.status_code != 200:
                    error_msg = f"❌ Gemini API error: {response.status_code} {response.text[:1000]}"
                    logger.error(error_msg)
                    
                    if attempt < self.retry_attempts - 1:
                        wait_time = self.retry_delay * (attempt + 1)  # Exponential backoff
                        logger.info(f"Retrying in {wait_time:.1f}s (attempt {attempt + 1}/{self.retry_attempts})")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        raise Exception(error_msg)
                
                # Parse response
                response_data = response.json()
                
                # Extract the generated text
                output_text = ""
                chain_of_thought = f"API Response Time: {response_time:.2f}s\n"
                
                if "candidates" in response_data and response_data["candidates"]:
                    candidate = response_data["candidates"][0]
                    
                    if "content" in candidate and "parts" in candidate["content"]:
                        for part in candidate["content"]["parts"]:
                            if "text" in part:
                                output_text += part["text"]
                    
                    # Extract chain of thought if available
                    if "citationMetadata" in candidate:
                        chain_of_thought += "Citations:\n"
                        for citation in candidate["citationMetadata"].get("citations", []):
                            chain_of_thought += f"- {citation.get('title', 'Unknown source')}\n"
                    
                    if "safetyRatings" in candidate:
                        chain_of_thought += "\nSafety Ratings:\n"
                        for rating in candidate["safetyRatings"]:
                            chain_of_thought += f"- {rating.get('category', 'Unknown')}: {rating.get('probability', 'UNKNOWN')}\n"
                    
                    # If finishReason is present, add it to chain of thought
                    if "finishReason" in candidate:
                        chain_of_thought += f"\nFinish Reason: {candidate['finishReason']}\n"
                    
                    # Add model details
                    chain_of_thought += f"\nModel: {self.model}\n"
                    chain_of_thought += f"Temperature: {temperature}\n"
                    chain_of_thought += f"Max Tokens: {max_tokens}\n"
                else:
                    logger.warning("⚠️ Unexpected Gemini API response format")
                    if attempt < self.retry_attempts - 1:
                        wait_time = self.retry_delay * (attempt + 1)
                        logger.info(f"Retrying in {wait_time:.1f}s (attempt {attempt + 1}/{self.retry_attempts})")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        output_text = "I'm sorry, I encountered an issue processing your request."
                        chain_of_thought = f"Unexpected API response format: {str(response_data)[:500]}"
                
                logger.info(f"✅ Gemini response generated in {response_time:.2f}s")
                return output_text, chain_of_thought
                
            except Exception as e:
                logger.error(f"❌ Error in attempt {attempt + 1}/{self.retry_attempts}: {str(e)}")
                if attempt < self.retry_attempts - 1:
                    wait_time = self.retry_delay * (attempt + 1)
                    logger.info(f"Retrying in {wait_time:.1f}s")
                    await asyncio.sleep(wait_time)
                else:
                    raise
        
        # This should not be reached due to the exception in the last retry attempt
        raise Exception("All retry attempts failed")

    async def _check_cache(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        cache_key: Optional[str] = None
    ) -> Optional[Tuple[str, str]]:
        """Check if a response is cached.
        
        Args:
            prompt: The prompt text.
            system_instruction: Optional system instruction.
            cache_key: Optional explicit cache key.
            
        Returns:
            Cached response tuple or None if not found.
        """
        if not self.redis_client:
            return None
            
        try:
            # Generate cache key if not provided
            if cache_key is None:
                cache_key = f"gemini:{self.model}:{prompt}"
                if system_instruction:
                    cache_key += f":{system_instruction}"

            # Hash the cache key to prevent excessively long keys
            import hashlib
            hashed_key = hashlib.md5(cache_key.encode()).hexdigest()
            full_key = f"gemini_cache:{hashed_key}"

            # Try to get from cache
            cached_data = await self.redis_client.get(full_key)
            if cached_data:
                cached_response = json.loads(cached_data)
                return (cached_response["output_text"], cached_response["chain_of_thought"])
        except Exception as e:
            logger.error(f"❌ Error checking cache: {str(e)}")
        
        return None

    async def _store_in_cache(
        self,
        prompt: str,
        system_instruction: Optional[str],
        output_text: str,
        chain_of_thought: str,
        cache_key: Optional[str] = None
    ):
        """Store a response in the cache.
        
        Args:
            prompt: The prompt text.
            system_instruction: Optional system instruction.
            output_text: The generated text response.
            chain_of_thought: The chain of thought explanation.
            cache_key: Optional explicit cache key.
        """
        if not self.redis_client:
            return
        
        try:
            # Generate cache key if not provided
            if cache_key is None:
                cache_key = f"gemini:{self.model}:{prompt}"
                if system_instruction:
                    cache_key += f":{system_instruction}"
            
            # Hash the cache key
            import hashlib
            hashed_key = hashlib.md5(cache_key.encode()).hexdigest()
            full_key = f"gemini_cache:{hashed_key}"
            
            # Store in cache
            cached_response = {
                "output_text": output_text,
                "chain_of_thought": chain_of_thought,
                "timestamp": time.time()
            }
            
            await self.redis_client.setex(
                full_key,
                GEMINI_REQUEST_CACHE_TTL,
                json.dumps(cached_response)
            )
            
            logger.info(f"✅ Stored response in cache with TTL {GEMINI_REQUEST_CACHE_TTL}s")
        except Exception as e:
            logger.error(f"❌ Error storing in cache: {str(e)}")
    
    async def generate_blueprint(self, user_input: str) -> Dict[str, Any]:
        """Generate a GenesisOS blueprint from user input.
        
        Args:
            user_input: The user's description of what they want to build.
            
        Returns:
            A blueprint dictionary with guild structure.
        """
        if self.use_mock:
            return self._generate_mock_blueprint(user_input)
        
        try:
            # System instruction specific to blueprint generation
            system_instruction = """
            You are GenesisOS Blueprint Generator, an expert AI system architect specialized in designing 
            AI agent-based systems. Your role is to analyze user goals and create 
            structured blueprints for autonomous digital workforces.
            
            Your output must follow this exact JSON structure:
            {
                "id": "blueprint-[unique_id]",
                "user_input": "[original user input]",
                "interpretation": "[your understanding of the user's goal]",
                "suggested_structure": {
                    "guild_name": "[appropriate name for this guild]",
                    "guild_purpose": "[clear purpose statement]",
                    "agents": [
                        {
                            "name": "[agent name]",
                            "role": "[specific role]",
                            "description": "[detailed description]",
                            "tools_needed": ["[tool1]", "[tool2]", "..."]
                        }
                    ],
                    "workflows": [
                        {
                            "name": "[workflow name]",
                            "description": "[detailed description]",
                            "trigger_type": "[manual|schedule|webhook|event]"
                        }
                    ]
                }
            }
            
            Create coherent, business-focused blueprints with:
            - 2-5 specialized agents with distinct roles
            - 1-3 well-defined workflows
            - Appropriate tools for each agent
            - Realistic integrations (Slack, Email, Google Sheets, etc.)
            """
            
            # Design the prompt for Gemini
            prompt = f"""
            Create a complete blueprint for an AI-powered digital workforce based on this user goal:
            
            "{user_input}"
            
            Design a system of intelligent AI agents working together to achieve this goal.
            Include specialized agents with clear roles, appropriate tools, and workflow automations.
            """
            
            # Get response from Gemini
            output_text, chain_of_thought = await self.generate_content(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=0.7,
                max_tokens=2048
            )
            
            # Extract JSON from response
            try:
                # Look for JSON structure in the response
                json_start = output_text.find('{')
                json_end = output_text.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    json_str = output_text[json_start:json_end]
                    blueprint = json.loads(json_str)
                    
                    # Validate the blueprint has the required structure
                    if not self._validate_blueprint(blueprint):
                        logger.warning("⚠️ Generated blueprint is missing required fields")
                        blueprint = self._generate_mock_blueprint(user_input)
                    
                    logger.info(f"✅ Blueprint generated successfully with {len(blueprint['suggested_structure']['agents'])} agents")
                    return blueprint
                else:
                    logger.warning("⚠️ No valid JSON found in Gemini response")
                    return self._generate_mock_blueprint(user_input)
            except json.JSONDecodeError:
                logger.error(f"❌ Failed to parse JSON from Gemini response: {output_text[:200]}...")
                return self._generate_mock_blueprint(user_input)
        except Exception as e:
            logger.error(f"❌ Blueprint generation error: {str(e)}")
            return self._generate_mock_blueprint(user_input)
    
    async def generate_embeddings(self, texts: Union[str, List[str]]) -> List[List[float]]:
        """Generate embeddings for text using Gemini API.
        
        Args:
            texts: A single text string or list of text strings.
            
        Returns:
            List of embedding vectors (list of floats).
        """
        if self.use_mock:
            return self._generate_mock_embeddings(texts)
        
        # Convert single string to list for consistent processing
        if isinstance(texts, str):
            texts = [texts]
        
        try:
            url = f"{GEMINI_API_URL}/{GEMINI_EMBEDDING_MODEL}:embedContent?key={self.api_key}"
            
            embeddings = []
            
            # Process each text individually
            for text in texts:
                request_body = {
                    "model": f"models/{GEMINI_EMBEDDING_MODEL}",
                    "content": {
                        "parts": [{"text": text}]
                    }
                }
                
                response = await self.client.post(url, json=request_body)
                
                if response.status_code != 200:
                    logger.error(f"❌ Gemini embedding API error: {response.status_code} {response.text}")
                    # Return a mock embedding for this text
                    embeddings.append(self._generate_single_mock_embedding())
                    continue
                
                data = response.json()
                if "embedding" in data and "values" in data["embedding"]:
                    embeddings.append(data["embedding"]["values"])
                else:
                    logger.error(f"❌ Unexpected embedding response format: {data}")
                    embeddings.append(self._generate_single_mock_embedding())
            
            return embeddings
        
        except Exception as e:
            logger.error(f"❌ Error generating embeddings: {str(e)}")
            # Return mock embeddings as fallback
            return [self._generate_single_mock_embedding() for _ in texts]
    
    def _generate_mock_embeddings(self, texts: Union[str, List[str]]) -> List[List[float]]:
        """Generate mock embeddings for development/testing.
        
        Args:
            texts: Text or list of texts to generate embeddings for.
            
        Returns:
            List of embedding vectors.
        """
        if isinstance(texts, str):
            return [self._generate_single_mock_embedding()]
        else:
            return [self._generate_single_mock_embedding() for _ in texts]
    
    def _generate_single_mock_embedding(self, dimensions: int = 768) -> List[float]:
        """Generate a single mock embedding vector.
        
        Args:
            dimensions: Size of the embedding vector.
            
        Returns:
            List of floats representing an embedding vector.
        """
        import random
        return [random.uniform(-1, 1) for _ in range(dimensions)]
            
    def _validate_blueprint(self, blueprint: Dict[str, Any]) -> bool:
        """Validate that blueprint has all required fields.
        
        Args:
            blueprint: The blueprint to validate.
            
        Returns:
            True if valid, False otherwise.
        """
        # Check top-level keys
        required_keys = ["id", "user_input", "interpretation", "suggested_structure"]
        if not all(key in blueprint for key in required_keys):
            return False
        
        # Check suggested_structure
        structure = blueprint.get("suggested_structure", {})
        structure_keys = ["guild_name", "guild_purpose", "agents", "workflows"]
        if not all(key in structure for key in structure_keys):
            return False
        
        # Check agents
        agents = structure.get("agents", [])
        if not isinstance(agents, list) or len(agents) == 0:
            return False
        
        for agent in agents:
            agent_keys = ["name", "role", "description", "tools_needed"]
            if not all(key in agent for key in agent_keys):
                return False
        
        # Check workflows
        workflows = structure.get("workflows", [])
        if not isinstance(workflows, list) or len(workflows) == 0:
            return False
        
        for workflow in workflows:
            workflow_keys = ["name", "description", "trigger_type"]
            if not all(key in workflow for key in workflow_keys):
                return False
        
        return True
    
    def _generate_mock_blueprint(self, user_input: str) -> Dict[str, Any]:
        """Generate a mock blueprint when Gemini API is not available.
        
        Args:
            user_input: The user's description of what they want to build.
            
        Returns:
            A blueprint dictionary with guild structure.
        """
        logger.info("🔄 Generating mock blueprint as fallback")
        
        # Generate a guild name based on user input
        keywords = user_input.lower()
        if "customer" in keywords or "support" in keywords:
            guild_name = "Customer Success Intelligence Guild"
            purpose = "Automate and enhance customer support operations"
            agents = [
                {
                    "name": "Support Specialist",
                    "role": "Customer Support Lead",
                    "description": "Handles customer inquiries and resolves issues efficiently",
                    "tools_needed": ["Zendesk API", "Email API", "Knowledge Base"]
                },
                {
                    "name": "Analytics Expert",
                    "role": "Support Data Analyst",
                    "description": "Analyzes customer support data to identify trends and improvements",
                    "tools_needed": ["Google Analytics", "Database", "Reporting Tools"]
                }
            ]
            workflows = [
                {
                    "name": "Ticket Resolution Workflow",
                    "description": "Automatically processes and resolves customer support tickets",
                    "trigger_type": "webhook"
                }
            ]
        elif "sales" in keywords or "revenue" in keywords:
            guild_name = "Revenue Growth Guild"
            purpose = "Boost sales and optimize revenue generation"
            agents = [
                {
                    "name": "Sales Specialist",
                    "role": "Lead Generation Expert",
                    "description": "Identifies and qualifies sales leads for follow-up",
                    "tools_needed": ["CRM API", "LinkedIn API", "Email API"]
                },
                {
                    "name": "Revenue Analyst",
                    "role": "Sales Performance Analyst",
                    "description": "Analyzes sales data and recommends optimization strategies",
                    "tools_needed": ["Spreadsheet", "Data Visualization", "CRM API"]
                }
            ]
            workflows = [
                {
                    "name": "Lead Nurturing Sequence",
                    "description": "Automatically nurtures leads through email sequences",
                    "trigger_type": "schedule"
                }
            ]
        elif "marketing" in keywords or "content" in keywords:
            guild_name = "Marketing Intelligence Guild"
            purpose = "Drive marketing campaigns and content creation"
            agents = [
                {
                    "name": "Content Creator",
                    "role": "Content Marketing Specialist",
                    "description": "Generates and publishes marketing content across channels",
                    "tools_needed": ["CMS API", "SEO Tools", "Social Media API"]
                },
                {
                    "name": "Campaign Manager",
                    "role": "Marketing Campaign Orchestrator",
                    "description": "Plans and executes marketing campaigns and tracks results",
                    "tools_needed": ["Analytics API", "Email Marketing", "Ad Platform API"]
                }
            ]
            workflows = [
                {
                    "name": "Content Calendar Automation",
                    "description": "Manages content publishing schedule across platforms",
                    "trigger_type": "schedule"
                }
            ]
        else:
            guild_name = "Business Automation Guild"
            purpose = "Automate core business processes and operations"
            agents = [
                {
                    "name": "Operations Manager",
                    "role": "Process Automation Specialist",
                    "description": "Oversees business process automation and optimization",
                    "tools_needed": ["Database", "API Integration", "Workflow Engine"]
                },
                {
                    "name": "Business Analyst",
                    "role": "Data Analysis Expert",
                    "description": "Analyzes business metrics and provides actionable insights",
                    "tools_needed": ["Analytics Tools", "Data Visualization", "Database"]
                }
            ]
            workflows = [
                {
                    "name": "Business Metrics Report",
                    "description": "Automatically generates and distributes business performance reports",
                    "trigger_type": "schedule"
                }
            ]
        
        # Create a unique blueprint ID
        blueprint_id = f"blueprint-{int(time.time())}"
        
        # Create the blueprint structure
        blueprint = {
            "id": blueprint_id,
            "user_input": user_input,
            "interpretation": f"I understand you want to {user_input}. I've created a blueprint to help you achieve this through an intelligent AI guild.",
            "suggested_structure": {
                "guild_name": guild_name,
                "guild_purpose": purpose,
                "agents": agents,
                "workflows": workflows
            }
        }
        
        return blueprint
    
    def _generate_mock_response(self, prompt: str, system_instruction: Optional[str] = None) -> Tuple[str, str]:
        """Generate a mock response when Gemini API is not available.
        
        Args:
            prompt: The text prompt.
            system_instruction: Optional system instruction.
            
        Returns:
            Tuple of (mock_response, chain_of_thought)
        """
        # Simple keyword-based mock responses
        prompt_lower = prompt.lower()
        
        if "hello" in prompt_lower or "hi " in prompt_lower:
            response = "Hello! I'm your AI assistant. How can I help you today?"
            chain_of_thought = "Identified greeting, responding with a friendly welcome message."
        elif "blueprint" in prompt_lower:
            response = "I can help you create a blueprint for your business automation needs. Would you like me to analyze your requirements and suggest an AI agent structure?"
            chain_of_thought = "Detected blueprint-related query. Offering to create a GenesisOS blueprint."
        elif "agent" in prompt_lower:
            response = "AI agents can handle specialized tasks in your business. They can be configured with different roles, tools, and capabilities to automate workflows."
            chain_of_thought = "Query about agents. Providing general information about AI agent capabilities."
        elif "workflow" in prompt_lower:
            response = "Workflows connect your AI agents to accomplish complex business processes. They can be triggered manually, on a schedule, or by external events."
            chain_of_thought = "Query about workflows. Explaining how workflows function within GenesisOS."
        else:
            # Generic response for other queries
            response = f"I've analyzed your request about '{prompt}'. To help you better, could you provide more details about your specific business needs or goals?"
            chain_of_thought = "General query received. Requesting more specific information to provide a tailored response."
        
        if system_instruction:
            chain_of_thought = f"System instruction: {system_instruction[:100]}...\n" + chain_of_thought
        
        chain_of_thought += "\nNOTE: This is a mock response generated without using the Gemini API."
        
        return response, chain_of_thought
    
    async def count_tokens(self, text: str) -> int:
        """Count the number of tokens in a text string.
        
        Note: This is a simple approximation. In a real implementation,
        we would use the tokenizer from the model provider.
        
        Args:
            text: Text to count tokens for.
        
        Returns:
            Estimated token count.
        """
        # Simple approximation: 1 token ≈ 4 chars for English text
        return len(text) // 4 + 1

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
        
        if self.redis_client:
            await self.redis_client.close()
            logger.info("✅ Redis client closed")


# Create a singleton instance for the service
_gemini_service = None

def get_gemini_service(api_key: Optional[str] = None, model: str = GEMINI_DEFAULT_MODEL) -> GeminiService:
    """Get the singleton GeminiService instance.
    
    Args:
        api_key: Optional API key override.
        model: Optional model override.
        
    Returns:
        GeminiService instance.
    """
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService(api_key, model)
    return _gemini_service