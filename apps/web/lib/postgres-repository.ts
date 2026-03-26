import "server-only";

import { execFileSync } from "node:child_process";
import type {
  AppRepository,
  RepositoryAutomationSeed,
  RepositoryAutomationSettingsSeed,
  RepositoryBrandMemorySeed,
  RepositoryCatalogProduct,
  RepositoryStoreSeed,
  RepositoryStoreMetric,
  RepositoryShopifySnapshot,
  RepositoryShopifyIngestResult,
  RepositorySyncRunSeed,
  RepositoryTeamMemberSeed
} from "./app-repository";
import type {
  WorkspaceBrand,
  WorkspaceIntegration,
  WorkspaceMembership,
  WorkspaceUser
} from "./workspace";

function escapeSqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function toJsonbLiteral(value: unknown) {
  return `${escapeSqlLiteral(JSON.stringify(value))}::jsonb`;
}

function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim() ?? "";
}

function runCommand(sql: string) {
  runScalarQuery(`${sql}\nSELECT 'ok';`);
}

function runScalarQuery(sql: string) {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return execFileSync(
    "psql",
    [
      "-X",
      "--no-psqlrc",
      "--set",
      "ON_ERROR_STOP=1",
      "--tuples-only",
      "--no-align",
      "--quiet",
      "--dbname",
      databaseUrl,
      "--command",
      sql
    ],
    {
      encoding: "utf8"
    }
  ).trim();
}

function queryJsonValue<T>(sql: string, fallback: T): T {
  const output = runScalarQuery(sql);

  if (!output) {
    return fallback;
  }

  return JSON.parse(output) as T;
}

function queryJsonArray<T>(sql: string) {
  return queryJsonValue<T[]>(sql, []);
}

function queryJsonObject<T>(sql: string) {
  return queryJsonValue<T | null>(sql, null);
}

export function canUsePostgresRepository() {
  try {
    return (
      runScalarQuery(`
        SELECT (
          EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = 'automation_policies'
          )
          AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'brand_users'
              AND column_name = 'job_title'
          )
        )::text;
      `) === "true"
    );
  } catch {
    return false;
  }
}

function listUsers(): WorkspaceUser[] {
  return queryJsonArray<WorkspaceUser>(`
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.email), '[]'::json)::text
    FROM (
      SELECT DISTINCT ON (LOWER(email))
        LOWER(email) AS id,
        COALESCE(NULLIF(full_name, ''), initcap(regexp_replace(split_part(email, '@', 1), '[._-]+', ' ', 'g'))) AS name,
        LOWER(email) AS email,
        COALESCE(NULLIF(job_title, ''), initcap(regexp_replace(role, '_', ' ', 'g'))) AS title
      FROM brand_users
      WHERE status = 'active'
      ORDER BY LOWER(email), updated_at DESC
    ) t;
  `);
}

function listBrands(): WorkspaceBrand[] {
  return queryJsonArray<WorkspaceBrand>(`
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.name), '[]'::json)::text
    FROM (
      SELECT
        slug AS id,
        name,
        COALESCE(NULLIF(vertical, ''), 'Unknown vertical') AS vertical,
        COALESCE(NULLIF(timezone, ''), 'UTC') AS timezone,
        COALESCE(NULLIF(gmv_band, ''), 'Unknown GMV') AS "gmvBand"
      FROM brands
      WHERE status = 'active'
    ) t;
  `);
}

function listMemberships(): WorkspaceMembership[] {
  return queryJsonArray<WorkspaceMembership>(`
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t."brandId", t."userId"), '[]'::json)::text
    FROM (
      SELECT
        brands.slug AS "brandId",
        LOWER(brand_users.email) AS "userId",
        brand_users.role
      FROM brand_users
      JOIN brands ON brands.id = brand_users.brand_id
      WHERE brands.status = 'active'
        AND brand_users.status = 'active'
    ) t;
  `);
}

function listIntegrations(brandId: string): WorkspaceIntegration[] {
  return queryJsonArray<WorkspaceIntegration>(`
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.provider), '[]'::json)::text
    FROM (
      SELECT
        integration_connections.provider,
        integration_connections.status,
        COALESCE(
          to_char(integration_connections.last_synced_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          to_char(integration_connections.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        ) AS "lastSyncedAt"
      FROM integration_connections
      JOIN brands ON brands.id = integration_connections.brand_id
      WHERE brands.slug = ${escapeSqlLiteral(brandId)}
    ) t;
  `);
}

