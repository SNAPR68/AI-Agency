import { createApiError, createApiResponse } from "../../../../lib/api";
import { getAuthorizedBrandState } from "../../../../lib/session";

type BrandRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: BrandRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    brand: {
      id: auth.workspace.id,
      name: auth.workspace.name,
      vertical: auth.workspace.vertical,
      timezone: auth.workspace.timezone,
      gmvBand: auth.workspace.gmvBand,
      activeRole: auth.workspace.activeUser.role
    }
  });
}
