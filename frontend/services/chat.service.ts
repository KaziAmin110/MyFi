import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://localhost:5500/api";

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

async function getAuthToken(): Promise<string | null> {
  return await SecureStore.getItemAsync("token");
}

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error("No authentication token found");
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

// API Functions

export async function getSessions(): Promise<ChatSession[]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/chat/sessions`);
  
  const json = await response.json();
  
  if (!response.ok) {
    throw new Error(json.message || "Failed to fetch sessions");
  }
  
  return json.data.sessions;
}

export async function getSessionMessages(
  sessionId: string
): Promise<SessionWithMessages> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/chat/sessions/${sessionId}/messages`
  );
  
  const json = await response.json();
  
  if (!response.ok) {
    throw new Error(json.message || "Failed to fetch messages");
  }
  
  return json.data;
}

export async function createSession(): Promise<ChatSession> {
  const response = await fetchWithAuth(`${API_BASE_URL}/chat/sessions`, {
    method: "POST",
  });
  
  const json = await response.json();
  
  if (!response.ok) {
    throw new Error(json.message || "Failed to create session");
  }
  
  return json.data.session;
}

export async function sendMessage(
  sessionId: string,
  message: string
): Promise<SendMessageResponse> {
  const response = await fetchWithAuth(`${API_BASE_URL}/chat/messages`, {
    method: "POST",
    body: JSON.stringify({ sessionId, message }),
  });
  
  const json = await response.json();
  
  if (!response.ok) {
    // Check for assessment required error
    if (json.code === "ASSESSMENT_REQUIRED") {
      const error = new Error(json.message) as any;
      error.code = "ASSESSMENT_REQUIRED";
      throw error;
    }
    
    throw new Error(json.message || "Failed to send message");
  }
  
  return json.data;
}
