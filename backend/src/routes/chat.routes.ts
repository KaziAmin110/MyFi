import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  handleGetSessions,
  handleGetMessages,
  handleCreateSession,
  handleSendMessage,
} from "../controllers/chat.controller";

const chatRouter = Router();

chatRouter.get("/sessions", authenticateUser, handleGetSessions);
chatRouter.get("/sessions/:sessionId/messages", authenticateUser, handleGetMessages);
chatRouter.post("/sessions", authenticateUser, handleCreateSession);
chatRouter.post("/messages", authenticateUser, handleSendMessage);

export default chatRouter;
