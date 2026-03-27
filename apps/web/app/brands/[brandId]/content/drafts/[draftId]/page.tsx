import Link from "next/link";
import { WorkspacePage } from "../../../../../../components/workspace-page";
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
      <WorkspacePage
        model={{
          kicker: "Draft Detail",
          title: "Draft not found",
          description:
            "This draft does not exist in the current workspace state yet.",
          actions: [
            {
              label: "Back to Content Studio",
              href: `/brands/${brandId}/content`
            }
          ]
        }}
      />
    );
  }

  const readinessItems = [
    {
      label: "Brand voice check",
      detail: "Hook and caption still read like the brand rather than generic content filler.",
      done: draft.caption.length > 80
    },
    {
      label: "Link accuracy",
      detail: "The draft is tied back to a product or source opportunity in the workspace.",
      done: Boolean(draft.productTitle || draft.sourceOpportunityTitle)
    },
    {
      label: "Approval readiness",
      detail: "The current draft already contains enough structured copy to move into review.",
      done: draft.status === "ready_for_approval" || draft.status === "approved"
    }
  ];
  const readinessScore = Math.round(
    (readinessItems.filter((item) => item.done).length / readinessItems.length) * 100
  );

  return (
    <WorkspacePage
      model={{
        kicker: "Draft Detail",
        title: draft.title,
        description:
          "Edit the working copy, keep the business context intact, and push the draft into approval when it is ready.",
        actions: [
          {
            label: "Back to Content Studio",
            href: `/brands/${brandId}/content`
          },
          ...(draft.productHref
            ? [
                {
                  label: "Open Product",
                  href: draft.productHref,
                  tone: "secondary" as const
                }
              ]
            : [])
        ],
        stats: [
          {
            label: "Status",
            value: formatDraftStatusLabel(draft.status),
            note: `Last updated ${draft.updatedAtLabel}`
          },
          {
            label: "Channel",
            value: draft.channel,
            note: `Angle: ${draft.angle}`
          },
          {
            label: "Source",
            value: draft.sourceOpportunityTitle ?? draft.productTitle ?? "Manual draft",
            note: draft.productTitle
              ? `Product: ${draft.productTitle}`
              : "No product linked."
          }
        ]
      }}
    >
      <section className="draft-editor-layout">
        <div className="draft-editor-main">
          <section className="draft-editor-card" data-tone="warm">
            <p className="editorial-section-label">Context</p>
            <h2 className="draft-editor-card-title">Business context</h2>
            <p className="draft-editor-card-copy">
              {draft.sourceOpportunityTitle
                ? `This draft was created from the opportunity "${draft.sourceOpportunityTitle}".`
                : "This draft was created directly from product momentum inside the workspace."}
            </p>
            {draft.productTitle ? (
              <p className="draft-editor-card-copy">
                It is currently linked to <strong>{draft.productTitle}</strong>.
              </p>
            ) : null}
            <div className="record-actions" style={{ marginTop: "18px" }}>
              <Link className="button-link-secondary" href={`/brands/${brandId}/content`}>
                Back to queue
              </Link>
              <Link className="button-link-secondary" href={`/brands/${brandId}/approvals`}>
                Open approvals
              </Link>
            </div>
          </section>

          <section className="draft-editor-card">
            <p className="editorial-section-label">Editor</p>
            <h2 className="draft-editor-card-title">Draft editor</h2>
            <p className="draft-editor-card-copy">
              Keep the copy aligned with the product story and the specific opportunity that started this draft.
            </p>

            <form
              action={`/api/brands/${brandId}/content/drafts/${draft.id}/save`}
              className="draft-editor-form-grid"
              method="post"
            >
              <input name="next" type="hidden" value={`/brands/${brandId}/content/drafts/${draft.id}`} />
              <input name="currentStatus" type="hidden" value={draft.status} />

              <div className="form-grid">
                <label className="field-stack">
                  <span className="field-label">Draft title</span>
                  <input
                    className="text-input"
                    defaultValue={draft.title}
                    name="title"
                    type="text"
                  />
                </label>

                <label className="field-stack">
                  <span className="field-label">Channel</span>
                  <input
                    className="text-input"
                    defaultValue={draft.channel}
                    name="channel"
                    type="text"
                  />
                </label>

                <label className="field-stack field-stack-wide">
                  <span className="field-label">Angle</span>
                  <input
                    className="text-input"
                    defaultValue={draft.angle}
                    name="angle"
                    type="text"
                  />
                </label>
              </div>

              <section>
                <h3 className="draft-section-title">Section A: Hook</h3>
                <label className="field-stack">
                  <span className="field-label">Hook</span>
                  <textarea
                    className="text-area text-area-compact"
                    defaultValue={draft.hook}
                    name="hook"
                  />
                </label>
              </section>

              <section>
                <h3 className="draft-section-title">Section B: Caption</h3>
                <label className="field-stack">
                  <span className="field-label">Caption / creative brief</span>
                  <textarea
                    className="text-area"
                    defaultValue={draft.caption}
                    name="caption"
                  />
                </label>
              </section>

              <section>
                <h3 className="draft-section-title">Section C: Script</h3>
                <label className="field-stack">
                  <span className="field-label">Script / execution notes</span>
                  <textarea
                    className="text-area text-area-tall"
                    defaultValue={draft.script}
                    name="script"
                  />
                </label>
              </section>

              <div className="record-actions">
                <button className="button-link-secondary" type="submit">
                  Save Draft
                </button>
                <button
                  className="button-link"
                  formAction={`/api/brands/${brandId}/content/drafts/${draft.id}/send-for-approval`}
                  type="submit"
                >
                  Send for Approval
                </button>
              </div>
            </form>
          </section>
        </div>

        <aside className="draft-editor-rail">
          <section className="draft-editor-card" data-tone="warm">
            <p className="editorial-section-label">Approval readiness</p>
            <h2 className="draft-editor-card-title">Readiness checklist</h2>
            <div className="readiness-list">
              {readinessItems.map((item) => (
                <article key={item.label} className="readiness-item">
                  <div>
                    <p className="readiness-title">{item.label}</p>
                    <p className="readiness-copy">{item.detail}</p>
                  </div>
                  <span className="readiness-check" data-done={item.done} />
                </article>
              ))}
            </div>

            <div className="readiness-score">
              <p className="readiness-score-copy">
                <span>Overall score</span>
                <strong>{readinessScore}%</strong>
              </p>
              <div className="readiness-bar">
                <div
                  className="readiness-bar-fill"
                  style={{ width: `${readinessScore}%` }}
                />
              </div>
            </div>
          </section>

          <section className="draft-editor-card">
            <p className="editorial-section-label">Revision ledger</p>
            <h2 className="draft-editor-card-title">Recent changes</h2>
            <div className="revision-list">
              <article className="revision-item">
                <p className="revision-title">Workspace update</p>
                <p className="revision-copy">Last touched {draft.updatedAtLabel} while shaping the current angle.</p>
              </article>
              <article className="revision-item">
                <p className="revision-title">Source context</p>
                <p className="revision-copy">
                  {draft.sourceOpportunityTitle ?? draft.productTitle ?? "Manual draft created from the studio queue."}
                </p>
              </article>
              <article className="revision-item">
                <p className="revision-title">Current status</p>
                <p className="revision-copy">{formatDraftStatusLabel(draft.status)}</p>
              </article>
            </div>
          </section>
        </aside>
      </section>
    </WorkspacePage>
  );
}
