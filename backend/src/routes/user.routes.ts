import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import { changePassword } from "../controllers/auth.controller";
import {
  deleteAccount,
  getUserContext,
  updateAvatar,
  updateProfile,
} from "../controllers/user.controller";
import { getAssessmentHistory } from "../controllers/assessment.controller";

const userRouter = Router();

userRouter.use(authenticateUser);

userRouter.get("/me/context", getUserContext);
userRouter.get("/me/assessments/history", getAssessmentHistory);
userRouter.put("/me/profile", updateProfile);
userRouter.put("/me/avatar", updateAvatar);
userRouter.put("/me/password", changePassword);
userRouter.delete("/me/account", deleteAccount);

export default userRouter;
