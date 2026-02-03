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
      .upload(filePath, file.buffer);

    if (error) {
      console.error("Supbase error uploading file:", error.message);
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
