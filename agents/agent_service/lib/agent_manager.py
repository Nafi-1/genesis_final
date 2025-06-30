import os
import json
import logging
import asyncio
import re
from typing import Dict, Any, List, Optional, Tuple, Callable
import httpx
from uuid import uuid4
from dotenv import load_dotenv
from .memory_service import get_memory_service
from .gemini_service import get_gemini_service
from .voice_service import get_voice_service

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")

# Agent configuration
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "gemini-flash")
AGENT_MEMORY_ENABLED = os.getenv("AGENT_MEMORY_ENABLED", "true").lower() == "true"
VOICE_ENABLED = os.getenv("VOICE_ENABLED", "true").lower() == "true"

class AgentManager:
    """Manager for handling agent operations and execution."""
    
    def __init__(self):
        """Initialize the agent manager."""
        self.agents = {}  # In-memory agent cache
        self.memory_service = get_memory_service()
        self.gemini_service = get_gemini_service()
        self.voice_service = get_voice_service()
        logger.info("🤖 Agent Manager initialized")
        
        # Define specialized agent handlers
        self.specialized_agents = {
            "seo": self._execute_seo_agent,
            "business": self._execute_business_agent,
            "analyst": self._execute_business_agent,  # Map to same handler
            "customer": self._execute_customer_support_agent,
            "support": self._execute_customer_support_agent,  # Map to same handler
            "data": self._execute_data_science_agent,
            "creative": self._execute_creative_agent,
            "content": self._execute_creative_agent,  # Map to same handler
            "dev": self._execute_developer_agent,
            "code": self._execute_developer_agent,  # Map to same handler
            "sales": self._execute_sales_agent,
            "revenue": self._execute_sales_agent,  # Map to same handler
            "marketing": self._execute_marketing_agent,
            "legal": self._execute_legal_agent,
            "finance": self._execute_finance_agent,
            "accounting": self._execute_finance_agent,  # Map to same handler
            "hr": self._execute_hr_agent,
            "agent-simulator": self._execute_simulation_agent
        }
        
        # Initialize HTTP client for external API calls
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def execute_agent(
        self,
        agent_id: str,
        input_text: str,
        context: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute an agent with the given input and context.
        
        Args:
            agent_id: The ID of the agent to execute.
            input_text: The text input for the agent.
            context: Additional context for the agent execution.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        logger.info(f"🤖 Executing agent {agent_id}")
        
        # Log request details at debug level
        logger.debug(f"Input text: {input_text[:100]}...")
        logger.debug(f"Context: {json.dumps(context)[:100]}...")
        
        # Process input with safety filters
        processed_input = self._preprocess_input(input_text)
        
        # Determine agent type and execution strategy
        agent_config = await self._get_agent_config(agent_id, context)
        
        # Determine which specialized handler to use
        agent_type = self._determine_agent_type(agent_id, agent_config)
        
        # Log the selected agent type
        logger.info(f"Agent type determined: {agent_type}")
        
        # Execute the appropriate specialized agent
        handler = self._get_agent_handler(agent_type)
        
        result, thought_process = await handler(
            processed_input,
            context,
            agent_config
        )
        
        # Post-process the result
        final_result = self._postprocess_output(result, agent_config)
        
        # Log completion
        logger.info(f"✅ Agent {agent_id} execution completed")
        
        return final_result, thought_process
        
    def _determine_agent_type(self, agent_id: str, agent_config: Dict[str, Any]) -> str:
        """Determine the agent type based on ID and role.
        
        Returns the agent type identifier (e.g., "seo", "business", etc.)
        """
        # Check ID prefix first
        if agent_id.startswith("seo_") or "seo" in agent_id:
            return "seo"
        elif agent_id.startswith("business_") or "business" in agent_id or "analyst" in agent_id:
            return "business"
        elif agent_id.startswith("customer_") or "support" in agent_id or "customer" in agent_id:
            return "customer"
        elif agent_id.startswith("data_") or "data" in agent_id:
            return "data"
        elif agent_id.startswith("dev_") or "dev" in agent_id or "code" in agent_id:
            return "dev"
        elif agent_id.startswith("creative_") or "creative" in agent_id or "content" in agent_id:
            return "creative"
        elif agent_id.startswith("sales_") or "sales" in agent_id or "revenue" in agent_id:
            return "sales"
        elif agent_id.startswith("marketing_") or "marketing" in agent_id:
            return "marketing"
        elif agent_id.startswith("legal_") or "legal" in agent_id:
            return "legal"
        elif agent_id.startswith("finance_") or "finance" in agent_id or "accounting" in agent_id:
            return "finance"
        elif agent_id.startswith("hr_") or "hr" in agent_id:
            return "hr"
        elif agent_id == "agent-simulator":
            return "agent-simulator"
            
        # If no match by ID, check role in config
        role = agent_config.get("role", "").lower()
        
        for agent_type, handler in self.specialized_agents.items():
            if agent_type in role:
                return agent_type
                
        # Default to generic
        return "generic"
        
    def _get_agent_handler(self, agent_type: str) -> Callable:
        """Get the handler function for a specific agent type."""
        handler = self.specialized_agents.get(agent_type)
        
        if handler:
            return handler
        
        # Default to generic handler if specialized one not found
        return self._execute_generic_agent
        
    def _preprocess_input(self, input_text: str) -> str:
        """Preprocess and sanitize user input.
        
        Args:
            input_text: The raw user input.
            
        Returns:
            Processed input text.
        """
        # Basic sanitation
        text = input_text.strip()
        
        # Remove any unsafe patterns (just a basic example)
        # In a real implementation, this would be more sophisticated
        text = re.sub(r'(?i)(?:https?://|www\.)(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', 
                     '[URL removed for security]', 
                     text)
        
        return text
        
    def _postprocess_output(self, output_text: str, agent_config: Dict[str, Any]) -> str:
        """Post-process agent output for consistency and safety.
        
        Args:
            output_text: The raw agent output.
            agent_config: The agent configuration.
            
        Returns:
            Processed output text.
        """
        # Basic formatting
        text = output_text.strip()
        
        # Add agent signature if configured
        if agent_config.get("add_signature", False):
            text += f"\n\n- {agent_config.get('name', 'AI Assistant')}"
            
        return text
    
    async def _get_agent_config(
        self, 
        agent_id: str, 
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get the agent configuration.
        
        Args:
            agent_id: The agent ID.
            context: The execution context.
            
        Returns:
            Agent configuration dictionary.
        """
        # For a real production implementation, this would fetch from a database
        # using the agent_id to look up the stored configuration

        # Extract agent type for configuration
        agent_type = self._determine_agent_type(agent_id, context)

        # Create or enhance configuration
        config = {
            "id": agent_id,
            "name": context.get("agent_name", f"{agent_type.capitalize()} Agent"),
            "role": context.get("agent_role", f"{agent_type.capitalize()} Specialist"),
            "description": context.get("agent_description", f"AI agent specialized in {agent_type} tasks"),
            "personality": context.get("agent_personality", "Professional, helpful, and knowledgeable"),
            "tools": context.get("agent_tools", []),
            "memory": context.get("memory_enabled", AGENT_MEMORY_ENABLED),
            "voice": context.get("voice_enabled", VOICE_ENABLED),
            "voice_id": context.get("voice_id", ELEVENLABS_VOICE_ID),
            "model": context.get("model", DEFAULT_MODEL),
            "temperature": context.get("temperature", self._get_default_temperature(agent_type)),
            "max_tokens": context.get("max_tokens", 1024),
            "add_signature": context.get("add_signature", False),
            "unsafe_mode": context.get("unsafe_mode", False)
        }
        
        return config
    
    def _get_default_temperature(self, agent_type: str) -> float:
        """Get the default temperature setting based on agent type.
        
        Args:
            agent_type: The agent type.
            
        Returns:
            Temperature value (0.0-1.0).
        """
        # More deterministic agents get lower temperature
        # More creative agents get higher temperature
        temperature_map = {
            "data": 0.1,       # Very deterministic
            "finance": 0.2,    # Very deterministic
            "legal": 0.2,      # Very deterministic
            "business": 0.3,   # Somewhat deterministic
            "seo": 0.4,        # Balanced
            "customer": 0.5,   # Balanced
            "marketing": 0.7,  # Somewhat creative
            "creative": 0.8,   # Very creative
        }
        
        return temperature_map.get(agent_type, 0.5)  # Default is 0.5 (balanced)
    
    async def _execute_generic_agent(
        self, 
        input_text: str, 
        context: Dict[str, Any],
        agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a generic agent.
        
        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # Construct the system prompt
        system_prompt = f"""
        You are {agent_config['name']}, an AI agent serving as a {agent_config['role']}.
        
        Your primary responsibility: {agent_config['description']}
        
        You have access to the following tools: {', '.join(agent_config['tools']) if agent_config['tools'] else 'No specific tools configured'}
        
        Personality: {agent_config['personality']}
        
        Please process the user's request and provide a helpful, accurate response.
        Think step-by-step and explain your reasoning process.
        """
        
        # Fetch recent memories if memory is enabled
        memories = []
        if agent_config['memory']:
            memories = await self.memory_service.retrieve_recent_memories(agent_config['id'], limit=3)
            
            # Add important memories too
            important_memories = await self.memory_service.retrieve_important_memories(agent_config['id'], limit=3)
            
            # Combine and deduplicate memories
            memory_ids = set(memory['id'] for memory in memories)
            for memory in important_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Search for relevant memories based on the input
        relevant_memories = []
        if agent_config['memory'] and input_text:
            try:
                search_results = await self.memory_service.search_memories(
                    agent_config['id'],
                    input_text,
                    limit=3,
                    use_semantic=True
                )
                
                # Add search results that aren't already in memories
                for memory in search_results:
                    if memory['id'] not in memory_ids:
                        relevant_memories.append(memory)
            except Exception as e:
                logger.error(f"❌ Error searching memories: {str(e)}")
        
        # Append memories to the prompt if available
        memory_context = ""
        if memories:
            memory_context = "\nRelevant context from previous interactions:\n"
            for i, memory in enumerate(memories, 1):
                memory_context += f"{i}. {memory['content']}\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}"
        
        if memory_context:
            full_prompt += f"\n\nRelevant context from previous interactions:\n{memory_context}"
            
        if relevant_memories:
            relevant_context = "\nRelevant information that might help with this request:\n"
            for i, memory in enumerate(relevant_memories, 1):
                relevant_context += f"{i}. {memory['content']}\n"
            
            full_prompt += f"\n{relevant_context}"
        
        # Use Gemini to generate response
        model = agent_config.get("model", DEFAULT_MODEL)
        temperature = agent_config.get("temperature", 0.7)
        max_tokens = agent_config.get("max_tokens", 1024)
        
        logger.info(f"Using model: {model} (temp: {temperature})")
        
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        # Store this interaction in memory if enabled
        if agent_config['memory']:
            # Process the conversation to store
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": context
            }
            
            # Store with appropriate metadata
            memory_id = await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={
                    "type": "conversation",
                    "execution_id": context.get("executionId", str(uuid4())),
                    "tokens": await self.gemini_service.count_tokens(output_text),
                    "model": model
                },
                importance=0.7,  # Standard importance for conversations
                user_id=context.get("user_id")
            )

            # If the conversation was particularly important, update its importance
            if any(keyword in input_text.lower() for keyword in ["important", "critical", "urgent", "remember"]):
                await self.memory_service.update_memory_importance(
                    agent_id=agent_config['id'],
                    memory_id=memory_id,
                    importance=0.9,  # Higher importance for marked items
                    metadata_updates={"important": True}
                )
                
            # If user expressed satisfaction, mark it
            if any(keyword in input_text.lower() for keyword in ["thanks", "thank you", "helpful", "great"]):
                await self.memory_service.update_memory_importance(
                    agent_id=agent_config['id'],
                    memory_id=memory_id,
                    importance=0.8,  # Higher importance for positive feedback
                    metadata_updates={"feedback": "positive"}
                )
                
            logger.info(f"✅ Stored conversation in memory for agent {agent_config['id']}")
        
        # Generate voice if enabled
        if agent_config['voice'] and self.voice_service.enabled:
            voice_id = agent_config.get('voice_id') or self.voice_service.voice_id
            audio_base64 = await self.voice_service.synthesize_speech(
                text=output_text,
                voice_id=voice_id
            )
            
            if audio_base64:
                logger.info(f"✅ Generated voice response for agent {agent_config['id']}")
                # In a real implementation, we would return the audio data too
        
        return output_text, chain_of_thought
    
    async def _execute_seo_agent(
        self, 
        input_text: str, 
        context: Dict[str, Any],
        agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute an SEO specialized agent.
        
        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # Customize system prompt for SEO agent
        system_prompt = f"""
        You are {agent_config['name']}, an expert SEO specialist with deep knowledge of search engine optimization, 
        keyword research, content optimization, and SEO strategy.

        Your primary responsibility: {agent_config['description'] or "To provide expert SEO advice and create SEO-optimized content"}

        Your expertise includes:
        - Keyword research and analysis
        - On-page and technical SEO
        - Content optimization for search engines
        - SEO strategy development
        - Metadata and schema optimization
        
        When responding:
        - Provide specific, actionable SEO recommendations
        - Include keyword suggestions when relevant
        - Explain SEO concepts clearly and concisely
        - Support advice with SEO best practices and recent data
        - Consider user search intent in all recommendations
        - Cite specific ranking factors when relevant
        - Structure content for featured snippets where appropriate
        - Always consider mobile optimization
        - Address Core Web Vitals when discussing page performance
        - Consider E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
        - Prioritize user experience alongside SEO techniques
        - Stay current with latest algorithm updates (helpful content update, etc.)
        
        Personality: {agent_config['personality'] or "Professional, data-driven, strategic, and pragmatic"}
        Tone: Clear, authoritative but accessible, focused on practical results.
        
        Please process the SEO-related request and provide expert guidance.
        """
        
        # Get relevant memories for SEO context
        memories = []
        if agent_config['memory']:
            # Get both recent and important memories
            recent_memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'],
                limit=3,
                memory_type="interaction"
            )
            important_memories = await self.memory_service.retrieve_important_memories(
                agent_config['id'],
                limit=2
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in recent_memories)
            for memory in important_memories:
                if memory['id'] not in memory_ids:
                    recent_memories.append(memory)
            
            memories = recent_memories
            
            # Also try to search for relevant memories based on the input
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=2
            )
            
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context for SEO specific details
        memory_context = ""
        if memories:
            memory_context = "\nRelevant SEO context from previous interactions:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and (content.startswith('{') or content.startswith('{')):
                    # Try to parse JSON content
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Previous query: {mem_data['user_input']}\n"
                            memory_context += f"   Response: {mem_data['agent_response'][:100]}...\n"
                        else:
                            memory_context += f"{i}. {content[:150]}...\n"
                    except:
                        memory_context += f"{i}. {content[:150]}...\n"
                else:
                    memory_context += f"{i}. {content[:150]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.4  # Lower temperature for more deterministic SEO advice
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "seo",
                    "query_keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={
                    "type": "seo_conversation",
                    "keywords": extract_keywords(input_text),
                    "execution_id": context.get("executionId", str(uuid4())),
                    "tokens": await self.gemini_service.count_tokens(output_text)
                },
                importance=0.8,  # Higher importance for SEO interactions
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought
    
    async def _execute_business_agent(
        self, 
        input_text: str, 
        context: Dict[str, Any], 
        agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a business analysis specialized agent.

        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.

        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # Customize system prompt for business analysis agent
        system_prompt = f"""
        You are {agent_config['name']}, an expert business analyst and strategic advisor with 
        deep experience in business strategy, market analysis, financial planning, and operational excellence.
        
        Your primary responsibility: {agent_config['description'] or "To provide insightful business analysis and strategic recommendations"}

        Your expertise includes:
        - Market research and competitive analysis
        - Business model evaluation
        - Financial modeling and forecasting
        - Operational efficiency optimization
        - Strategic planning and execution
        
        When responding:
        - Provide data-driven insights when possible
        - Include specific, actionable recommendations
        - Consider both short and long-term business implications
        - Be precise with numbers and metrics
        - Highlight potential risks and opportunities
        - Prioritize recommendations based on ROI
        - Structure analysis using frameworks when appropriate (SWOT, Porter's Five Forces, etc.)
        - Present information in easily scannable formats (bullet points, sections)
        - Include implementation steps for recommendations
        - Consider resource constraints and scalability
        - Provide measurable success metrics for suggested strategies
        - Adapt tone and technical depth to audience
        
        Personality: {agent_config['personality'] or "Strategic, analytical, and business-focused"}
        
        Please process the business-related request and provide expert analysis.
        """
        
        # Get relevant memories
        memories = []
        if agent_config['memory']:
            # Get both recent and important memories
            memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=5
            )
            
            # Also search for topic-specific memories
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=3
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in memories)
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nRelevant business context from previous interactions:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    # Try to parse JSON content
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Previous query: {mem_data['user_input']}\n"
                            memory_context += f"   Key insights: {mem_data['agent_response'][:150]}...\n"
                        else:
                            memory_context += f"{i}. {content[:150]}...\n"
                    except:
                        memory_context += f"{i}. {content[:150]}...\n"
                else:
                    memory_context += f"{i}. {content[:150]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt, 
            temperature=0.3  # Lower temperature for more precise business analysis
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "business_analysis",
                    "topic_keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={"type": "business_conversation"},
                importance=0.9,  # Higher importance for business analysis
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought
    
    async def _execute_customer_support_agent(
        self, 
        input_text: str, 
        context: Dict[str, Any],
        agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a customer support specialized agent.
        
        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # Customize system prompt for customer support agent
        system_prompt = f"""
        You are {agent_config['name']}, a helpful and empathetic customer support specialist
        with expertise in resolving customer issues and providing exceptional service.
        
        Your primary responsibility: {agent_config['description'] or "To provide friendly, efficient customer support"}
        
        Your expertise includes:
        - Addressing customer concerns with empathy
        - Troubleshooting common issues
        - Providing clear step-by-step instructions
        - Finding creative solutions to customer problems
        - De-escalating difficult situations
        
        When responding:
        - Be empathetic and understanding
        - Provide clear, actionable steps
        - Use a friendly, conversational tone
        - Always validate the customer's concerns
        - Focus on solutions, not just explanations
        
        Personality: {agent_config['personality'] or "Friendly, patient, and solution-oriented"}
        
        Please process the customer's request and provide helpful support.
        """
        
        # Get relevant memories
        memories = []
        if agent_config['memory']:
            # For customer support, recent interactions are important
            memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=3
            )
            
            # Also search for issue-specific memories
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=2
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in memories)
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nPrevious customer interactions:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    # Try to parse JSON content
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Customer: {mem_data['user_input']}\n"
                            memory_context += f"   Support: {mem_data['agent_response'][:100]}...\n"
                        else:
                            memory_context += f"{i}. {content[:100]}...\n"
                    except:
                        memory_context += f"{i}. {content[:100]}...\n"
                else:
                    memory_context += f"{i}. {content[:100]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.6  # Moderate temperature for creative but consistent support
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "customer_support",
                    "issue_keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={"type": "support_conversation"},
                importance=0.75,  # Moderate importance for support interactions
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought
    
    async def _execute_data_science_agent(
        self, 
        input_text: str,
        context: Dict[str, Any], 
        agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a data science specialized agent.
        
        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # Customize system prompt for data science agent
        system_prompt = f"""
        You are {agent_config['name']}, an expert data scientist with deep knowledge of
        data analysis, statistics, machine learning, and data visualization.
        
        Your primary responsibility: {agent_config['description'] or "To analyze data and provide data-driven insights"}

        Your expertise includes:
        - Statistical analysis and hypothesis testing
        - Machine learning model selection and evaluation
        - Data preprocessing and feature engineering
        - Data visualization and insight communication
        - Experimental design and A/B testing
        
        When responding:
        - Provide statistically sound analysis
        - Explain complex concepts clearly 
        - Suggest appropriate analytical approaches
        - Be precise about limitations and assumptions
        - Focus on actionable insights from data
        - Consider statistical significance and sample size issues
        - Discuss data quality and potential biases
        - Recommend visualizations where appropriate
        - Cite methodologies and technical approaches
        - Balance depth with accessibility based on audience
        - Highlight confidence levels in predictions and analysis
        - Provide interpretability for complex models
        
        Personality: {agent_config['personality'] or "Analytical, precise, and insightful"}
        
        Please process the data analysis request and provide expert guidance.
        """
        
        # Get relevant memories
        memories = []
        if agent_config['memory']:
            # For data science, both recent and topic-specific memories matter
            memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=3
            )
            
            # Also get important memories
            important_memories = await self.memory_service.retrieve_important_memories(
                agent_config['id'], limit=2
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in memories)
            for memory in important_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
            
            # Also search for topic-specific memories
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=2,
                use_semantic=True  # Use semantic search for data science
            )
            
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nRelevant data analysis context from previous interactions:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    # Try to parse JSON content
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Previous query: {mem_data['user_input']}\n"
                            memory_context += f"   Key findings: {mem_data['agent_response'][:150]}...\n"
                        else:
                            memory_context += f"{i}. {content[:150]}...\n"
                    except:
                        memory_context += f"{i}. {content[:150]}...\n"
                else:
                    memory_context += f"{i}. {content[:150]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt, 
            temperature=0.3  # Lower temperature for precise data analysis
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "data_science",
                    "analysis_keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={"type": "data_analysis"},
                importance=0.85,  # Higher importance for data analysis
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought
    
    async def _execute_developer_agent(
    self,
    input_text: str,
    context: Dict[str, Any],
    agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a developer specialized agent.
        
        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # Customize system prompt for developer agent
        system_prompt = f"""
        You are {agent_config['name']}, an expert software developer with deep knowledge of 
        programming, system architecture, and software engineering best practices.
        
        Your primary responsibility: {agent_config['description'] or "To provide expert technical guidance and code solutions"}
        
        Your expertise includes:
        - Programming languages and frameworks
        - System design and architecture
        - Debugging and troubleshooting
        - Code optimization
        - Software development methodologies
        - API design and implementation
        
        When responding:
        - Provide clear, well-structured code examples when appropriate
        - Explain technical concepts thoroughly
        - Consider performance, security, and maintainability
        - Suggest best practices and design patterns
        - Include relevant documentation links when helpful
        - Be precise about technical details
        - Consider tradeoffs between different approaches
        
        Personality: {agent_config['personality'] or "Technical, precise, and helpful"}
        
        Please process the development request and provide expert guidance.
        """
        
        # Get relevant memories
        memories = []
        if agent_config['memory']:
            memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=3
            )
            
            # Search for technical memories
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=2
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in memories)
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nRelevant technical context from previous interactions:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Previous query: {mem_data['user_input']}\n"
                            memory_context += f"   Technical solution: {mem_data['agent_response'][:150]}...\n"
                        else:
                            memory_context += f"{i}. {content[:150]}...\n"
                    except:
                        memory_context += f"{i}. {content[:150]}...\n"
                else:
                    memory_context += f"{i}. {content[:150]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.3  # Lower temperature for precise technical responses
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "development",
                    "technical_keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={"type": "technical_conversation"},
                importance=0.85,  # Higher importance for technical solutions
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought
        
    async def _execute_simulation_agent(
        self,
        input_text: str,
        context: Dict[str, Any],
        agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute the simulation agent, which is designed for testing other agents.
        
        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # This agent simulates responses for the simulation lab
        
        # Customize system prompt for simulation agent
        system_prompt = f"""
        You are a simulation agent that helps test and validate other AI agents. 
        Your responses should realistically simulate how an agent would respond in a production environment.
        
        When responding:
        - Be realistic about capabilities and limitations
        - Provide detailed responses that demonstrate the agent's expertise
        - Include appropriate technical details when relevant
        - Respond as if you are a specialized agent in the requested domain
        
        Personality: Professional, detailed, realistic, and data-driven
        
        If the user asks about a specific domain:
        - For support queries: Be empathetic and solution-focused
        - For business analysis: Be data-driven and strategic
        - For technical questions: Be precise and informative
        - For creative tasks: Be innovative while adhering to guidelines
        - For data science: Be analytical and methodical
        - For marketing: Be strategic and audience-focused
        - For sales: Be persuasive and value-oriented
        
        Please provide a realistic simulation response based on the user's input.
        """
        
        # Generate appropriate response for simulation
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=input_text,
            system_instruction=system_prompt,
            temperature=0.6  # Moderate temperature for realistic simulation
        )
        
        return output_text, chain_of_thought
    async def _execute_sales_agent(
    self,
    input_text: str,
    context: Dict[str, Any],
    agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a sales specialized agent."""
        # Customize system prompt for sales agent
        system_prompt = f"""
        You are {agent_config['name']}, an expert sales professional with deep knowledge of 
        sales techniques, customer engagement, and revenue generation.
        
        Your primary responsibility: {agent_config['description'] or "To provide expert sales guidance and strategies"}
        
        Your expertise includes:
        - Sales techniques and methodologies
        - Customer relationship management
        - Negotiation strategies
        - Sales pipeline management
        - Revenue growth strategies
        
        When responding:
        - Provide actionable sales advice
        - Include specific techniques when relevant
        - Consider both short-term and long-term sales goals
        - Be persuasive but authentic
        - Structure responses for maximum impact
        
        Personality: {agent_config['personality'] or "Persuasive, knowledgeable, and results-oriented"}
        
        Please process the sales-related request and provide expert guidance.
        """
        
        # Get relevant memories
        memories = []
        if agent_config['memory']:
            memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=3
            )
            
            # Search for sales-related memories
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=2
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in memories)
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nRelevant sales context:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Previous query: {mem_data['user_input']}\n"
                            memory_context += f"   Response: {mem_data['agent_response'][:150]}...\n"
                        else:
                            memory_context += f"{i}. {content[:150]}...\n"
                    except:
                        memory_context += f"{i}. {content[:150]}...\n"
                else:
                    memory_context += f"{i}. {content[:150]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.5  # Balanced temperature for sales responses
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "sales",
                    "keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={
                    "type": "sales_conversation",
                    "keywords": extract_keywords(input_text),
                    "execution_id": context.get("executionId", str(uuid4())),
                    "tokens": await self.gemini_service.count_tokens(output_text)
                },
                importance=0.8,
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought
    
    async def _execute_marketing_agent(
    self,
    input_text: str,
    context: Dict[str, Any],
    agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a marketing specialized agent."""
        system_prompt = f"""
        You are {agent_config['name']}, an expert marketing professional with deep knowledge of 
        digital marketing, branding, and customer engagement strategies.
        
        Your primary responsibility: {agent_config['description'] or "To provide expert marketing advice and campaign strategies"}
        
        Your expertise includes:
        - Digital marketing strategies
        - Brand positioning
        - Content marketing
        - Social media marketing
        - Marketing analytics
        - Customer acquisition
        - Campaign management
        
        When responding:
        - Provide data-driven marketing recommendations
        - Include specific strategy examples when relevant
        - Consider both brand awareness and conversion goals
        - Be creative but practical
        - Structure responses for maximum clarity
        
        Personality: {agent_config['personality'] or "Creative, analytical, and strategic"}
        
        Please process the marketing-related request and provide expert guidance.
        """
        
        # Get relevant memories
        memories = []
        if agent_config['memory']:
            memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=3
            )
            
            # Search for marketing-related memories
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=2
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in memories)
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nRelevant marketing context:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Previous query: {mem_data['user_input']}\n"
                            memory_context += f"   Response: {mem_data['agent_response'][:150]}...\n"
                        else:
                            memory_context += f"{i}. {content[:150]}...\n"
                    except:
                        memory_context += f"{i}. {content[:150]}...\n"
                else:
                    memory_context += f"{i}. {content[:150]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.7  # Slightly higher temperature for creative marketing responses
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "marketing",
                    "keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={
                    "type": "marketing_conversation",
                    "keywords": extract_keywords(input_text),
                    "execution_id": context.get("executionId", str(uuid4())),
                    "tokens": await self.gemini_service.count_tokens(output_text)
                },
                importance=0.8,
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought

    async def _execute_legal_agent(
    self,
    input_text: str,
    context: Dict[str, Any],
    agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a legal specialized agent."""
        system_prompt = f"""
        You are {agent_config['name']}, an expert legal professional with deep knowledge of 
        legal frameworks, contracts, and compliance requirements.
        
        Your primary responsibility: {agent_config['description'] or "To provide accurate legal information and guidance"}
        
        Your expertise includes:
        - Contract law
        - Corporate law
        - Intellectual property
        - Compliance regulations
        - Legal documentation
        - Risk assessment
        
        When responding:
        - Provide precise legal information
        - Include relevant statutes or precedents when applicable
        - Clearly distinguish between legal advice and general information
        - Be thorough but concise
        - Structure responses for maximum clarity
        
        Personality: {agent_config['personality'] or "Precise, thorough, and professional"}
        
        Please process the legal request and provide appropriate guidance.
        """
        
        # Get relevant memories
        memories = []
        if agent_config['memory']:
            memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=3
            )
            
            # Search for legal-related memories
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=2
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in memories)
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nRelevant legal context:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Previous query: {mem_data['user_input']}\n"
                            memory_context += f"   Response: {mem_data['agent_response'][:150]}...\n"
                        else:
                            memory_context += f"{i}. {content[:150]}...\n"
                    except:
                        memory_context += f"{i}. {content[:150]}...\n"
                else:
                    memory_context += f"{i}. {content[:150]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.3  # Lower temperature for precise legal responses
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "legal",
                    "keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={
                    "type": "legal_conversation",
                    "keywords": extract_keywords(input_text),
                    "execution_id": context.get("executionId", str(uuid4())),
                    "tokens": await self.gemini_service.count_tokens(output_text)
                },
                importance=0.9,  # High importance for legal matters
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought

    async def _execute_finance_agent(
    self,
    input_text: str,
    context: Dict[str, Any],
    agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a finance specialized agent."""
        system_prompt = f"""
        You are {agent_config['name']}, an expert financial professional with deep knowledge of 
        accounting, financial analysis, and investment strategies.
        
        Your primary responsibility: {agent_config['description'] or "To provide accurate financial information and analysis"}
        
        Your expertise includes:
        - Financial reporting
        - Investment analysis
        - Budgeting and forecasting
        - Risk management
        - Financial modeling
        - Accounting principles
        
        When responding:
        - Provide precise financial information
        - Include relevant calculations when applicable
        - Be data-driven and analytical
        - Structure responses for maximum clarity
        - Highlight key financial implications
        
        Personality: {agent_config['personality'] or "Analytical, precise, and professional"}
        
        Please process the financial request and provide appropriate guidance.
        """
        
        # Get relevant memories
        memories = []
        if agent_config['memory']:
            memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=3
            )
            
            # Search for finance-related memories
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=2
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in memories)
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nRelevant financial context:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Previous query: {mem_data['user_input']}\n"
                            memory_context += f"   Response: {mem_data['agent_response'][:150]}...\n"
                        else:
                            memory_context += f"{i}. {content[:150]}...\n"
                    except:
                        memory_context += f"{i}. {content[:150]}...\n"
                else:
                    memory_context += f"{i}. {content[:150]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.3  # Lower temperature for precise financial responses
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "finance",
                    "keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={
                    "type": "finance_conversation",
                    "keywords": extract_keywords(input_text),
                    "execution_id": context.get("executionId", str(uuid4())),
                    "tokens": await self.gemini_service.count_tokens(output_text)
                },
                importance=0.85,
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought

    async def _execute_hr_agent(
    self,
    input_text: str,
    context: Dict[str, Any],
    agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute an HR specialized agent."""
        system_prompt = f"""
        You are {agent_config['name']}, an expert HR professional with deep knowledge of 
        human resources management, employee relations, and organizational development.
        
        Your primary responsibility: {agent_config['description'] or "To provide expert HR guidance and support"}
        
        Your expertise includes:
        - Talent acquisition
        - Employee relations
        - Performance management
        - Training and development
        - HR policies and compliance
        - Organizational culture
        
        When responding:
        - Provide practical HR recommendations
        - Consider both employee and employer perspectives
        - Be professional and empathetic
        - Structure responses for maximum clarity
        - Highlight compliance considerations
        
        Personality: {agent_config['personality'] or "Professional, empathetic, and solution-oriented"}
        
        Please process the HR-related request and provide appropriate guidance.
        """
        
        # Get relevant memories
        memories = []
        if agent_config['memory']:
            memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=3
            )
            
            # Search for HR-related memories
            search_memories = await self.memory_service.search_memories(
                agent_config['id'], input_text, limit=2
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in memories)
            for memory in search_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nRelevant HR context:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Previous query: {mem_data['user_input']}\n"
                            memory_context += f"   Response: {mem_data['agent_response'][:150]}...\n"
                        else:
                            memory_context += f"{i}. {content[:150]}...\n"
                    except:
                        memory_context += f"{i}. {content[:150]}...\n"
                else:
                    memory_context += f"{i}. {content[:150]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.5  # Balanced temperature for HR responses
        )
        
        # Store the interaction in memory
        if agent_config['memory']:
            conversation_memory = {
                "user_input": input_text,
                "agent_response": output_text,
                "context": {
                    "type": "hr",
                    "keywords": extract_keywords(input_text)
                }
            }
            
            await self.memory_service.store_memory(
                agent_id=agent_config['id'],
                content=json.dumps(conversation_memory),
                memory_type="interaction",
                metadata={
                    "type": "hr_conversation",
                    "keywords": extract_keywords(input_text),
                    "execution_id": context.get("executionId", str(uuid4())),
                    "tokens": await self.gemini_service.count_tokens(output_text)
                },
                importance=0.8,
                user_id=context.get("user_id")
            )
        
        return output_text, chain_of_thought
        
    async def _execute_creative_agent(
        self,
        input_text: str,
        context: Dict[str, Any],
        agent_config: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Execute a creative/content specialized agent.
        
        Args:
            input_text: The text input.
            context: The execution context.
            agent_config: The agent configuration.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        # Customize system prompt for creative agent
        system_prompt = f"""
        You are {agent_config['name']}, a creative genius with exceptional talents in content creation, 
        storytelling, copywriting, and creative strategy.
        
        Your primary responsibility: {agent_config['description'] or "To create engaging, innovative content that resonates with audiences"}
        
        Your expertise includes:
        - Copywriting and content creation
        - Brand voice development
        - Storytelling and narrative design
        - Creative strategy and ideation
        - Audience engagement techniques
        
        When responding:
        - Create content that aligns with the requested style and tone
        - Demonstrate creativity while maintaining practical usability
        - Consider the audience and purpose of each creation
        - Provide rationale for creative choices when helpful
        - Balance innovation with strategic objectives
        - Show versatility in adapting to different content formats
        - Consider emotional impact alongside informational content
        - Incorporate brand voice consistently where specified
        
        Personality: {agent_config['personality'] or "Creative, imaginative, strategic, and audience-focused"}
        
        Please process the creative request and provide exceptional content.
        """
        
        # Get relevant memories
        memories = []
        if agent_config['memory']:
            # For creative agents, previous examples and feedback are important
            memories = await self.memory_service.retrieve_recent_memories(
                agent_config['id'], limit=3, 
                metadata_filter={"type": "feedback"}  # Prioritize feedback
            )
            
            # Get some important memories too
            important_memories = await self.memory_service.retrieve_important_memories(
                agent_config['id'], limit=3
            )
            
            # Combine and deduplicate
            memory_ids = set(memory['id'] for memory in memories)
            for memory in important_memories:
                if memory['id'] not in memory_ids:
                    memories.append(memory)
                    memory_ids.add(memory['id'])
        
        # Format memory context
        memory_context = ""
        if memories:
            memory_context = "\nRelevant creative context from previous work:\n"
            for i, memory in enumerate(memories, 1):
                content = memory['content']
                if isinstance(content, str) and content.startswith('{'):
                    # Try to parse JSON content
                    try:
                        mem_data = json.loads(content)
                        if 'user_input' in mem_data and 'agent_response' in mem_data:
                            memory_context += f"{i}. Previous request: {mem_data['user_input']}\n"
                            memory_context += f"   Response excerpt: {mem_data['agent_response'][:150]}...\n"
                        else:
                            memory_context += f"{i}. {content[:150]}...\n"
                    except:
                        memory_context += f"{i}. {content[:150]}...\n"
                else:
                    memory_context += f"{i}. {content[:150]}...\n"
        
        # Construct the full prompt
        full_prompt = f"{input_text}\n\n{memory_context}"
        
        # Use Gemini to generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=full_prompt,
            system_instruction=system_prompt,
            temperature=0.6  # Moderate temperature for realistic simulation
        )
        
        return output_text, chain_of_thought
    
    async def close(self):
        """Close all service connections."""
        await self.memory_service.close()
        await self.gemini_service.close()
        await self.voice_service.close()


