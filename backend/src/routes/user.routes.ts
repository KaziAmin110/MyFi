import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import { getUserContext } from "../controllers/user.controller";

const userRouter = Router();

userRouter.get("/me/context", authenticateUser, getUserContext);

export default userRouter;
