import { NextRequest, NextResponse } from "next/server";
import { getDefaultBrandPath } from "../../../../lib/navigation";
import { setAppSessionCookie } from "../../../../lib/session";
import { getLoginWorkspaceOptions } from "../../../../lib/workspace-data";

export async function GET(request: NextRequest) {
  const loginOptions = getLoginWorkspaceOptions();
  const previewOption =
    loginOptions.find(
      (option) => option.primaryRole === "founder" || option.primaryRole === "owner"
    ) ?? loginOptions[0];

  if (!previewOption) {
    return NextResponse.redirect(new URL("/login", request.url), 307);
  }

  const response = NextResponse.redirect(
    new URL(getDefaultBrandPath(previewOption.primaryBrandId), request.url),
    307
  );

  setAppSessionCookie(response, {
    userId: previewOption.userId,
    brandId: previewOption.primaryBrandId,
    userEmail: previewOption.email
  });

  return response;
}
