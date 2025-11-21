import { Request, Response, NextFunction } from "express";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../entities/user.entities";
import {
  NODE_ENV,
  EVENTS_EMAIL,
  GOOGLE_CLIENT_ID,
  EVENTS_PASSWORD,
  REFRESH_SECRET,
} from "../config/env";
import {
  updateUserPassword,
  updateRefreshToken,
  createPasswordResetDB,
  verifyPasswordResetToken,
  updatePasswordResetDB,
  removePasswordResetTokenDB,
  getResetTokenByAttribute,
  deleteRefreshTokenByAttribute,
  isValidEmailFormat,
  isValidPassword,
  generateCode,
  getUserByAttribute,
  createUser,
  getSignInInfoDB,
  createUserWithProvider,
  updateUserWithProvider,
} from "../services/auth.service";

interface AuthRequestBody {
  email: string;
  password: string;
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Allows for the Creation of a New User in the Supabase DB
export const signUp = async (
  req: Request,
  res: Response
): Promise<Response | void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      const error = new Error("One or more required fields are not present");
      (error as any).statusCode = 400;
      throw error;
    }

    // Check Wheter Email and Password Criterias are met
    if (!isValidEmailFormat(email)) {
      const error = new Error(
        "Emai must be in the format <string@string.string>"
      );
      (error as any).statusCode = 400;
      throw error;
    }

    if (!isValidPassword(password)) {
      const error = new Error(
        `Password must meet the following requirements: Atleast 8 characters : Atleast One Special Character : Atleast One Alphanumeric Character`
      );
      (error as any).statusCode = 400;
      throw error;
    }
    // Querying the database to see if the given email exists in the database
    const existingUser = await getUserByAttribute("email", email);
    if (existingUser) {
      const error = new Error("Email Already Exists");
      (error as any).statusCode = 409;
      throw error;
    }

    // Create new user within the database
    const userResult = await createUser(name, email, password);

    // Check if createUser returned an error object instead of a User instance
    if ("error" in userResult) {
      return res.status(userResult.status || 500).json({
        success: false,
        message: userResult.error || "Failed to create user",
      });
    }

    const user = userResult;
    // Sends User Access Token in Response and Refresh Token in Cookies
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    const refreshTokenAge = 24 * 60 * 60 * 1000;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      maxAge: refreshTokenAge,
    });

    updateRefreshToken(user.id, refreshToken);

    return res.status(201).json({
      success: true,
      message: "User Created Successfully",
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// Allows User to Sign In -- Returns a JWT Token Upon Success
export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("One or more required fields are not present");
      (error as any).statusCode = 400;
      throw error;
    }

    const signInResult = await getSignInInfoDB("email", email);

    if (!signInResult) {
      const error = new Error("User does not exist");
      (error as any).statusCode = 404;
      throw error;
    }

    const [user, hashedPasswordFromDB] = signInResult as [User, string | null];

    if (!hashedPasswordFromDB) {
      const error = new Error("User does not exist");
      (error as any).statusCode = 404;
      throw error;
    }

    // Checking if the given password matches the hashed password
    const isPasswordValid = await user.comparePassword(
      password,
      hashedPasswordFromDB
    );

    if (!isPasswordValid) {
      const error = new Error("Invalid Password");
      (error as any).statusCode = 401;
      throw error;
    }

    // Generating the token via the user entity method
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Setting the refresh token in an HTTP-Only Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "strict",
    });

    updateRefreshToken(user.id, refreshToken);

    return res.status(200).json({
      success: true,
      message: "User Signed In Successfully",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.log(error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

export const oauthSignIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { provider, token, user_name } = req.body; // user_name needed for Apple first login

    let email = "";
    let name = "";
    let providerId = "";
    let avatarUrl = "";

    // Verify Token based on Provider
    if (provider === "google") {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      if (!payload) throw new Error("Invalid Google Token");

      email = payload.email!;
      name = payload.name || "";
      providerId = payload.sub;
      avatarUrl = payload.picture || "";
    } else {
      throw new Error("Invalid Provider");
    }

    let user = await getUserByAttribute("email", email);

    if (user) {
      const updateResult = await updateUserWithProvider(
        email,
        providerId,
        avatarUrl
      );

      if ("status" in updateResult && "message" in updateResult) {
        return res.status(updateResult.status || 500).json({
          success: false,
          message: updateResult.message || "Failed to update user",
        });
      }

      user = updateResult;
    } else {
      const createResult = await createUserWithProvider(
        name,
        email,
        providerId,
        avatarUrl
      );

      if ("error" in createResult) {
        return res.status(createResult.status || 500).json({
          success: false,
          message: createResult.error || "Failed to create user",
        });
      }

      user = createResult;
    }

    if (!user) throw new Error("Failed to process user");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    updateRefreshToken(user.id, refreshToken);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "User Signed In Successfully via OAuth",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.log(error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// Allows User to Sign Out -- Clears JWT Token from Cookies
export const signOut = async (
  req: Request & { user?: any },
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // Deletes Refresh Token in DB associated with user_id
    const user_id = req.user;
    await deleteRefreshTokenByAttribute("id", user_id);

    // await redisClient.flushAll();

    return res.status(200).json({
      success: true,
      message: "User logged out successfully.",
    });
  } catch (error: any) {
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};

// Sends Email to User with a Password Reset Token
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { email } = req.body;
    const user = await getUserByAttribute("email", email);

    if (!email) {
      const error = new Error("Email field is not present in API Request");
      (error as any).statusCode = 400;
      throw error;
    }

    if (!user) {
      const error = new Error("Email not found");
      (error as any).statusCode = 404;
      throw error;
    }

    const reset_token = generateCode();
    const resetTokenExpires = new Date(
      Date.now() + 60 * 60 * 1000
    ).toISOString(); // 1 hour

    const resetData = await getResetTokenByAttribute("email", email);

    if (!resetData) {
      await createPasswordResetDB(email, reset_token, resetTokenExpires);
    } else {
      await updatePasswordResetDB(email, reset_token, resetTokenExpires);
    }

    // Nodemailer Setup
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: EVENTS_EMAIL,
          pass: EVENTS_PASSWORD,
        },
      });

      const mailOptions = {
        from: EVENTS_EMAIL,
        to: email,
        subject: "Reset Your Password",
        text: `Your Password Reset Token Is: ${reset_token}`,
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        success: true,
        message: "Reset Email Sent Succesfully",
      });
    } catch (mailErr) {
      console.error("Error sending reset email:", mailErr);
      const error = new Error("Failed to send reset email");
      (error as any).statusCode = 500;
      throw error;
    }
  } catch (err: any) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};

