// Chat-related TypeScript interfaces and types

export interface ChatSession {
  id: string;
  user_id: string;
  session_number: number;
  title: string;
  week_start_date: string;
  week_end_date: string;
  status: 'active' | 'completed' | 'archived';
  is_read_only: boolean;
  is_empty: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatSummary {
  id: string;
  session_id: string;
  summary_text: string;
  embedding?: number[];
  created_at: string;
}

export interface CoachingKnowledge {
  id: string;
  category: string | null;
  topic: string | null;
  content: string;
  embedding?: number[];
  similarity?: number;
  created_at: string;
}

export interface CreateSessionRequest {
  weekStartDate: string;
  weekEndDate: string;
}

export interface CreateSessionResponse {
  session: {
    id: string;
    title: string;
    weekStartDate: string;
    weekEndDate: string;
    status: string;
    isReadOnly: boolean;
  };
}

export interface GetSessionsResponse {
  sessions: {
    id: string;
    title: string;
    weekStartDate: string;
    weekEndDate: string;
    status: string;
    isReadOnly: boolean;
    messageCount: number;
    lastMessageAt: string | null;
    createdAt: string;
  }[];
}

export interface GetMessagesResponse {
  session: {
    id: string;
    title: string;
    isReadOnly: boolean;
    weekStartDate: string;
    weekEndDate: string;
  };
  messages: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
  }[];
  summary?: string | null;
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
}

export interface SendMessageResponse {
  userMessage: {
    id: string;
    role: 'user';
    content: string;
    createdAt: string;
  };
  assistantMessage: {
    id: string;
    role: 'assistant';
    content: string;
    createdAt: string;
  };
}
