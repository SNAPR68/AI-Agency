import { createApiError, createApiResponse } from "../../../../../lib/api";
import { getAuthorizedBrandState } from "../../../../../lib/session";
import { listPlatformIntegrationViews } from "../../../../../lib/supabase-platform-data";

type IntegrationsRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: IntegrationsRouteProps
) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    items: await listPlatformIntegrationViews(brandId)
  });
}
