import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

// Export environment variables used across the app. Add any new keys here
// so they have the same typed view when imported elsewhere.
export const {
  PORT,
  NODE_ENV,
  SUPABASE_URL,
  SUPABASE_KEY,
  DB_URI,
  ACCESS_SECRET,
  EVENTS_EMAIL,
  EVENTS_PASSWORD,
  REFRESH_SECRET,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  GEMINI_API_KEY,
} = process.env as {
  PORT?: string;
  NODE_ENV?: string;
  SUPABASE_URL?: string;
  SUPABASE_KEY?: string;
  DB_URI?: string;
  ACCESS_SECRET?: string;
  EVENTS_EMAIL?: string;
  EVENTS_PASSWORD?: string;
  REFRESH_SECRET?: string;
  ACCESS_EXPIRES_IN?: string;
  REFRESH_EXPIRES_IN?: string;
  GEMINI_API_KEY?: string;
};
