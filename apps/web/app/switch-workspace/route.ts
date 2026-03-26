import { NextRequest, NextResponse } from "next/server";
import { getDefaultBrandPath } from "../../lib/navigation";
import {
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath,
  setAppSessionCookie
} from "../../lib/session";

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedAppState();
  const url = new URL(request.url);
  const requestedBrandId = url.searchParams.get("brandId");
  const nextPath = url.searchParams.get("next");

  if (!auth) {
    return NextResponse.redirect(
      new URL(buildLoginPath(nextPath ?? undefined), request.url),
      303
    );
  }

  if (
    !requestedBrandId ||
    !auth.accessibleBrands.some((workspace) => workspace.id === requestedBrandId)
  ) {
    return NextResponse.redirect(
      new URL(getDefaultBrandPath(auth.defaultBrandId), request.url),
      303
    );
  }

  const targetPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : getDefaultBrandPath(requestedBrandId);
  const response = NextResponse.redirect(new URL(targetPath, request.url), 303);

  setAppSessionCookie(response, {
    userId: auth.user.id,
    brandId: requestedBrandId,
    userEmail: auth.user.email
  });

  return response;
}
