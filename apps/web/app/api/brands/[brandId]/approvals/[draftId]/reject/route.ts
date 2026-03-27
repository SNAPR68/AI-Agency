import { NextRequest, NextResponse } from "next/server";
import { rejectDraftAsync } from "../../../../../../../lib/workflow-execution-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";

type ApprovalActionRouteProps = {
  params: Promise<{
    brandId: string;
    draftId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: ApprovalActionRouteProps
) {
  const { brandId, draftId } = await params;
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

  await rejectDraftAsync(brandId, draftId);

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/approvals`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
