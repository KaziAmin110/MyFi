-- Migration: Create Chat System Tables
-- Run this in Supabase SQL Editor

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_number INT NOT NULL,
  title VARCHAR(255),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  is_read_only BOOLEAN DEFAULT FALSE,
  is_empty BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_number)
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_week_start ON chat_sessions(week_start_date);
CREATE INDEX idx_chat_sessions_is_empty ON chat_sessions(is_empty);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);

-- 2. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- 3. Chat Summaries Table (for future use)
CREATE TABLE IF NOT EXISTS chat_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_summaries_session_id ON chat_summaries(session_id);

-- 4. Coaching Knowledge Table (for RAG)
CREATE TABLE IF NOT EXISTS coaching_knowledge (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100),
  topic VARCHAR(255),
  content TEXT NOT NULL,
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coaching_knowledge_category ON coaching_knowledge(category);

-- SQL Function: Match coaching knowledge using cosine similarity
CREATE OR REPLACE FUNCTION match_coaching_knowledge(
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  category VARCHAR,
  topic VARCHAR,
  content TEXT,
  similarity FLOAT
)
LANGUAGE SQL
AS $$
  SELECT
    id,
    category,
    topic,
    content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM coaching_knowledge
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- SQL Function: Match user summaries (for future use)
CREATE OR REPLACE FUNCTION match_user_summaries(
  p_user_id INT,
  query_embedding VECTOR(768),
  match_threshold FLOAT DEFAULT 0.65,
  match_count INT DEFAULT 2
)
RETURNS TABLE (
  session_id UUID,
  session_number INT,
  weeks_ago INT,
  summary_text TEXT,
  similarity FLOAT
)
LANGUAGE SQL
AS $$
  SELECT
    cs.id AS session_id,
    cs.session_number,
    (SELECT MAX(session_number) FROM chat_sessions WHERE user_id = cs.user_id) - cs.session_number AS weeks_ago,
    chsum.summary_text,
    1 - (chsum.embedding <=> query_embedding) AS similarity
  FROM chat_summaries chsum
  JOIN chat_sessions cs ON cs.id = chsum.session_id
  WHERE cs.user_id = p_user_id
    AND cs.is_empty = FALSE
    AND 1 - (chsum.embedding <=> query_embedding) > match_threshold
  ORDER BY chsum.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Enable RLS (Row Level Security) for chat tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Note - app uses service role key which bypasses RLS
-- These policies are defined for security best practices but won't be enforced
-- since the app authenticates with custom JWT and uses service role key

CREATE POLICY "Allow all access to chat_sessions"
  ON chat_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to chat_messages"
  ON chat_messages FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to chat_summaries"
  ON chat_summaries FOR ALL
  USING (true)
  WITH CHECK (true);

-- Coaching knowledge is publicly readable (no user_id)
CREATE POLICY "Everyone can read coaching knowledge"
  ON coaching_knowledge FOR SELECT
  USING (true);
