import { Router } from "express";
import { handleSignIn, handleSignUp } from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/sign-up", handleSignUp);
authRouter.post("/sign-in", handleSignIn);

export default authRouter;
