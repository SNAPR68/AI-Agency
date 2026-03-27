import "server-only";

import { getInboxOverride } from "./local-persistence";
import {
  listApprovalItems,
  listApprovalItemsAsync,
  listPublishJobs,
  listPublishJobsAsync,
  listReadyToPublishDrafts,
  listReadyToPublishDraftsAsync
} from "./workflow-execution-data";
import {
  listDerivedCatalogProducts,
  listDerivedStoreMetrics
} from "./shopify-ingestion";
import {
  listSupabaseDerivedCatalogProducts,
  listSupabaseDerivedStoreMetrics
} from "./supabase-commerce-read-data";
import { listPlatformIntegrationViews } from "./supabase-platform-data";
import { shouldEnforceSupabaseHostedAccess } from "./supabase-env";
import { getWorkspaceContext, getWorkspaceContextAsync } from "./workspace-data";

export type WorkspaceKpi = {
  id: string;
  label: string;
  value: string;
  delta: string;
  note: string;
};

export type WorkspaceInsight = {
  title: string;
  description: string;
};

export type WorkspaceNextAction = {
  title: string;
  description: string;
  owner: string;
  dueLabel: string;
  href: string;
};

export type WorkspaceAlert = {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  category: string;
  status: "open" | "investigating" | "assigned";
  owner: string;
  evidence: string;
  impact: string;
  nextStep: string;
  href: string;
};

export type WorkspaceBrief = {
  id: string;
  title: string;
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  status: "draft" | "sent" | "reviewed";
  summary: string;
  audience: string;
  highlightsCount: number;
  actionsCount: number;
  topWins: WorkspaceInsight[];
  topRisks: WorkspaceInsight[];
  whyItChanged: WorkspaceInsight[];
  nextActions: WorkspaceNextAction[];
};

export type WorkspaceInboxItem = {
  id: string;
  kind: "approval" | "alert" | "brief" | "system";
  title: string;
  summary: string;
  state: "needs_review" | "open" | "scheduled" | "resolved";
  receivedAt: string;
  actionLabel: string;
  href: string;
};

export type WorkspaceInboxFeedItem = WorkspaceInboxItem & {
  receivedAtLabel: string;
};

export type WorkspaceIntegrationView = {
  provider: string;
  label: string;
  status: "connected" | "degraded" | "pending";
  accountLabel: string;
  coverage: string;
  note: string;
  lastSyncedAt: string;
  lastSyncedLabel: string;
  actionLabel: string;
};

export type WorkspaceOverviewData = {
  description: string;
  kpis: WorkspaceKpi[];
  wins: WorkspaceInsight[];
  risks: WorkspaceInsight[];
  nextActions: WorkspaceNextAction[];
  pendingApprovals: number;
  openAlerts: number;
  publishFailures: number;
  approvedToSchedule: number;
  syncHealth: WorkspaceIntegrationView[];
  workflowPulse: WorkspaceWorkflowSignal[];
};

export type WorkspaceWorkflowSignal = {
  title: string;
  description: string;
  tone: "positive" | "warning" | "danger" | "info";
  href: string;
  actionLabel: string;
};

type BrandSeed = {
  description: string;
  kpis: WorkspaceKpi[];
  wins: WorkspaceInsight[];
  risks: WorkspaceInsight[];
  nextActions: Omit<WorkspaceNextAction, "owner">[];
  alerts: Omit<WorkspaceAlert, "owner">[];
  briefs: WorkspaceBrief[];
  inbox: WorkspaceInboxItem[];
  integrations: Record<
    string,
    {
      accountLabel: string;
      coverage: string;
      note: string;
    }
  >;
};

function buildBrandPath(brandId: string, path: string) {
  return `/brands/${brandId}${path}`;
}

function formatTimestampLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatDelta(current: number, previous: number) {
  if (previous === 0) {
    return "0.0%";
  }

  const delta = ((current - previous) / previous) * 100;
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
}

function extractFirstNumber(value: string) {
  const match = value.match(/-?\d+(?:\.\d+)?/);

  return match ? Number(match[0]) : 0;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(new Date(`${value}T00:00:00Z`));
}

function shiftIsoDate(value: string, offsetDays: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);

  return date.toISOString().slice(0, 10);
}

function getDefaultBrandSeed(brandId: string): BrandSeed {
  return {
    description:
      "The workspace is wired and ready for real data, but this brand does not have a custom operating dataset yet.",
    kpis: [
      {
        id: "revenue",
        label: "Revenue",
        value: "$0",
        delta: "0.0%",
        note: "Waiting for connected data sources."
      },
      {
        id: "aov",
        label: "AOV",
        value: "$0",
        delta: "0.0%",
        note: "Waiting for connected data sources."
      },
      {
        id: "conversion",
        label: "Conversion rate",
        value: "0.0%",
        delta: "0.0%",
        note: "Waiting for connected data sources."
      },
      {
        id: "repeat_purchase",
        label: "Repeat purchase",
        value: "0.0%",
        delta: "0.0%",
        note: "Waiting for connected data sources."
      }
    ],
    wins: [
      {
        title: "Workspace scaffold is live",
        description: "Pages, routes, and approvals are ready to receive real brand data."
      }
    ],
    risks: [
      {
        title: "No brand-specific data seed",
        description: `Brand ${brandId} still needs connected integrations or seeded operating data.`
      }
    ],
    nextActions: [
      {
        title: "Connect integrations",
        description: "Start with Shopify, then add Meta and GA4 to unlock command center insights.",
        dueLabel: "This week",
        href: buildBrandPath(brandId, "/settings/integrations")
      }
    ],
    alerts: [],
    briefs: [
      {
        id: "latest",
        title: "Initial operating brief",
        weekLabel: "Setup week",
        weekStart: "2026-03-24",
        weekEnd: "2026-03-30",
        status: "draft",
        summary: "No custom brand brief is available yet.",
        audience: "Founders and operators",
        highlightsCount: 1,
        actionsCount: 1,
        topWins: [
          {
            title: "Foundational workspace is ready",
            description: "The team can now begin syncing data and shaping the operating rhythm."
          }
        ],
        topRisks: [
          {
            title: "No connected metrics",
            description: "Insights will remain generic until integrations are configured."
          }
        ],
        whyItChanged: [
          {
            title: "This is still a pre-data state",
            description: "No provider sync has produced commerce or marketing signals yet."
          }
        ],
        nextActions: [
          {
            title: "Connect the first data source",
            description: "Use the integrations screen to connect Shopify.",
            owner: "Workspace owner",
            dueLabel: "Today",
            href: buildBrandPath(brandId, "/settings/integrations")
          }
        ]
      }
    ],
    inbox: [],
    integrations: {
      shopify: {
        accountLabel: "Not connected",
        coverage: "Commerce backbone",
        note: "Connect Shopify to populate products, customers, and orders."
      },
      meta: {
        accountLabel: "Not connected",
        coverage: "Paid media performance",
        note: "Connect Meta to unlock campaign and efficiency views."
      },
      ga4: {
        accountLabel: "Not connected",
        coverage: "Traffic and site analytics",
        note: "Connect GA4 for traffic quality and conversion path context."
      },
      klaviyo: {
        accountLabel: "Not connected",
        coverage: "Retention and lifecycle context",
        note: "Connect Klaviyo to surface lifecycle and retention opportunities."
      }
    }
  };
}

