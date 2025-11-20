import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  initializeOnboardingAssessment,
  submitAnswer,
} from "../controllers/assessment.controller";

const assessmentRouter = Router();

assessmentRouter.post(
  "/onboarding/initialize",
  authenticateUser,
  initializeOnboardingAssessment
);

assessmentRouter.post(
  "/sessions/:session_id/answers",
  authenticateUser,
  submitAnswer
);

export default assessmentRouter;
