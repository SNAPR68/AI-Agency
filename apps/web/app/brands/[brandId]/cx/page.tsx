import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import {
  getCustomerOpsNarrative,
  listCxIssues
} from "../../../../lib/customer-ops-data";

type CxOpsPageProps = {
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

  return "neutral";
}

function stateTone(state: string): PresentationTone {
  if (state === "resolved") {
    return "positive";
  }

  if (state === "assigned") {
    return "info";
  }

  return "warning";
}

export default async function CxOpsPage({ params }: CxOpsPageProps) {
  const { brandId } = await params;
  const issues = listCxIssues(brandId);
  const primaryIssue = issues[0];

  return (
    <WorkspacePage
      model={{
        kicker: "CX Ops",
        title: "Returns, delivery, and messaging issue board",
        description: getCustomerOpsNarrative(brandId),
        actions: [
          {
            label: "Open Support Ops",
            href: `/brands/${brandId}/support-ops`
          },
          {
            label: "Open Content Studio",
            href: `/brands/${brandId}/content`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "CX issues",
            value: `${issues.length}`,
            note: "Customer-experience issues currently being tracked."
          },
          {
            label: "High severity",
            value: `${issues.filter((item) => item.severity === "high").length}`,
            note: "Issues that deserve immediate owner assignment."
          },
          {
            label: "Resolved",
            value: `${issues.filter((item) => item.state === "resolved").length}`,
            note: "Issues already addressed in the workflow."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Issues"
            title="Customer-experience queue"
            description="Use this board to keep operational friction from becoming a trust or retention problem."
            items={issues.map((item) => ({
              eyebrow: item.category,
              title: item.title,
              description: `${item.evidence} ${item.implication} ${item.recommendation}`,
              value: item.severity,
              note: item.state,
              tags: [
                { label: item.severity, tone: severityTone(item.severity) },
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
                        label: "Open messaging draft",
                        href: item.linkedDraftHref,
                        tone: "primary" as const
                      }
                    ]
                  : [
                      {
                        label: "Recommend messaging",
                        href: `/api/brands/${brandId}/cx/${item.id}/recommend-messaging`,
                        method: "post" as const,
                        tone: "primary" as const
                      }
                    ]),
                ...(item.state !== "assigned"
                  ? [
                      {
                        label: "Assign owner",
                        href: `/api/brands/${brandId}/cx/${item.id}/assign`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/cx`
                          }
                        ]
                      }
                    ]
                  : []),
                ...(item.state !== "resolved"
                  ? [
                      {
                        label: "Mark resolved",
                        href: `/api/brands/${brandId}/cx/${item.id}/resolve`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/cx`
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
          {primaryIssue ? (
            <section className="editorial-section" data-tone="ink">
              <p className="editorial-section-label">Issue resolution</p>
              <h2 className="editorial-section-title">{primaryIssue.title}</h2>
              <div className="editorial-timeline">
                <article className="editorial-timeline-item">
                  <p className="editorial-timeline-label">Recommended script</p>
                  <h3 className="editorial-timeline-title">{primaryIssue.recommendation}</h3>
                  <p className="editorial-timeline-copy">{primaryIssue.implication}</p>
                </article>
                <article className="editorial-timeline-item">
                  <p className="editorial-timeline-label">Recommended actions</p>
                  <h3 className="editorial-timeline-title">Assign, message, monitor</h3>
                  <p className="editorial-timeline-copy">
                    Severity: {primaryIssue.severity} • State: {primaryIssue.state}
                  </p>
                </article>
              </div>
            </section>
          ) : null}

          <EditorialListPanel
            label="Principles"
            title="How to use CX ops"
            description="The goal is to reduce trust-killing friction before it grows into repeat-purchase damage."
            items={[
              {
                eyebrow: "Prevention",
                title: "Fix the message before the ticket volume grows",
                description:
                  "Most CX issues are cheaper to solve in copy and expectation-setting than in support or refunds.",
                tags: [{ label: "Prevention", tone: "positive" }]
              },
              {
                eyebrow: "Ownership",
                title: "Assign issues to keep them moving",
                description:
                  "An unassigned CX problem usually means customers will keep experiencing the same friction next week.",
                tags: [{ label: "Ownership", tone: "warning" }]
              },
              {
                eyebrow: "Scale",
                title: "Turn repeated friction into reusable copy",
                description:
                  "If an issue repeats, the brand should probably ship new messaging, not just answer it one customer at a time.",
                tags: [{ label: "Scale", tone: "info" }]
              }
            ]}
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
