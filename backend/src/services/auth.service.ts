import { supabase } from "../database/db";
import User from "../entities/user.entities";
import { OAuth2Client } from "google-auth-library";
import { GOOGLE_CLIENT_ID } from "../config/env";

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Updates Password of Existing User in the Database Based on User Id
export const updateUserPassword = async (
  attribute: string,
  value: any,
  newPassword: string
) => {
  try {
    const { error } = await (supabase
      .from("users")
      .update({ password: newPassword })
      .eq(attribute, value) as any);

    if (error) {
      return { error: error.message, status: 500 };
    }

    return { message: "Password Updated Successfully", status: 201 };
  } catch (error: any) {
    return {
      error: error.message,
      status: 500,
    };
  }
};

// Updates Refresh Token in DB upon Sign In
export const updateRefreshToken = async (id: string, refresh_token: string) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ refresh_token })
      .eq("id", id);

    if (error) {
      return { error: error.message, status: 500 };
    }

    return {
      success: true,
      message: "Refresh Token Updated Successfully",
      status: 201,
    };
  } catch (error: any) {
    return {
      error: error.message,
      status: 500,
    };
  }
};

// Inserts Email, Password Reset Token and Reset Expiration Date in Password_Reset Table
export const createPasswordResetDB = async (
  email: string,
  reset_token: string,
  reset_token_expiry: string
) => {
  try {
    const { data, error } = await supabase
      .from("password_reset") // Table name
      .insert([{ email, reset_token, reset_token_expiry }]);

    if (error) {
      return { error: error.message, status: 500 };
    }

    return { message: "User created successfully", data, status: 201 };
  } catch (error: any) {
    return {
      error: error.message,
      status: 500,
    };
  }
};

// Updates Password Reset Row with New Password Reset Token and Expiration Date
export const upsertPasswordResetDB = async (
  email: string,
  reset_token: string,
  reset_token_expiry: string
) => {
  try {
    const { error } = await supabase
      .from("password_reset")
      .upsert(
        { email, reset_token, reset_token_expiry },
        { onConflict: "email" }
      );

    if (error) {
      return { error: error.message, status: 500 };
    }

    return {
      message: "Password reset token upserted successfully",
      status: 201,
    };
  } catch (error: any) {
    return {
      error: error.message,
      status: 500,
    };
  }
};

// Removes Password Reset Table Entry Based on a Given Attribute and Value
export const removePasswordResetTokenDB = async (
  attribute: string,
  value: any
) => {
  try {
    const { error } = await (supabase
      .from("password_reset")
      .delete()
      .eq(attribute, value) as any);
  } catch (error: any) {
    return {
      error: error.message,
      status: 500,
    };
  }
};

// Checks the Validation of Password Reset Token including whether it exists and whether it has expired
export const verifyPasswordResetToken = (data: any) => {
  if (!data) return false;
  // Check that the token hasn't expired
  const now = new Date();
  const expiryDate = new Date(data.reset_token_expiry);

  if (expiryDate > now) {
    return true;
  } else {
    return false;
  }
};