const brandSeeds: Record<string, BrandSeed> = {
  demo: {
    description:
      "Luna Skin is coming into the week with healthy revenue momentum, but one high-intent product page and a degraded analytics connection need attention before the next campaign push.",
    kpis: [
      {
        id: "revenue",
        label: "Revenue",
        value: "$182.3K",
        delta: "+12.4%",
        note: "Lift is concentrated in the overnight reset serum and bundle attach."
      },
      {
        id: "aov",
        label: "AOV",
        value: "$64.11",
        delta: "+3.1%",
        note: "Bundles and hero SKU mix are improving average checkout value."
      },
      {
        id: "conversion",
        label: "Conversion rate",
        value: "3.2%",
        delta: "-0.2%",
        note: "Overall conversion dipped due to one high-traffic PDP underperforming."
      },
      {
        id: "repeat_purchase",
        label: "Repeat purchase",
        value: "21.4%",
        delta: "+1.8%",
        note: "Recent replenishment campaigns are beginning to lift repeat behavior."
      }
    ],
    wins: [
      {
        title: "Hero serum is carrying the week",
        description: "The overnight reset serum is driving more than half of the weekly lift and is converting efficiently on paid traffic."
      },
      {
        title: "Paid social stayed efficient while spend increased",
        description: "Meta spend climbed without breaking blended efficiency, which gives room for fresh creative tests."
      }
    ],
    risks: [
      {
        title: "One high-intent PDP is leaking conversion",
        description: "Traffic to the daily barrier cream PDP is strong, but conversion is down enough to require messaging and merchandising changes."
      },
      {
        title: "GA4 is still degraded",
        description: "Traffic quality views are directionally useful, but attribution confidence is lower than it should be."
      }
    ],
    nextActions: [
      {
        title: "Push the reset serum in this week's content plan",
        description: "Use current momentum to ship three new hooks and a creator brief built around the hero SKU.",
        dueLabel: "Today",
        href: buildBrandPath("demo", "/content")
      },
      {
        title: "Review the barrier cream PDP",
        description: "Tighten headline and above-the-fold value framing before the next paid push.",
        dueLabel: "Tomorrow",
        href: buildBrandPath("demo", "/products/prod-barrier-cream")
      },
      {
        title: "Reconnect GA4 before Monday reporting",
        description: "Restore trust in acquisition reporting before sharing the next founder brief.",
        dueLabel: "This week",
        href: buildBrandPath("demo", "/settings/integrations")
      }
    ],
    alerts: [
      {
        id: "alert_barrier_pdp",
        title: "Barrier Cream PDP underperforming",
        severity: "high",
        category: "product_conversion",
        status: "investigating",
        evidence:
          "Sessions are up 29% week over week while product conversion is down 18% against baseline.",
        impact:
          "If the PDP stays at the current rate, the team leaves an estimated $9.6K in weekly revenue on the table.",
        nextStep:
          "Review PDP framing, hero media, and objection handling, then spin hooks into the content queue.",
        href: buildBrandPath("demo", "/products/prod-barrier-cream")
      },
      {
        id: "alert_ga4",
        title: "GA4 connection degraded",
        severity: "medium",
        category: "data_freshness",
        status: "open",
        evidence:
          "The last successful GA4 sync is older than 12 hours, and channel quality panels are now stale.",
        impact:
          "Attribution confidence is lower for weekly reporting and campaign diagnostics.",
        nextStep:
          "Reconnect GA4 and trigger a manual sync before the next brief is reviewed.",
        href: buildBrandPath("demo", "/settings/integrations")
      },
      {
        id: "alert_returns",
        title: "Returns reason spike on travel kit",
        severity: "low",
        category: "cx",
        status: "assigned",
        evidence:
          "Return comments mentioning size expectations increased 11% after the recent landing page refresh.",
        impact:
          "Margin pressure is still moderate, but the trend needs copy and expectation management.",
        nextStep:
          "Flag the CX team and update packaging and PDP guidance for the next batch.",
        href: buildBrandPath("demo", "/cx")
      }
    ],
    briefs: [
      {
        id: "latest",
        title: "Week of March 16 to March 22",
        weekLabel: "Mar 16 - Mar 22",
        weekStart: "2026-03-16",
        weekEnd: "2026-03-22",
        status: "sent",
        summary:
          "Revenue improved behind a small set of winning SKUs, but conversion softened on one key PDP and the analytics layer still needs cleanup.",
        audience: "Founder and growth lead",
        highlightsCount: 5,
        actionsCount: 3,
        topWins: [
          {
            title: "Reset serum drove outsized lift",
            description: "Paid and owned channels both pointed to stronger demand for the hero product."
          },
          {
            title: "Bundle attach improved AOV",
            description: "Average order value rose without adding promotional pressure."
          }
        ],
        topRisks: [
          {
            title: "Barrier cream conversion slipped",
            description: "The PDP is not converting enough of the recent traffic increase."
          },
          {
            title: "GA4 is stale",
            description: "Analytics confidence remains lower than desired for channel reporting."
          }
        ],
        whyItChanged: [
          {
            title: "Hero SKU message is landing",
            description: "Creative angles tied to skin barrier recovery and nighttime reset are resonating."
          },
          {
            title: "Traffic is not the problem",
            description: "The weak PDP issue is conversion-side, not acquisition-side."
          }
        ],
        nextActions: [
          {
            title: "Create three conversion hooks for the reset serum",
            description: "Turn the current product momentum into the week's first content block.",
            owner: "Aly Khan",
            dueLabel: "Today",
            href: buildBrandPath("demo", "/content")
          },
          {
            title: "Patch the barrier cream PDP",
            description: "Refresh headline, supporting proof, and comparison framing.",
            owner: "Jon Park",
            dueLabel: "Tomorrow",
            href: buildBrandPath("demo", "/products/prod-barrier-cream")
          },
          {
            title: "Reconnect GA4",
            description: "Restore traffic and attribution visibility before next report delivery.",
            owner: "Jon Park",
            dueLabel: "This week",
            href: buildBrandPath("demo", "/settings/integrations")
          }
        ]
      },
      {
        id: "brief-2026-03-15",
        title: "Week of March 9 to March 15",
        weekLabel: "Mar 9 - Mar 15",
        weekStart: "2026-03-09",
        weekEnd: "2026-03-15",
        status: "reviewed",
        summary:
          "New creative angles lifted top-of-funnel performance, but repeat purchase was flat and creator briefs lagged behind product priorities.",
        audience: "Founder and content lead",
        highlightsCount: 4,
        actionsCount: 2,
        topWins: [
          {
            title: "Creative refresh improved CTR",
            description: "Meta CTR and landing page traffic both improved after the new angle set shipped."
          }
        ],
        topRisks: [
          {
            title: "Retention stayed flat",
            description: "Lifecycle uplift did not keep pace with acquisition gains."
          }
        ],
        whyItChanged: [
          {
            title: "Fresh messaging increased curiosity",
            description: "The new angle set reactivated interest higher in the funnel."
          }
        ],
        nextActions: [
          {
            title: "Create replenishment hooks",
            description: "Support repeat purchase with a lifecycle content sequence.",
            owner: "Aly Khan",
            dueLabel: "This week",
            href: buildBrandPath("demo", "/content")
          },
          {
            title: "Refresh creator brief backlog",
            description: "Bring the content plan in line with top products.",
            owner: "Jon Park",
            dueLabel: "This week",
            href: buildBrandPath("demo", "/content/calendar")
          }
        ]
      }
    ],
    inbox: [
      {
        id: "inbox_approval_serum",
        kind: "approval",
        title: "Serum creator brief is waiting for approval",
        summary: "A new creator brief for the reset serum is ready to review before scheduling.",
        state: "needs_review",
        receivedAt: "2026-03-25T08:45:00Z",
        actionLabel: "Open approval",
        href: buildBrandPath("demo", "/approvals")
      },
      {
        id: "inbox_alert_ga4",
        kind: "alert",
        title: "GA4 sync drift needs attention",
        summary: "Attribution panels are stale enough to affect confidence on the next brief.",
        state: "open",
        receivedAt: "2026-03-25T07:10:00Z",
        actionLabel: "Review integration",
        href: buildBrandPath("demo", "/settings/integrations")
      },
      {
        id: "inbox_brief_latest",
        kind: "brief",
        title: "Weekly brief delivered to founder",
        summary: "The latest founder brief was generated and shared with the leadership team.",
        state: "resolved",
        receivedAt: "2026-03-24T16:20:00Z",
        actionLabel: "Open brief",
        href: buildBrandPath("demo", "/briefs/latest")
      },
      {
        id: "inbox_publish_queue",
        kind: "system",
        title: "Friday publish queue is ready",
        summary: "Two approved assets are staged and waiting for the team's final publish confirmation.",
        state: "scheduled",
        receivedAt: "2026-03-24T14:05:00Z",
        actionLabel: "Open publishing",
        href: buildBrandPath("demo", "/publishing")
      }
    ],
    integrations: {
      shopify: {
        accountLabel: "Luna Skin Main Store",
        coverage: "Orders, products, customers, returns",
        note: "Commerce data is healthy and driving the current opportunity layer."
      },
      meta: {
        accountLabel: "Luna Skin Paid Social",
        coverage: "Campaigns, spend, and creative performance",
        note: "Paid social data is current enough to trust channel-level decisions."
      },
      ga4: {
        accountLabel: "LunaSkin.com GA4",
        coverage: "Traffic quality and conversion path context",
        note: "Reconnect before the next founder review to restore attribution confidence."
      },
      klaviyo: {
        accountLabel: "Luna Skin Lifecycle",
        coverage: "Retention and campaign orchestration",
        note: "Connected later than core channels, so some lifecycle panels are still warming up."
      }
    }
  },
  solstice: {
    description:
      "Solstice Well is showing stronger repeat behavior and higher average order value, but paid efficiency softened enough that the team needs tighter campaign and creative prioritization.",
    kpis: [
      {
        id: "revenue",
        label: "Revenue",
        value: "$241.9K",
        delta: "+8.7%",
        note: "Growth came from subscription bundles and replenishment-friendly SKUs."
      },
      {
        id: "aov",
        label: "AOV",
        value: "$71.38",
        delta: "+4.5%",
        note: "Bundle mix continues to raise checkout value."
      },
      {
        id: "conversion",
        label: "Conversion rate",
        value: "2.8%",
        delta: "-0.1%",
        note: "Site conversion is mostly stable, but paid traffic quality is softer."
      },
      {
        id: "repeat_purchase",
        label: "Repeat purchase",
        value: "26.8%",
        delta: "+2.6%",
        note: "Lifecycle and subscription behavior are trending in the right direction."
      }
    ],
    wins: [
      {
        title: "Subscription-friendly bundles are outperforming",
        description: "The sleep and magnesium stack is driving stronger AOV and repeat behavior."
      },
      {
        title: "Lifecycle relevance improved",
        description: "Recent post-purchase sequencing is increasing second-order intent."
      }
    ],
    risks: [
      {
        title: "Meta quality is softer",
        description: "Paid traffic efficiency dipped enough to justify creative refresh and audience review."
      },
      {
        title: "Support issues cluster around delivery timing",
        description: "Delayed shipment complaints are starting to show up often enough to warrant CX visibility."
      }
    ],
    nextActions: [
      {
        title: "Refresh paid creative for the sleep bundle",
        description: "Use the strongest retention signals to shape the next paid asset set.",
        dueLabel: "Today",
        href: buildBrandPath("solstice", "/content")
      },
      {
        title: "Open the delivery issue cluster",
        description: "Turn recurring shipping complaints into a CX action plan.",
        dueLabel: "Tomorrow",
        href: buildBrandPath("solstice", "/support-ops")
      },
      {
        title: "Review Meta account health",
        description: "Stabilize acquisition quality before scaling budget again.",
        dueLabel: "This week",
        href: buildBrandPath("solstice", "/settings/integrations")
      }
    ],
    alerts: [
      {
        id: "alert_meta_drift",
        title: "Meta quality drift detected",
        severity: "high",
        category: "channel_efficiency",
        status: "open",
        evidence:
          "Blended CPA is up 14% while landing page conversion is mostly flat, indicating traffic quality pressure.",
        impact:
          "If the trend holds, paid scaling plans will underperform against target contribution margin.",
        nextStep:
          "Prioritize a creative refresh and validate audience overlap before increasing spend.",
        href: buildBrandPath("solstice", "/channels")
      },
      {
        id: "alert_support_delivery",
        title: "Delivery complaints are clustering",
        severity: "medium",
        category: "support",
        status: "assigned",
        evidence:
          "Three recurring delivery complaint patterns now account for the majority of new support friction.",
        impact:
          "CX trust risk is growing and may start affecting repeat purchase intent.",
        nextStep:
          "Open a cross-functional review between support and operations and patch customer messaging.",
        href: buildBrandPath("solstice", "/support-ops")
      }
    ],
    briefs: [
      {
        id: "latest",
        title: "Week of March 16 to March 22",
        weekLabel: "Mar 16 - Mar 22",
        weekStart: "2026-03-16",
        weekEnd: "2026-03-22",
        status: "sent",
        summary:
          "AOV and repeat purchase improved, but acquisition quality softened enough that the team needs fresher paid creative and tighter delivery issue visibility.",
        audience: "Growth lead and ecommerce manager",
        highlightsCount: 4,
        actionsCount: 3,
        topWins: [
          {
            title: "Repeat purchase improved",
            description: "Retention is strengthening around replenishment-friendly bundles."
          }
        ],
        topRisks: [
          {
            title: "Paid quality softened",
            description: "Meta efficiency slipped without a corresponding drop in site conversion."
          }
        ],
        whyItChanged: [
          {
            title: "Lifecycle motion is helping",
            description: "Post-purchase campaigns and bundle mix are supporting better repeat behavior."
          }
        ],
        nextActions: [
          {
            title: "Refresh paid creative",
            description: "Give paid social a fresher creative set built around the bundle leader.",
            owner: "Priya Rao",
            dueLabel: "Today",
            href: buildBrandPath("solstice", "/content")
          },
          {
            title: "Investigate delivery cluster",
            description: "Reduce complaint recurrence and patch expectation-setting copy.",
            owner: "Diego Chen",
            dueLabel: "Tomorrow",
            href: buildBrandPath("solstice", "/support-ops")
          },
          {
            title: "Review Meta account state",
            description: "Decide whether to hold or scale spend for the next week.",
            owner: "Jon Park",
            dueLabel: "This week",
            href: buildBrandPath("solstice", "/settings/integrations")
          }
        ]
      }
    ],
    inbox: [
      {
        id: "inbox_retention_report",
        kind: "brief",
        title: "Retention brief is ready",
        summary: "Lifecycle and repeat-purchase trends were compiled for the weekly leadership review.",
        state: "needs_review",
        receivedAt: "2026-03-25T08:10:00Z",
        actionLabel: "Open brief",
        href: buildBrandPath("solstice", "/briefs/latest")
      },
      {
        id: "inbox_meta_quality",
        kind: "alert",
        title: "Meta quality drift needs triage",
        summary: "Acquisition efficiency slipped enough to affect pacing and content priorities.",
        state: "open",
        receivedAt: "2026-03-25T07:25:00Z",
        actionLabel: "Open alerts",
        href: buildBrandPath("solstice", "/alerts")
      },
      {
        id: "inbox_support_cluster",
        kind: "system",
        title: "Support cluster assigned to ops",
        summary: "The delivery complaints cluster has been routed to operations and CX.",
        state: "scheduled",
        receivedAt: "2026-03-24T18:30:00Z",
        actionLabel: "Review support ops",
        href: buildBrandPath("solstice", "/support-ops")
      }
    ],
    integrations: {
      shopify: {
        accountLabel: "SolsticeWell.com",
        coverage: "Orders, subscriptions, customers",
        note: "Commerce and subscription data are healthy."
      },
      meta: {
        accountLabel: "Solstice Well Growth Account",
        coverage: "Campaign performance and creative feedback loop",
        note: "The account is connected, but quality drift needs creative attention."
      },
      ga4: {
        accountLabel: "Solstice Well Analytics",
        coverage: "Traffic, conversion path, landing page visibility",
        note: "GA4 is current and helping validate site-side stability."
      },
      klaviyo: {
        accountLabel: "Solstice Lifecycle",
        coverage: "Retention and lifecycle performance",
        note: "Lifecycle and retention views are available and actively informing the weekly brief."
      }
    }
  }
};

