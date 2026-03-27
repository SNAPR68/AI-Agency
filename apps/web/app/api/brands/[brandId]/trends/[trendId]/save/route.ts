import { NextRequest, NextResponse } from "next/server";
import { setTrendStateAsync } from "../../../../../../../lib/market-intelligence-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";

type TrendActionRouteProps = {
  params: Promise<{
    brandId: string;
    trendId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: TrendActionRouteProps
) {
  const { brandId, trendId } = await params;
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

  await setTrendStateAsync(brandId, trendId, "saved");

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath) ? nextPath : `/brands/${brandId}/trends`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