// Retrieves Reset Token Based on Attribute
export const getResetTokenByAttribute = async (
  attribute: string,
  value: any
) => {
  try {
    const { data, error } = await (supabase
      .from("password_reset")
      .select("email, reset_token, reset_token_expiry")
      .eq(attribute, value)
      .single() as any);

    if (data) {
      return {
        email: data.email,
        reset_token: data.reset_token,
        reset_token_expiry: data.reset_token_expiry,
      };
    }

    // No Such User associated with Email
    return false;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Deletes Refresh Token from Database Based on Attribute
export const deleteRefreshTokenByAttribute = async (
  attribute: string,
  value: any
) => {
  try {
    const { error } = await supabase
      .from("users")
      .update({ refresh_token: null })
      .eq(attribute, value);

    if (error) {
      return { error: error.message, status: 500 };
    }

    return {
      success: true,
      message: "Refresh Token Deleted Successfully",
      status: 201,
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Checks whether a given number is in a valid format
export const isValidPhoneFormat = (phone_num: string) => {
  let isOnlyNumbers = /^\d+$/;
  if (phone_num.length == 10 && isOnlyNumbers.test(phone_num)) return true;

  return false;
};

// Checks whether a given email is in a valid format
export const isValidEmailFormat = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Checks whether a password matches complexity criteria
export const isValidPassword = (password: string) => {
  const passwordRegex =
    /^(?=.*[a-zA-Z0-9])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?/~\\-])(?=.{8,}).*$/;
  return passwordRegex.test(password);
};

// Generates a 6-Digit Random Alphanumeric Code
export const generateCode = (): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  return code;
};

// Retrieves User Entity Based on Attribute
export const getUserByAttribute = async (attribute: string, value: any) => {
  try {
    const { data, error } = await (supabase
      .from("users")
      .select("id, email, name, provider_id, avatar_url, password")
      .eq(attribute, value)
      .single() as any);

    if (data) {
      return new User(
        data.id,
        data.name,
        data.email,
        data.provider_id,
        data.avatar_url,
        data.password
      );
    }
    // No User Associated with Given Attribute
    return false;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Retrieves Hashed Password from DB
export const getSignInInfoDB = async (attribute: string, value: any) => {
  try {
    const { data, error } = await (supabase
      .from("users")
      .select("id, email, name, password")
      .eq(attribute, value)
      .single() as any);

    if (data) {
      return [new User(data.id, data.name, data.email), data.password];
    }
    // No Password Associated with Given Attribute
    return false;
  } catch (error: any) {
    throw error;
  }
};

// Retrieves User Entity Based on Attribute
export const getAdminByAttribute = async (attribute: string, value: any) => {
  try {
    const { data, error } = await (supabase
      .from("admin")
      .select("admin_id, name, email, uni_id, user_id")
      .eq(attribute, value)
      .single() as any);

    if (data) {
      return data;
    }

    // No User Associated with Given Attribute
    return false;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Retrieves User Role
export const getUserRole = async (user_id: string, rso_id: string) => {
  try {
    const { data, error } = await supabase
      .from("joins_rso")
      .select("role")
      .eq("user_id", user_id)
      .eq("rso_id", rso_id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data?.role || false;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Checks If user_id exists in a role table
export const isUserRole = async (role: string, user_id: string) => {
  try {
    const { data, error } = await (supabase
      .from(role as any)
      .select("user_id")
      .eq("user_id", user_id)
      .single() as any);

    const roleExists = !!data; // Converts data to boolean

    return roleExists;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Inserts a new User in the Database (Without OAuth)
export const createUser = async (
  name: string,
  email: string,
  password: string
) => {
  try {
    // Hash password before storing it
    const hashedPassword = await User.hashPassword(password);

    const { data, error } = await supabase
      .from("users") // Table name
      .insert([{ name, email, password: hashedPassword }])
      .select("id, name, email")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return new User(data.id, data.name, data.email);
  } catch (error: any) {
    return {
      error: error.message,
      status: 500,
    };
  }
};

// Inserts a new User in the Database (With OAuth)
export const createUserWithProvider = async (
  name: string,
  email: string,
  providerId: string,
  avatarUrl: string
) => {
  try {
    const { data, error } = await supabase
      .from("users") // Table name
      .insert([{ name, email, provider_id: providerId, avatar_url: avatarUrl }])
      .select("id, name, email, provider_id, avatar_url")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return new User(
      data.id,
      data.name,
      data.email,
      data.provider_id,
      data.avatar_url
    );
  } catch (error: any) {
    return {
      error: error.message,
      status: 500,
    };
  }
};

export const updateUserWithProvider = async (
  email: string,
  providerId: string,
  avatarUrl: string
) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ provider_id: providerId, avatar_url: avatarUrl })
      .eq("email", email)
      .select("id, name, email, provider_id, avatar_url")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return new User(
      data.id,
      data.name,
      data.email,
      data.provider_id,
      data.avatar_url
    );
  } catch (error: any) {
    return { status: 500, message: error.message };
  }
};

// Inserts a New SuperAdmin in the SuperAdmin Table
export const createSuperAdmin = async (
  user_id: string,
  name: string,
  email: string
) => {
  try {
    const { data, error } = await supabase
      .from("super_admin") // Table name
      .insert([{ user_id, name, email }]);

    if (error) {
      return { error: error.message, status: 500 };
    }

    // Invalidates Cache if they exist
    // await redisClient.del(`role:admin:${user_id}`);
    // await redisClient.del(`role:student:${user_id}`);

    return data;
  } catch (error: any) {
    return {
      error: error.message,
      status: 500,
    };
  }
};

// Inserts a New Admin in the Admin Table
export const createAdmin = async (
  user_id: string,
  name: string,
  email: string,
  uni_id: string
) => {
  try {
    const { data, error } = await supabase
      .from("admin") // Table name
      .insert([{ name, email, uni_id, user_id }])
      .select("admin_id")
      .single();

    if (error) {
      return { error: error.message, status: 500 };
    }

    return data;
  } catch (error: any) {
    return {
      error: error.message,
      status: 500,
    };
  }
};

// Removes Admin From Admin Table
export const deleteAdmin = async (user_id: string) => {
  try {
    const { data, error } = await supabase
      .from("admin") // Table name
      .delete()
      .eq("user_id", user_id);

    if (error) {
      console.log(error);
    }

    return {
      success: true,
      message: "Admin Removed Successfully",
    };
  } catch (error: any) {
    return {
      error: error.message,
      status: 500,
    };
  }
};

// Remove User from User Table
export const deleteUser = async (user_id: string) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", user_id);

    if (error) {
      throw new Error(error.message);
    }

    console.log(data);

    return {
      success: true,
      message: "User Deleted Successfully",
    };
  } catch (error: any) {
    return {
      error: error.message,
      status: 500,
    };
  }
};
// Verifies ID Token with Google
export const verifyGoogleToken = async (idToken: string) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error("Invalid Google Token Payload");
    }
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub,
    };
  } catch (error: any) {
    throw new Error(`Google Verification Failed: ${error.message}`);
  }
};

// Orchestrates User Sign In via OAuth
export const findOrCreateUserByOAuth = async (
  email: string,
  name: string,
  providerId: string,
  avatarUrl: string
) => {
  try {
    // 1. Check if user exists by email
    let user = await getUserByAttribute("email", email);

    if (user) {
      // 2. If user exists but has no provider_id, link it
      if (!user.provider_id) {
        const updateResult = await updateUserWithProvider(email, providerId, avatarUrl);
        if ("error" in updateResult || "message" in updateResult && !("id" in updateResult)) {
          throw new Error("Failed to link Google account to existing user");
        }
        return updateResult as User;
      }
      return user;
    } else {
      // 3. Create new user with provider info
      const createResult = await createUserWithProvider(name, email, providerId, avatarUrl);
      if ("error" in createResult) {
        throw new Error(`Failed to create user: ${createResult.error}`);
      }
      return createResult as User;
    }
  } catch (error: any) {
    throw new Error(`OAuth Synchronization Failed: ${error.message}`);
  }
};
// Verifies Supabase Access Token
export const verifySupabaseToken = async (accessToken: string) => {
  try {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new Error(error?.message || "Invalid Supabase Token");
    }

    return {
      email: data.user.email,
      name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0],
      picture: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
      sub: data.user.id,
    };
  } catch (error: any) {
    throw new Error(`Supabase Verification Failed: ${error.message}`);
  }
};
