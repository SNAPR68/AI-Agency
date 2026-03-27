import Link from "next/link";
import {
  getCustomerOpsNarrative,
  listRetentionSignalsAsync
} from "../../../../lib/customer-ops-data";

type RetentionPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function parsePercent(value: string) {
  return Number.parseFloat(value.replace("%", "")) || 0;
}

function stateTone(state: string) {
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

function riskTone(risk: string) {
  if (risk === "high") {
    return "danger";
  }

  if (risk === "medium") {
    return "warning";
  }

  return "positive";
}

export default async function RetentionPage({ params }: RetentionPageProps) {
  const { brandId } = await params;
  const items = await listRetentionSignalsAsync(brandId);
  const primaryItem = items[0] ?? null;
  const repeatAverage =
    items.length > 0
      ? `${(items.reduce((sum, item) => sum + parsePercent(item.repeatPurchaseRate), 0) / items.length).toFixed(1)}%`
      : "0.0%";
  const highRiskCount = items.filter((item) => item.churnRisk === "high").length;
  const plansInMotion = items.filter(
    (item) => item.state === "planned" || item.state === "acted"
  ).length;
  const linkedDraftCount = items.filter((item) => item.linkedDraftHref).length;

  return (
    <section className="ops-intelligence-suite">
      <header className="command-header">
        <div className="command-header-copy">
          <p className="command-kicker">Retention</p>
          <h1 className="command-title">Retention Intelligence</h1>
          <p className="command-description">{getCustomerOpsNarrative(brandId)}</p>
        </div>

        <div className="command-actions">
          <Link className="command-secondary-button" href={`/brands/${brandId}/reports`}>
            Export Cohort
          </Link>
          {primaryItem ? (
            primaryItem.linkedDraftHref ? (
              <Link className="command-primary-button" href={primaryItem.linkedDraftHref}>
                Generate Retention Ideas
              </Link>
            ) : (
              <form
                action={`/api/brands/${brandId}/retention/${primaryItem.id}/generate-draft`}
                className="inline-form"
                method="post"
              >
                <button className="command-primary-button" type="submit">
                  Generate Retention Ideas
                </button>
              </form>
            )
          ) : null}
          {primaryItem && primaryItem.state !== "flagged" ? (
            <form
              action={`/api/brands/${brandId}/retention/${primaryItem.id}/flag`}
              className="inline-form"
              method="post"
            >
              <input name="next" type="hidden" value={`/brands/${brandId}/retention`} />
              <button className="command-secondary-button" type="submit">
                Flag Segment
              </button>
            </form>
          ) : null}
          {primaryItem && primaryItem.state !== "planned" ? (
            <form
              action={`/api/brands/${brandId}/retention/${primaryItem.id}/create-lifecycle-plan`}
              className="inline-form"
              method="post"
            >
              <input name="next" type="hidden" value={`/brands/${brandId}/retention`} />
              <button className="command-secondary-button" type="submit">
                Create Lifecycle Plan
              </button>
            </form>
          ) : null}
        </div>
      </header>

      <div className="ops-intelligence-kpis">
        <article className="ops-intelligence-kpi">
          <span>Retention rate</span>
          <strong>{repeatAverage}</strong>
          <p>Average repeat-purchase signal across the currently tracked lifecycle segments.</p>
        </article>
        <article className="ops-intelligence-kpi">
          <span>High-risk segments</span>
          <strong>{highRiskCount}</strong>
          <p>Segments that need intervention before the next repeat window closes.</p>
        </article>
        <article className="ops-intelligence-kpi">
          <span>Plans in motion</span>
          <strong>{plansInMotion}</strong>
          <p>Signals already routed into an active lifecycle response.</p>
        </article>
        <article className="ops-intelligence-kpi" data-tone="warning">
          <span>Drafts linked</span>
          <strong>{linkedDraftCount}</strong>
          <p>Retention signals already translated into reusable content or lifecycle assets.</p>
        </article>
      </div>

      <div className="ops-intelligence-grid">
        <section className="ops-intelligence-table-shell">
          <div className="ops-intelligence-table-head ops-intelligence-table-head-retention">
            <span>Segment</span>
            <span>Repeat Rate</span>
            <span>Risk</span>
            <span>State</span>
            <span>Actions</span>
          </div>

          <div className="ops-intelligence-body">
            {items.map((item, index) => (
              <article
                key={item.id}
                className="ops-intelligence-row ops-intelligence-row-retention"
                data-active={index === 0}
              >
                <div className="ops-intelligence-cell-primary">
                  <strong>{item.title}</strong>
                  <p>
                    {item.segment}. {item.evidence}
                  </p>
                </div>
                <div className="ops-intelligence-cell-metric">
                  <strong>{item.repeatPurchaseRate}</strong>
                  <span>Repeat rate</span>
                </div>
                <div className="record-meta">
                  <span className="status-chip" data-tone={riskTone(item.churnRisk)}>
                    {item.churnRisk} risk
                  </span>
                </div>
                <div className="record-meta">
                  <span className="status-chip" data-tone={stateTone(item.state)}>
                    {item.state}
                  </span>
                </div>
                <div className="ops-intelligence-actions">
                  <Link className="button-link-secondary" href={item.productHref}>
                    View Product
                  </Link>
                  {item.linkedDraftHref ? (
                    <Link className="button-link" href={item.linkedDraftHref}>
                      Open Draft
                    </Link>
                  ) : (
                    <form
                      action={`/api/brands/${brandId}/retention/${item.id}/generate-draft`}
                      className="inline-form"
                      method="post"
                    >
                      <button className="button-link" type="submit">
                        Generate Retention Ideas
                      </button>
                    </form>
                  )}
                  {item.state !== "flagged" ? (
                    <form
                      action={`/api/brands/${brandId}/retention/${item.id}/flag`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/retention`} />
                      <button className="button-link-secondary" type="submit">
                        Flag Segment
                      </button>
                    </form>
                  ) : null}
                  {item.state !== "planned" ? (
                    <form
                      action={`/api/brands/${brandId}/retention/${item.id}/create-lifecycle-plan`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/retention`} />
                      <button className="button-link-secondary" type="submit">
                        Create Lifecycle Plan
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="ops-intelligence-side">
          {primaryItem ? (
            <article className="ops-intelligence-card">
              <p className="command-mini-kicker">Active Segment</p>
              <h2>{primaryItem.title}</h2>
              <div className="ops-intelligence-block">
                <span>Evidence</span>
                <p>{primaryItem.evidence}</p>
              </div>
              <div className="ops-intelligence-block">
                <span>Implication</span>
                <p>{primaryItem.implication}</p>
              </div>
              <div className="ops-intelligence-block">
                <span>Recommendation</span>
                <p>{primaryItem.recommendation}</p>
              </div>
              <div className="record-meta">
                <span className="status-chip" data-tone={riskTone(primaryItem.churnRisk)}>
                  {primaryItem.churnRisk} risk
                </span>
                <span className="status-chip" data-tone="info">
                  {primaryItem.repeatPurchaseRate}
                </span>
              </div>
            </article>
          ) : null}

          <article className="ops-intelligence-card" data-tone="warm">
            <p className="command-mini-kicker">Lifecycle posture</p>
            <h2>How to use retention signals</h2>
            <div className="ops-intelligence-notes">
              <article>
                <strong>Treat retention like a product story problem.</strong>
                <p>Every plan should reinforce why the product earns another order, not just when to ask for one.</p>
              </article>
              <article>
                <strong>Flag segments before they become a revenue hole.</strong>
                <p>Earlier warnings make it easier to respond with messaging instead of expensive reacquisition.</p>
              </article>
              <article>
                <strong>Turn the signal into an asset quickly.</strong>
                <p>High-leverage lifecycle segments should become real drafts or briefs, not stay abstract.</p>
              </article>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
