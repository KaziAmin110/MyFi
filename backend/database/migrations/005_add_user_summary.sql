-- Migration 005: Add user-facing weekly summary to chat_sessions
-- The existing summary_text in chat_summaries is AI-internal (used for RAG/coaching context).
-- This new column stores a second, user-facing summary written in second-person,
-- celebratory language that the user sees when they revisit a completed session.

ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS user_summary TEXT DEFAULT NULL;
