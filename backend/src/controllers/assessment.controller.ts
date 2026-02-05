import { Request, Response } from "express";
import {
  AnsweredQuestionData,
  createNewAssessmentSession,
  getAssessmentQuestions,
  getAssessmentSessionData,
  getExistingSessionData,
  getPreviouslyAnsweredQuestions,
  getSessionResults,
  getUserAssessmentHistory,
  isOngoingAssessment,
  markSessionAsCompleted,
  saveAssessmentAnswer,
  validateAllQuestionsAnswered,
} from "../services/assessment.service";

const ONBOARDING_ASSESSMENT_ID = "1";

// Initializes Onboarding Assessment
export const initializeOnboardingAssessment = async (
  req: Request & { user?: string },
  res: Response,
): Promise<Response | void> => {
  try {
    const user_id = req.user as string;

    const [existingSession, assessmentQuestions] = await Promise.all([
      getAssessmentSessionData(user_id, ONBOARDING_ASSESSMENT_ID),
      getAssessmentQuestions(ONBOARDING_ASSESSMENT_ID),
    ]);

    // Validate if onboarding is already completed
    if (existingSession?.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Onboarding assessment already completed",
      });
    }

    let finalSessionData = existingSession;
    let previously_answered: AnsweredQuestionData[] = [];

    if (!finalSessionData) {
      finalSessionData = await createNewAssessmentSession(
        user_id as string,
        ONBOARDING_ASSESSMENT_ID,
      );
    } else {
      previously_answered = await getPreviouslyAnsweredQuestions(
        finalSessionData.session_id,
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        session_id: finalSessionData.session_id,
        current_question_number: finalSessionData.current_question_index,
        num_questions: assessmentQuestions.length,
        questions: assessmentQuestions,
        previously_answered: previously_answered?.length
          ? previously_answered
          : null,
      },
    });
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

// Submits a response to an assessment question
export const submitAnswer = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { session_id } = req.params;
    const { question_id, answer_value } = req.body;

    if (!session_id || !question_id || answer_value === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (answer_value < -1 || answer_value > 1) {
      return res.status(400).json({
        success: false,
        message: "Response value must be between -1 and 1",
      });
    }

    await saveAssessmentAnswer(session_id, question_id, answer_value);

    return res.status(200).json({
      success: true,
      message: "Response saved successfully",
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

// Submits an assessment for completion
export const submitAssessment = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { session_id } = req.params;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check Valid Session Status
    const sessionData = await getExistingSessionData(session_id);

    if (!sessionData) {
      return res.status(400).json({
        success: false,
        message: "Invalid or already completed session",
      });
    }

    // Checks to see if all questions have been answered
    const allQuestionsAnswered = await validateAllQuestionsAnswered(
      session_id,
      sessionData.assessment_id,
    );

    if (!allQuestionsAnswered) {
      return res.status(400).json({
        success: false,
        message: "All questions must be answered before submission",
      });
    }

    // Update session status to completed and get results
    const results = await markSessionAsCompleted(session_id);

    return res.status(200).json({
      success: true,
      message: "Assessment submitted successfully",
      data: {
        habitude_summary: results,
      },
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

// Fetches Assessment Results
export const getAssessmentResults = async (
  req: Request & { user?: string },
  res: Response,
): Promise<Response | void> => {
  try {
    const { session_id } = req.params;
    const user_id = req.user as string;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "Missing session ID",
      });
    }
    // Validate Session Ownership and Completion
    const results = await getSessionResults(session_id, user_id);

    if (!results) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found or not completed",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        habitude_summary: results,
      },
    });
  } catch (error: any) {
    console.error("Get Results Error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

// Fetches Assessment History
export const getAssessmentHistory = async (
  req: Request & { user?: string },
  res: Response,
): Promise<Response | void> => {
  try {
    const user_id = req.user as string;

    const history = await getUserAssessmentHistory(user_id);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

// Creates a New Assessment Session
export const createAssessmentSession = async (
  req: Request & { user?: string },
  res: Response,
): Promise<Response | void> => {
  try {
    const user_id = req.user as string;
    const { assessment_id } = req.params;

    if (!assessment_id) {
      return res.status(400).json({
        success: false,
        message: "Missing assessment ID",
      });
    }

    const isOngoingAssessmentSession = await isOngoingAssessment(
      user_id,
      assessment_id,
    );

    if (isOngoingAssessmentSession) {
      return res.status(400).json({
        success: false,
        message:
          "You already have an ongoing assessment session for this assessment",
      });
    }

    const [newSession, assessmentQuestions] = await Promise.all([
      createNewAssessmentSession(user_id as string, assessment_id),
      getAssessmentQuestions(assessment_id),
    ]);

    return res.status(200).json({
      success: true,
      message: "Assessment session created successfully",
      data: {
        session_id: newSession.session_id,
        assessment_id: newSession.assessment_id,
        current_question_number: newSession.current_question_index,
        num_questions: assessmentQuestions.length,
        questions: assessmentQuestions,
      },
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

// Continues an Existing Assessment Session
export const continueAssessmentSession = async (
  req: Request & { user?: string },
  res: Response,
): Promise<Response | void> => {
  try {
    const user_id = req.user as string;
    const { session_id } = req.params;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "Missing session ID",
      });
    }

    const sessionData = await getExistingSessionData(session_id);

    if (!sessionData) {
      return res.status(404).json({
        success: false,
        message: "Session not found or already completed",
      });
    }

    const [assessmentQuestions, previouslyAnswered] = await Promise.all([
      getAssessmentQuestions(sessionData.assessment_id),
      getPreviouslyAnsweredQuestions(session_id),
    ]);

    return res.status(200).json({
      success: true,
      message: "Assessment session continued successfully",
      data: {
        session_id: sessionData.id,
        current_question_number: sessionData.current_question_index,
        num_questions: assessmentQuestions.length,
        questions: assessmentQuestions,
        previously_answered: previouslyAnswered?.length
          ? previouslyAnswered
          : null,
      },
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};
