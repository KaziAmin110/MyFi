import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  forgotPassword,
  resetPassword,
  signIn,
  signOut,
  signUp,
  verifyResetToken,
} from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/sign-up", signUp);
authRouter.post("/sign-in", signIn);
authRouter.post("/sign-out", authenticateUser, signOut);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/verify-token", verifyResetToken);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
