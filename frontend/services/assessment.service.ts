import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://localhost:5500/api";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AssessmentQuestion {
  question_id: number;
  question_number: number;
  text: string;
  habitude_type?: string;
}

export interface PreviouslyAnswered {
  question_id: string;
  answer_value: number;
}

export interface OnboardingAssessmentData {
  session_id: number;
  current_question_number: number;
  num_questions: number;
  questions: AssessmentQuestion[];
  previously_answered: PreviouslyAnswered[] | null;
}

export interface SubmitAssessmentResult {
  habitude_summary: any;
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

/**
 * Initializes the onboarding assessment. If the user already has an
 * in-progress session it returns that session with previously answered
 * questions so the UI can resume.
 */
export async function initializeOnboardingAssessment(): Promise<OnboardingAssessmentData> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/assessments/onboarding/initialize`,
    { method: "POST" }
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Failed to initialize onboarding assessment");
  }

  return json.data;
}

/**
 * Submits a single answer for a question within a session.
 * answer_value: -1 = "Not me", 0 = "Sometimes", 1 = "That's me"
 */
export async function submitAnswer(
  sessionId: number,
  questionId: string,
  answerValue: number
): Promise<void> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/assessments/sessions/${sessionId}/answers`,
    {
      method: "POST",
      body: JSON.stringify({
        question_id: parseInt(questionId, 10),
        answer_value: answerValue,
      }),
    }
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Failed to submit answer");
  }
}

/**
 * Finalises an assessment session — marks it completed and returns results.
 */
export async function submitAssessment(
  sessionId: number
): Promise<SubmitAssessmentResult> {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/assessments/sessions/${sessionId}/submit`,
    { method: "POST" }
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Failed to submit assessment");
  }

  return json.data;
}
