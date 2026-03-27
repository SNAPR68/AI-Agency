import Link from "next/link";
import { type PresentationTone } from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import {
  getHostedWriteDisabledMessage,
  hostedWriteDisabledErrorCode
} from "../../../../lib/session";
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
  searchParams: Promise<{
    error?: string;
  }>;
};

function toneForDraft(status: string): PresentationTone {
  if (status === "ready_for_approval") {
    return "warning";
  }

  if (status === "approved" || status === "published") {
    return "positive";
  }

  if (status === "changes_requested" || status === "rejected") {
    return "danger";
  }

  return "neutral";
}

export default async function ContentPage({
  params,
  searchParams
}: ContentPageProps) {
  const { brandId } = await params;
  const { error } = await searchParams;
  const drafts = await listBrandDraftsAsync(brandId);
  const opportunities = await listBrandOpportunitiesAsync(brandId);
  const products = await listBrandProductsAsync(brandId);
  const starterOpportunities = opportunities.slice(0, 3);
  const starterProducts = products.slice(0, 2);
  const savedTrends = (await listTrendSignalsAsync(brandId)).slice(0, 3);

  return (
    <WorkspacePage
      model={{
        kicker: "Content Studio",
        title: "Drafts, hooks, and creator-ready execution",
        description: await getWorkflowNarrativeAsync(brandId),
        notice:
          error === hostedWriteDisabledErrorCode ? getHostedWriteDisabledMessage() : undefined,
        actions: [
          {
            label: "Generate Hooks",
            href: `/brands/${brandId}/content`
          },
          {
            label: "Open Calendar",
            href: `/brands/${brandId}/content/calendar`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Drafts in flight",
            value: `${drafts.length}`,
            note: "Seeded and user-created drafts currently in the workspace."
          },
          {
            label: "Ready for approval",
            value: `${drafts.filter((draft) => draft.status === "ready_for_approval").length}`,
            note: "Drafts prepared for the next review pass."
          },
          {
            label: "Open starters",
            value: `${starterOpportunities.filter((item) => !item.linkedDraftId).length}`,
            note: "Top opportunities that can still be turned into fresh drafts."
          }
        ]
      }}
    >
      <section className="studio-layout">
        <aside className="studio-sidebar">
          <section className="studio-card">
            <p className="editorial-section-label">Linked products</p>
            <h2 className="studio-card-title">Products driving the studio</h2>
            <p className="studio-card-copy">
              The best content starts from the product hierarchy, not a blank prompt.
            </p>

            <div className="studio-product-list">
              {starterProducts.map((product) => (
                <article key={product.id} className="studio-product-card">
                  <p className="studio-product-card-title">{product.title}</p>
                  <p className="studio-product-card-copy">{product.heroMessage}</p>
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
                      View product
                    </Link>
                    <form
                      action={`/api/brands/${brandId}/products/${product.id}/generate-draft`}
                      className="inline-form"
                      method="post"
                    >
                      <button className="button-link" type="submit">
                        Generate draft
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="studio-card" data-tone="warm">
            <p className="editorial-section-label">Saved trends</p>
            <h2 className="studio-card-title">Signals worth pulling into the brief</h2>
            <div className="studio-trend-list">
              {savedTrends.map((trend) => (
                <article key={trend.id} className="studio-product-card">
                  <p className="studio-product-card-title">{trend.title}</p>
                  <p className="studio-product-card-copy">{trend.responseAngle}</p>
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

        <div className="studio-main">
          <section className="studio-card">
            <div className="studio-card-head">
              <div>
                <p className="editorial-section-label">Studio modes</p>
                <h2 className="studio-card-title">Generation workspace</h2>
                <p className="studio-card-copy">
                  Keep the copy tied to live brand context and business priorities.
                </p>
              </div>
            </div>

            <div className="studio-tab-bar">
              <span className="studio-tab" data-active="true">Hooks</span>
              <span className="studio-tab">Captions</span>
              <span className="studio-tab">Video scripts</span>
              <span className="studio-tab">Creator briefs</span>
            </div>

            <div className="studio-brand-grid">
              <article className="studio-brand-rule">
                <p className="studio-brand-rule-title">Brand voice</p>
                <p className="studio-brand-rule-copy">Elevated, direct, product-first, and proof-led.</p>
              </article>
              <article className="studio-brand-rule">
                <p className="studio-brand-rule-title">Avoid</p>
                <p className="studio-brand-rule-copy">Generic hype, empty urgency, and angles not grounded in the product story.</p>
              </article>
            </div>

            <div className="studio-draft-stack">
              {drafts.map((draft) => (
                <article key={draft.id} className="studio-draft-card">
                  <div className="studio-draft-meta">
                    <div className="record-meta">
                      <span className="status-chip" data-tone="positive">
                        {draft.productTitle ?? "Manual draft"}
                      </span>
                      <span
                        className="status-chip"
                        data-tone={toneForDraft(draft.status)}
                      >
                        {formatDraftStatusLabel(draft.status)}
                      </span>
                    </div>
                    <span className="status-chip" data-tone="neutral">
                      {draft.channel}
                    </span>
                  </div>

                  <p className="studio-draft-quote">"{draft.hook}"</p>
                  <p className="studio-card-copy">{draft.caption}</p>

                  <div className="studio-draft-footer">
                    <div className="record-meta">
                      <span className="status-chip" data-tone="info">
                        {draft.angle}
                      </span>
                      <span className="status-chip" data-tone="neutral">
                        Updated {draft.updatedAtLabel}
                      </span>
                    </div>

                    <div className="record-actions">
                      <Link className="button-link-secondary" href={draft.href}>
                        Open draft
                      </Link>
                      {draft.status !== "ready_for_approval" ? (
                        <form
                          action={`/api/brands/${brandId}/content/drafts/${draft.id}/send-for-approval`}
                          className="inline-form"
                          method="post"
                        >
                          <input name="title" type="hidden" value={draft.title} />
                          <input name="channel" type="hidden" value={draft.channel} />
                          <input name="angle" type="hidden" value={draft.angle} />
                          <input name="hook" type="hidden" value={draft.hook} />
                          <input name="caption" type="hidden" value={draft.caption} />
                          <input name="script" type="hidden" value={draft.script} />
                          <input name="next" type="hidden" value={`/brands/${brandId}/content`} />
                          <button className="button-link" type="submit">
                            Send for approval
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="studio-card" data-tone="warm">
            <p className="editorial-section-label">Opportunity starters</p>
            <h2 className="studio-card-title">Turn business signals into assets</h2>
            <div className="studio-product-list">
              {starterOpportunities.map((opportunity) => (
                <article key={opportunity.id} className="studio-product-card">
                  <p className="studio-product-card-title">{opportunity.title}</p>
                  <p className="studio-product-card-copy">
                    {opportunity.recommendation} Owner: {opportunity.owner}.
                  </p>
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
                      <Link className="button-link" href={opportunity.linkedDraftHref}>
                        Open linked draft
                      </Link>
                    ) : (
                      <form
                        action={`/api/brands/${brandId}/opportunities/${opportunity.id}/generate-draft`}
                        className="inline-form"
                        method="post"
                      >
                        <button className="button-link" type="submit">
                          Generate draft
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </WorkspacePage>
  );
}