function getBrandSeed(brandId: string) {
  return brandSeeds[brandId] ?? getDefaultBrandSeed(brandId);
}

function getCommerceDerivedAlerts(brandId: string): Omit<WorkspaceAlert, "owner">[] {
  const catalogProducts = [...listDerivedCatalogProducts(brandId)];
  const storeMetrics = listDerivedStoreMetrics(brandId);

  if (catalogProducts.length === 0) {
    return [];
  }

  const rankedProducts = catalogProducts.sort(
    (left, right) => extractFirstNumber(right.revenueShare) - extractFirstNumber(left.revenueShare)
  );
  const topProduct = rankedProducts[0];
  const watchProducts = rankedProducts.filter((product) => product.status === "watch");
  const alerts: Omit<WorkspaceAlert, "owner">[] = watchProducts.slice(0, 2).map((product) => ({
    id: `alert-${product.id}-conversion`,
    title: `${product.title} is leaking conversion`,
    severity: extractFirstNumber(product.conversionDelta) < 0 ? "high" : "medium",
    category: "Product",
    status: "open",
    evidence: `${product.summary} Conversion is ${product.conversionRate} (${product.conversionDelta}), which means traffic intent is not converting cleanly enough.`,
    impact:
      "If this stays unresolved, the brand keeps paying for attention that the PDP and messaging are not converting efficiently.",
    nextStep:
      "Tighten the PDP framing and turn the strongest proof angle into supporting content this week.",
    href: buildBrandPath(brandId, `/products/${product.id}`)
  }));

  if (topProduct && extractFirstNumber(topProduct.revenueShare) >= 25) {
    alerts.unshift({
      id: `alert-${topProduct.id}-concentration`,
      title: `${topProduct.title} is carrying too much of the board`,
      severity: "medium",
      category: "Merchandising",
      status: "investigating",
      evidence: `${topProduct.title} now represents ${topProduct.revenueShare} of synced revenue, which is a win but also a concentration risk if creative or inventory softens.`,
      impact:
        "Hero-SKU concentration is useful until fatigue or stock pressure hits, at which point the revenue curve becomes more fragile.",
      nextStep:
        "Protect the hero SKU with supporting creative and monitor inventory and attachment opportunities around it.",
      href: buildBrandPath(brandId, `/products/${topProduct.id}`)
    });
  }

  const latestMetric = storeMetrics[0];
  const previousMetric = storeMetrics[1];

  if (latestMetric && previousMetric && latestMetric.repeatPurchaseRate < previousMetric.repeatPurchaseRate) {
    alerts.push({
      id: "alert-repeat-rate-slide",
      title: "Repeat purchase rate slipped in the latest commerce snapshot",
      severity: "medium",
      category: "Retention",
      status: "open",
      evidence: `Repeat purchase moved from ${formatPercent(previousMetric.repeatPurchaseRate)} to ${formatPercent(latestMetric.repeatPurchaseRate)} in the latest synced window.`,
      impact:
        "A softer repeat rate puts more pressure on acquisition efficiency and makes the revenue mix less resilient.",
      nextStep:
        "Route the highest-intent product into a replenishment angle and tighten the lifecycle follow-up plan.",
      href: buildBrandPath(brandId, "/retention")
    });
  }

  return alerts;
}

