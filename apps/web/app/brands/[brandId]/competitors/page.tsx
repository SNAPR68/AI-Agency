import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import {
  getMarketNarrative,
  listCompetitorObservationsAsync
} from "../../../../lib/market-intelligence-data";

type CompetitorsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function urgencyTone(urgency: string): PresentationTone {
  if (urgency === "respond") {
    return "danger";
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

export default async function CompetitorsPage({ params }: CompetitorsPageProps) {
  const { brandId } = await params;
  const competitors = await listCompetitorObservationsAsync(brandId);
  const primaryObservation = competitors[0];

  return (
    <WorkspacePage
      model={{
        kicker: "Competitors",
        title: "Category observation and response planning",
        description: getMarketNarrative(brandId),
        actions: [
          {
            label: "Open Trends",
            href: `/brands/${brandId}/trends`
          },
          {
            label: "Open Content Studio",
            href: `/brands/${brandId}/content`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Competitor signals",
            value: `${competitors.length}`,
            note: "Current observations being tracked inside the workspace."
          },
          {
            label: "Needs response",
            value: `${competitors.filter((item) => item.urgency === "respond").length}`,
            note: "Observations strong enough to justify a direct answer."
          },
          {
            label: "Converted to work",
            value: `${competitors.filter((item) => item.state === "acted").length}`,
            note: "Observations already turned into response planning or drafts."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Market Activity Feed"
            title="Competitor watchlist"
            description="Competitor monitoring should sharpen positioning and response timing, not turn the brand into a reactive copy machine."
            items={competitors.map((observation) => ({
              eyebrow: `${observation.competitorName} · ${observation.lastSeenLabel}`,
              title: observation.title,
              description: `${observation.observation} ${observation.implication} Response angle: ${observation.responseAngle}`,
              value: observation.urgency,
              note: observation.category,
              tags: [
                { label: observation.urgency, tone: urgencyTone(observation.urgency) },
                { label: observation.category, tone: "info" },
                { label: observation.state, tone: stateTone(observation.state) }
              ],
              actions: [
                {
                  label: "View product",
                  href: observation.productHref,
                  tone: "secondary"
                },
                ...(observation.linkedDraftHref
                  ? [
                      {
                        label: "Open linked draft",
                        href: observation.linkedDraftHref,
                        tone: "primary" as const
                      }
                    ]
                  : [
                      {
                        label: "Generate counter draft",
                        href: `/api/brands/${brandId}/competitors/${observation.id}/generate-draft`,
                        method: "post" as const,
                        tone: "primary" as const
                      }
                    ]),
                ...(observation.state !== "saved"
                  ? [
                      {
                        label: "Save observation",
                        href: `/api/brands/${brandId}/competitors/${observation.id}/save`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/competitors`
                          }
                        ]
                      }
                    ]
                  : []),
                ...(observation.state !== "acted"
                  ? [
                      {
                        label: "Create response plan",
                        href: `/api/brands/${brandId}/competitors/${observation.id}/create-response-plan`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/competitors`
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
          {primaryObservation ? (
            <section className="editorial-section" data-tone="ink">
              <p className="editorial-section-label">Response Recommendation</p>
              <h2 className="editorial-section-title">{primaryObservation.competitorName}</h2>
              <p className="editorial-section-description">{primaryObservation.title}</p>
              <div className="editorial-timeline">
                <article className="editorial-timeline-item">
                  <p className="editorial-timeline-label">Implication</p>
                  <h3 className="editorial-timeline-title">{primaryObservation.implication}</h3>
                  <p className="editorial-timeline-copy">
                    Seen {primaryObservation.lastSeenLabel}
                  </p>
                </article>
                <article className="editorial-timeline-item">
                  <p className="editorial-timeline-label">Response angle</p>
                  <h3 className="editorial-timeline-title">{primaryObservation.responseAngle}</h3>
                  <p className="editorial-timeline-copy">
                    Recommended urgency: {primaryObservation.urgency}
                  </p>
                </article>
              </div>
            </section>
          ) : null}

          <EditorialListPanel
            label="Principles"
            title="How to use competitor intel"
            description="The goal is better positioning and better timing, not reactive mimicry."
            items={[
              {
                eyebrow: "Positioning",
                title: "Borrow signal, not identity",
                description:
                  "If a competitor frame is working, use it to sharpen the brand's own product story instead of copying their voice or aesthetic.",
                tags: [{ label: "Positioning", tone: "positive" }]
              },
              {
                eyebrow: "Selectivity",
                title: "Respond only when the overlap matters",
                description:
                  "Not every competitor move deserves an answer. Prioritize observations that touch the same product, customer tension, or conversion bottleneck.",
                tags: [{ label: "Selectivity", tone: "warning" }]
              },
              {
                eyebrow: "Execution",
                title: "Turn insight into response assets",
                description:
                  "The useful end-state is a sharper draft, plan, or product response, not a longer list of interesting observations.",
                tags: [{ label: "Execution", tone: "info" }]
              }
            ]}
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
