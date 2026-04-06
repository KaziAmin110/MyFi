import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  forgotPassword,
  resetPassword,
  signIn,
  signOut,
  signUp,
  verifyResetToken,
  refreshAccess,
  googleSignIn,
} from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/sign-up", signUp);
authRouter.post("/sign-in", signIn);
authRouter.post("/sign-out", authenticateUser, signOut);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/verify-token", verifyResetToken);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/refresh-token", refreshAccess);
authRouter.post("/google-signin", googleSignIn);

export default authRouter;
