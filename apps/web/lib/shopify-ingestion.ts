import "server-only";

import { randomUUID } from "node:crypto";
import {
  getAppRepository,
  type RepositoryCatalogProduct,
  type RepositoryShopifySnapshot,
  type RepositorySyncRunSeed,
  type RepositoryStoreMetric
} from "./app-repository";
import { fetchLiveShopifySnapshot } from "./shopify-admin-client";

function buildStoreMetrics(metrics: RepositoryStoreMetric[]) {
  return metrics.sort((left, right) => right.metricDate.localeCompare(left.metricDate));
}

const shopifySnapshotsByBrandId: Record<string, RepositoryShopifySnapshot> = {
  demo: {
    shopDomain: "lunaskin.myshopify.com",
    currency: "USD",
    products: [
      {
        id: "prod-reset-serum",
        title: "Overnight Reset Serum",
        collection: "Night Repair",
        status: "rising",
        revenueShare: "34%",
        revenueDelta: "+19.2%",
        conversionRate: "4.6%",
        conversionDelta: "+0.7pp",
        marginBand: "74% gross margin",
        inventoryNote: "24 days of cover",
        summary:
          "This is the hero SKU driving most of the current weekly lift across paid and owned channels.",
        heroMessage:
          "Recovery proof and overnight simplicity are the strongest hooks right now.",
        watchout:
          "Keep urgency high without sounding over-claimy or drifting into generic skincare language.",
        recommendedFormats: ["UGC testimonial", "Founder routine", "Three-beat Reel"],
        handle: "overnight-reset-serum",
        priceMin: 48,
        priceMax: 48,
        variants: [
          {
            externalVariantId: "var-reset-serum-1",
            title: "30ml",
            sku: "LS-RS-30",
            price: 48,
            inventoryQuantity: 312
          }
        ],
        metricDate: "2026-03-25",
        revenueValue: 24380,
        unitsSold: 508,
        sessionsValue: 11040,
        conversionRateValue: 0.046,
        addToCartRate: 0.111,
        returnRate: 0.021,
        grossMarginValue: 0.74
      },
      {
        id: "prod-barrier-cream",
        title: "Daily Barrier Cream",
        collection: "Barrier Support",
        status: "watch",
        revenueShare: "18%",
        revenueDelta: "+6.1%",
        conversionRate: "2.1%",
        conversionDelta: "-0.5pp",
        marginBand: "69% gross margin",
        inventoryNote: "31 days of cover",
        summary:
          "Traffic is healthy, but the PDP is not converting enough of the current acquisition momentum.",
        heroMessage:
          "Sensitive-skin trust and faster reassurance need to be clearer above the fold.",
        watchout:
          "The product is attracting intent, so messaging friction matters more than traffic volume here.",
        recommendedFormats: [
          "Objection-handling carousel",
          "Comparison graphic",
          "PDP refresh brief"
        ],
        handle: "daily-barrier-cream",
        priceMin: 36,
        priceMax: 36,
        variants: [
          {
            externalVariantId: "var-barrier-cream-1",
            title: "50ml",
            sku: "LS-BC-50",
            price: 36,
            inventoryQuantity: 428
          }
        ],
        metricDate: "2026-03-25",
        revenueValue: 12940,
        unitsSold: 359,
        sessionsValue: 17100,
        conversionRateValue: 0.021,
        addToCartRate: 0.074,
        returnRate: 0.028,
        grossMarginValue: 0.69
      },
      {
        id: "prod-cleanse-oil",
        title: "Melt Cleanse Oil",
        collection: "Core Routine",
        status: "stable",
        revenueShare: "11%",
        revenueDelta: "+2.4%",
        conversionRate: "3.3%",
        conversionDelta: "+0.1pp",
        marginBand: "72% gross margin",
        inventoryNote: "18 days of cover",
        summary:
          "Steady performer that can support bundle storytelling but is not the main growth lever this week.",
        heroMessage:
          "Use it as the routine-opening step in bundles and regimen-based content.",
        watchout:
          "Avoid over-weighting content capacity here while the serum and barrier cream need more attention.",
        recommendedFormats: [
          "Routine stack graphic",
          "Bundle explainer",
          "Step-one hook"
        ],
        handle: "melt-cleanse-oil",
        priceMin: 28,
        priceMax: 28,
        variants: [
          {
            externalVariantId: "var-cleanse-oil-1",
            title: "100ml",
            sku: "LS-CO-100",
            price: 28,
            inventoryQuantity: 216
          }
        ],
        metricDate: "2026-03-25",
        revenueValue: 7880,
        unitsSold: 281,
        sessionsValue: 8510,
        conversionRateValue: 0.033,
        addToCartRate: 0.081,
        returnRate: 0.017,
        grossMarginValue: 0.72
      }
    ],
    orders: [
      {
        externalOrderId: "demo-order-1001",
        orderNumber: "#1001",
        orderDate: "2026-03-25T09:12:00Z",
        customerEmail: "riley@example.com",
        subtotalAmount: 84,
        discountAmount: 0,
        totalAmount: 84,
        financialStatus: "paid",
        fulfillmentStatus: "fulfilled"
      },
      {
        externalOrderId: "demo-order-1002",
        orderNumber: "#1002",
        orderDate: "2026-03-25T10:45:00Z",
        customerEmail: "morgan@example.com",
        subtotalAmount: 48,
        discountAmount: 0,
        totalAmount: 48,
        financialStatus: "paid",
        fulfillmentStatus: "fulfilled"
      },
      {
        externalOrderId: "demo-order-1003",
        orderNumber: "#1003",
        orderDate: "2026-03-25T12:18:00Z",
        customerEmail: "taylor@example.com",
        subtotalAmount: 112,
        discountAmount: 12,
        totalAmount: 100,
        financialStatus: "paid",
        fulfillmentStatus: "fulfilled"
      }
    ],
    dailyStoreMetrics: buildStoreMetrics([
      {
        metricDate: "2026-03-25",
        revenue: 71640,
        ordersCount: 862,
        aov: 83.1,
        sessions: 42240,
        conversionRate: 0.031,
        repeatPurchaseRate: 0.274,
        returningCustomerRevenue: 19560
      },
      {
        metricDate: "2026-03-24",
        revenue: 63720,
        ordersCount: 804,
        aov: 79.3,
        sessions: 41780,
        conversionRate: 0.028,
        repeatPurchaseRate: 0.261,
        returningCustomerRevenue: 17680
      }
    ])
  },
  solstice: {
    shopDomain: "solsticewell.myshopify.com",
    currency: "USD",
    products: [
      {
        id: "prod-sleep-stack",
        title: "Sleep Stack Bundle",
        collection: "Bundles",
        status: "rising",
        revenueShare: "29%",
        revenueDelta: "+14.8%",
        conversionRate: "3.9%",
        conversionDelta: "+0.4pp",
        marginBand: "77% gross margin",
        inventoryNote: "22 days of cover",
        summary:
          "The subscription-friendly sleep bundle is carrying both AOV and repeat purchase momentum.",
        heroMessage:
          "Frame it as the easiest nightly stack for consistency, not just a discount bundle.",
        watchout:
          "Creative fatigue is the bigger risk than product-market fit right now.",
        recommendedFormats: ["Routine UGC", "Benefits stack carousel", "Creator brief"],
        handle: "sleep-stack-bundle",
        priceMin: 64,
        priceMax: 64,
        variants: [
          {
            externalVariantId: "var-sleep-stack-1",
            title: "Bundle",
            sku: "SW-SS-BND",
            price: 64,
            inventoryQuantity: 284
          }
        ],
        metricDate: "2026-03-25",
        revenueValue: 26890,
        unitsSold: 420,
        sessionsValue: 10720,
        conversionRateValue: 0.039,
        addToCartRate: 0.102,
        returnRate: 0.019,
        grossMarginValue: 0.77
      },
      {
        id: "prod-magnesium-gummies",
        title: "Magnesium Gummies",
        collection: "Core Supplements",
        status: "watch",
        revenueShare: "17%",
        revenueDelta: "+4.2%",
        conversionRate: "2.6%",
        conversionDelta: "-0.2pp",
        marginBand: "71% gross margin",
        inventoryNote: "28 days of cover",
        summary:
          "Healthy attach behavior, but the paid story feels less differentiated than the sleep stack right now.",
        heroMessage:
          "Ease, taste, and consistency are the positioning pillars to sharpen.",
        watchout:
          "Avoid generic wellness language that could blur with competitor claims.",
        recommendedFormats: [
          "Objection FAQ",
          "Taste-first creative",
          "Routine combo post"
        ],
        handle: "magnesium-gummies",
        priceMin: 32,
        priceMax: 32,
        variants: [
          {
            externalVariantId: "var-magnesium-gummies-1",
            title: "60 gummies",
            sku: "SW-MG-60",
            price: 32,
            inventoryQuantity: 365
          }
        ],
        metricDate: "2026-03-25",
        revenueValue: 15740,
        unitsSold: 492,
        sessionsValue: 18920,
        conversionRateValue: 0.026,
        addToCartRate: 0.069,
        returnRate: 0.023,
        grossMarginValue: 0.71
      },
      {
        id: "prod-focus-drops",
        title: "Focus Drops",
        collection: "Daytime Support",
        status: "stable",
        revenueShare: "9%",
        revenueDelta: "+1.7%",
        conversionRate: "2.9%",
        conversionDelta: "+0.1pp",
        marginBand: "73% gross margin",
        inventoryNote: "35 days of cover",
        summary:
          "Stable enough to stay in rotation, but not the top growth conversation this week.",
        heroMessage:
          "Use it to round out routines rather than lead the weekly plan.",
        watchout:
          "Protect attention for higher-leverage bundle and retention work first.",
        recommendedFormats: [
          "Morning routine clip",
          "Pairing post",
          "Routine add-on copy"
        ],
        handle: "focus-drops",
        priceMin: 26,
        priceMax: 26,
        variants: [
          {
            externalVariantId: "var-focus-drops-1",
            title: "30ml",
            sku: "SW-FD-30",
            price: 26,
            inventoryQuantity: 412
          }
        ],
        metricDate: "2026-03-25",
        revenueValue: 8360,
        unitsSold: 321,
        sessionsValue: 11060,
        conversionRateValue: 0.029,
        addToCartRate: 0.071,
        returnRate: 0.018,
        grossMarginValue: 0.73
      }
    ],
    orders: [
      {
        externalOrderId: "solstice-order-2001",
        orderNumber: "#2001",
        orderDate: "2026-03-25T08:20:00Z",
        customerEmail: "asha@example.com",
        subtotalAmount: 64,
        discountAmount: 0,
        totalAmount: 64,
        financialStatus: "paid",
        fulfillmentStatus: "fulfilled"
      },
      {
        externalOrderId: "solstice-order-2002",
        orderNumber: "#2002",
        orderDate: "2026-03-25T11:32:00Z",
        customerEmail: "noah@example.com",
        subtotalAmount: 96,
        discountAmount: 10,
        totalAmount: 86,
        financialStatus: "paid",
        fulfillmentStatus: "fulfilled"
      },
      {
        externalOrderId: "solstice-order-2003",
        orderNumber: "#2003",
        orderDate: "2026-03-25T15:44:00Z",
        customerEmail: "zoe@example.com",
        subtotalAmount: 32,
        discountAmount: 0,
        totalAmount: 32,
        financialStatus: "paid",
        fulfillmentStatus: "fulfilled"
      }
    ],
    dailyStoreMetrics: buildStoreMetrics([
      {
        metricDate: "2026-03-25",
        revenue: 81220,
        ordersCount: 958,
        aov: 84.8,
        sessions: 46580,
        conversionRate: 0.034,
        repeatPurchaseRate: 0.291,
        returningCustomerRevenue: 23840
      },
      {
        metricDate: "2026-03-24",
        revenue: 75240,
        ordersCount: 917,
        aov: 82.1,
        sessions: 45920,
        conversionRate: 0.032,
        repeatPurchaseRate: 0.278,
        returningCustomerRevenue: 21910
      }
    ])
  }
};

