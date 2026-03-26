import { createApiError, createApiResponse } from "../../../../../lib/api";
import {
  getPlatformAutomationSettings,
  listPlatformAutomationPolicies
} from "../../../../../lib/supabase-platform-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type AutomationsRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: AutomationsRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    items: await listPlatformAutomationPolicies(brandId),
    settings: await getPlatformAutomationSettings(brandId)
  });
}
