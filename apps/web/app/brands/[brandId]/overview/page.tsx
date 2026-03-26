import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import { getWorkspaceOverviewAsync } from "../../../../lib/operating-data";

type BrandOverviewPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function statusTone(status: string): PresentationTone {
  if (status === "connected") {
    return "positive";
  }

  if (status === "degraded") {
    return "warning";
  }

  return "info";
}

function workflowTone(tone: string): PresentationTone {
  if (tone === "positive") {
    return "positive";
  }

  if (tone === "danger") {
    return "danger";
  }

  if (tone === "warning") {
    return "warning";
  }

  return "info";
}

export default async function BrandOverviewPage({
  params
}: BrandOverviewPageProps) {
  const { brandId } = await params;
  const overview = await getWorkspaceOverviewAsync(brandId);

  return (
    <WorkspacePage
      model={{
        kicker: "Overview",
        title: "Weekly command center",
        description: overview.description,
        actions: [
          {
            label: "Generate Weekly Brief",
            href: `/brands/${brandId}/briefs/latest`
          },
          {
            label: "Sync Data",
            href: `/brands/${brandId}/settings/integrations`,
            tone: "secondary"
          },
          {
            label: "View Opportunities",
            href: `/brands/${brandId}/opportunities`,
            tone: "secondary"
          },
          {
            label: "Open Alerts",
            href: `/brands/${brandId}/alerts`,
            tone: "secondary"
          }
        ],
        stats: [
          ...overview.kpis.map((kpi) => ({
            label: kpi.label,
            value: kpi.value,
            note: `${kpi.delta} · ${kpi.note}`
          })),
          {
            label: "Pending approvals",
            value: `${overview.pendingApprovals}`,
            note: "Drafts waiting for a review decision before they can move to publishing."
          },
          {
            label: "Publish failures",
            value: `${overview.publishFailures}`,
            note: "Operational delivery issues currently affecting trust in the publish queue."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="What Changed This Week"
            title="Main ledger movement"
            description="The command center now reads like an operating brief: what moved, where confidence sits, and which decisions deserve attention first."
            items={overview.kpis.map((kpi) => ({
              eyebrow: "Live feed",
              title: kpi.label,
              description: kpi.note,
              value: kpi.value,
              note: kpi.delta
            }))}
            tone="warm"
          />

          <section className="editorial-focus-grid">
            <EditorialListPanel
              label="Top Wins"
              title="What is compounding"
              description="Signals worth leaning into while the board is supportive."
              items={overview.wins.map((win) => ({
                eyebrow: "Winning signal",
                title: win.title,
                description: win.description,
                tags: [{ label: "Positive", tone: "positive" }]
              }))}
            />

            <EditorialListPanel
              label="Top Risks"
              title="What needs intervention"
              description="These are the problems most likely to slow revenue, trust, or workflow momentum."
              items={overview.risks.map((risk) => ({
                eyebrow: "Needs attention",
                title: risk.title,
                description: risk.description,
                tags: [{ label: "Risk", tone: "warning" }]
              }))}
            />
          </section>

          <EditorialListPanel
            label="Recommended Next Actions"
            title="Moves the team should make next"
            description="Concrete work that should leave the command center and flow into content, product, or operations."
            items={overview.nextActions.map((action) => ({
              eyebrow: action.owner,
              title: action.title,
              description: action.description,
              value: action.dueLabel,
              note: "Due",
              tags: [
                { label: action.owner, tone: "info" },
                { label: action.dueLabel, tone: "neutral" }
              ],
              actions: [
                {
                  label: "Open workflow",
                  href: action.href,
                  tone: "secondary"
                }
              ]
            }))}
          />
        </div>

        <aside className="editorial-rail">
          <EditorialListPanel
            label="Workflow"
            title="Operating pulse"
            description="Approvals and publishing pressure should be visible next to the numbers, not hidden in a separate tab."
            items={overview.workflowPulse.map((signal) => ({
              eyebrow: "Workflow",
              title: signal.title,
              description: signal.description,
              tags: [{ label: "Workflow", tone: workflowTone(signal.tone) }],
              actions: [
                {
                  label: signal.actionLabel,
                  href: signal.href,
                  tone: "secondary"
                }
              ]
            }))}
            tone="ink"
            emptyMessage="No approval or publishing pressure is active right now."
          />

          <EditorialListPanel
            label="Data Systems"
            title="Sync integrity"
            description="The team should know how fresh the data is before making a call from the dashboard."
            items={overview.syncHealth.map((integration) => ({
              eyebrow: integration.label,
              title: integration.accountLabel,
              description: `${integration.coverage}. ${integration.note}`,
              value: integration.lastSyncedLabel,
              note: "Last synced",
              tags: [
                { label: integration.status, tone: statusTone(integration.status) }
              ],
              actions: [
                {
                  label: integration.actionLabel,
                  href: `/brands/${brandId}/settings/integrations`,
                  tone: "secondary"
                }
              ]
            }))}
            tone="ink"
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
