import Link from "next/link";
import { getReportsDashboardDataAsync } from "../../../../lib/reports-data";

type ReportsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { brandId } = await params;
  const reports = await getReportsDashboardDataAsync(brandId);
  const founderCard = reports.summaryCards[0];
  const supportingCards = reports.summaryCards.slice(1);

  return (
    <div className="report-suite">
      <header className="command-header">
        <div className="command-header-copy">
          <h1 className="command-title">The Reporting Suite</h1>
          <p className="command-description">{reports.headline}</p>
        </div>

        <div className="report-suite-actions">
          <div className="report-freshness-pill">
            <span className="report-freshness-dot" />
            <span>Data freshness: {reports.generatedAtLabel}</span>
          </div>
          <div className="command-actions">
            <Link
              className="command-primary-button"
              href={`/api/brands/${brandId}/reports/founder/export`}
            >
              Export Founder Report
            </Link>
            <Link
              className="command-secondary-button"
              href={`/api/brands/${brandId}/reports/team/export`}
            >
              Export Team Report
            </Link>
            <button className="command-secondary-button" type="button">
              Schedule Report
            </button>
          </div>
        </div>
      </header>

      <section className="report-suite-grid">
        <article className="report-hero-card">
          <p className="command-mini-kicker">{founderCard?.audience ?? "Executive Narrative"}</p>
          <h2 className="report-hero-title">
            {founderCard?.title ?? "Founder's Growth Brief"}
          </h2>
          <p className="report-hero-copy">{founderCard?.description ?? reports.headline}</p>

          <div className="report-hero-meta">
            <div>
              <span className="report-meta-label">Last run</span>
              <span className="report-meta-value">{reports.generatedAtLabel}</span>
            </div>
            <div>
              <span className="report-meta-label">Status</span>
              <span className="report-meta-value report-meta-value-positive">Ready</span>
            </div>
          </div>

          <div className="report-point-list">
            {(founderCard?.keyPoints ?? []).map((point) => (
              <article key={point} className="report-point-item">
                <h3>{point}</h3>
              </article>
            ))}
          </div>
        </article>

        <div className="report-side-stack">
          {supportingCards.map((card) => (
            <article key={card.id} className="report-side-card">
              <p className="command-mini-kicker">{card.audience}</p>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <Link className="command-inline-link" href={card.href}>
                Share Report
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="report-detail-grid">
        <article className="report-format-card">
          <h2 className="report-block-title">Format Options</h2>
          <div className="report-format-list">
            <label className="report-format-option" data-active="true">
              <div>
                <strong>Editorial PDF</strong>
                <p>Founder-ready narrative export</p>
              </div>
              <input defaultChecked name="format" type="radio" />
            </label>
            <label className="report-format-option">
              <div>
                <strong>Data CSV</strong>
                <p>Operational tables and supporting rows</p>
              </div>
              <input name="format" type="radio" />
            </label>
            <label className="report-format-option">
              <div>
                <strong>Team Snapshot</strong>
                <p>Condensed execution view for operators</p>
              </div>
              <input name="format" type="radio" />
            </label>
          </div>
        </article>

        <article className="report-coverage-card">
          <h2 className="report-block-title">Reporting Coverage</h2>
          <div className="report-coverage-list">
            {reports.stats.map((stat) => (
              <article key={stat.label} className="report-coverage-item">
                <p className="command-mini-kicker">{stat.label}</p>
                <h3>{stat.value}</h3>
                <p>{stat.note}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
