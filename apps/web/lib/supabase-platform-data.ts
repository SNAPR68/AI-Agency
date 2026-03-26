import "server-only";

import { randomUUID } from "node:crypto";
import { cache } from "react";
import type {
  RepositoryAutomationSettingsSeed,
  RepositorySyncRunSeed
} from "./app-repository";
import { getAppRepository } from "./app-repository";
import {
  changeTeamMemberRole,
  createAutomationPolicy,
  editAutomationPolicy,
  getAutomationSettings,
  getBrandMemoryProfile,
  inviteTeamMember,
  listAutomationPolicies,
  listSettingsTeamMembers,
  removeTeamMember,
  resendTeamInvite,
  saveAutomationSettings,
  saveBrandMemoryProfile,
  toggleAutomationPolicy,
  type AutomationSettingsView,
  type AutomationView,
  type BrandMemoryView,
  type TeamMemberView
} from "./settings-data";
import {
  buildCommerceSyncRunView,
  getPrimaryShopifyStore,
  listCommerceStores,
  listProviderSyncRuns,
  saveShopifyStoreConnection,
  triggerProviderSync,
  type CommerceStoreView,
  type CommerceSyncRunView
} from "./commerce-setup-data";
import {
  listIntegrationViews,
  type WorkspaceIntegrationView
} from "./operating-data";
import { createSupabaseAdminClient, canUseSupabaseAdmin } from "./supabase-admin";
import type { WorkspaceIntegration, WorkspaceRole } from "./workspace";
import { formatWorkspaceRole } from "./workspace";
import { getWorkspaceBrand, getWorkspaceMembers } from "./workspace-data";

type SupabaseBrandRecord = {
  id: string;
  slug: string;
  name: string;
};

type IntegrationConnectionRow = {
  id: string;
  provider: string;
  status: WorkspaceIntegration["status"];
  account_label: string | null;
  metadata_json: Record<string, unknown> | null;
  last_synced_at: string | null;
  updated_at: string;
};

type StoreRow = {
  id: string;
  platform: string;
  shop_domain: string;
  currency: string;
  status: "pending" | "connected" | "degraded";
  connected_at: string | null;
  updated_at: string;
};

type SyncRunRow = {
  id: string;
  provider: string;
  status: "queued" | "running" | "success" | "failed";
  started_at: string | null;
  finished_at: string | null;
  records_processed: number | null;
  error_message: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
};

type BrandProfileRow = {
  positioning: string | null;
  target_customer: string | null;
  hero_products: unknown;
  goals_json: Record<string, unknown> | null;
  updated_at: string;
};

type BrandVoiceProfileRow = {
  tone: string | null;
  do_say: unknown;
  dont_say: unknown;
  updated_at: string;
};

type BrandUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  job_title: string | null;
  role: string;
  status: "active" | "invited" | "removed";
  created_at: string;
  updated_at: string;
};

type AutomationPolicyRow = {
  id: string;
  name: string;
  policy_type: string;
  status: "active" | "paused";
  config_json: Record<string, unknown> | null;
  updated_at: string;
};

type BrandMemoryInput = Omit<BrandMemoryView, "brandName" | "updatedAtLabel" | "updatedAt"> & {
  positioning: string;
  targetCustomer: string;
  tone: string;
  heroProducts: string[];
  doSay: string[];
  dontSay: string[];
  customerPersonas: string[];
};

type InviteTeamMemberInput = {
  name: string;
  email: string;
  title: string;
  role: WorkspaceRole;
};

type EditAutomationInput = {
  name: string;
  scope: string;
  summary: string;
  triggerLabel: string;
};

const providerMetadata: Record<
  string,
  {
    label: string;
    accountLabel: string;
    coverage: string;
    note: string;
  }
> = {
  shopify: {
    label: "Shopify",
    accountLabel: "Commerce backbone",
    coverage: "Orders, products, customers, and daily store metrics.",
    note: "This is the core commerce source for the workspace."
  },
  meta: {
    label: "Meta",
    accountLabel: "Ads account",
    coverage: "Paid social performance, campaigns, and creative efficiency.",
    note: "Use this to explain spend shifts and acquisition pressure."
  },
  ga4: {
    label: "GA4",
    accountLabel: "Analytics property",
    coverage: "Traffic quality, sessions, and landing-page behavior.",
    note: "This adds traffic context to commerce and campaign signals."
  },
  klaviyo: {
    label: "Klaviyo",
    accountLabel: "Lifecycle workspace",
    coverage: "Retention, lifecycle performance, and owned audience behavior.",
    note: "This is the retention layer for CRM and repeat-purchase visibility."
  }
};

