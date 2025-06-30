/*
  # GenesisOS Core Database Schema

  1. New Tables
    - `users` - User profiles extending auth.users
    - `guilds` - Digital departments/workspaces
    - `agents` - Digital workers with AI capabilities
    - `workflows` - Automation flows and processes
    - `blueprints` - AI-generated guild structures
    - `simulations` - Testing results for guild setups
    - `memories` - Agent memory storage with semantic search capability
    - `credentials` - Encrypted API keys and credentials

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Proper foreign key relationships with cascade deletes

  3. Performance
    - Indexes on frequently queried columns
    - Full-text search indexes for guilds and agents
    - Optimized memory search functionality

  4. Features
    - Automatic updated_at timestamps
    - JSON metadata columns for flexible data storage
    - Memory system with importance scoring and expiration
    - Encrypted credential storage
*/

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Guilds table (digital departments)
CREATE TABLE IF NOT EXISTS guilds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  purpose text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agents table (digital workers)
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  description text NOT NULL,
  guild_id uuid REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  personality text NOT NULL,
  instructions text NOT NULL,
  tools jsonb DEFAULT '[]',
  memory_config jsonb DEFAULT '{"short_term_enabled": true, "long_term_enabled": true, "memory_limit": 100, "retention_days": 365}',
  voice_config jsonb DEFAULT '{"enabled": true, "voice_id": "", "stability": 0.5, "similarity_boost": 0.5}',
  status text DEFAULT 'initializing' CHECK (status IN ('active', 'paused', 'error', 'initializing')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workflows table (automation flows)
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  guild_id uuid REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  trigger jsonb NOT NULL DEFAULT '{"type": "manual", "config": {}}',
  nodes jsonb DEFAULT '[]',
  edges jsonb DEFAULT '[]',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'error')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Blueprints table (AI-generated structures)
CREATE TABLE IF NOT EXISTS blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  user_input text NOT NULL,
  interpretation text NOT NULL,
  suggested_structure jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Simulations table (testing results)
CREATE TABLE IF NOT EXISTS simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid REFERENCES guilds(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  test_data jsonb NOT NULL DEFAULT '{}',
  results jsonb NOT NULL DEFAULT '{}',
  agent_responses jsonb DEFAULT '[]',
  overall_success boolean DEFAULT false,
  errors text[] DEFAULT '{}',
  execution_time float DEFAULT 0.0,
  created_at timestamptz DEFAULT now()
);

-- Memories table (agent memory storage)
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  memory_type text DEFAULT 'interaction' CHECK (memory_type IN ('interaction', 'learning', 'context', 'system')),
  metadata jsonb DEFAULT '{}',
  embedding_data jsonb, -- Store embedding as JSON array for semantic search
  importance_score float DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Credentials table (encrypted API keys)
CREATE TABLE IF NOT EXISTS credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  guild_id uuid REFERENCES guilds(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  credential_type text NOT NULL,
  encrypted_value text NOT NULL,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for guilds
CREATE POLICY "Users can read own guilds"
  ON guilds
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own guilds"
  ON guilds
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own guilds"
  ON guilds
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own guilds"
  ON guilds
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for agents
CREATE POLICY "Users can read own agents"
  ON agents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own agents"
  ON agents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents"
  ON agents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents"
  ON agents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for workflows
CREATE POLICY "Users can read own workflows"
  ON workflows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workflows"
  ON workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows"
  ON workflows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows"
  ON workflows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for blueprints
CREATE POLICY "Users can read own blueprints"
  ON blueprints
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own blueprints"
  ON blueprints
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for simulations
CREATE POLICY "Users can read own simulations"
  ON simulations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own simulations"
  ON simulations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for memories
CREATE POLICY "Users can read own agent memories"
  ON memories
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own agent memories"
  ON memories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for credentials
CREATE POLICY "Users can read own credentials"
  ON credentials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own credentials"
  ON credentials
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guilds_user_id ON guilds(user_id);
CREATE INDEX IF NOT EXISTS idx_guilds_status ON guilds(status);
CREATE INDEX IF NOT EXISTS idx_agents_guild_id ON agents(guild_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_workflows_guild_id ON workflows(guild_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_blueprints_user_id ON blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_guild_id ON simulations(guild_id);
CREATE INDEX IF NOT EXISTS idx_memories_agent_id ON memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);
CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_service_name ON credentials(service_name);

-- Index for memory content search (full-text)
CREATE INDEX IF NOT EXISTS idx_memories_content_search ON memories USING gin(to_tsvector('english', content));

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_guilds_search ON guilds USING gin(to_tsvector('english', name || ' ' || description));
CREATE INDEX IF NOT EXISTS idx_agents_search ON agents USING gin(to_tsvector('english', name || ' ' || role || ' ' || description));

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guilds_updated_at BEFORE UPDATE ON guilds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blueprints_updated_at BEFORE UPDATE ON blueprints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function for memory search (content-based until vector support is added)
CREATE OR REPLACE FUNCTION search_memories(
  agent_uuid uuid,
  search_query text,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content text,
  memory_type text,
  metadata jsonb,
  importance_score float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.memory_type,
    m.metadata,
    m.importance_score,
    m.created_at
  FROM memories m
  WHERE m.agent_id = agent_uuid
    AND (
      to_tsvector('english', m.content) @@ plainto_tsquery('english', search_query)
      OR m.content ILIKE '%' || search_query || '%'
    )
  ORDER BY 
    ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', search_query)) DESC,
    m.importance_score DESC,
    m.created_at DESC
  LIMIT match_count;
END;
$$;

-- Helper function to find similar memories by content
CREATE OR REPLACE FUNCTION find_similar_memories(
  agent_uuid uuid,
  reference_content text,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  memory_type text,
  similarity_score float,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.memory_type,
    ts_rank(to_tsvector('english', m.content), to_tsquery('english', reference_content)) as similarity_score,
    m.created_at
  FROM memories m
  WHERE m.agent_id = agent_uuid
    AND m.content != reference_content
    AND to_tsvector('english', m.content) @@ to_tsquery('english', reference_content)
  ORDER BY similarity_score DESC, m.created_at DESC
  LIMIT match_count;
END;
$$;