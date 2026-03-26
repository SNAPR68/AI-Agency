import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getDefaultBrandPath } from "../../../../../lib/navigation";
import { createSupabaseAuthClient } from "../../../../../lib/supabase-server";
import {
  getSupabaseDefaultBrandIdForUser,
  getSupabaseWorkspaceUserByEmail
} from "../../../../../lib/supabase-workspace-auth";
import {
  isSafeRedirectPath,
  setAppSessionCookie
} from "../../../../../lib/session";
import { getDefaultBrandIdForUser, getUserByEmail } from "../../../../../lib/workspace-data";

const supportedOtpTypes = new Set<EmailOtpType>([
  "email",
  "magiclink",
  "signup",
  "invite",
  "recovery",
  "email_change"
]);

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") ?? "email";
  const nextPath = request.nextUrl.searchParams.get("next");

  if (!tokenHash || !supportedOtpTypes.has(type as EmailOtpType)) {
    return NextResponse.redirect(
      new URL("/login?error=supabase-auth-failed", request.url),
      303
    );
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=supabase-auth-failed", request.url),
      303
    );
  }

  const email = data.user?.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.redirect(
      new URL("/login?error=no-brand-access", request.url),
      303
    );
  }

  const supabaseWorkspaceUser = await getSupabaseWorkspaceUserByEmail(email);
  const localWorkspaceUser = getUserByEmail(email);
  const workspaceUser = localWorkspaceUser ?? supabaseWorkspaceUser;

  if (!workspaceUser) {
    return NextResponse.redirect(
      new URL("/login?error=no-brand-access", request.url),
      303
    );
  }

  const defaultBrandId =
    (supabaseWorkspaceUser
      ? await getSupabaseDefaultBrandIdForUser(supabaseWorkspaceUser.email)
      : null) ?? getDefaultBrandIdForUser(workspaceUser.id);

  if (!defaultBrandId) {
    return NextResponse.redirect(
      new URL("/login?error=no-brand-access", request.url),
      303
    );
  }

  const targetPath = isSafeRedirectPath(nextPath)
    ? nextPath ?? getDefaultBrandPath(defaultBrandId)
    : getDefaultBrandPath(defaultBrandId);
  const response = NextResponse.redirect(new URL(targetPath, request.url), 303);

  setAppSessionCookie(response, {
    userId: workspaceUser.id,
    brandId: defaultBrandId,
    userEmail: email
  });

  return response;
}
