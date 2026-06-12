import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "@/lib/env";
import type { Database } from "@/types/supabase";

export function createSupabaseClient() {
  const env = getRequiredEnv();

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

export function getMvpUserId() {
  return getRequiredEnv().NEXT_PUBLIC_MVP_USER_ID;
}
