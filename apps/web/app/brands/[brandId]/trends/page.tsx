import Link from "next/link";
import {
  getMarketNarrative,
  listTrendSignalsAsync
} from "../../../../lib/market-intelligence-data";

type TrendsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function trendTone(status: string) {
  if (status === "hot") {
    return "danger";
  }

  if (status === "emerging") {
    return "positive";
  }

  return "warning";
}

export default async function TrendsPage({ params }: TrendsPageProps) {
  const { brandId } = await params;
  const trends = await listTrendSignalsAsync(brandId);
  const primaryTrend = trends[0];
  const highFit = trends.filter((trend) => trend.fitScore >= 85).length;
  const acted = trends.filter((trend) => trend.state === "acted").length;

  return (
    <section className="market-suite">
      <header className="command-header">
        <div>
          <p className="command-kicker">Trends</p>
          <h1>Trend Intelligence</h1>
          <p className="command-copy">{getMarketNarrative(brandId)}</p>
        </div>
        <div className="command-header-actions">
          <Link className="button-link-secondary" href={`/brands/${brandId}/opportunities`}>
            Open Opportunities
          </Link>
          <Link className="button-link" href={`/brands/${brandId}/content`}>
            Open Content Studio
          </Link>
        </div>
      </header>

      <div className="market-kpi-strip">
        <article className="market-kpi-card">
          <span>Trend signals</span>
          <strong>{trends.length}</strong>
          <p>Active market narratives being tracked inside the workspace.</p>
        </article>
        <article className="market-kpi-card">
          <span>High-fit trends</span>
          <strong>{highFit}</strong>
          <p>Signals strong enough to justify immediate creative attention.</p>
        </article>
        <article className="market-kpi-card">
          <span>Acted on</span>
          <strong>{acted}</strong>
          <p>Signals already translated into work or live drafts.</p>
        </article>
      </div>

      <div className="market-grid">
        <section className="market-table-shell">
          <div className="market-table-head">
            <span>Trend</span>
            <span>Velocity</span>
            <span>Fit</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          <div className="market-table-body">
            {trends.map((trend) => (
              <article key={trend.id} className="market-row">
                <div className="market-row-primary">
                  <p className="market-row-title">{trend.title}</p>
                  <p className="market-row-copy">
                    {trend.platform} · {trend.recommendedFormat} · {trend.responseAngle}
                  </p>
                </div>
                <div className="market-row-meta">
                  <span className="status-chip" data-tone={trendTone(trend.status)}>
                    {trend.urgencyScore}% urgency
                  </span>
                </div>
                <div className="market-row-meta">
                  <span className="status-chip" data-tone="info">
                    {trend.fitScore}% fit
                  </span>
                </div>
                <div className="market-row-meta">
                  <span className="status-chip" data-tone={trend.state === "acted" ? "positive" : "neutral"}>
                    {trend.state}
                  </span>
                </div>
                <div className="market-row-actions">
                  {trend.state !== "acted" ? (
                    <form
                      action={`/api/brands/${brandId}/trends/${trend.id}/act`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/trends`} />
                      <button className="button-link" type="submit">
                        Act on Trend
                      </button>
                    </form>
                  ) : trend.linkedDraftHref ? (
                    <Link className="button-link" href={trend.linkedDraftHref}>
                      Open Draft
                    </Link>
                  ) : null}
                  {trend.state !== "saved" ? (
                    <form
                      action={`/api/brands/${brandId}/trends/${trend.id}/save`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/trends`} />
                      <button className="button-link-secondary" type="submit">
                        Save Trend
                      </button>
                    </form>
                  ) : null}
                  {trend.linkedDraftHref ? (
                    <Link className="button-link-secondary" href={trend.linkedDraftHref}>
                      Generate Angle
                    </Link>
                  ) : (
                    <form
                      action={`/api/brands/${brandId}/trends/${trend.id}/generate-draft`}
                      className="inline-form"
                      method="post"
                    >
                      <button className="button-link-secondary" type="submit">
                        Generate Angle
                      </button>
                    </form>
                  )}
                  <Link className="button-link-secondary" href={trend.productHref}>
                    Link Product
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {primaryTrend ? (
          <aside className="market-evidence-panel">
            <div>
              <p className="market-evidence-kicker">Evidence Panel</p>
              <h2>{primaryTrend.title}</h2>
              <p>{primaryTrend.platform} · {primaryTrend.recommendedFormat}</p>
            </div>
            <div>
              <p className="market-evidence-kicker">Source Signals</p>
              <p>{primaryTrend.evidence}</p>
            </div>
            <div>
              <p className="market-evidence-kicker">Opportunity</p>
              <p>{primaryTrend.opportunity}</p>
            </div>
            <div>
              <p className="market-evidence-kicker">Response Angle</p>
              <p>{primaryTrend.responseAngle}</p>
            </div>
            <div className="record-meta">
              <span className="status-chip" data-tone="info">
                {primaryTrend.fitScore}/100 fit
              </span>
              <span className="status-chip" data-tone={trendTone(primaryTrend.status)}>
                {primaryTrend.status}
              </span>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
