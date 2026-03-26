import "server-only";

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import type { WorkspaceRole } from "./workspace";

export type PersistedIntegrationOverride = {
  status: "connected" | "degraded" | "pending";
  lastSyncedAt: string;
};

export type PersistedStore = {
  id: string;
  platform: string;
  shopDomain: string;
  currency: string;
  status: "pending" | "connected" | "degraded";
  connectedAt?: string;
  updatedAt: string;
};

type PersistedSyncRunSource = "live" | "seeded" | "simulated";

type PersistedSyncRunFallbackReason =
  | "missing_config"
  | "request_failed";

export type PersistedSyncRun = {
  id: string;
  provider: string;
  status: "queued" | "running" | "success" | "failed";
  startedAt?: string;
  finishedAt?: string;
  recordsProcessed: number;
  errorMessage?: string;
  triggerLabel: string;
  source?: PersistedSyncRunSource | null;
  fallbackReason?: PersistedSyncRunFallbackReason | null;
  updatedAt: string;
};

export type PersistedCatalogProduct = {
  id: string;
  title: string;
  collection: string;
  status: "rising" | "watch" | "stable";
  revenueShare: string;
  revenueDelta: string;
  conversionRate: string;
  conversionDelta: string;
  marginBand: string;
  inventoryNote: string;
  summary: string;
  heroMessage: string;
  watchout: string;
  recommendedFormats: string[];
};

export type PersistedStoreMetric = {
  metricDate: string;
  revenue: number;
  ordersCount: number;
  aov: number;
  sessions: number;
  conversionRate: number;
  repeatPurchaseRate: number;
  returningCustomerRevenue: number;
};

export type PersistedInboxOverride = {
  state: "needs_review" | "open" | "scheduled" | "resolved";
  updatedAt: string;
};

export type PersistedOpportunityOverride = {
  status: "open" | "accepted" | "dismissed";
  updatedAt: string;
  linkedDraftId?: string;
};

export type PersistedDraft = {
  id: string;
  title: string;
  channel: string;
  angle: string;
  status:
    | "draft"
    | "ready_for_approval"
    | "changes_requested"
    | "approved"
    | "scheduled"
    | "published"
    | "rejected";
  sourceOpportunityId?: string;
  sourceProductId?: string;
  productId?: string;
  productTitle?: string;
  hook: string;
  caption: string;
  script: string;
  createdAt: string;
  updatedAt: string;
};

export type PersistedPublishJob = {
  id: string;
  draftId: string;
  draftTitle: string;
  channel: string;
  status: "scheduled" | "published" | "failed" | "cancelled";
  scheduledFor: string;
  updatedAt: string;
  publishedAt?: string;
  failureReason?: string;
};

export type PersistedTrendOverride = {
  state: "new" | "saved" | "acted";
  updatedAt: string;
  linkedDraftId?: string;
};

export type PersistedCompetitorOverride = {
  state: "new" | "saved" | "acted";
  updatedAt: string;
  linkedDraftId?: string;
};

export type PersistedRetentionOverride = {
  state: "new" | "flagged" | "planned" | "acted";
  updatedAt: string;
  linkedDraftId?: string;
};

export type PersistedCxOverride = {
  state: "open" | "assigned" | "resolved";
  updatedAt: string;
  linkedDraftId?: string;
};

export type PersistedSupportOverride = {
  state: "open" | "assigned" | "escalated" | "resolved";
  updatedAt: string;
  linkedDraftId?: string;
};

export type PersistedChannelOverride = {
  state: "tracking" | "investigating";
  updatedAt: string;
};

export type PersistedCampaignOverride = {
  state: "new" | "flagged" | "draft_linked";
  updatedAt: string;
  linkedDraftId?: string;
};

export type PersistedBrandMemory = {
  positioning: string;
  targetCustomer: string;
  tone: string;
  heroProducts: string[];
  doSay: string[];
  dontSay: string[];
  customerPersonas: string[];
  updatedAt: string;
};

export type PersistedTeamMember = {
  id: string;
  name: string;
  email: string;
  title: string;
  role: WorkspaceRole;
  status: "active" | "invited" | "removed";
  updatedAt: string;
  invitedAt?: string;
  lastNotifiedAt?: string;
};

export type PersistedAutomation = {
  id: string;
  name: string;
  policyType: string;
  scope: string;
  summary: string;
  triggerLabel: string;
  status: "active" | "paused";
  updatedAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
};

export type PersistedAutomationSettings = {
  approvalMode: "always_review" | "confidence_based";
  autoPublishMode: "never" | "approved_only";
  alertSensitivity: "normal" | "high";
  weeklyBriefCadence: "monday_am" | "friday_pm";
  updatedAt: string;
};