function getCommerceDerivedBrief(brandId: string): WorkspaceBrief | null {
  const workspace = getWorkspaceContext(brandId);
  const catalogProducts = [...listDerivedCatalogProducts(brandId)];
  const storeMetrics = listDerivedStoreMetrics(brandId);
  const latestMetric = storeMetrics[0];

  if (catalogProducts.length === 0 || !latestMetric) {
    return null;
  }

  const previousMetric = storeMetrics[1];
  const rankedProducts = catalogProducts.sort(
    (left, right) => extractFirstNumber(right.revenueShare) - extractFirstNumber(left.revenueShare)
  );
  const topProduct = rankedProducts[0];
  const watchProducts = rankedProducts.filter((product) => product.status === "watch");
  const revenueDelta = previousMetric
    ? formatDelta(latestMetric.revenue, previousMetric.revenue)
    : "+0.0%";
  const repeatDelta = previousMetric
    ? formatDelta(latestMetric.repeatPurchaseRate, previousMetric.repeatPurchaseRate)
    : "+0.0%";
  const weekEnd = latestMetric.metricDate;
  const weekStart = shiftIsoDate(weekEnd, -6);
  const nextActions: WorkspaceNextAction[] = [
    {
      title: `Scale ${topProduct.title} while it is carrying the board`,
      description:
        "Turn the hero SKU into the default content and merchandising anchor so the team compounds what is already working.",
      owner: workspace.activeUser.name,
      dueLabel: "Today",
      href: buildBrandPath(brandId, `/products/${topProduct.id}`)
    },
    ...(watchProducts[0]
      ? [
          {
            title: `Fix conversion friction on ${watchProducts[0].title}`,
            description:
              "Use the synced watch signal to tighten PDP clarity and align the content message with the real point of hesitation.",
            owner: workspace.users[1]?.name ?? workspace.activeUser.name,
            dueLabel: "This week",
            href: buildBrandPath(brandId, `/products/${watchProducts[0].id}`)
          }
        ]
      : []),
    {
      title: "Convert the winning commerce signal into content",
      description:
        "Use the content studio to turn the current top product and its proof angle into creator-ready assets fast.",
      owner: workspace.users[2]?.name ?? workspace.activeUser.name,
      dueLabel: "This week",
      href: buildBrandPath(brandId, "/content")
    }
  ];

  const topWins: WorkspaceInsight[] = [
    {
      title: `Revenue is ${revenueDelta} versus the prior synced day`,
      description:
        "The command center is now picking up live commerce movement, which means the weekly operating rhythm can start from real store momentum."
    },
    {
      title: `${topProduct.title} is the clearest hero product right now`,
      description: `${topProduct.title} is contributing ${topProduct.revenueShare} of synced revenue and should shape both the content narrative and the merchandising priority stack.`
    }
  ];

  if (extractFirstNumber(repeatDelta) >= 0) {
    topWins.push({
      title: `Repeat purchase is moving in the right direction (${repeatDelta})`,
      description:
        "The latest synced snapshot suggests lifecycle and product-market fit are strong enough to justify a more deliberate replenishment narrative."
    });
  }

  const topRisks: WorkspaceInsight[] = [
    ...(watchProducts[0]
      ? [
          {
            title: `${watchProducts[0].title} needs intervention`,
            description: `${watchProducts[0].summary} The synced watch status means this product is consuming demand without converting cleanly enough.`
          }
        ]
      : []),
    {
      title: "The board is concentrated around one hero SKU",
      description:
        "That is useful for focus, but it also means creative fatigue, stock issues, or PDP friction on the hero product will have an outsized effect."
    }
  ];

  const whyItChanged: WorkspaceInsight[] = [
    {
      title: `${topProduct.title} is carrying the strongest proof loop`,
      description: topProduct.heroMessage
    },
    {
      title: "The Shopify sync is now creating a sharper product hierarchy",
      description:
        "Instead of a generic queue, the workspace can now separate hero products from watchlist products based on actual revenue and conversion signals."
    }
  ];

  if (watchProducts[0]) {
    whyItChanged.push({
      title: `${watchProducts[0].title} is showing conversion friction`,
      description: `${watchProducts[0].watchout} That tension is now visible in the synced product layer and should feed both PDP and content decisions.`
    });
  }

  return {
    id: "latest",
    title: `${workspace.name} weekly operating brief`,
    weekLabel: `Week ending ${formatDateLabel(weekEnd)}`,
    weekStart,
    weekEnd,
    status: "sent",
    summary: `${workspace.name} is now operating on synced Shopify data: revenue is ${revenueDelta}, ${topProduct.title} is leading the board, and ${watchProducts.length} ${pluralize(watchProducts.length, "product")} currently need intervention.`,
    audience: "Founders and operators",
    highlightsCount: topWins.length + topRisks.length,
    actionsCount: nextActions.length,
    topWins,
    topRisks,
    whyItChanged,
    nextActions
  };
}

function getIntegrationLabel(provider: string) {
  switch (provider) {
    case "shopify":
      return "Shopify";
    case "meta":
      return "Meta";
    case "ga4":
      return "GA4";
    case "klaviyo":
      return "Klaviyo";
    default:
      return provider;
  }
}

export function listIntegrationViews(brandId: string): WorkspaceIntegrationView[] {
  const workspace = getWorkspaceContext(brandId);
  const seed = getBrandSeed(brandId);

  return workspace.integrations.map((integration) => {
    const providerSeed = seed.integrations[integration.provider];

    return {
      provider: integration.provider,
      label: getIntegrationLabel(integration.provider),
      status: integration.status,
      accountLabel: providerSeed?.accountLabel ?? "Configured provider",
      coverage: providerSeed?.coverage ?? "Operational data source",
      note: providerSeed?.note ?? "Provider state is available in the workspace.",
      lastSyncedAt: integration.lastSyncedAt,
      lastSyncedLabel: formatTimestampLabel(integration.lastSyncedAt),
      actionLabel:
        integration.status === "connected"
          ? "Sync Now"
          : integration.status === "degraded"
            ? "Reconnect"
            : "Connect"
    };
  });
}

export function listWorkspaceAlerts(brandId: string): WorkspaceAlert[] {
  const workspace = getWorkspaceContext(brandId);
  const seed = getBrandSeed(brandId);
  const alertSeed = getCommerceDerivedAlerts(brandId);
  const defaultOwner = workspace.activeUser.name;

  return (alertSeed.length > 0 ? alertSeed : seed.alerts).map((alert, index) => ({
    ...alert,
    owner: workspace.users[index % workspace.users.length]?.name ?? defaultOwner
  }));
}

export function listWorkspaceBriefs(brandId: string) {
  const derivedBrief = getCommerceDerivedBrief(brandId);
  const seedBriefs = getBrandSeed(brandId).briefs.filter((brief) => brief.id !== "latest");

  return derivedBrief ? [derivedBrief, ...seedBriefs] : getBrandSeed(brandId).briefs;
}

export function getWorkspaceBrief(brandId: string, briefId: string) {
  const briefs = listWorkspaceBriefs(brandId);

  if (briefId === "latest") {
    return briefs[0] ?? null;
  }

  return briefs.find((brief) => brief.id === briefId) ?? null;
}

export function getLatestWorkspaceBrief(brandId: string) {
  return listWorkspaceBriefs(brandId)[0] ?? null;
}