function listStores(brandId: string): RepositoryStoreSeed[] {
  return queryJsonArray<RepositoryStoreSeed>(`
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t."updatedAt" DESC), '[]'::json)::text
    FROM (
      SELECT
        stores.id::text AS id,
        stores.platform,
        stores.shop_domain AS "shopDomain",
        stores.currency,
        stores.status,
        to_char(stores.connected_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "connectedAt",
        to_char(stores.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt"
      FROM stores
      JOIN brands ON brands.id = stores.brand_id
      WHERE brands.slug = ${escapeSqlLiteral(brandId)}
    ) t;
  `);
}

function upsertStore(
  brandId: string,
  store: RepositoryStoreSeed
): RepositoryStoreSeed | null {
  return queryJsonObject<RepositoryStoreSeed>(`
    WITH selected_brand AS (
      SELECT id
      FROM brands
      WHERE slug = ${escapeSqlLiteral(brandId)}
      LIMIT 1
    ),
    upserted AS (
      INSERT INTO stores (
        id,
        brand_id,
        platform,
        shop_domain,
        currency,
        status,
        connected_at,
        updated_at
      )
      SELECT
        ${escapeSqlLiteral(store.id)}::uuid,
        selected_brand.id,
        ${escapeSqlLiteral(store.platform)},
        ${escapeSqlLiteral(store.shopDomain)},
        ${escapeSqlLiteral(store.currency)},
        ${escapeSqlLiteral(store.status)},
        ${store.connectedAt ? `${escapeSqlLiteral(store.connectedAt)}::timestamptz` : "NULL"},
        NOW()
      FROM selected_brand
      ON CONFLICT (id) DO UPDATE
      SET
        platform = EXCLUDED.platform,
        shop_domain = EXCLUDED.shop_domain,
        currency = EXCLUDED.currency,
        status = EXCLUDED.status,
        connected_at = EXCLUDED.connected_at,
        updated_at = NOW()
      RETURNING
        id::text AS id,
        platform,
        shop_domain AS "shopDomain",
        currency,
        status,
        to_char(connected_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "connectedAt",
        to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt"
    )
    SELECT row_to_json(upserted)::text
    FROM upserted
    LIMIT 1;
  `);
}

function listSyncRuns(
  brandId: string,
  provider?: string
): RepositorySyncRunSeed[] {
  return queryJsonArray<RepositorySyncRunSeed>(`
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t."updatedAt" DESC), '[]'::json)::text
    FROM (
      SELECT
        sync_runs.id::text AS id,
        sync_runs.provider,
        sync_runs.status,
        to_char(sync_runs.started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "startedAt",
        to_char(sync_runs.finished_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "finishedAt",
        sync_runs.records_processed AS "recordsProcessed",
        sync_runs.error_message AS "errorMessage",
        COALESCE(sync_runs.metadata_json ->> 'triggerLabel', 'Sync run') AS "triggerLabel",
        NULLIF(sync_runs.metadata_json ->> 'source', '') AS source,
        NULLIF(sync_runs.metadata_json ->> 'fallbackReason', '') AS "fallbackReason",
        to_char(
          COALESCE(sync_runs.finished_at, sync_runs.started_at, sync_runs.created_at) AT TIME ZONE 'UTC',
          'YYYY-MM-DD"T"HH24:MI:SS"Z"'
        ) AS "updatedAt"
      FROM sync_runs
      JOIN brands ON brands.id = sync_runs.brand_id
      WHERE brands.slug = ${escapeSqlLiteral(brandId)}
        ${provider ? `AND sync_runs.provider = ${escapeSqlLiteral(provider)}` : ""}
    ) t;
  `);
}

function listCatalogProducts(brandId: string): RepositoryCatalogProduct[] {
  return queryJsonArray<RepositoryCatalogProduct>(`
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.title), '[]'::json)::text
    FROM (
      SELECT
        products.external_product_id AS id,
        products.title,
        COALESCE(products.metadata_json ->> 'collection', COALESCE(products.product_type, 'Uncategorized')) AS collection,
        COALESCE(products.metadata_json ->> 'workflowStatus', 'stable') AS status,
        COALESCE(products.metadata_json ->> 'revenueShare', '0%') AS "revenueShare",
        COALESCE(products.metadata_json ->> 'revenueDelta', '0.0%') AS "revenueDelta",
        COALESCE(products.metadata_json ->> 'conversionRate', '0.0%') AS "conversionRate",
        COALESCE(products.metadata_json ->> 'conversionDelta', '0.0pp') AS "conversionDelta",
        COALESCE(products.metadata_json ->> 'marginBand', 'Pending margin data') AS "marginBand",
        COALESCE(products.metadata_json ->> 'inventoryNote', 'Waiting for sync') AS "inventoryNote",
        COALESCE(products.metadata_json ->> 'summary', '') AS summary,
        COALESCE(products.metadata_json ->> 'heroMessage', '') AS "heroMessage",
        COALESCE(products.metadata_json ->> 'watchout', '') AS watchout,
        COALESCE(products.metadata_json -> 'recommendedFormats', '[]'::jsonb) AS "recommendedFormats"
      FROM products
      JOIN brands ON brands.id = products.brand_id
      WHERE brands.slug = ${escapeSqlLiteral(brandId)}
    ) t;
  `);
}

