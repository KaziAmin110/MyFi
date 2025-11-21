import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  forgotPassword,
  oauthSignIn,
  resetPassword,
  signIn,
  signOut,
  signUp,
} from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/sign-up", signUp);
authRouter.post("/oauth", oauthSignIn);
authRouter.post("/sign-in", signIn);
authRouter.post("/sign-out", authenticateUser, signOut);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