export function listWorkspaceInboxItems(brandId: string): WorkspaceInboxFeedItem[] {
  const approvals = listApprovalItems(brandId);
  const publishJobs = listPublishJobs(brandId);
  const readyDrafts = listReadyToPublishDrafts(brandId);
  const seedItems = getBrandSeed(brandId).inbox.filter((item) => {
    if (item.kind === "approval" && approvals.length > 0) {
      return false;
    }

    if (item.href === buildBrandPath(brandId, "/publishing") && publishJobs.length > 0) {
      return false;
    }

    return true;
  });
  const workflowItems: WorkspaceInboxItem[] = [
    ...approvals
      .filter(
        (draft) =>
          draft.status === "ready_for_approval" || draft.status === "changes_requested"
      )
      .map((draft) => ({
        id: `workflow-approval-${draft.id}`,
        kind: "approval" as const,
        title:
          draft.status === "changes_requested"
            ? `${draft.title} needs another pass`
            : `${draft.title} is ready for approval`,
        summary:
          draft.status === "changes_requested"
            ? "A reviewer sent this draft back for revision. Tighten the copy and resubmit when it is ready."
            : "A draft is waiting for a review decision before it can move into publishing.",
        state: "needs_review" as const,
        receivedAt: draft.updatedAt,
        actionLabel: "Open draft",
        href: draft.href
      })),
    ...readyDrafts.map((draft) => ({
      id: `workflow-ready-${draft.id}`,
      kind: "system" as const,
      title: `${draft.title} is approved and ready to schedule`,
      summary:
        "This draft has cleared approval and is waiting for a scheduling or publish-now decision.",
      state: "open" as const,
      receivedAt: draft.updatedAt,
      actionLabel: "Open publishing",
      href: buildBrandPath(brandId, "/publishing")
    })),
    ...publishJobs
      .filter((job) => job.status === "failed" || job.status === "scheduled")
      .map((job) => ({
        id: `workflow-publish-${job.id}`,
        kind: job.status === "failed" ? ("alert" as const) : ("system" as const),
        title:
          job.status === "failed"
            ? `${job.draftTitle} failed to publish`
            : `${job.draftTitle} is scheduled to go live`,
        summary:
          job.status === "failed"
            ? job.failureReason ?? "A publish job failed and needs a retry decision."
            : `Delivery is queued for ${job.scheduledForLabel}.`,
        state: job.status === "failed" ? ("open" as const) : ("scheduled" as const),
        receivedAt: job.updatedAt,
        actionLabel: "Open publishing",
        href: buildBrandPath(brandId, "/publishing")
      }))
  ];

  return [...seedItems, ...workflowItems]
    .map((item) => ({
      ...item,
      state: getInboxOverride(brandId, item.id)?.state ?? item.state,
      receivedAtLabel: formatTimestampLabel(item.receivedAt)
    }))
    .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt));
}

export async function listWorkspaceInboxItemsAsync(
  brandId: string
): Promise<WorkspaceInboxFeedItem[]> {
  const approvals = await listApprovalItemsAsync(brandId);
  const publishJobs = await listPublishJobsAsync(brandId);
  const readyDrafts = await listReadyToPublishDraftsAsync(brandId);
  const allowSeedFallback = !shouldEnforceSupabaseHostedAccess();
  const seedItems = allowSeedFallback
    ? getBrandSeed(brandId).inbox.filter((item) => {
        if (item.kind === "approval" && approvals.length > 0) {
          return false;
        }

        if (item.href === buildBrandPath(brandId, "/publishing") && publishJobs.length > 0) {
          return false;
        }

        return true;
      })
    : [];
  const workflowItems: WorkspaceInboxItem[] = [
    ...approvals
      .filter(
        (draft) =>
          draft.status === "ready_for_approval" || draft.status === "changes_requested"
      )
      .map((draft) => ({
        id: `workflow-approval-${draft.id}`,
        kind: "approval" as const,
        title:
          draft.status === "changes_requested"
            ? `${draft.title} needs another pass`
            : `${draft.title} is ready for approval`,
        summary:
          draft.status === "changes_requested"
            ? "A reviewer sent this draft back for revision. Tighten the copy and resubmit when it is ready."
            : "A draft is waiting for a review decision before it can move into publishing.",
        state: "needs_review" as const,
        receivedAt: draft.updatedAt,
        actionLabel: "Open draft",
        href: draft.href
      })),
    ...readyDrafts.map((draft) => ({
      id: `workflow-ready-${draft.id}`,
      kind: "system" as const,
      title: `${draft.title} is approved and ready to schedule`,
      summary:
        "This draft has cleared approval and is waiting for a scheduling or publish-now decision.",
      state: "open" as const,
      receivedAt: draft.updatedAt,
      actionLabel: "Open publishing",
      href: buildBrandPath(brandId, "/publishing")
    })),
    ...publishJobs
      .filter((job) => job.status === "failed" || job.status === "scheduled")
      .map((job) => ({
        id: `workflow-publish-${job.id}`,
        kind: job.status === "failed" ? ("alert" as const) : ("system" as const),
        title:
          job.status === "failed"
            ? `${job.draftTitle} failed to publish`
            : `${job.draftTitle} is scheduled to go live`,
        summary:
          job.status === "failed"
            ? job.failureReason ?? "A publish job failed and needs a retry decision."
            : `Delivery is queued for ${job.scheduledForLabel}.`,
        state: job.status === "failed" ? ("open" as const) : ("scheduled" as const),
        receivedAt: job.updatedAt,
        actionLabel: "Open publishing",
        href: buildBrandPath(brandId, "/publishing")
      }))
  ];

  return [...seedItems, ...workflowItems]
    .map((item) => ({
      ...item,
      state: getInboxOverride(brandId, item.id)?.state ?? item.state,
      receivedAtLabel: formatTimestampLabel(item.receivedAt)
    }))
    .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt));
}

async function getWorkflowWinsAsync(brandId: string): Promise<WorkspaceInsight[]> {
  const publishJobs = await listPublishJobsAsync(brandId);
  const publishedJobs = publishJobs.filter((job) => job.status === "published");
  const scheduledJobs = publishJobs.filter((job) => job.status === "scheduled");
  const wins: WorkspaceInsight[] = [];

  if (publishedJobs.length > 0) {
    wins.push({
      title: `${publishedJobs.length} ${pluralize(publishedJobs.length, "asset")} already published`,
      description:
        "The publishing layer is now shipping approved work instead of keeping execution trapped inside draft review."
    });
  }

  if (scheduledJobs.length > 0) {
    wins.push({
      title: `${scheduledJobs.length} ${pluralize(scheduledJobs.length, "asset")} scheduled`,
      description:
        "Approved drafts are already moving through the publish queue, which keeps the weekly plan operational instead of theoretical."
    });
  }

  return wins;
}

async function getWorkflowRisksAsync(brandId: string): Promise<WorkspaceInsight[]> {
  const approvals = await listApprovalItemsAsync(brandId);
  const publishJobs = await listPublishJobsAsync(brandId);
  const risks: WorkspaceInsight[] = [];
  const requestedChanges = approvals.filter((draft) => draft.status === "changes_requested");
  const failedJobs = publishJobs.filter((job) => job.status === "failed");

  if (requestedChanges.length > 0) {
    risks.push({
      title: `${requestedChanges.length} ${pluralize(requestedChanges.length, "draft")} sent back for revision`,
      description:
        "The review loop is active, but those drafts will block throughput until the team makes another pass."
    });
  }

  if (failedJobs.length > 0) {
    risks.push({
      title: `${failedJobs.length} ${pluralize(failedJobs.length, "publish job")} failed`,
      description:
        "The publishing queue needs intervention before the team can trust delivery timing and completion state."
    });
  }

  return risks;
}

async function getWorkflowNextActionsAsync(
  brandId: string,
  owner: string
): Promise<WorkspaceNextAction[]> {
  const approvals = await listApprovalItemsAsync(brandId);
  const publishJobs = await listPublishJobsAsync(brandId);
  const readyDrafts = await listReadyToPublishDraftsAsync(brandId);
  const nextActions: WorkspaceNextAction[] = [];
  const pendingApprovals = approvals.filter((draft) => draft.status === "ready_for_approval");
  const failedJobs = publishJobs.filter((job) => job.status === "failed");

  if (pendingApprovals.length > 0) {
    nextActions.push({
      title: `Review ${pendingApprovals.length} ${pluralize(pendingApprovals.length, "approval item")}`,
      description:
        "Clear the approval queue so validated drafts can move into publishing without sitting idle.",
      owner,
      dueLabel: "Today",
      href: buildBrandPath(brandId, "/approvals")
    });
  }

  if (failedJobs.length > 0) {
    nextActions.push({
      title: `Retry ${failedJobs.length} failed ${pluralize(failedJobs.length, "publish job")}`,
      description:
        "Fix failed delivery before the publish queue drifts away from what the team thinks is live.",
      owner,
      dueLabel: "Today",
      href: buildBrandPath(brandId, "/publishing")
    });
  }

  if (readyDrafts.length > 0) {
    nextActions.push({
      title: `Schedule ${readyDrafts.length} approved ${pluralize(readyDrafts.length, "draft")}`,
      description:
        "These drafts are cleared and waiting for a concrete publish decision.",
      owner,
      dueLabel: "Today",
      href: buildBrandPath(brandId, "/publishing")
    });
  }

  return nextActions;
}

