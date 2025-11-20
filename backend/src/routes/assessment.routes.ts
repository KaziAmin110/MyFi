import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import { initializeOnboardingAssessment } from "../controllers/assessment.controller";

const assessmentRouter = Router();

assessmentRouter.post(
  "/onboarding/initialize",
  authenticateUser,
  initializeOnboardingAssessment
);

export default assessmentRouter;
