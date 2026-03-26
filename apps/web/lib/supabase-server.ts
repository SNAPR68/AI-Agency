import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfigStatus } from "./supabase-env";

function readFirstConfiguredEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return "";
}

export function canUseSupabaseClientAuth() {
  return getSupabaseConfigStatus().clientAuthReady;
}

export function createSupabaseAuthClient() {
  const supabaseUrl = readFirstConfiguredEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]);
  const supabaseAnonKey = readFirstConfiguredEnv([
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ]);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase client auth is not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}
