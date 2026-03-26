import { createApiError, createApiResponse } from "../../../../../lib/api";
import {
  getAcquisitionNarrative,
  listCampaignViews
} from "../../../../../lib/acquisition-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type CampaignsRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: CampaignsRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    narrative: getAcquisitionNarrative(brandId),
    items: listCampaignViews(brandId)
  });
}
