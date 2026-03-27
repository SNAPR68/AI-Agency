import { NextRequest, NextResponse } from "next/server";
import { setCxStateAsync } from "../../../../../../../lib/customer-ops-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";

type CxActionRouteProps = {
  params: Promise<{
    brandId: string;
    itemId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: CxActionRouteProps
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

  await setCxStateAsync(brandId, itemId, "assigned");

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath) ? nextPath : `/brands/${brandId}/cx`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
