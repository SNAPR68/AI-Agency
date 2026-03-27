import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import {
  getHostedWriteDisabledMessage,
  hostedWriteDisabledErrorCode
} from "../../../../lib/session";
import {
  formatDraftStatusLabel,
  listApprovalItemsAsync
} from "../../../../lib/workflow-execution-data";

type ApprovalsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

function approvalTone(status: string): PresentationTone {
  if (status === "approved") {
    return "positive";
  }

  if (status === "changes_requested") {
    return "danger";
  }

  if (status === "rejected") {
    return "neutral";
  }

  return "warning";
}

export default async function ApprovalsPage({
  params,
  searchParams
}: ApprovalsPageProps) {
  const { brandId } = await params;
  const { error } = await searchParams;
  const approvals = await listApprovalItemsAsync(brandId);
  const pending = approvals.filter((item) => item.status === "ready_for_approval");
  const changesRequested = approvals.filter((item) => item.status === "changes_requested");
  const approved = approvals.filter((item) => item.status === "approved");
  const primaryItem = approvals[0];

  return (
    <WorkspacePage
      model={{
        kicker: "Approvals",
        title: "Review queue and decision history",
        description:
          "This is where the team turns working drafts into approved assets or routes them back for another pass.",
        notice:
          error === hostedWriteDisabledErrorCode ? getHostedWriteDisabledMessage() : undefined,
        actions: [
          {
            label: "Open Content Studio",
            href: `/brands/${brandId}/content`
          },
          {
            label: "Open Publishing",
            href: `/brands/${brandId}/publishing`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Pending review",
            value: `${pending.length}`,
            note: "Drafts ready for a human review decision."
          },
          {
            label: "Changes requested",
            value: `${changesRequested.length}`,
            note: "Drafts sent back for another pass."
          },
          {
            label: "Approved",
            value: `${approved.length}`,
            note: "Drafts cleared for publishing actions."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Review queue"
            title="Items needing a review decision"
            description="Use this queue to keep the team moving from draft creation into approved assets."
            items={approvals.map((draft) => ({
              eyebrow: `${draft.channel}${draft.productTitle ? ` · ${draft.productTitle}` : ""}`,
              title: draft.title,
              description: `${draft.hook} ${draft.caption}`,
              value: formatDraftStatusLabel(draft.status),
              note: draft.reviewState,
              tags: [
                { label: formatDraftStatusLabel(draft.status), tone: approvalTone(draft.status) },
                { label: draft.channel, tone: "info" },
                ...(draft.productTitle
                  ? [{ label: draft.productTitle, tone: "neutral" as const }]
                  : [])
              ],
              actions: [
                {
                  label: "Open draft",
                  href: draft.href,
                  tone: "secondary"
                },
                ...(draft.status !== "approved"
                  ? [
                      {
                        label: "Approve",
                        href: `/api/brands/${brandId}/approvals/${draft.id}/approve`,
                        method: "post" as const,
                        tone: "primary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/approvals`
                          }
                        ]
                      }
                    ]
                  : []),
                ...(draft.status !== "changes_requested"
                  ? [
                      {
                        label: "Request changes",
                        href: `/api/brands/${brandId}/approvals/${draft.id}/request-changes`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/approvals`
                          }
                        ]
                      }
                    ]
                  : []),
                ...(draft.status !== "rejected"
                  ? [
                      {
                        label: "Reject",
                        href: `/api/brands/${brandId}/approvals/${draft.id}/reject`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/approvals`
                          }
                        ]
                      }
                    ]
                  : []),
                ...(draft.status === "approved"
                  ? [
                      {
                        label: "Open publishing",
                        href: `/brands/${brandId}/publishing`,
                        tone: "secondary" as const
                      }
                    ]
                  : [])
              ]
            }))}
            tone="warm"
            emptyMessage="No approval items yet. Send a draft for approval from the content studio."
          />
        </div>

        <aside className="editorial-rail">
          {primaryItem ? (
            <section className="editorial-section" data-tone="ink">
              <p className="editorial-section-label">Reviewing draft</p>
              <h2 className="editorial-section-title">{primaryItem.title}</h2>
              <div className="editorial-timeline">
                <article className="editorial-timeline-item">
                  <p className="editorial-timeline-label">Content preview</p>
                  <h3 className="editorial-timeline-title">{primaryItem.hook}</h3>
                  <p className="editorial-timeline-copy">{primaryItem.caption}</p>
                </article>
                <article className="editorial-timeline-item">
                  <p className="editorial-timeline-label">Reviewer rationale</p>
                  <h3 className="editorial-timeline-title">Business story first</h3>
                  <p className="editorial-timeline-copy">
                    Review whether the copy is grounded in the product or opportunity, not just whether it sounds polished.
                  </p>
                </article>
              </div>
            </section>
          ) : null}

          <EditorialListPanel
            label="Review Rules"
            title="How this queue should be used"
            description="Approval is less about bureaucracy and more about keeping trust high while the team moves fast."
            items={[
              {
                eyebrow: "Quality bar",
                title: "Approve only when the business story is clear",
                description:
                  "The best approvals are tied to a real product or opportunity, not just polished copy in isolation.",
                tags: [{ label: "Quality bar", tone: "positive" }]
              },
              {
                eyebrow: "Iteration",
                title: "Request changes when the signal is right but the execution is off",
                description:
                  "Use changes requested to preserve momentum without pretending the asset is publish-ready.",
                tags: [{ label: "Iteration", tone: "warning" }]
              },
              {
                eyebrow: "Focus",
                title: "Reject when the queue needs focus",
                description:
                  "It is healthier to reject weak work than let low-conviction assets clog the publishing pipeline.",
                tags: [{ label: "Focus", tone: "neutral" }]
              }
            ]}
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
