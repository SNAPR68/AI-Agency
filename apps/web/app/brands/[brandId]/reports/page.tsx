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
    <section className="report-suite-v2">
      <header className="report-suite-v2-header">
        <div>
          <h1>The Reporting Suite</h1>
          <p>{reports.headline}</p>
        </div>

        <div className="report-suite-v2-actions">
          <div className="report-v2-freshness">
            <span className="report-v2-freshness-dot" />
            <span>Data Freshness: {reports.generatedAtLabel}</span>
          </div>
          <div className="command-header-actions">
            <Link className="button-link" href={`/api/brands/${brandId}/reports/founder/export`}>
              Export Founder Report
            </Link>
            <Link className="button-link-secondary" href={`/api/brands/${brandId}/reports/team/export`}>
              Export Team Report
            </Link>
            <button className="button-link-secondary" type="button">
              Schedule Report
            </button>
          </div>
        </div>
      </header>

      <section className="report-v2-hero-grid">
        <article className="report-v2-founder-card">
          <p className="editorial-section-label">{founderCard?.audience ?? "Executive Narrative"}</p>
          <h2>{founderCard?.title ?? "Founder Growth Brief"}</h2>
          <p>{founderCard?.description ?? reports.headline}</p>

          <div className="report-v2-meta">
            <article>
              <span>Last Run</span>
              <strong>{reports.generatedAtLabel}</strong>
            </article>
            <article>
              <span>Status</span>
              <strong>Ready</strong>
            </article>
          </div>
        </article>

        <div className="report-v2-side-stack">
          {supportingCards.map((card) => (
            <article key={card.id} className="report-v2-side-card">
              <p className="editorial-section-label">{card.audience}</p>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <Link className="workflow-inline-action" href={card.href}>
                Share Report
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="report-v2-detail-grid">
        <article className="report-v2-format-card">
          <h2>Format Options</h2>
          <div className="report-v2-format-list">
            <label className="report-v2-format-option" data-active="true">
              <div>
                <strong>Editorial PDF</strong>
                <p>Founder-ready narrative export</p>
              </div>
              <input defaultChecked name="format" type="radio" />
            </label>
            <label className="report-v2-format-option">
              <div>
                <strong>Data CSV</strong>
                <p>Operational tables and supporting rows</p>
              </div>
              <input name="format" type="radio" />
            </label>
            <label className="report-v2-format-option">
              <div>
                <strong>Team Snapshot</strong>
                <p>Condensed execution view for operators</p>
              </div>
              <input name="format" type="radio" />
            </label>
          </div>
        </article>

        <article className="report-v2-coverage-card">
          <div className="report-v2-coverage-head">
            <div>
              <h2>Reporting Coverage</h2>
              <p>Track the surfaces already represented inside the reporting layer.</p>
            </div>
            <button className="workflow-inline-action" type="button">
              Share Report
            </button>
          </div>

          <div className="report-v2-coverage-list">
            {reports.stats.map((stat) => (
              <article key={stat.label} className="report-v2-coverage-item">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <p>{stat.note}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
