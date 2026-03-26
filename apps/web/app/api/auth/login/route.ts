import { NextRequest, NextResponse } from "next/server";
import { getDefaultBrandPath } from "../../../../lib/navigation";
import {
  isLegacyLocalAuthFallbackEnabled,
  isSafeRedirectPath,
  setAppSessionCookie
} from "../../../../lib/session";
import { findSupabasePendingWorkspaceInviteByEmail } from "../../../../lib/supabase-workspace-auth";
import {
  findPendingWorkspaceInviteByEmail,
  getDefaultBrandIdForUser,
  getUserByEmail,
  isUserInBrand
} from "../../../../lib/workspace-data";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const requestedBrandId = String(formData.get("brandId") ?? "");
  const nextPath = String(formData.get("next") ?? "");

  if (!isLegacyLocalAuthFallbackEnabled()) {
    return NextResponse.redirect(
      new URL("/login?error=local-login-disabled", request.url),
      303
    );
  }

  const user = getUserByEmail(email);

  if (!user) {
    const pendingInvite =
      findPendingWorkspaceInviteByEmail(email) ??
      (await findSupabasePendingWorkspaceInviteByEmail(email));

    return NextResponse.redirect(
      new URL(
        `/login?error=${pendingInvite ? "invite-pending" : "unknown-user"}`,
        request.url
      ),
      303
    );
  }

  const defaultBrandId =
    requestedBrandId && isUserInBrand(user.id, requestedBrandId)
      ? requestedBrandId
      : getDefaultBrandIdForUser(user.id);

  if (!defaultBrandId) {
    return NextResponse.redirect(
      new URL("/login?error=no-brand-access", request.url),
      303
    );
  }

  const targetPath = isSafeRedirectPath(nextPath)
    ? nextPath
    : getDefaultBrandPath(defaultBrandId);
  const response = NextResponse.redirect(new URL(targetPath, request.url), 303);

  setAppSessionCookie(response, {
    userId: user.id,
    brandId: defaultBrandId,
    userEmail: user.email
  });

  return response;
}
