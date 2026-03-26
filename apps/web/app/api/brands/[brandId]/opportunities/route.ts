import { createApiError, createApiResponse } from "../../../../../lib/api";
import { listBrandOpportunitiesAsync } from "../../../../../lib/growth-workflow-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type OpportunitiesRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: OpportunitiesRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    brandId,
    opportunities: await listBrandOpportunitiesAsync(brandId)
  });
}