export function buildFallbackShopifySnapshot(
  brandId: string,
  overrides?: {
    shopDomain?: string;
    currency?: string;
  }
): RepositoryShopifySnapshot {
  return {
    shopDomain: overrides?.shopDomain ?? `${brandId}.myshopify.com`,
    currency: overrides?.currency ?? "USD",
    products: [],
    orders: [],
    dailyStoreMetrics: []
  };
}

export function getSeededShopifySnapshot(
  brandId: string,
  overrides?: {
    shopDomain?: string;
    currency?: string;
  }
): RepositoryShopifySnapshot {
  return shopifySnapshotsByBrandId[brandId] ?? buildFallbackShopifySnapshot(brandId, overrides);
}

export function listDerivedCatalogProducts(brandId: string): RepositoryCatalogProduct[] {
  return getAppRepository().listCatalogProducts(brandId);
}

export function listDerivedStoreMetrics(brandId: string): RepositoryStoreMetric[] {
  return getAppRepository().listStoreMetrics(brandId);
}

function runShopifySnapshotIngestion(
  brandId: string,
  snapshot: RepositoryShopifySnapshot,
  runConfig: {
    triggerLabel: string;
    source: RepositorySyncRunSeed["source"];
    fallbackReason?: RepositorySyncRunSeed["fallbackReason"];
  }
) {
  const result = getAppRepository().ingestShopifySnapshot(brandId, snapshot);
  const now = new Date().toISOString();
  const syncRun: RepositorySyncRunSeed = {
    id: randomUUID(),
    provider: "shopify",
    status: "success",
    startedAt: now,
    finishedAt: now,
    recordsProcessed: result.recordsProcessed,
    triggerLabel: runConfig.triggerLabel,
    source: runConfig.source,
    fallbackReason: runConfig.fallbackReason,
    updatedAt: now
  };

  getAppRepository().appendSyncRun(brandId, syncRun);
  getAppRepository().upsertIntegration(brandId, {
    provider: "shopify",
    status: "connected",
    lastSyncedAt: now
  });

  return {
    ...result,
    snapshot,
    syncRun
  };
}

