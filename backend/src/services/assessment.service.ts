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

export type AssessmentHistoryItem = {
  session_id: string;
  assessment_title: string;
  status: "in_progress" | "completed";
  current_question_index?: number;
  updated_at?: Date | string;
  completed_at?: Date | string | null;
  version: number;
};

export type AssessmentDashboardResponse = {
  in_progress: AssessmentHistoryItem[];
  completed: AssessmentHistoryItem[];
};

export type AssessmentReport = Record<string, number>;

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
        updated_at: new Date(),
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
      throw new Error("Invalid Session or Question id");
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

      // Moves to next question if the answered question is the current index
      if (sessionData) {
        const isCurrentQuestion =
          sessionData.current_question_index === questionData.order_index;

        if (isCurrentQuestion) {
          const nextIndex = sessionData.current_question_index + 1;

          await supabase
            .from("assessment_sessions")
            .update({
              current_question_index: nextIndex,
              updated_at: new Date(),
            })
            .eq("id", session_id);
        }
      }
    }
  } catch (error) {
    console.error("Error saving answer:", error);
    throw error;
  }
};

// Validates if a session is valid and in progress
export const getExistingSessionData = async (
  session_id: string
): Promise<{
  id: string;
  assessment_id: string;
  current_question_index: number;
} | null> => {
  try {
    const { data, error } = await supabase
      .from("assessment_sessions")
      .select("id, assessment_id, current_question_index")
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
    const [questionsResult, answersResult] = await Promise.all([
      // Get Total Questions
      supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("assessment_id", assessment_id),

      // Get Total Answers
      supabase
        .from("assessment_responses")
        .select("question_id", { count: "exact", head: true })
        .eq("session_id", session_id),
    ]);

    const { count: totalQuestions, error: questionError } = questionsResult;
    const { count: answeredQuestions, error: answerError } = answersResult;

    if (questionError) throw questionError;
    if (answerError) throw answerError;

    // We treat null counts as 0
    const qCount = totalQuestions || 0;
    const aCount = answeredQuestions || 0;

    return qCount > 0 && aCount >= qCount;
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

// Fetches and calculates results for a given session
export const getAndCalculateResults = async (
  session_id: string,
  user_id: string
): Promise<AssessmentReport | null> => {
  try {
    interface OptimizedResponse {
      assessment_responses: {
        answer_value: number;
        questions: {
          habitude_type: string;
        };
      }[];
    }

    const { data, error } = await supabase
      .from("assessment_sessions")
      .select(
        `
        id,
        assessment_responses (
          answer_value,
          questions (
            habitude_type
          )
        )
      `
      )
      .eq("id", session_id)
      .eq("user_id", user_id)
      .eq("status", "completed")
      .maybeSingle();

    if (error) {
      console.error(
        "Supabase error fetching optimized results:",
        error.message
      );
      throw error;
    }

    if (!data) return null;

    const sessionData = data as unknown as OptimizedResponse;
    const responses = sessionData.assessment_responses;

    if (!responses || responses.length === 0) return {};

    const scoreMap: AssessmentReport = {};

    responses.forEach((r) => {
      const habitudeType = r.questions?.habitude_type;
      const val = Number(r.answer_value) || 0;

      if (habitudeType) {
        const key = habitudeType.toLowerCase();
        scoreMap[key] = (scoreMap[key] || 0) + val;
      }
    });

    return scoreMap;
  } catch (error) {
    console.error("Error calculating results:", error);
    throw error;
  }
};

// Fetches history for a user, returs both completed and in-progress sessions
export const getUserAssessmentHistory = async (
  user_id: string
): Promise<AssessmentDashboardResponse> => {
  try {
    const { data, error } = await supabase
      .from("assessment_sessions")
      .select(
        `
        id,
        assessment_id,
        current_question_index,
        status,
        updated_at,
        completed_at,
        assessments!inner (
          title,
          version
        )
      `
      )
      .eq("user_id", user_id)
      .order("updated_at", { ascending: false }); // Newest first

    if (error) {
      console.error("Supabase error fetching history:", error.message);
      throw error;
    }

    const result: AssessmentDashboardResponse = {
      in_progress: [],
      completed: [],
    };

    if (!data || data.length === 0) return result;

    data.forEach((row: any) => {
      const item: AssessmentHistoryItem = {
        session_id: row.id,
        assessment_title: row.assessments?.title || "Unknown Assessment",
        version: row.assessments?.version,
        status: row.status,
        current_question_index: row.current_question_index,
        updated_at: row.updated_at,
        completed_at: row.completed_at,
      };

      if (row.status === "completed") {
        result.completed.push(item);
      } else if (row.status === "in_progress") {
        result.in_progress.push(item);
      }
    });

    return result;
  } catch (error) {
    console.error("Error fetching assessment history:", error);
    throw error;
  }
};

export const isOngoingAssessment = async (
  user_id: string,
  assessment_id: string
) => {
  try {
    const { data, error } = await supabase
      .from("assessment_sessions")
      .select("id")
      .eq("user_id", user_id)
      .eq("assessment_id", assessment_id)
      .eq("status", "in_progress");

    if (error) {
      console.error(
        "Supabase error checking ongoing assessment:",
        error.message
      );
      throw error;
    }

    return data && data.length > 0 ? true : false;
  } catch (error) {
    console.error("Error checking ongoing assessment:", error);
    throw error;
  }
};
