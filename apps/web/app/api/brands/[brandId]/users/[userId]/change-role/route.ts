import { NextRequest, NextResponse } from "next/server";
import { isWorkspaceRole } from "../../../../../../../lib/settings-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";
import { changePlatformTeamMemberRole } from "../../../../../../../lib/supabase-platform-data";

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
    await changePlatformTeamMemberRole(brandId, userId, role);
  }

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/settings/users`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
