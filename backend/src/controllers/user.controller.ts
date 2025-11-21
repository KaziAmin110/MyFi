import { Request, Response, NextFunction } from "express";
import { getUserProfile } from "../services/user.service";
import { getAllUserSessions } from "../services/assessment.service";

const ONBOARDING_ASSESSMENT_ID = "1";

// Fetches User Profile Information and Active Assessment Sessions
export const getUserContext = async (
  req: Request & { user?: string },
  res: Response
): Promise<Response | void> => {
  try {
    const user_id = req.user;

    const [userData, allSessions] = await Promise.all([
      getUserProfile(user_id as string),
      getAllUserSessions(user_id as string),
    ]);

    const onboardingSession = allSessions?.find(
      (session) => session.assessment_id == ONBOARDING_ASSESSMENT_ID
    );

    const isOnboardingCompleted = onboardingSession?.status === "completed";

    const activeSessions = allSessions?.filter(
      (session) => session.status === "in_progress"
    );

    return res.status(200).json({
      success: true,
      data: {
        user: {
          ...userData,
          onboarding_completed: isOnboardingCompleted,
          onboarding_session_id: onboardingSession?.session_id || null,
        },
        active_sessions: activeSessions || null,
      },
    });
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};