# Helper function to extract keywords from text
def extract_keywords(text: str, max_keywords: int = 10) -> List[str]:
    """Extract key terms from a text string.
    
    Args:
        text: The input text.
        max_keywords: Maximum number of keywords to extract.
        
    Returns:
        List of extracted keywords.
    """
    # Simple implementation - split by spaces, remove common words, punctuation
    common_words = {
        "the", "a", "an", "and", "or", "but", "is", "are", "was", "were",
        "in", "on", "at", "to", "for", "with", "by", "about", "like",
        "from", "of", "as", "my", "our", "your", "their", "his", "her", "its",
        "i", "we", "you", "they", "he", "she", "it", "this", "that",
        "what", "which", "who", "whom", "whose", "when", "where", "why", "how",
        "can", "could", "would", "should", "will", "shall", "may", "might",
        "must", "have", "has", "had", "do", "does", "did", "am", "is", "are",
        "was", "were", "be", "been", "being"
    }
    
    # Tokenize and filter
    # More robust tokenization
    words = re.findall(r'\b[a-z0-9_\']+\b', text.lower())
    words = [word.strip(".,;:!?\"'()[]{}-") for word in words if len(word) > 2]
    keywords = [word for word in words if word and len(word) > 2 and word not in common_words]
    
    # Deduplicate
    unique_keywords = list(set(keywords))
    
    # Extract phrases (bigrams) for better context
    phrases = []
    for i in range(len(words) - 1):
        if words[i] not in common_words and words[i+1] not in common_words:
            phrases.append(f"{words[i]} {words[i+1]}")
    
    unique_phrases = list(set(phrases))
    
    # Get top keywords (by frequency)
    keyword_counts = {}
    
    # Count single words
    for word in unique_keywords:
        keyword_counts[word] = keywords.count(word)
        
    # Add phrases with a slight boost
    for phrase in unique_phrases:
        phrase_words = phrase.split()
        # Only include phrases that appear multiple times or contain important words
        if text.lower().count(phrase) > 1 or any(keywords.count(word) > 2 for word in phrase_words):
            keyword_counts[phrase] = text.lower().count(phrase) * 1.5  # Boost phrases
    
    sorted_keywords = sorted(unique_keywords, key=lambda x: keyword_counts[x], reverse=True)
    sorted_phrases = sorted(unique_phrases, key=lambda x: keyword_counts.get(x, 0), reverse=True)
    
    # Combine and deduplicate (prefer phrases over single words if they contain the same word)
    final_keywords = []
    for phrase in sorted_phrases[:max_keywords//2]:  # Use up to half the slots for phrases
        final_keywords.append(phrase)
        
    # Fill remaining slots with single words not already in phrases
    remaining_slots = max_keywords - len(final_keywords)
    if remaining_slots > 0:
        for word in sorted_keywords:
            if not any(word in phrase for phrase in final_keywords):
                final_keywords.append(word)
                remaining_slots -= 1
                if remaining_slots <= 0:
                    break
    
    return final_keywords


# Create a singleton instance for the agent manager
_agent_manager = None

def get_agent_manager() -> AgentManager:
    """Get the singleton AgentManager instance.
    
    Returns:
        AgentManager instance.
    """
    global _agent_manager
    if _agent_manager is None:
        _agent_manager = AgentManager()
    return _agent_manager