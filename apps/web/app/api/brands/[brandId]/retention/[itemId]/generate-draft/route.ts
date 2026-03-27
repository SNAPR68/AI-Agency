import { NextRequest, NextResponse } from "next/server";
import { createRetentionDraftAsync } from "../../../../../../../lib/customer-ops-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";

type RetentionActionRouteProps = {
  params: Promise<{
    brandId: string;
    itemId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: RetentionActionRouteProps
) {
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

  const draft = await createRetentionDraftAsync(brandId, itemId);
  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : draft?.href ?? `/brands/${brandId}/retention`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
