import { createApiError, createApiResponse } from "../../../lib/api";
import { getAuthenticatedAppState } from "../../../lib/session";

export async function GET() {
  const auth = await getAuthenticatedAppState();

  if (!auth) {
    return createApiError(401, "unauthorized", "Sign in to access workspaces.");
  }

  return createApiResponse({
    items: auth.accessibleBrands
  });
}
