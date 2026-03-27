import Link from "next/link";
import {
  getWorkflowNarrativeAsync,
  listBrandDraftsAsync,
  listBrandOpportunitiesAsync,
  listBrandProductsAsync
} from "../../../../lib/growth-workflow-data";
import { listTrendSignalsAsync } from "../../../../lib/market-intelligence-data";
import { formatDraftStatusLabel } from "../../../../lib/workflow-execution-data";

type ContentPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function draftTone(status: string) {
  if (status === "published" || status === "approved") {
    return "positive";
  }

  if (status === "ready_for_approval") {
    return "warning";
  }

  if (status === "changes_requested" || status === "rejected") {
    return "danger";
  }

  return "neutral";
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { brandId } = await params;
  const drafts = await listBrandDraftsAsync(brandId);
  const opportunities = await listBrandOpportunitiesAsync(brandId);
  const products = await listBrandProductsAsync(brandId);
  const trends = await listTrendSignalsAsync(brandId);

  const contextProducts = products.slice(0, 2);
  const savedTrends = trends.filter((trend) => trend.state !== "acted").slice(0, 3);
  const featuredDrafts = drafts.slice(0, 2);
  const starterOpportunity = opportunities.find((opportunity) => !opportunity.linkedDraftId) ?? opportunities[0];
  const sendableDraft =
    drafts.find((draft) => draft.status !== "ready_for_approval" && draft.status !== "approved") ?? drafts[0];

  return (
    <section className="studio-suite">
      <header className="command-header">
        <div>
          <p className="command-kicker">Content Studio</p>
          <h1>Generate hooks, captions, scripts, and creator-ready copy.</h1>
          <p className="command-copy">{await getWorkflowNarrativeAsync(brandId)}</p>
        </div>

        <div className="command-header-actions">
          {starterOpportunity ? (
            <form
              action={`/api/brands/${brandId}/opportunities/${starterOpportunity.id}/generate-draft`}
              className="inline-form"
              method="post"
            >
              <button className="button-link" type="submit">
                Generate Hooks
              </button>
            </form>
          ) : (
            <Link className="button-link" href={`/brands/${brandId}/content`}>
              Generate Hooks
            </Link>
          )}
          <button className="button-link-secondary" type="button">
            Create Creator Brief
          </button>
        </div>
      </header>

      <div className="studio-shell">
        <aside className="studio-context-rail">
          <section className="studio-context-card">
            <p className="editorial-section-label">Linked Products</p>
            <h2>Products driving the active creative queue.</h2>
            <div className="studio-context-stack">
              {contextProducts.map((product) => (
                <article key={product.id} className="studio-context-product">
                  <div className="studio-context-product-image" />
                  <div className="studio-context-product-copy">
                    <p className="studio-context-product-label">SKU surface</p>
                    <h3>{product.title}</h3>
                    <p>{product.heroMessage}</p>
                    <div className="record-meta">
                      <span className="status-chip" data-tone={product.status === "rising" ? "positive" : "warning"}>
                        {product.status}
                      </span>
                      <span className="status-chip" data-tone="neutral">
                        {product.linkedDraftCount} drafts
                      </span>
                    </div>
                    <div className="record-actions">
                      <Link className="button-link-secondary" href={product.href}>
                        View Product
                      </Link>
                      <form
                        action={`/api/brands/${brandId}/products/${product.id}/generate-draft`}
                        className="inline-form"
                        method="post"
                      >
                        <button className="button-link" type="submit">
                          Generate Script
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="studio-context-card studio-context-card-warm">
            <p className="editorial-section-label">Saved Trends</p>
            <h2>Signals worth pulling into the brief.</h2>
            <div className="studio-signal-list">
              {savedTrends.map((trend) => (
                <article key={trend.id} className="studio-signal-item">
                  <div>
                    <p className="studio-signal-title">{trend.title}</p>
                    <p className="studio-signal-copy">{trend.responseAngle}</p>
                  </div>
                  <div className="record-meta">
                    <span className="status-chip" data-tone="info">
                      {trend.fitScore} fit
                    </span>
                    <span className="status-chip" data-tone="neutral">
                      {trend.platform}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </aside>

        <div className="studio-canvas">
          <section className="studio-generation-card">
            <div className="studio-tab-row">
              <nav className="studio-tab-bar">
                <span className="studio-tab studio-tab-active">Hooks</span>
                <span className="studio-tab">Captions</span>
                <span className="studio-tab">Video Scripts</span>
                <span className="studio-tab">Creator Briefs</span>
              </nav>
              {starterOpportunity ? (
                <form
                  action={`/api/brands/${brandId}/opportunities/${starterOpportunity.id}/generate-draft`}
                  className="inline-form"
                  method="post"
                >
                  <button className="studio-generate-button" type="submit">
                    Generate Hooks
                  </button>
                </form>
              ) : null}
            </div>

            <div className="studio-brand-reminder">
              <article>
                <p className="studio-brand-label">Brand Voice</p>
                <h3>Elevated, direct, and product-first.</h3>
              </article>
              <article>
                <p className="studio-brand-label studio-brand-label-danger">Avoid</p>
                <h3>Generic hype, empty urgency, and soft proof.</h3>
              </article>
            </div>

            <div className="studio-generated-stack">
              {featuredDrafts.map((draft, index) => (
                <article key={draft.id} className="studio-generated-card">
                  <div className="studio-generated-head">
                    <div className="studio-generated-meta">
                      <span className="studio-concept-pill">Concept {String.fromCharCode(65 + index)}</span>
                      <span className="studio-generated-note">{draft.angle}</span>
                    </div>
                    <div className="record-meta">
                      <span className="status-chip" data-tone={draftTone(draft.status)}>
                        {formatDraftStatusLabel(draft.status)}
                      </span>
                      <span className="status-chip" data-tone="neutral">
                        {draft.channel}
                      </span>
                    </div>
                  </div>

                  <blockquote className="studio-generated-hook">"{draft.hook}"</blockquote>
                  <p className="studio-generated-copy">{draft.caption}</p>

                  <div className="studio-generated-footer">
                    <div className="studio-generated-actions">
                      <Link className="studio-inline-link" href={draft.href}>
                        Open draft
                      </Link>
                      <button className="studio-inline-link" type="button">
                        Variations
                      </button>
                    </div>
                    <span className="studio-confidence">Updated {draft.updatedAtLabel}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="studio-footer-actions">
              {sendableDraft ? (
                <Link className="button-link-secondary" href={sendableDraft.href}>
                  Save Draft
                </Link>
              ) : (
                <button className="button-link-secondary" type="button">
                  Save Draft
                </button>
              )}
              {sendableDraft ? (
                <form
                  action={`/api/brands/${brandId}/content/drafts/${sendableDraft.id}/send-for-approval`}
                  className="inline-form"
                  method="post"
                >
                  <input name="title" type="hidden" value={sendableDraft.title} />
                  <input name="channel" type="hidden" value={sendableDraft.channel} />
                  <input name="angle" type="hidden" value={sendableDraft.angle} />
                  <input name="hook" type="hidden" value={sendableDraft.hook} />
                  <input name="caption" type="hidden" value={sendableDraft.caption} />
                  <input name="script" type="hidden" value={sendableDraft.script} />
                  <input name="next" type="hidden" value={`/brands/${brandId}/content`} />
                  <button className="button-link" type="submit">
                    Send for Approval
                  </button>
                </form>
              ) : null}
            </div>
          </section>

          <section className="studio-opportunity-card">
            <div className="studio-opportunity-head">
              <div>
                <p className="editorial-section-label">Opportunity Starters</p>
                <h2>Turn business signals directly into assets.</h2>
              </div>
            </div>

            <div className="studio-opportunity-grid">
              {opportunities.slice(0, 3).map((opportunity) => (
                <article key={opportunity.id} className="studio-opportunity-item">
                  <div>
                    <p className="studio-opportunity-title">{opportunity.title}</p>
                    <p className="studio-opportunity-copy">{opportunity.recommendation}</p>
                  </div>
                  <div className="record-meta">
                    <span
                      className="status-chip"
                      data-tone={opportunity.status === "accepted" ? "positive" : "warning"}
                    >
                      {opportunity.status}
                    </span>
                    <span className="status-chip" data-tone="info">
                      {opportunity.priorityScore} priority
                    </span>
                  </div>
                  <div className="record-actions">
                    {opportunity.linkedDraftHref ? (
                      <Link className="button-link-secondary" href={opportunity.linkedDraftHref}>
                        Open Draft
                      </Link>
                    ) : (
                      <form
                        action={`/api/brands/${brandId}/opportunities/${opportunity.id}/generate-draft`}
                        className="inline-form"
                        method="post"
                      >
                        <button className="button-link" type="submit">
                          Generate Script
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
