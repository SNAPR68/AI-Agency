import "server-only";

import { randomUUID } from "node:crypto";
import {
  getAppRepository,
  type RepositoryStoreSeed,
  type RepositorySyncRunFallbackReason,
  type RepositorySyncRunSeed
} from "./app-repository";

export type CommerceStoreView = RepositoryStoreSeed & {
  platformLabel: string;
  statusLabel: string;
  connectedAtLabel?: string;
  updatedAtLabel: string;
};

export type CommerceSyncRunView = RepositorySyncRunSeed & {
  startedAtLabel?: string;
  finishedAtLabel?: string;
  updatedAtLabel: string;
  sourceLabel: string;
  sourceDescription: string;
  sourceTone: "positive" | "warning" | "info";
};

type SaveStoreInput = {
  shopDomain: string;
  currency: string;
};

function formatTimestampLabel(timestamp?: string) {
  if (!timestamp) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function normalizeShopDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

function formatPlatformLabel(platform: string) {
  if (platform === "shopify") {
    return "Shopify";
  }

  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

function formatStoreStatus(status: RepositoryStoreSeed["status"]) {
  return status.replaceAll("_", " ");
}

function normalizeSyncRunSource(source: RepositorySyncRunSeed["source"]) {
  return source === "live" || source === "seeded" || source === "simulated"
    ? source
    : undefined;
}

function normalizeFallbackReason(
  fallbackReason: RepositorySyncRunSeed["fallbackReason"]
) {
  return fallbackReason === "missing_config" || fallbackReason === "request_failed"
    ? fallbackReason
    : undefined;
}

function getSyncRunSourceMeta(
  source: ReturnType<typeof normalizeSyncRunSource>,
  fallbackReason: ReturnType<typeof normalizeFallbackReason>
) {
  if (source === "live") {
    return {
      label: "Live API",
      description: "Pulled directly from the connected Shopify Admin API.",
      tone: "positive" as const
    };
  }

  if (source === "seeded") {
    const fallbackDescriptions: Record<
      RepositorySyncRunFallbackReason,
      string
    > = {
      missing_config:
        "Used the seeded commerce snapshot because live Shopify credentials are not configured yet.",
      request_failed:
        "Used the seeded commerce snapshot because the live Shopify request failed."
    };

    return {
      label: "Seeded fallback",
      description:
        fallbackReason
          ? fallbackDescriptions[fallbackReason]
          : "Used the seeded commerce snapshot for this sync run.",
      tone: "warning" as const
    };
  }

  if (source === "simulated") {
    return {
      label: "Simulated",
      description: "This sync ran in simulated mode for the current environment.",
      tone: "info" as const
    };
  }

  return {
    label: "Source unknown",
    description: "This run predates source tracking, so execution mode was not recorded.",
    tone: "info" as const
  };
}

export function buildCommerceSyncRunView(
  run: RepositorySyncRunSeed
): CommerceSyncRunView {
  const source = normalizeSyncRunSource(run.source);
  const fallbackReason = normalizeFallbackReason(run.fallbackReason);
  const sourceMeta = getSyncRunSourceMeta(source, fallbackReason);

  return {
    ...run,
    source,
    fallbackReason,
    startedAtLabel: formatTimestampLabel(run.startedAt),
    finishedAtLabel: formatTimestampLabel(run.finishedAt),
    updatedAtLabel: formatTimestampLabel(run.updatedAt) ?? "Unknown",
    sourceLabel: sourceMeta.label,
    sourceDescription: sourceMeta.description,
    sourceTone: sourceMeta.tone
  };
}

export function listCommerceStores(brandId: string): CommerceStoreView[] {
  return getAppRepository()
    .listStores(brandId)
    .map((store) => ({
      ...store,
      platformLabel: formatPlatformLabel(store.platform),
      statusLabel: formatStoreStatus(store.status),
      connectedAtLabel: formatTimestampLabel(store.connectedAt),
      updatedAtLabel: formatTimestampLabel(store.updatedAt) ?? "Unknown"
    }));
}

export function getPrimaryShopifyStore(brandId: string): CommerceStoreView | null {
  return listCommerceStores(brandId).find((store) => store.platform === "shopify") ?? null;
}

export function saveShopifyStoreConnection(
  brandId: string,
  input: SaveStoreInput
): CommerceStoreView | null {
  const existing = getPrimaryShopifyStore(brandId);
  const now = new Date().toISOString();
  const normalizedDomain = normalizeShopDomain(input.shopDomain);

  if (!normalizedDomain) {
    return null;
  }

  const next: RepositoryStoreSeed = {
    id: existing?.id ?? randomUUID(),
    platform: "shopify",
    shopDomain: normalizedDomain,
    currency: input.currency.trim().toUpperCase() || "USD",
    status: "connected",
    connectedAt: existing?.connectedAt ?? now,
    updatedAt: now
  };

  const saved = getAppRepository().upsertStore(brandId, next) ?? next;

  return {
    ...saved,
    platformLabel: formatPlatformLabel(saved.platform),
    statusLabel: formatStoreStatus(saved.status),
    connectedAtLabel: formatTimestampLabel(saved.connectedAt),
    updatedAtLabel: formatTimestampLabel(saved.updatedAt) ?? "Unknown"
  };
}

export function listProviderSyncRuns(
  brandId: string,
  provider: string
): CommerceSyncRunView[] {
  return getAppRepository().listSyncRuns(brandId, provider).map(buildCommerceSyncRunView);
}

export function triggerProviderSync(
  brandId: string,
  provider: string,
  triggerLabel: string
): CommerceSyncRunView {
  const now = new Date().toISOString();
  const recordsProcessed = provider === "shopify" ? 512 : 124;
  const run: RepositorySyncRunSeed = {
    id: randomUUID(),
    provider,
    status: "success",
    startedAt: now,
    finishedAt: now,
    recordsProcessed,
    triggerLabel,
    source: "simulated",
    updatedAt: now
  };

  const saved = getAppRepository().appendSyncRun(brandId, run) ?? run;
  const view = buildCommerceSyncRunView(saved);

  getAppRepository().upsertIntegration(brandId, {
    provider,
    status: "connected",
    lastSyncedAt: view.finishedAt ?? view.updatedAt
  });

  return view;
}
