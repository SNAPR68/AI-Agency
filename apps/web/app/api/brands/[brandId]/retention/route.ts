import {
  createApiError,
  createApiResponse
} from "../../../../../lib/api";
import {
  getCustomerOpsNarrative,
  listRetentionSignals
} from "../../../../../lib/customer-ops-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type RetentionRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: RetentionRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    brandId,
    narrative: getCustomerOpsNarrative(brandId),
    retention: listRetentionSignals(brandId)
  });
}
