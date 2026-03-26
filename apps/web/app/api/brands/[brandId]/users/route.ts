import { createApiError, createApiResponse } from "../../../../../lib/api";
import { getAuthorizedBrandState } from "../../../../../lib/session";
import { listPlatformTeamMembers } from "../../../../../lib/supabase-platform-data";

type UsersRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: UsersRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    items: await listPlatformTeamMembers(brandId)
  });
}
