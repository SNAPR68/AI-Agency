import { createApiError, createApiResponse } from "../../../../../lib/api";
import { getAuthorizedBrandState } from "../../../../../lib/session";
import { listPlatformCommerceStores } from "../../../../../lib/supabase-platform-data";

type StoresRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: StoresRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    items: await listPlatformCommerceStores(brandId)
  });
}