const allowedRoles: WorkspaceRole[] = [
  "owner",
  "founder",
  "growth_marketer",
  "content_lead",
  "ecommerce_manager",
  "operator"
];

function formatTimestampLabel(timestamp?: string | null) {
  if (!timestamp) {
    return "Not yet synced";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function buildNow() {
  return new Date().toISOString();
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);
}

function readOptionalList(value: unknown) {
  return Array.isArray(value) ? normalizeList(value) : null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeShopDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function prettifyFromEmail(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isWorkspaceRole(value: string): value is WorkspaceRole {
  return allowedRoles.includes(value as WorkspaceRole);
}

function looksLikeUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function safeGetBrandMemoryProfile(brandId: string) {
  try {
    return getBrandMemoryProfile(brandId);
  } catch {
    return null;
  }
}

function safeListTeamMembers(brandId: string) {
  try {
    return listSettingsTeamMembers(brandId);
  } catch {
    return [];
  }
}

function safeListAutomationPolicies(brandId: string) {
  try {
    return listAutomationPolicies(brandId);
  } catch {
    return [];
  }
}

function safeGetAutomationSettings(brandId: string) {
  try {
    return getAutomationSettings(brandId);
  } catch {
    return {
      approvalMode: "always_review",
      autoPublishMode: "never",
      alertSensitivity: "normal",
      weeklyBriefCadence: "monday_am",
      updatedAt: buildNow(),
      updatedAtLabel: formatTimestampLabel(buildNow())
    } satisfies AutomationSettingsView;
  }
}

function safeListIntegrationViews(brandId: string) {
  try {
    return listIntegrationViews(brandId);
  } catch {
    return [];
  }
}

function safeListStores(brandId: string) {
  try {
    return listCommerceStores(brandId);
  } catch {
    return [];
  }
}

function safeListSyncRuns(brandId: string, provider: string) {
  try {
    return listProviderSyncRuns(brandId, provider);
  } catch {
    return [];
  }
}

function buildDefaultBrandMemoryView(brandId: string, brandName?: string): BrandMemoryView {
  const resolvedBrandName = brandName ?? getWorkspaceBrand(brandId)?.name ?? "Brand Workspace";
  const updatedAt = buildNow();

  return {
    brandName: resolvedBrandName,
    positioning: `${resolvedBrandName} still needs a sharper positioning layer in the live brand profile.`,
    targetCustomer: "Define the buyer this workspace should prioritize first.",
    tone: "Calm, clear, trustworthy.",
    heroProducts: ["Hero product"],
    doSay: ["real proof", "clear value"],
    dontSay: ["generic hype", "category cliches"],
    customerPersonas: ["Primary buyer"],
    updatedAt,
    updatedAtLabel: formatTimestampLabel(updatedAt)
  };
}

function buildTeamMemberView(row: BrandUserRow): TeamMemberView {
  const normalizedEmail = normalizeEmail(row.email);
  const role = isWorkspaceRole(row.role) ? row.role : "operator";

  return {
    id: row.id,
    name: row.full_name?.trim() || prettifyFromEmail(normalizedEmail),
    email: normalizedEmail,
    title:
      row.job_title?.trim() ||
      row.role.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    role,
    roleLabel: formatWorkspaceRole(role),
    status: row.status,
    statusLabel: row.status.replaceAll("_", " "),
    updatedAt: row.updated_at,
    invitedAt: row.created_at,
    lastNotifiedAt: row.updated_at
  };
}

function buildAutomationView(row: AutomationPolicyRow): AutomationView {
  const config = row.config_json ?? {};

  return {
    id: row.id,
    name: row.name,
    policyType: row.policy_type,
    scope: String(config.scope ?? ""),
    summary: String(config.summary ?? ""),
    triggerLabel: String(config.triggerLabel ?? ""),
    status: row.status,
    updatedAt: row.updated_at,
    lastRunAt: typeof config.lastRunAt === "string" ? config.lastRunAt : undefined,
    nextRunAt: typeof config.nextRunAt === "string" ? config.nextRunAt : undefined,
    lastRunLabel:
      typeof config.lastRunAt === "string" ? formatTimestampLabel(config.lastRunAt) : undefined,
    nextRunLabel:
      typeof config.nextRunAt === "string" ? formatTimestampLabel(config.nextRunAt) : undefined
  };
}

function buildAutomationSettingsView(
  config: Record<string, unknown> | null,
  updatedAt: string
): AutomationSettingsView {
  return {
    approvalMode:
      config?.approvalMode === "confidence_based" ? "confidence_based" : "always_review",
    autoPublishMode:
      config?.autoPublishMode === "approved_only" ? "approved_only" : "never",
    alertSensitivity: config?.alertSensitivity === "high" ? "high" : "normal",
    weeklyBriefCadence:
      config?.weeklyBriefCadence === "friday_pm" ? "friday_pm" : "monday_am",
    updatedAt,
    updatedAtLabel: formatTimestampLabel(updatedAt)
  };
}

function buildStoreView(row: StoreRow): CommerceStoreView {
  return {
    id: row.id,
    platform: row.platform,
    shopDomain: row.shop_domain,
    currency: row.currency,
    status: row.status,
    connectedAt: row.connected_at ?? undefined,
    updatedAt: row.updated_at,
    platformLabel:
      row.platform === "shopify"
        ? "Shopify"
        : row.platform.charAt(0).toUpperCase() + row.platform.slice(1),
    statusLabel: row.status.replaceAll("_", " "),
    connectedAtLabel: row.connected_at ? formatTimestampLabel(row.connected_at) : undefined,
    updatedAtLabel: formatTimestampLabel(row.updated_at)
  };
}

function buildSyncRunView(row: SyncRunRow): CommerceSyncRunView {
  const updatedAt = row.finished_at ?? row.started_at ?? row.created_at;
  const metadata = row.metadata_json ?? {};
  const source =
    typeof metadata.source === "string" &&
    (metadata.source === "live" ||
      metadata.source === "seeded" ||
      metadata.source === "simulated")
      ? metadata.source
      : undefined;
  const fallbackReason =
    typeof metadata.fallbackReason === "string" &&
    (metadata.fallbackReason === "missing_config" ||
      metadata.fallbackReason === "request_failed")
      ? metadata.fallbackReason
      : undefined;

  return buildCommerceSyncRunView({
    id: row.id,
    provider: row.provider,
    status: row.status,
    startedAt: row.started_at ?? undefined,
    finishedAt: row.finished_at ?? undefined,
    recordsProcessed: row.records_processed ?? 0,
    errorMessage: row.error_message ?? undefined,
    triggerLabel: String(metadata.triggerLabel ?? "Sync run"),
    source,
    fallbackReason,
    updatedAt
  });
}

function mergeUniqueByKey<T>(
  items: T[],
  keyFn: (item: T) => string
) {
  const map = new Map<string, T>();

  for (const item of items) {
    map.set(keyFn(item), item);
  }

  return Array.from(map.values());
}

export const getSupabaseBrandRecord = cache(
  async (brandId: string): Promise<SupabaseBrandRecord | null> => {
    if (!canUseSupabaseAdmin()) {
      return null;
    }

    try {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase
        .from("brands")
        .select("id, slug, name")
        .eq("slug", brandId)
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data as SupabaseBrandRecord;
    } catch {
      return null;
    }
  }
);

async function listSupabaseIntegrationRows(brandId: string) {
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("integration_connections")
      .select("id, provider, status, account_label, metadata_json, last_synced_at, updated_at")
      .eq("brand_id", brand.id)
      .order("provider", { ascending: true });

    if (error) {
      return null;
    }

    return {
      brand,
      rows: (data ?? []) as IntegrationConnectionRow[]
    };
  } catch {
    return null;
  }
}

async function listSupabaseStoreRows(brandId: string) {
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("stores")
      .select("id, platform, shop_domain, currency, status, connected_at, updated_at")
      .eq("brand_id", brand.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return null;
    }

    return {
      brand,
      rows: (data ?? []) as StoreRow[]
    };
  } catch {
    return null;
  }
}

async function listSupabaseSyncRunRows(brandId: string, provider?: string) {
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    let query = supabase
      .from("sync_runs")
      .select(
        "id, provider, status, started_at, finished_at, records_processed, error_message, metadata_json, created_at"
      )
      .eq("brand_id", brand.id)
      .order("created_at", { ascending: false });

    if (provider) {
      query = query.eq("provider", provider);
    }

    const { data, error } = await query;

    if (error) {
      return null;
    }

    return {
      brand,
      rows: (data ?? []) as SyncRunRow[]
    };
  } catch {
    return null;
  }
}

