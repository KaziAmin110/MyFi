import { supabase } from "../database/db";

type OnboardingStatus = {
  id: string;
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
