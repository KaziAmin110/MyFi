import { Request, Response, NextFunction } from "express";
import { getUserProfile } from "../services/user.service";
import { getAssessmentSessionData } from "../services/assessment.service";

const ONBOARDING_ASSESSMENT_ID = "1";

// Fetches User Profile Information and Onboarding Status
export const getUserContext = async (
  req: Request & { user?: string },
  res: Response
): Promise<Response | void> => {
  try {
    const user_id = req.user;

    const [userData, sessionData] = await Promise.all([
      getUserProfile(user_id as string),
      getAssessmentSessionData(user_id as string, ONBOARDING_ASSESSMENT_ID),
    ]);

    const isOnboardingCompleted = sessionData?.status === "completed";

    const activeSessionPayload = isOnboardingCompleted ? null : sessionData;

    return res.status(200).json({
      success: true,
      data: {
        user: {
          user: userData,
          onboarding_completed: isOnboardingCompleted,
        },
        active_session: activeSessionPayload,
      },
    });
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};
