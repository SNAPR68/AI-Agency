import {
  createApiError,
  createApiResponse
} from "../../../../../lib/api";
import {
  getMarketNarrative,
  listTrendSignals
} from "../../../../../lib/market-intelligence-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type TrendsRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: TrendsRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    brandId,
    narrative: getMarketNarrative(brandId),
    trends: listTrendSignals(brandId)
  });
}
