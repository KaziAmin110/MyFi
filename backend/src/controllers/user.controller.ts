import { Request, Response, NextFunction } from "express";
import {
  getUserProfile,
  updateUserProfile,
  uploadFile,
} from "../services/user.service";
import { getAllUserSessions } from "../services/assessment.service";
import path from "path";

const ONBOARDING_ASSESSMENT_ID = "1";

// Fetches User Profile Information and Active Assessment Sessions
export const getUserContext = async (
  req: Request & { user?: string },
  res: Response,
): Promise<Response | void> => {
  try {
    const user_id = req.user;

    const [userData, allSessions] = await Promise.all([
      getUserProfile(user_id as string),
      getAllUserSessions(user_id as string),
    ]);

    const onboardingSession = allSessions?.find(
      (session) => session.assessment_id == ONBOARDING_ASSESSMENT_ID,
    );

    const isOnboardingCompleted = onboardingSession?.status === "completed";

    const activeSessions = allSessions?.filter(
      (session) => session.status === "in_progress",
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

// Updates User Profile Information
export const updateProfile = async (
  req: Request & { user?: string },
  res: Response,
): Promise<Response | void> => {
  try {
    const user_id = req.user;
    const { name } = req.body;

    if (!name) {
      console.error("Name is required");
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    const updatedUserData = await updateUserProfile(
      user_id as string,
      "name",
      name,
    );

    if (!updatedUserData) {
      console.error("Failed to update user profile");
      return res
        .status(500)
        .json({ success: false, message: "Failed to update profile" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUserData,
      },
    });
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

// Updates User Profile Avatar
export const updateAvatar = async (
  req: Request & { user?: string; file?: Express.Multer.File },
  res: Response,
): Promise<Response | void> => {
  try {
    const user_id = req.user;
    const file = req.file;

    if (!file) {
      console.error("Avatar file is required");
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const fileExt = path.extname(file.originalname);
    const fileName = `${user_id}-${Date.now()}${fileExt}`;
    const filePath = `public/avatars/${fileName}`;

    const publicUrl = await uploadFile(file, filePath);

    if (!publicUrl) {
      console.error("Failed to upload avatar");
      return res
        .status(500)
        .json({ success: false, message: "Failed to update profile" });
    }

    const updatedUserData = await updateUserProfile(
      user_id as string,
      "avatar_url",
      publicUrl,
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: updatedUserData,
      },
    });
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};