function listStoreMetrics(brandId: string): RepositoryStoreMetric[] {
  return queryJsonArray<RepositoryStoreMetric>(`
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t."metricDate" DESC), '[]'::json)::text
    FROM (
      SELECT
        metric_date::text AS "metricDate",
        revenue,
        orders_count AS "ordersCount",
        aov,
        sessions,
        conversion_rate AS "conversionRate",
        repeat_purchase_rate AS "repeatPurchaseRate",
        returning_customer_revenue AS "returningCustomerRevenue"
      FROM daily_store_metrics
      JOIN brands ON brands.id = daily_store_metrics.brand_id
      WHERE brands.slug = ${escapeSqlLiteral(brandId)}
    ) t;
  `);
}

function ingestShopifySnapshot(
  brandId: string,
  snapshot: RepositoryShopifySnapshot
): RepositoryShopifyIngestResult {
  const productStatements = snapshot.products.flatMap((product) => {
    const productMetadata = toJsonbLiteral({
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
    });

    const variantStatements = product.variants.map(
      (variant) => `
        INSERT INTO product_variants (
          brand_id,
          product_id,
          external_variant_id,
          title,
          sku,
          price,
          inventory_quantity,
          updated_at
        )
        SELECT
          selected_brand.id,
          products.id,
          ${escapeSqlLiteral(variant.externalVariantId)},
          ${escapeSqlLiteral(variant.title)},
          ${escapeSqlLiteral(variant.sku)},
          ${String(variant.price)},
          ${String(variant.inventoryQuantity)},
          NOW()
        FROM selected_brand
        JOIN products
          ON products.brand_id = selected_brand.id
         AND products.external_product_id = ${escapeSqlLiteral(product.id)}
        ON CONFLICT (brand_id, external_variant_id) DO UPDATE
        SET
          title = EXCLUDED.title,
          sku = EXCLUDED.sku,
          price = EXCLUDED.price,
          inventory_quantity = EXCLUDED.inventory_quantity,
          updated_at = NOW();
      `
    );

    return [
      `
        INSERT INTO products (
          brand_id,
          external_product_id,
          title,
          handle,
          product_type,
          status,
          price_min,
          price_max,
          metadata_json,
          updated_at
        )
        SELECT
          selected_brand.id,
          ${escapeSqlLiteral(product.id)},
          ${escapeSqlLiteral(product.title)},
          ${escapeSqlLiteral(product.handle)},
          ${escapeSqlLiteral(product.collection)},
          'active',
          ${String(product.priceMin)},
          ${String(product.priceMax)},
          ${productMetadata},
          NOW()
        FROM selected_brand
        ON CONFLICT (brand_id, external_product_id) DO UPDATE
        SET
          title = EXCLUDED.title,
          handle = EXCLUDED.handle,
          product_type = EXCLUDED.product_type,
          price_min = EXCLUDED.price_min,
          price_max = EXCLUDED.price_max,
          metadata_json = EXCLUDED.metadata_json,
          updated_at = NOW();
      `,
      `
        INSERT INTO daily_product_metrics (
          brand_id,
          product_id,
          metric_date,
          revenue,
          units_sold,
          sessions,
          conversion_rate,
          add_to_cart_rate,
          return_rate,
          gross_margin
        )
        SELECT
          selected_brand.id,
          products.id,
          ${escapeSqlLiteral(product.metricDate)}::date,
          ${String(product.revenueValue)},
          ${String(product.unitsSold)},
          ${String(product.sessionsValue)},
          ${String(product.conversionRateValue)},
          ${String(product.addToCartRate)},
          ${String(product.returnRate)},
          ${String(product.grossMarginValue)}
        FROM selected_brand
        JOIN products
          ON products.brand_id = selected_brand.id
         AND products.external_product_id = ${escapeSqlLiteral(product.id)}
        ON CONFLICT (brand_id, product_id, metric_date) DO UPDATE
        SET
          revenue = EXCLUDED.revenue,
          units_sold = EXCLUDED.units_sold,
          sessions = EXCLUDED.sessions,
          conversion_rate = EXCLUDED.conversion_rate,
          add_to_cart_rate = EXCLUDED.add_to_cart_rate,
          return_rate = EXCLUDED.return_rate,
          gross_margin = EXCLUDED.gross_margin;
      `,
      ...variantStatements
    ];
  });

  const orderStatements = snapshot.orders.map(
    (order) => `
      INSERT INTO orders (
        brand_id,
        store_id,
        external_order_id,
        order_number,
        order_date,
        customer_email,
        subtotal_amount,
        discount_amount,
        total_amount,
        financial_status,
        fulfillment_status,
        updated_at
      )
      SELECT
        selected_brand.id,
        stores.id,
        ${escapeSqlLiteral(order.externalOrderId)},
        ${escapeSqlLiteral(order.orderNumber)},
        ${escapeSqlLiteral(order.orderDate)}::timestamptz,
        ${escapeSqlLiteral(order.customerEmail)},
        ${String(order.subtotalAmount)},
        ${String(order.discountAmount)},
        ${String(order.totalAmount)},
        ${escapeSqlLiteral(order.financialStatus)},
        ${escapeSqlLiteral(order.fulfillmentStatus)},
        NOW()
      FROM selected_brand
      LEFT JOIN stores
        ON stores.brand_id = selected_brand.id
       AND stores.platform = 'shopify'
      ON CONFLICT (brand_id, external_order_id) DO UPDATE
      SET
        order_number = EXCLUDED.order_number,
        order_date = EXCLUDED.order_date,
        customer_email = EXCLUDED.customer_email,
        subtotal_amount = EXCLUDED.subtotal_amount,
        discount_amount = EXCLUDED.discount_amount,
        total_amount = EXCLUDED.total_amount,
        financial_status = EXCLUDED.financial_status,
        fulfillment_status = EXCLUDED.fulfillment_status,
        updated_at = NOW();
    `
  );

  const storeMetricStatements = snapshot.dailyStoreMetrics.map(
    (metric) => `
      INSERT INTO daily_store_metrics (
        brand_id,
        metric_date,
        revenue,
        orders_count,
        aov,
        sessions,
        conversion_rate,
        repeat_purchase_rate,
        returning_customer_revenue
      )
      SELECT
        selected_brand.id,
        ${escapeSqlLiteral(metric.metricDate)}::date,
        ${String(metric.revenue)},
        ${String(metric.ordersCount)},
        ${String(metric.aov)},
        ${String(metric.sessions)},
        ${String(metric.conversionRate)},
        ${String(metric.repeatPurchaseRate)},
        ${String(metric.returningCustomerRevenue)}
      FROM selected_brand
      ON CONFLICT (brand_id, metric_date) DO UPDATE
      SET
        revenue = EXCLUDED.revenue,
        orders_count = EXCLUDED.orders_count,
        aov = EXCLUDED.aov,
        sessions = EXCLUDED.sessions,
        conversion_rate = EXCLUDED.conversion_rate,
        repeat_purchase_rate = EXCLUDED.repeat_purchase_rate,
        returning_customer_revenue = EXCLUDED.returning_customer_revenue;
    `
  );

  runCommand(`
    WITH selected_brand AS (
      SELECT id
      FROM brands
      WHERE slug = ${escapeSqlLiteral(brandId)}
      LIMIT 1
    )
    INSERT INTO stores (
      brand_id,
      platform,
      shop_domain,
      currency,
      status,
      connected_at,
      updated_at
    )
    SELECT
      selected_brand.id,
      'shopify',
      ${escapeSqlLiteral(snapshot.shopDomain)},
      ${escapeSqlLiteral(snapshot.currency)},
      'connected',
      NOW(),
      NOW()
    FROM selected_brand
    ON CONFLICT (brand_id, shop_domain) DO UPDATE
    SET
      currency = EXCLUDED.currency,
      status = EXCLUDED.status,
      connected_at = COALESCE(stores.connected_at, EXCLUDED.connected_at),
      updated_at = NOW();

    ${productStatements.join("\n")}
    ${orderStatements.join("\n")}
    ${storeMetricStatements.join("\n")}
  `);

  return {
    products: listCatalogProducts(brandId),
    storeMetrics: listStoreMetrics(brandId),
    recordsProcessed:
      snapshot.products.length +
      snapshot.orders.length +
      snapshot.products.reduce((total, product) => total + product.variants.length, 0) +
      snapshot.dailyStoreMetrics.length
  };
}

