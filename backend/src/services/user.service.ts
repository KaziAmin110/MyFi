import { supabase } from "../database/db";

export const getUserProfile = async (user_id: string) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, provider_id, avatar_url")
      .eq("id", user_id)
      .single();

    if (error) {
      console.error("Supbase error fetching user profile:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// Updates User Profile Information for Text Data (Name)
export const updateUserProfile = async (
  user_id: string,
  attribute: string,
  value: string,
) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ [attribute]: value })
      .eq("id", user_id)
      .select("id, name, email, provider_id, avatar_url")
      .single();

    if (error) {
      console.error("Supbase error updating user profile:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const uploadFile = async (
  file: Express.Multer.File,
  filePath: string,
) => {
  try {
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      console.error("Supabase error uploading file:", error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    if (!urlData) {
      console.error("Supbase error getting public url");
      return null;
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const deleteFileFromSupabase = async (filePath: string) => {
  try {
    const { error } = await supabase.storage.from("avatars").remove([filePath]);

    if (error) {
      console.error("Supbase error deleting file:", error.message);
      return null;
    }

    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

export const deleteUserRecord = async (user_id: string) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("id", user_id)
      .select("id, name, email, provider_id, avatar_url")
      .single();

    if (error) {
      console.error("Supbase error deleting user record:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error deleting user record:", error);
    throw error;
  }
};
