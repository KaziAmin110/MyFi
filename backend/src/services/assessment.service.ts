import { count } from "console";
import { supabase } from "../database/db";

export type SessionData = {
  session_id: string;
  assessment_id: string;
  current_question_index: number;
  status: "in_progress" | "completed";
};

export type QuestionData = {
  question_id: string;
  question_number: number;
  text: string;
  habitude_type: string;
};

export type AnsweredQuestionData = {
  question_id: string;
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

// Fetches the assessment session details for a given user and assessment
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

// Creates a new assessment session
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

// Fetches the questions for a given assessment
export const getAssessmentQuestions = async (
  assessment_id: string
): Promise<QuestionData[]> => {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select("id, question_text, habitude_type, order_index")
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
      question_id: question.id,
      question_number: question.order_index,
      text: question.question_text,
      habitude_type: question.habitude_type,
    }));
  } catch (error) {
    console.error("Error fetching assessment questions:", error);
    throw error;
  }
};

// Fetches the previously answered questions for a given session
export const getPreviouslyAnsweredQuestions = async (
  session_id: string
): Promise<AnsweredQuestionData[]> => {
  try {
    const { data, error } = await supabase
      .from("assessment_responses")
      .select(`answer_value, questions!inner(id,order_index)`)
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

    return data.map((answer: any) => ({
      question_id: answer.questions.id,
      question_number: answer.questions.order_index,
      answer_value: answer.answer_value,
    }));
  } catch (error) {
    console.error("Error fetching previously answered questions:", error);
    throw error;
  }
};

// Save the user's response to a question
export const saveAssessmentAnswer = async (
  session_id: string,
  question_id: string,
  answer_value: number | string
): Promise<void> => {
  try {
    const { error: answerError } = await supabase
      .from("assessment_responses")
      .upsert(
        {
          session_id,
          question_id,
          answer_value,
          answered_at: new Date(),
        },
        { onConflict: "session_id, question_id" }
      );

    if (answerError) {
      throw new Error(answerError.message);
    }

    const { data: questionData } = await supabase
      .from("questions")
      .select("order_index")
      .eq("id", question_id)
      .single();

    if (questionData) {
      const { data: sessionData } = await supabase
        .from("assessment_sessions")
        .select("current_question_index")
        .eq("id", session_id)
        .single();

      const nextPotentialIndex = questionData.order_index + 1;

      if (
        sessionData &&
        nextPotentialIndex > sessionData.current_question_index
      ) {
        await supabase
          .from("assessment_sessions")
          .update({
            current_question_index: nextPotentialIndex,
            updated_at: new Date(),
          })
          .eq("id", session_id);
      }
    }
  } catch (error) {
    console.error("Error saving answer:", error);
    throw error;
  }
};

// Validates if a session is valid and in progress
export const getSessionData = async (
  session_id: string
): Promise<{ id: string; assessment_id: string } | null> => {
  try {
    const { data, error } = await supabase
      .from("assessment_sessions")
      .select("id, assessment_id")
      .eq("id", session_id)
      .eq("status", "in_progress")
      .maybeSingle();

    if (error) {
      console.error("Supbase error checking session validity:", error.message);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error checking session validity:", error);
    throw error;
  }
};

// Validates if all questions have been answered in a session
export const validateAllQuestionsAnswered = async (
  session_id: string,
  assessment_id: string
): Promise<boolean> => {
  try {
    // Total Questions Count
    const { count: totalQuestions, error: questionError } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("assessment_id", assessment_id);

    if (questionError) {
      console.error(
        "Supbase error fetching total questions count:",
        questionError.message
      );
      throw questionError;
    }

    // Answered Questions Count
    const { count: answeredQuestions, error: answerError } = await supabase
      .from("assessment_responses")
      .select("question_id", { count: "exact", head: true })
      .eq("session_id", session_id);

    if (answerError) {
      console.error(
        "Supbase error fetching answered questions count:",
        answerError.message
      );
      throw answerError;
    }

    return (
      (totalQuestions &&
        answeredQuestions &&
        totalQuestions <= answeredQuestions) ||
      false
    );
  } catch (error) {
    console.error("Error validating all questions answered:", error);
    throw error;
  }
};

// Marks session as completed
export const markSessionAsCompleted = async (
  session_id: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from("assessment_sessions")
      .update({
        status: "completed",
        updated_at: new Date(),
        completed_at: new Date(),
      })
      .eq("id", session_id)
      .eq("status", "in_progress");

    if (error) {
      console.error(
        "Supabase error marking session as completed:",
        error.message
      );
      throw error;
    }
  } catch (error) {
    console.error("Error marking session as completed:", error);
    throw error;
  }
};