function appendSyncRun(
  brandId: string,
  run: RepositorySyncRunSeed
): RepositorySyncRunSeed | null {
  return queryJsonObject<RepositorySyncRunSeed>(`
    WITH selected_brand AS (
      SELECT id
      FROM brands
      WHERE slug = ${escapeSqlLiteral(brandId)}
      LIMIT 1
    ),
    inserted AS (
      INSERT INTO sync_runs (
        id,
        brand_id,
        provider,
        status,
        started_at,
        finished_at,
        records_processed,
        error_message,
        metadata_json
      )
      SELECT
        ${escapeSqlLiteral(run.id)}::uuid,
        selected_brand.id,
        ${escapeSqlLiteral(run.provider)},
        ${escapeSqlLiteral(run.status)},
        ${run.startedAt ? `${escapeSqlLiteral(run.startedAt)}::timestamptz` : "NULL"},
        ${run.finishedAt ? `${escapeSqlLiteral(run.finishedAt)}::timestamptz` : "NULL"},
        ${String(run.recordsProcessed)},
        ${run.errorMessage ? escapeSqlLiteral(run.errorMessage) : "NULL"},
        ${toJsonbLiteral({
          triggerLabel: run.triggerLabel,
          source: run.source,
          fallbackReason: run.fallbackReason
        })}
      FROM selected_brand
      RETURNING
        id::text AS id,
        provider,
        status,
        to_char(started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "startedAt",
        to_char(finished_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "finishedAt",
        records_processed AS "recordsProcessed",
        error_message AS "errorMessage",
        COALESCE(metadata_json ->> 'triggerLabel', 'Sync run') AS "triggerLabel",
        NULLIF(metadata_json ->> 'source', '') AS source,
        NULLIF(metadata_json ->> 'fallbackReason', '') AS "fallbackReason",
        to_char(
          COALESCE(finished_at, started_at, created_at) AT TIME ZONE 'UTC',
          'YYYY-MM-DD"T"HH24:MI:SS"Z"'
        ) AS "updatedAt"
    )
    SELECT row_to_json(inserted)::text
    FROM inserted
    LIMIT 1;
  `);
}

