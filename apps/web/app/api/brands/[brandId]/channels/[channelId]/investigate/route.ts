import { NextRequest, NextResponse } from "next/server";
import { setChannelStateAsync } from "../../../../../../../lib/acquisition-data";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";

type ChannelActionRouteProps = {
  params: Promise<{
    brandId: string;
    channelId: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: ChannelActionRouteProps
) {
  const { brandId, channelId } = await params;
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

  await setChannelStateAsync(brandId, channelId, "investigating");

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath) ? nextPath : `/brands/${brandId}/channels`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
