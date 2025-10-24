import { supabase } from "../database/db";

// Service function to sign up a new user.
export const signUp = async (email: string, password_: string) => {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password_,
  });
  return { data, error };
};

// Service function to sign in an existing user.
export const signIn = async (email: string, password_: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password_,
  });
  return { data, error };
};
