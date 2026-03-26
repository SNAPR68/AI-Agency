import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import {
  getCustomerOpsNarrative,
  listRetentionSignals
} from "../../../../lib/customer-ops-data";

type RetentionPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function churnTone(churnRisk: string): PresentationTone {
  if (churnRisk === "high") {
    return "danger";
  }

  if (churnRisk === "medium") {
    return "warning";
  }

  return "positive";
}

function stateTone(state: string): PresentationTone {
  if (state === "acted") {
    return "positive";
  }

  if (state === "planned") {
    return "info";
  }

  if (state === "flagged") {
    return "warning";
  }

  return "neutral";
}

export default async function RetentionPage({ params }: RetentionPageProps) {
  const { brandId } = await params;
  const items = listRetentionSignals(brandId);
  const primaryItem = items[0];

  return (
    <WorkspacePage
      model={{
        kicker: "Retention",
        title: "Repeat-purchase and lifecycle opportunity board",
        description: getCustomerOpsNarrative(brandId),
        actions: [
          {
            label: "Open Content Studio",
            href: `/brands/${brandId}/content`
          },
          {
            label: "Open Reports",
            href: `/brands/${brandId}/reports`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Retention signals",
            value: `${items.length}`,
            note: "Current lifecycle opportunities being tracked."
          },
          {
            label: "High-risk segments",
            value: `${items.filter((item) => item.churnRisk === "high").length}`,
            note: "Segments that need intervention before they drift out of the repeat window."
          },
          {
            label: "Plans in motion",
            value: `${items.filter((item) => item.state === "planned" || item.state === "acted").length}`,
            note: "Retention signals already routed into action."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Segments"
            title="Lifecycle opportunities"
            description="These signals should help the team decide where retention work creates the most leverage right now."
            items={items.map((item) => ({
              eyebrow: item.segment,
              title: item.title,
              description: `${item.evidence} ${item.implication} ${item.recommendation}`,
              value: item.repeatPurchaseRate,
              note: item.state,
              tags: [
                { label: item.churnRisk, tone: churnTone(item.churnRisk) },
                { label: item.repeatPurchaseRate, tone: "info" },
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
                        label: "Open lifecycle draft",
                        href: item.linkedDraftHref,
                        tone: "primary" as const
                      }
                    ]
                  : [
                      {
                        label: "Generate retention ideas",
                        href: `/api/brands/${brandId}/retention/${item.id}/generate-draft`,
                        method: "post" as const,
                        tone: "primary" as const
                      }
                    ]),
                ...(item.state !== "flagged"
                  ? [
                      {
                        label: "Flag segment",
                        href: `/api/brands/${brandId}/retention/${item.id}/flag`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/retention`
                          }
                        ]
                      }
                    ]
                  : []),
                ...(item.state !== "planned"
                  ? [
                      {
                        label: "Create lifecycle plan",
                        href: `/api/brands/${brandId}/retention/${item.id}/create-lifecycle-plan`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/retention`
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
          {primaryItem ? (
            <section className="editorial-section" data-tone="ink">
              <p className="editorial-section-label">Opportunity analysis</p>
              <h2 className="editorial-section-title">{primaryItem.title}</h2>
              <div className="editorial-timeline">
                <article className="editorial-timeline-item">
                  <p className="editorial-timeline-label">The evidence</p>
                  <h3 className="editorial-timeline-title">{primaryItem.evidence}</h3>
                  <p className="editorial-timeline-copy">{primaryItem.implication}</p>
                </article>
                <article className="editorial-timeline-item">
                  <p className="editorial-timeline-label">Recommendation</p>
                  <h3 className="editorial-timeline-title">{primaryItem.recommendation}</h3>
                  <p className="editorial-timeline-copy">
                    Churn risk: {primaryItem.churnRisk}
                  </p>
                </article>
              </div>
            </section>
          ) : null}

          <EditorialListPanel
            label="Principles"
            title="How to use retention signals"
            description="Retention work should stay tightly tied to specific segments, products, and repeat windows."
            items={[
              {
                eyebrow: "Repeat value",
                title: "Treat retention as a product story problem",
                description:
                  "The best lifecycle plans reinforce why a product earns the next order, not just when to ask for it.",
                tags: [{ label: "Repeat value", tone: "positive" }]
              },
              {
                eyebrow: "Early warning",
                title: "Flag segments before they become a revenue problem",
                description:
                  "The earlier the team sees churn risk, the easier it is to answer with messaging and education instead of expensive reacquisition.",
                tags: [{ label: "Early warning", tone: "warning" }]
              },
              {
                eyebrow: "Execution",
                title: "Convert the signal into an asset quickly",
                description:
                  "If a segment matters, it should turn into a lifecycle brief or content draft instead of staying abstract.",
                tags: [{ label: "Execution", tone: "info" }]
              }
            ]}
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
