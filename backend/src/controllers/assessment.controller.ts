import { Request, Response } from "express";
import {
  AnsweredQuestionData,
  createNewAssessmentSession,
  getAssessmentQuestions,
  getAssessmentSessionData,
  getPreviouslyAnsweredQuestions,
  getSessionData,
  markSessionAsCompleted,
  saveAssessmentAnswer,
  validateAllQuestionsAnswered,
} from "../services/assessment.service";

const ONBOARDING_ASSESSMENT_ID = "1";

export const initializeOnboardingAssessment = async (
  req: Request & { user?: string },
  res: Response
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
        ONBOARDING_ASSESSMENT_ID
      );
    } else {
      previously_answered = await getPreviouslyAnsweredQuestions(
        finalSessionData.session_id
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

export const submitAnswer = async (
  req: Request,
  res: Response
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

export const submitAssessment = async (
  req: Request,
  res: Response
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
    const sessionData = await getSessionData(session_id);

    if (!sessionData) {
      return res.status(400).json({
        success: false,
        message: "Invalid or already completed session",
      });
    }

    // Checks to see if all questions have been answered
    const allQuestionsAnswered = await validateAllQuestionsAnswered(
      session_id,
      sessionData.assessment_id
    );

    if (!allQuestionsAnswered) {
      return res.status(400).json({
        success: false,
        message: "All questions must be answered before submission",
      });
    }

    // Update session status to completed
    await markSessionAsCompleted(session_id);

    return res.status(200).json({
      success: true,
      message: "Assessment submitted successfully",
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};
