import { apiFetch } from "../utils/api";

export interface ChatSession {
  id: string;
  title: string;
  weekStartDate: string;
  weekEndDate: string;
  status: "active" | "completed" | "archived";
  isReadOnly: boolean;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface SessionWithMessages {
  session: {
    id: string;
    title: string;
    isReadOnly: boolean;
    weekStartDate: string;
    weekEndDate: string;
  };
  messages: ChatMessage[];
  summary: string | null;
  suggestedPrompts?: string[];
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

// API Functions

export async function getSessions(): Promise<ChatSession[]> {
  const json = await apiFetch("/chat/sessions");
  return json.data.sessions;
}

export async function getSessionMessages(
  sessionId: string
): Promise<SessionWithMessages> {
  const json = await apiFetch(`/chat/sessions/${sessionId}/messages`);
  return json.data;
}

export async function createSession(): Promise<ChatSession> {
  const json = await apiFetch("/chat/sessions", { method: "POST" });
  return json.data.session;
}

export async function sendMessage(
  sessionId: string,
  message: string
): Promise<SendMessageResponse> {
  const json = await apiFetch("/chat/messages", {
    method: "POST",
    body: JSON.stringify({ sessionId, message }),
  });
  return json.data;
}
