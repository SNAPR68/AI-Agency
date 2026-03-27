import Link from "next/link";
import { listWorkspaceInboxItemsAsync } from "../../../../lib/operating-data";

type InboxPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function kindTone(kind: string) {
  if (kind === "approval") return "warning";
  if (kind === "alert") return "danger";
  if (kind === "brief") return "info";
  return "neutral";
}

function itemIcon(kind: string) {
  if (kind === "approval") return "verified_user";
  if (kind === "alert") return "warning";
  if (kind === "brief") return "article";
  return "history";
}

export default async function InboxPage({ params }: InboxPageProps) {
  const { brandId } = await params;
  const items = await listWorkspaceInboxItemsAsync(brandId);
  const today = items.filter((item) => item.state === "needs_review" || item.state === "open");
  const earlier = items.filter((item) => item.state !== "needs_review" && item.state !== "open");

  return (
    <section className="ops-suite">
      <header className="command-header">
        <div>
          <p className="command-kicker">Inbox</p>
          <h1>Your Action Items</h1>
          <p className="command-copy">
            Manage pending approvals, system alerts, and campaign reminders across the workspace.
          </p>
        </div>

        <div className="command-header-actions">
          <button className="button-link-secondary" type="button">
            Export
          </button>
        </div>
      </header>

      <div className="ops-filter-bar">
        <button className="ops-filter-pill" data-active="true" type="button">
          All
        </button>
        <button className="ops-filter-pill" type="button">
          Approvals
        </button>
        <button className="ops-filter-pill" type="button">
          Alerts
        </button>
        <button className="ops-filter-pill" type="button">
          System
        </button>
      </div>

      <section className="inbox-suite-section">
        <div className="inbox-suite-head">
          <h2>Today</h2>
          <div className="inbox-suite-line" />
          <span>{today.length} new</span>
        </div>

        <div className="inbox-suite-feed">
          {today.map((item) => (
            <article key={item.id} className="inbox-suite-card" data-kind={item.kind}>
              <div className="inbox-suite-icon">
                <span className="material-symbols-outlined">{itemIcon(item.kind)}</span>
              </div>

              <div className="inbox-suite-body">
                <div className="inbox-suite-card-head">
                  <h3>{item.title}</h3>
                  <span>{item.receivedAtLabel}</span>
                </div>

                <p>{item.summary}</p>

                <div className="inbox-suite-preview">
                  <div className="inbox-suite-preview-icon">
                    <span className="material-symbols-outlined">link</span>
                  </div>
                  <div className="inbox-suite-preview-copy">
                    <strong>Linked workspace item</strong>
                    <p>This action opens the exact workflow that needs the next decision.</p>
                  </div>
                  <span className="status-chip" data-tone={kindTone(item.kind)}>
                    {item.kind}
                  </span>
                </div>

                <div className="record-actions">
                  <Link className="button-link" href={item.href}>
                    {item.kind === "approval" ? "Approve from Inbox" : "Open Linked Item"}
                  </Link>

                  <form
                    action={`/api/brands/${brandId}/inbox/${item.id}/read`}
                    className="inline-form"
                    method="post"
                  >
                    <input name="next" type="hidden" value={`/brands/${brandId}/inbox`} />
                    <button className="button-link-secondary" type="submit">
                      Mark as Read
                    </button>
                  </form>

                  <form
                    action={`/api/brands/${brandId}/inbox/${item.id}/snooze`}
                    className="inline-form"
                    method="post"
                  >
                    <input name="next" type="hidden" value={`/brands/${brandId}/inbox`} />
                    <button className="command-icon-button" title="Snooze" type="submit">
                      <span className="material-symbols-outlined">schedule</span>
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="inbox-suite-section">
        <div className="inbox-suite-head">
          <h2>Earlier</h2>
          <div className="inbox-suite-line" />
          <span>{earlier.length} items</span>
        </div>

        <div className="inbox-suite-feed inbox-suite-feed-compact">
          {earlier.map((item) => (
            <article key={item.id} className="inbox-suite-card inbox-suite-card-muted" data-kind={item.kind}>
              <div className="inbox-suite-icon">
                <span className="material-symbols-outlined">{itemIcon(item.kind)}</span>
              </div>
              <div className="inbox-suite-body">
                <div className="inbox-suite-card-head">
                  <h3>{item.title}</h3>
                  <span>{item.receivedAtLabel}</span>
                </div>
                <p>{item.summary}</p>
                <div className="record-meta">
                  <span className="status-chip" data-tone={kindTone(item.kind)}>
                    {item.kind}
                  </span>
                  <span className="status-chip" data-tone="neutral">
                    {item.state.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
              <div className="inbox-suite-side">
                <Link className="workflow-inline-action" href={item.href}>
                  Open Linked Item
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
