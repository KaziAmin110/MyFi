import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";

const assessmentRouter = Router();

assessmentRouter.post("/onboarding/initialize", authenticateUser);

export default assessmentRouter;
