import { NextRequest, NextResponse } from "next/server";
import { markDraftReadyForApproval, updateDraftContent } from "../../../../../../../../lib/growth-workflow-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath,
  redirectIfHostedWorkflowMutationUnavailable
} from "../../../../../../../../lib/session";

type DraftActionRouteProps = {
  params: Promise<{
    brandId: string;
    draftId: string;
  }>;
};

function readFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function POST(
  request: NextRequest,
  { params }: DraftActionRouteProps
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
    `/brands/${brandId}/content/drafts/${draftId}`
  );

  if (hostedMutationRedirect) {
    return hostedMutationRedirect;
  }

  updateDraftContent(brandId, draftId, {
    title: readFormValue(formData, "title"),
    channel: readFormValue(formData, "channel"),
    angle: readFormValue(formData, "angle"),
    hook: readFormValue(formData, "hook"),
    caption: readFormValue(formData, "caption"),
    script: readFormValue(formData, "script"),
    status: "draft"
  });

  const draft = markDraftReadyForApproval(brandId, draftId);
  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : draft?.href ?? `/brands/${brandId}/content`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