function getBrandMemorySeed(brandId: string): RepositoryBrandMemorySeed | null {
  return queryJsonObject<RepositoryBrandMemorySeed>(`
    SELECT row_to_json(t)::text
    FROM (
      SELECT
        COALESCE(brand_profiles.positioning, '') AS positioning,
        COALESCE(brand_profiles.target_customer, '') AS "targetCustomer",
        COALESCE(brand_voice_profiles.tone, '') AS tone,
        COALESCE(brand_profiles.hero_products, '[]'::jsonb) AS "heroProducts",
        COALESCE(brand_voice_profiles.do_say, '[]'::jsonb) AS "doSay",
        COALESCE(brand_voice_profiles.dont_say, '[]'::jsonb) AS "dontSay",
        COALESCE(brand_profiles.goals_json -> 'customerPersonas', '[]'::jsonb) AS "customerPersonas",
        to_char(
          GREATEST(
            COALESCE(brand_profiles.updated_at, NOW()),
            COALESCE(brand_voice_profiles.updated_at, NOW())
          ) AT TIME ZONE 'UTC',
          'YYYY-MM-DD"T"HH24:MI:SS"Z"'
        ) AS "updatedAt"
      FROM brands
      LEFT JOIN brand_profiles ON brand_profiles.brand_id = brands.id
      LEFT JOIN brand_voice_profiles ON brand_voice_profiles.brand_id = brands.id
      WHERE brands.slug = ${escapeSqlLiteral(brandId)}
      LIMIT 1
    ) t;
  `);
}

function listTeamSeedMembers(brandId: string): RepositoryTeamMemberSeed[] {
  return queryJsonArray<RepositoryTeamMemberSeed>(`
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.email), '[]'::json)::text
    FROM (
      SELECT
        brand_users.id::text AS id,
        COALESCE(NULLIF(brand_users.full_name, ''), initcap(regexp_replace(split_part(brand_users.email, '@', 1), '[._-]+', ' ', 'g'))) AS name,
        LOWER(brand_users.email) AS email,
        COALESCE(NULLIF(brand_users.job_title, ''), initcap(regexp_replace(brand_users.role, '_', ' ', 'g'))) AS title,
        brand_users.role,
        brand_users.status,
        to_char(brand_users.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt",
        to_char(brand_users.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "invitedAt",
        to_char(brand_users.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "lastNotifiedAt"
      FROM brand_users
      JOIN brands ON brands.id = brand_users.brand_id
      WHERE brands.slug = ${escapeSqlLiteral(brandId)}
    ) t;
  `);
}

