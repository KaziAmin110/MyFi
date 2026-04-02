import * as SecureStore from "expo-secure-store";
import { apiFetch } from "../utils/api";

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

// ── API Functions ────────────────────────────────────────────────────────────

export async function getUserContext(): Promise<UserContextResponse["data"]> {
  const json = await apiFetch("/users/me/context");
  return json.data;
}

export async function updateProfile(name: string): Promise<UserData> {
  const json = await apiFetch("/users/me/profile", {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
  return json.data.user;
}

export async function updateAvatar(formData: FormData): Promise<UserData> {
  const token = await SecureStore.getItemAsync("token");
  
  // Note: We don't use apiFetch here because we need to let the runtime
  // set the Content-Type header with the multipart boundary for FormData.
  const response = await fetch(`http://localhost:5500/api/users/me/avatar`, {
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
  await apiFetch("/users/me/password", {
    method: "PUT",
    body: JSON.stringify({ old_password, new_password }),
  });
}
