import { NextResponse } from "next/server";
import { buildFounderReportMarkdownAsync } from "../../../../../../../lib/reports-data";
import { getAuthorizedBrandState } from "../../../../../../../lib/session";

type FounderExportRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export async function GET(_request: Request, { params }: FounderExportRouteProps) {
  const { brandId } = await params;
  const auth = await getAuthorizedBrandState(brandId);

  if (!auth) {
    return NextResponse.json(
      {
        data: null,
        errors: [
          {
            code: "forbidden",
            message: "You do not have access to this brand."
          }
        ]
      },
      { status: 403 }
    );
  }

  return new NextResponse(await buildFounderReportMarkdownAsync(brandId), {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${brandId}-founder-report.md"`
    }
  });
}
