import { NextRequest, NextResponse } from "next/server";
import { publishDraftNow } from "../../../../../../../lib/workflow-execution-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath,
  redirectIfHostedWorkflowMutationUnavailable
} from "../../../../../../../lib/session";

type PublishingActionRouteProps = {
  params: Promise<{
    brandId: string;
    draftId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: PublishingActionRouteProps
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

  const hostedMutationRedirect = redirectIfHostedWorkflowMutationUnavailable(
    request,
    nextPath,
    `/brands/${brandId}/publishing`
  );

  if (hostedMutationRedirect) {
    return hostedMutationRedirect;
  }

  publishDraftNow(brandId, draftId);

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/publishing`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
