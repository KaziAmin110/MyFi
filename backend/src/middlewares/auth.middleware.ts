import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ACCESS_SECRET } from "../config/env";

// Small local request augmentation for routes that expect `req.user` to exist.
// Avoids mutating the global Request type and keeps typing local to middleware.
export interface AuthRequest extends Request {
  user?: string | Record<string, any>;
}

export const authenticateUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized: No Token in Auth Header",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!ACCESS_SECRET) {
      console.error("ACCESS_SECRET is not set in environment");
      return res
        .status(500)
        .json({ success: false, message: "Server configuration error" });
    }

    // jwt.verify returns string | object depending on the token payload; coerce to any
    const decoded = jwt.verify(token, ACCESS_SECRET as string) as any;

    // Prefer decoded.userId when available, otherwise attach the whole decoded payload
    req.user = decoded && decoded.userId ? decoded.userId : decoded;

    return next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error("Token Expired:", error.message);
      return res.status(401).json({
        success: false,
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }
    console.error("Authentication Error:", error);
    return res
      .status(403)
      .json({ success: false, message: "Invalid or Expired token" });
  }
};

export const verifyOAuthRequest = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const secret = req.headers["x-oauth-secret"];
  if (!secret || secret !== process.env.OAUTH_SECRET) {
    console.warn("Invalid OAuth Secret in request");
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid OAuth Secret" });
  }
  next();
};