async function getSupabaseBrandMemoryRows(brandId: string) {
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const [{ data: profile }, { data: voice }] = await Promise.all([
      supabase
        .from("brand_profiles")
        .select("positioning, target_customer, hero_products, goals_json, updated_at")
        .eq("brand_id", brand.id)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("brand_voice_profiles")
        .select("tone, do_say, dont_say, updated_at")
        .eq("brand_id", brand.id)
        .limit(1)
        .maybeSingle()
    ]);

    return {
      brand,
      profile: (profile as BrandProfileRow | null) ?? null,
      voice: (voice as BrandVoiceProfileRow | null) ?? null
    };
  } catch {
    return null;
  }
}

async function listSupabaseTeamRows(brandId: string) {
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("brand_users")
      .select("id, email, full_name, job_title, role, status, created_at, updated_at")
      .eq("brand_id", brand.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return null;
    }

    return {
      brand,
      rows: (data ?? []) as BrandUserRow[]
    };
  } catch {
    return null;
  }
}

async function listSupabaseAutomationRows(brandId: string) {
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("automation_policies")
      .select("id, name, policy_type, status, config_json, updated_at")
      .eq("brand_id", brand.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return null;
    }

    return {
      brand,
      rows: (data ?? []) as AutomationPolicyRow[]
    };
  } catch {
    return null;
  }
}

