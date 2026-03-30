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

assessmentRouter.use(authenticateUser);

assessmentRouter.post("/onboarding/initialize", initializeOnboardingAssessment);
assessmentRouter.post("/sessions/:session_id/answers", submitAnswer);
assessmentRouter.post("/sessions/:session_id/submit", submitAssessment);
assessmentRouter.post("/:assessment_id/start", createAssessmentSession);
assessmentRouter.get("/sessions/:session_id/results", getAssessmentResults);
assessmentRouter.get(
  "/sessions/:session_id/continue",
  continueAssessmentSession,
);

export default assessmentRouter;
