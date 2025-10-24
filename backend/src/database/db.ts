import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config/env";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  SUPABASE_URL as string,
  SUPABASE_ANON_KEY as string
);