function listAutomationSeeds(brandId: string): RepositoryAutomationSeed[] {
  return queryJsonArray<RepositoryAutomationSeed>(`
    SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.name), '[]'::json)::text
    FROM (
      SELECT
        automation_policies.id::text AS id,
        automation_policies.name,
        automation_policies.policy_type AS "policyType",
        COALESCE(automation_policies.config_json ->> 'scope', '') AS scope,
        COALESCE(automation_policies.config_json ->> 'summary', '') AS summary,
        COALESCE(automation_policies.config_json ->> 'triggerLabel', '') AS "triggerLabel",
        automation_policies.status,
        to_char(automation_policies.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt",
        automation_policies.config_json ->> 'lastRunAt' AS "lastRunAt",
        automation_policies.config_json ->> 'nextRunAt' AS "nextRunAt"
      FROM automation_policies
      JOIN brands ON brands.id = automation_policies.brand_id
      WHERE brands.slug = ${escapeSqlLiteral(brandId)}
        AND automation_policies.policy_type <> 'workspace_controls'
    ) t;
  `);
}

function getAutomationSettingsSeed(
  brandId: string
): RepositoryAutomationSettingsSeed | null {
  return queryJsonObject<RepositoryAutomationSettingsSeed>(`
    SELECT row_to_json(t)::text
    FROM (
      SELECT
        COALESCE(automation_policies.config_json ->> 'approvalMode', 'always_review') AS "approvalMode",
        COALESCE(automation_policies.config_json ->> 'autoPublishMode', 'never') AS "autoPublishMode",
        COALESCE(automation_policies.config_json ->> 'alertSensitivity', 'normal') AS "alertSensitivity",
        COALESCE(automation_policies.config_json ->> 'weeklyBriefCadence', 'monday_am') AS "weeklyBriefCadence",
        to_char(automation_policies.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt"
      FROM automation_policies
      JOIN brands ON brands.id = automation_policies.brand_id
      WHERE brands.slug = ${escapeSqlLiteral(brandId)}
        AND automation_policies.policy_type = 'workspace_controls'
      ORDER BY automation_policies.updated_at DESC
      LIMIT 1
    ) t;
  `);
}

function upsertIntegration(
  brandId: string,
  integration: WorkspaceIntegration
): WorkspaceIntegration | null {
  return queryJsonObject<WorkspaceIntegration>(`
    WITH selected_brand AS (
      SELECT id
      FROM brands
      WHERE slug = ${escapeSqlLiteral(brandId)}
      LIMIT 1
    ),
    upserted AS (
      INSERT INTO integration_connections (
        brand_id,
        provider,
        status,
        last_synced_at,
        updated_at
      )
      SELECT
        selected_brand.id,
        ${escapeSqlLiteral(integration.provider)},
        ${escapeSqlLiteral(integration.status)},
        ${escapeSqlLiteral(integration.lastSyncedAt)}::timestamptz,
        NOW()
      FROM selected_brand
      ON CONFLICT (brand_id, provider) DO UPDATE
      SET
        status = EXCLUDED.status,
        last_synced_at = EXCLUDED.last_synced_at,
        updated_at = NOW()
      RETURNING
        provider,
        status,
        to_char(last_synced_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "lastSyncedAt"
    )
    SELECT row_to_json(upserted)::text
    FROM upserted
    LIMIT 1;
  `);
}

