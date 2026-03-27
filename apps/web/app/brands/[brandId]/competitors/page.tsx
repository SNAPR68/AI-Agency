import Link from "next/link";
import {
  getMarketNarrative,
  listCompetitorObservationsAsync
} from "../../../../lib/market-intelligence-data";

type CompetitorsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function urgencyTone(urgency: string) {
  if (urgency === "respond") {
    return "danger";
  }

  return "warning";
}

export default async function CompetitorsPage({ params }: CompetitorsPageProps) {
  const { brandId } = await params;
  const competitors = await listCompetitorObservationsAsync(brandId);
  const primaryObservation = competitors[0];
  const responseCount = competitors.filter((item) => item.urgency === "respond").length;
  const actedCount = competitors.filter((item) => item.state === "acted").length;

  return (
    <section className="market-suite">
      <header className="command-header">
        <div>
          <p className="command-kicker">Competitors</p>
          <h1>Competitor Monitoring</h1>
          <p className="command-copy">{getMarketNarrative(brandId)}</p>
        </div>
        <div className="command-header-actions">
          <button className="button-link-secondary" type="button">
            Add Competitor
          </button>
          <Link className="button-link" href={`/brands/${brandId}/content`}>
            Open Content Studio
          </Link>
        </div>
      </header>

      <div className="market-kpi-strip">
        <article className="market-kpi-card">
          <span>Competitor signals</span>
          <strong>{competitors.length}</strong>
          <p>Live category observations currently tracked in the workspace.</p>
        </article>
        <article className="market-kpi-card">
          <span>Needs response</span>
          <strong>{responseCount}</strong>
          <p>Observations strong enough to justify a direct answer.</p>
        </article>
        <article className="market-kpi-card">
          <span>Converted to work</span>
          <strong>{actedCount}</strong>
          <p>Signals already turned into response plans or live drafts.</p>
        </article>
      </div>

      <div className="competitor-grid">
        {primaryObservation ? (
          <section className="competitor-feature-card">
            <p className="market-evidence-kicker">Featured Observation</p>
            <h2>{primaryObservation.competitorName}</h2>
            <p>{primaryObservation.title}</p>
            <div className="competitor-feature-metrics">
              <article>
                <span>Urgency</span>
                <strong>{primaryObservation.urgency}</strong>
              </article>
              <article>
                <span>Last Seen</span>
                <strong>{primaryObservation.lastSeenLabel}</strong>
              </article>
            </div>
            <div className="market-evidence-panel">
              <div>
                <p className="market-evidence-kicker">Implication</p>
                <p>{primaryObservation.implication}</p>
              </div>
              <div>
                <p className="market-evidence-kicker">Response Angle</p>
                <p>{primaryObservation.responseAngle}</p>
              </div>
            </div>
          </section>
        ) : null}

        <div className="competitor-side-stack">
          <section className="competitor-side-card">
            <p className="market-evidence-kicker">Response Plan</p>
            <h2>Use signal, not mimicry.</h2>
            <p>
              The goal is to sharpen positioning and product proof, not mirror a competitor’s voice.
            </p>
          </section>
          <section className="competitor-side-card">
            <p className="market-evidence-kicker">Execution Rule</p>
            <h2>Convert observations into assets fast.</h2>
            <p>Interesting observations only matter once they become a sharper draft or response plan.</p>
          </section>
        </div>
      </div>

      <section className="market-table-shell">
        <div className="market-table-head">
          <span>Observation</span>
          <span>Urgency</span>
          <span>State</span>
          <span>Linked Product</span>
          <span>Actions</span>
        </div>
        <div className="market-table-body">
          {competitors.map((observation) => (
            <article key={observation.id} className="market-row">
              <div className="market-row-primary">
                <p className="market-row-title">{observation.title}</p>
                <p className="market-row-copy">
                  {observation.competitorName} · {observation.category} · {observation.observation}
                </p>
              </div>
              <div className="market-row-meta">
                <span className="status-chip" data-tone={urgencyTone(observation.urgency)}>
                  {observation.urgency}
                </span>
              </div>
              <div className="market-row-meta">
                <span className="status-chip" data-tone={observation.state === "acted" ? "positive" : "neutral"}>
                  {observation.state}
                </span>
              </div>
              <div className="market-row-meta">
                <Link className="workflow-inline-action" href={observation.productHref}>
                  View product
                </Link>
              </div>
              <div className="market-row-actions">
                {observation.state !== "saved" ? (
                  <form
                    action={`/api/brands/${brandId}/competitors/${observation.id}/save`}
                    className="inline-form"
                    method="post"
                  >
                    <input name="next" type="hidden" value={`/brands/${brandId}/competitors`} />
                    <button className="button-link-secondary" type="submit">
                      Save Observation
                    </button>
                  </form>
                ) : null}
                {observation.state !== "acted" ? (
                  <form
                    action={`/api/brands/${brandId}/competitors/${observation.id}/create-response-plan`}
                    className="inline-form"
                    method="post"
                  >
                    <input name="next" type="hidden" value={`/brands/${brandId}/competitors`} />
                    <button className="button-link-secondary" type="submit">
                      Create Response Plan
                    </button>
                  </form>
                ) : null}
                {observation.linkedDraftHref ? (
                  <Link className="button-link" href={observation.linkedDraftHref}>
                    Generate Counter Content
                  </Link>
                ) : (
                  <form
                    action={`/api/brands/${brandId}/competitors/${observation.id}/generate-draft`}
                    className="inline-form"
                    method="post"
                  >
                    <button className="button-link" type="submit">
                      Generate Counter Content
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
