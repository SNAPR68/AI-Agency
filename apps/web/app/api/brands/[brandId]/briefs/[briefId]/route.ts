import { createApiError, createApiResponse } from "../../../../../../lib/api";
import { getWorkspaceBriefAsync } from "../../../../../../lib/operating-data";
import { getAuthorizedBrandState } from "../../../../../../lib/session";

type BriefRouteProps = {
  params: Promise<{
    brandId: string;
    briefId: string;
  }>;
};

export async function GET(_request: Request, { params }: BriefRouteProps) {
  const { brandId, briefId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  const brief = await getWorkspaceBriefAsync(brandId, briefId);

  if (!brief) {
    return createApiError(404, "not_found", "The requested brief was not found.");
  }

  return createApiResponse({
    brief
  });
}
