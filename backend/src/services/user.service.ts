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
