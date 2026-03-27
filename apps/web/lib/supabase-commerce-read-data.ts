import "server-only";

import type {
  RepositoryCatalogProduct,
  RepositoryStoreMetric
} from "./app-repository";
import { createSupabaseAdminClient } from "./supabase-admin";
import { getSupabaseBrandRecord } from "./supabase-platform-data";
import { shouldEnforceSupabaseHostedAccess } from "./supabase-env";
import {
  listDerivedCatalogProducts,
  listDerivedStoreMetrics
} from "./shopify-ingestion";

type ProductRow = {
  external_product_id: string;
  title: string;
  product_type: string | null;
  metadata_json: Record<string, unknown> | null;
};

type StoreMetricRow = {
  metric_date: string;
  revenue: number;
  orders_count: number;
  aov: number;
  sessions: number;
  conversion_rate: number;
  repeat_purchase_rate: number;
  returning_customer_revenue: number;
};

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

function extractFirstNumber(value: string) {
  const match = value.match(/-?\d+(?:\.\d+)?/);

  return match ? Number(match[0]) : 0;
}

export async function listSupabaseDerivedCatalogProducts(
  brandId: string
): Promise<RepositoryCatalogProduct[]> {
  const fallbackItems = shouldEnforceSupabaseHostedAccess()
    ? []
    : listDerivedCatalogProducts(brandId);
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return fallbackItems;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("products")
      .select("external_product_id, title, product_type, metadata_json")
      .eq("brand_id", brand.id);

    if (error || !data || data.length === 0) {
      return fallbackItems;
    }

    return (data as ProductRow[])
      .map((row) => {
        const metadata = row.metadata_json ?? {};

        return {
          id: row.external_product_id,
          title: row.title,
          collection: readString(metadata.collection, row.product_type ?? "Uncategorized"),
          status: readString(metadata.workflowStatus, "stable") as RepositoryCatalogProduct["status"],
          revenueShare: readString(metadata.revenueShare, "0%"),
          revenueDelta: readString(metadata.revenueDelta, "0.0%"),
          conversionRate: readString(metadata.conversionRate, "0.0%"),
          conversionDelta: readString(metadata.conversionDelta, "0.0pp"),
          marginBand: readString(metadata.marginBand, "Pending margin data"),
          inventoryNote: readString(metadata.inventoryNote, "Waiting for sync"),
          summary: readString(metadata.summary),
          heroMessage: readString(metadata.heroMessage),
          watchout: readString(metadata.watchout),
          recommendedFormats: readStringArray(metadata.recommendedFormats)
        } satisfies RepositoryCatalogProduct;
      })
      .sort(
        (left, right) =>
          extractFirstNumber(right.revenueShare) - extractFirstNumber(left.revenueShare)
      );
  } catch {
    return fallbackItems;
  }
}

export async function listSupabaseDerivedStoreMetrics(
  brandId: string
): Promise<RepositoryStoreMetric[]> {
  const fallbackItems = shouldEnforceSupabaseHostedAccess()
    ? []
    : listDerivedStoreMetrics(brandId);
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return fallbackItems;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("daily_store_metrics")
      .select(
        "metric_date, revenue, orders_count, aov, sessions, conversion_rate, repeat_purchase_rate, returning_customer_revenue"
      )
      .eq("brand_id", brand.id)
      .order("metric_date", { ascending: false });

    if (error || !data || data.length === 0) {
      return fallbackItems;
    }

    return (data as StoreMetricRow[]).map((row) => ({
      metricDate: row.metric_date,
      revenue: Number(row.revenue ?? 0),
      ordersCount: Number(row.orders_count ?? 0),
      aov: Number(row.aov ?? 0),
      sessions: Number(row.sessions ?? 0),
      conversionRate: Number(row.conversion_rate ?? 0),
      repeatPurchaseRate: Number(row.repeat_purchase_rate ?? 0),
      returningCustomerRevenue: Number(row.returning_customer_revenue ?? 0)
    }));
  } catch {
    return fallbackItems;
  }
}
