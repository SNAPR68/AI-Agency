import "server-only";

import type { RepositoryShopifySnapshot } from "./app-repository";
import { createSupabaseAdminClient } from "./supabase-admin";
import {
  getSupabaseBrandRecord,
  savePlatformShopifyStoreConnection
} from "./supabase-platform-data";

type SupabaseShopifyIngestResult = {
  productsImported: number;
  variantsImported: number;
  ordersImported: number;
  storeMetricsImported: number;
  productMetricsImported: number;
};

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function ingestSupabaseShopifySnapshot(
  brandId: string,
  snapshot: RepositoryShopifySnapshot
): Promise<SupabaseShopifyIngestResult | null> {
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return null;
  }

  const store = await savePlatformShopifyStoreConnection(brandId, {
    shopDomain: snapshot.shopDomain,
    currency: snapshot.currency
  });

  if (!store || !looksLikeUuid(store.id)) {
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const productPayload = snapshot.products.map((product) => ({
      brand_id: brand.id,
      external_product_id: product.id,
      title: product.title,
      handle: product.handle,
      product_type: product.collection,
      status: "active",
      price_min: product.priceMin,
      price_max: product.priceMax,
      metadata_json: {
        collection: product.collection,
        workflowStatus: product.status,
        revenueShare: product.revenueShare,
        revenueDelta: product.revenueDelta,
        conversionRate: product.conversionRate,
        conversionDelta: product.conversionDelta,
        marginBand: product.marginBand,
        inventoryNote: product.inventoryNote,
        summary: product.summary,
        heroMessage: product.heroMessage,
        watchout: product.watchout,
        recommendedFormats: product.recommendedFormats
      },
      updated_at: new Date().toISOString()
    }));

    const { data: products, error: productsError } = await supabase
      .from("products")
      .upsert(productPayload, {
        onConflict: "brand_id,external_product_id"
      })
      .select("id, external_product_id");

    if (productsError) {
      return null;
    }

    const productIdByExternalId = new Map(
      (products ?? []).map((row) => [String(row.external_product_id), String(row.id)] as const)
    );
    const variantPayload = snapshot.products.flatMap((product) => {
      const productId = productIdByExternalId.get(product.id);

      if (!productId) {
        return [];
      }

      return product.variants.map((variant) => ({
        brand_id: brand.id,
        product_id: productId,
        external_variant_id: variant.externalVariantId,
        title: variant.title,
        sku: variant.sku,
        price: variant.price,
        inventory_quantity: variant.inventoryQuantity,
        updated_at: new Date().toISOString()
      }));
    });

    if (variantPayload.length > 0) {
      const { error: variantsError } = await supabase.from("product_variants").upsert(
        variantPayload,
        {
          onConflict: "brand_id,external_variant_id"
        }
      );

      if (variantsError) {
        return null;
      }
    }

    if (snapshot.orders.length > 0) {
      const { error: ordersError } = await supabase.from("orders").upsert(
        snapshot.orders.map((order) => ({
          brand_id: brand.id,
          store_id: store.id,
          external_order_id: order.externalOrderId,
          order_number: order.orderNumber,
          order_date: order.orderDate,
          customer_email: order.customerEmail,
          subtotal_amount: order.subtotalAmount,
          discount_amount: order.discountAmount,
          total_amount: order.totalAmount,
          financial_status: order.financialStatus,
          fulfillment_status: order.fulfillmentStatus,
          updated_at: new Date().toISOString()
        })),
        {
          onConflict: "brand_id,external_order_id"
        }
      );

      if (ordersError) {
        return null;
      }
    }

    if (snapshot.dailyStoreMetrics.length > 0) {
      const { error: storeMetricsError } = await supabase.from("daily_store_metrics").upsert(
        snapshot.dailyStoreMetrics.map((metric) => ({
          brand_id: brand.id,
          metric_date: metric.metricDate,
          revenue: metric.revenue,
          orders_count: metric.ordersCount,
          aov: metric.aov,
          sessions: metric.sessions,
          conversion_rate: metric.conversionRate,
          repeat_purchase_rate: metric.repeatPurchaseRate,
          returning_customer_revenue: metric.returningCustomerRevenue
        })),
        {
          onConflict: "brand_id,metric_date"
        }
      );

      if (storeMetricsError) {
        return null;
      }
    }

    const productMetricPayload = snapshot.products.flatMap((product) => {
      const productId = productIdByExternalId.get(product.id);

      if (!productId) {
        return [];
      }

      return [
        {
          brand_id: brand.id,
          product_id: productId,
          metric_date: product.metricDate,
          revenue: product.revenueValue,
          units_sold: product.unitsSold,
          sessions: product.sessionsValue,
          conversion_rate: product.conversionRateValue,
          add_to_cart_rate: product.addToCartRate,
          return_rate: product.returnRate,
          gross_margin: product.grossMarginValue
        }
      ];
    });

    if (productMetricPayload.length > 0) {
      const { error: productMetricsError } = await supabase
        .from("daily_product_metrics")
        .upsert(productMetricPayload, {
          onConflict: "brand_id,product_id,metric_date"
        });

      if (productMetricsError) {
        return null;
      }
    }

    return {
      productsImported: snapshot.products.length,
      variantsImported: variantPayload.length,
      ordersImported: snapshot.orders.length,
      storeMetricsImported: snapshot.dailyStoreMetrics.length,
      productMetricsImported: productMetricPayload.length
    };
  } catch {
    return null;
  }
}
