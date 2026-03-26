import { NextRequest, NextResponse } from "next/server";
import {
  canUseSupabaseAdmin,
  sendSupabaseWorkspaceInvite
} from "../../../../../../../lib/supabase-admin";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";
import { resendPlatformTeamInvite } from "../../../../../../../lib/supabase-platform-data";

type UserActionRouteProps = {
  params: Promise<{
    brandId: string;
    userId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: UserActionRouteProps
) {
  const { brandId, userId } = await params;
  const auth = await getAuthenticatedAppState();
  const formData = await request.formData();
  const nextPath = String(formData.get("next") ?? "");

  if (!auth) {
    return NextResponse.redirect(new URL(buildLoginPath(nextPath), request.url), 303);
  }

  if (!authHasBrandAccess(auth, brandId)) {
    return NextResponse.redirect(
      new URL(`/brands/${auth.defaultBrandId}/overview`, request.url),
      303
    );
  }

  const member = await resendPlatformTeamInvite(brandId, userId);

  if (member && canUseSupabaseAdmin()) {
    const inviteResult = await sendSupabaseWorkspaceInvite(
      member.email,
      request.url,
      nextPath && isSafeRedirectPath(nextPath) ? nextPath : `/brands/${brandId}/settings/users`
    );

    if (inviteResult.error) {
      return NextResponse.redirect(
        new URL(`/brands/${brandId}/settings/users?invite=failed`, request.url),
        303
      );
    }
  }

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/settings/users`;

  const destination = new URL(redirectPath, request.url);

  if (destination.pathname === `/brands/${brandId}/settings/users`) {
    destination.searchParams.set("invite", canUseSupabaseAdmin() ? "resent" : "queued");
  }

  return NextResponse.redirect(destination, 303);
}
