import { NextRequest, NextResponse } from "next/server";
import { setCampaignStateAsync } from "../../../../../../../lib/acquisition-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";

type CampaignActionRouteProps = {
  params: Promise<{
    brandId: string;
    campaignId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: CampaignActionRouteProps
) {
  const { brandId, campaignId } = await params;
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

  await setCampaignStateAsync(brandId, campaignId, "flagged");

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath) ? nextPath : `/brands/${brandId}/campaigns`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
