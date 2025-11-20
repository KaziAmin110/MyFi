import { Request, Response } from "express";

const ONBOARDING_ASSESSMENT_ID = "1";

export const initializeOnboardingAssessment = async (
  req: Request & { user?: string },
  res: Response
): Promise<Response | void> => {
  try {
    const user_id = req.user;

    

  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};
