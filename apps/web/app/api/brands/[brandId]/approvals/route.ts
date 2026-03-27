import {
  createApiError,
  createApiResponse
} from "../../../../../lib/api";
import { listApprovalItemsAsync } from "../../../../../lib/workflow-execution-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type ApprovalsRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: ApprovalsRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    brandId,
    approvals: await listApprovalItemsAsync(brandId)
  });
}