async function upsertSupabaseIntegration(
  brandId: string,
  integration: WorkspaceIntegration,
  accountLabel?: string
) {
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("integration_connections")
      .upsert(
        {
          brand_id: brand.id,
          provider: integration.provider,
          status: integration.status,
          account_label: accountLabel ?? null,
          last_synced_at: integration.lastSyncedAt,
          updated_at: buildNow()
        },
        {
          onConflict: "brand_id,provider"
        }
      )
      .select("provider, status, last_synced_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      provider: data.provider as string,
      status: data.status as WorkspaceIntegration["status"],
      lastSyncedAt: String(data.last_synced_at ?? integration.lastSyncedAt)
    } satisfies WorkspaceIntegration;
  } catch {
    return null;
  }
}

export async function listPlatformIntegrationViews(
  brandId: string
): Promise<WorkspaceIntegrationView[]> {
  const fallbackItems = safeListIntegrationViews(brandId);
  const supabaseState = await listSupabaseIntegrationRows(brandId);
  const providerIds = new Set<string>([
    ...Object.keys(providerMetadata),
    ...fallbackItems.map((item) => item.provider),
    ...(supabaseState?.rows.map((row) => row.provider) ?? [])
  ]);

  return Array.from(providerIds)
    .map((provider) => {
      const fallback = fallbackItems.find((item) => item.provider === provider);
      const row = supabaseState?.rows.find((item) => item.provider === provider);
      const meta = providerMetadata[provider] ?? {
        label: fallback?.label ?? provider,
        accountLabel: fallback?.accountLabel ?? "Configured provider",
        coverage: fallback?.coverage ?? "Operational data source",
        note: fallback?.note ?? "Provider state is available in the workspace."
      };
      const status = row?.status ?? fallback?.status ?? "pending";
      const lastSyncedAt =
        row?.last_synced_at ?? fallback?.lastSyncedAt ?? "";

      return {
        provider,
        label: meta.label,
        status,
        accountLabel: row?.account_label ?? fallback?.accountLabel ?? meta.accountLabel,
        coverage:
          typeof row?.metadata_json?.coverage === "string"
            ? row.metadata_json.coverage
            : fallback?.coverage ?? meta.coverage,
        note:
          typeof row?.metadata_json?.note === "string"
            ? row.metadata_json.note
            : fallback?.note ?? meta.note,
        lastSyncedAt,
        lastSyncedLabel: lastSyncedAt ? formatTimestampLabel(lastSyncedAt) : "Not yet synced",
        actionLabel:
          status === "connected"
            ? "Sync Now"
            : status === "degraded"
              ? "Reconnect"
              : "Connect"
      } satisfies WorkspaceIntegrationView;
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

export async function listPlatformCommerceStores(
  brandId: string
): Promise<CommerceStoreView[]> {
  const fallbackItems = safeListStores(brandId);
  const supabaseState = await listSupabaseStoreRows(brandId);
  const supabaseItems = (supabaseState?.rows ?? []).map(buildStoreView);

  return mergeUniqueByKey([...fallbackItems, ...supabaseItems], (store) =>
    `${store.platform}:${store.shopDomain.toLowerCase()}`
  ).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function getPlatformPrimaryShopifyStore(
  brandId: string
): Promise<CommerceStoreView | null> {
  return (
    (await listPlatformCommerceStores(brandId)).find((store) => store.platform === "shopify") ??
    getPrimaryShopifyStore(brandId) ??
    null
  );
}

export async function listPlatformProviderSyncRuns(
  brandId: string,
  provider: string
): Promise<CommerceSyncRunView[]> {
  const fallbackItems = safeListSyncRuns(brandId, provider);
  const supabaseState = await listSupabaseSyncRunRows(brandId, provider);
  const supabaseItems = (supabaseState?.rows ?? []).map(buildSyncRunView);

  return mergeUniqueByKey([...fallbackItems, ...supabaseItems], (run) =>
    `${run.id}:${run.provider}:${run.updatedAt}`
  ).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function recordPlatformSyncRun(
  brandId: string,
  run: RepositorySyncRunSeed
): Promise<CommerceSyncRunView> {
  const localRun = buildCommerceSyncRunView(run);
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return localRun;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("sync_runs")
      .upsert(
        {
          id: run.id,
          brand_id: brand.id,
          provider: run.provider,
          status: run.status,
          started_at: run.startedAt ?? null,
          finished_at: run.finishedAt ?? null,
          records_processed: run.recordsProcessed,
          error_message: run.errorMessage ?? null,
          metadata_json: {
            triggerLabel: run.triggerLabel,
            ...(run.source ? { source: run.source } : {}),
            ...(run.fallbackReason ? { fallbackReason: run.fallbackReason } : {})
          }
        },
        {
          onConflict: "id"
        }
      )
      .select(
        "id, provider, status, started_at, finished_at, records_processed, error_message, metadata_json, created_at"
      )
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return localRun;
    }

    await upsertSupabaseIntegration(brandId, {
      provider: run.provider,
      status:
        run.status === "failed" || run.fallbackReason === "request_failed"
          ? "degraded"
          : "connected",
      lastSyncedAt: run.finishedAt ?? run.updatedAt
    });

    return buildSyncRunView(data as SyncRunRow);
  } catch {
    return localRun;
  }
}

export async function savePlatformShopifyStoreConnection(
  brandId: string,
  input: {
    shopDomain: string;
    currency: string;
  }
): Promise<CommerceStoreView | null> {
  const localStore = saveShopifyStoreConnection(brandId, input);
  const brand = await getSupabaseBrandRecord(brandId);
  const normalizedDomain = normalizeShopDomain(input.shopDomain);

  if (!brand || !normalizedDomain) {
    return localStore;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const existingStore = await getPlatformPrimaryShopifyStore(brandId);
    const nextStoreId =
      existingStore && looksLikeUuid(existingStore.id) ? existingStore.id : randomUUID();
    const connectedAt = existingStore?.connectedAt ?? buildNow();
    const { data, error } = await supabase
      .from("stores")
      .upsert(
        {
          id: nextStoreId,
          brand_id: brand.id,
          platform: "shopify",
          shop_domain: normalizedDomain,
          currency: input.currency.trim().toUpperCase() || "USD",
          status: "connected",
          connected_at: connectedAt,
          updated_at: buildNow()
        },
        {
          onConflict: "id"
        }
      )
      .select("id, platform, shop_domain, currency, status, connected_at, updated_at")
      .limit(1)
      .maybeSingle();

    await upsertSupabaseIntegration(
      brandId,
      {
        provider: "shopify",
        status: "connected",
        lastSyncedAt: buildNow()
      },
      normalizedDomain
    );

    if (error || !data) {
      return localStore;
    }

    return buildStoreView(data as StoreRow);
  } catch {
    return localStore;
  }
}

export async function savePlatformIntegrationConnection(
  brandId: string,
  integration: WorkspaceIntegration,
  accountLabel?: string
) {
  const localSaved = getAppRepository().upsertIntegration(brandId, integration) ?? integration;
  const saved = await upsertSupabaseIntegration(brandId, integration, accountLabel);

  return (
    saved ?? {
      provider: localSaved.provider,
      status: localSaved.status,
      lastSyncedAt: localSaved.lastSyncedAt
    }
  );
}

export async function triggerPlatformProviderSync(
  brandId: string,
  provider: string,
  triggerLabel: string
): Promise<CommerceSyncRunView> {
  const localRun = triggerProviderSync(brandId, provider, triggerLabel);

  return recordPlatformSyncRun(brandId, {
    id: localRun.id,
    provider: localRun.provider,
    status: localRun.status,
    startedAt: localRun.startedAt,
    finishedAt: localRun.finishedAt,
    recordsProcessed: localRun.recordsProcessed,
    errorMessage: localRun.errorMessage,
    triggerLabel: localRun.triggerLabel,
    source: localRun.source,
    fallbackReason: localRun.fallbackReason,
    updatedAt: localRun.updatedAt
  });
}

export async function getPlatformBrandMemoryProfile(
  brandId: string
): Promise<BrandMemoryView> {
  const fallback = safeGetBrandMemoryProfile(brandId);
  const supabaseState = await getSupabaseBrandMemoryRows(brandId);

  if (!supabaseState) {
    return fallback ?? buildDefaultBrandMemoryView(brandId);
  }

  if (!supabaseState.profile && !supabaseState.voice) {
    return fallback ?? buildDefaultBrandMemoryView(brandId, supabaseState.brand.name);
  }

  const updatedAt = [
    supabaseState.profile?.updated_at,
    supabaseState.voice?.updated_at,
    fallback?.updatedAt
  ]
    .filter(Boolean)
    .sort()
    .at(-1) as string;

  return {
    brandName: supabaseState.brand.name,
    positioning:
      supabaseState.profile?.positioning?.trim() ||
      fallback?.positioning ||
      buildDefaultBrandMemoryView(brandId, supabaseState.brand.name).positioning,
    targetCustomer:
      supabaseState.profile?.target_customer?.trim() ||
      fallback?.targetCustomer ||
      "Define the buyer this workspace should prioritize first.",
    tone:
      supabaseState.voice?.tone?.trim() ||
      fallback?.tone ||
      "Calm, clear, trustworthy.",
    heroProducts:
      readOptionalList(supabaseState.profile?.hero_products) ||
      fallback?.heroProducts ||
      ["Hero product"],
    doSay:
      readOptionalList(supabaseState.voice?.do_say) ||
      fallback?.doSay ||
      ["real proof", "clear value"],
    dontSay:
      readOptionalList(supabaseState.voice?.dont_say) ||
      fallback?.dontSay ||
      ["generic hype", "category cliches"],
    customerPersonas:
      readOptionalList(supabaseState.profile?.goals_json?.customerPersonas) ||
      fallback?.customerPersonas ||
      ["Primary buyer"],
    updatedAt,
    updatedAtLabel: formatTimestampLabel(updatedAt)
  };
}

export async function savePlatformBrandMemoryProfile(
  brandId: string,
  input: BrandMemoryInput
): Promise<BrandMemoryView> {
  const localResult = saveBrandMemoryProfile(brandId, input);
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return localResult;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const updatedAt = buildNow();

    await Promise.all([
      supabase.from("brand_profiles").upsert(
        {
          brand_id: brand.id,
          positioning: input.positioning,
          target_customer: input.targetCustomer,
          hero_products: input.heroProducts,
          goals_json: {
            customerPersonas: input.customerPersonas
          },
          updated_at: updatedAt
        },
        {
          onConflict: "brand_id"
        }
      ),
      supabase.from("brand_voice_profiles").upsert(
        {
          brand_id: brand.id,
          tone: input.tone,
          do_say: input.doSay,
          dont_say: input.dontSay,
          updated_at: updatedAt
        },
        {
          onConflict: "brand_id"
        }
      )
    ]);

    return {
      brandName: brand.name,
      positioning: input.positioning,
      targetCustomer: input.targetCustomer,
      tone: input.tone,
      heroProducts: input.heroProducts,
      doSay: input.doSay,
      dontSay: input.dontSay,
      customerPersonas: input.customerPersonas,
      updatedAt,
      updatedAtLabel: formatTimestampLabel(updatedAt)
    };
  } catch {
    return localResult;
  }
}

export async function listPlatformTeamMembers(
  brandId: string
): Promise<TeamMemberView[]> {
  const fallbackItems = safeListTeamMembers(brandId);
  const supabaseState = await listSupabaseTeamRows(brandId);

  if (!supabaseState) {
    return fallbackItems;
  }

  const merged = new Map<string, TeamMemberView>();

  for (const item of fallbackItems) {
    merged.set(item.email.toLowerCase(), item);
  }

  for (const row of supabaseState.rows) {
    const view = buildTeamMemberView(row);
    merged.set(view.email.toLowerCase(), view);
  }

  return Array.from(merged.values()).sort((left, right) => {
    if (left.status !== right.status) {
      return left.status.localeCompare(right.status);
    }

    return left.name.localeCompare(right.name);
  });
}

export async function invitePlatformTeamMember(
  brandId: string,
  input: InviteTeamMemberInput
): Promise<TeamMemberView> {
  const localResult = inviteTeamMember(brandId, input);
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return localResult;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const now = buildNow();
    const { data, error } = await supabase
      .from("brand_users")
      .upsert(
        {
          id: looksLikeUuid(localResult.id) ? localResult.id : randomUUID(),
          brand_id: brand.id,
          email: normalizeEmail(localResult.email),
          full_name: localResult.name,
          job_title: localResult.title,
          role: localResult.role,
          status: "invited",
          created_at: localResult.invitedAt ?? now,
          updated_at: now
        },
        {
          onConflict: "brand_id,email"
        }
      )
      .select("id, email, full_name, job_title, role, status, created_at, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return localResult;
    }

    return buildTeamMemberView(data as BrandUserRow);
  } catch {
    return localResult;
  }
}

export async function changePlatformTeamMemberRole(
  brandId: string,
  memberId: string,
  role: WorkspaceRole
): Promise<TeamMemberView | null> {
  const localResult = changeTeamMemberRole(brandId, memberId, role);
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand || !localResult) {
    return localResult;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("brand_users")
      .upsert(
        {
          id: looksLikeUuid(localResult.id) ? localResult.id : undefined,
          brand_id: brand.id,
          email: normalizeEmail(localResult.email),
          full_name: localResult.name,
          job_title: localResult.title,
          role,
          status: localResult.status,
          created_at: localResult.invitedAt ?? localResult.updatedAt,
          updated_at: buildNow()
        },
        {
          onConflict: "brand_id,email"
        }
      )
      .select("id, email, full_name, job_title, role, status, created_at, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return localResult;
    }

    return buildTeamMemberView(data as BrandUserRow);
  } catch {
    return localResult;
  }
}

