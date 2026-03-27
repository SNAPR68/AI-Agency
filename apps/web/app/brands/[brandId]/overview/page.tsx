import Link from "next/link";
import { getWorkspaceOverviewAsync } from "../../../../lib/operating-data";

type BrandOverviewPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function mapKpiAccent(index: number) {
  if (index === 0) {
    return "secondary";
  }

  if (index === 1) {
    return "primary";
  }

  if (index === 2) {
    return "muted";
  }

  return "secondary";
}

function mapSignalIcon(index: number) {
  return ["trending_up", "inventory_2", "campaign", "bolt"][index] ?? "insights";
}

export default async function BrandOverviewPage({
  params
}: BrandOverviewPageProps) {
  const { brandId } = await params;
  const overview = await getWorkspaceOverviewAsync(brandId);
  const kpis = overview.kpis.slice(0, 4);
  const featuredRecord = overview.nextActions[0];
  const featuredStats = overview.kpis.slice(0, 3);
  const changeSignals = [...overview.risks.slice(0, 2), ...overview.wins.slice(0, 2)].slice(
    0,
    4
  );
  const syncHealth = overview.syncHealth.slice(0, 4);
  const quickLinks = [
    {
      label: "Product Performance",
      href: `/brands/${brandId}/products`
    },
    {
      label: "Customer Cohorts",
      href: `/brands/${brandId}/retention`
    },
    {
      label: "Campaign Deep-Dive",
      href: `/brands/${brandId}/campaigns`
    },
    {
      label: "Support Signals",
      href: `/brands/${brandId}/support-ops`
    }
  ];

  return (
    <div className="ledger-page">
      <div className="ledger-shell">
        <div className="ledger-main">
          <section className="ledger-header">
            <div className="ledger-header-copy">
              <p className="ledger-header-kicker">Operational Overview</p>
              <h1 className="ledger-header-title">Main Ledger</h1>
              <p className="ledger-header-description">{overview.description}</p>
            </div>

            <div className="ledger-header-actions">
              <div className="ledger-secondary-actions">
                <Link
                  className="ledger-secondary-action"
                  href={`/brands/${brandId}/settings/integrations`}
                >
                  <span className="material-symbols-outlined">sync</span>
                  Sync Data
                </Link>
                <Link className="ledger-secondary-action" href={`/brands/${brandId}/opportunities`}>
                  <span className="material-symbols-outlined">bolt</span>
                  View Opportunities
                </Link>
                <Link className="ledger-secondary-action" href={`/brands/${brandId}/alerts`}>
                  <span className="material-symbols-outlined">notifications</span>
                  Open Alerts
                </Link>
              </div>
              <Link className="ledger-primary-action" href={`/brands/${brandId}/briefs/latest`}>
                Generate Weekly Brief
                <span className="material-symbols-outlined">auto_awesome</span>
              </Link>
            </div>
          </section>

          <section className="ledger-kpi-strip">
            {kpis.map((kpi, index) => (
              <article
                key={kpi.label}
                className="ledger-kpi-card"
                data-accent={mapKpiAccent(index)}
              >
                <div className="ledger-kpi-head">
                  <span className="ledger-kpi-label">{kpi.label}</span>
                  <span className="material-symbols-outlined">{mapSignalIcon(index)}</span>
                </div>
                <p className="ledger-kpi-value">{kpi.value}</p>
                <p className="ledger-kpi-delta">{kpi.delta}</p>
                <p className="ledger-kpi-note">{kpi.note}</p>
              </article>
            ))}
          </section>

          <div className="ledger-grid">
            <section className="ledger-panel ledger-panel-wide">
              <div className="ledger-panel-head">
                <h2 className="ledger-panel-title">What Changed This Week</h2>
                <span className="ledger-panel-pill">Live Feed</span>
              </div>
              <div className="ledger-feed">
                {changeSignals.map((signal, index) => (
                  <article key={signal.title} className="ledger-feed-item">
                    <div className="ledger-feed-icon" data-tone={index < 2 ? "warning" : "positive"}>
                      <span className="material-symbols-outlined">
                        {index < 2 ? "warning" : "trending_up"}
                      </span>
                    </div>
                    <div className="ledger-feed-copy">
                      <p className="ledger-feed-title">{signal.title}</p>
                      <p className="ledger-feed-description">{signal.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="ledger-panel ledger-panel-dark">
              <div>
                <div className="ledger-system-state">
                  <span className="ledger-system-state-dot" />
                  <span>Data Systems Nominal</span>
                </div>
                <h2 className="ledger-panel-title">Sync Integrity</h2>
                <p className="ledger-panel-description">
                  The team should know the data is fresh before trusting what changed.
                </p>
              </div>

              <div className="ledger-system-list">
                {syncHealth.map((integration) => (
                  <div key={integration.provider} className="ledger-system-row">
                    <span>{integration.label}</span>
                    <span>{integration.lastSyncedLabel}</span>
                  </div>
                ))}
              </div>

              <div className="ledger-health-meter">
                <div className="ledger-health-meter-bar" />
              </div>
            </aside>

            <section className="ledger-panel">
              <h2 className="ledger-panel-title ledger-panel-title-positive">Top Wins</h2>
              <ul className="ledger-bullet-list">
                {overview.wins.slice(0, 3).map((win) => (
                  <li key={win.title}>
                    <span className="ledger-bullet ledger-bullet-positive">●</span>
                    <span>{win.description}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="ledger-panel">
              <h2 className="ledger-panel-title ledger-panel-title-danger">Top Risks</h2>
              <ul className="ledger-bullet-list">
                {overview.risks.slice(0, 3).map((risk) => (
                  <li key={risk.title}>
                    <span className="ledger-bullet ledger-bullet-danger">●</span>
                    <span>{risk.description}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="ledger-actions-section">
              <h2 className="ledger-panel-title">Recommended Next Actions</h2>
              <div className="ledger-action-grid">
                {overview.nextActions.slice(0, 3).map((action, index) => (
                  <Link
                    key={action.title}
                    className="ledger-action-card"
                    data-tone={index === 0 ? "warm" : "neutral"}
                    href={action.href}
                  >
                    <div className="ledger-action-head">
                      <span className="material-symbols-outlined">
                        {index === 0 ? "inventory" : index === 1 ? "ads_click" : "psychology"}
                      </span>
                      <span className="ledger-action-label">
                        {index === 0 ? "Urgent" : index === 1 ? "Marketing" : "Strategy"}
                      </span>
                    </div>
                    <h3 className="ledger-action-title">{action.title}</h3>
                    <p className="ledger-action-description">{action.description}</p>
                    <span className="ledger-action-link">
                      Open workflow
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="ledger-quick-links">
              <span className="ledger-quick-links-label">Deeper Context</span>
              {quickLinks.map((link, index) => (
                <div key={link.href} className="ledger-quick-link-wrap">
                  <Link className="ledger-quick-link" href={link.href}>
                    {link.label}
                    <span className="material-symbols-outlined">open_in_new</span>
                  </Link>
                  {index < quickLinks.length - 1 ? (
                    <span className="ledger-quick-link-sep">/</span>
                  ) : null}
                </div>
              ))}
            </section>
          </div>
        </div>

        <aside className="ledger-record-rail">
          <div className="ledger-record-card">
            <div className="ledger-record-head">
              <span className="ledger-record-kicker">Active Record</span>
              <button className="ledger-record-close" type="button" aria-label="Close panel">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <h2 className="ledger-record-title">{featuredRecord?.title ?? "Reset Serum Bundle"}</h2>
            <p className="ledger-record-meta">Hero product · Priority lane</p>

            <div className="ledger-record-visual">
              <div className="ledger-record-stack" />
            </div>

            <div className="ledger-record-stat-list">
              {featuredStats.map((stat) => (
                <div key={stat.label} className="ledger-record-stat-row">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>

            <p className="ledger-record-note">
              {featuredRecord?.description ??
                "This record is the main operating priority because it touches revenue, conversion, and campaign output at the same time."}
            </p>

            <Link className="ledger-record-button" href={featuredRecord?.href ?? `/brands/${brandId}/products`}>
              Open Featured Workflow
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
