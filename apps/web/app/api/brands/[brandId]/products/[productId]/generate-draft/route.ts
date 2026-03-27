import { NextRequest, NextResponse } from "next/server";
import { createDraftFromProductAsync } from "../../../../../../../lib/growth-workflow-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";

type ProductDraftRouteProps = {
  params: Promise<{
    brandId: string;
    productId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: ProductDraftRouteProps
) {
  const { brandId, productId } = await params;
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

  const draft = await createDraftFromProductAsync(brandId, productId);
  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : draft?.href ?? `/brands/${brandId}/products/${productId}`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
