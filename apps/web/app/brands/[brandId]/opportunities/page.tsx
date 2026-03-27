import Link from "next/link";
import {
  getWorkflowNarrativeAsync,
  listBrandOpportunitiesAsync
} from "../../../../lib/growth-workflow-data";

type OpportunitiesPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function formatImpactValue(priorityScore: number) {
  return `$${(priorityScore * 1400).toLocaleString("en-US")}`;
}

export default async function OpportunitiesPage({ params }: OpportunitiesPageProps) {
  const { brandId } = await params;
  const opportunities = await listBrandOpportunitiesAsync(brandId);
  const totalImpact = opportunities.reduce(
    (sum, opportunity) => sum + opportunity.priorityScore * 1400,
    0
  );

  return (
    <div className="commerce-suite">
      <header className="opportunity-header">
        <div className="opportunity-header-copy">
          <p className="command-kicker">Brand Priority Ledger</p>
          <h1 className="command-title">The Opportunity Queue</h1>
          <p className="command-description">{await getWorkflowNarrativeAsync(brandId)}</p>
        </div>

        <aside className="opportunity-impact-card">
          <span className="command-mini-kicker">Total Estimated Impact</span>
          <strong>${totalImpact.toLocaleString("en-US")}</strong>
          <p>Ranked business interventions currently identified in the workspace.</p>
        </aside>
      </header>

      <section className="commerce-toolbar">
        <div className="command-filter-bar">
          <button className="command-filter-chip" data-active="true" type="button">
            All Priorities
          </button>
          <button className="command-filter-chip" type="button">
            High Confidence
          </button>
          <button className="command-filter-chip" type="button">
            Immediate Impact
          </button>
          <button className="command-filter-chip" type="button">
            Under Review
          </button>
        </div>
      </section>

      <section className="commerce-table-shell">
        <div className="commerce-table-head opportunity-table-head">
          <span>Priority Opportunity</span>
          <span>Estimated Impact</span>
          <span>Confidence Level</span>
          <span>Evidence Snippet</span>
          <span className="commerce-head-actions">Status & Actions</span>
        </div>

        <div className="commerce-table-body">
          {opportunities.map((opportunity, index) => (
            <article key={opportunity.id} className="commerce-row opportunity-row">
              <div className="opportunity-main">
                <div className="opportunity-rank">{String(index + 1).padStart(2, "0")}</div>
                <div>
                  <p className="commerce-row-title">{opportunity.title}</p>
                  <p className="commerce-row-copy">
                    {opportunity.type} · {opportunity.owner}
                  </p>
                </div>
              </div>

              <div className="commerce-metric-cell">
                <strong>{formatImpactValue(opportunity.priorityScore)}</strong>
                <span>Potential lift</span>
              </div>

              <div className="commerce-metric-cell">
                <strong>{Math.round(opportunity.confidenceScore * 100)}%</strong>
                <span>Confidence level</span>
              </div>

              <div className="opportunity-evidence">
                <p>{opportunity.evidence}</p>
              </div>

              <div className="opportunity-actions">
                <span className="commerce-tag" data-tone={opportunity.status}>
                  {opportunity.status}
                </span>
                <div className="commerce-row-actions">
                  {opportunity.status !== "accepted" ? (
                    <form
                      action={`/api/brands/${brandId}/opportunities/${opportunity.id}/accept`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/opportunities`} />
                      <button className="command-primary-button" type="submit">
                        Accept Opportunity
                      </button>
                    </form>
                  ) : null}

                  {opportunity.linkedDraftHref ? (
                    <Link className="command-secondary-button" href={opportunity.linkedDraftHref}>
                      Generate Content
                    </Link>
                  ) : (
                    <form
                      action={`/api/brands/${brandId}/opportunities/${opportunity.id}/generate-draft`}
                      className="inline-form"
                      method="post"
                    >
                      <button className="command-secondary-button" type="submit">
                        Generate Content
                      </button>
                    </form>
                  )}

                  <Link
                    className="command-secondary-button"
                    href={`/brands/${brandId}/settings/users`}
                  >
                    Assign Owner
                  </Link>

                  {opportunity.status !== "dismissed" ? (
                    <form
                      action={`/api/brands/${brandId}/opportunities/${opportunity.id}/dismiss`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/opportunities`} />
                      <button className="command-inline-button" type="submit">
                        Dismiss
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
