import Link from "next/link";
import { listWorkspaceInboxItemsAsync } from "../../../../lib/operating-data";

type InboxPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function kindTone(kind: string) {
  if (kind === "approval") {
    return "warning";
  }

  if (kind === "alert") {
    return "danger";
  }

  if (kind === "brief") {
    return "info";
  }

  return "neutral";
}

function itemIcon(kind: string) {
  if (kind === "approval") {
    return "verified_user";
  }

  if (kind === "alert") {
    return "warning";
  }

  if (kind === "brief") {
    return "article";
  }

  return "bolt";
}

export default async function InboxPage({ params }: InboxPageProps) {
  const { brandId } = await params;
  const items = await listWorkspaceInboxItemsAsync(brandId);
  const priorityItems = items.filter(
    (item) => item.state === "needs_review" || item.state === "open"
  );
  const laterItems = items.filter(
    (item) => item.state !== "needs_review" && item.state !== "open"
  );

  return (
    <div className="command-page">
      <section className="command-header">
        <div className="command-header-copy">
          <p className="command-kicker">Inbox</p>
          <h1 className="command-title">Your Action Items</h1>
          <p className="command-description">
            Manage pending approvals, system alerts, and campaign reminders across
            the workspace without tab switching.
          </p>
        </div>

        <div className="command-filter-bar command-filter-bar-tight">
          <button className="command-filter-chip" data-active="true" type="button">
            All
          </button>
          <button className="command-filter-chip" type="button">
            Approvals
          </button>
          <button className="command-filter-chip" type="button">
            Alerts
          </button>
          <button className="command-filter-chip" type="button">
            System
          </button>
        </div>
      </section>

      <section className="inbox-section">
        <div className="inbox-section-head">
          <h2 className="inbox-section-title">Today</h2>
          <div className="inbox-divider" />
          <span className="inbox-section-count">{priorityItems.length} new</span>
        </div>

        <div className="inbox-feed">
          {priorityItems.map((item) => (
            <article key={item.id} className="inbox-card" data-kind={item.kind}>
              <div className="inbox-card-inner">
                <div className="inbox-card-icon">
                  <span className="material-symbols-outlined">{itemIcon(item.kind)}</span>
                </div>

                <div className="inbox-card-body">
                  <div className="inbox-card-head">
                    <h3 className="inbox-card-title">{item.title}</h3>
                    <span className="inbox-card-time">{item.receivedAtLabel}</span>
                  </div>

                  <p className="inbox-card-copy">{item.summary}</p>

                  <div className="inbox-preview">
                    <div className="inbox-preview-icon">
                      <span className="material-symbols-outlined">link</span>
                    </div>
                    <div className="inbox-preview-copy">
                      <p className="inbox-preview-title">Linked workspace item</p>
                      <p className="inbox-preview-note">This action opens the exact workflow that needs the next decision.</p>
                    </div>
                    <span className="status-chip" data-tone={kindTone(item.kind)}>
                      {item.kind}
                    </span>
                  </div>

                  <div className="inbox-card-actions">
                    <Link className="command-primary-button" href={item.href}>
                      {item.kind === "approval" ? "Approve from Inbox" : "Open Linked Item"}
                    </Link>

                    <form
                      action={`/api/brands/${brandId}/inbox/${item.id}/read`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/inbox`} />
                      <button className="command-secondary-button" type="submit">
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
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="inbox-section">
        <div className="inbox-section-head">
          <h2 className="inbox-section-title">Earlier</h2>
          <div className="inbox-divider" />
          <span className="inbox-section-count">{laterItems.length} items</span>
        </div>

        <div className="inbox-feed">
          {laterItems.map((item) => (
            <article key={item.id} className="inbox-card inbox-card-compact" data-kind={item.kind}>
              <div className="inbox-card-inner">
                <div className="inbox-card-icon">
                  <span className="material-symbols-outlined">{itemIcon(item.kind)}</span>
                </div>

                <div className="inbox-card-body">
                  <div className="inbox-card-head">
                    <h3 className="inbox-card-title">{item.title}</h3>
                    <span className="inbox-card-time">{item.receivedAtLabel}</span>
                  </div>
                  <p className="inbox-card-copy">{item.summary}</p>
                  <div className="record-meta">
                    <span className="status-chip" data-tone={kindTone(item.kind)}>
                      {item.kind}
                    </span>
                    <span className="status-chip" data-tone="neutral">
                      {item.state.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="inbox-card-side">
                  <Link className="command-inline-link" href={item.href}>
                    Open Linked Item
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
