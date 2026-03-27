import { notFound } from "next/navigation";
import Link from "next/link";
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
    <div className="brief-story-page">
      <header className="brief-story-header">
        <div className="brief-story-header-copy">
          <p className="command-kicker">Internal Executive Briefing</p>
          <h1 className="brief-story-display">
            Weekly Performance Brief:
            <br />
            <span>{brief.weekLabel}</span>
          </h1>
          <p className="brief-story-subtitle">
            Generated for {brief.audience} • {brief.status}
          </p>
        </div>

        <div className="command-actions">
          <Link className="command-secondary-button" href={`/brands/${brandId}/reports`}>
            Share Brief
          </Link>
          <Link className="command-secondary-button" href={`/brands/${brandId}/content`}>
            Create Content Plan
          </Link>
          <Link className="command-primary-button" href={`/brands/${brandId}/briefs`}>
            Mark Reviewed
          </Link>
        </div>
      </header>

      <section className="brief-hero-grid">
        <article className="brief-summary-card">
          <p className="command-mini-kicker">Executive Summary</p>
          <div className="brief-summary-copy">
            <p>{brief.summary}</p>
            <p>
              This is the founder-ready operating narrative: what changed, why it
              changed, and where the team should place its attention next.
            </p>
          </div>
        </article>

        <aside className="brief-kpi-stack">
          <article className="brief-kpi-card brief-kpi-card-large">
            <p className="command-mini-kicker">Status</p>
            <p className="brief-kpi-value">{brief.status}</p>
            <p className="brief-kpi-note">{brief.audience}</p>
          </article>
          <article className="brief-kpi-card">
            <p className="command-mini-kicker">Highlights</p>
            <p className="brief-kpi-value">{brief.highlightsCount}</p>
            <p className="brief-kpi-note">Wins and risks captured</p>
          </article>
          <article className="brief-kpi-card">
            <p className="command-mini-kicker">Next actions</p>
            <p className="brief-kpi-value">{brief.actionsCount}</p>
            <p className="brief-kpi-note">Follow-up items in the cycle</p>
          </article>
        </aside>
      </section>

      <section className="brief-columns">
        <div className="brief-column">
          <div className="brief-section-heading" data-tone="positive">
            <span className="brief-section-line" />
            <h2>The Wins</h2>
          </div>

          <div className="brief-story-list">
            {brief.topWins.map((item) => (
              <article key={item.title} className="brief-story-item">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="brief-column">
          <div className="brief-section-heading" data-tone="danger">
            <span className="brief-section-line" />
            <h2>The Risks</h2>
          </div>

          <div className="brief-story-list">
            {brief.topRisks.map((item) => (
              <article key={item.title} className="brief-story-item">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="brief-analysis-panel">
        <p className="command-mini-kicker">What Changed &amp; Why</p>
        <div className="brief-analysis-grid">
          <div className="brief-analysis-list">
            {brief.whyItChanged.map((item) => (
              <article key={item.title} className="brief-analysis-item">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>

          <div className="brief-actions-stack">
            <p className="command-mini-kicker">Recommended next actions</p>
            {brief.nextActions.map((item) => (
              <Link key={item.title} className="brief-action-card" href={item.href}>
                <div className="brief-action-head">
                  <span className="status-chip" data-tone="info">
                    {item.owner}
                  </span>
                  <span className="status-chip" data-tone="neutral">
                    {item.dueLabel}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="command-inline-link">
                  Open workflow
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
