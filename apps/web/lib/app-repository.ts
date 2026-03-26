import "server-only";

import {
  canUsePostgresRepository,
  createPostgresRepository
} from "./postgres-repository";
import {
  getAutomationSettingsOverride,
  getBrandMemoryOverride,
  getIntegrationOverride,
  listPersistedCatalogProducts,
  listPersistedStores,
  listPersistedStoreMetrics,
  listPersistedSyncRuns,
  getPersistedTeamMember,
  listPersistedAutomations,
  listPersistedTeamMembers,
  updateAutomationSettingsOverride,
  updateBrandMemoryOverride,
  updateIntegrationOverride,
  replacePersistedCatalogProducts,
  replacePersistedStoreMetrics,
  upsertPersistedStore,
  upsertPersistedSyncRun,
  upsertPersistedAutomation,
  upsertPersistedTeamMember
} from "./local-persistence";
import type {
  WorkspaceBrand,
  WorkspaceIntegration,
  WorkspaceMembership,
  WorkspaceRole,
  WorkspaceUser
} from "./workspace";

export type RepositoryBrandMemorySeed = {
  positioning: string;
  targetCustomer: string;
  tone: string;
  heroProducts: string[];
  doSay: string[];
  dontSay: string[];
  customerPersonas: string[];
  updatedAt: string;
};

export type RepositoryStoreSeed = {
  id: string;
  platform: string;
  shopDomain: string;
  currency: string;
  status: "pending" | "connected" | "degraded";
  connectedAt?: string;
  updatedAt: string;
};

export type RepositorySyncRunSource = "live" | "seeded" | "simulated";

export type RepositorySyncRunFallbackReason =
  | "missing_config"
  | "request_failed";

export type RepositorySyncRunSeed = {
  id: string;
  provider: string;
  status: "queued" | "running" | "success" | "failed";
  startedAt?: string;
  finishedAt?: string;
  recordsProcessed: number;
  errorMessage?: string;
  triggerLabel: string;
  source?: RepositorySyncRunSource | null;
  fallbackReason?: RepositorySyncRunFallbackReason | null;
  updatedAt: string;
};

