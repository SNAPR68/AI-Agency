import {
  formatDraftStatusLabel,
  listApprovalItemsAsync
} from "../../../../lib/workflow-execution-data";

type ApprovalsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function approvalState(status: string) {
  if (status === "approved") {
    return "Approved";
  }

  if (status === "changes_requested") {
    return "Changes";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return "Reviewing";
}

function approvalPriority(status: string) {
  if (status === "ready_for_approval") {
    return "High";
  }

  if (status === "changes_requested") {
    return "Medium";
  }

  return "Low";
}

export default async function ApprovalsPage({ params }: ApprovalsPageProps) {
  const { brandId } = await params;
  const approvals = await listApprovalItemsAsync(brandId);
  const pending = approvals.filter((item) => item.status === "ready_for_approval");
  const changesRequested = approvals.filter((item) => item.status === "changes_requested");
  const approved = approvals.filter((item) => item.status === "approved");
  const primaryItem = approvals[0];

  return (
    <section className="workflow-suite">
      <header className="command-header">
        <div>
          <p className="command-kicker">Approvals</p>
          <h1>Workflow Approvals</h1>
          <p className="command-copy">
            Manage pending approvals for briefs, drafts, and publish actions. Keep brand integrity tight while the
            team keeps moving.
          </p>
        </div>

        <div className="command-header-actions">
          <button className="button-link-secondary" type="button">
            Filter Queue
          </button>
          <button className="button-link" type="button">
            Bulk Approve
          </button>
        </div>
      </header>

      <div className="workflow-kpi-strip">
        <article className="workflow-kpi-card">
          <span>Pending review</span>
          <strong>{pending.length}</strong>
          <p>Drafts actively waiting on a review decision.</p>
        </article>
        <article className="workflow-kpi-card">
          <span>Changes requested</span>
          <strong>{changesRequested.length}</strong>
          <p>Items sent back for another pass.</p>
        </article>
        <article className="workflow-kpi-card">
          <span>Approved</span>
          <strong>{approved.length}</strong>
          <p>Assets already cleared for publishing.</p>
        </article>
      </div>

      <div className="workflow-layout">
        <section className="workflow-table-shell">
          <div className="workflow-table-head">
            <span />
            <span>Item</span>
            <span>Type</span>
            <span>Submitter</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="workflow-table-body">
            {approvals.map((draft, index) => (
              <article key={draft.id} className="workflow-row" data-active={index === 0}>
                <span className="workflow-checkbox">
                  <i />
                </span>
                <div className="workflow-cell-primary">
                  <strong>{draft.title}</strong>
                  <p>{draft.productTitle ? `Product: ${draft.productTitle}` : draft.channel}</p>
                </div>
                <div className="workflow-cell-tag">
                  <span className="workflow-badge">{draft.channel}</span>
                </div>
                <div className="workflow-cell-user">
                  <span className="workflow-avatar" />
                  <span>{draft.productTitle ?? "Studio queue"}</span>
                </div>
                <div className="workflow-cell-priority" data-priority={approvalPriority(draft.status).toLowerCase()}>
                  {approvalPriority(draft.status)}
                </div>
                <div className="workflow-cell-status">
                  <span className="workflow-status-dot" data-status={draft.status} />
                  {approvalState(draft.status)}
                </div>
                <div className="workflow-cell-actions">
                  <a className="workflow-icon-button" href={draft.href}>
                    Open
                  </a>
                </div>
              </article>
            ))}
          </div>

          <div className="workflow-table-footer">
            <span>Showing {approvals.length} approval items</span>
            <div className="workflow-pagination">
              <button type="button">Previous</button>
              <button type="button">Next Page</button>
            </div>
          </div>
        </section>

        {primaryItem ? (
          <aside className="workflow-review-card">
            <div className="workflow-review-head">
              <div>
                <p className="editorial-section-label">Reviewing Draft</p>
                <h2>{primaryItem.title}</h2>
              </div>
            </div>

            <div className="workflow-review-meta-grid">
              <article>
                <span>Submitter</span>
                <strong>{primaryItem.productTitle ?? "Studio queue"}</strong>
              </article>
              <article>
                <span>Status</span>
                <strong>{formatDraftStatusLabel(primaryItem.status)}</strong>
              </article>
            </div>

            <section className="workflow-preview-card">
              <p className="workflow-preview-kicker">Content Preview</p>
              <blockquote>{primaryItem.hook}</blockquote>
              <p>{primaryItem.caption}</p>
            </section>

            <section className="workflow-preview-card workflow-preview-card-note">
              <p className="workflow-preview-kicker">Reviewer Rationale</p>
              <p>
                Approve when the asset is grounded in the product story, request changes when the signal is right but
                the execution still drifts.
              </p>
              <div className="workflow-note-meta">
                <span>Automated quality check</span>
                <span>{primaryItem.reviewState}</span>
              </div>
            </section>

            <section className="workflow-preview-card">
              <p className="workflow-preview-kicker">Submission History</p>
              <div className="workflow-history-list">
                <article>
                  <strong>Draft submitted</strong>
                  <p>Moved into review on the latest workspace pass.</p>
                </article>
                <article>
                  <strong>Product context linked</strong>
                  <p>{primaryItem.productTitle ?? "Manual studio source"} kept attached for reviewer clarity.</p>
                </article>
              </div>
            </section>

            <div className="workflow-review-actions-grid">
              <form
                action={`/api/brands/${brandId}/approvals/${primaryItem.id}/reject`}
                className="inline-form"
                method="post"
              >
                <input name="next" type="hidden" value={`/brands/${brandId}/approvals`} />
                <button className="workflow-action-button workflow-action-button-danger" type="submit">
                  Reject
                </button>
              </form>
              <form
                action={`/api/brands/${brandId}/approvals/${primaryItem.id}/request-changes`}
                className="inline-form"
                method="post"
              >
                <input name="next" type="hidden" value={`/brands/${brandId}/approvals`} />
                <button className="workflow-action-button workflow-action-button-muted" type="submit">
                  Request Changes
                </button>
              </form>
            </div>

            <form
              action={`/api/brands/${brandId}/approvals/${primaryItem.id}/approve`}
              className="inline-form"
              method="post"
            >
              <input name="next" type="hidden" value={`/brands/${brandId}/approvals`} />
              <button className="workflow-action-button workflow-action-button-approve" type="submit">
                Approve Item
              </button>
            </form>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