// Allows User to Reset Their Password using the Password Reset Token
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { reset_token, new_password } = req.body;

    if (!reset_token) {
      const error = new Error("Token Field is Not Present in API Request");
      (error as any).statusCode = 400;
      throw error;
    }

    if (!new_password) {
      const error = new Error("New Password Field Not Present in API request");
      (error as any).statusCode = 400;
      throw error;
    }

    if (!isValidPassword(new_password)) {
      const error = new Error(
        "Password must meet the following requirements: 8 characters : Atleast One Special Character : Atleast One Alphanumeric Character"
      );
      (error as any).statusCode = 400;
      throw error;
    }

    const data = await getResetTokenByAttribute("reset_token", reset_token);
    if (!data) {
      const error = new Error("Invalid Password Reset Token");
      (error as any).statusCode = 400;
      throw error;
    }
    const isValidToken = verifyPasswordResetToken(data);

    if (isValidToken) {
      const hashedPassword = await User.hashPassword(new_password);
      await updateUserPassword("email", data.email, hashedPassword);
      await removePasswordResetTokenDB("email", data.email);
      return res.status(200).json({
        success: true,
        message: "Password Updated Successfully",
      });
    } else {
      const error = new Error("Invalid Password Reset Token");
      (error as any).statusCode = 400;
      throw error;
    }
  } catch (err: any) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};

// Uses Refresh Token Stored in Cookies to give a new access token to a User
export const refreshAccess = async (
  req: Request & { cookies?: any },
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // Get Refresh Token from Cookies
    const cookies = req.cookies;
    // Given JWT Cookie Doesnt Exist
    if (!cookies?.refreshToken) {
      const error = new Error("JWT refresh failed - No JWT Cookie Found");
      (error as any).statusCode = 401;
      throw error;
    }

    const refreshToken = cookies.refreshToken;
    const user = await getUserByAttribute("refresh_token", refreshToken);

    if (!user) {
      const error = new Error(
        "JWT refresh failed - Unable to Authenticate User"
      );
      (error as any).statusCode = 403;
      throw error;
    }

    // Verify refresh token synchronously (throws on invalid)
    try {
      const payload = jwt.verify(refreshToken, REFRESH_SECRET as string) as any;
      if (!payload || user.id !== payload.id) {
        const error = new Error(
          "JWT refresh failed - Unable to Authenticate User."
        );
        (error as any).statusCode = 403;
        throw error;
      }
    } catch (verifyErr) {
      const error = new Error(
        "JWT refresh failed - Unable to Authenticate User."
      );
      (error as any).statusCode = 403;
      throw error;
    }

    const accessToken = user.generateAccessToken();

    return res.status(200).json({
      success: true,
      message: "JWT Refresh Successful",
      accessToken,
    });
  } catch (err: any) {
    return res
      .status(err.statusCode || 500)
      .json({ success: false, message: err.message || "Server Error" });
  }
};
