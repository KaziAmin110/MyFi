import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  continueAssessmentSession,
  createAssessmentSession,
  getAssessmentResults,
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

assessmentRouter.post(
  "/:assessment_id/start",
  authenticateUser,
  createAssessmentSession
);

assessmentRouter.get(
  "/sessions/:session_id/results",
  authenticateUser,
  getAssessmentResults
);

assessmentRouter.get(
  "/sessions/:session_id/continue",
  authenticateUser,
  continueAssessmentSession
);

export default assessmentRouter;
