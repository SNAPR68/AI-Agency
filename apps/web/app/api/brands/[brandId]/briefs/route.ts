import { createApiError, createApiResponse } from "../../../../../lib/api";
import { listWorkspaceBriefsAsync } from "../../../../../lib/operating-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type BriefsRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: BriefsRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    items: await listWorkspaceBriefsAsync(brandId)
  });
}
