import { SUPABASE_URL, SUPABASE_KEY } from "../config/env";
import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

export const supabase = createClient(
  SUPABASE_URL as string,
  SUPABASE_KEY as string,
  { global: { fetch: fetch as any } }
);
