import { NextRequest, NextResponse } from "next/server";
import { setOpportunityStatusAsync } from "../../../../../../../lib/growth-workflow-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";

type OpportunityActionRouteProps = {
  params: Promise<{
    brandId: string;
    opportunityId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: OpportunityActionRouteProps
) {
  const { brandId, opportunityId } = await params;
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

  await setOpportunityStatusAsync(brandId, opportunityId, "dismissed");

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/opportunities`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