export async function resendPlatformTeamInvite(
  brandId: string,
  memberId: string
): Promise<TeamMemberView | null> {
  const localResult = resendTeamInvite(brandId, memberId);
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand || !localResult) {
    return localResult;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("brand_users")
      .upsert(
        {
          id: looksLikeUuid(localResult.id) ? localResult.id : undefined,
          brand_id: brand.id,
          email: normalizeEmail(localResult.email),
          full_name: localResult.name,
          job_title: localResult.title,
          role: localResult.role,
          status: "invited",
          created_at: localResult.invitedAt ?? localResult.updatedAt,
          updated_at: buildNow()
        },
        {
          onConflict: "brand_id,email"
        }
      )
      .select("id, email, full_name, job_title, role, status, created_at, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return localResult;
    }

    return buildTeamMemberView(data as BrandUserRow);
  } catch {
    return localResult;
  }
}

export async function removePlatformTeamMember(
  brandId: string,
  memberId: string
): Promise<TeamMemberView | null> {
  const localResult = removeTeamMember(brandId, memberId);
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand || !localResult) {
    return localResult;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("brand_users")
      .upsert(
        {
          id: looksLikeUuid(localResult.id) ? localResult.id : undefined,
          brand_id: brand.id,
          email: normalizeEmail(localResult.email),
          full_name: localResult.name,
          job_title: localResult.title,
          role: localResult.role,
          status: "removed",
          created_at: localResult.invitedAt ?? localResult.updatedAt,
          updated_at: buildNow()
        },
        {
          onConflict: "brand_id,email"
        }
      )
      .select("id, email, full_name, job_title, role, status, created_at, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return localResult;
    }

    return buildTeamMemberView(data as BrandUserRow);
  } catch {
    return localResult;
  }
}