async function getWorkflowPulseAsync(
  brandId: string
): Promise<WorkspaceWorkflowSignal[]> {
  const approvals = await listApprovalItemsAsync(brandId);
  const publishJobs = await listPublishJobsAsync(brandId);
  const readyDrafts = await listReadyToPublishDraftsAsync(brandId);
  const pendingApprovals = approvals.filter((draft) => draft.status === "ready_for_approval");
  const requestedChanges = approvals.filter((draft) => draft.status === "changes_requested");
  const failedJobs = publishJobs.filter((job) => job.status === "failed");
  const scheduledJobs = publishJobs.filter((job) => job.status === "scheduled");
  const signals: WorkspaceWorkflowSignal[] = [];

  if (pendingApprovals.length > 0) {
    signals.push({
      title: `${pendingApprovals.length} ${pluralize(pendingApprovals.length, "draft")} awaiting approval`,
      description:
        "The team has working content ready for a decision, and clearing this queue will unlock publishing throughput.",
      tone: "warning",
      href: buildBrandPath(brandId, "/approvals"),
      actionLabel: "Review approvals"
    });
  }

  if (requestedChanges.length > 0) {
    signals.push({
      title: `${requestedChanges.length} ${pluralize(requestedChanges.length, "draft")} needs revision`,
      description:
        "Feedback is already in motion, but those drafts need another pass before they can move forward.",
      tone: "danger",
      href: buildBrandPath(brandId, "/content"),
      actionLabel: "Open content studio"
    });
  }

  if (readyDrafts.length > 0) {
    signals.push({
      title: `${readyDrafts.length} ${pluralize(readyDrafts.length, "approved draft")} ready to schedule`,
      description:
        "Publishing can happen immediately without more copy work if the team is comfortable with timing and channel choice.",
      tone: "info",
      href: buildBrandPath(brandId, "/publishing"),
      actionLabel: "Open publishing"
    });
  }

  if (scheduledJobs.length > 0) {
    signals.push({
      title: `${scheduledJobs.length} ${pluralize(scheduledJobs.length, "job")} already queued`,
      description:
        "The publish queue is active and timing-sensitive assets are already staged for delivery.",
      tone: "positive",
      href: buildBrandPath(brandId, "/publishing"),
      actionLabel: "View queue"
    });
  }

  if (failedJobs.length > 0) {
    signals.push({
      title: `${failedJobs.length} ${pluralize(failedJobs.length, "job")} failed to publish`,
      description:
        "A delivery failure is now an operational issue and should be triaged like any other workflow alert.",
      tone: "danger",
      href: buildBrandPath(brandId, "/publishing"),
      actionLabel: "Retry jobs"
    });
  }

  return signals;
}

function getWorkflowWins(brandId: string): WorkspaceInsight[] {
  const publishJobs = listPublishJobs(brandId);
  const publishedJobs = publishJobs.filter((job) => job.status === "published");
  const scheduledJobs = publishJobs.filter((job) => job.status === "scheduled");
  const wins: WorkspaceInsight[] = [];

  if (publishedJobs.length > 0) {
    wins.push({
      title: `${publishedJobs.length} ${pluralize(publishedJobs.length, "asset")} already published`,
      description:
        "The publishing layer is now shipping approved work instead of keeping execution trapped inside draft review."
    });
  }

  if (scheduledJobs.length > 0) {
    wins.push({
      title: `${scheduledJobs.length} ${pluralize(scheduledJobs.length, "asset")} scheduled`,
      description:
        "Approved drafts are already moving through the publish queue, which keeps the weekly plan operational instead of theoretical."
    });
  }

  return wins;
}

function getWorkflowRisks(brandId: string): WorkspaceInsight[] {
  const approvals = listApprovalItems(brandId);
  const publishJobs = listPublishJobs(brandId);
  const risks: WorkspaceInsight[] = [];
  const requestedChanges = approvals.filter((draft) => draft.status === "changes_requested");
  const failedJobs = publishJobs.filter((job) => job.status === "failed");

  if (requestedChanges.length > 0) {
    risks.push({
      title: `${requestedChanges.length} ${pluralize(requestedChanges.length, "draft")} sent back for revision`,
      description:
        "The review loop is active, but those drafts will block throughput until the team makes another pass."
    });
  }

  if (failedJobs.length > 0) {
    risks.push({
      title: `${failedJobs.length} ${pluralize(failedJobs.length, "publish job")} failed`,
      description:
        "The publishing queue needs intervention before the team can trust delivery timing and completion state."
    });
  }

  return risks;
}

function getWorkflowNextActions(
  brandId: string,
  owner: string
): WorkspaceNextAction[] {
  const approvals = listApprovalItems(brandId);
  const publishJobs = listPublishJobs(brandId);
  const readyDrafts = listReadyToPublishDrafts(brandId);
  const nextActions: WorkspaceNextAction[] = [];
  const pendingApprovals = approvals.filter((draft) => draft.status === "ready_for_approval");
  const failedJobs = publishJobs.filter((job) => job.status === "failed");

  if (pendingApprovals.length > 0) {
    nextActions.push({
      title: `Review ${pendingApprovals.length} ${pluralize(pendingApprovals.length, "approval item")}`,
      description:
        "Clear the approval queue so validated drafts can move into publishing without sitting idle.",
      owner,
      dueLabel: "Today",
      href: buildBrandPath(brandId, "/approvals")
    });
  }

  if (failedJobs.length > 0) {
    nextActions.push({
      title: `Retry ${failedJobs.length} failed ${pluralize(failedJobs.length, "publish job")}`,
      description:
        "Fix failed delivery before the publish queue drifts away from what the team thinks is live.",
      owner,
      dueLabel: "Today",
      href: buildBrandPath(brandId, "/publishing")
    });
  }

  if (readyDrafts.length > 0) {
    nextActions.push({
      title: `Schedule ${readyDrafts.length} approved ${pluralize(readyDrafts.length, "draft")}`,
      description:
        "These drafts are cleared and waiting for a concrete publish decision.",
      owner,
      dueLabel: "Today",
      href: buildBrandPath(brandId, "/publishing")
    });
  }

  return nextActions;
}

function getWorkflowPulse(brandId: string): WorkspaceWorkflowSignal[] {
  const approvals = listApprovalItems(brandId);
  const publishJobs = listPublishJobs(brandId);
  const readyDrafts = listReadyToPublishDrafts(brandId);
  const pendingApprovals = approvals.filter((draft) => draft.status === "ready_for_approval");
  const requestedChanges = approvals.filter((draft) => draft.status === "changes_requested");
  const failedJobs = publishJobs.filter((job) => job.status === "failed");
  const scheduledJobs = publishJobs.filter((job) => job.status === "scheduled");
  const signals: WorkspaceWorkflowSignal[] = [];

  if (pendingApprovals.length > 0) {
    signals.push({
      title: `${pendingApprovals.length} ${pluralize(pendingApprovals.length, "draft")} awaiting approval`,
      description:
        "The team has working content ready for a decision, and clearing this queue will unlock publishing throughput.",
      tone: "warning",
      href: buildBrandPath(brandId, "/approvals"),
      actionLabel: "Review approvals"
    });
  }

  if (requestedChanges.length > 0) {
    signals.push({
      title: `${requestedChanges.length} ${pluralize(requestedChanges.length, "draft")} needs revision`,
      description:
        "Feedback is already in motion, but those drafts need another pass before they can move forward.",
      tone: "danger",
      href: buildBrandPath(brandId, "/content"),
      actionLabel: "Open content studio"
    });
  }

  if (readyDrafts.length > 0) {
    signals.push({
      title: `${readyDrafts.length} ${pluralize(readyDrafts.length, "approved draft")} ready to schedule`,
      description:
        "Publishing can happen immediately without more copy work if the team is comfortable with timing and channel choice.",
      tone: "info",
      href: buildBrandPath(brandId, "/publishing"),
      actionLabel: "Open publishing"
    });
  }

  if (scheduledJobs.length > 0) {
    signals.push({
      title: `${scheduledJobs.length} ${pluralize(scheduledJobs.length, "job")} already queued`,
      description:
        "The publish queue is active and timing-sensitive assets are already staged for delivery.",
      tone: "positive",
      href: buildBrandPath(brandId, "/publishing"),
      actionLabel: "View queue"
    });
  }

  if (failedJobs.length > 0) {
    signals.push({
      title: `${failedJobs.length} ${pluralize(failedJobs.length, "job")} failed to publish`,
      description:
        "A delivery failure is now an operational issue and should be triaged like any other workflow alert.",
      tone: "danger",
      href: buildBrandPath(brandId, "/publishing"),
      actionLabel: "Retry jobs"
    });
  }

  return signals;
}