export function runSeededShopifyIngestion(
  brandId: string,
  overrides?: {
    shopDomain?: string;
    currency?: string;
    triggerLabel?: string;
    fallbackReason?: RepositorySyncRunSeed["fallbackReason"];
  }
) {
  const snapshot = getSeededShopifySnapshot(brandId, overrides);

  return runShopifySnapshotIngestion(
    brandId,
    snapshot,
    {
      triggerLabel: overrides?.triggerLabel ?? "Manual sync from integrations",
      source: "seeded",
      fallbackReason: overrides?.fallbackReason
    }
  );
}

export async function runConfiguredShopifyIngestion(
  brandId: string,
  store: {
    shopDomain: string;
    currency: string;
  }
) {
  const liveResult = await fetchLiveShopifySnapshot(brandId, store);

  if (liveResult.ok) {
    const result = runShopifySnapshotIngestion(
      brandId,
      liveResult.snapshot,
      {
        triggerLabel: "Live Shopify Admin sync",
        source: "live"
      }
    );

    return {
      ...result,
      source: "live" as const,
      fallbackReason: null,
      errorMessage: null
    };
  }

  const fallbackResult = runSeededShopifyIngestion(brandId, {
    shopDomain: store.shopDomain,
    currency: store.currency,
    triggerLabel:
      liveResult.reason === "missing_config"
        ? "Seeded Shopify snapshot fallback"
        : "Fallback Shopify snapshot after live sync failure",
    fallbackReason: liveResult.reason
  });

  return {
    ...fallbackResult,
    source: "seeded" as const,
    fallbackReason: liveResult.reason,
    errorMessage: liveResult.errorMessage ?? null
  };
}
