ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS suggested_prompts TEXT[] DEFAULT '{}';
