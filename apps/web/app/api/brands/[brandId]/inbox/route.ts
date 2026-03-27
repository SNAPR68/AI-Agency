import { createApiError, createApiResponse } from "../../../../../lib/api";
import { listWorkspaceInboxItemsAsync } from "../../../../../lib/operating-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type InboxRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: InboxRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    items: await listWorkspaceInboxItemsAsync(brandId)
  });
}
