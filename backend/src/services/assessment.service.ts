import { supabase } from "../database/db";

type SessionData = {
  session_id: string;
  assessment_id: string;
  current_question_index: number;
  status: "in_progress" | "completed";
};

// Fetches the onboarding status for a given user and assessment
export const getOnboardingCompletedStatus = async (
  user_id: string,
  assessment_id: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("assessment_sessions")
      .select("status")
      .eq("user_id", user_id)
      .eq("assessment_id", assessment_id)
      .maybeSingle();

    if (error) {
      console.error("Supbase error fetching onboarding status:", error.message);
      return false;
    }

    // If no data found, onboarding is not completed
    if (!data) {
      return false;
    }

    return data.status === "completed";
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    throw error;
  }
};

// Fetches the assessment session details for a given user
export const getAllUserSessions = async (
  user_id: string,
  assessment_id: string
): Promise<SessionData[] | null> => {
  try {
    const { data, error } = await supabase
      .from("assessment_sessions")
      .select("id, assessment_id, current_question_index, status")
      .eq("user_id", user_id);

    if (error) {
      console.error(
        "Supbase error fetching active assessment session:",
        error.message
      );
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data.map((session) => ({
      session_id: session.id,
      assessment_id: session.assessment_id,
      current_question_index: session.current_question_index,
      status: session.status,
    }));
  } catch (error) {
    console.error("Error fetching active assessment session:", error);
    throw error;
  }
};
