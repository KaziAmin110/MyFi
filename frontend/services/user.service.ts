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

export async function updateProfile(name: string): Promise<UserData> {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/me/profile`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Failed to update profile");
  }

  return json.data.user;
}

export async function updateAvatar(formData: FormData): Promise<UserData> {
  const token = await SecureStore.getItemAsync("token");
  
  // Note: We don't use fetchWithAuth here because we need to let the browser
  // set the Content-Type header with the boundary for FormData.
  const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Failed to update avatar");
  }

  return json.data.user;
}

export async function changePassword(old_password: string, new_password: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE_URL}/users/me/password`, {
    method: "PUT",
    body: JSON.stringify({ old_password, new_password }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Failed to change password");
  }
}
