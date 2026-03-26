import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import { listWorkspaceAlertsAsync } from "../../../../lib/operating-data";

type AlertsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function severityTone(severity: string): PresentationTone {
  if (severity === "high") {
    return "danger";
  }

  if (severity === "medium") {
    return "warning";
  }

  return "info";
}

export default async function AlertsPage({ params }: AlertsPageProps) {
  const { brandId } = await params;
  const alerts = await listWorkspaceAlertsAsync(brandId);
  const openAlerts = alerts.filter((alert) => alert.status === "open").length;
  const highSeverity = alerts.filter((alert) => alert.severity === "high").length;

  return (
    <WorkspacePage
      model={{
        kicker: "Alerts",
        title: "Operational issues that need a fast owner",
        description:
          "Alerts tie performance shifts and workflow blockers to evidence, impact, and the next step the team should take.",
        actions: [
          {
            label: "View Opportunities",
            href: `/brands/${brandId}/opportunities`
          },
          {
            label: "Open Inbox",
            href: `/brands/${brandId}/inbox`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Total alerts",
            value: `${alerts.length}`,
            note: "Current alerts in the active workspace."
          },
          {
            label: "Open now",
            value: `${openAlerts}`,
            note: "Issues still waiting for the first intervention."
          },
          {
            label: "High severity",
            value: `${highSeverity}`,
            note: "Items with the highest immediate impact on revenue or trust."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Alert Feed"
            title="Operational issues that need a fast owner"
            description="Each alert should explain what shifted, what it threatens, and where the operator should go next."
            items={alerts.map((alert) => ({
              eyebrow: `${alert.category} · ${alert.owner}`,
              title: alert.title,
              description: `${alert.evidence} ${alert.impact} Next: ${alert.nextStep}`,
              value: alert.severity,
              note: alert.status,
              tags: [
                { label: alert.severity, tone: severityTone(alert.severity) },
                { label: alert.category, tone: "neutral" },
                { label: alert.owner, tone: "info" }
              ],
              actions: [
                {
                  label: "Open source",
                  href: alert.href,
                  tone: "secondary"
                }
              ]
            }))}
            tone="warm"
          />
        </div>

        <aside className="editorial-rail">
          <EditorialListPanel
            label="Triage Rules"
            title="How the team should use this queue"
            description="The alerts page is for triage and routing, not passive dashboard watching."
            items={[
              {
                eyebrow: "Assignment",
                title: "Assign the first response quickly",
                description:
                  "Every high-impact alert should have a clear owner within the same operating day.",
                tags: [{ label: "Assignment", tone: "info" }]
              },
              {
                eyebrow: "Opportunity routing",
                title: "Convert structural issues into opportunities",
                description:
                  "If the signal requires messaging, campaign, or merchandising work, route it into the opportunity engine.",
                tags: [{ label: "Opportunity routing", tone: "positive" }]
              },
              {
                eyebrow: "Trust risk",
                title: "Escalate anything that affects trust",
                description:
                  "CX, delivery, or support patterns should move quickly into downstream ops, not stay trapped in analytics.",
                tags: [{ label: "Trust risk", tone: "warning" }]
              }
            ]}
            tone="ink"
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