type LocalPersistenceState = {
  version: number;
  integrations: Record<string, Record<string, PersistedIntegrationOverride>>;
  stores: Record<string, Record<string, PersistedStore>>;
  syncRuns: Record<string, Record<string, PersistedSyncRun>>;
  catalogProducts: Record<string, Record<string, PersistedCatalogProduct>>;
  storeMetrics: Record<string, Record<string, PersistedStoreMetric>>;
  inbox: Record<string, Record<string, PersistedInboxOverride>>;
  opportunities: Record<string, Record<string, PersistedOpportunityOverride>>;
  drafts: Record<string, Record<string, PersistedDraft>>;
  publishJobs: Record<string, Record<string, PersistedPublishJob>>;
  trends: Record<string, Record<string, PersistedTrendOverride>>;
  competitors: Record<string, Record<string, PersistedCompetitorOverride>>;
  retention: Record<string, Record<string, PersistedRetentionOverride>>;
  cx: Record<string, Record<string, PersistedCxOverride>>;
  support: Record<string, Record<string, PersistedSupportOverride>>;
  channels: Record<string, Record<string, PersistedChannelOverride>>;
  campaigns: Record<string, Record<string, PersistedCampaignOverride>>;
  brandMemory: Record<string, PersistedBrandMemory>;
  team: Record<string, Record<string, PersistedTeamMember>>;
  automations: Record<string, Record<string, PersistedAutomation>>;
  automationSettings: Record<string, PersistedAutomationSettings>;
};

const defaultState: LocalPersistenceState = {
  version: 1,
  integrations: {},
  stores: {},
  syncRuns: {},
  catalogProducts: {},
  storeMetrics: {},
  inbox: {},
  opportunities: {},
  drafts: {},
  publishJobs: {},
  trends: {},
  competitors: {},
  retention: {},
  cx: {},
  support: {},
  channels: {},
  campaigns: {},
  brandMemory: {},
  team: {},
  automations: {},
  automationSettings: {}
};

function getPersistenceFilePath() {
  const workspaceRootCandidate = path.resolve(
    process.cwd(),
    "..",
    "..",
    "packages",
    "database",
    "dev-data",
    "agency-local-state.json"
  );

  if (existsSync(workspaceRootCandidate)) {
    return workspaceRootCandidate;
  }

  return path.resolve(
    process.cwd(),
    "packages",
    "database",
    "dev-data",
    "agency-local-state.json"
  );
}

function ensurePersistenceFile() {
  const filePath = getPersistenceFilePath();
  const directory = path.dirname(filePath);

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  if (!existsSync(filePath)) {
    writeFileSync(filePath, JSON.stringify(defaultState, null, 2), "utf8");
  }

  return filePath;
}

function readPersistenceState(): LocalPersistenceState {
  const filePath = ensurePersistenceFile();

  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalPersistenceState>;

    return {
      version: typeof parsed.version === "number" ? parsed.version : 1,
      integrations: parsed.integrations ?? {},
      stores: parsed.stores ?? {},
      syncRuns: parsed.syncRuns ?? {},
      catalogProducts: parsed.catalogProducts ?? {},
      storeMetrics: parsed.storeMetrics ?? {},
      inbox: parsed.inbox ?? {},
      opportunities: parsed.opportunities ?? {},
      drafts: parsed.drafts ?? {},
      publishJobs: parsed.publishJobs ?? {},
      trends: parsed.trends ?? {},
      competitors: parsed.competitors ?? {},
      retention: parsed.retention ?? {},
      cx: parsed.cx ?? {},
      support: parsed.support ?? {},
      channels: parsed.channels ?? {},
      campaigns: parsed.campaigns ?? {},
      brandMemory: parsed.brandMemory ?? {},
      team: parsed.team ?? {},
      automations: parsed.automations ?? {},
      automationSettings: parsed.automationSettings ?? {}
    };
  } catch {
    writePersistenceState(defaultState);
    return defaultState;
  }
}

function writePersistenceState(state: LocalPersistenceState) {
  const filePath = ensurePersistenceFile();
  writeFileSync(filePath, JSON.stringify(state, null, 2), "utf8");
}

export function getIntegrationOverride(
  brandId: string,
  provider: string
): PersistedIntegrationOverride | null {
  return readPersistenceState().integrations[brandId]?.[provider] ?? null;
}

export function updateIntegrationOverride(
  brandId: string,
  provider: string,
  override: PersistedIntegrationOverride
) {
  const state = readPersistenceState();

  state.integrations[brandId] ??= {};
  state.integrations[brandId][provider] = override;

  writePersistenceState(state);
}

