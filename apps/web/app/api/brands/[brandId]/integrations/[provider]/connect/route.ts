import { NextRequest, NextResponse } from "next/server";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";
import {
  savePlatformIntegrationConnection,
  savePlatformShopifyStoreConnection
} from "../../../../../../../lib/supabase-platform-data";

type IntegrationActionRouteProps = {
  params: Promise<{
    brandId: string;
    provider: string;
  }>;
};

export async function POST(
  request: NextRequest,
  { params }: IntegrationActionRouteProps
) {
  const { brandId, provider } = await params;
  const auth = await getAuthenticatedAppState();
  const formData = await request.formData();
  const nextPath = String(formData.get("next") ?? "");
  const shopDomain = String(formData.get("shopDomain") ?? "");
  const currency = String(formData.get("currency") ?? "USD");

  if (!auth) {
    return NextResponse.redirect(new URL(buildLoginPath(nextPath), request.url), 303);
  }

  if (!authHasBrandAccess(auth, brandId)) {
    return NextResponse.redirect(
      new URL(`/brands/${auth.defaultBrandId}/overview`, request.url),
      303
    );
  }

  await savePlatformIntegrationConnection(brandId, {
    provider,
    status: "connected",
    lastSyncedAt: new Date().toISOString()
  });

  if (provider === "shopify" && shopDomain.trim()) {
    await savePlatformShopifyStoreConnection(brandId, {
      shopDomain,
      currency
    });
  }

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/settings/integrations`;

  return NextResponse.redirect(
    new URL(`${redirectPath}${redirectPath.includes("?") ? "&" : "?"}connected=${provider}`, request.url),
    303
  );
}
