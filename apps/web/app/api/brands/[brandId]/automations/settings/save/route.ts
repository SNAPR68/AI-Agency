import { NextRequest, NextResponse } from "next/server";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";
import { savePlatformAutomationSettings } from "../../../../../../../lib/supabase-platform-data";

type AutomationSettingsRouteProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function parseApprovalMode(value: string) {
  return value === "confidence_based" ? "confidence_based" : "always_review";
}

function parseAutoPublishMode(value: string) {
  return value === "approved_only" ? "approved_only" : "never";
}

function parseAlertSensitivity(value: string) {
  return value === "high" ? "high" : "normal";
}

function parseWeeklyBriefCadence(value: string) {
  return value === "friday_pm" ? "friday_pm" : "monday_am";
}

export async function POST(
  request: NextRequest,
  { params }: AutomationSettingsRouteProps
) {
  const { brandId } = await params;
  const auth = await getAuthenticatedAppState();
  const formData = await request.formData();
  const nextPath = String(formData.get("next") ?? "");

  if (!auth) {
    return NextResponse.redirect(new URL(buildLoginPath(nextPath), request.url), 303);
  }

  if (!authHasBrandAccess(auth, brandId)) {
    return NextResponse.redirect(
      new URL(`/brands/${auth.defaultBrandId}/overview`, request.url),
      303
    );
  }

  await savePlatformAutomationSettings(brandId, {
    approvalMode: parseApprovalMode(String(formData.get("approvalMode") ?? "")),
    autoPublishMode: parseAutoPublishMode(String(formData.get("autoPublishMode") ?? "")),
    alertSensitivity: parseAlertSensitivity(String(formData.get("alertSensitivity") ?? "")),
    weeklyBriefCadence: parseWeeklyBriefCadence(
      String(formData.get("weeklyBriefCadence") ?? "")
    )
  });

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/settings/automations`;

  return NextResponse.redirect(new URL(redirectPath, request.url), 303);
}
