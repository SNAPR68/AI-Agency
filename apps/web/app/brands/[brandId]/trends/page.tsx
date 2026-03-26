import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import {
  getMarketNarrative,
  listTrendSignals
} from "../../../../lib/market-intelligence-data";

type TrendsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function trendTone(status: string): PresentationTone {
  if (status === "hot") {
    return "danger";
  }

  if (status === "emerging") {
    return "positive";
  }

  return "warning";
}

function stateTone(state: string): PresentationTone {
  if (state === "acted") {
    return "positive";
  }

  if (state === "saved") {
    return "info";
  }

  return "neutral";
}

export default async function TrendsPage({ params }: TrendsPageProps) {
  const { brandId } = await params;
  const trends = listTrendSignals(brandId);
  const primaryTrend = trends[0];

  return (
    <WorkspacePage
      model={{
        kicker: "Trends",
        title: "Trend detection and brand-fit scoring",
        description: getMarketNarrative(brandId),
        actions: [
          {
            label: "Open Opportunities",
            href: `/brands/${brandId}/opportunities`
          },
          {
            label: "Open Content Studio",
            href: `/brands/${brandId}/content`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Trend signals",
            value: `${trends.length}`,
            note: "Current market signals being tracked for this brand."
          },
          {
            label: "High-fit trends",
            value: `${trends.filter((trend) => trend.fitScore >= 85).length}`,
            note: "Signals strong enough to justify immediate attention."
          },
          {
            label: "Acted on",
            value: `${trends.filter((trend) => trend.state === "acted").length}`,
            note: "Signals already translated into concrete work."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Emerging Narratives"
            title="Trend queue"
            description="These trends should only matter if the team can translate them into product-led, brand-safe execution."
            items={trends.map((trend) => ({
              eyebrow: `${trend.platform} · ${trend.recommendedFormat}`,
              title: trend.title,
              description: `${trend.evidence} ${trend.opportunity} Response angle: ${trend.responseAngle}`,
              value: `${trend.fitScore}`,
              note: `${trend.urgencyScore} urgency`,
              tags: [
                { label: trend.status, tone: trendTone(trend.status) },
                { label: `${trend.fitScore} fit`, tone: "info" },
                { label: trend.state, tone: stateTone(trend.state) }
              ],
              actions: [
                {
                  label: "View product",
                  href: trend.productHref,
                  tone: "secondary"
                },
                ...(trend.linkedDraftHref
                  ? [
                      {
                        label: "Open linked draft",
                        href: trend.linkedDraftHref,
                        tone: "primary" as const
                      }
                    ]
                  : [
                      {
                        label: "Generate draft",
                        href: `/api/brands/${brandId}/trends/${trend.id}/generate-draft`,
                        method: "post" as const,
                        tone: "primary" as const
                      }
                    ]),
                ...(trend.state !== "saved"
                  ? [
                      {
                        label: "Save trend",
                        href: `/api/brands/${brandId}/trends/${trend.id}/save`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/trends`
                          }
                        ]
                      }
                    ]
                  : []),
                ...(trend.state !== "acted"
                  ? [
                      {
                        label: "Act on trend",
                        href: `/api/brands/${brandId}/trends/${trend.id}/act`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/trends`
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
          {primaryTrend ? (
            <section className="editorial-section" data-tone="ink">
              <p className="editorial-section-label">Evidence Panel</p>
              <h2 className="editorial-section-title">{primaryTrend.title}</h2>
              <p className="editorial-section-description">
                Trend: {primaryTrend.platform} • {primaryTrend.recommendedFormat}
              </p>
              <div className="editorial-timeline">
                <article className="editorial-timeline-item">
                  <p className="editorial-timeline-label">Source signals</p>
                  <h3 className="editorial-timeline-title">{primaryTrend.evidence}</h3>
                  <p className="editorial-timeline-copy">{primaryTrend.opportunity}</p>
                </article>
                <article className="editorial-timeline-item">
                  <p className="editorial-timeline-label">Response angle</p>
                  <h3 className="editorial-timeline-title">{primaryTrend.responseAngle}</h3>
                  <p className="editorial-timeline-copy">
                    Brand relevance index: {primaryTrend.fitScore}/100
                  </p>
                </article>
              </div>
            </section>
          ) : null}

          <EditorialListPanel
            label="Guidance"
            title="How to use trend signals"
            description="Trend intelligence is useful only when it becomes selective, not reactive."
            items={[
              {
                eyebrow: "Fit first",
                title: "Prioritize fit before speed",
                description:
                  "A lower-volume signal with strong product fit is usually better than a broad trend with weak brand relevance.",
                tags: [{ label: "Fit first", tone: "positive" }]
              },
              {
                eyebrow: "Differentiation",
                title: "Avoid crowded aesthetic clones",
                description:
                  "When saturation is high, the winning move is usually a sharper product story, not a faster copy of the same format.",
                tags: [{ label: "Differentiation", tone: "warning" }]
              },
              {
                eyebrow: "Execution",
                title: "Turn trend insight into assets fast",
                description:
                  "If a trend is worth acting on, convert it into a draft or opportunity quickly so it enters the real workflow.",
                tags: [{ label: "Execution", tone: "info" }]
              }
            ]}
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