export async function listPlatformAutomationPolicies(
  brandId: string
): Promise<AutomationView[]> {
  const fallbackItems = safeListAutomationPolicies(brandId);
  const supabaseState = await listSupabaseAutomationRows(brandId);

  if (!supabaseState) {
    return fallbackItems;
  }

  const merged = new Map<string, AutomationView>();

  for (const item of fallbackItems) {
    merged.set(`${item.policyType}:${item.name}`, item);
  }

  for (const row of supabaseState.rows) {
    if (row.policy_type === "workspace_controls") {
      continue;
    }

    const view = buildAutomationView(row);
    merged.set(`${view.policyType}:${view.name}`, view);
  }

  return Array.from(merged.values()).sort((left, right) => left.name.localeCompare(right.name));
}

export async function createPlatformAutomationPolicy(
  brandId: string,
  input: EditAutomationInput & { policyType: string }
): Promise<AutomationView> {
  const localResult = createAutomationPolicy(brandId, input);
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return localResult;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("automation_policies")
      .upsert(
        {
          id: looksLikeUuid(localResult.id) ? localResult.id : randomUUID(),
          brand_id: brand.id,
          name: localResult.name,
          policy_type: localResult.policyType,
          status: localResult.status,
          config_json: {
            scope: localResult.scope,
            summary: localResult.summary,
            triggerLabel: localResult.triggerLabel,
            lastRunAt: localResult.lastRunAt ?? null,
            nextRunAt: localResult.nextRunAt ?? null
          },
          updated_at: buildNow()
        },
        {
          onConflict: "id"
        }
      )
      .select("id, name, policy_type, status, config_json, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return localResult;
    }

    return buildAutomationView(data as AutomationPolicyRow);
  } catch {
    return localResult;
  }
}

