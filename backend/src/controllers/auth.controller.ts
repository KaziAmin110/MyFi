import { Request, Response } from "express";
import { signUp, signIn } from "../services/auth.service";

interface AuthRequestBody {
  email: string;
  password: string;
}

// Sign Up
export const handleSignUp = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as AuthRequestBody;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const { data, error } = await signUp(email, password);

    if (error) {
      return res.status(error.status || 400).json({ message: error.message });
    }

    return res.status(201).json(data);
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};

// Sign In
export const handleSignIn = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as AuthRequestBody;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const { data, error } = await signIn(email, password);

    if (error) {
      return res.status(error.status || 401).json({ message: error.message });
    }

    return res.status(200).json(data);
  } catch (err: any) {
    return res
      .status(500)
      .json({ message: "Internal server error.", error: err.message });
  }
};
