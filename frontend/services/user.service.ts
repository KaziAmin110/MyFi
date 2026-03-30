import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://localhost:5500/api";

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserData {
  id: number;
  name: string;
  email: string;
  provider_id: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  onboarding_session_id: number | null;
}

export interface ActiveSession {
  session_id: number;
  assessment_id: number;
  current_question_index: number;
  status: "in_progress" | "completed";
}

export interface UserContextResponse {
  success: boolean;
  data: {
    user: UserData;
    active_sessions: ActiveSession[] | null;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── API Functions ────────────────────────────────────────────────────────────

export async function getUserContext(): Promise<UserContextResponse["data"]> {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/me/context`);

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Failed to fetch user context");
  }

  return json.data;
}
