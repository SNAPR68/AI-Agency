import Link from "next/link";
import {
  getCustomerOpsNarrative,
  listCxIssuesAsync
} from "../../../../lib/customer-ops-data";

type CxOpsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function severityTone(severity: string) {
  if (severity === "high") {
    return "danger";
  }

  if (severity === "medium") {
    return "warning";
  }

  return "neutral";
}

function stateTone(state: string) {
  if (state === "resolved") {
    return "positive";
  }

  if (state === "assigned") {
    return "info";
  }

  return "warning";
}

export default async function CxOpsPage({ params }: CxOpsPageProps) {
  const { brandId } = await params;
  const issues = await listCxIssuesAsync(brandId);
  const primaryIssue = issues[0] ?? null;
  const activeCount = issues.filter((item) => item.state !== "resolved").length;
  const highSeverity = issues.filter((item) => item.severity === "high").length;
  const messagingReady = issues.filter((item) => item.linkedDraftHref).length;

  return (
    <section className="ops-intelligence-suite">
      <header className="command-header">
        <div className="command-header-copy">
          <p className="command-kicker">CX Ops</p>
          <h1 className="command-title">CX Operations</h1>
          <p className="command-description">{getCustomerOpsNarrative(brandId)}</p>
        </div>

        <div className="command-actions">
          <Link className="command-secondary-button" href={`/brands/${brandId}/alerts`}>
            Create CX Alert
          </Link>
          {primaryIssue ? (
            primaryIssue.linkedDraftHref ? (
              <Link className="command-primary-button" href={primaryIssue.linkedDraftHref}>
                Recommend Messaging
              </Link>
            ) : (
              <form
                action={`/api/brands/${brandId}/cx/${primaryIssue.id}/recommend-messaging`}
                className="inline-form"
                method="post"
              >
                <button className="command-primary-button" type="submit">
                  Recommend Messaging
                </button>
              </form>
            )
          ) : null}
          {primaryIssue && primaryIssue.state !== "assigned" ? (
            <form
              action={`/api/brands/${brandId}/cx/${primaryIssue.id}/assign`}
              className="inline-form"
              method="post"
            >
              <input name="next" type="hidden" value={`/brands/${brandId}/cx`} />
              <button className="command-secondary-button" type="submit">
                Assign Owner
              </button>
            </form>
          ) : null}
          <Link className="command-secondary-button" href={`/brands/${brandId}/reports`}>
            Export Issues
          </Link>
        </div>
      </header>

      <div className="ops-intelligence-kpis">
        <article className="ops-intelligence-kpi">
          <span>Active issues</span>
          <strong>{activeCount}</strong>
          <p>Current delivery, returns, and message-friction issues still open in the workspace.</p>
        </article>
        <article className="ops-intelligence-kpi">
          <span>High severity</span>
          <strong>{highSeverity}</strong>
          <p>Customer issues that should move fast before they degrade trust.</p>
        </article>
        <article className="ops-intelligence-kpi">
          <span>Messaging ready</span>
          <strong>{messagingReady}</strong>
          <p>Issues already converted into reusable customer-facing copy or drafts.</p>
        </article>
        <article className="ops-intelligence-kpi" data-tone="warning">
          <span>Resolved</span>
          <strong>{issues.filter((item) => item.state === "resolved").length}</strong>
          <p>Closed issues that have already been handled in messaging or operations.</p>
        </article>
      </div>

      <div className="ops-intelligence-grid">
        <section className="ops-intelligence-table-shell">
          <div className="ops-intelligence-table-head ops-intelligence-table-head-cx">
            <span>Issue</span>
            <span>Severity</span>
            <span>Status</span>
            <span>Product</span>
            <span>Actions</span>
          </div>

          <div className="ops-intelligence-body">
            {issues.map((item, index) => (
              <article
                key={item.id}
                className="ops-intelligence-row ops-intelligence-row-cx"
                data-active={index === 0}
              >
                <div className="ops-intelligence-cell-primary">
                  <strong>{item.title}</strong>
                  <p>
                    {item.category}. {item.evidence}
                  </p>
                </div>
                <div className="record-meta">
                  <span className="status-chip" data-tone={severityTone(item.severity)}>
                    {item.severity}
                  </span>
                </div>
                <div className="record-meta">
                  <span className="status-chip" data-tone={stateTone(item.state)}>
                    {item.state}
                  </span>
                </div>
                <div className="ops-intelligence-cell-metric">
                  <strong>{item.category}</strong>
                  <span>Issue lane</span>
                </div>
                <div className="ops-intelligence-actions">
                  <Link className="button-link-secondary" href={item.productHref}>
                    View Product
                  </Link>
                  {item.linkedDraftHref ? (
                    <Link className="button-link" href={item.linkedDraftHref}>
                      Open Draft
                    </Link>
                  ) : (
                    <form
                      action={`/api/brands/${brandId}/cx/${item.id}/recommend-messaging`}
                      className="inline-form"
                      method="post"
                    >
                      <button className="button-link" type="submit">
                        Recommend Messaging
                      </button>
                    </form>
                  )}
                  {item.state !== "assigned" ? (
                    <form
                      action={`/api/brands/${brandId}/cx/${item.id}/assign`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/cx`} />
                      <button className="button-link-secondary" type="submit">
                        Assign Owner
                      </button>
                    </form>
                  ) : null}
                  {item.state !== "resolved" ? (
                    <form
                      action={`/api/brands/${brandId}/cx/${item.id}/resolve`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/cx`} />
                      <button className="button-link-secondary" type="submit">
                        Mark Resolved
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="ops-intelligence-side">
          {primaryIssue ? (
            <article className="ops-intelligence-card">
              <p className="command-mini-kicker">Selected issue</p>
              <h2>{primaryIssue.title}</h2>
              <div className="ops-intelligence-block">
                <span>Evidence</span>
                <p>{primaryIssue.evidence}</p>
              </div>
              <div className="ops-intelligence-block">
                <span>Impact</span>
                <p>{primaryIssue.implication}</p>
              </div>
              <div className="ops-intelligence-block">
                <span>Recommended messaging</span>
                <p>{primaryIssue.recommendation}</p>
              </div>
              <div className="record-meta">
                <span className="status-chip" data-tone={severityTone(primaryIssue.severity)}>
                  {primaryIssue.severity}
                </span>
                <span className="status-chip" data-tone={stateTone(primaryIssue.state)}>
                  {primaryIssue.state}
                </span>
              </div>
            </article>
          ) : null}

          <article className="ops-intelligence-card" data-tone="warm">
            <p className="command-mini-kicker">Operating posture</p>
            <h2>How CX ops should be used</h2>
            <div className="ops-intelligence-notes">
              <article>
                <strong>Fix the message before ticket volume grows.</strong>
                <p>Most CX issues are cheaper to solve in expectations and copy than in support or refunds.</p>
              </article>
              <article>
                <strong>Assign issues early.</strong>
                <p>An unassigned CX issue usually means customers will keep hitting the same friction next week.</p>
              </article>
              <article>
                <strong>Convert recurring friction into reusable copy.</strong>
                <p>When the issue repeats, the brand should ship new messaging instead of answering it one customer at a time.</p>
              </article>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
