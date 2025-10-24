import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "../config/env";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  SUPABASE_URL as string,
  SUPABASE_SERVICE_ROLE_KEY as string
);
