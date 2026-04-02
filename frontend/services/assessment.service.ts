import { apiFetch } from "../utils/api";

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

// ── API Functions ────────────────────────────────────────────────────────────

/**
 * Initializes the onboarding assessment. If the user already has an
 * in-progress session it returns that session with previously answered
 * questions so the UI can resume.
 */
export async function initializeOnboardingAssessment(): Promise<OnboardingAssessmentData> {
  const json = await apiFetch("/assessments/onboarding/initialize", { method: "POST" });
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
  await apiFetch(`/assessments/sessions/${sessionId}/answers`, {
    method: "POST",
    body: JSON.stringify({
      question_id: parseInt(questionId, 10),
      answer_value: answerValue,
    }),
  });
}

/**
 * Finalises an assessment session — marks it completed and returns results.
 */
export async function submitAssessment(
  sessionId: number
): Promise<SubmitAssessmentResult> {
  const json = await apiFetch(`/assessments/sessions/${sessionId}/submit`, { method: "POST" });
  return json.data;
}
