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

export function canUseSupabaseAdmin() {
  return getSupabaseConfigStatus().serverAdminReady;
}

export function createSupabaseAdminClient() {
  const supabaseUrl = readFirstConfiguredEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]);
  const serviceRoleKey = readFirstConfiguredEnv(["SUPABASE_SERVICE_ROLE_KEY"]);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin client is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

export async function sendSupabaseWorkspaceInvite(
  email: string,
  requestUrl: string,
  nextPath?: string
) {
  const supabase = createSupabaseAdminClient();
  const redirectUrl = new URL("/api/auth/supabase/callback", requestUrl);

  if (nextPath) {
    redirectUrl.searchParams.set("next", nextPath);
  }

  return supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: redirectUrl.toString()
  });
}
