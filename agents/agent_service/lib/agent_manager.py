import os
import json
import logging
import asyncio
import time
from typing import Dict, Any, List, Optional, Tuple
from .gemini_service import get_gemini_service
from .memory_service import get_memory_service
from .voice_service import get_voice_service
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get environment variables
AGENT_MEMORY_ENABLED = os.getenv("AGENT_MEMORY_ENABLED", "true").lower() == "true"
VOICE_ENABLED = os.getenv("VOICE_ENABLED", "true").lower() == "true"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

class AgentManager:
    """Manager for AI agents."""
    
    def __init__(self):
        """Initialize the agent manager."""
        self.gemini_service = get_gemini_service()
        self.memory_service = get_memory_service()
        self.voice_service = get_voice_service()
        self.agent_configs = {}
        self.agent_sessions = {}
        
        logger.info("🤖 Agent Manager initialized")
    
    async def execute_agent(
        self,
        agent_id: str,
        input_text: str,
        context: Dict[str, Any] = None
    ) -> Tuple[str, str]:
        """Execute an agent with the given input.
        
        Args:
            agent_id: The ID of the agent to execute.
            input_text: The input text for the agent.
            context: Additional context for the agent.
            
        Returns:
            Tuple of (output_text, chain_of_thought)
        """
        context = context or {}
        logger.info(f"🤖 Executing agent {agent_id} with input: {input_text[:50]}...")
        
        # Get agent configuration
        agent_config = await self._get_agent_config(agent_id, context)
        
        # Get agent memory if enabled
        agent_memory = ""
        if AGENT_MEMORY_ENABLED and context.get("memory_enabled", True):
            agent_memory = await self._get_agent_memory(agent_id)
        
        # Prepare system instruction
        system_instruction = self._prepare_system_instruction(agent_config, agent_memory)
        
        # Generate response
        output_text, chain_of_thought = await self.gemini_service.generate_content(
            prompt=input_text,
            system_instruction=system_instruction,
            temperature=context.get("temperature", 0.7),
            max_tokens=context.get("max_tokens", 1024)
        )
        
        # Store interaction in memory if enabled
        if AGENT_MEMORY_ENABLED and context.get("memory_enabled", True):
            await self._store_interaction_memory(
                agent_id=agent_id,
                input_text=input_text,
                output_text=output_text,
                context=context
            )
        
        # Generate voice response if enabled
        audio_data = None
        if VOICE_ENABLED and context.get("voice_enabled", False):
            try:
                voice_config = context.get("voice_config", {})
                voice_id = context.get("voice_id") or voice_config.get("voice_id")
                
                if voice_id:
                    audio_data = await self.voice_service.synthesize_speech(
                        text=output_text,
                        voice_id=voice_id,
                        stability=voice_config.get("stability", 0.5),
                        similarity_boost=voice_config.get("similarity_boost", 0.75),
                        style=voice_config.get("style", 0.0)
                    )
                    
                    logger.info(f"🔊 Generated voice response for agent {agent_id}")
            except Exception as e:
                logger.error(f"❌ Failed to generate voice response: {str(e)}")
        
        # Return the response
        return output_text, chain_of_thought
    
    async def _get_agent_config(
        self,
        agent_id: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Get agent configuration.
        
        Args:
            agent_id: The ID of the agent.
            context: Additional context that may contain agent configuration.
            
        Returns:
            Agent configuration dictionary.
        """
        # Check if we have a cached config
        if agent_id in self.agent_configs:
            return self.agent_configs[agent_id]
        
        # Check if config is provided in context
        if "agent_name" in context and "agent_role" in context:
            agent_config = {
                "name": context.get("agent_name", "AI Assistant"),
                "role": context.get("agent_role", "Assistant"),
                "description": context.get("agent_description", "Helps users with various tasks"),
                "tools": context.get("agent_tools", []),
                "personality": context.get("agent_personality", "Professional, helpful, and knowledgeable")
            }
            
            # Cache the config
            self.agent_configs[agent_id] = agent_config
            return agent_config
        
        # For simulation agent, create a special config
        if agent_id == "agent-simulator":
            agent_config = {
                "name": "Simulation Agent",
                "role": "Simulation Specialist",
                "description": "Tests and evaluates AI agent performance in simulated scenarios",
                "tools": ["Simulation Engine", "Performance Analytics", "Error Injection"],
                "personality": "Analytical, thorough, and detail-oriented"
            }
            
            # Cache the config
            self.agent_configs[agent_id] = agent_config
            return agent_config
        
        # In a real implementation, we would fetch from database
        # For now, create a mock config
        agent_config = {
            "name": f"Agent {agent_id}",
            "role": "AI Assistant",
            "description": "Helps users with various tasks and provides intelligent responses",
            "tools": ["Search", "Calculator", "Weather", "Calendar"],
            "personality": "Professional, helpful, and knowledgeable"
        }
        
        # Cache the config
        self.agent_configs[agent_id] = agent_config
        return agent_config
    
    async def _get_agent_memory(self, agent_id: str) -> str:
        """Get agent memory.
        
        Args:
            agent_id: The ID of the agent.
            
        Returns:
            String representation of agent memory.
        """
        try:
            # Get recent memories
            recent_memories = await self.memory_service.retrieve_recent_memories(
                agent_id=agent_id,
                limit=5
            )
            
            # Get important memories
            important_memories = await self.memory_service.retrieve_important_memories(
                agent_id=agent_id,
                limit=3
            )
            
            # Combine memories
            all_memories = recent_memories + [
                m for m in important_memories 
                if m not in recent_memories
            ]
            
            # Format memories
            if all_memories:
                memory_text = "Your memory contains the following information:\n\n"
                for i, memory in enumerate(all_memories):
                    memory_text += f"Memory {i+1}: {memory['content']}\n\n"
                return memory_text
            else:
                return "You don't have any specific memories yet."
        except Exception as e:
            logger.error(f"❌ Failed to retrieve agent memory: {str(e)}")
            return "Memory retrieval is currently unavailable."
    
    async def _store_interaction_memory(
        self,
        agent_id: str,
        input_text: str,
        output_text: str,
        context: Dict[str, Any]
    ) -> None:
        """Store interaction in agent memory.
        
        Args:
            agent_id: The ID of the agent.
            input_text: The input text from the user.
            output_text: The output text from the agent.
            context: Additional context.
        """
        try:
            # Create memory content
            memory_content = json.dumps({
                "user_input": input_text,
                "agent_response": output_text,
                "timestamp": time.time()
            })
            
            # Store in memory service
            await self.memory_service.store_memory(
                agent_id=agent_id,
                content=memory_content,
                memory_type="interaction",
                metadata={
                    "execution_id": context.get("executionId"),
                    "session_id": context.get("sessionId"),
                    "user_id": context.get("user_id")
                },
                importance=0.7,  # Default importance
                user_id=context.get("user_id")
            )
            
            logger.info(f"✅ Stored interaction in memory for agent {agent_id}")
        except Exception as e:
            logger.error(f"❌ Failed to store interaction in memory: {str(e)}")
    
    def _prepare_system_instruction(
        self,
        agent_config: Dict[str, Any],
        agent_memory: str
    ) -> str:
        """Prepare system instruction for the agent.
        
        Args:
            agent_config: The agent configuration.
            agent_memory: The agent memory.
            
        Returns:
            System instruction string.
        """
        system_instruction = f"""You are {agent_config['name']}, an advanced AI agent serving as a {agent_config['role']}.

Your primary responsibility: {agent_config['description']}

Your expertise includes: {', '.join(agent_config['tools'])}

Operating principles:
- Focus on delivering measurable business value
- Maintain high standards of quality and professionalism  
- Collaborate effectively with other agents in the guild
- Continuously learn and adapt to improve performance
- Escalate complex issues that require human intervention

Always think strategically, act efficiently, and communicate clearly.

Personality: {agent_config['personality']}

{agent_memory}
"""
        return system_instruction
    
    async def close(self):
        """Close the agent manager and its services."""
        await self.gemini_service.close()
        await self.memory_service.close()
        await self.voice_service.close()
        logger.info("✅ Agent Manager closed")


# Create a singleton instance for the service
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