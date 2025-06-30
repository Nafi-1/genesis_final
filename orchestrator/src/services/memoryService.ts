import { createClient as createRedisClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Redis URL from environment
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Interface for Memory
interface Memory {
  id: string;
  agent_id: string;
  content: string;
  type: string;
  metadata?: Record<string, any>;
  importance: number;
  created_at: number;
  user_id?: string;
  expires_at?: number;
}

// Interface for Memory Search Result
interface MemorySearchResult {
  memory: Memory;
  score: number;
}

class MemoryService {
  private redisClient: RedisClientType | null = null;
  private inMemoryCache: Record<string, Record<string, Memory>> = {};
  private isRedisConnected: boolean = false;

  constructor() {
    this.initRedis();
  }

  private async initRedis() {
    // Skip Redis initialization if URL is a placeholder or undefined
    if (!REDIS_URL || REDIS_URL.includes('your_redis') || REDIS_URL === 'redis://localhost:6379') {
      console.log('⚠️ Redis URL not provided or is placeholder. Using in-memory storage for agent memories.');
      return;
    }

    try {
      this.redisClient = createRedisClient({ url: REDIS_URL });
      await this.redisClient.connect();
      
      this.redisClient.on('error', (err) => {
        console.error('❌ Redis client error:', err);
        this.isRedisConnected = false;
      });
      
      this.redisClient.on('ready', () => {
        console.log('✅ Redis client connected');
        this.isRedisConnected = true;
      });
      
      console.log('✅ Redis memory service initialized');
      this.isRedisConnected = true;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      console.log('⚠️ Using in-memory storage for agent memories');
      this.isRedisConnected = false;
    }
  }

  /**
   * Store a memory for an agent
   */
  public async storeMemory(
    agent_id: string,
    content: string,
    type: string = 'interaction',
    metadata: Record<string, any> = {},
    importance: number = 0.5,
    user_id?: string,
    expiration?: number
  ): Promise<string> {
    const memory_id = uuidv4();
    const timestamp = Date.now();
    
    const memory: Memory = {
      id: memory_id,
      agent_id,
      content,
      type,
      metadata,
      importance,
      created_at: timestamp,
      user_id,
      expires_at: expiration ? timestamp + (expiration * 1000) : undefined
    };
    
    // Try to store in Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        const key = `memory:${agent_id}:${memory_id}`;
        await this.redisClient.set(key, JSON.stringify(memory));
        
        // Set expiration if specified
        if (expiration) {
          await this.redisClient.expire(key, expiration);
        }
        
        // Add to memory index for agent (sorted by timestamp)
        await this.redisClient.zAdd(`memory_index:${agent_id}`, {
          score: timestamp,
          value: memory_id
        });
        
        // Add to importance index
        await this.redisClient.zAdd(`memory_importance:${agent_id}`, {
          score: importance,
          value: memory_id
        });
        
        console.log(`✅ Memory ${memory_id} stored in Redis for agent ${agent_id}`);
      } catch (error) {
        console.error(`❌ Failed to store memory in Redis: ${error}`);
        // Fall back to in-memory storage
        this.storeInMemory(agent_id, memory_id, memory);
      }
    } else {
      // Store in memory
      this.storeInMemory(agent_id, memory_id, memory);
    }
    
    return memory_id;
  }

  /**
   * Store a memory in the in-memory cache
   */
  private storeInMemory(agent_id: string, memory_id: string, memory: Memory): void {
    if (!this.inMemoryCache[agent_id]) {
      this.inMemoryCache[agent_id] = {};
    }
    
    this.inMemoryCache[agent_id][memory_id] = memory;
    console.log(`✅ Memory ${memory_id} stored in-memory for agent ${agent_id}`);
  }

  /**
   * Retrieve recent memories for an agent
   */
  public async retrieveRecentMemories(
    agent_id: string,
    limit: number = 10
  ): Promise<Memory[]> {
    // Try to get from Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        // Get memory IDs from the index, sorted by timestamp (newest first)
        const memory_ids = await this.redisClient.zRange(
          `memory_index:${agent_id}`,
          0,
          limit - 1,
          { REV: true }
        );
        
        if (!memory_ids || memory_ids.length === 0) {
          return [];
        }
        
        // Get the actual memories
        const memories: Memory[] = [];
        
        for (const memory_id of memory_ids) {
          const memory_json = await this.redisClient.get(`memory:${agent_id}:${memory_id}`);
          
          if (memory_json) {
            memories.push(JSON.parse(memory_json));
          }
        }
        
        console.log(`✅ Retrieved ${memories.length} recent memories from Redis for agent ${agent_id}`);
        return memories;
      } catch (error) {
        console.error(`❌ Failed to retrieve memories from Redis: ${error}`);
        // Fall back to in-memory retrieval
        return this.retrieveFromMemory(agent_id, 'timestamp', limit);
      }
    } else {
      // Get from in-memory cache
      return this.retrieveFromMemory(agent_id, 'timestamp', limit);
    }
  }

  /**
   * Retrieve important memories for an agent
   */
  public async retrieveImportantMemories(
    agent_id: string,
    limit: number = 10
  ): Promise<Memory[]> {
    // Try to get from Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        // Get memory IDs from the importance index, sorted by importance (highest first)
        const memory_ids = await this.redisClient.zRange(
          `memory_importance:${agent_id}`,
          0,
          limit - 1,
          { REV: true }
        );
        
        if (!memory_ids || memory_ids.length === 0) {
          return [];
        }
        
        // Get the actual memories
        const memories: Memory[] = [];
        
        for (const memory_id of memory_ids) {
          const memory_json = await this.redisClient.get(`memory:${agent_id}:${memory_id}`);
          
          if (memory_json) {
            memories.push(JSON.parse(memory_json));
          }
        }
        
        console.log(`✅ Retrieved ${memories.length} important memories from Redis for agent ${agent_id}`);
        return memories;
      } catch (error) {
        console.error(`❌ Failed to retrieve important memories from Redis: ${error}`);
        // Fall back to in-memory retrieval
        return this.retrieveFromMemory(agent_id, 'importance', limit);
      }
    } else {
      // Get from in-memory cache
      return this.retrieveFromMemory(agent_id, 'importance', limit);
    }
  }

  /**
   * Retrieve memories from the in-memory cache
   */
  private retrieveFromMemory(
    agent_id: string,
    sort_by: 'timestamp' | 'importance',
    limit: number
  ): Memory[] {
    if (!this.inMemoryCache[agent_id]) {
      return [];
    }
    
    // Get all memories for the agent
    const agent_memories = Object.values(this.inMemoryCache[agent_id]);
    
    // Sort based on the specified field
    if (sort_by === 'timestamp') {
      agent_memories.sort((a, b) => b.created_at - a.created_at);
    } else if (sort_by === 'importance') {
      agent_memories.sort((a, b) => b.importance - a.importance);
    }
    
    // Return limited number of memories
    return agent_memories.slice(0, limit);
  }

  /**
   * Search memories based on content similarity (simple keyword matching)
   */
  public async searchMemories(
    agent_id: string,
    query: string,
    limit: number = 5
  ): Promise<Memory[]> {
    // Simple keyword search for now
    // Convert query to lowercase for case-insensitive matching
    const query_lower = query.toLowerCase();
    
    // Get all memories for the agent
    let memories: Memory[] = [];
    
    if (this.isRedisConnected && this.redisClient) {
      try {
        // Get all memory IDs for the agent
        const memory_ids = await this.redisClient.zRange(
          `memory_index:${agent_id}`, 
          0, 
          -1
        );
        
        if (!memory_ids || memory_ids.length === 0) {
          return [];
        }
        
        // Get the actual memories
        for (const memory_id of memory_ids) {
          const memory_json = await this.redisClient.get(`memory:${agent_id}:${memory_id}`);
          
          if (memory_json) {
            memories.push(JSON.parse(memory_json));
          }
        }
      } catch (error) {
        console.error(`❌ Failed to search memories in Redis: ${error}`);
        // Fall back to in-memory search
        return this.searchInMemory(agent_id, query_lower, limit);
      }
    } else {
      // Get from in-memory cache
      if (!this.inMemoryCache[agent_id]) {
        return [];
      }
      
      memories = Object.values(this.inMemoryCache[agent_id]);
    }
    
    // Filter memories that contain the query in the content
    const results = memories.filter(memory => 
      memory.content.toLowerCase().includes(query_lower)
    );
    
    // Sort by relevance (simple implementation)
    results.sort((a, b) => {
      // Prioritize exact matches, then importance
      const aExactMatch = a.content.toLowerCase().includes(query_lower);
      const bExactMatch = b.content.toLowerCase().includes(query_lower);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // If both match or don't match, sort by importance
      return b.importance - a.importance;
    });
    
    // Return limited number of results
    return results.slice(0, limit);
  }

  /**
   * Search memories in the in-memory cache
   */
  private searchInMemory(
    agent_id: string,
    query: string,
    limit: number
  ): Memory[] {
    if (!this.inMemoryCache[agent_id]) {
      return [];
    }
    
    // Get all memories for the agent
    const agent_memories = Object.values(this.inMemoryCache[agent_id]);
    
    // Filter memories that contain the query in the content
    const results = agent_memories.filter(memory => 
      memory.content.toLowerCase().includes(query)
    );
    
    // Sort by relevance (simple implementation)
    results.sort((a, b) => {
      // Prioritize exact matches, then importance
      const aExactMatch = a.content.toLowerCase().includes(query);
      const bExactMatch = b.content.toLowerCase().includes(query);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // If both match or don't match, sort by importance
      return b.importance - a.importance;
    });
    
    // Return limited number of results
    return results.slice(0, limit);
  }

  /**
   * Delete a memory
   */
  public async deleteMemory(agent_id: string, memory_id: string): Promise<boolean> {
    // Try to delete from Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        // Remove from memory storage
        await this.redisClient.del(`memory:${agent_id}:${memory_id}`);
        
        // Remove from indices
        await this.redisClient.zRem(`memory_index:${agent_id}`, memory_id);
        await this.redisClient.zRem(`memory_importance:${agent_id}`, memory_id);
        
        console.log(`✅ Memory ${memory_id} deleted from Redis for agent ${agent_id}`);
        
        // Also remove from in-memory cache if it exists there
        this.deleteFromMemory(agent_id, memory_id);
        
        return true;
      } catch (error) {
        console.error(`❌ Failed to delete memory from Redis: ${error}`);
        // Fall back to in-memory deletion
        return this.deleteFromMemory(agent_id, memory_id);
      }
    } else {
      // Delete from in-memory cache
      return this.deleteFromMemory(agent_id, memory_id);
    }
  }

  /**
   * Delete memory from the in-memory cache
   */
  private deleteFromMemory(agent_id: string, memory_id: string): boolean {
    if (!this.inMemoryCache[agent_id]) {
      return false;
    }
    
    if (this.inMemoryCache[agent_id][memory_id]) {
      delete this.inMemoryCache[agent_id][memory_id];
      console.log(`✅ Memory ${memory_id} deleted from in-memory cache for agent ${agent_id}`);
      return true;
    }
    
    return false;
  }

  /**
   * Clear all memories for an agent
   */
  public async clearAgentMemories(agent_id: string): Promise<boolean> {
    // Try to clear from Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        // Get all memory IDs for the agent
        const memory_ids = await this.redisClient.zRange(
          `memory_index:${agent_id}`, 
          0, 
          -1
        );
        
        // Delete all memories
        for (const memory_id of memory_ids) {
          await this.redisClient.del(`memory:${agent_id}:${memory_id}`);
        }
        
        // Delete indices
        await this.redisClient.del(`memory_index:${agent_id}`);
        await this.redisClient.del(`memory_importance:${agent_id}`);
        
        console.log(`✅ All memories cleared for agent ${agent_id}`);
        
        // Also clear from in-memory cache
        this.clearMemoryCache(agent_id);
        
        return true;
      } catch (error) {
        console.error(`❌ Failed to clear memories from Redis: ${error}`);
        // Fall back to in-memory clearing
        return this.clearMemoryCache(agent_id);
      }
    } else {
      // Clear from in-memory cache
      return this.clearMemoryCache(agent_id);
    }
  }

  /**
   * Clear agent memories from the in-memory cache
   */
  private clearMemoryCache(agent_id: string): boolean {
    if (this.inMemoryCache[agent_id]) {
      delete this.inMemoryCache[agent_id];
      console.log(`✅ All memories cleared from in-memory cache for agent ${agent_id}`);
      return true;
    }
    
    return false;
  }

  /**
   * Get a specific memory by ID
   */
  public async getMemory(agent_id: string, memory_id: string): Promise<Memory | null> {
    // Try to get from Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        const memory_json = await this.redisClient.get(`memory:${agent_id}:${memory_id}`);
        
        if (memory_json) {
          return JSON.parse(memory_json);
        }
        
        console.warn(`⚠️ Memory ${memory_id} not found in Redis for agent ${agent_id}`);
      } catch (error) {
        console.error(`❌ Failed to get memory from Redis: ${error}`);
      }
    }
    
    // Fall back to in-memory cache
    if (
      this.inMemoryCache[agent_id] &&
      this.inMemoryCache[agent_id][memory_id]
    ) {
      return this.inMemoryCache[agent_id][memory_id];
    }
    
    return null;
  }

  /**
   * Update the importance score of a memory
   */
  public async updateMemoryImportance(
    agent_id: string,
    memory_id: string,
    importance: number
  ): Promise<boolean> {
    // Try to update in Redis if connected
    if (this.isRedisConnected && this.redisClient) {
      try {
        // Get the memory
        const memory_json = await this.redisClient.get(`memory:${agent_id}:${memory_id}`);
        
        if (!memory_json) {
          console.warn(`⚠️ Memory ${memory_id} not found in Redis for agent ${agent_id}`);
          return false;
        }
        
        const memory = JSON.parse(memory_json);
        memory.importance = importance;
        
        // Update the memory
        await this.redisClient.set(`memory:${agent_id}:${memory_id}`, JSON.stringify(memory));
        
        // Update the importance index
        await this.redisClient.zAdd(`memory_importance:${agent_id}`, {
          score: importance,
          value: memory_id
        });
        
        console.log(`✅ Importance updated to ${importance} for memory ${memory_id}`);
        
        // Also update in in-memory cache if it exists there
        if (
          this.inMemoryCache[agent_id] &&
          this.inMemoryCache[agent_id][memory_id]
        ) {
          this.inMemoryCache[agent_id][memory_id].importance = importance;
        }
        
        return true;
      } catch (error) {
        console.error(`❌ Failed to update memory importance in Redis: ${error}`);
        // Fall back to in-memory update
        return this.updateImportanceInMemory(agent_id, memory_id, importance);
      }
    } else {
      // Update in in-memory cache
      return this.updateImportanceInMemory(agent_id, memory_id, importance);
    }
  }

  /**
   * Update memory importance in the in-memory cache
   */
  private updateImportanceInMemory(
    agent_id: string,
    memory_id: string,
    importance: number
  ): boolean {
    if (
      !this.inMemoryCache[agent_id] ||
      !this.inMemoryCache[agent_id][memory_id]
    ) {
      return false;
    }
    
    this.inMemoryCache[agent_id][memory_id].importance = importance;
    console.log(`✅ Importance updated to ${importance} for memory ${memory_id} in in-memory cache`);
    return true;
  }

  /**
   * Close connections to external services
   */
  public async close(): Promise<void> {
    if (this.isRedisConnected && this.redisClient) {
      await this.redisClient.quit();
      console.log('✅ Redis client closed');
    }
  }
}

// Create singleton instance
const memoryService = new MemoryService();

export default memoryService;