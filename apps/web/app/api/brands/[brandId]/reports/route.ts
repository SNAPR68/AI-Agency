import { createApiError, createApiResponse } from "../../../../../lib/api";
import { getReportsDashboardDataAsync } from "../../../../../lib/reports-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type ReportsRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: ReportsRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    brandId,
    reports: await getReportsDashboardDataAsync(brandId)
  });
}
