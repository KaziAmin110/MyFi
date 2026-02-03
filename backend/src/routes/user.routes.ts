import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  getUserContext,
  updateAvatar,
  updateProfile,
} from "../controllers/user.controller";
import { getAssessmentHistory } from "../controllers/assessment.controller";

const userRouter = Router();

userRouter.get("/me/context", authenticateUser, getUserContext);
userRouter.get(
  "/me/assessments/history",
  authenticateUser,
  getAssessmentHistory,
);

userRouter.put("/me/profile", authenticateUser, updateProfile);
userRouter.put("/me/avatar", authenticateUser, updateAvatar);

export default userRouter;
