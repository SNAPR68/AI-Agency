import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import {
  getWorkflowNarrativeAsync,
  listBrandOpportunitiesAsync
} from "../../../../lib/growth-workflow-data";

type OpportunitiesPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function toneForStatus(status: string): PresentationTone {
  if (status === "accepted") {
    return "positive";
  }

  if (status === "dismissed") {
    return "neutral";
  }

  return "warning";
}

export default async function OpportunitiesPage({
  params
}: OpportunitiesPageProps) {
  const { brandId } = await params;
  const opportunities = await listBrandOpportunitiesAsync(brandId);

  return (
    <WorkspacePage
      model={{
        kicker: "Opportunities",
        title: "Prioritized growth queue",
        description: await getWorkflowNarrativeAsync(brandId),
        actions: [
          {
            label: "Open Products",
            href: `/brands/${brandId}/products`
          },
          {
            label: "Open Content Studio",
            href: `/brands/${brandId}/content`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Open",
            value: `${opportunities.filter((item) => item.status === "open").length}`,
            note: "Opportunities still waiting for a decision."
          },
          {
            label: "Accepted",
            value: `${opportunities.filter((item) => item.status === "accepted").length}`,
            note: "Opportunities already moved into execution."
          },
          {
            label: "Linked drafts",
            value: `${opportunities.filter((item) => item.linkedDraftId).length}`,
            note: "Accepted opportunities already converted into working draft assets."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Opportunity Queue"
            title="Ranked growth opportunities"
            description="Each item should either move into action, generate a draft, or be explicitly dismissed so the queue stays honest."
            items={opportunities.map((opportunity) => ({
              eyebrow: `${opportunity.type} · ${opportunity.owner}`,
              title: opportunity.title,
              description: `${opportunity.evidence} ${opportunity.impact} ${opportunity.recommendation}`,
              value: `${opportunity.priorityScore}`,
              note: `${Math.round(opportunity.confidenceScore * 100)}% confidence`,
              tags: [
                { label: opportunity.status, tone: toneForStatus(opportunity.status) },
                { label: opportunity.type, tone: "info" },
                {
                  label: `${Math.round(opportunity.confidenceScore * 100)}% confidence`,
                  tone: "neutral"
                }
              ],
              actions: [
                ...(opportunity.status !== "accepted"
                  ? [
                      {
                        label: "Accept",
                        href: `/api/brands/${brandId}/opportunities/${opportunity.id}/accept`,
                        method: "post" as const,
                        tone: "primary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/opportunities`
                          }
                        ]
                      }
                    ]
                  : []),
                ...(opportunity.linkedDraftHref
                  ? [
                      {
                        label: "Open draft",
                        href: opportunity.linkedDraftHref,
                        tone: "secondary" as const
                      }
                    ]
                  : [
                      {
                        label: "Generate draft",
                        href: `/api/brands/${brandId}/opportunities/${opportunity.id}/generate-draft`,
                        method: "post" as const,
                        tone: "secondary" as const
                      }
                    ]),
                ...(opportunity.productHref
                  ? [
                      {
                        label: "View product",
                        href: opportunity.productHref,
                        tone: "secondary" as const
                      }
                    ]
                  : []),
                ...(opportunity.status !== "dismissed"
                  ? [
                      {
                        label: "Dismiss",
                        href: `/api/brands/${brandId}/opportunities/${opportunity.id}/dismiss`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/opportunities`
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
          <section className="editorial-section" data-tone="ink">
            <p className="editorial-section-label">Queue Pressure</p>
            <h2 className="editorial-section-title">Current decision load</h2>
            <div className="editorial-metric-grid">
              <article className="editorial-metric-card">
                <p className="editorial-metric-label">Open</p>
                <p className="editorial-metric-value">
                  {opportunities.filter((item) => item.status === "open").length}
                </p>
                <p className="editorial-metric-note">Still waiting for a decision</p>
              </article>

              <article className="editorial-metric-card">
                <p className="editorial-metric-label">Accepted</p>
                <p className="editorial-metric-value">
                  {opportunities.filter((item) => item.status === "accepted").length}
                </p>
                <p className="editorial-metric-note">Already moved into execution</p>
              </article>

              <article className="editorial-metric-card">
                <p className="editorial-metric-label">Linked drafts</p>
                <p className="editorial-metric-value">
                  {opportunities.filter((item) => item.linkedDraftId).length}
                </p>
                <p className="editorial-metric-note">Converted into working assets</p>
              </article>
            </div>
          </section>

          <EditorialListPanel
            label="Discipline"
            title="Queue management rules"
            description="This page is valuable only if the team keeps it current and decisive."
            items={[
              {
                eyebrow: "Execution",
                title: "Accept what deserves action now",
                description:
                  "Accepted items should have a clear owner and a short path into drafts, PDP work, or operational follow-through.",
                tags: [{ label: "Execution", tone: "positive" }]
              },
              {
                eyebrow: "Focus",
                title: "Dismiss low-value noise quickly",
                description:
                  "The opportunity queue should stay lean enough that the top two or three decisions are obvious every day.",
                tags: [{ label: "Focus", tone: "warning" }]
              },
              {
                eyebrow: "Throughput",
                title: "Convert accepted items into drafts fast",
                description:
                  "The value of the system comes from turning validated opportunities into assets and workflows, not letting them sit in limbo.",
                tags: [{ label: "Throughput", tone: "info" }]
              }
            ]}
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
