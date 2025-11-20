import { supabase } from "../database/db";

export type SessionData = {
  session_id: string;
  assessment_id: string;
  current_question_index: number;
  status: "in_progress" | "completed";
};

export type QuestionData = {
  question_number: number;
  text: string;
  habitude_type: string;
};

export type AnsweredQuestionData = {
  question_number: number;
  answer_value: number;
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
      throw error;
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

export const getAssessmentSessionData = async (
  user_id: string,
  assessment_id: string
): Promise<SessionData | null> => {
  try {
    const { data, error } = await supabase
      .from("assessment_sessions")
      .select("id, assessment_id, current_question_index, status")
      .eq("user_id", user_id)
      .eq("assessment_id", assessment_id)
      .maybeSingle();

    if (error) {
      console.error(
        "Supbase error fetching assessment session data:",
        error.message
      );
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      session_id: data.id,
      assessment_id: data.assessment_id,
      current_question_index: data.current_question_index,
      status: data.status,
    };
  } catch (error) {
    console.error("Error fetching assessment session data:", error);
    throw error;
  }
};

// Fetches all active assessment session details for a given user
export const getAllUserSessions = async (
  user_id: string
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
      throw error;
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

export const createNewAssessmentSession = async (
  user_id: string,
  assessment_id: string
): Promise<SessionData> => {
  try {
    const { data, error } = await supabase
      .from("assessment_sessions")
      .insert({
        user_id,
        assessment_id,
        current_question_index: 1,
        status: "in_progress",
      })
      .select("id, assessment_id, current_question_index, status")
      .maybeSingle();

    if (error) {
      console.error(
        "Supbase error creating new assessment session:",
        error.message
      );
      throw error;
    }

    if (!data) {
      throw new Error("Failed to create new assessment session");
    }

    return {
      session_id: data.id,
      assessment_id: data.assessment_id,
      current_question_index: data.current_question_index,
      status: data.status,
    };
  } catch (error) {
    console.error("Error creating new assessment session:", error);
    throw error;
  }
};

export const getAssessmentQuestions = async (
  assessment_id: string
): Promise<QuestionData[]> => {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("question_text, habitude_type, order_index")
      .eq("assessment_id", assessment_id)
      .order("order_index", { ascending: true });

    if (error) {
      console.error(
        "Supbase error fetching assessment questions:",
        error.message
      );
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((question) => ({
      question_number: question.order_index,
      text: question.question_text,
      habitude_type: question.habitude_type,
    }));
  } catch (error) {
    console.error("Error fetching assessment questions:", error);
    throw error;
  }
};

export const getPreviouslyAnsweredQuestions = async (
  session_id: string
): Promise<AnsweredQuestionData[]> => {
  try {
    const { data, error } = await supabase
      .from("assessment_responses")
      .select(`answer_value, questions!inner(order_index)`)
      .eq("session_id", session_id)
      .order("questions(order_index)", { ascending: true });

    if (error) {
      console.error(
        "Supbase error fetching previously answered questions:",
        error.message
      );
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((answer) => ({
      question_number: answer.questions[0].order_index,
      answer_value: answer.answer_value,
    }));
  } catch (error) {
    console.error("Error fetching previously answered questions:", error);
    throw error;
  }
};
