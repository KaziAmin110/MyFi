-- Migration: Add session memory and user coaching profiles
-- Run this in Supabase SQL Editor

-- 1. Add rolling summary columns to chat_sessions (within-session memory)
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS rolling_summary TEXT,
  ADD COLUMN IF NOT EXISTS rolling_summary_msg_count INT DEFAULT 0;

-- 2. User Coaching Profiles table (cross-session long-term memory)
CREATE TABLE IF NOT EXISTS user_coaching_profiles (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  coaching_summary TEXT NOT NULL DEFAULT '',
  sessions_summarized INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (using permissive policies since app uses service role key)
ALTER TABLE user_coaching_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to user_coaching_profiles"
  ON user_coaching_profiles FOR ALL
  USING (true)
  WITH CHECK (true);
