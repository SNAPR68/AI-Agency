import { NextRequest, NextResponse } from "next/server";
import { setCompetitorStateAsync } from "../../../../../../../lib/market-intelligence-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";

type CompetitorActionRouteProps = {
  params: Promise<{
    brandId: string;
    competitorId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: CompetitorActionRouteProps
) {
  const { brandId, competitorId } = await params;
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

  await setCompetitorStateAsync(brandId, competitorId, "acted");

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/competitors`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
