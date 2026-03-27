import {
  createApiError,
  createApiResponse
} from "../../../../../../lib/api";
import { listBrandDraftsAsync } from "../../../../../../lib/growth-workflow-data";
import { getAuthorizedBrandState } from "../../../../../../lib/session";

type DraftsRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: DraftsRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    brandId,
    drafts: await listBrandDraftsAsync(brandId)
  });
}
