import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import {
  ACCESS_SECRET,
  ACCESS_EXPIRES_IN,
  REFRESH_SECRET,
  REFRESH_EXPIRES_IN,
} from "../config/env";

/*
  A high level abstraction of a user that encapsulates its core business logic while remaining independent 
  of lower-level components of the application such as the database.  
*/
class User {
  id: string;
  name: string;
  email: string;
  provider_id: string | null;
  provider: string | null;
  avatar_url: string | null;

  constructor(
    id: string,
    name: string,
    email: string,
    provider: string | null = null,
    providerId: string | null = null,
    avatarUrl: string | null = null
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.provider = provider;
    this.provider_id = providerId;
    this.avatar_url = avatarUrl;
  }

  // Handles given user password hashing
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Compares the given user password with the hashed password
  async comparePassword(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Provides a token so a user can be authenticated
  generateAccessToken(): string {
    if (!ACCESS_SECRET) {
      throw new Error("ACCESS_SECRET is not defined in environment variables");
    }
    return jwt.sign({ userId: this.id }, ACCESS_SECRET, {
      expiresIn: (ACCESS_EXPIRES_IN || "15m") as any,
    });
  }

  generateRefreshToken(): string {
    if (!REFRESH_SECRET) {
      throw new Error("REFRESH_SECRET is not defined in environment variables");
    }
    return jwt.sign({ userId: this.id }, REFRESH_SECRET, {
      expiresIn: (REFRESH_EXPIRES_IN || "7d") as any,
    });
  }
}

export default User;
