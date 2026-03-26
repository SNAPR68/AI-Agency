import { createApiError, createApiResponse } from "../../../../../../lib/api";
import {
  getContentCalendarNarrative,
  listCalendarBacklogGroups,
  listCalendarDays
} from "../../../../../../lib/content-calendar-data";
import { getAuthorizedBrandState } from "../../../../../../lib/session";

type ContentCalendarRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: ContentCalendarRouteProps
) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return createApiError(403, "forbidden", "You do not have access to this brand.");
  }

  return createApiResponse({
    narrative: getContentCalendarNarrative(brandId),
    days: listCalendarDays(brandId),
    backlog: listCalendarBacklogGroups(brandId)
  });
}
