import { createApiError, createApiResponse } from "../../../../../lib/api";
import { listWorkspaceAlertsAsync } from "../../../../../lib/operating-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type AlertsRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: AlertsRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  const alerts = await listWorkspaceAlertsAsync(brandId);

  return createApiResponse({
    brandId,
    items: alerts
  });
}
