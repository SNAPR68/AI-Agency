import { NextRequest, NextResponse } from "next/server";
import { ingestSupabaseShopifySnapshot } from "../../../../../../../lib/supabase-commerce-data";
import {
  getPlatformPrimaryShopifyStore,
  recordPlatformSyncRun,
  savePlatformIntegrationConnection,
  savePlatformShopifyStoreConnection,
  triggerPlatformProviderSync
} from "../../../../../../../lib/supabase-platform-data";
import { runConfiguredShopifyIngestion } from "../../../../../../../lib/shopify-ingestion";
import {
  authHasBrandAccess,
  buildLoginPath,
  getAuthenticatedAppState,
  isSafeRedirectPath
} from "../../../../../../../lib/session";

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

  const redirectPath =
    nextPath && isSafeRedirectPath(nextPath)
      ? nextPath
      : `/brands/${brandId}/settings/integrations`;

  let shopifyStore =
    provider === "shopify" ? await getPlatformPrimaryShopifyStore(brandId) : null;

  if (provider === "shopify" && !shopifyStore && shopDomain.trim()) {
    shopifyStore = await savePlatformShopifyStoreConnection(brandId, {
      shopDomain,
      currency
    });
  }

  if (provider === "shopify" && !shopifyStore) {
    return NextResponse.redirect(
      new URL(`${redirectPath}${redirectPath.includes("?") ? "&" : "?"}error=missing-shopify-store`, request.url),
      303
    );
  }

  if (provider === "shopify") {
    const resolvedShopifyStore = shopifyStore;

    if (!resolvedShopifyStore) {
      return NextResponse.redirect(
        new URL(`${redirectPath}${redirectPath.includes("?") ? "&" : "?"}error=missing-shopify-store`, request.url),
        303
      );
    }

    const result = await runConfiguredShopifyIngestion(brandId, {
      shopDomain: resolvedShopifyStore.shopDomain,
      currency: resolvedShopifyStore.currency
    });

    await ingestSupabaseShopifySnapshot(brandId, result.snapshot);
    await recordPlatformSyncRun(brandId, result.syncRun);

    if (result.fallbackReason === "request_failed") {
      await savePlatformIntegrationConnection(brandId, {
        provider: "shopify",
        status: "degraded",
        lastSyncedAt: result.syncRun.finishedAt ?? result.syncRun.updatedAt
      });
    }

    const redirectUrl = new URL(redirectPath, request.url);

    redirectUrl.searchParams.set("synced", provider);
    redirectUrl.searchParams.set("syncSource", result.source);

    if (result.fallbackReason) {
      redirectUrl.searchParams.set("syncFallback", result.fallbackReason);
    }

    return NextResponse.redirect(redirectUrl, 303);
  } else {
    await triggerPlatformProviderSync(brandId, provider, "Manual sync from integrations");
  }

  return NextResponse.redirect(
    new URL(`${redirectPath}${redirectPath.includes("?") ? "&" : "?"}synced=${provider}`, request.url),
    303
  );
}
