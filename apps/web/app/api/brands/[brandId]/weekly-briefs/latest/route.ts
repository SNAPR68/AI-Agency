import { createApiError, createApiResponse } from "../../../../../../lib/api";
import { getLatestWorkspaceBriefAsync } from "../../../../../../lib/operating-data";
import { getAuthorizedBrandState } from "../../../../../../lib/session";

type LatestBriefRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: LatestBriefRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  const brief = await getLatestWorkspaceBriefAsync(brandId);

  if (!brief) {
    return createApiError(404, "not_found", "No weekly brief is available for this brand.");
  }

  return createApiResponse({
    brandId,
    brief
  });
}