export function getWorkspaceOverview(brandId: string): WorkspaceOverviewData {
  const seed = getBrandSeed(brandId);
  const workspace = getWorkspaceContext(brandId);
  const catalogProducts = listDerivedCatalogProducts(brandId);
  const storeMetrics = listDerivedStoreMetrics(brandId);
  const latestMetric = storeMetrics[0];
  const previousMetric = storeMetrics[1];
  const alerts = listWorkspaceAlerts(brandId);
  const pendingApprovals = listApprovalItems(brandId).filter(
    (draft) => draft.status === "ready_for_approval"
  ).length;
  const publishFailures = listPublishJobs(brandId).filter(
    (job) => job.status === "failed"
  ).length;
  const approvedToSchedule = listReadyToPublishDrafts(brandId).length;
  const seededActions = seed.nextActions.map((action, index) => ({
    ...action,
    owner: workspace.users[index % workspace.users.length]?.name ?? workspace.activeUser.name
  }));
  const workflowActions = getWorkflowNextActions(brandId, workspace.activeUser.name);
  const workflowWins = getWorkflowWins(brandId);
  const workflowRisks = getWorkflowRisks(brandId);
  const workflowPulse = getWorkflowPulse(brandId);
  const topCommerceProduct = catalogProducts[0];
  const derivedKpis =
    latestMetric && previousMetric
      ? [
          {
            id: "revenue",
            label: "Revenue",
            value: formatCurrency(latestMetric.revenue),
            delta: formatDelta(latestMetric.revenue, previousMetric.revenue),
            note: "Now sourced from synced Shopify store metrics."
          },
          {
            id: "aov",
            label: "AOV",
            value: formatCurrency(latestMetric.aov),
            delta: formatDelta(latestMetric.aov, previousMetric.aov),
            note: "Average order value from the latest commerce snapshot."
          },
          {
            id: "conversion",
            label: "Conversion rate",
            value: formatPercent(latestMetric.conversionRate),
            delta: formatDelta(latestMetric.conversionRate, previousMetric.conversionRate),
            note: "Sessions and orders are now tied to the synced storefront."
          },
          {
            id: "repeat_purchase",
            label: "Repeat purchase",
            value: formatPercent(latestMetric.repeatPurchaseRate),
            delta: formatDelta(
              latestMetric.repeatPurchaseRate,
              previousMetric.repeatPurchaseRate
            ),
            note: "Returning-customer behavior from daily store metrics."
          }
        ]
      : seed.kpis;
  const derivedWins =
    catalogProducts.length > 0 && topCommerceProduct
      ? [
          {
            title: `${topCommerceProduct.title} is leading the synced product board`,
            description: `${topCommerceProduct.revenueShare} of current revenue is concentrated in this SKU cluster, which gives the content and merchandising loops a sharper center of gravity.`
          },
          ...workflowWins,
          ...seed.wins
        ]
      : [...workflowWins, ...seed.wins];
  const derivedRisks =
    catalogProducts.filter((product) => product.status === "watch").length > 0
      ? [
          {
            title: `${catalogProducts.filter((product) => product.status === "watch").length} ${pluralize(
              catalogProducts.filter((product) => product.status === "watch").length,
              "synced product"
            )} needs intervention`,
            description:
              "The Shopify import is now identifying products that have enough friction to justify PDP, messaging, or lifecycle work."
          },
          ...workflowRisks,
          ...seed.risks
        ]
      : [...workflowRisks, ...seed.risks];

  return {
    description:
      catalogProducts.length > 0
        ? "Shopify-derived commerce data is now flowing into the command center, so this workspace is operating on synced store signals instead of placeholder scaffolding."
        : seed.description,
    kpis: derivedKpis,
    wins: derivedWins.slice(0, 4),
    risks: derivedRisks.slice(0, 4),
    nextActions: [...workflowActions, ...seededActions].slice(0, 5),
    pendingApprovals,
    openAlerts: alerts.filter((alert) => alert.status !== "assigned").length + publishFailures,
    publishFailures,
    approvedToSchedule,
    syncHealth: listIntegrationViews(brandId),
    workflowPulse
  };
}

async function getCommerceDerivedAlertsAsync(brandId: string): Promise<WorkspaceAlert[]> {
  const workspace = await getWorkspaceContextAsync(brandId);
  const catalogProducts = [...(await listSupabaseDerivedCatalogProducts(brandId))];
  const storeMetrics = await listSupabaseDerivedStoreMetrics(brandId);

  if (catalogProducts.length === 0) {
    return [];
  }

  const rankedProducts = catalogProducts.sort(
    (left, right) => extractFirstNumber(right.revenueShare) - extractFirstNumber(left.revenueShare)
  );
  const topProduct = rankedProducts[0];
  const watchProducts = rankedProducts.filter((product) => product.status === "watch");
  const alerts: WorkspaceAlert[] = watchProducts.slice(0, 2).map((product, index) => ({
    id: `alert-${product.id}-conversion`,
    title: `${product.title} is attracting demand without converting cleanly`,
    severity: index === 0 ? "high" : "medium",
    category: "Product",
    status: "open",
    owner: workspace.users[index % workspace.users.length]?.name ?? workspace.activeUser.name,
    evidence: `${product.summary} Conversion is ${product.conversionRate} (${product.conversionDelta}), so the synced watch signal is now a clear intervention flag.`,
    impact:
      "If the PDP and message stay unchanged, the team will keep paying for attention that is not turning into enough revenue.",
    nextStep:
      "Tighten the PDP framing and route the updated proof angle into the next content batch.",
    href: buildBrandPath(brandId, `/products/${product.id}`)
  }));

  if (topProduct && extractFirstNumber(topProduct.revenueShare) >= 25) {
    alerts.unshift({
      id: `alert-${topProduct.id}-concentration`,
      title: `${topProduct.title} is carrying too much of the board`,
      severity: "medium",
      category: "Merchandising",
      status: "investigating",
      owner: workspace.activeUser.name,
      evidence: `${topProduct.title} now represents ${topProduct.revenueShare} of synced revenue, which is a win but also a concentration risk if creative or inventory softens.`,
      impact:
        "Hero-SKU concentration is useful until fatigue or stock pressure hits, at which point the revenue curve becomes more fragile.",
      nextStep:
        "Protect the hero SKU with supporting creative and monitor inventory and attachment opportunities around it.",
      href: buildBrandPath(brandId, `/products/${topProduct.id}`)
    });
  }

  const latestMetric = storeMetrics[0];
  const previousMetric = storeMetrics[1];

  if (
    latestMetric &&
    previousMetric &&
    latestMetric.repeatPurchaseRate < previousMetric.repeatPurchaseRate
  ) {
    alerts.push({
      id: "alert-repeat-rate-slide",
      title: "Repeat purchase rate slipped in the latest commerce snapshot",
      severity: "medium",
      category: "Retention",
      status: "open",
      owner: workspace.activeUser.name,
      evidence: `Repeat purchase moved from ${formatPercent(previousMetric.repeatPurchaseRate)} to ${formatPercent(latestMetric.repeatPurchaseRate)} in the latest synced window.`,
      impact:
        "A softer repeat rate puts more pressure on acquisition efficiency and makes the revenue mix less resilient.",
      nextStep:
        "Route the highest-intent product into a replenishment angle and tighten the lifecycle follow-up plan.",
      href: buildBrandPath(brandId, "/retention")
    });
  }

  return alerts;
}

