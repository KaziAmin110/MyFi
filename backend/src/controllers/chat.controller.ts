import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as chatService from "../services/chat.service";
import {
  CreateSessionResponse,
  GetSessionsResponse,
  GetMessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
} from "../types/chat.types";

export const handleGetSessions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user as string;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    const { data, error } = await chatService.getUserSessions(userId);

    if (error) {
      return res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }

    const response: GetSessionsResponse = { sessions: data || [] };
    return res.status(200).json({ 
      success: true,
      data: response
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const handleGetMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ 
        success: false,
        message: "Session ID is required" 
      });
    }

    const { data, error } = await chatService.getMessages(sessionId);

    if (error) {
      return res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }

    const response: GetMessagesResponse = data!;
    return res.status(200).json({ 
      success: true,
      data: response
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const handleCreateSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user as string;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    const { data, error } = await chatService.createSession(userId);

    if (error) {
      return res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }

    const response: CreateSessionResponse = { session: data! };
    return res.status(201).json({ 
      success: true,
      data: response
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

export const handleSendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user as string;
    // Type the request body for type safety
    const requestBody = req.body as SendMessageRequest;
    const { sessionId, message } = requestBody;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        message: "Session ID and message are required",
      });
    }

    if (typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Message cannot be empty" 
      });
    }

    const { data, error } = await chatService.chat(
      sessionId,
      userId,
      message
    );

    if (error) {
      if (error === "Session not found") {
        return res.status(404).json({ 
          success: false,
          message: error 
        });
      }
      return res.status(500).json({ 
        success: false,
        message: error 
      });
    }

    // Type the response data
    const response: SendMessageResponse = data!;
    return res.status(200).json({ 
      success: true,
      data: response
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
