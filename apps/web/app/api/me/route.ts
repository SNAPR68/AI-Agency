import { createApiError, createApiResponse } from "../../../lib/api";
import { getAuthenticatedAppState } from "../../../lib/session";

export async function GET() {
  const auth = await getAuthenticatedAppState();

  if (!auth) {
    return createApiError(401, "unauthorized", "Sign in to access workspace data.");
  }

  return createApiResponse({
    user: auth.user,
    defaultBrandId: auth.session.brandId,
    accessibleBrands: auth.accessibleBrands
  });
}
