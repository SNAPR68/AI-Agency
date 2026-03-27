import Link from "next/link";
import { listWorkspaceAlertsAsync } from "../../../../lib/operating-data";

type AlertsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function severityLabel(severity: string) {
  if (severity === "high") {
    return "Critical";
  }

  if (severity === "medium") {
    return "Warning";
  }

  return "Notice";
}

function severityTone(severity: string) {
  if (severity === "high") {
    return "danger";
  }

  if (severity === "medium") {
    return "warning";
  }

  return "info";
}

function statusTone(status: string) {
  if (status === "open") {
    return "warning";
  }

  if (status === "investigating") {
    return "info";
  }

  return "positive";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default async function AlertsPage({ params }: AlertsPageProps) {
  const { brandId } = await params;
  const alerts = await listWorkspaceAlertsAsync(brandId);

  return (
    <div className="command-page">
      <section className="command-header">
        <div className="command-header-copy">
          <p className="command-kicker">Operational integrity</p>
          <h1 className="command-title">Alerts</h1>
          <p className="command-description">
            Real-time monitoring of Shopify storefront anomalies, workflow drift,
            and trust risks that need a fast owner.
          </p>
        </div>

        <div className="command-actions">
          <Link className="command-secondary-button" href={`/brands/${brandId}/inbox`}>
            Open Inbox
          </Link>
          <Link className="command-primary-button" href={`/brands/${brandId}/opportunities`}>
            Create Opportunity
          </Link>
        </div>
      </section>

      <section className="command-filter-bar">
        <button className="command-filter-chip" data-active="true" type="button">
          All
        </button>
        <button className="command-filter-chip" type="button">
          High Severity
        </button>
        <button className="command-filter-chip" type="button">
          Pending
        </button>
        <button className="command-filter-chip" type="button">
          Resolved
        </button>
      </section>

      <section className="alerts-table-shell">
        <div className="alerts-table-head">
          <span>Severity</span>
          <span>Anomaly Description</span>
          <span>Source Trace</span>
          <span>Status</span>
          <span className="alerts-table-head-actions">Actions</span>
        </div>

        <div className="alerts-table-body">
          {alerts.map((alert) => (
            <article key={alert.id} className="alerts-row">
              <div className="alerts-cell">
                <span className="status-chip" data-tone={severityTone(alert.severity)}>
                  {severityLabel(alert.severity)}
                </span>
              </div>

              <div className="alerts-cell alerts-description-cell">
                <p className="alerts-row-title">{alert.title}</p>
                <p className="alerts-row-copy">{alert.impact}</p>
                <div className="record-meta">
                  <span className="status-chip" data-tone="neutral">
                    {alert.category}
                  </span>
                  <span className="status-chip" data-tone="info">
                    {alert.owner}
                  </span>
                </div>
              </div>

              <div className="alerts-cell">
                <div className="alerts-source">
                  <span className="material-symbols-outlined">terminal</span>
                  <code>{alert.evidence}</code>
                </div>
              </div>

              <div className="alerts-cell">
                <span className="status-chip" data-tone={statusTone(alert.status)}>
                  {statusLabel(alert.status)}
                </span>
              </div>

              <div className="alerts-cell alerts-actions-cell">
                <div className="alerts-row-actions">
                  <button className="command-inline-button" type="button">
                    Dismiss Alert
                  </button>
                  <Link
                    className="command-inline-button"
                    href={`/brands/${brandId}/settings/users`}
                  >
                    Assign Owner
                  </Link>
                  <Link className="command-inline-link" href={alert.href}>
                    View Source
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