export function listPersistedStores(brandId: string): PersistedStore[] {
  return Object.values(readPersistenceState().stores[brandId] ?? {}).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

export function upsertPersistedStore(brandId: string, store: PersistedStore) {
  const state = readPersistenceState();

  state.stores[brandId] ??= {};
  state.stores[brandId][store.id] = store;

  writePersistenceState(state);
}

export function listPersistedSyncRuns(brandId: string): PersistedSyncRun[] {
  return Object.values(readPersistenceState().syncRuns[brandId] ?? {}).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

export function upsertPersistedSyncRun(brandId: string, run: PersistedSyncRun) {
  const state = readPersistenceState();

  state.syncRuns[brandId] ??= {};
  state.syncRuns[brandId][run.id] = run;

  writePersistenceState(state);
}

export function listPersistedCatalogProducts(
  brandId: string
): PersistedCatalogProduct[] {
  return Object.values(readPersistenceState().catalogProducts[brandId] ?? {}).sort((left, right) =>
    left.title.localeCompare(right.title)
  );
}

export function replacePersistedCatalogProducts(
  brandId: string,
  products: PersistedCatalogProduct[]
) {
  const state = readPersistenceState();

  state.catalogProducts[brandId] = Object.fromEntries(
    products.map((product) => [product.id, product] as const)
  );

  writePersistenceState(state);
}

export function listPersistedStoreMetrics(brandId: string): PersistedStoreMetric[] {
  return Object.values(readPersistenceState().storeMetrics[brandId] ?? {}).sort((left, right) =>
    right.metricDate.localeCompare(left.metricDate)
  );
}

export function replacePersistedStoreMetrics(
  brandId: string,
  metrics: PersistedStoreMetric[]
) {
  const state = readPersistenceState();

  state.storeMetrics[brandId] = Object.fromEntries(
    metrics.map((metric) => [metric.metricDate, metric] as const)
  );

  writePersistenceState(state);
}

export function getInboxOverride(
  brandId: string,
  itemId: string
): PersistedInboxOverride | null {
  return readPersistenceState().inbox[brandId]?.[itemId] ?? null;
}

export function getOpportunityOverride(
  brandId: string,
  opportunityId: string
): PersistedOpportunityOverride | null {
  return readPersistenceState().opportunities[brandId]?.[opportunityId] ?? null;
}

export function updateOpportunityOverride(
  brandId: string,
  opportunityId: string,
  override: PersistedOpportunityOverride
) {
  const state = readPersistenceState();

  state.opportunities[brandId] ??= {};
  state.opportunities[brandId][opportunityId] = override;

  writePersistenceState(state);
}

export function listPersistedDrafts(brandId: string): PersistedDraft[] {
  return Object.values(readPersistenceState().drafts[brandId] ?? {}).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

export function getPersistedDraft(
  brandId: string,
  draftId: string
): PersistedDraft | null {
  return readPersistenceState().drafts[brandId]?.[draftId] ?? null;
}

export function upsertPersistedDraft(brandId: string, draft: PersistedDraft) {
  const state = readPersistenceState();

  state.drafts[brandId] ??= {};
  state.drafts[brandId][draft.id] = draft;

  writePersistenceState(state);
}

export function listPersistedPublishJobs(brandId: string): PersistedPublishJob[] {
  return Object.values(readPersistenceState().publishJobs[brandId] ?? {}).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
}

export function getPersistedPublishJob(
  brandId: string,
  jobId: string
): PersistedPublishJob | null {
  return readPersistenceState().publishJobs[brandId]?.[jobId] ?? null;
}

export function upsertPersistedPublishJob(
  brandId: string,
  job: PersistedPublishJob
) {
  const state = readPersistenceState();

  state.publishJobs[brandId] ??= {};
  state.publishJobs[brandId][job.id] = job;

  writePersistenceState(state);
}

export function getTrendOverride(
  brandId: string,
  trendId: string
): PersistedTrendOverride | null {
  return readPersistenceState().trends[brandId]?.[trendId] ?? null;
}

export function updateTrendOverride(
  brandId: string,
  trendId: string,
  override: PersistedTrendOverride
) {
  const state = readPersistenceState();

  state.trends[brandId] ??= {};
  state.trends[brandId][trendId] = override;

  writePersistenceState(state);
}

export function getCompetitorOverride(
  brandId: string,
  competitorId: string
): PersistedCompetitorOverride | null {
  return readPersistenceState().competitors[brandId]?.[competitorId] ?? null;
}

export function updateCompetitorOverride(
  brandId: string,
  competitorId: string,
  override: PersistedCompetitorOverride
) {
  const state = readPersistenceState();

  state.competitors[brandId] ??= {};
  state.competitors[brandId][competitorId] = override;

  writePersistenceState(state);
}

export function getRetentionOverride(
  brandId: string,
  itemId: string
): PersistedRetentionOverride | null {
  return readPersistenceState().retention[brandId]?.[itemId] ?? null;
}

export function updateRetentionOverride(
  brandId: string,
  itemId: string,
  override: PersistedRetentionOverride
) {
  const state = readPersistenceState();

  state.retention[brandId] ??= {};
  state.retention[brandId][itemId] = override;

  writePersistenceState(state);
}

export function getCxOverride(
  brandId: string,
  itemId: string
): PersistedCxOverride | null {
  return readPersistenceState().cx[brandId]?.[itemId] ?? null;
}

export function updateCxOverride(
  brandId: string,
  itemId: string,
  override: PersistedCxOverride
) {
  const state = readPersistenceState();

  state.cx[brandId] ??= {};
  state.cx[brandId][itemId] = override;

  writePersistenceState(state);
}

export function getSupportOverride(
  brandId: string,
  itemId: string
): PersistedSupportOverride | null {
  return readPersistenceState().support[brandId]?.[itemId] ?? null;
}

export function updateSupportOverride(
  brandId: string,
  itemId: string,
  override: PersistedSupportOverride
) {
  const state = readPersistenceState();

  state.support[brandId] ??= {};
  state.support[brandId][itemId] = override;

  writePersistenceState(state);
}

export function getChannelOverride(
  brandId: string,
  channelId: string
): PersistedChannelOverride | null {
  return readPersistenceState().channels[brandId]?.[channelId] ?? null;
}

export function updateChannelOverride(
  brandId: string,
  channelId: string,
  override: PersistedChannelOverride
) {
  const state = readPersistenceState();

  state.channels[brandId] ??= {};
  state.channels[brandId][channelId] = override;

  writePersistenceState(state);
}

export function getCampaignOverride(
  brandId: string,
  campaignId: string
): PersistedCampaignOverride | null {
  return readPersistenceState().campaigns[brandId]?.[campaignId] ?? null;
}

export function updateCampaignOverride(
  brandId: string,
  campaignId: string,
  override: PersistedCampaignOverride
) {
  const state = readPersistenceState();

  state.campaigns[brandId] ??= {};
  state.campaigns[brandId][campaignId] = override;

  writePersistenceState(state);
}

export function getBrandMemoryOverride(brandId: string): PersistedBrandMemory | null {
  return readPersistenceState().brandMemory[brandId] ?? null;
}

export function updateBrandMemoryOverride(
  brandId: string,
  brandMemory: PersistedBrandMemory
) {
  const state = readPersistenceState();

  state.brandMemory[brandId] = brandMemory;

  writePersistenceState(state);
}

export function listPersistedTeamMembers(brandId: string): PersistedTeamMember[] {
  return Object.values(readPersistenceState().team[brandId] ?? {}).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function getPersistedTeamMember(
  brandId: string,
  memberId: string
): PersistedTeamMember | null {
  return readPersistenceState().team[brandId]?.[memberId] ?? null;
}

export function upsertPersistedTeamMember(
  brandId: string,
  member: PersistedTeamMember
) {
  const state = readPersistenceState();

  state.team[brandId] ??= {};
  state.team[brandId][member.id] = member;

  writePersistenceState(state);
}

export function listPersistedAutomations(brandId: string): PersistedAutomation[] {
  return Object.values(readPersistenceState().automations[brandId] ?? {}).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

export function getPersistedAutomation(
  brandId: string,
  automationId: string
): PersistedAutomation | null {
  return readPersistenceState().automations[brandId]?.[automationId] ?? null;
}

export function upsertPersistedAutomation(
  brandId: string,
  automation: PersistedAutomation
) {
  const state = readPersistenceState();

  state.automations[brandId] ??= {};
  state.automations[brandId][automation.id] = automation;

  writePersistenceState(state);
}

export function getAutomationSettingsOverride(
  brandId: string
): PersistedAutomationSettings | null {
  return readPersistenceState().automationSettings[brandId] ?? null;
}

export function updateAutomationSettingsOverride(
  brandId: string,
  settings: PersistedAutomationSettings
) {
  const state = readPersistenceState();

  state.automationSettings[brandId] = settings;

  writePersistenceState(state);
}

export function markInboxItemRead(brandId: string, itemId: string) {
  const state = readPersistenceState();

  state.inbox[brandId] ??= {};
  state.inbox[brandId][itemId] = {
    state: "resolved",
    updatedAt: new Date().toISOString()
  };

  writePersistenceState(state);
}

export function snoozeInboxItem(brandId: string, itemId: string) {
  const state = readPersistenceState();

  state.inbox[brandId] ??= {};
  state.inbox[brandId][itemId] = {
    state: "scheduled",
    updatedAt: new Date().toISOString()
  };

  writePersistenceState(state);
}