async function getCommerceDerivedBriefAsync(brandId: string): Promise<WorkspaceBrief | null> {
  const workspace = await getWorkspaceContextAsync(brandId);
  const catalogProducts = [...(await listSupabaseDerivedCatalogProducts(brandId))];
  const storeMetrics = await listSupabaseDerivedStoreMetrics(brandId);
  const latestMetric = storeMetrics[0];

  if (catalogProducts.length === 0 || !latestMetric) {
    return null;
  }

  const previousMetric = storeMetrics[1];
  const rankedProducts = catalogProducts.sort(
    (left, right) => extractFirstNumber(right.revenueShare) - extractFirstNumber(left.revenueShare)
  );
  const topProduct = rankedProducts[0];
  const watchProducts = rankedProducts.filter((product) => product.status === "watch");
  const revenueDelta = previousMetric
    ? formatDelta(latestMetric.revenue, previousMetric.revenue)
    : "+0.0%";
  const repeatDelta = previousMetric
    ? formatDelta(latestMetric.repeatPurchaseRate, previousMetric.repeatPurchaseRate)
    : "+0.0%";
  const weekEnd = latestMetric.metricDate;
  const weekStart = shiftIsoDate(weekEnd, -6);
  const nextActions: WorkspaceNextAction[] = [
    {
      title: `Scale ${topProduct.title} while it is carrying the board`,
      description:
        "Turn the hero SKU into the default content and merchandising anchor so the team compounds what is already working.",
      owner: workspace.activeUser.name,
      dueLabel: "Today",
      href: buildBrandPath(brandId, `/products/${topProduct.id}`)
    },
    ...(watchProducts[0]
      ? [
          {
            title: `Fix conversion friction on ${watchProducts[0].title}`,
            description:
              "Use the synced watch signal to tighten PDP clarity and align the content message with the real point of hesitation.",
            owner: workspace.users[1]?.name ?? workspace.activeUser.name,
            dueLabel: "This week",
            href: buildBrandPath(brandId, `/products/${watchProducts[0].id}`)
          }
        ]
      : []),
    {
      title: "Convert the winning commerce signal into content",
      description:
        "Use the content studio to turn the current top product and its proof angle into creator-ready assets fast.",
      owner: workspace.users[2]?.name ?? workspace.activeUser.name,
      dueLabel: "This week",
      href: buildBrandPath(brandId, "/content")
    }
  ];

  const topWins: WorkspaceInsight[] = [
    {
      title: `Revenue is ${revenueDelta} versus the prior synced day`,
      description:
        "The command center is now picking up live commerce movement, which means the weekly operating rhythm can start from real store momentum."
    },
    {
      title: `${topProduct.title} is the clearest hero product right now`,
      description: `${topProduct.title} is contributing ${topProduct.revenueShare} of synced revenue and should shape both the content narrative and the merchandising priority stack.`
    }
  ];

  if (extractFirstNumber(repeatDelta) >= 0) {
    topWins.push({
      title: `Repeat purchase is moving in the right direction (${repeatDelta})`,
      description:
        "The latest synced snapshot suggests lifecycle and product-market fit are strong enough to justify a more deliberate replenishment narrative."
    });
  }

  const topRisks: WorkspaceInsight[] = [
    ...(watchProducts[0]
      ? [
          {
            title: `${watchProducts[0].title} needs intervention`,
            description: `${watchProducts[0].summary} The synced watch status means this product is consuming demand without converting cleanly enough.`
          }
        ]
      : []),
    {
      title: "The board is concentrated around one hero SKU",
      description:
        "That is useful for focus, but it also means creative fatigue, stock issues, or PDP friction on the hero product will have an outsized effect."
    }
  ];

  const whyItChanged: WorkspaceInsight[] = [
    {
      title: `${topProduct.title} is carrying the strongest proof loop`,
      description: topProduct.heroMessage
    },
    {
      title: "The Shopify sync is now creating a sharper product hierarchy",
      description:
        "Instead of a generic queue, the workspace can now separate hero products from watchlist products based on actual revenue and conversion signals."
    }
  ];

  if (watchProducts[0]) {
    whyItChanged.push({
      title: `${watchProducts[0].title} is showing conversion friction`,
      description: `${watchProducts[0].watchout} That tension is now visible in the synced product layer and should feed both PDP and content decisions.`
    });
  }

  return {
    id: "latest",
    title: `${workspace.name} weekly operating brief`,
    weekLabel: `Week ending ${formatDateLabel(weekEnd)}`,
    weekStart,
    weekEnd,
    status: "sent",
    summary: `${workspace.name} is now operating on synced Shopify data: revenue is ${revenueDelta}, ${topProduct.title} is leading the board, and ${watchProducts.length} ${pluralize(watchProducts.length, "product")} currently need intervention.`,
    audience: "Founders and operators",
    highlightsCount: topWins.length + topRisks.length,
    actionsCount: nextActions.length,
    topWins,
    topRisks,
    whyItChanged,
    nextActions
  };
}

export async function listWorkspaceAlertsAsync(brandId: string): Promise<WorkspaceAlert[]> {
  const workspace = await getWorkspaceContextAsync(brandId);
  const seed = getBrandSeed(brandId);
  const alertSeed = await getCommerceDerivedAlertsAsync(brandId);
  const defaultOwner = workspace.activeUser.name;

  return (alertSeed.length > 0 ? alertSeed : seed.alerts).map((alert, index) => ({
    ...alert,
    owner: workspace.users[index % workspace.users.length]?.name ?? defaultOwner
  }));
}

export async function listWorkspaceBriefsAsync(brandId: string): Promise<WorkspaceBrief[]> {
  const derivedBrief = await getCommerceDerivedBriefAsync(brandId);
  const seedBriefs = getBrandSeed(brandId).briefs.filter((brief) => brief.id !== "latest");

  return derivedBrief ? [derivedBrief, ...seedBriefs] : getBrandSeed(brandId).briefs;
}

export async function getWorkspaceBriefAsync(
  brandId: string,
  briefId: string
): Promise<WorkspaceBrief | null> {
  const briefs = await listWorkspaceBriefsAsync(brandId);

  if (briefId === "latest") {
    return briefs[0] ?? null;
  }

  return briefs.find((brief) => brief.id === briefId) ?? null;
}

export async function getLatestWorkspaceBriefAsync(brandId: string) {
  return (await listWorkspaceBriefsAsync(brandId))[0] ?? null;
}

export async function getWorkspaceOverviewAsync(
  brandId: string
): Promise<WorkspaceOverviewData> {
  const seed = getBrandSeed(brandId);
  const workspace = await getWorkspaceContextAsync(brandId);
  const catalogProducts = await listSupabaseDerivedCatalogProducts(brandId);
  const storeMetrics = await listSupabaseDerivedStoreMetrics(brandId);
  const latestMetric = storeMetrics[0];
  const previousMetric = storeMetrics[1];
  const alerts = await listWorkspaceAlertsAsync(brandId);
  const approvals = await listApprovalItemsAsync(brandId);
  const publishJobs = await listPublishJobsAsync(brandId);
  const readyDrafts = await listReadyToPublishDraftsAsync(brandId);
  const pendingApprovals = approvals.filter(
    (draft) => draft.status === "ready_for_approval"
  ).length;
  const publishFailures = publishJobs.filter(
    (job) => job.status === "failed"
  ).length;
  const approvedToSchedule = readyDrafts.length;
  const seededActions = seed.nextActions.map((action, index) => ({
    ...action,
    owner: workspace.users[index % workspace.users.length]?.name ?? workspace.activeUser.name
  }));
  const workflowActions = await getWorkflowNextActionsAsync(brandId, workspace.activeUser.name);
  const workflowWins = await getWorkflowWinsAsync(brandId);
  const workflowRisks = await getWorkflowRisksAsync(brandId);
  const workflowPulse = await getWorkflowPulseAsync(brandId);
  const topCommerceProduct = catalogProducts[0];
  const derivedKpis =
    latestMetric && previousMetric
      ? [
          {
            id: "revenue",
            label: "Revenue",
            value: formatCurrency(latestMetric.revenue),
            delta: formatDelta(latestMetric.revenue, previousMetric.revenue),
            note: "Now sourced from synced Shopify store metrics."
          },
          {
            id: "aov",
            label: "AOV",
            value: formatCurrency(latestMetric.aov),
            delta: formatDelta(latestMetric.aov, previousMetric.aov),
            note: "Average order value from the latest commerce snapshot."
          },
          {
            id: "conversion",
            label: "Conversion rate",
            value: formatPercent(latestMetric.conversionRate),
            delta: formatDelta(latestMetric.conversionRate, previousMetric.conversionRate),
            note: "Sessions and orders are now tied to the synced storefront."
          },
          {
            id: "repeat_purchase",
            label: "Repeat purchase",
            value: formatPercent(latestMetric.repeatPurchaseRate),
            delta: formatDelta(
              latestMetric.repeatPurchaseRate,
              previousMetric.repeatPurchaseRate
            ),
            note: "Returning-customer behavior from daily store metrics."
          }
        ]
      : seed.kpis;
  const derivedWins =
    catalogProducts.length > 0 && topCommerceProduct
      ? [
          {
            title: `${topCommerceProduct.title} is leading the synced product board`,
            description: `${topCommerceProduct.revenueShare} of current revenue is concentrated in this SKU cluster, which gives the content and merchandising loops a sharper center of gravity.`
          },
          ...workflowWins,
          ...seed.wins
        ]
      : [...workflowWins, ...seed.wins];
  const derivedRisks =
    catalogProducts.filter((product) => product.status === "watch").length > 0
      ? [
          {
            title: `${catalogProducts.filter((product) => product.status === "watch").length} ${pluralize(
              catalogProducts.filter((product) => product.status === "watch").length,
              "synced product"
            )} needs intervention`,
            description:
              "The Shopify import is now identifying products that have enough friction to justify PDP, messaging, or lifecycle work."
          },
          ...workflowRisks,
          ...seed.risks
        ]
      : [...workflowRisks, ...seed.risks];

  return {
    description:
      catalogProducts.length > 0
        ? "Shopify-derived commerce data is now flowing into the command center, so this workspace is operating on synced store signals instead of placeholder scaffolding."
        : seed.description,
    kpis: derivedKpis,
    wins: derivedWins.slice(0, 4),
    risks: derivedRisks.slice(0, 4),
    nextActions: [...workflowActions, ...seededActions].slice(0, 5),
    pendingApprovals,
    openAlerts: alerts.filter((alert) => alert.status !== "assigned").length + publishFailures,
    publishFailures,
    approvedToSchedule,
    syncHealth: await listPlatformIntegrationViews(brandId),
    workflowPulse
  };
}

export function getWorkspaceOperatingData(brandId: string) {
  return {
    overview: getWorkspaceOverview(brandId),
    alerts: listWorkspaceAlerts(brandId),
    briefs: listWorkspaceBriefs(brandId),
    latestBrief: getLatestWorkspaceBrief(brandId),
    inbox: listWorkspaceInboxItems(brandId),
    integrations: listIntegrationViews(brandId)
  };
}