export async function editPlatformAutomationPolicy(
  brandId: string,
  automationId: string,
  input: EditAutomationInput
): Promise<AutomationView | null> {
  const localResult = editAutomationPolicy(brandId, automationId, input);
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand || !localResult) {
    return localResult;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("automation_policies")
      .upsert(
        {
          id: looksLikeUuid(localResult.id) ? localResult.id : randomUUID(),
          brand_id: brand.id,
          name: localResult.name,
          policy_type: localResult.policyType,
          status: localResult.status,
          config_json: {
            scope: localResult.scope,
            summary: localResult.summary,
            triggerLabel: localResult.triggerLabel,
            lastRunAt: localResult.lastRunAt ?? null,
            nextRunAt: localResult.nextRunAt ?? null
          },
          updated_at: buildNow()
        },
        {
          onConflict: "id"
        }
      )
      .select("id, name, policy_type, status, config_json, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return localResult;
    }

    return buildAutomationView(data as AutomationPolicyRow);
  } catch {
    return localResult;
  }
}

export async function togglePlatformAutomationPolicy(
  brandId: string,
  automationId: string
): Promise<AutomationView | null> {
  const localResult = toggleAutomationPolicy(brandId, automationId);
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand || !localResult) {
    return localResult;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("automation_policies")
      .upsert(
        {
          id: looksLikeUuid(localResult.id) ? localResult.id : randomUUID(),
          brand_id: brand.id,
          name: localResult.name,
          policy_type: localResult.policyType,
          status: localResult.status,
          config_json: {
            scope: localResult.scope,
            summary: localResult.summary,
            triggerLabel: localResult.triggerLabel,
            lastRunAt: localResult.lastRunAt ?? null,
            nextRunAt: localResult.nextRunAt ?? null
          },
          updated_at: buildNow()
        },
        {
          onConflict: "id"
        }
      )
      .select("id, name, policy_type, status, config_json, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return localResult;
    }

    return buildAutomationView(data as AutomationPolicyRow);
  } catch {
    return localResult;
  }
}