function saveBrandMemory(
  brandId: string,
  brandMemory: RepositoryBrandMemorySeed
): RepositoryBrandMemorySeed | null {
  return queryJsonObject<RepositoryBrandMemorySeed>(`
    WITH selected_brand AS (
      SELECT id
      FROM brands
      WHERE slug = ${escapeSqlLiteral(brandId)}
      LIMIT 1
    ),
    profile_upsert AS (
      INSERT INTO brand_profiles (
        brand_id,
        positioning,
        target_customer,
        hero_products,
        goals_json,
        updated_at
      )
      SELECT
        selected_brand.id,
        ${escapeSqlLiteral(brandMemory.positioning)},
        ${escapeSqlLiteral(brandMemory.targetCustomer)},
        ${toJsonbLiteral(brandMemory.heroProducts)},
        ${toJsonbLiteral({ customerPersonas: brandMemory.customerPersonas })},
        NOW()
      FROM selected_brand
      ON CONFLICT (brand_id) DO UPDATE
      SET
        positioning = EXCLUDED.positioning,
        target_customer = EXCLUDED.target_customer,
        hero_products = EXCLUDED.hero_products,
        goals_json = COALESCE(brand_profiles.goals_json, '{}'::jsonb) || EXCLUDED.goals_json,
        updated_at = NOW()
    ),
    voice_upsert AS (
      INSERT INTO brand_voice_profiles (
        brand_id,
        tone,
        do_say,
        dont_say,
        updated_at
      )
      SELECT
        selected_brand.id,
        ${escapeSqlLiteral(brandMemory.tone)},
        ${toJsonbLiteral(brandMemory.doSay)},
        ${toJsonbLiteral(brandMemory.dontSay)},
        NOW()
      FROM selected_brand
      ON CONFLICT (brand_id) DO UPDATE
      SET
        tone = EXCLUDED.tone,
        do_say = EXCLUDED.do_say,
        dont_say = EXCLUDED.dont_say,
        updated_at = NOW()
    )
    SELECT row_to_json(t)::text
    FROM (
      SELECT
        COALESCE(brand_profiles.positioning, '') AS positioning,
        COALESCE(brand_profiles.target_customer, '') AS "targetCustomer",
        COALESCE(brand_voice_profiles.tone, '') AS tone,
        COALESCE(brand_profiles.hero_products, '[]'::jsonb) AS "heroProducts",
        COALESCE(brand_voice_profiles.do_say, '[]'::jsonb) AS "doSay",
        COALESCE(brand_voice_profiles.dont_say, '[]'::jsonb) AS "dontSay",
        COALESCE(brand_profiles.goals_json -> 'customerPersonas', '[]'::jsonb) AS "customerPersonas",
        to_char(
          GREATEST(
            COALESCE(brand_profiles.updated_at, NOW()),
            COALESCE(brand_voice_profiles.updated_at, NOW())
          ) AT TIME ZONE 'UTC',
          'YYYY-MM-DD"T"HH24:MI:SS"Z"'
        ) AS "updatedAt"
      FROM brands
      LEFT JOIN brand_profiles ON brand_profiles.brand_id = brands.id
      LEFT JOIN brand_voice_profiles ON brand_voice_profiles.brand_id = brands.id
      WHERE brands.slug = ${escapeSqlLiteral(brandId)}
      LIMIT 1
    ) t;
  `);
}

function upsertTeamMember(
  brandId: string,
  member: RepositoryTeamMemberSeed
): RepositoryTeamMemberSeed | null {
  return queryJsonObject<RepositoryTeamMemberSeed>(`
    WITH selected_brand AS (
      SELECT id
      FROM brands
      WHERE slug = ${escapeSqlLiteral(brandId)}
      LIMIT 1
    ),
    upserted AS (
      INSERT INTO brand_users (
        brand_id,
        email,
        full_name,
        job_title,
        role,
        status,
        created_at,
        updated_at
      )
      SELECT
        selected_brand.id,
        ${escapeSqlLiteral(member.email.toLowerCase())},
        ${escapeSqlLiteral(member.name)},
        ${escapeSqlLiteral(member.title)},
        ${escapeSqlLiteral(member.role)},
        ${escapeSqlLiteral(member.status)},
        COALESCE(${escapeSqlLiteral(member.invitedAt ?? member.updatedAt)}::timestamptz, NOW()),
        NOW()
      FROM selected_brand
      ON CONFLICT (brand_id, email) DO UPDATE
      SET
        full_name = EXCLUDED.full_name,
        job_title = EXCLUDED.job_title,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        updated_at = NOW()
      RETURNING
        id::text AS id,
        COALESCE(NULLIF(full_name, ''), initcap(regexp_replace(split_part(email, '@', 1), '[._-]+', ' ', 'g'))) AS name,
        LOWER(email) AS email,
        COALESCE(NULLIF(job_title, ''), initcap(regexp_replace(role, '_', ' ', 'g'))) AS title,
        role,
        status,
        to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt",
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "invitedAt",
        ${member.lastNotifiedAt ? escapeSqlLiteral(member.lastNotifiedAt) : "NULL"} AS "lastNotifiedAt"
    )
    SELECT row_to_json(upserted)::text
    FROM upserted
    LIMIT 1;
  `);
}

