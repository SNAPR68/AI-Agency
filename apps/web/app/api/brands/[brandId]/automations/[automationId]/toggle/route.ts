import { NextRequest, NextResponse } from "next/server";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";
import { togglePlatformAutomationPolicy } from "../../../../../../../lib/supabase-platform-data";

type AutomationActionRouteProps = {
  params: Promise<{
    brandId: string;
    automationId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: AutomationActionRouteProps
) {
  const { brandId, automationId } = await params;
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

  await togglePlatformAutomationPolicy(brandId, automationId);

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/settings/automations`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
