import { EditorialListPanel } from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import { getReportsDashboardDataAsync } from "../../../../lib/reports-data";

type ReportsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { brandId } = await params;
  const reports = await getReportsDashboardDataAsync(brandId);

  return (
    <WorkspacePage
      model={{
        kicker: "Reports",
        title: "Founder and team reporting layer",
        description: reports.headline,
        actions: [
          {
            label: "Export Founder Report",
            href: `/api/brands/${brandId}/reports/founder/export`
          },
          {
            label: "Export Team Report",
            href: `/api/brands/${brandId}/reports/team/export`,
            tone: "secondary"
          }
        ],
        stats: reports.stats
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <section className="editorial-report-grid">
            {reports.summaryCards.map((card, index) => (
              <EditorialListPanel
                key={card.id}
                label={card.audience}
                title={card.title}
                description={card.description}
                items={card.keyPoints.map((point, pointIndex) => ({
                  eyebrow: `Point ${pointIndex + 1}`,
                  title: point,
                  description:
                    "This line is being pulled from the live operating system rather than a separate presentation workflow.",
                  tags: [{ label: "Live workspace data", tone: "positive" }]
                }))}
                tone={index === 0 ? "warm" : "default"}
              />
            ))}
          </section>
        </div>

        <aside className="editorial-rail">
          <section className="editorial-section" data-tone="ink">
            <p className="editorial-section-label">Reporting Layer</p>
            <h2 className="editorial-section-title">Coverage and freshness</h2>
            <p className="editorial-section-description">
              Reports should compress the live system, not create a second source of truth.
            </p>

            <div className="editorial-timeline">
              {reports.stats.map((stat) => (
                <article key={stat.label} className="editorial-timeline-item">
                  <p className="editorial-timeline-label">{stat.label}</p>
                  <h3 className="editorial-timeline-title">{stat.value}</h3>
                  <p className="editorial-timeline-copy">{stat.note}</p>
                </article>
              ))}
            </div>
          </section>

          <EditorialListPanel
            label="Usage"
            title="How to use the reports layer"
            description="These exports should stay tightly linked to the live app."
            items={[
              {
                eyebrow: "Leadership",
                title: "Founder report for fast weekly clarity",
                description:
                  "Use the founder export when leadership needs a concise answer to what changed, what matters, and where attention is needed.",
                tags: [{ label: "Leadership", tone: "positive" }]
              },
              {
                eyebrow: "Operators",
                title: "Team report for queue-level execution",
                description:
                  "Use the operating report when growth, content, and ops need one shared picture of what is blocked, scheduled, or still undecided.",
                tags: [{ label: "Operators", tone: "info" }]
              },
              {
                eyebrow: "Single source of truth",
                title: "Keep the exports tied to the live system",
                description:
                  "The point is to summarize the app, not recreate it in a parallel reporting workflow.",
                tags: [{ label: "Single source of truth", tone: "warning" }]
              }
            ]}
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
