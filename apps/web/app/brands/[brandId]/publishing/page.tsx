import {
  formatDraftStatusLabel,
  listPublishJobsAsync,
  listReadyToPublishDraftsAsync
} from "../../../../lib/workflow-execution-data";

type PublishingPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function publishTone(status: string) {
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

export default async function PublishingPage({ params }: PublishingPageProps) {
  const { brandId } = await params;
  const readyDrafts = await listReadyToPublishDraftsAsync(brandId);
  const jobs = await listPublishJobsAsync(brandId);
  const failureJob = jobs.find((job) => job.status === "failed");

  return (
    <section className="workflow-suite">
      <header className="command-header">
        <div>
          <p className="command-kicker">Publishing</p>
          <h1>Publishing Ops</h1>
          <p className="command-copy">
            Scheduling, publish jobs, and live state tracking for omnichannel brand presence.
          </p>
        </div>

        <div className="command-header-actions">
          <button className="button-link-secondary" type="button">
            Schedule View
          </button>
          <button className="button-link" type="button">
            Live State
          </button>
        </div>
      </header>

      <div className="publishing-top-grid">
        <article className="publishing-volume-card">
          <div className="publishing-volume-head">
            <h2>24-Hour Delivery Volume</h2>
            <div className="publishing-volume-legend">
              <span><i data-tone="positive" /> Success</span>
              <span><i data-tone="warning" /> Pending</span>
              <span><i data-tone="danger" /> Failed</span>
            </div>
          </div>
          <div className="publishing-bars">
            {jobs.slice(0, 8).map((job, index) => (
              <div key={job.id} className="publishing-bar-column">
                <span
                  className="publishing-bar-track"
                  style={{ height: `${44 + ((index + 1) % 5) * 18}px` }}
                >
                  <i className="publishing-bar-fill" data-tone={publishTone(job.status)} />
                </span>
              </div>
            ))}
          </div>
          <div className="publishing-bar-labels">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>Current</span>
          </div>
        </article>

        <article className="publishing-failure-card">
          <div>
            <p className="editorial-section-label">Critical Failure</p>
            <h2>{failureJob?.draftTitle ?? "Queue stable"}</h2>
            <p>
              {failureJob?.failureReason ??
                "No critical publish failures are blocking the queue right now."}
            </p>
          </div>

          <div className="publishing-failure-actions">
            {failureJob ? (
              <>
                <form
                  action={`/api/brands/${brandId}/publishing/jobs/${failureJob.id}/retry`}
                  className="inline-form"
                  method="post"
                >
                  <input name="next" type="hidden" value={`/brands/${brandId}/publishing`} />
                  <button className="workflow-action-button workflow-action-button-danger" type="submit">
                    Retry Failed Job
                  </button>
                </form>
                <form
                  action={`/api/brands/${brandId}/publishing/jobs/${failureJob.id}/cancel`}
                  className="inline-form"
                  method="post"
                >
                  <input name="next" type="hidden" value={`/brands/${brandId}/publishing`} />
                  <button className="workflow-action-button workflow-action-button-muted" type="submit">
                    Cancel Schedule
                  </button>
                </form>
              </>
            ) : (
              <button className="workflow-action-button workflow-action-button-approve" type="button">
                Queue Healthy
              </button>
            )}
          </div>
        </article>
      </div>

      <section className="publishing-panel">
        <div className="publishing-panel-head">
          <div className="publishing-filter-row">
            <span>Channel: All Platforms</span>
            <span>Status: All States</span>
          </div>
          <div className="publishing-search-pill">Search assets...</div>
        </div>

        <div className="publishing-ready-grid">
          {readyDrafts.map((draft) => (
            <article key={draft.id} className="publishing-ready-item">
              <div>
                <p className="publishing-ready-title">{draft.title}</p>
                <p className="publishing-ready-copy">
                  {draft.channel} · {formatDraftStatusLabel(draft.status)}
                </p>
              </div>
              <div className="record-actions">
                <form
                  action={`/api/brands/${brandId}/publishing/${draft.id}/schedule`}
                  className="inline-form"
                  method="post"
                >
                  <input name="next" type="hidden" value={`/brands/${brandId}/publishing`} />
                  <button className="button-link-secondary" type="submit">
                    Schedule Post
                  </button>
                </form>
                <form
                  action={`/api/brands/${brandId}/publishing/${draft.id}/publish-now`}
                  className="inline-form"
                  method="post"
                >
                  <input name="next" type="hidden" value={`/brands/${brandId}/publishing`} />
                  <button className="button-link" type="submit">
                    Publish Now
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>

        <div className="workflow-table-shell publishing-table-shell">
          <div className="workflow-table-head">
            <span>Draft / Asset</span>
            <span>Channel</span>
            <span>Scheduled Time</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="workflow-table-body">
            {jobs.map((job) => (
              <article key={job.id} className="workflow-row workflow-row-publishing">
                <div className="workflow-cell-primary">
                  <strong>{job.draftTitle}</strong>
                  <p>{job.updatedAtLabel}</p>
                </div>
                <div className="workflow-cell-tag">
                  <span className="workflow-badge">{job.channel}</span>
                </div>
                <div className="workflow-cell-publish-time">
                  <strong>{job.scheduledForLabel ?? job.publishedAtLabel ?? "Pending"}</strong>
                  <p>{job.updatedAtLabel}</p>
                </div>
                <div className="workflow-cell-status">
                  <span className="status-chip" data-tone={publishTone(job.status)}>
                    {job.status}
                  </span>
                  {job.failureReason ? <small>{job.failureReason}</small> : null}
                </div>
                <div className="workflow-cell-actions">
                  {job.status === "failed" ? (
                    <form
                      action={`/api/brands/${brandId}/publishing/jobs/${job.id}/retry`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/publishing`} />
                      <button className="workflow-inline-action" type="submit">
                        Retry Failed Job
                      </button>
                    </form>
                  ) : null}
                  {job.status === "scheduled" ? (
                    <form
                      action={`/api/brands/${brandId}/publishing/jobs/${job.id}/cancel`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/publishing`} />
                      <button className="workflow-inline-action" type="submit">
                        Cancel Schedule
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <div className="workflow-table-footer">
            <span>Showing {jobs.length} jobs</span>
            <div className="workflow-pagination">
              <button type="button">Previous</button>
              <button type="button">Next Page</button>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
