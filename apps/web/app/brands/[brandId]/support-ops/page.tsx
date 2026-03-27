import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import {
  getCustomerOpsNarrative,
  listSupportClustersAsync
} from "../../../../lib/customer-ops-data";

type SupportOpsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function severityTone(severity: string): PresentationTone {
  return severity === "high" ? "danger" : "warning";
}

function stateTone(state: string): PresentationTone {
  if (state === "resolved") {
    return "positive";
  }

  if (state === "escalated") {
    return "danger";
  }

  if (state === "assigned") {
    return "info";
  }

  return "warning";
}

export default async function SupportOpsPage({ params }: SupportOpsPageProps) {
  const { brandId } = await params;
  const clusters = await listSupportClustersAsync(brandId);
  const primaryCluster = clusters[0];

  return (
    <WorkspacePage
      model={{
        kicker: "Support Ops",
        title: "Recurring issue clusters and response workflows",
        description: getCustomerOpsNarrative(brandId),
        actions: [
          {
            label: "Open CX Ops",
            href: `/brands/${brandId}/cx`
          },
          {
            label: "Open Content Studio",
            href: `/brands/${brandId}/content`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Issue clusters",
            value: `${clusters.length}`,
            note: "Repeated support patterns currently being tracked."
          },
          {
            label: "Escalated",
            value: `${clusters.filter((item) => item.state === "escalated").length}`,
            note: "Clusters already pushed into higher-urgency handling."
          },
          {
            label: "Templates created",
            value: `${clusters.filter((item) => item.linkedDraftId).length}`,
            note: "Clusters already turned into reusable response assets."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Clusters"
            title="Support issue clusters"
            description="This page should help the team collapse repeated support questions into consistent responses and upstream fixes."
            items={clusters.map((item) => ({
              eyebrow: `${item.category} · ${item.ticketVolume}`,
              title: item.title,
              description: `${item.evidence} ${item.implication} Response angle: ${item.responseTemplateAngle}`,
              value: item.severity,
              note: item.state,
              tags: [
                { label: item.severity, tone: severityTone(item.severity) },
                { label: item.ticketVolume, tone: "info" },
                { label: item.state, tone: stateTone(item.state) }
              ],
              actions: [
                {
                  label: "View product",
                  href: item.productHref,
                  tone: "secondary"
                },
                ...(item.linkedDraftHref
                  ? [
                      {
                        label: "Open response template",
                        href: item.linkedDraftHref,
                        tone: "primary" as const
                      }
                    ]
                  : [
                      {
                        label: "Generate response template",
                        href: `/api/brands/${brandId}/support-ops/${item.id}/generate-response-template`,
                        method: "post" as const,
                        tone: "primary" as const
                      }
                    ]),
                ...(item.state !== "assigned"
                  ? [
                      {
                        label: "Assign issue cluster",
                        href: `/api/brands/${brandId}/support-ops/${item.id}/assign`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/support-ops`
                          }
                        ]
                      }
                    ]
                  : []),
                ...(item.state !== "escalated"
                  ? [
                      {
                        label: "Escalate",
                        href: `/api/brands/${brandId}/support-ops/${item.id}/escalate`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/support-ops`
                          }
                        ]
                      }
                    ]
                  : []),
                ...(item.state !== "resolved"
                  ? [
                      {
                        label: "Mark resolved",
                        href: `/api/brands/${brandId}/support-ops/${item.id}/resolve`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/support-ops`
                          }
                        ]
                      }
                    ]
                  : [])
              ]
            }))}
            tone="warm"
          />
        </div>

        <aside className="editorial-rail">
          {primaryCluster ? (
            <section className="editorial-section" data-tone="ink">
              <p className="editorial-section-label">Resolution engine</p>
              <h2 className="editorial-section-title">{primaryCluster.title}</h2>
              <div className="editorial-timeline">
                <article className="editorial-timeline-item">
                  <p className="editorial-timeline-label">Suggested response</p>
                  <h3 className="editorial-timeline-title">{primaryCluster.responseTemplateAngle}</h3>
                  <p className="editorial-timeline-copy">{primaryCluster.evidence}</p>
                </article>
                <article className="editorial-timeline-item">
                  <p className="editorial-timeline-label">Operational path</p>
                  <h3 className="editorial-timeline-title">Cluster, escalate, resolve</h3>
                  <p className="editorial-timeline-copy">
                    Volume: {primaryCluster.ticketVolume} • Severity: {primaryCluster.severity}
                  </p>
                </article>
              </div>
            </section>
          ) : null}

          <EditorialListPanel
            label="Principles"
            title="How to use support ops"
            description="Repeated support patterns should become cleaner answers and clearer upstream messaging."
            items={[
              {
                eyebrow: "Pattern first",
                title: "Cluster before you escalate",
                description:
                  "When several tickets tell the same story, the goal is to solve the pattern, not just clear individual cases faster.",
                tags: [{ label: "Pattern first", tone: "positive" }]
              },
              {
                eyebrow: "Triage",
                title: "Escalate only when the issue needs cross-functional attention",
                description:
                  "Escalation should mean the cluster now touches product, ops, lifecycle, or CX strongly enough to require broader ownership.",
                tags: [{ label: "Triage", tone: "warning" }]
              },
              {
                eyebrow: "Operational leverage",
                title: "Turn clusters into reusable templates",
                description:
                  "If the same question keeps appearing, the brand should leave the week with a better response asset than it had before.",
                tags: [{ label: "Operational leverage", tone: "info" }]
              }
            ]}
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