function upsertAutomation(
  brandId: string,
  automation: RepositoryAutomationSeed
): RepositoryAutomationSeed | null {
  return queryJsonObject<RepositoryAutomationSeed>(`
    WITH selected_brand AS (
      SELECT id
      FROM brands
      WHERE slug = ${escapeSqlLiteral(brandId)}
      LIMIT 1
    ),
    upserted AS (
      INSERT INTO automation_policies (
        id,
        brand_id,
        name,
        policy_type,
        status,
        config_json,
        updated_at
      )
      SELECT
        ${escapeSqlLiteral(automation.id)}::uuid,
        selected_brand.id,
        ${escapeSqlLiteral(automation.name)},
        ${escapeSqlLiteral(automation.policyType)},
        ${escapeSqlLiteral(automation.status)},
        ${toJsonbLiteral({
          scope: automation.scope,
          summary: automation.summary,
          triggerLabel: automation.triggerLabel,
          lastRunAt: automation.lastRunAt ?? null,
          nextRunAt: automation.nextRunAt ?? null
        })},
        NOW()
      FROM selected_brand
      ON CONFLICT (id) DO UPDATE
      SET
        name = EXCLUDED.name,
        policy_type = EXCLUDED.policy_type,
        status = EXCLUDED.status,
        config_json = EXCLUDED.config_json,
        updated_at = NOW()
      RETURNING
        id::text AS id,
        name,
        policy_type AS "policyType",
        COALESCE(config_json ->> 'scope', '') AS scope,
        COALESCE(config_json ->> 'summary', '') AS summary,
        COALESCE(config_json ->> 'triggerLabel', '') AS "triggerLabel",
        status,
        to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt",
        config_json ->> 'lastRunAt' AS "lastRunAt",
        config_json ->> 'nextRunAt' AS "nextRunAt"
    )
    SELECT row_to_json(upserted)::text
    FROM upserted
    LIMIT 1;
  `);
}

function saveAutomationSettings(
  brandId: string,
  settings: RepositoryAutomationSettingsSeed
): RepositoryAutomationSettingsSeed | null {
  return queryJsonObject<RepositoryAutomationSettingsSeed>(`
    WITH selected_brand AS (
      SELECT id
      FROM brands
      WHERE slug = ${escapeSqlLiteral(brandId)}
      LIMIT 1
    ),
    existing_policy AS (
      SELECT automation_policies.id
      FROM automation_policies
      JOIN selected_brand ON selected_brand.id = automation_policies.brand_id
      WHERE automation_policies.policy_type = 'workspace_controls'
      ORDER BY automation_policies.updated_at DESC
      LIMIT 1
    ),
    upserted AS (
      INSERT INTO automation_policies (
        id,
        brand_id,
        name,
        policy_type,
        status,
        config_json,
        updated_at
      )
      SELECT
        COALESCE((SELECT id FROM existing_policy), gen_random_uuid()),
        selected_brand.id,
        'Workspace Controls',
        'workspace_controls',
        'active',
        ${toJsonbLiteral({
          approvalMode: settings.approvalMode,
          autoPublishMode: settings.autoPublishMode,
          alertSensitivity: settings.alertSensitivity,
          weeklyBriefCadence: settings.weeklyBriefCadence
        })},
        NOW()
      FROM selected_brand
      ON CONFLICT (id) DO UPDATE
      SET
        name = EXCLUDED.name,
        status = EXCLUDED.status,
        config_json = EXCLUDED.config_json,
        updated_at = NOW()
      RETURNING
        COALESCE(config_json ->> 'approvalMode', 'always_review') AS "approvalMode",
        COALESCE(config_json ->> 'autoPublishMode', 'never') AS "autoPublishMode",
        COALESCE(config_json ->> 'alertSensitivity', 'normal') AS "alertSensitivity",
        COALESCE(config_json ->> 'weeklyBriefCadence', 'monday_am') AS "weeklyBriefCadence",
        to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "updatedAt"
    )
    SELECT row_to_json(upserted)::text
    FROM upserted
    LIMIT 1;
  `);
}

export function createPostgresRepository(): AppRepository {
  return {
    listUsers,
    listBrands,
    listMemberships,
    listIntegrations,
    listStores,
    upsertStore,
    listSyncRuns,
    appendSyncRun,
    listCatalogProducts,
    listStoreMetrics,
    ingestShopifySnapshot,
    getBrandMemorySeed,
    listTeamSeedMembers,
    listAutomationSeeds,
    getAutomationSettingsSeed,
    upsertIntegration,
    saveBrandMemory,
    upsertTeamMember,
    upsertAutomation,
    saveAutomationSettings
  };
}
