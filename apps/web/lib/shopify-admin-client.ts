import "server-only";

import type {
  RepositoryCatalogProduct,
  RepositoryShopifyOrderSnapshot,
  RepositoryShopifyProductSnapshot,
  RepositoryShopifySnapshot,
  RepositoryStoreMetric,
  RepositoryStoreSeed
} from "./app-repository";

type ShopifyAdminConfigSource = "shop" | "brand" | "global";

type ShopifyAdminConfigStatus = {
  apiVersion: string;
  liveSyncReady: boolean;
  lookupOrder: string[];
  shopDomain: string | null;
  tokenSource: ShopifyAdminConfigSource | null;
};

export type ShopifyAdminRuntimeStatus = {
  apiVersion: string;
  globalTokenConfigured: boolean;
  ordersLimit: number;
  productsLimit: number;
  lookbackDays: number;
  modeLabel: string;
  detail: string;
};

type ShopifyLiveSnapshotResult =
  | {
      ok: true;
      snapshot: RepositoryShopifySnapshot;
      status: ShopifyAdminConfigStatus;
    }
  | {
      ok: false;
      reason: "missing_config" | "request_failed";
      errorMessage?: string;
      status: ShopifyAdminConfigStatus;
    };

type ShopifyRestShopResponse = {
  shop?: {
    currency?: string;
  };
};

type ShopifyRestVariant = {
  id?: number | string;
  title?: string;
  sku?: string;
  price?: string | number | null;
  inventory_quantity?: number | null;
};

type ShopifyRestProduct = {
  id?: number | string;
  title?: string;
  handle?: string;
  product_type?: string;
  status?: string;
  variants?: ShopifyRestVariant[];
};

type ShopifyRestProductResponse = {
  products?: ShopifyRestProduct[];
};

type ShopifyRestCustomer = {
  id?: number | string;
  email?: string | null;
};

type ShopifyRestLineItem = {
  product_id?: number | string | null;
  variant_id?: number | string | null;
  title?: string;
  variant_title?: string | null;
  sku?: string | null;
  quantity?: number | null;
  price?: string | number | null;
  total_discount?: string | number | null;
};

type ShopifyRestOrder = {
  id?: number | string;
  name?: string;
  processed_at?: string | null;
  created_at?: string | null;
  current_subtotal_price?: string | number | null;
  current_total_discounts?: string | number | null;
  current_total_price?: string | number | null;
  subtotal_price?: string | number | null;
  total_discounts?: string | number | null;
  total_price?: string | number | null;
  financial_status?: string | null;
  fulfillment_status?: string | null;
  email?: string | null;
  customer?: ShopifyRestCustomer | null;
  line_items?: ShopifyRestLineItem[];
};

type ShopifyRestOrderResponse = {
  orders?: ShopifyRestOrder[];
};

type ProductAggregate = {
  productId: string;
  title: string;
  handle: string;
  collection: string;
  variants: RepositoryShopifyProductSnapshot["variants"];
  priceMin: number;
  priceMax: number;
  inventoryQuantity: number;
  dailyRevenue: Map<string, number>;
  dailyUnits: Map<string, number>;
};

const DEFAULT_API_VERSION = "2026-01";
const DEFAULT_ORDERS_LIMIT = 120;
const DEFAULT_PRODUCTS_LIMIT = 24;
const DEFAULT_LOOKBACK_DAYS = 30;

function normalizeShopDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function sanitizeEnvSegment(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function readPositiveIntegerEnv(name: string, fallback: number) {
  const raw = process.env[name]?.trim();

  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readConfiguredToken(brandId: string, shopDomain: string) {
  const normalizedDomain = normalizeShopDomain(shopDomain);
  const domainSegment = sanitizeEnvSegment(normalizedDomain);
  const brandSegment = sanitizeEnvSegment(brandId);
  const candidates: Array<{
    name: string;
    source: ShopifyAdminConfigSource;
  }> = [];

  if (domainSegment) {
    candidates.push({
      name: `SHOPIFY_ADMIN_API_ACCESS_TOKEN_${domainSegment}`,
      source: "shop"
    });
  }

  if (brandSegment) {
    candidates.push({
      name: `SHOPIFY_ADMIN_API_ACCESS_TOKEN_${brandSegment}`,
      source: "brand"
    });
  }

  candidates.push({
    name: "SHOPIFY_ADMIN_API_ACCESS_TOKEN",
    source: "global"
  });

  for (const candidate of candidates) {
    const value = process.env[candidate.name]?.trim();

    if (value) {
      return {
        token: value,
        source: candidate.source,
        lookupOrder: candidates.map((item) => item.name)
      };
    }
  }

  return {
    token: "",
    source: null,
    lookupOrder: candidates.map((item) => item.name)
  };
}

function getConfigStatus(brandId: string, shopDomain?: string | null): ShopifyAdminConfigStatus {
  const normalizedDomain = shopDomain ? normalizeShopDomain(shopDomain) : "";
  const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION?.trim() || DEFAULT_API_VERSION;
  const { token, source, lookupOrder } = normalizedDomain
    ? readConfiguredToken(brandId, normalizedDomain)
    : {
        token: "",
        source: null,
        lookupOrder: ["SHOPIFY_ADMIN_API_ACCESS_TOKEN"]
      };

  return {
    apiVersion,
    liveSyncReady: Boolean(normalizedDomain && token),
    lookupOrder,
    shopDomain: normalizedDomain || null,
    tokenSource: source
  };
}

export function getShopifyAdminSyncStatus(
  brandId: string,
  shopDomain?: string | null
) {
  const status = getConfigStatus(brandId, shopDomain);

  if (!status.shopDomain) {
    return {
      ...status,
      modeLabel: "Waiting on store connection",
      detail:
        "Add the Shopify shop domain first. Once a store is connected, the app can use a live Admin API sync."
    };
  }

  if (!status.liveSyncReady) {
    return {
      ...status,
      modeLabel: "Seeded fallback mode",
      detail:
        "Live Admin API sync is not configured yet, so Shopify syncs will fall back to the local seeded commerce snapshot."
    };
  }

  return {
    ...status,
    modeLabel: "Live Admin API mode",
    detail:
      status.tokenSource === "shop"
        ? "A shop-specific admin access token is configured for this store."
        : status.tokenSource === "brand"
          ? "A brand-specific admin access token is configured for this workspace."
          : "A global Shopify admin access token is configured for live syncs."
  };
}

export function getGlobalShopifyAdminRuntimeStatus(): ShopifyAdminRuntimeStatus {
  const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION?.trim() || DEFAULT_API_VERSION;
  const globalTokenConfigured = Boolean(process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN?.trim());
  const ordersLimit = readPositiveIntegerEnv("SHOPIFY_SYNC_ORDERS_LIMIT", DEFAULT_ORDERS_LIMIT);
  const productsLimit = readPositiveIntegerEnv(
    "SHOPIFY_SYNC_PRODUCTS_LIMIT",
    DEFAULT_PRODUCTS_LIMIT
  );
  const lookbackDays = readPositiveIntegerEnv(
    "SHOPIFY_SYNC_LOOKBACK_DAYS",
    DEFAULT_LOOKBACK_DAYS
  );

  return {
    apiVersion,
    globalTokenConfigured,
    ordersLimit,
    productsLimit,
    lookbackDays,
    modeLabel: globalTokenConfigured ? "Live token configured" : "Fallback-only mode",
    detail: globalTokenConfigured
      ? "A global Shopify Admin API token is configured, so connected stores can use the live sync path."
      : "No global Shopify Admin API token is configured yet. Live sync may still work if a store-specific or brand-specific token is provided, otherwise the app will fall back to the seeded snapshot."
  };
}

function parseNumber(value: unknown) {
  const parsed = Number.parseFloat(String(value ?? ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toDateKey(value: string) {
  return value.slice(0, 10);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatSignedPercentDelta(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? "+100.0%" : "0.0%";
  }

  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? "+" : "";

  return `${sign}${delta.toFixed(1)}%`;
}

function formatSignedPointDelta(current: number, previous: number) {
  const delta = (current - previous) * 100;
  const sign = delta >= 0 ? "+" : "";

  return `${sign}${delta.toFixed(1)}pp`;
}

function formatMarginBand(value: number) {
  return `${Math.round(value * 100)}% gross margin`;
}

function formatInventoryNote(inventoryQuantity: number, averageDailyUnits: number) {
  if (inventoryQuantity <= 0) {
    return "Out of stock";
  }

  if (averageDailyUnits <= 0) {
    return `${inventoryQuantity} units on hand`;
  }

  const days = Math.max(1, Math.round(inventoryQuantity / averageDailyUnits));

  return `${days} days of cover`;
}

function buildFallbackHandle(title: string, productId: string) {
  const normalizedTitle = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedTitle || `product-${productId}`;
}

function estimateStoreConversionRate(ordersCount: number) {
  return clamp(0.024 + Math.min(ordersCount / 2500, 0.012), 0.024, 0.04);
}

function estimateProductConversionRate(
  revenueShare: number,
  revenueDeltaRatio: number,
  unitsSold: number
) {
  return clamp(
    0.017 +
      revenueShare * 0.08 +
      clamp(revenueDeltaRatio, -0.25, 0.25) * 0.02 +
      Math.min(unitsSold / 800, 0.01),
    0.014,
    0.075
  );
}

function estimateGrossMargin(priceMidpoint: number) {
  return clamp(0.66 + Math.min(priceMidpoint / 200, 0.12), 0.66, 0.78);
}

function estimateReturnRate(priceMidpoint: number) {
  return clamp(0.015 + Math.min(priceMidpoint / 500, 0.02), 0.015, 0.04);
}

function pickStatus(revenueShare: number, revenueDeltaRatio: number, conversionRate: number) {
  if (revenueShare >= 0.22 || revenueDeltaRatio >= 0.12) {
    return "rising" as const;
  }

  if (revenueDeltaRatio <= -0.08 || conversionRate <= 0.022) {
    return "watch" as const;
  }

  return "stable" as const;
}

function buildSummary(title: string, status: RepositoryCatalogProduct["status"]) {
  if (status === "rising") {
    return `${title} is one of the strongest recent revenue drivers in the live Shopify order flow.`;
  }

  if (status === "watch") {
    return `${title} is active in the catalog, but current order momentum suggests the positioning needs help landing faster.`;
  }

  return `${title} is contributing steadily and is best used as a support product inside routines, bundles, or cross-sells.`;
}

function buildHeroMessage(title: string, status: RepositoryCatalogProduct["status"]) {
  if (status === "rising") {
    return `Lead with the clearest payoff for ${title} and vary proof sources to keep creative freshness high.`;
  }

  if (status === "watch") {
    return `Clarify why ${title} matters sooner and reduce hesitation before asking for the click.`;
  }

  return `Position ${title} as part of a broader routine so it lifts adjacent hero products instead of carrying the full message alone.`;
}

function buildWatchout(title: string, status: RepositoryCatalogProduct["status"]) {
  if (status === "rising") {
    return `Avoid burning out ${title} with repetitive creative angles when the product is already doing its job.`;
  }

  if (status === "watch") {
    return `Do not overweight ${title} in paid or organic plans until the value proposition converts more cleanly.`;
  }

  return `Keep ${title} in the weekly plan, but do not let it crowd out the brand's faster-moving hero products.`;
}

function buildRecommendedFormats(status: RepositoryCatalogProduct["status"]) {
  if (status === "rising") {
    return ["UGC testimonial", "Founder angle", "Fast conversion Reel"];
  }

  if (status === "watch") {
    return ["Objection carousel", "PDP refresh brief", "Problem-solution script"];
  }

  return ["Routine explainer", "Bundle support cut", "Cross-sell mention"];
}

async function fetchShopifyAdminJson<T>(
  brandId: string,
  shopDomain: string,
  path: string,
  searchParams?: Record<string, string>
): Promise<T> {
  const normalizedDomain = normalizeShopDomain(shopDomain);
  const { token } = readConfiguredToken(brandId, normalizedDomain);
  const apiVersion = process.env.SHOPIFY_ADMIN_API_VERSION?.trim() || DEFAULT_API_VERSION;

  if (!token) {
    throw new Error("Shopify Admin API access token is not configured.");
  }

  const url = new URL(`https://${normalizedDomain}/admin/api/${apiVersion}/${path}`);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Shopify Admin API request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

function buildProductAggregates(products: ShopifyRestProduct[]) {
  const aggregates = new Map<string, ProductAggregate>();

  for (const product of products) {
    const productId = String(product.id ?? "").trim();

    if (!productId) {
      continue;
    }

    const variants = (product.variants ?? []).map((variant) => ({
      externalVariantId: String(variant.id ?? `${productId}-variant`).trim(),
      title: String(variant.title ?? "Default Title").trim(),
      sku: String(variant.sku ?? "").trim(),
      price: parseNumber(variant.price),
      inventoryQuantity: Math.max(0, Number(variant.inventory_quantity ?? 0))
    }));

    const prices = variants.map((variant) => variant.price).filter((value) => value > 0);

    aggregates.set(productId, {
      productId,
      title: String(product.title ?? "Untitled product").trim(),
      handle: String(product.handle ?? "").trim() || buildFallbackHandle(String(product.title ?? ""), productId),
      collection: String(product.product_type ?? "").trim() || "Catalog",
      variants,
      priceMin: prices.length > 0 ? Math.min(...prices) : 0,
      priceMax: prices.length > 0 ? Math.max(...prices) : 0,
      inventoryQuantity: variants.reduce(
        (total, variant) => total + Math.max(0, variant.inventoryQuantity),
        0
      ),
      dailyRevenue: new Map<string, number>(),
      dailyUnits: new Map<string, number>()
    });
  }

  return aggregates;
}

function addAggregateValue(map: Map<string, number>, key: string, amount: number) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function buildOrderSnapshot(order: ShopifyRestOrder): RepositoryShopifyOrderSnapshot | null {
  const orderId = String(order.id ?? "").trim();

  if (!orderId) {
    return null;
  }

  const orderDate = String(order.processed_at ?? order.created_at ?? "").trim();

  if (!orderDate) {
    return null;
  }

  return {
    externalOrderId: orderId,
    orderNumber: String(order.name ?? `#${orderId}`).trim(),
    orderDate,
    customerEmail: String(order.email ?? order.customer?.email ?? "").trim().toLowerCase(),
    subtotalAmount: parseNumber(order.current_subtotal_price ?? order.subtotal_price),
    discountAmount: parseNumber(order.current_total_discounts ?? order.total_discounts),
    totalAmount: parseNumber(order.current_total_price ?? order.total_price),
    financialStatus: String(order.financial_status ?? "unknown").trim() || "unknown",
    fulfillmentStatus: String(order.fulfillment_status ?? "unfulfilled").trim() || "unfulfilled"
  };
}

function buildStoreMetricsFromOrders(orders: RepositoryShopifyOrderSnapshot[]) {
  const customerCountByKey = new Map<string, number>();

  for (const order of orders) {
    const customerKey = order.customerEmail || order.externalOrderId;
    customerCountByKey.set(customerKey, (customerCountByKey.get(customerKey) ?? 0) + 1);
  }

  const dailyState = new Map<
    string,
    {
      revenue: number;
      ordersCount: number;
      customerKeys: Set<string>;
      returningCustomerKeys: Set<string>;
      returningCustomerRevenue: number;
    }
  >();

  for (const order of orders) {
    const metricDate = toDateKey(order.orderDate);
    const customerKey = order.customerEmail || order.externalOrderId;
    const current =
      dailyState.get(metricDate) ??
      {
        revenue: 0,
        ordersCount: 0,
        customerKeys: new Set<string>(),
        returningCustomerKeys: new Set<string>(),
        returningCustomerRevenue: 0
      };

    current.revenue += order.totalAmount;
    current.ordersCount += 1;
    current.customerKeys.add(customerKey);

    if ((customerCountByKey.get(customerKey) ?? 0) > 1) {
      current.returningCustomerKeys.add(customerKey);
      current.returningCustomerRevenue += order.totalAmount;
    }

    dailyState.set(metricDate, current);
  }

  return Array.from(dailyState.entries())
    .map(([metricDate, value]) => {
      const conversionRate = estimateStoreConversionRate(value.ordersCount);
      const sessions = Math.max(value.ordersCount, Math.round(value.ordersCount / conversionRate));

      return {
        metricDate,
        revenue: Number(value.revenue.toFixed(2)),
        ordersCount: value.ordersCount,
        aov: value.ordersCount > 0 ? Number((value.revenue / value.ordersCount).toFixed(2)) : 0,
        sessions,
        conversionRate: Number((value.ordersCount / Math.max(sessions, 1)).toFixed(4)),
        repeatPurchaseRate:
          value.customerKeys.size > 0
            ? Number((value.returningCustomerKeys.size / value.customerKeys.size).toFixed(4))
            : 0,
        returningCustomerRevenue: Number(value.returningCustomerRevenue.toFixed(2))
      } satisfies RepositoryStoreMetric;
    })
    .sort((left, right) => right.metricDate.localeCompare(left.metricDate));
}

function buildProductSnapshots(
  aggregates: Map<string, ProductAggregate>,
  storeMetrics: RepositoryStoreMetric[]
): RepositoryShopifyProductSnapshot[] {
  const latestStoreMetric = storeMetrics[0];
  const latestStoreRevenue = latestStoreMetric?.revenue ?? 0;
  const latestMetricDate = latestStoreMetric?.metricDate ?? new Date().toISOString().slice(0, 10);
  const previousMetricDate = storeMetrics[1]?.metricDate ?? latestMetricDate;
  const sortedAggregates = Array.from(aggregates.values()).sort((left, right) => {
    const rightRevenue =
      right.dailyRevenue.get(latestMetricDate) ??
      Array.from(right.dailyRevenue.values()).reduce((total, value) => total + value, 0);
    const leftRevenue =
      left.dailyRevenue.get(latestMetricDate) ??
      Array.from(left.dailyRevenue.values()).reduce((total, value) => total + value, 0);

    return rightRevenue - leftRevenue;
  });

  return sortedAggregates.map((aggregate) => {
    const metricDate =
      Array.from(aggregate.dailyRevenue.keys()).sort((left, right) => right.localeCompare(left))[0] ??
      latestMetricDate;
    const revenueValue = Number((aggregate.dailyRevenue.get(metricDate) ?? 0).toFixed(2));
    const previousRevenueValue =
      aggregate.dailyRevenue.get(metricDate === latestMetricDate ? previousMetricDate : latestMetricDate) ?? 0;
    const unitsSold = Math.max(0, Math.round(aggregate.dailyUnits.get(metricDate) ?? 0));
    const previousUnitsSold = Math.max(
      0,
      Math.round(
        aggregate.dailyUnits.get(metricDate === latestMetricDate ? previousMetricDate : latestMetricDate) ??
          0
      )
    );
    const revenueShare =
      latestStoreRevenue > 0 ? clamp(revenueValue / latestStoreRevenue, 0, 1) : 0;
    const revenueDeltaRatio =
      previousRevenueValue > 0 ? (revenueValue - previousRevenueValue) / previousRevenueValue : revenueValue > 0 ? 1 : 0;
    const conversionRateValue = estimateProductConversionRate(
      revenueShare,
      revenueDeltaRatio,
      unitsSold
    );
    const previousConversionRateValue = estimateProductConversionRate(
      revenueShare,
      previousRevenueValue > 0
        ? (previousRevenueValue - revenueValue) / previousRevenueValue
        : 0,
      previousUnitsSold
    );
    // Shopify alone does not give session and add-to-cart data, so these remain
    // commerce-derived estimates until GA4/Meta are connected live.
    const sessionsValue = Math.max(unitsSold, Math.round(unitsSold / Math.max(conversionRateValue, 0.01)));
    const averagePrice =
      aggregate.priceMin > 0 && aggregate.priceMax > 0
        ? (aggregate.priceMin + aggregate.priceMax) / 2
        : aggregate.priceMax || aggregate.priceMin || 0;
    const grossMarginValue = Number(estimateGrossMargin(averagePrice).toFixed(4));
    const returnRate = Number(estimateReturnRate(averagePrice).toFixed(4));
    const addToCartRate = Number(clamp(conversionRateValue * 2.35, 0.05, 0.18).toFixed(4));
    const averageDailyUnits = Math.max(
      unitsSold,
      Number(
        (
          Array.from(aggregate.dailyUnits.values()).reduce((total, value) => total + value, 0) /
          Math.max(aggregate.dailyUnits.size, 1)
        ).toFixed(2)
      )
    );
    const status = pickStatus(revenueShare, revenueDeltaRatio, conversionRateValue);

    return {
      id: aggregate.productId,
      title: aggregate.title,
      collection: aggregate.collection,
      status,
      revenueShare: formatPercent(revenueShare),
      revenueDelta: formatSignedPercentDelta(revenueValue, previousRevenueValue),
      conversionRate: formatPercent(conversionRateValue),
      conversionDelta: formatSignedPointDelta(conversionRateValue, previousConversionRateValue),
      marginBand: formatMarginBand(grossMarginValue),
      inventoryNote: formatInventoryNote(aggregate.inventoryQuantity, averageDailyUnits),
      summary: buildSummary(aggregate.title, status),
      heroMessage: buildHeroMessage(aggregate.title, status),
      watchout: buildWatchout(aggregate.title, status),
      recommendedFormats: buildRecommendedFormats(status),
      handle: aggregate.handle,
      priceMin: Number(aggregate.priceMin.toFixed(2)),
      priceMax: Number(aggregate.priceMax.toFixed(2)),
      variants: aggregate.variants,
      metricDate,
      revenueValue,
      unitsSold,
      sessionsValue,
      conversionRateValue: Number(conversionRateValue.toFixed(4)),
      addToCartRate,
      returnRate,
      grossMarginValue
    } satisfies RepositoryShopifyProductSnapshot;
  });
}

export async function fetchLiveShopifySnapshot(
  brandId: string,
  store: Pick<RepositoryStoreSeed, "shopDomain" | "currency">
): Promise<ShopifyLiveSnapshotResult> {
  const status = getConfigStatus(brandId, store.shopDomain);

  if (!status.liveSyncReady || !status.shopDomain) {
    return {
      ok: false,
      reason: "missing_config",
      status
    };
  }

  const ordersLimit = readPositiveIntegerEnv("SHOPIFY_SYNC_ORDERS_LIMIT", DEFAULT_ORDERS_LIMIT);
  const productLimit = readPositiveIntegerEnv(
    "SHOPIFY_SYNC_PRODUCTS_LIMIT",
    DEFAULT_PRODUCTS_LIMIT
  );
  const lookbackDays = readPositiveIntegerEnv(
    "SHOPIFY_SYNC_LOOKBACK_DAYS",
    DEFAULT_LOOKBACK_DAYS
  );
  const processedAtMin = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [shopResponse, productsResponse, ordersResponse] = await Promise.all([
      fetchShopifyAdminJson<ShopifyRestShopResponse>(brandId, status.shopDomain, "shop.json"),
      fetchShopifyAdminJson<ShopifyRestProductResponse>(
        brandId,
        status.shopDomain,
        "products.json",
        {
          status: "active",
          limit: String(Math.max(productLimit * 3, productLimit))
        }
      ),
      fetchShopifyAdminJson<ShopifyRestOrderResponse>(
        brandId,
        status.shopDomain,
        "orders.json",
        {
          status: "any",
          limit: String(ordersLimit),
          processed_at_min: processedAtMin,
          order: "processed_at desc"
        }
      )
    ]);

    const products = productsResponse.products ?? [];
    const orderSnapshots = (ordersResponse.orders ?? [])
      .map(buildOrderSnapshot)
      .filter((order): order is RepositoryShopifyOrderSnapshot => Boolean(order));
    const productAggregates = buildProductAggregates(products);

    for (const order of ordersResponse.orders ?? []) {
      const orderDate = String(order.processed_at ?? order.created_at ?? "").trim();

      if (!orderDate) {
        continue;
      }

      const metricDate = toDateKey(orderDate);

      for (const lineItem of order.line_items ?? []) {
        const productId = String(lineItem.product_id ?? "").trim();

        if (!productId) {
          continue;
        }

        const aggregate = productAggregates.get(productId);

        if (!aggregate) {
          continue;
        }

        const quantity = Math.max(0, Number(lineItem.quantity ?? 0));
        const lineRevenue = Math.max(
          0,
          parseNumber(lineItem.price) * quantity - parseNumber(lineItem.total_discount)
        );

        addAggregateValue(aggregate.dailyRevenue, metricDate, lineRevenue);
        addAggregateValue(aggregate.dailyUnits, metricDate, quantity);
      }
    }

    const dailyStoreMetrics = buildStoreMetricsFromOrders(orderSnapshots);
    const productSnapshots = buildProductSnapshots(productAggregates, dailyStoreMetrics).slice(
      0,
      productLimit
    );
    const snapshot: RepositoryShopifySnapshot = {
      shopDomain: status.shopDomain,
      currency: String(shopResponse.shop?.currency ?? store.currency ?? "USD").trim() || "USD",
      products: productSnapshots,
      orders: orderSnapshots,
      dailyStoreMetrics
    };

    return {
      ok: true,
      snapshot,
      status
    };
  } catch (error) {
    return {
      ok: false,
      reason: "request_failed",
      errorMessage: error instanceof Error ? error.message : "Shopify Admin sync failed.",
      status
    };
  }
}
