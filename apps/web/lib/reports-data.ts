import "server-only";

import { getCustomerOpsNarrative, listCxIssues, listRetentionSignals, listSupportClusters } from "./customer-ops-data";
import { listTrendSignals, listCompetitorObservations } from "./market-intelligence-data";
import {
  getLatestWorkspaceBrief,
  getLatestWorkspaceBriefAsync,
  getWorkspaceOverview,
  getWorkspaceOverviewAsync,
  listWorkspaceAlerts,
  listWorkspaceAlertsAsync
} from "./operating-data";
import {
  formatDraftStatusLabel,
  listApprovalItems,
  listPublishJobs,
  listReadyToPublishDrafts
} from "./workflow-execution-data";
import { getWorkspaceContext, getWorkspaceContextAsync } from "./workspace-data";

export type ReportSummaryCard = {
  id: string;
  title: string;
  audience: string;
  description: string;
  keyPoints: string[];
  href: string;
};

export type ReportsDashboardData = {
  brandName: string;
  headline: string;
  generatedAtLabel: string;
  stats: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  summaryCards: ReportSummaryCard[];
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

function makeBulletLines(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function makeSection(title: string, items: string[]) {
  return `## ${title}\n${makeBulletLines(items)}\n`;
}

export function getReportsDashboardData(brandId: string): ReportsDashboardData {
  const workspace = getWorkspaceContext(brandId);
  const overview = getWorkspaceOverview(brandId);
  const latestBrief = getLatestWorkspaceBrief(brandId);
  const approvals = listApprovalItems(brandId);
  const publishJobs = listPublishJobs(brandId);
  const readyDrafts = listReadyToPublishDrafts(brandId);
  const retention = listRetentionSignals(brandId);
  const cxIssues = listCxIssues(brandId);
  const support = listSupportClusters(brandId);
  const trends = listTrendSignals(brandId);
  const competitors = listCompetitorObservations(brandId);

  return {
    brandName: workspace.name,
    headline:
      latestBrief?.summary ??
      `${workspace.name} now has enough operating context to generate founder and team reporting from inside the app.`,
    generatedAtLabel: formatTimestampLabel(new Date().toISOString()),
    stats: [
      {
        label: "Founder-ready brief",
        value: latestBrief?.weekLabel ?? "No brief yet",
        note: latestBrief
          ? `${latestBrief.highlightsCount} highlights and ${latestBrief.actionsCount} next actions.`
          : "Generate the first weekly brief to unlock the founder summary."
      },
      {
        label: "Pending approvals",
        value: `${approvals.filter((item) => item.status === "ready_for_approval").length}`,
        note: "Drafts still waiting for review before they can move into publishing."
      },
      {
        label: "Publish queue",
        value: `${publishJobs.filter((job) => job.status === "scheduled").length} scheduled / ${publishJobs.filter((job) => job.status === "failed").length} failed`,
        note: `${readyDrafts.length} approved drafts still waiting for a scheduling decision.`
      },
      {
        label: "Customer-ops pressure",
        value: `${retention.length + cxIssues.length + support.length}`,
        note: "Total lifecycle, CX, and support signals currently tracked."
      }
    ],
    summaryCards: [
      {
        id: "founder",
        title: "Founder weekly report",
        audience: "Founder / leadership",
        description:
          "A top-level report that compresses performance, risks, workflow pressure, and what needs leadership attention this week.",
        keyPoints: [
          latestBrief?.summary ?? "No weekly brief is available yet.",
          `${overview.pendingApprovals} approvals are still waiting for decisions.`,
          `${overview.publishFailures} publish failures need operational attention.`,
          `${retention.filter((item) => item.churnRisk === "high").length} high-risk retention segments are currently flagged.`
        ],
        href: `/api/brands/${brandId}/reports/founder/export`
      },
      {
        id: "team",
        title: "Operating team report",
        audience: "Growth / content / ops",
        description:
          "A tactical report with workflow queues, market signals, customer issues, and specific action areas for the team.",
        keyPoints: [
          `${approvals.length} approval items are active in the review layer.`,
          `${publishJobs.length} publish jobs exist across scheduled, published, and failed states.`,
          `${trends.filter((trend) => trend.state !== "acted").length} trend signals still need a decision.`,
          `${cxIssues.filter((issue) => issue.state !== "resolved").length + support.filter((issue) => issue.state !== "resolved").length} CX/support issues are still open.`
        ],
        href: `/api/brands/${brandId}/reports/team/export`
      }
    ]
  };
}

export async function getReportsDashboardDataAsync(
  brandId: string
): Promise<ReportsDashboardData> {
  const workspace = await getWorkspaceContextAsync(brandId);
  const overview = await getWorkspaceOverviewAsync(brandId);
  const latestBrief = await getLatestWorkspaceBriefAsync(brandId);
  const approvals = listApprovalItems(brandId);
  const publishJobs = listPublishJobs(brandId);
  const readyDrafts = listReadyToPublishDrafts(brandId);
  const retention = listRetentionSignals(brandId);
  const cxIssues = listCxIssues(brandId);
  const support = listSupportClusters(brandId);
  const trends = listTrendSignals(brandId);
  const competitors = listCompetitorObservations(brandId);

  return {
    brandName: workspace.name,
    headline:
      latestBrief?.summary ??
      `${workspace.name} now has enough operating context to generate founder and team reporting from inside the app.`,
    generatedAtLabel: formatTimestampLabel(new Date().toISOString()),
    stats: [
      {
        label: "Founder-ready brief",
        value: latestBrief?.weekLabel ?? "No brief yet",
        note: latestBrief
          ? `${latestBrief.highlightsCount} highlights and ${latestBrief.actionsCount} next actions.`
          : "Generate the first weekly brief to unlock the founder summary."
      },
      {
        label: "Pending approvals",
        value: `${approvals.filter((item) => item.status === "ready_for_approval").length}`,
        note: "Drafts still waiting for review before they can move into publishing."
      },
      {
        label: "Publish queue",
        value: `${publishJobs.filter((job) => job.status === "scheduled").length} scheduled / ${publishJobs.filter((job) => job.status === "failed").length} failed`,
        note: `${readyDrafts.length} approved drafts still waiting for a scheduling decision.`
      },
      {
        label: "Customer-ops pressure",
        value: `${retention.length + cxIssues.length + support.length}`,
        note: "Total lifecycle, CX, and support signals currently tracked."
      }
    ],
    summaryCards: [
      {
        id: "founder",
        title: "Founder weekly report",
        audience: "Founder / leadership",
        description:
          "A top-level report that compresses performance, risks, workflow pressure, and what needs leadership attention this week.",
        keyPoints: [
          latestBrief?.summary ?? "No weekly brief is available yet.",
          `${overview.pendingApprovals} approvals are still waiting for decisions.`,
          `${overview.publishFailures} publish failures need operational attention.`,
          `${retention.filter((item) => item.churnRisk === "high").length} high-risk retention segments are currently flagged.`
        ],
        href: `/api/brands/${brandId}/reports/founder/export`
      },
      {
        id: "team",
        title: "Operating team report",
        audience: "Growth / content / ops",
        description:
          "A tactical report with workflow queues, market signals, customer issues, and specific action areas for the team.",
        keyPoints: [
          `${approvals.length} approval items are active in the review layer.`,
          `${publishJobs.length} publish jobs exist across scheduled, published, and failed states.`,
          `${trends.filter((trend) => trend.state !== "acted").length} trend signals still need a decision.`,
          `${cxIssues.filter((issue) => issue.state !== "resolved").length + support.filter((issue) => issue.state !== "resolved").length} CX/support issues are still open.`
        ],
        href: `/api/brands/${brandId}/reports/team/export`
      }
    ]
  };
}

export function buildFounderReportMarkdown(brandId: string) {
  const workspace = getWorkspaceContext(brandId);
  const overview = getWorkspaceOverview(brandId);
  const latestBrief = getLatestWorkspaceBrief(brandId);
  const alerts = listWorkspaceAlerts(brandId).slice(0, 3);
  const approvals = listApprovalItems(brandId).filter(
    (item) => item.status === "ready_for_approval"
  );
  const publishJobs = listPublishJobs(brandId);
  const failedJobs = publishJobs.filter((job) => job.status === "failed");
  const scheduledJobs = publishJobs.filter((job) => job.status === "scheduled");
  const retention = listRetentionSignals(brandId).filter(
    (item) => item.churnRisk === "high" || item.state === "flagged"
  );

  return [
    `# ${workspace.name} Founder Report`,
    "",
    `Generated: ${formatTimestampLabel(new Date().toISOString())}`,
    "",
    `## Weekly Snapshot`,
    latestBrief?.summary ??
      "No weekly brief is available yet, so this report is based on the current operating state.",
    "",
    makeSection(
      "Core KPIs",
      overview.kpis.map(
        (kpi) => `${kpi.label}: ${kpi.value} (${kpi.delta}) - ${kpi.note}`
      )
    ),
    makeSection(
      "What Is Working",
      overview.wins.slice(0, 3).map((item) => `${item.title}: ${item.description}`)
    ),
    makeSection(
      "What Needs Attention",
      [
        ...overview.risks.slice(0, 3).map((item) => `${item.title}: ${item.description}`),
        ...failedJobs.map(
          (job) =>
            `${job.draftTitle}: publish failed${job.failureReason ? ` (${job.failureReason})` : ""}`
        )
      ]
    ),
    makeSection(
      "Leadership Actions",
      [
        ...overview.nextActions
          .slice(0, 4)
          .map((action) => `${action.title} - ${action.description} Owner: ${action.owner}. Due: ${action.dueLabel}.`),
        `${approvals.length} approvals are waiting for review.`,
        `${scheduledJobs.length} assets are scheduled to go live.`,
        `${retention.length} retention risks need a lifecycle response.`
      ]
    ),
    makeSection(
      "Open Alerts",
      alerts.length > 0
        ? alerts.map((alert) => `${alert.title}: ${alert.impact}`)
        : ["No major alerts are active right now."]
    )
  ].join("\n");
}

export async function buildFounderReportMarkdownAsync(brandId: string) {
  const workspace = await getWorkspaceContextAsync(brandId);
  const overview = await getWorkspaceOverviewAsync(brandId);
  const latestBrief = await getLatestWorkspaceBriefAsync(brandId);
  const alerts = (await listWorkspaceAlertsAsync(brandId)).slice(0, 3);
  const approvals = listApprovalItems(brandId).filter(
    (item) => item.status === "ready_for_approval"
  );
  const publishJobs = listPublishJobs(brandId);
  const failedJobs = publishJobs.filter((job) => job.status === "failed");
  const scheduledJobs = publishJobs.filter((job) => job.status === "scheduled");
  const retention = listRetentionSignals(brandId).filter(
    (item) => item.churnRisk === "high" || item.state === "flagged"
  );

  return [
    `# ${workspace.name} Founder Report`,
    "",
    `Generated: ${formatTimestampLabel(new Date().toISOString())}`,
    "",
    `## Weekly Snapshot`,
    latestBrief?.summary ??
      "No weekly brief is available yet, so this report is based on the current operating state.",
    "",
    makeSection(
      "Core KPIs",
      overview.kpis.map(
        (kpi) => `${kpi.label}: ${kpi.value} (${kpi.delta}) - ${kpi.note}`
      )
    ),
    makeSection(
      "What Is Working",
      overview.wins.slice(0, 3).map((item) => `${item.title}: ${item.description}`)
    ),
    makeSection(
      "What Needs Attention",
      [
        ...overview.risks.slice(0, 3).map((item) => `${item.title}: ${item.description}`),
        ...failedJobs.map(
          (job) =>
            `${job.draftTitle}: publish failed${job.failureReason ? ` (${job.failureReason})` : ""}`
        )
      ]
    ),
    makeSection(
      "Leadership Actions",
      [
        ...overview.nextActions
          .slice(0, 4)
          .map((action) => `${action.title} - ${action.description} Owner: ${action.owner}. Due: ${action.dueLabel}.`),
        `${approvals.length} approvals are waiting for review.`,
        `${scheduledJobs.length} assets are scheduled to go live.`,
        `${retention.length} retention risks need a lifecycle response.`
      ]
    ),
    makeSection(
      "Open Alerts",
      alerts.length > 0
        ? alerts.map((alert) => `${alert.title}: ${alert.impact}`)
        : ["No major alerts are active right now."]
    )
  ].join("\n");
}

export function buildTeamReportMarkdown(brandId: string) {
  const workspace = getWorkspaceContext(brandId);
  const approvals = listApprovalItems(brandId);
  const readyDrafts = listReadyToPublishDrafts(brandId);
  const publishJobs = listPublishJobs(brandId);
  const trends = listTrendSignals(brandId);
  const competitors = listCompetitorObservations(brandId);
  const retention = listRetentionSignals(brandId);
  const cxIssues = listCxIssues(brandId);
  const support = listSupportClusters(brandId);
  const customerNarrative = getCustomerOpsNarrative(brandId);

  return [
    `# ${workspace.name} Operating Team Report`,
    "",
    `Generated: ${formatTimestampLabel(new Date().toISOString())}`,
    "",
    `## Current Operating Picture`,
    customerNarrative,
    "",
    makeSection(
      "Approval Queue",
      approvals.length > 0
        ? approvals.map(
            (item) =>
              `${item.title}: ${formatDraftStatusLabel(item.status)} on ${item.channel}.`
          )
        : ["No approval items are active."]
    ),
    makeSection(
      "Publishing Queue",
      [
        ...readyDrafts.map(
          (draft) => `${draft.title}: approved and waiting for schedule on ${draft.channel}.`
        ),
        ...publishJobs.map(
          (job) =>
            `${job.draftTitle}: ${job.status} (${job.channel}) - updated ${job.updatedAtLabel}.`
        )
      ]
    ),
    makeSection(
      "Market Intelligence",
      [
        ...trends.map(
          (trend) =>
            `${trend.title}: ${trend.fitScore} fit / ${trend.urgencyScore} urgency / state ${trend.state}.`
        ),
        ...competitors.map(
          (item) =>
            `${item.competitorName} - ${item.title}: ${item.urgency} / state ${item.state}.`
        )
      ]
    ),
    makeSection(
      "Customer Ops",
      [
        ...retention.map(
          (item) =>
            `${item.title}: ${item.repeatPurchaseRate} repeat purchase / churn risk ${item.churnRisk} / state ${item.state}.`
        ),
        ...cxIssues.map(
          (item) =>
            `${item.title}: ${item.category} / ${item.severity} / state ${item.state}.`
        ),
        ...support.map(
          (item) =>
            `${item.title}: ${item.ticketVolume} / ${item.severity} / state ${item.state}.`
        )
      ]
    )
  ].join("\n");
}

export async function buildTeamReportMarkdownAsync(brandId: string) {
  const workspace = await getWorkspaceContextAsync(brandId);
  const approvals = listApprovalItems(brandId);
  const readyDrafts = listReadyToPublishDrafts(brandId);
  const publishJobs = listPublishJobs(brandId);
  const trends = listTrendSignals(brandId);
  const competitors = listCompetitorObservations(brandId);
  const retention = listRetentionSignals(brandId);
  const cxIssues = listCxIssues(brandId);
  const support = listSupportClusters(brandId);
  const customerNarrative = getCustomerOpsNarrative(brandId);

  return [
    `# ${workspace.name} Operating Team Report`,
    "",
    `Generated: ${formatTimestampLabel(new Date().toISOString())}`,
    "",
    `## Current Operating Picture`,
    customerNarrative,
    "",
    makeSection(
      "Approval Queue",
      approvals.length > 0
        ? approvals.map(
            (item) =>
              `${item.title}: ${formatDraftStatusLabel(item.status)} on ${item.channel}.`
          )
        : ["No approval items are active."]
    ),
    makeSection(
      "Publishing Queue",
      [
        ...readyDrafts.map(
          (draft) => `${draft.title}: approved and waiting for schedule on ${draft.channel}.`
        ),
        ...publishJobs.map(
          (job) =>
            `${job.draftTitle}: ${job.status} (${job.channel}) - updated ${job.updatedAtLabel}.`
        )
      ]
    ),
    makeSection(
      "Market Intelligence",
      [
        ...trends.map(
          (trend) =>
            `${trend.title}: ${trend.fitScore} fit / ${trend.urgencyScore} urgency / state ${trend.state}.`
        ),
        ...competitors.map(
          (item) =>
            `${item.competitorName} - ${item.title}: ${item.urgency} / state ${item.state}.`
        )
      ]
    ),
    makeSection(
      "Customer Ops",
      [
        ...retention.map(
          (item) =>
            `${item.title}: ${item.repeatPurchaseRate} repeat purchase / churn risk ${item.churnRisk} / state ${item.state}.`
        ),
        ...cxIssues.map(
          (item) =>
            `${item.title}: ${item.category} / ${item.severity} / state ${item.state}.`
        ),
        ...support.map(
          (item) =>
            `${item.title}: ${item.ticketVolume} / ${item.severity} / state ${item.state}.`
        )
      ]
    )
  ].join("\n");
}
