import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  initializeOnboardingAssessment,
  submitAnswer,
  submitAssessment,
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

assessmentRouter.post(
  "/sessions/:session_id/submit",
  authenticateUser,
  submitAssessment
);

export default assessmentRouter;
