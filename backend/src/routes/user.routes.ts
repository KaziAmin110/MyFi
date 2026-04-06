import { Router } from "express";
import multer from "multer";

import { authenticateUser } from "../middlewares/auth.middleware";
import { changePassword } from "../controllers/auth.controller";
import {
  deleteAccount,
  getUserContext,
  updateAvatar,
  updateProfile,
  updateExpoPushToken,
} from "../controllers/user.controller";
import { getAssessmentHistory } from "../controllers/assessment.controller";

const userRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

userRouter.use(authenticateUser);

userRouter.get("/me/context", getUserContext);
userRouter.get("/me/assessments/history", getAssessmentHistory);
userRouter.put("/me/profile", updateProfile);
userRouter.put("/me/avatar", upload.single("avatar"), updateAvatar);
userRouter.put("/me/expo-push-token", updateExpoPushToken);
userRouter.put("/me/password", changePassword);
userRouter.delete("/me/account", deleteAccount);

export default userRouter;
