import { NextRequest, NextResponse } from "next/server";
import { markInboxItemRead } from "../../../../../../../lib/local-persistence";
import { markSupabaseInboxItemRead } from "../../../../../../../lib/supabase-workflow-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";
import { shouldEnforceSupabaseHostedAccess } from "../../../../../../../lib/supabase-env";

type InboxActionRouteProps = {
  params: Promise<{
    brandId: string;
    itemId: string;
  }>;
};

export async function POST(request: NextRequest, { params }: InboxActionRouteProps) {
  const { brandId, itemId } = await params;
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

  if (shouldEnforceSupabaseHostedAccess()) {
    await markSupabaseInboxItemRead(brandId, itemId);
  } else {
    markInboxItemRead(brandId, itemId);
  }

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath) ? nextPath : `/brands/${brandId}/inbox`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
