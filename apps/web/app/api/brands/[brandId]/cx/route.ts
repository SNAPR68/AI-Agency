import {
  createApiError,
  createApiResponse
} from "../../../../../lib/api";
import {
  getCustomerOpsNarrative,
  listCxIssues
} from "../../../../../lib/customer-ops-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type CxRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: CxRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    brandId,
    narrative: getCustomerOpsNarrative(brandId),
    issues: listCxIssues(brandId)
  });
}