export async function getPlatformAutomationSettings(
  brandId: string
): Promise<AutomationSettingsView> {
  const fallback = safeGetAutomationSettings(brandId);
  const supabaseState = await listSupabaseAutomationRows(brandId);

  if (!supabaseState) {
    return fallback;
  }

  const settingsRow = supabaseState.rows.find((row) => row.policy_type === "workspace_controls");

  if (!settingsRow) {
    return fallback;
  }

  return buildAutomationSettingsView(settingsRow.config_json, settingsRow.updated_at);
}

export async function savePlatformAutomationSettings(
  brandId: string,
  input: Omit<RepositoryAutomationSettingsSeed, "updatedAt">
): Promise<AutomationSettingsView> {
  const localResult = saveAutomationSettings(brandId, input);
  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return localResult;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const existingRows = await listSupabaseAutomationRows(brandId);
    const existingControls = existingRows?.rows.find(
      (row) => row.policy_type === "workspace_controls"
    );
    const { data, error } = await supabase
      .from("automation_policies")
      .upsert(
        {
          id: existingControls?.id ?? randomUUID(),
          brand_id: brand.id,
          name: "Workspace Controls",
          policy_type: "workspace_controls",
          status: "active",
          config_json: {
            approvalMode: input.approvalMode,
            autoPublishMode: input.autoPublishMode,
            alertSensitivity: input.alertSensitivity,
            weeklyBriefCadence: input.weeklyBriefCadence
          },
          updated_at: buildNow()
        },
        {
          onConflict: "id"
        }
      )
      .select("config_json, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return localResult;
    }

    return buildAutomationSettingsView(
      (data.config_json as Record<string, unknown> | null) ?? null,
      data.updated_at as string
    );
  } catch {
    return localResult;
  }
}

export function listLocalWorkspaceMembersForBrand(brandId: string) {
  return getWorkspaceMembers(brandId);
}
