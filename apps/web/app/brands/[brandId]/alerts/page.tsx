import Link from "next/link";
import { listWorkspaceAlertsAsync } from "../../../../lib/operating-data";

type AlertsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function severityLabel(severity: string) {
  if (severity === "high") return "Critical";
  if (severity === "medium") return "Warning";
  return "Info";
}

function severityTone(severity: string) {
  if (severity === "high") return "danger";
  if (severity === "medium") return "warning";
  return "info";
}

function statusTone(status: string) {
  if (status === "open") return "warning";
  if (status === "investigating") return "info";
  return "positive";
}

export default async function AlertsPage({ params }: AlertsPageProps) {
  const { brandId } = await params;
  const alerts = await listWorkspaceAlertsAsync(brandId);
  const primaryAlert = alerts[0];

  return (
    <section className="ops-suite">
      <header className="command-header">
        <div>
          <p className="command-kicker">Operational Integrity</p>
          <h1>Alerts</h1>
          <p className="command-copy">
            Real-time monitoring of storefront anomalies, workflow drift, and trust risks that need a fast owner.
          </p>
        </div>

        <div className="command-header-actions">
          <Link className="button-link-secondary" href={`/brands/${brandId}/inbox`}>
            Open Inbox
          </Link>
          <Link className="button-link" href={`/brands/${brandId}/opportunities`}>
            Create Opportunity
          </Link>
        </div>
      </header>

      <div className="ops-filter-bar">
        <button className="ops-filter-pill" data-active="true" type="button">
          All
        </button>
        <button className="ops-filter-pill" type="button">
          High Severity
        </button>
        <button className="ops-filter-pill" type="button">
          Pending
        </button>
        <button className="ops-filter-pill" type="button">
          Resolved
        </button>
      </div>

      <div className="ops-layout">
        <section className="ops-table-shell">
          <div className="ops-table-head ops-table-head-alerts">
            <span>Severity</span>
            <span>Anomaly Description</span>
            <span>Source Trace</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="ops-table-body">
            {alerts.map((alert, index) => (
              <article key={alert.id} className="ops-row ops-row-alerts" data-active={index === 0}>
                <div className="ops-cell">
                  <span className="status-chip" data-tone={severityTone(alert.severity)}>
                    {severityLabel(alert.severity)}
                  </span>
                </div>

                <div className="ops-cell-primary">
                  <strong>{alert.title}</strong>
                  <p>{alert.impact}</p>
                  <div className="record-meta">
                    <span className="status-chip" data-tone="neutral">
                      {alert.category}
                    </span>
                    <span className="status-chip" data-tone="info">
                      {alert.owner}
                    </span>
                  </div>
                </div>

                <div className="ops-cell-trace">
                  <span className="material-symbols-outlined">terminal</span>
                  <code>{alert.evidence}</code>
                </div>

                <div className="ops-cell">
                  <span className="status-chip" data-tone={statusTone(alert.status)}>
                    {alert.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="ops-cell-actions">
                  <button className="workflow-inline-action" type="button">
                    Dismiss Alert
                  </button>
                  <Link className="workflow-inline-action" href={`/brands/${brandId}/settings/users`}>
                    Assign Owner
                  </Link>
                  <Link className="button-link-secondary" href={alert.href}>
                    View Source
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {primaryAlert ? (
          <aside className="ops-detail-card">
            <div>
              <p className="editorial-section-label">Alert Spotlight</p>
              <h2>{primaryAlert.title}</h2>
              <p>{primaryAlert.impact}</p>
            </div>

            <div className="ops-detail-block">
              <p className="market-evidence-kicker">Source trace</p>
              <p>{primaryAlert.evidence}</p>
            </div>

            <div className="ops-detail-block">
              <p className="market-evidence-kicker">Next step</p>
              <p>{primaryAlert.nextStep}</p>
            </div>

            <div className="record-meta">
              <span className="status-chip" data-tone={severityTone(primaryAlert.severity)}>
                {severityLabel(primaryAlert.severity)}
              </span>
              <span className="status-chip" data-tone={statusTone(primaryAlert.status)}>
                {primaryAlert.status.replaceAll("_", " ")}
              </span>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
