import { NextRequest, NextResponse } from "next/server";
import { isWorkspaceRole } from "../../../../../../lib/settings-data";
import {
  canUseSupabaseAdmin,
  sendSupabaseWorkspaceInvite
} from "../../../../../../lib/supabase-admin";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../lib/session";
import { invitePlatformTeamMember } from "../../../../../../lib/supabase-platform-data";

type InviteUserRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: InviteUserRouteProps
) {
  const { brandId } = await params;
  const auth = await getAuthenticatedAppState();
  const formData = await request.formData();
  const nextPath = String(formData.get("next") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!auth) {
    return NextResponse.redirect(new URL(buildLoginPath(nextPath), request.url), 303);
  }

  if (!authHasBrandAccess(auth, brandId)) {
    return NextResponse.redirect(
      new URL(`/brands/${auth.defaultBrandId}/overview`, request.url),
      303
    );
  }

  if (isWorkspaceRole(role)) {
    const invitedMember = await invitePlatformTeamMember(brandId, {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      title: String(formData.get("title") ?? ""),
      role
    });

    if (canUseSupabaseAdmin()) {
      const inviteResult = await sendSupabaseWorkspaceInvite(
        invitedMember.email,
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
  }

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/settings/users`;

  const destination = new URL(redirectPath, request.url);

  if (destination.pathname === `/brands/${brandId}/settings/users`) {
    destination.searchParams.set("invite", canUseSupabaseAdmin() ? "sent" : "queued");
  }

  return NextResponse.redirect(destination, 303);
}
