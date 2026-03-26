import { createApiError, createApiResponse } from "../../../../../lib/api";
import {
  getAcquisitionNarrative,
  listChannelViews
} from "../../../../../lib/acquisition-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type ChannelsRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: ChannelsRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    narrative: getAcquisitionNarrative(brandId),
    items: listChannelViews(brandId)
  });
}
