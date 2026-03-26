import { createApiError, createApiResponse } from "../../../../../lib/api";
import { getWorkspaceOverviewAsync } from "../../../../../lib/operating-data";
import { getAuthorizedBrandState } from "../../../../../lib/session";

type OverviewRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: OverviewRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  const overview = await getWorkspaceOverviewAsync(brandId);

  return createApiResponse({
    brand: {
      id: auth.workspace.id,
      name: auth.workspace.name
    },
    kpis: overview.kpis,
    topWins: overview.wins,
    topRisks: overview.risks,
    nextActions: overview.nextActions,
    pendingApprovals: overview.pendingApprovals,
    openAlerts: overview.openAlerts,
    publishFailures: overview.publishFailures,
    approvedToSchedule: overview.approvedToSchedule,
    syncHealth: overview.syncHealth,
    workflowPulse: overview.workflowPulse
  });
}
