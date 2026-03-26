import {
  createApiError,
  createApiResponse
} from "../../../../../lib/api";
import {
  getCustomerOpsNarrative,
  listSupportClusters
} from "../../../../../lib/customer-ops-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type SupportOpsRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: SupportOpsRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    brandId,
    narrative: getCustomerOpsNarrative(brandId),
    clusters: listSupportClusters(brandId)
  });
}
