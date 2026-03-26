import { notFound } from "next/navigation";
import { EditorialListPanel } from "../../../../../components/data-presentation";
import { WorkspacePage } from "../../../../../components/workspace-page";
import { getWorkspaceBriefAsync } from "../../../../../lib/operating-data";

type WeeklyBriefPageProps = {
  params: Promise<{
    brandId: string;
    briefId: string;
  }>;
};

export default async function WeeklyBriefPage({ params }: WeeklyBriefPageProps) {
  const { brandId, briefId } = await params;
  const brief = await getWorkspaceBriefAsync(brandId, briefId);

  if (!brief) {
    notFound();
  }

  return (
    <WorkspacePage
      model={{
        kicker: "Weekly Brief",
        title: brief.title,
        description: `${brief.weekLabel} · ${brief.summary}`,
        actions: [
          {
            label: "Create Content Plan",
            href: `/brands/${brandId}/content`
          },
          {
            label: "Open Opportunities",
            href: `/brands/${brandId}/opportunities`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Status",
            value: brief.status,
            note: `Audience: ${brief.audience}`
          },
          {
            label: "Highlights",
            value: `${brief.highlightsCount}`,
            note: "Key wins and risks captured in the brief."
          },
          {
            label: "Next actions",
            value: `${brief.actionsCount}`,
            note: "Recommended follow-up items for this cycle."
          }
        ]
      }}
    >
      <section className="editorial-story-grid">
        <div className="editorial-main">
          <article className="editorial-story-card">
            <p className="editorial-section-label">Executive Summary</p>
            <h2 className="editorial-story-title">{brief.weekLabel}</h2>
            <p className="editorial-story-meta">
              Generated for {brief.audience} • {brief.status}
            </p>

            <div className="editorial-story-copy">
              <p>{brief.summary}</p>
              <p>
                This brief is meant to give a founder or operator enough context to
                make decisions quickly without opening five other tools.
              </p>
            </div>
          </article>

          <section className="editorial-focus-grid">
            <EditorialListPanel
              label="Wins"
              title="What improved"
              description="Positive movement worth compounding with new decisions or content."
              items={brief.topWins.map((item) => ({
                eyebrow: "Win",
                title: item.title,
                description: item.description,
                tags: [{ label: "Win", tone: "positive" }]
              }))}
            />

            <EditorialListPanel
              label="Risks"
              title="What needs attention"
              description="The biggest threats to momentum or confidence this week."
              items={brief.topRisks.map((item) => ({
                eyebrow: "Risk",
                title: item.title,
                description: item.description,
                tags: [{ label: "Risk", tone: "warning" }]
              }))}
            />
          </section>

          <section className="editorial-focus-grid">
            <EditorialListPanel
              label="Why"
              title="Why this changed"
              description="Context that connects the metrics to their likely drivers."
              items={brief.whyItChanged.map((item) => ({
                eyebrow: "Root cause",
                title: item.title,
                description: item.description,
                tags: [{ label: "Root cause", tone: "info" }]
              }))}
            />

            <EditorialListPanel
              label="Actions"
              title="Recommended next actions"
              description="The follow-up work that should flow into content, product, or operations."
              items={brief.nextActions.map((item) => ({
                eyebrow: item.owner,
                title: item.title,
                description: item.description,
                value: item.dueLabel,
                note: "Due",
                tags: [
                  { label: item.owner, tone: "info" },
                  { label: item.dueLabel, tone: "neutral" }
                ],
                actions: [
                  {
                    label: "Open workflow",
                    href: item.href,
                    tone: "secondary"
                  }
                ]
              }))}
            />
          </section>
        </div>

        <aside className="editorial-rail editorial-summary-stack">
          <section className="editorial-section" data-tone="warm">
            <p className="editorial-section-label">Quick Metrics</p>
            <h2 className="editorial-section-title">Brief scorecard</h2>
            <p className="editorial-section-description">
              Leadership should be able to scan the key numbers before reading the full narrative.
            </p>

            <div className="editorial-metric-grid">
              <article className="editorial-metric-card">
                <p className="editorial-metric-label">Status</p>
                <p className="editorial-metric-value">{brief.status}</p>
                <p className="editorial-metric-note">{brief.audience}</p>
              </article>

              <article className="editorial-metric-card">
                <p className="editorial-metric-label">Highlights</p>
                <p className="editorial-metric-value">{brief.highlightsCount}</p>
                <p className="editorial-metric-note">Wins and risks captured</p>
              </article>

              <article className="editorial-metric-card">
                <p className="editorial-metric-label">Next actions</p>
                <p className="editorial-metric-value">{brief.actionsCount}</p>
                <p className="editorial-metric-note">Follow-up items for the operating cycle</p>
              </article>
            </div>
          </section>

          {brief.whyItChanged[0] ? (
            <div className="editorial-pullquote">
              {brief.whyItChanged[0].description}
            </div>
          ) : null}
        </aside>
      </section>
    </WorkspacePage>
  );
}
