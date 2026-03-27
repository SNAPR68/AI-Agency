import {
  createApiError,
  createApiResponse
} from "../../../../../../../lib/api";
import { getBrandDraftAsync } from "../../../../../../../lib/growth-workflow-data";
import { getAuthorizedBrandState } from "../../../../../../../lib/session";

type DraftRouteProps = {
  params: Promise<{
    brandId: string;
    draftId: string;
  }>;
};

export async function GET(_request: Request, { params }: DraftRouteProps) {
  const { brandId, draftId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  const draft = await getBrandDraftAsync(brandId, draftId);

  if (!draft) {
    return createApiError(404, "not_found", "Draft not found.");
  }

  return createApiResponse({
    brandId,
    draft
  });
}
