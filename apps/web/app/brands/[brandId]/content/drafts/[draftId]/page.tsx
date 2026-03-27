import Link from "next/link";
import { getBrandDraftAsync } from "../../../../../../lib/growth-workflow-data";
import { formatDraftStatusLabel } from "../../../../../../lib/workflow-execution-data";

type DraftDetailPageProps = {
  params: Promise<{
    brandId: string;
    draftId: string;
  }>;
};

export default async function DraftDetailPage({ params }: DraftDetailPageProps) {
  const { brandId, draftId } = await params;
  const draft = await getBrandDraftAsync(brandId, draftId);

  if (!draft) {
    return (
      <section className="draft-suite">
        <header className="command-header">
          <div>
            <p className="command-kicker">Draft Editor</p>
            <h1>Draft not found.</h1>
            <p className="command-copy">This draft is not available in the current workspace state.</p>
          </div>
          <div className="command-header-actions">
            <Link className="button-link" href={`/brands/${brandId}/content`}>
              Back to Content Studio
            </Link>
          </div>
        </header>
      </section>
    );
  }

  const readinessItems = [
    {
      label: "Brand Voice Check",
      detail: "Copy still sounds like the brand, not a generic performance ad.",
      done: draft.caption.length > 80
    },
    {
      label: "Link Accuracy",
      detail: "The draft is tied back to a real product or source opportunity.",
      done: Boolean(draft.productTitle || draft.sourceOpportunityTitle)
    },
    {
      label: "Approval Readiness",
      detail: "Enough structured copy exists to move this into review without guesswork.",
      done: draft.status === "ready_for_approval" || draft.status === "approved"
    }
  ];

  const readinessScore = Math.round(
    (readinessItems.filter((item) => item.done).length / readinessItems.length) * 100
  );

  return (
    <section className="draft-suite">
      <header className="draft-header">
        <div>
          <div className="draft-header-meta">
            <span className="draft-status-pill">{formatDraftStatusLabel(draft.status)}</span>
            <span className="draft-id-pill">ID: {draft.id}</span>
          </div>
          <h1>{draft.title}</h1>
        </div>

        <div className="command-header-actions">
          <button className="button-link-secondary" type="button">
            Duplicate Draft
          </button>
          <button className="button-link-secondary" form="draft-editor-form" type="submit">
            Save Draft
          </button>
          <button
            className="button-link"
            form="draft-editor-form"
            formAction={`/api/brands/${brandId}/content/drafts/${draft.id}/send-for-approval`}
            type="submit"
          >
            Send for Approval
          </button>
        </div>
      </header>

      <div className="draft-layout">
        <div className="draft-editor-column">
          <form
            action={`/api/brands/${brandId}/content/drafts/${draft.id}/save`}
            className="draft-editor-form"
            id="draft-editor-form"
            method="post"
          >
            <input name="next" type="hidden" value={`/brands/${brandId}/content/drafts/${draft.id}`} />
            <input name="currentStatus" type="hidden" value={draft.status} />

            <section className="draft-editor-block draft-editor-block-meta">
              <div className="draft-editor-meta-grid">
                <label className="field-stack">
                  <span className="field-label">Draft title</span>
                  <input className="text-input" defaultValue={draft.title} name="title" type="text" />
                </label>

                <label className="field-stack">
                  <span className="field-label">Channel</span>
                  <input className="text-input" defaultValue={draft.channel} name="channel" type="text" />
                </label>

                <label className="field-stack draft-editor-meta-wide">
                  <span className="field-label">Angle</span>
                  <input className="text-input" defaultValue={draft.angle} name="angle" type="text" />
                </label>
              </div>
            </section>

            <section className="draft-editor-block">
              <div className="draft-editor-section-head">
                <h2>Section A: Hook</h2>
                <span>Critical Attention Element</span>
              </div>
              <textarea
                className="draft-editor-textarea draft-editor-textarea-hook"
                defaultValue={draft.hook}
                name="hook"
              />
            </section>

            <section className="draft-editor-block">
              <div className="draft-editor-section-head">
                <h2>Section B: Caption</h2>
                <span>Engagement Optimized</span>
              </div>
              <textarea
                className="draft-editor-textarea draft-editor-textarea-caption"
                defaultValue={draft.caption}
                name="caption"
              />
            </section>

            <section className="draft-editor-block">
              <div className="draft-editor-section-head">
                <h2>Section C: Script</h2>
                <span>Creative Brief</span>
              </div>
              <textarea
                className="draft-editor-textarea draft-editor-textarea-script"
                defaultValue={draft.script}
                name="script"
              />
            </section>
          </form>
        </div>

        <aside className="draft-side-column">
          <section className="draft-side-card">
            <p className="editorial-section-label">Approval Readiness</p>
            <h3>Ready this asset before it hits the queue.</h3>
            <div className="draft-checklist">
              {readinessItems.map((item) => (
                <article key={item.label} className="draft-check-item">
                  <div>
                    <p className="draft-check-title">{item.label}</p>
                    <p className="draft-check-copy">{item.detail}</p>
                  </div>
                  <span className="draft-check-mark" data-done={item.done}>
                    {item.done ? "✓" : ""}
                  </span>
                </article>
              ))}
            </div>

            <div className="draft-score">
              <div className="draft-score-copy">
                <span>Overall score</span>
                <strong>{readinessScore}%</strong>
              </div>
              <div className="draft-score-bar">
                <i style={{ width: `${readinessScore}%` }} />
              </div>
            </div>
          </section>

          <section className="draft-side-card">
            <p className="editorial-section-label">Context</p>
            <h3>Source and revision ledger.</h3>
            <div className="draft-revision-list">
              <article className="draft-revision-item">
                <p className="draft-revision-title">Source</p>
                <p className="draft-revision-copy">
                  {draft.sourceOpportunityTitle ?? draft.productTitle ?? "Manual studio draft"}
                </p>
              </article>
              <article className="draft-revision-item">
                <p className="draft-revision-title">Linked product</p>
                <p className="draft-revision-copy">{draft.productTitle ?? "No product linked yet."}</p>
              </article>
              <article className="draft-revision-item">
                <p className="draft-revision-title">Current state</p>
                <p className="draft-revision-copy">
                  {formatDraftStatusLabel(draft.status)} · Updated {draft.updatedAtLabel}
                </p>
              </article>
            </div>

            <div className="record-actions">
              <Link className="button-link-secondary" href={`/brands/${brandId}/content`}>
                Back to Studio
              </Link>
              <Link className="button-link-secondary" href={`/brands/${brandId}/approvals`}>
                Open Approvals
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}
