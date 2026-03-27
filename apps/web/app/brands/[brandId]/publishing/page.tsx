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
  listPublishJobsAsync,
  listReadyToPublishDraftsAsync
} from "../../../../lib/workflow-execution-data";

type PublishingPageProps = {
  params: Promise<{
    brandId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

function jobTone(status: string): PresentationTone {
  if (status === "published") {
    return "positive";
  }

  if (status === "failed") {
    return "danger";
  }

  if (status === "scheduled") {
    return "warning";
  }

  return "neutral";
}

export default async function PublishingPage({
  params,
  searchParams
}: PublishingPageProps) {
  const { brandId } = await params;
  const { error } = await searchParams;
  const readyDrafts = await listReadyToPublishDraftsAsync(brandId);
  const jobs = await listPublishJobsAsync(brandId);
  const failureJob = jobs.find((job) => job.status === "failed");

  return (
    <WorkspacePage
      model={{
        kicker: "Publishing",
        title: "Scheduling, delivery, and retry queue",
        description:
          "This page turns approved work into a real publish plan and keeps failures visible instead of hidden.",
        notice:
          error === hostedWriteDisabledErrorCode ? getHostedWriteDisabledMessage() : undefined,
        actions: [
          {
            label: "Open Approvals",
            href: `/brands/${brandId}/approvals`
          },
          {
            label: "Open Content Studio",
            href: `/brands/${brandId}/content`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Ready to publish",
            value: `${readyDrafts.length}`,
            note: "Approved drafts still waiting for a scheduling decision."
          },
          {
            label: "Scheduled jobs",
            value: `${jobs.filter((job) => job.status === "scheduled").length}`,
            note: "Items currently queued for future delivery."
          },
          {
            label: "Failed jobs",
            value: `${jobs.filter((job) => job.status === "failed").length}`,
            note: "Retries that need attention before the queue is trustworthy."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Ready"
            title="Approved drafts waiting for publish decisions"
            description="These drafts have cleared review and can now be scheduled or published immediately."
            items={readyDrafts.map((draft) => ({
              eyebrow: draft.channel,
              title: draft.title,
              description: `${draft.hook} ${draft.caption}`,
              value: formatDraftStatusLabel(draft.status),
              note: "Ready",
              tags: [
                { label: formatDraftStatusLabel(draft.status), tone: "positive" },
                { label: draft.channel, tone: "info" }
              ],
              actions: [
                {
                  label: "Open draft",
                  href: draft.href,
                  tone: "secondary"
                },
                {
                  label: "Schedule post",
                  href: `/api/brands/${brandId}/publishing/${draft.id}/schedule`,
                  method: "post",
                  tone: "secondary",
                  fields: [
                    {
                      name: "next",
                      value: `/brands/${brandId}/publishing`
                    }
                  ]
                },
                {
                  label: "Publish now",
                  href: `/api/brands/${brandId}/publishing/${draft.id}/publish-now`,
                  method: "post",
                  tone: "primary",
                  fields: [
                    {
                      name: "next",
                      value: `/brands/${brandId}/publishing`
                    }
                  ]
                }
              ]
            }))}
            tone="warm"
            emptyMessage="No approved drafts are waiting to be published right now."
          />

          <EditorialListPanel
            label="Jobs"
            title="Publish job queue"
            description="Track scheduled delivery, successful publishes, and failures that need a retry."
            items={jobs.map((job) => ({
              eyebrow: job.channel,
              title: job.draftTitle,
              description:
                job.status === "published"
                  ? `Published ${job.publishedAtLabel}. Last updated ${job.updatedAtLabel}.`
                  : job.status === "failed"
                    ? `${job.failureReason ?? "Publish failed."} Last updated ${job.updatedAtLabel}.`
                    : `Scheduled for ${job.scheduledForLabel}. Last updated ${job.updatedAtLabel}.`,
              value: job.status,
              note: job.scheduledForLabel,
              tags: [
                { label: job.status, tone: jobTone(job.status) },
                { label: job.channel, tone: "info" }
              ],
              actions: [
                {
                  label: "Open draft",
                  href: job.draftHref,
                  tone: "secondary"
                },
                ...(job.status === "failed"
                  ? [
                      {
                        label: "Retry failed job",
                        href: `/api/brands/${brandId}/publishing/jobs/${job.id}/retry`,
                        method: "post" as const,
                        tone: "primary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/publishing`
                          }
                        ]
                      }
                    ]
                  : []),
                ...(job.status === "scheduled"
                  ? [
                      {
                        label: "Cancel schedule",
                        href: `/api/brands/${brandId}/publishing/jobs/${job.id}/cancel`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/publishing`
                          }
                        ]
                      }
                    ]
                  : [])
              ]
            }))}
          />
        </div>

        <aside className="editorial-rail">
          {failureJob ? (
            <section className="editorial-section" data-tone="warm">
              <p className="editorial-section-label">Critical failure</p>
              <h2 className="editorial-section-title">{failureJob.draftTitle}</h2>
              <p className="editorial-section-description">
                {failureJob.failureReason ?? "This publish job failed and needs a retry decision."}
              </p>
              <div className="record-actions" style={{ marginTop: "18px" }}>
                <form
                  action={`/api/brands/${brandId}/publishing/jobs/${failureJob.id}/retry`}
                  className="inline-form"
                  method="post"
                >
                  <input name="next" type="hidden" value={`/brands/${brandId}/publishing`} />
                  <button className="button-link" type="submit">
                    Retry failed job
                  </button>
                </form>
              </div>
            </section>
          ) : null}

          <EditorialListPanel
            label="Ops"
            title="Publishing discipline"
            description="The queue should stay reliable enough that founders and operators trust what is about to go live."
            items={[
              {
                eyebrow: "Planned delivery",
                title: "Schedule when timing matters",
                description:
                  "Use scheduling when the content needs channel timing, team review windows, or launch coordination.",
                tags: [{ label: "Planned delivery", tone: "warning" }]
              },
              {
                eyebrow: "Trust",
                title: "Publish now only when confidence is already high",
                description:
                  "Immediate publishing should be the exception, not the default, especially while we are still tightening the workflow.",
                tags: [{ label: "Trust", tone: "positive" }]
              },
              {
                eyebrow: "Reliability",
                title: "Treat failures as operational debt",
                description:
                  "A failed job should be retried or cancelled quickly so the queue remains a truthful operating surface.",
                tags: [{ label: "Reliability", tone: "danger" }]
              }
            ]}
            tone="ink"
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
