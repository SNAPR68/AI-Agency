import Link from "next/link";
import { notFound } from "next/navigation";
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
    <section className="brief-suite">
      <header className="brief-suite-header">
        <div>
          <p className="command-kicker">Internal Executive Briefing</p>
          <h1>
            Weekly Performance Brief:
            <br />
            <span>{brief.weekLabel}</span>
          </h1>
          <p className="brief-suite-subtitle">
            Generated for {brief.audience} · {brief.status}
          </p>
        </div>

        <div className="command-header-actions">
          <Link className="button-link-secondary" href={`/brands/${brandId}/reports`}>
            Share Brief
          </Link>
          <Link className="button-link-secondary" href={`/brands/${brandId}/content`}>
            Create Content Plan
          </Link>
          <Link className="button-link" href={`/brands/${brandId}/briefs`}>
            Mark Reviewed
          </Link>
        </div>
      </header>

      <section className="brief-suite-hero">
        <article className="brief-suite-summary">
          <p className="editorial-section-label">Executive Summary</p>
          <div className="brief-suite-summary-copy">
            <p>{brief.summary}</p>
            <p>
              This is the founder-ready operating narrative: what changed, why it changed, and where the team should
              place its attention next.
            </p>
          </div>
        </article>

        <aside className="brief-suite-kpis">
          <article className="brief-suite-kpi brief-suite-kpi-large">
            <span>Status</span>
            <strong>{brief.status}</strong>
            <p>{brief.audience}</p>
          </article>
          <article className="brief-suite-kpi">
            <span>Highlights</span>
            <strong>{brief.highlightsCount}</strong>
            <p>Wins and risks captured</p>
          </article>
          <article className="brief-suite-kpi">
            <span>Next actions</span>
            <strong>{brief.actionsCount}</strong>
            <p>Follow-up items in the cycle</p>
          </article>
        </aside>
      </section>

      <section className="brief-suite-columns">
        <div className="brief-suite-column">
          <div className="brief-suite-column-head" data-tone="positive">
            <span />
            <h2>The Wins</h2>
          </div>
          <div className="brief-suite-list">
            {brief.topWins.map((item) => (
              <article key={item.title} className="brief-suite-item">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="brief-suite-column">
          <div className="brief-suite-column-head" data-tone="danger">
            <span />
            <h2>The Risks</h2>
          </div>
          <div className="brief-suite-list">
            {brief.topRisks.map((item) => (
              <article key={item.title} className="brief-suite-item">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="brief-suite-analysis">
        <div className="brief-suite-analysis-main">
          <p className="editorial-section-label">What Changed &amp; Why</p>
          <div className="brief-suite-analysis-grid">
            {brief.whyItChanged.map((item) => (
              <article key={item.title} className="brief-suite-analysis-item">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="brief-suite-actions">
          <p className="editorial-section-label">Recommended Next Actions</p>
          <div className="brief-suite-actions-list">
            {brief.nextActions.map((item) => (
              <Link key={item.title} className="brief-suite-action-card" href={item.href}>
                <div className="brief-suite-action-head">
                  <span className="status-chip" data-tone="info">
                    {item.owner}
                  </span>
                  <span className="status-chip" data-tone="neutral">
                    {item.dueLabel}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="workflow-inline-action">Open workflow</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </section>
  );
}
