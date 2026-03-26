import { NextRequest, NextResponse } from "next/server";
import { clearAppSessionCookies } from "../../lib/session";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/login?loggedOut=1", request.url),
    303
  );

  clearAppSessionCookies(response);

  return response;
}