export type RepositoryCatalogProduct = {
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

export type RepositoryStoreMetric = {
  metricDate: string;
  revenue: number;
  ordersCount: number;
  aov: number;
  sessions: number;
  conversionRate: number;
  repeatPurchaseRate: number;
  returningCustomerRevenue: number;
};

export type RepositoryShopifyVariantSnapshot = {
  externalVariantId: string;
  title: string;
  sku: string;
  price: number;
  inventoryQuantity: number;
};

export type RepositoryShopifyProductSnapshot = RepositoryCatalogProduct & {
  handle: string;
  priceMin: number;
  priceMax: number;
  variants: RepositoryShopifyVariantSnapshot[];
  metricDate: string;
  revenueValue: number;
  unitsSold: number;
  sessionsValue: number;
  conversionRateValue: number;
  addToCartRate: number;
  returnRate: number;
  grossMarginValue: number;
};

export type RepositoryShopifyOrderSnapshot = {
  externalOrderId: string;
  orderNumber: string;
  orderDate: string;
  customerEmail: string;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  financialStatus: string;
  fulfillmentStatus: string;
};

export type RepositoryShopifySnapshot = {
  shopDomain: string;
  currency: string;
  products: RepositoryShopifyProductSnapshot[];
  orders: RepositoryShopifyOrderSnapshot[];
  dailyStoreMetrics: RepositoryStoreMetric[];
};

export type RepositoryShopifyIngestResult = {
  products: RepositoryCatalogProduct[];
  storeMetrics: RepositoryStoreMetric[];
  recordsProcessed: number;
};

export type RepositoryTeamMemberSeed = {
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

export type RepositoryAutomationSeed = {
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

export type RepositoryAutomationSettingsSeed = {
  approvalMode: "always_review" | "confidence_based";
  autoPublishMode: "never" | "approved_only";
  alertSensitivity: "normal" | "high";
  weeklyBriefCadence: "monday_am" | "friday_pm";
  updatedAt: string;
};

export type AppRepository = {
  listUsers(): WorkspaceUser[];
  listBrands(): WorkspaceBrand[];
  listMemberships(): WorkspaceMembership[];
  listIntegrations(brandId: string): WorkspaceIntegration[];
  listStores(brandId: string): RepositoryStoreSeed[];
  upsertStore(
    brandId: string,
    store: RepositoryStoreSeed
  ): RepositoryStoreSeed | null;
  listSyncRuns(
    brandId: string,
    provider?: string
  ): RepositorySyncRunSeed[];
  appendSyncRun(
    brandId: string,
    run: RepositorySyncRunSeed
  ): RepositorySyncRunSeed | null;
  listCatalogProducts(brandId: string): RepositoryCatalogProduct[];
  listStoreMetrics(brandId: string): RepositoryStoreMetric[];
  ingestShopifySnapshot(
    brandId: string,
    snapshot: RepositoryShopifySnapshot
  ): RepositoryShopifyIngestResult;
  getBrandMemorySeed(brandId: string): RepositoryBrandMemorySeed | null;
  listTeamSeedMembers(brandId: string): RepositoryTeamMemberSeed[];
  listAutomationSeeds(brandId: string): RepositoryAutomationSeed[];
  getAutomationSettingsSeed(brandId: string): RepositoryAutomationSettingsSeed | null;
  upsertIntegration(
    brandId: string,
    integration: WorkspaceIntegration
  ): WorkspaceIntegration | null;
  saveBrandMemory(
    brandId: string,
    brandMemory: RepositoryBrandMemorySeed
  ): RepositoryBrandMemorySeed | null;
  upsertTeamMember(
    brandId: string,
    member: RepositoryTeamMemberSeed
  ): RepositoryTeamMemberSeed | null;
  upsertAutomation(
    brandId: string,
    automation: RepositoryAutomationSeed
  ): RepositoryAutomationSeed | null;
  saveAutomationSettings(
    brandId: string,
    settings: RepositoryAutomationSettingsSeed
  ): RepositoryAutomationSettingsSeed | null;
};

type RepositoryMode = "dev" | "auto" | "postgres";

export type AppRepositoryStatus = {
  configuredMode: RepositoryMode;
  activeSource: "dev" | "postgres";
  postgresReady: boolean;
  usingFallback: boolean;
};

const users: WorkspaceUser[] = [
  {
    id: "user_aly",
    name: "Aly Khan",
    email: "aly@lunaskin.com",
    title: "Growth Lead"
  },
  {
    id: "user_mira",
    name: "Mira Sol",
    email: "mira@lunaskin.com",
    title: "Founder"
  },
  {
    id: "user_jon",
    name: "Jon Park",
    email: "jon@agency.app",
    title: "Agency Operator"
  },
  {
    id: "user_priya",
    name: "Priya Rao",
    email: "priya@solsticewell.com",
    title: "Content Lead"
  },
  {
    id: "user_diego",
    name: "Diego Chen",
    email: "diego@solsticewell.com",
    title: "E-commerce Manager"
  }
];

const brands: WorkspaceBrand[] = [
  {
    id: "demo",
    name: "Luna Skin",
    vertical: "Beauty / Skincare",
    timezone: "America/Los_Angeles",
    gmvBand: "$5M-$10M"
  },
  {
    id: "solstice",
    name: "Solstice Well",
    vertical: "Wellness / Supplements",
    timezone: "America/New_York",
    gmvBand: "$10M-$20M"
  }
];

const memberships: WorkspaceMembership[] = [
  {
    brandId: "demo",
    userId: "user_aly",
    role: "growth_marketer"
  },
  {
    brandId: "demo",
    userId: "user_mira",
    role: "founder"
  },
  {
    brandId: "demo",
    userId: "user_jon",
    role: "operator"
  },
  {
    brandId: "solstice",
    userId: "user_jon",
    role: "operator"
  },
  {
    brandId: "solstice",
    userId: "user_priya",
    role: "content_lead"
  },
  {
    brandId: "solstice",
    userId: "user_diego",
    role: "ecommerce_manager"
  }
];

const integrationsByBrandId: Record<string, WorkspaceIntegration[]> = {
  demo: [
    {
      provider: "shopify",
      status: "connected",
      lastSyncedAt: "2026-03-25T09:15:00Z"
    },
    {
      provider: "meta",
      status: "connected",
      lastSyncedAt: "2026-03-25T08:50:00Z"
    },
    {
      provider: "ga4",
      status: "degraded",
      lastSyncedAt: "2026-03-24T21:10:00Z"
    },
    {
      provider: "klaviyo",
      status: "pending",
      lastSyncedAt: "2026-03-20T16:00:00Z"
    }
  ],
  solstice: [
    {
      provider: "shopify",
      status: "connected",
      lastSyncedAt: "2026-03-25T09:42:00Z"
    },
    {
      provider: "meta",
      status: "degraded",
      lastSyncedAt: "2026-03-24T19:18:00Z"
    },
    {
      provider: "ga4",
      status: "connected",
      lastSyncedAt: "2026-03-25T09:30:00Z"
    },
    {
      provider: "klaviyo",
      status: "connected",
      lastSyncedAt: "2026-03-25T07:52:00Z"
    }
  ]
};

const brandMemoryByBrandId: Record<string, RepositoryBrandMemorySeed> = {
  demo: {
    positioning: "Science-backed skincare that makes overnight recovery feel simple and believable.",
    targetCustomer:
      "Women 24-40 with sensitive or stressed skin who want visible payoff without a 12-step routine.",
    tone: "Warm, assured, low-hype, proof-led.",
    heroProducts: ["Overnight Reset Serum", "Daily Barrier Cream"],
    doSay: ["overnight recovery", "sensitive-skin trust", "proof before hype"],
    dontSay: ["miracle skin", "flawless overnight", "aggressive clinical jargon"],
    customerPersonas: [
      "Barrier-repair buyer",
      "Low-effort routine seeker",
      "Paid-social proof converter"
    ],
    updatedAt: "2026-03-25T08:45:00Z"
  },
  solstice: {
    positioning:
      "Wellness routines that feel easy to repeat and worth paying for, even without constant discounts.",
    targetCustomer:
      "Adults 26-44 trying to build a sustainable night routine around better sleep and lower stress.",
    tone: "Calm, practical, habit-forming, premium.",
    heroProducts: ["Sleep Stack Bundle", "Magnesium Gummies"],
    doSay: ["routine consistency", "better nights", "habit support"],
    dontSay: ["knockout effect", "cheap sleep fix", "medicalized over-claims"],
    customerPersonas: [
      "Routine rebuilder",
      "Taste-led supplement buyer",
      "Bundle value defender"
    ],
    updatedAt: "2026-03-25T07:25:00Z"
  }
};

const storeSeedsByBrandId: Record<string, RepositoryStoreSeed[]> = {
  demo: [
    {
      id: "store_demo_shopify",
      platform: "shopify",
      shopDomain: "lunaskin.myshopify.com",
      currency: "USD",
      status: "connected",
      connectedAt: "2026-03-20T10:15:00Z",
      updatedAt: "2026-03-25T09:15:00Z"
    }
  ],
  solstice: [
    {
      id: "store_solstice_shopify",
      platform: "shopify",
      shopDomain: "solsticewell.myshopify.com",
      currency: "USD",
      status: "connected",
      connectedAt: "2026-03-18T11:05:00Z",
      updatedAt: "2026-03-25T09:42:00Z"
    }
  ]
};

const syncRunSeedsByBrandId: Record<string, RepositorySyncRunSeed[]> = {
  demo: [
    {
      id: "sync_demo_shopify_1",
      provider: "shopify",
      status: "success",
      startedAt: "2026-03-25T09:10:00Z",
      finishedAt: "2026-03-25T09:15:00Z",
      recordsProcessed: 482,
      triggerLabel: "Manual sync from integrations",
      source: "seeded",
      updatedAt: "2026-03-25T09:15:00Z"
    },
    {
      id: "sync_demo_ga4_1",
      provider: "ga4",
      status: "failed",
      startedAt: "2026-03-24T21:05:00Z",
      finishedAt: "2026-03-24T21:10:00Z",
      recordsProcessed: 0,
      errorMessage: "OAuth token expired before property fetch completed.",
      triggerLabel: "Nightly scheduled sync",
      source: "simulated",
      updatedAt: "2026-03-24T21:10:00Z"
    }
  ],
  solstice: [
    {
      id: "sync_solstice_shopify_1",
      provider: "shopify",
      status: "success",
      startedAt: "2026-03-25T09:36:00Z",
      finishedAt: "2026-03-25T09:42:00Z",
      recordsProcessed: 615,
      triggerLabel: "Manual sync from integrations",
      source: "seeded",
      updatedAt: "2026-03-25T09:42:00Z"
    }
  ]
};

const teamSeedsByBrandId: Record<string, RepositoryTeamMemberSeed[]> = {
  demo: [
    {
      id: "invite_demo_founder_ops",
      name: "Nina Hart",
      email: "nina@lunaskin.com",
      title: "Operations Manager",
      role: "operator",
      status: "invited",
      updatedAt: "2026-03-25T09:12:00Z",
      invitedAt: "2026-03-25T09:12:00Z",
      lastNotifiedAt: "2026-03-25T09:12:00Z"
    }
  ],
  solstice: [
    {
      id: "invite_solstice_growth",
      name: "Rhea Patel",
      email: "rhea@solsticewell.com",
      title: "Growth Analyst",
      role: "growth_marketer",
      status: "invited",
      updatedAt: "2026-03-25T08:05:00Z",
      invitedAt: "2026-03-25T08:05:00Z",
      lastNotifiedAt: "2026-03-25T08:05:00Z"
    }
  ]
};

const automationSeedsByBrandId: Record<string, RepositoryAutomationSeed[]> = {
  demo: [
    {
      id: "auto_demo_weekly_brief",
      name: "Weekly Founder Brief",
      policyType: "brief_delivery",
      scope: "Founder + operator inbox",
      summary:
        "Generate and deliver the weekly business brief every Monday morning after sync health clears.",
      triggerLabel: "Mondays at 9:00 AM after green syncs",
      status: "active",
      updatedAt: "2026-03-25T08:10:00Z",
      lastRunAt: "2026-03-24T09:02:00Z",
      nextRunAt: "2026-03-30T09:00:00Z"
    },
    {
      id: "auto_demo_publish_failures",
      name: "Publish Failure Escalation",
      policyType: "workflow_alert",
      scope: "Operators + content leads",
      summary:
        "Escalate failed publish jobs into the inbox with retry guidance and owner routing.",
      triggerLabel: "Immediately on failed publish job",
      status: "active",
      updatedAt: "2026-03-25T08:20:00Z",
      lastRunAt: "2026-03-24T18:10:00Z",
      nextRunAt: "2026-03-26T18:00:00Z"
    }
  ],
  solstice: [
    {
      id: "auto_solstice_retention_watch",
      name: "Retention Risk Watch",
      policyType: "retention_alert",
      scope: "E-commerce manager + operator",
      summary:
        "Escalate weak lifecycle segments when repeat-purchase pacing slips below the expected band.",
      triggerLabel: "Daily at 8:30 AM",
      status: "active",
      updatedAt: "2026-03-25T07:40:00Z",
      lastRunAt: "2026-03-25T08:30:00Z",
      nextRunAt: "2026-03-26T08:30:00Z"
    },
    {
      id: "auto_solstice_approval_guardrail",
      name: "High-Impact Approval Guardrail",
      policyType: "approval_policy",
      scope: "Founder approval on high-impact content",
      summary:
        "Force founder review for high-visibility or paid content before scheduling.",
      triggerLabel: "Whenever draft confidence is below threshold",
      status: "paused",
      updatedAt: "2026-03-25T07:55:00Z",
      nextRunAt: "2026-03-26T10:00:00Z"
    }
  ]
};

const automationSettingsByBrandId: Record<
  string,
  RepositoryAutomationSettingsSeed
> = {
  demo: {
    approvalMode: "always_review",
    autoPublishMode: "never",
    alertSensitivity: "high",
    weeklyBriefCadence: "monday_am",
    updatedAt: "2026-03-25T08:30:00Z"
  },
  solstice: {
    approvalMode: "confidence_based",
    autoPublishMode: "approved_only",
    alertSensitivity: "normal",
    weeklyBriefCadence: "friday_pm",
    updatedAt: "2026-03-25T07:58:00Z"
  }
};

function mergeIntegrations(
  brandId: string,
  integrations: WorkspaceIntegration[]
) {
  return integrations.map((integration) => {
    const override = getIntegrationOverride(brandId, integration.provider);

    if (!override) {
      return integration;
    }

    return {
      ...integration,
      status: override.status,
      lastSyncedAt: override.lastSyncedAt
    };
  });
}

const devRepository: AppRepository = {
  listUsers() {
    return users.slice();
  },
  listBrands() {
    return brands.slice();
  },
  listMemberships() {
    return memberships.flatMap((membership) => {
      const override = getPersistedTeamMember(
        membership.brandId,
        membership.userId
      );

      if (override?.status === "removed") {
        return [];
      }

      return [
        {
          ...membership,
          role: override?.role ?? membership.role
        }
      ];
    });
  },
  listIntegrations(brandId) {
    return mergeIntegrations(brandId, (integrationsByBrandId[brandId] ?? []).slice());
  },
  listStores(brandId) {
    const storeMap = new Map<string, RepositoryStoreSeed>(
      (storeSeedsByBrandId[brandId] ?? []).map((store) => [store.id, store] as const)
    );

    for (const store of listPersistedStores(brandId)) {
      storeMap.set(store.id, store);
    }

    return Array.from(storeMap.values()).sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt)
    );
  },
  upsertStore(brandId, store) {
    upsertPersistedStore(brandId, store);
    return store;
  },
  listSyncRuns(brandId, provider) {
    const runMap = new Map<string, RepositorySyncRunSeed>(
      (syncRunSeedsByBrandId[brandId] ?? []).map((run) => [run.id, run] as const)
    );

    for (const run of listPersistedSyncRuns(brandId)) {
      runMap.set(run.id, run);
    }

    return Array.from(runMap.values())
      .filter((run) => (provider ? run.provider === provider : true))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  },
  appendSyncRun(brandId, run) {
    upsertPersistedSyncRun(brandId, run);
    return run;
  },
  listCatalogProducts(brandId) {
    return listPersistedCatalogProducts(brandId);
  },
  listStoreMetrics(brandId) {
    return listPersistedStoreMetrics(brandId);
  },
  ingestShopifySnapshot(brandId, snapshot) {
    replacePersistedCatalogProducts(brandId, snapshot.products);
    replacePersistedStoreMetrics(brandId, snapshot.dailyStoreMetrics);

    return {
      products: devRepository.listCatalogProducts(brandId),
      storeMetrics: devRepository.listStoreMetrics(brandId),
      recordsProcessed:
        snapshot.products.length +
        snapshot.orders.length +
        snapshot.products.reduce(
          (total, product) => total + product.variants.length,
          0
        ) +
        snapshot.dailyStoreMetrics.length
    };
  },
  getBrandMemorySeed(brandId) {
    return getBrandMemoryOverride(brandId) ?? brandMemoryByBrandId[brandId] ?? null;
  },
  listTeamSeedMembers(brandId) {
    const mergedMembers = new Map<string, RepositoryTeamMemberSeed>(
      (teamSeedsByBrandId[brandId] ?? []).map((member) => [member.id, member] as const)
    );

    for (const member of listPersistedTeamMembers(brandId)) {
      mergedMembers.set(member.id, member);
    }

    return Array.from(mergedMembers.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  },
  listAutomationSeeds(brandId) {
    const mergedAutomations = new Map<string, RepositoryAutomationSeed>(
      (automationSeedsByBrandId[brandId] ?? []).map((automation) => [
        automation.id,
        automation
      ] as const)
    );

    for (const automation of listPersistedAutomations(brandId)) {
      mergedAutomations.set(automation.id, automation);
    }

    return Array.from(mergedAutomations.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  },
  getAutomationSettingsSeed(brandId) {
    return (
      getAutomationSettingsOverride(brandId) ??
      automationSettingsByBrandId[brandId] ??
      null
    );
  },
  upsertIntegration(brandId, integration) {
    updateIntegrationOverride(brandId, integration.provider, {
      status: integration.status,
      lastSyncedAt: integration.lastSyncedAt
    });

    return (
      devRepository
        .listIntegrations(brandId)
        .find((item) => item.provider === integration.provider) ?? integration
    );
  },
  saveBrandMemory(brandId, brandMemory) {
    updateBrandMemoryOverride(brandId, brandMemory);

    return devRepository.getBrandMemorySeed(brandId);
  },
  upsertTeamMember(brandId, member) {
    upsertPersistedTeamMember(brandId, member);
    return member;
  },
  upsertAutomation(brandId, automation) {
    upsertPersistedAutomation(brandId, automation);
    return automation;
  },
  saveAutomationSettings(brandId, settings) {
    updateAutomationSettingsOverride(brandId, settings);
    return devRepository.getAutomationSettingsSeed(brandId);
  }
};

let cachedRepository: AppRepository | null = null;
let cachedMode: RepositoryMode | null = null;

function getRepositoryMode(): RepositoryMode {
  const raw = process.env.AGENCY_REPOSITORY_MODE?.trim().toLowerCase();

  if (raw === "postgres") {
    return "postgres";
  }

  if (raw === "auto") {
    return "auto";
  }

  return "dev";
}

export function getAppRepositoryStatus(): AppRepositoryStatus {
  const configuredMode = getRepositoryMode();
  const postgresReady = canUsePostgresRepository();
  const activeSource =
    configuredMode !== "dev" && postgresReady ? "postgres" : "dev";

  return {
    configuredMode,
    activeSource,
    postgresReady,
    usingFallback: configuredMode !== "dev" && activeSource === "dev"
  };
}

export function getAppRepository(): AppRepository {
  const mode = getRepositoryMode();

  if (cachedRepository && cachedMode === mode) {
    return cachedRepository;
  }

  if (mode === "dev") {
    cachedRepository = devRepository;
    cachedMode = mode;
    return cachedRepository;
  }

  if (canUsePostgresRepository()) {
    cachedRepository = createPostgresRepository();
    cachedMode = mode;
    return cachedRepository;
  }

  if (mode === "postgres") {
    throw new Error(
      "AGENCY_REPOSITORY_MODE is set to postgres, but DATABASE_URL or psql access is not available."
    );
  }

  cachedRepository = devRepository;
  cachedMode = mode;
  return cachedRepository;
}
