import { createApiError, createApiResponse } from "../../../../../lib/api";
import { getAuthorizedBrandState } from "../../../../../lib/session";
import { listPlatformProviderSyncRuns } from "../../../../../lib/supabase-platform-data";

type SyncRunsRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(request: Request, { params }: SyncRunsRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") ?? "shopify";

  return createApiResponse({
    items: await listPlatformProviderSyncRuns(brandId, provider)
  });
}
