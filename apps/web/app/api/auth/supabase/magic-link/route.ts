import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAuthClient } from "../../../../../lib/supabase-server";
import { shouldEnforceSupabaseHostedAccess } from "../../../../../lib/supabase-env";
import {
  findSupabasePendingWorkspaceInviteByEmail,
  getSupabaseWorkspaceUserByEmail
} from "../../../../../lib/supabase-workspace-auth";
import { findPendingWorkspaceInviteByEmail, getUserByEmail } from "../../../../../lib/workspace-data";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nextPath = String(formData.get("next") ?? "").trim();
  const supabaseHostedAccessEnforced = shouldEnforceSupabaseHostedAccess();
  const supabaseWorkspaceUser = await getSupabaseWorkspaceUserByEmail(email);
  const workspaceUser = supabaseHostedAccessEnforced
    ? supabaseWorkspaceUser
    : supabaseWorkspaceUser ?? getUserByEmail(email);

  if (!workspaceUser) {
    const pendingInvite =
      (await findSupabasePendingWorkspaceInviteByEmail(email)) ??
      (supabaseHostedAccessEnforced ? null : findPendingWorkspaceInviteByEmail(email));

    return NextResponse.redirect(
      new URL(
        `/login?error=${pendingInvite ? "invite-pending" : "unknown-user"}`,
        request.url
      ),
      303
    );
  }

  const redirectUrl = new URL("/api/auth/supabase/callback", request.url);

  if (nextPath) {
    redirectUrl.searchParams.set("next", nextPath);
  }

  const supabase = createSupabaseAuthClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl.toString(),
      shouldCreateUser: true
    }
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=supabase-auth-failed", request.url),
      303
    );
  }

  return NextResponse.redirect(new URL("/login?magicLink=sent", request.url), 303);
}
