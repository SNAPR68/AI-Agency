import { NextRequest, NextResponse } from "next/server";
import { updateDraftContent } from "../../../../../../../../lib/growth-workflow-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../../lib/session";

type DraftActionRouteProps = {
  params: Promise<{
    brandId: string;
    draftId: string;
  }>;
};

const allowedDraftStatuses = new Set([
  "draft",
  "ready_for_approval",
  "changes_requested",
  "approved",
  "scheduled",
  "published",
  "rejected"
] as const);

function readFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readDraftStatus(formData: FormData) {
  const value = String(formData.get("currentStatus") ?? "").trim();

  return allowedDraftStatuses.has(value as never)
    ? (value as
        | "draft"
        | "ready_for_approval"
        | "changes_requested"
        | "approved"
        | "scheduled"
        | "published"
        | "rejected")
    : "draft";
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

  const draft = updateDraftContent(brandId, draftId, {
    title: readFormValue(formData, "title"),
    channel: readFormValue(formData, "channel"),
    angle: readFormValue(formData, "angle"),
    hook: readFormValue(formData, "hook"),
    caption: readFormValue(formData, "caption"),
    script: readFormValue(formData, "script"),
    status: readDraftStatus(formData)
  });

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : draft?.href ?? `/brands/${brandId}/content`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
