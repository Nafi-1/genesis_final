import os
import time
import json
import logging
import pickle
import hashlib
from typing import Dict, Any, List, Optional, Tuple
import httpx
from uuid import uuid4
import asyncio
from dotenv import load_dotenv
import redis.asyncio as redis
import numpy as np
from concurrent.futures import ThreadPoolExecutor

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get environment variables
REDIS_URL = os.getenv("REDIS_URL")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")  # This is now optional in new Pinecone
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "genesis-memory")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MEMORY_CACHE_TTL = int(os.getenv("MEMORY_CACHE_TTL", "3600"))  # 1 hour default
MEMORY_DEFAULT_DIMENSION = int(os.getenv("MEMORY_DEFAULT_DIMENSION", "768"))
MEMORY_ENABLE_LOCAL_EMBEDDING = os.getenv("MEMORY_ENABLE_LOCAL_EMBEDDING", "true").lower() == "true"

class MemoryService:
    """Service for storing and retrieving agent memory."""
    
    def __init__(self):
        """Initialize the memory service."""
        # Main Redis client for memory storage
        self.redis_client = None
        # Separate Redis client for embedding cache
        self.embedding_cache_client = None
        self.pinecone_client = None
        self.pinecone_index = None
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
        # In-memory fallback storage
        self.memory_cache = {}
        self.embedding_cache = {}
        
        # Thread pool for synchronous operations
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # Initialize Redis if URL is provided
        if REDIS_URL and not REDIS_URL.startswith("your_"):
            try:
                self.redis_client = redis.from_url(REDIS_URL)
                # Also initialize embedding cache client
                self.embedding_cache_client = redis.from_url(REDIS_URL)
                logger.info("✅ Connected to Redis for memory service")
            except Exception as e:
                logger.error(f"❌ Failed to connect to Redis: {str(e)}")
                logger.info("⚠️ Using in-memory cache for memory service")
        else:
            logger.info("⚠️ Redis URL not provided, using in-memory cache")
        
        # Initialize Pinecone client if API key is provided
        if PINECONE_API_KEY and not PINECONE_API_KEY.startswith("your_"):
            logger.info("✅ Pinecone API key found for long-term memory")
            self.initialize_pinecone()
        else:
            logger.info("⚠️ Pinecone not configured, long-term memory will be limited")
    
    def initialize_pinecone(self):
        """Initialize connection to Pinecone vector database."""
        try:
            pinecone_api_key = os.getenv("PINECONE_API_KEY")
            if not pinecone_api_key or pinecone_api_key.startswith("your_"):
                logger.warning("⚠️ Pinecone API key not provided.")
                return
            
            # Import Pinecone here to handle import errors more gracefully
            try:
                from pinecone import Pinecone, ServerlessSpec
                # Initialize Pinecone with new syntax
                pinecone_index_name = os.getenv("PINECONE_INDEX_NAME", "genesis-memory")
                try:
                    self.pinecone_client = Pinecone(api_key=pinecone_api_key)
                    
                    # Check if index exists, create if not
                    pinecone_index_name = os.getenv("PINECONE_INDEX_NAME", "genesis-memory")
                    
                    try:
                        existing_indexes = [index.name for index in self.pinecone_client.list_indexes()]
                        logger.info(f"Available Pinecone indexes: {existing_indexes}")
                    except Exception as e:
                        logger.warning(f"⚠️ Error listing Pinecone indexes: {e}")
                        existing_indexes = []
                    
                    try:
                        # Connect to the index if it exists
                        if pinecone_index_name in existing_indexes:
                            self.pinecone_index = self.pinecone_client.Index(pinecone_index_name)
                            logger.info(f"✅ Connected to existing Pinecone index: {pinecone_index_name}")
                        else:
                            logger.info(f"Creating Pinecone index: {pinecone_index_name}")
                            
                            # Try with serverless spec
                            try:
                                # Create index with ServerlessSpec (recommended for new projects)
                                self.pinecone_client.create_index(
                                    name=pinecone_index_name,
                                    dimension=MEMORY_DEFAULT_DIMENSION,
                                    metric="cosine",
                                    spec=ServerlessSpec(
                                        cloud="aws",  # or "gcp", "azure"
                                        region="us-east-1"  # specify your preferred region
                                    )
                                )
                            except (ImportError, AttributeError) as e:
                                logger.warning(f"⚠️ Serverless spec not available: {e}")
                                # Fallback to standard creation method
                                self.pinecone_client.create_index(
                                    name=pinecone_index_name,
                                    dimension=MEMORY_DEFAULT_DIMENSION,
                                    metric="cosine"
                                )
                        
                            # Wait for index to be ready
                            import time
                            try:
                                while not self.pinecone_client.describe_index(pinecone_index_name).status['ready']:
                                    time.sleep(1)
                            except Exception as e:
                                logger.warning(f"⚠️ Error checking index readiness: {e}")
                                # Some Pinecone versions might handle this differently
                                time.sleep(5)  # Give it time to initialize
                                
                            # Connect to the newly created index
                            self.pinecone_index = self.pinecone_client.Index(pinecone_index_name)
                            logger.info(f"✅ Created and connected to Pinecone index: {pinecone_index_name}")
                    
                    except Exception as e:
                        logger.error(f"❌ Error with Pinecone index operations: {str(e)}")
                        self.pinecone_index = None
                except Exception as e:
                    logger.error(f"❌ Error initializing Pinecone client: {str(e)}")
                    self.pinecone_client = None
                    self.pinecone_index = None
            
            except ImportError as e:
                logger.warning(f"⚠️ Pinecone Python SDK not installed: {e}")
                logger.warning("Long-term memory will be limited to in-memory storage.")
                self.pinecone_client = None
                self.pinecone_index = None
        except Exception as e:
            logger.error(f"❌ Failed to initialize Pinecone: {str(e)}")
            self.pinecone_client = None
            self.pinecone_index = None
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text.
        
        Args:
            text: Text to generate embedding for.
            
        Returns:
            Embedding vector.
        """
        # Check cache first
        cache_key = f"embedding:{hashlib.md5(text.encode()).hexdigest()}"
        
        # Try to get from Redis cache
        if self.embedding_cache_client:
            try:
                cached = await self.embedding_cache_client.get(cache_key)
                if cached:
                    return pickle.loads(cached)
            except Exception as e:
                logger.error(f"❌ Error retrieving embedding from cache: {str(e)}")
        
        # Check local cache
        if cache_key in self.embedding_cache:
            return self.embedding_cache[cache_key]
        
        # If no valid Gemini API key or local embedding is enabled, use local method
        if MEMORY_ENABLE_LOCAL_EMBEDDING or not GEMINI_API_KEY or GEMINI_API_KEY.startswith("your_"):
            embedding = self._generate_local_embedding(text)
        else:
            # Use Gemini to generate embedding
            try:
                embedding = await self._generate_gemini_embedding(text)
            except Exception as e:
                logger.error(f"❌ Error generating embedding with Gemini: {str(e)}")
                embedding = self._generate_local_embedding(text)
        
        # Store in Redis cache
        if self.embedding_cache_client:
            try:
                await self.embedding_cache_client.setex(
                    cache_key,
                    MEMORY_CACHE_TTL,
                    pickle.dumps(embedding)
                )
            except Exception as e:
                logger.error(f"❌ Error storing embedding in cache: {str(e)}")
        
        # Store in local cache
        self.embedding_cache[cache_key] = embedding
        
        return embedding
    
    async def _generate_gemini_embedding(self, text: str) -> List[float]:
        """Generate embedding using Google Gemini API.
        
        Args:
            text: Text to generate embedding for.
            
        Returns:
            Embedding vector.
        """
        url = f"https://generativelanguage.googleapis.com/v1/models/embedding-001:embedContent?key={GEMINI_API_KEY}"
        
        payload = {
            "model": "models/embedding-001",
            "content": {"parts": [{"text": text}]}
        }
        
        response = await self.http_client.post(url, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"Gemini API error: {response.status_code} {response.text}")
            
        data = response.json()
        return data.get("embedding", {}).get("values", [])
    
    def _generate_local_embedding(self, text: str) -> List[float]:
        """Generate a simple embedding locally using hashing.
        
        Note: This is a very simple approximation for development purposes.
        In production, use a proper embedding model.
        
        Args:
            text: Text to generate embedding for.
            
        Returns:
            Embedding vector.
        """
        # Create a deterministic but simple embedding based on the text
        # This is NOT suitable for production, just for development/testing
        text_bytes = text.encode('utf-8')
        hash_object = hashlib.sha256(text_bytes)
        hash_bytes = hash_object.digest()
        
        # Generate a fixed-length vector from the hash
        np.random.seed(int.from_bytes(hash_bytes[:4], byteorder='big'))
        vector = np.random.uniform(-1, 1, MEMORY_DEFAULT_DIMENSION)
        
        # Normalize to unit length (important for cosine similarity)
        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
            
        return vector.tolist()
    
    async def store_memory(
        self,
        agent_id: str,
        content: str,
        memory_type: str = "interaction",
        metadata: Optional[Dict[str, Any]] = None,
        importance: float = 0.5,
        user_id: Optional[str] = None, 
        expiration: Optional[int] = None
    ) -> str:
        """Store a memory for an agent.
        
        Args:
            agent_id: The ID of the agent.
            content: The content of the memory.
            memory_type: The type of memory (interaction, learning, etc.).
            metadata: Additional metadata about the memory.
            importance: Importance score (0-1).
            user_id: User ID associated with this memory.
            expiration: Optional TTL in seconds.
            
        Returns:
            The memory ID.
        """
        # Generate a consistent memory ID
        memory_id = f"memory_{str(uuid4())}"
        timestamp = int(time.time())
        
        # Prepare embedding asynchronously
        embedding = None
        if len(content) > 0:
            try:
                embedding = await self.generate_embedding(content)
            except Exception as e:
                logger.error(f"❌ Failed to generate embedding: {str(e)}")
        
        memory = {
            "id": memory_id,
            "agent_id": agent_id,
            "content": content,
            "type": memory_type,
            "metadata": metadata or {},
            "importance": importance,
            "created_at": timestamp, 
            "embedding": embedding,
            "user_id": user_id
        }
        
        # Try to store in Redis first
        if self.redis_client:
            try:
                key = f"memory:{agent_id}:{memory_id}"
                await self.redis_client.set(key, json.dumps(memory))
                
                # Set expiration if specified
                if expiration:
                    await self.redis_client.expire(key, expiration)
                
                # Add to memory index for agent
                await self.redis_client.zadd(
                    f"memory_index:{agent_id}",
                    {memory_id: timestamp}
                )
                
                # Add to importance index
                await self.redis_client.zadd(
                    f"memory_importance:{agent_id}",
                    {memory_id: importance}
                )
                
                # Store in Pinecone if embedding is available
                if self.pinecone_index and embedding:
                    try:
                        # Run in thread pool to avoid blocking
                        await self._store_in_pinecone(
                            id=memory_id,
                            vector=embedding,
                            metadata={
                                "agent_id": agent_id,
                                "content": content[:1000],  # Limit content length
                                "type": memory_type,
                                "importance": importance,
                                "created_at": timestamp,
                                "user_id": user_id or ""
                            }
                        )
                        logger.info(f"✅ Memory {memory_id} stored in Pinecone vector DB")
                    except Exception as e:
                        logger.error(f"❌ Failed to store memory in Pinecone: {str(e)}")
                
                # Also store in memory cache as backup
                self._store_in_memory(agent_id, memory_id, memory)
                
                # Add TTL for long-term memory if not explicitly set
                # This automatically handles memory expiration
                if not expiration:
                    # Default expiry based on importance (higher importance = longer retention)
                    # 0.0 importance: 1 day, 1.0 importance: 90 days
                    days_to_keep = int(1 + (90 - 1) * importance)
                    
                    # Convert to seconds
                    expiry_seconds = days_to_keep * 24 * 60 * 60
                    
                    try:
                        await self.redis_client.expire(key, expiry_seconds)
                        logger.info(f"✅ Set memory TTL to {days_to_keep} days based on importance")
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to set memory TTL: {str(e)}")
                
                logger.info(f"✅ Memory {memory_id} stored in Redis for agent {agent_id}")
            except Exception as e:
                logger.error(f"❌ Failed to store memory in Redis: {str(e)}")
                # Fall back to in-memory storage
                self._store_in_memory(agent_id, memory_id, memory)
        else:
            # Store in memory
            self._store_in_memory(agent_id, memory_id, memory)
        
        return memory_id
        
    async def _store_in_pinecone(self, id: str, vector: List[float], metadata: Dict[str, Any]):
        """Store a memory vector in Pinecone.
        
        Args:
            id: Memory ID.
            vector: Embedding vector.
            metadata: Associated metadata.
        """
        if not self.pinecone_index or not self.pinecone_client:
            logger.warning("⚠️ Pinecone not available for storing memory")
            return
            
        # Pinecone operations are synchronous, so run in thread pool
        def _upsert_to_pinecone():
            try:
                # Handle different versions of Pinecone SDK
                try:
                    # Try the new syntax first
                    # Verify vector dimensions
                    if len(vector) != MEMORY_DEFAULT_DIMENSION:
                        logger.warning(f"⚠️ Vector dimension mismatch. Expected {MEMORY_DEFAULT_DIMENSION}, got {len(vector)}")
                        # Pad or truncate vector to match expected dimensions
                        if len(vector) < MEMORY_DEFAULT_DIMENSION:
                            vector = vector + [0.0] * (MEMORY_DEFAULT_DIMENSION - len(vector))
                        else:
                            vector = vector[:MEMORY_DEFAULT_DIMENSION]
                    
                    try:
                        self.pinecone_index.upsert(
                            vectors=[{
                                "id": id,
                                "values": vector,
                                "metadata": metadata
                            }],
                            namespace=metadata.get("agent_id", "default")
                        )
                    except Exception as e:
                        # Check for common Pinecone errors
                        if "dimension mismatch" in str(e).lower():
                            logger.error(f"❌ Pinecone dimension mismatch: {e}")
                        elif "bad request" in str(e).lower():
                            logger.error(f"❌ Pinecone bad request: {e}")
                            # Try with simplified metadata (sometimes metadata can be too large)
                            simplified_metadata = {
                                "agent_id": metadata.get("agent_id", ""),
                                "content_summary": metadata.get("content", "")[:100] if metadata.get("content") else "",
                                "type": metadata.get("type", ""),
                                "importance": metadata.get("importance", 0),
                                "created_at": metadata.get("created_at", 0)
                            }
                            self.pinecone_index.upsert(
                                vectors=[{
                                    "id": id,
                                    "values": vector,
                                    "metadata": simplified_metadata
                                }],
                                namespace=metadata.get("agent_id", "default")
                            )
                        else:
                            raise
                except (TypeError, AttributeError):
                    # Fallback to older syntax
                    self.pinecone_index.upsert(
                        vectors=[(id, vector, metadata)],
                        namespace=metadata.get("agent_id", "default")
                    )
            except Exception as e:
                logger.error(f"❌ Failed to store memory in Pinecone: {str(e)}")
                # Don't raise the error, as this would break the memory store flow
                # Just log it and allow the function to continue
            
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(self.executor, _upsert_to_pinecone)
    
    def _store_in_memory(self, agent_id: str, memory_id: str, memory: Dict[str, Any]):
        """Store memory in the in-memory cache.
        
        Args:
            agent_id: The agent ID.
            memory_id: The memory ID.
            memory: The memory data.
        """
        if agent_id not in self.memory_cache:
            self.memory_cache[agent_id] = {}
        
        self.memory_cache[agent_id][memory_id] = memory
        logger.info(f"✅ Memory {memory_id} stored in-memory for agent {agent_id}")
    
    async def retrieve_recent_memories(
        self, 
        agent_id: str,
        limit: int = 10,
        memory_type: Optional[str] = None,
        metadata_filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve the most recent memories for an agent.
        
        Args:
            agent_id: The ID of the agent.
            limit: Maximum number of memories to retrieve.
            memory_type: Optional filter by memory type.
            metadata_filter: Optional filter by metadata values.
            
        Returns:
            List of memory objects.
        """
        memories = []
        
        # Try to get from Redis first
        if self.redis_client:
            try:
                # Get memory IDs from the index, sorted by timestamp (newest first)
                memory_ids = await self.redis_client.zrevrange(
                    f"memory_index:{agent_id}", 
                    0,
                    limit * 2 - 1  # Get more than needed to allow for filtering
                ) 
                
                # Get the actual memories
                for memory_id in memory_ids:
                    memory_id_str = memory_id.decode("utf-8") if isinstance(memory_id, bytes) else memory_id
                    memory_json = await self.redis_client.get(f"memory:{agent_id}:{memory_id_str}") 
                    
                    if memory_json:
                        memory = json.loads(memory_json)
                        
                        # Apply filters if specified
                        if memory_type and memory.get("type") != memory_type:
                            continue
                            
                        if metadata_filter:
                            memory_metadata = memory.get("metadata", {})
                            if not all(memory_metadata.get(k) == v for k, v in metadata_filter.items()):
                                continue
                        
                        memories.append(memory)
                        
                        # Stop if we have enough memories after filtering
                        if len(memories) >= limit:
                            break
                        
                logger.info(f"✅ Retrieved {len(memories)} recent memories from Redis for agent {agent_id}")
            except Exception as e:
                logger.error(f"❌ Failed to retrieve memories from Redis: {str(e)}")
                # Fall back to in-memory retrieval
                memories = self._retrieve_from_memory(agent_id, sort_by="timestamp", limit=limit)
        else:
            # Get from in-memory cache
            memories = self._retrieve_from_memory(agent_id, sort_by="timestamp", limit=limit)
        
        return memories
    
    async def retrieve_important_memories(
        self, 
        agent_id: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Retrieve the most important memories for an agent.
        
        Args:
            agent_id: The ID of the agent.
            limit: Maximum number of memories to retrieve.
            
        Returns:
            List of memory objects.
        """
        memories = []
        
        # Try to get from Redis first
        if self.redis_client:
            try:
                # Get memory IDs from the importance index, sorted by importance (highest first)
                memory_ids = await self.redis_client.zrevrange(
                    f"memory_importance:{agent_id}", 
                    0, 
                    limit - 1
                )
                
                # Get the actual memories
                for memory_id in memory_ids:
                    memory_id_str = memory_id.decode("utf-8") if isinstance(memory_id, bytes) else memory_id
                    memory_json = await self.redis_client.get(f"memory:{agent_id}:{memory_id_str}")
                    if memory_json:
                        memories.append(json.loads(memory_json))
                
                logger.info(f"✅ Retrieved {len(memories)} important memories from Redis for agent {agent_id}")
            except Exception as e:
                logger.error(f"❌ Failed to retrieve important memories from Redis: {str(e)}")
                # Fall back to in-memory retrieval
                memories = self._retrieve_from_memory(agent_id, sort_by="importance", limit=limit)
        else:
            # Get from in-memory cache
            memories = self._retrieve_from_memory(agent_id, sort_by="importance", limit=limit)
        
        return memories
    
    def _retrieve_from_memory(
        self, 
        agent_id: str, 
        sort_by: str = "timestamp",
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Retrieve memories from the in-memory cache.
        
        Args:
            agent_id: The agent ID.
            sort_by: Field to sort by ('timestamp' or 'importance').
            limit: Maximum number of memories to retrieve.
            
        Returns:
            List of memory objects.
        """
        if agent_id not in self.memory_cache:
            return []
        
        # Get all memories for the agent
        agent_memories = list(self.memory_cache[agent_id].values())

        # Sort based on the specified field
        if sort_by == "timestamp":
            agent_memories.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        elif sort_by == "importance":
            agent_memories.sort(key=lambda x: x.get("importance", 0), reverse=True)
            
        # Return limited number of memories
        return agent_memories[:limit]
    
    async def search_memories(
        self, 
        agent_id: str, 
        query: str, 
        limit: int = 5,
        min_similarity: float = 0.6,
        use_semantic: bool = True
    ) -> List[Dict[str, Any]]:
        """Search agent memories based on content similarity.
        
        Args:
            agent_id: The ID of the agent.
            query: The search query.
            limit: Maximum number of results.
            min_similarity: Minimum similarity threshold (0-1).
            use_semantic: Whether to use semantic search with embeddings.
            
        Returns:
            List of memory objects.
        """
        # If we have Pinecone configured and semantic search is requested, use vector search
        if self.pinecone_index and use_semantic:
            try:
                return await self._search_memories_with_pinecone(
                    agent_id, query, limit, min_similarity
                )
            except Exception as e:
                logger.error(f"❌ Pinecone search failed: {str(e)}")
                logger.info("⚠️ Falling back to keyword search")
        
        # Fall back to Redis text search or in-memory search
        return await self._search_memories_with_keywords(agent_id, query, limit)
    
    async def _search_memories_with_pinecone(
        self,
        agent_id: str,
        query: str,
        limit: int = 5,
        min_similarity: float = 0.6
    ) -> List[Dict[str, Any]]:
        """Search memories using Pinecone vector similarity.
        
        Args:
            agent_id: The agent ID.
            query: Search query.
            limit: Maximum results.
            min_similarity: Minimum similarity threshold.
            
        Returns:
            List of memory objects.
        """
        if not self.pinecone_index:
            return []
            
        # Generate embedding for the query
        query_embedding = await self.generate_embedding(query)
        
        # Query Pinecone (in thread pool to avoid blocking)
        def _query_pinecone():
            return self.pinecone_index.query(
                vector=query_embedding,
                namespace=agent_id,
                top_k=limit,
                include_metadata=True
            )
            
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(self.executor, _query_pinecone)
        
        # Extract memories from results
        memories = []
        for match in results.get("matches", []):
            if match.get("score", 0) < min_similarity:
                continue
                
            memory_id = match.get("id")
            metadata = match.get("metadata", {})
            
            # Try to get full memory from Redis
            if self.redis_client:
                try:
                    memory_json = await self.redis_client.get(f"memory:{agent_id}:{memory_id}")
                    if memory_json:
                        memory = json.loads(memory_json)
                        memory["similarity"] = match.get("score")
                        memories.append(memory)
                        continue
                except Exception as e:
                    logger.error(f"❌ Error retrieving memory from Redis: {str(e)}")
            
            # If Redis retrieval failed, construct memory from Pinecone metadata
            memories.append({
                "id": memory_id,
                "agent_id": agent_id,
                "content": metadata.get("content", ""),
                "type": metadata.get("type", "unknown"),
                "metadata": metadata,
                "importance": metadata.get("importance", 0.5),
                "created_at": metadata.get("created_at", 0),
                "similarity": match.get("score", 0)
            })
        
        logger.info(f"✅ Found {len(memories)} memories via semantic search")
        return memories
    
    async def _search_memories_with_keywords(
        self,
        agent_id: str,
        query: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Search memories using keyword matching.
        
        Args:
            agent_id: The agent ID.
            query: Search query.
            limit: Maximum results.
        """
        
        # Convert query to lowercase for case-insensitive matching
        query_lower = query.lower()
        
        # Get all memories for the agent
        if self.redis_client:
            try:
                # Get all memory IDs for the agent
                memory_ids = await self.redis_client.zrange(
                    f"memory_index:{agent_id}", 
                    0, 
                    -1
                )
                
                memories = []
                for memory_id in memory_ids:
                    memory_id_str = memory_id.decode("utf-8") if isinstance(memory_id, bytes) else memory_id
                    memory_json = await self.redis_client.get(f"memory:{agent_id}:{memory_id_str}")
                    if memory_json:
                        memory = json.loads(memory_json)
                        memories.append(memory)
                
                # Filter memories that contain the query in the content
                results = [
                    memory for memory in memories
                    if query_lower in memory.get("content", "").lower()
                ]
                
                # Sort by relevance (simple implementation)
                results.sort(
                    key=lambda x: (
                        query_lower in x.get("content", "").lower(),
                        x.get("importance", 0)
                    ),
                    reverse=True
                )
                
                return results[:limit]
            except Exception as e:
                logger.error(f"❌ Failed to search memories in Redis: {str(e)}")
                # Fall back to in-memory search
                return self._search_in_memory(agent_id, query_lower, limit)
        else:
            # Search in-memory cache
            return self._search_in_memory(agent_id, query_lower, limit)
    
    def _search_in_memory(self, agent_id: str, query: str, limit: int) -> List[Dict[str, Any]]:
        """Search memories in the in-memory cache.
        
        Args:
            agent_id: The agent ID.
            query: The search query (lowercase).
            limit: Maximum number of results.
            
        Returns:
            List of memory objects.
        """
        if agent_id not in self.memory_cache:
            return []
        
        # Get all memories for the agent
        agent_memories = list(self.memory_cache[agent_id].values())
        
        # Filter memories that contain the query in the content
        results = [
            memory for memory in agent_memories
            if query in memory.get("content", "").lower()
        ]
        
        # Sort by relevance (simple implementation)
        results.sort(
            key=lambda x: (
                query in x.get("content", "").lower(),
                x.get("importance", 0)
            ),
            reverse=True
        )
        
        return results[:limit]
    
    async def delete_memory(self, agent_id: str, memory_id: str) -> bool:
        """Delete a memory.
        
        Args:
            agent_id: The ID of the agent.
            memory_id: The ID of the memory to delete.
            
        Returns:
            True if successful, False otherwise.
        """
        # Try to delete from Redis first
        if self.redis_client:
            try:
                # Remove from memory storage
                await self.redis_client.delete(f"memory:{agent_id}:{memory_id}")
                
                # Remove from indices
                await self.redis_client.zrem(f"memory_index:{agent_id}", memory_id)
                await self.redis_client.zrem(f"memory_importance:{agent_id}", memory_id)
                
                # Delete from Pinecone if available
                if self.pinecone_index:
                    try:
                        def _delete_from_pinecone():
                            self.pinecone_index.delete(ids=[memory_id], namespace=agent_id)
                        
                        loop = asyncio.get_event_loop()
                        await loop.run_in_executor(self.executor, _delete_from_pinecone)
                        logger.info(f"✅ Memory {memory_id} deleted from Pinecone")
                    except Exception as e:
                        logger.error(f"❌ Failed to delete memory from Pinecone: {str(e)}")
                
                logger.info(f"✅ Memory {memory_id} deleted from Redis for agent {agent_id}")
                
                # Also remove from in-memory cache if it exists there
                if agent_id in self.memory_cache and memory_id in self.memory_cache[agent_id]:
                    del self.memory_cache[agent_id][memory_id]
                
                return True
            except Exception as e:
                logger.error(f"❌ Failed to delete memory from Redis: {str(e)}")
                # Fall back to in-memory deletion
                return self._delete_from_memory(agent_id, memory_id)
        else:
            # Delete from in-memory cache
            return self._delete_from_memory(agent_id, memory_id)
    
    def _delete_from_memory(self, agent_id: str, memory_id: str) -> bool:
        """Delete memory from the in-memory cache.
        
        Args:
            agent_id: The agent ID.
            memory_id: The memory ID.
            
        Returns:
            True if successful, False otherwise.
        """
        if agent_id not in self.memory_cache:
            return False
        
        if memory_id in self.memory_cache[agent_id]:
            del self.memory_cache[agent_id][memory_id]
            logger.info(f"✅ Memory {memory_id} deleted from in-memory cache for agent {agent_id}")
            return True
        
        return False

    
    async def clear_agent_memories(self, agent_id: str) -> bool:
        """Clear all memories for an agent.
        
        Args:
            agent_id: The ID of the agent.
            
        Returns:
            True if successful, False otherwise.
        """
        # Try to clear from Redis first
        if self.redis_client:
            try:
                # Get all memory IDs for the agent
                memory_ids = await self.redis_client.zrange(
                    f"memory_index:{agent_id}", 
                    0, 
                    -1
                )
                
                # Delete all memories
                for memory_id in memory_ids:
                    memory_id_str = memory_id.decode("utf-8") if isinstance(memory_id, bytes) else memory_id
                    await self.redis_client.delete(f"memory:{agent_id}:{memory_id_str}")
                
                # Delete indices
                await self.redis_client.delete(f"memory_index:{agent_id}")
                await self.redis_client.delete(f"memory_importance:{agent_id}")
                
                logger.info(f"✅ All memories cleared for agent {agent_id}")
                
                # Also clear from in-memory cache
                if agent_id in self.memory_cache:
                    del self.memory_cache[agent_id]
                
                return True
            except Exception as e:
                logger.error(f"❌ Failed to clear memories from Redis: {str(e)}")
                # Fall back to in-memory clearing
                return self._clear_memory_cache(agent_id)
        else:
            # Clear from in-memory cache
            return self._clear_memory_cache(agent_id)
    
    def _clear_memory_cache(self, agent_id: str) -> bool:
        """Clear agent memories from the in-memory cache.
        
        Args:
            agent_id: The agent ID.
            
        Returns:
            True if successful, False otherwise.
        """
        if agent_id in self.memory_cache:
            del self.memory_cache[agent_id]
            logger.info(f"✅ All memories cleared from in-memory cache for agent {agent_id}")
            return True
        
        return False
    
    async def get_memory(self, agent_id: str, memory_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific memory by ID.
        
        Args:
            agent_id: The ID of the agent.
            memory_id: The ID of the memory.
            
        Returns:
            The memory object or None if not found.
        """
        # Try to get from Redis first
        if self.redis_client:
            try:
                memory_json = await self.redis_client.get(f"memory:{agent_id}:{memory_id}")
                if memory_json:
                    return json.loads(memory_json)
                
                logger.warning(f"⚠️ Memory {memory_id} not found in Redis for agent {agent_id}")
            except Exception as e:
                logger.error(f"❌ Failed to get memory from Redis: {str(e)}")
        
        # Fall back to in-memory cache
        if agent_id in self.memory_cache and memory_id in self.memory_cache[agent_id]:
            return self.memory_cache[agent_id][memory_id]
        
        return None
    
    async def update_memory_importance(
        self, 
        agent_id: str,
        memory_id: str,
        importance: float,
        metadata_updates: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Update the importance score of a memory.
        
        Args:
            agent_id: The ID of the agent.
            memory_id: The ID of the memory.
            importance: New importance score (0-1).
            metadata_updates: Optional updates to the memory's metadata.
            
        Returns:
            True if successful, False otherwise.
        """
        # Try to update in Redis first
        if self.redis_client:
            try:
                # Get the memory
                memory_json = await self.redis_client.get(f"memory:{agent_id}:{memory_id}")
                if not memory_json:
                    logger.warning(f"⚠️ Memory {memory_id} not found in Redis for agent {agent_id}")
                    return False
                
                memory = json.loads(memory_json)
                memory["importance"] = importance
                
                # Apply metadata updates if provided
                if metadata_updates:
                    memory["metadata"] = {
                        **(memory.get("metadata", {}) or {}),
                        **metadata_updates
                    }
                
                # Update the memory
                await self.redis_client.set(
                    f"memory:{agent_id}:{memory_id}",
                    json.dumps(memory)
                )
                
                # Update the importance index
                await self.redis_client.zadd(
                    f"memory_importance:{agent_id}",
                    {memory_id: importance}
                )
                
                logger.info(f"✅ Importance updated to {importance} for memory {memory_id}")
                
                # Update Pinecone if available
                if self.pinecone_client and memory.get("embedding"):
                    try:
                        # Update metadata in Pinecone
                        def _update_pinecone():
                            self.pinecone_client.update(
                                id=memory_id,
                                namespace=agent_id,
                                set_metadata={
                                    "importance": importance,
                                    **(metadata_updates or {})
                                }
                            )
                        
                        loop = asyncio.get_event_loop()
                        await loop.run_in_executor(self.executor, _update_pinecone)
                        
                        logger.info(f"✅ Updated importance in Pinecone for memory {memory_id}")
                    except Exception as e:
                        logger.error(f"❌ Failed to update memory in Pinecone: {str(e)}")
                
                # Also update in-memory cache if it exists
                if agent_id in self.memory_cache and memory_id in self.memory_cache[agent_id]:
                    self.memory_cache[agent_id][memory_id]["importance"] = importance
                    
                    # Apply metadata updates if provided
                    if metadata_updates and "metadata" in self.memory_cache[agent_id][memory_id]:
                        self.memory_cache[agent_id][memory_id]["metadata"] = {
                            **(self.memory_cache[agent_id][memory_id]["metadata"] or {}),
                            **metadata_updates
                        }
                
                return True
            except Exception as e:
                logger.error(f"❌ Failed to update memory importance in Redis: {str(e)}")
                # Fall back to in-memory update
                return self._update_importance_in_memory(agent_id, memory_id, importance)
        else:
            # Update in in-memory cache
            return self._update_importance_in_memory(agent_id, memory_id, importance)
    
    def _update_importance_in_memory(self, agent_id: str, memory_id: str, importance: float) -> bool:
        """Update memory importance in the in-memory cache.
        
        Args:
            agent_id: The agent ID.
            memory_id: The memory ID.
            importance: New importance score.
            
        Returns:
            True if successful, False otherwise.
        """
        if agent_id not in self.memory_cache or memory_id not in self.memory_cache[agent_id]:
            return False
        
        self.memory_cache[agent_id][memory_id]["importance"] = importance
        logger.info(f"✅ Importance updated to {importance} for memory {memory_id} in in-memory cache")
        return True
        
    async def summarize_agent_memories(self, agent_id: str, max_tokens: int = 1000) -> str:
        """Generate a summary of an agent's important memories.
        
        Args:
            agent_id: The agent ID.
            max_tokens: Maximum tokens for the summary.
            
        Returns:
            String summary of key memories.
        """
        # Get important memories
        memories = await self.retrieve_important_memories(agent_id, limit=10)
        
        if not memories:
            return "No significant memories available for this agent."
        
        # Format memories for summary
        memory_texts = [
            f"Memory {i+1}: {memory['content']}"
            for i, memory in enumerate(memories)
        ]
        
        return "\n\n".join(memory_texts)
    
    async def close(self):
        """Close connections to external services."""
        # Close Redis clients
        if self.redis_client:
            await self.redis_client.close()
            logger.info("✅ Redis memory client closed")
            
        if self.embedding_cache_client and self.embedding_cache_client != self.redis_client:
            await self.embedding_cache_client.close()
            logger.info("✅ Redis embedding cache client closed")
            
        # Close HTTP client
        await self.http_client.aclose()
        
        # Shutdown thread pool
        self.executor.shutdown(wait=False)


# Create a singleton instance for the service
_memory_service = None

def get_memory_service() -> MemoryService:
    """Get the singleton MemoryService instance.
    
    Returns:
        MemoryService instance.
    """
    global _memory_service
    if _memory_service is None:
        _memory_service = MemoryService()
    return _memory_service