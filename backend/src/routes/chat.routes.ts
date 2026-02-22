import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  handleGetSessions,
  handleGetMessages,
  handleCreateSession,
  handleSendMessage,
} from "../controllers/chat.controller";

const router = Router();

router.get("/sessions", authenticateUser, handleGetSessions);
router.get("/sessions/:sessionId/messages", authenticateUser, handleGetMessages);
router.post("/sessions", authenticateUser, handleCreateSession);
router.post("/messages", authenticateUser, handleSendMessage);

export default router;
