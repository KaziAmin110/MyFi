import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

export const { PORT, NODE_ENV, SUPABASE_URL, DB_URI, SUPABASE_ANON_KEY } =
  process.env;
