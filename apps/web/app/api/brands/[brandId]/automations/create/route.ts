import { NextRequest, NextResponse } from "next/server";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../lib/session";
import { createPlatformAutomationPolicy } from "../../../../../../lib/supabase-platform-data";

type CreateAutomationRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: CreateAutomationRouteProps
) {
  const { brandId } = await params;
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

  await createPlatformAutomationPolicy(brandId, {
    name: String(formData.get("name") ?? ""),
    policyType: String(formData.get("policyType") ?? "custom_policy"),
    scope: String(formData.get("scope") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    triggerLabel: String(formData.get("triggerLabel") ?? "")
  });

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/settings/automations`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
