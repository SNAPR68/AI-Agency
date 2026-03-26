import { NextRequest, NextResponse } from "next/server";
import { cancelPublishJob } from "../../../../../../../../lib/workflow-execution-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../../lib/session";

type PublishingJobRouteProps = {
  params: Promise<{
    brandId: string;
    jobId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: PublishingJobRouteProps
) {
  const { brandId, jobId } = await params;
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

  cancelPublishJob(brandId, jobId);

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/publishing`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
