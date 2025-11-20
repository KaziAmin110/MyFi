import { Request, Response } from "express";
import {
  AnsweredQuestionData,
  createNewAssessmentSession,
  getAssessmentQuestions,
  getAssessmentSessionData,
  getPreviouslyAnsweredQuestions,
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
        current_question_index: finalSessionData.current_question_index,
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
