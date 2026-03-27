import Link from "next/link";
import {
  getCustomerOpsNarrative,
  listSupportClustersAsync
} from "../../../../lib/customer-ops-data";

type SupportOpsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function severityTone(severity: string) {
  return severity === "high" ? "danger" : "warning";
}

function stateTone(state: string) {
  if (state === "resolved") {
    return "positive";
  }

  if (state === "escalated") {
    return "danger";
  }

  if (state === "assigned") {
    return "info";
  }

  return "warning";
}

export default async function SupportOpsPage({ params }: SupportOpsPageProps) {
  const { brandId } = await params;
  const clusters = await listSupportClustersAsync(brandId);
  const primaryCluster = clusters[0] ?? null;
  const activeClusters = clusters.filter((item) => item.state !== "resolved").length;
  const escalatedClusters = clusters.filter((item) => item.state === "escalated").length;
  const templateCount = clusters.filter((item) => item.linkedDraftHref).length;

  return (
    <section className="ops-intelligence-suite">
      <header className="command-header">
        <div className="command-header-copy">
          <p className="command-kicker">Support Ops</p>
          <h1 className="command-title">Support Intelligence</h1>
          <p className="command-description">{getCustomerOpsNarrative(brandId)}</p>
        </div>

        <div className="command-actions">
          {primaryCluster && primaryCluster.state !== "assigned" ? (
            <form
              action={`/api/brands/${brandId}/support-ops/${primaryCluster.id}/assign`}
              className="inline-form"
              method="post"
            >
              <input name="next" type="hidden" value={`/brands/${brandId}/support-ops`} />
              <button className="command-secondary-button" type="submit">
                Assign Issue Cluster
              </button>
            </form>
          ) : null}
          {primaryCluster && primaryCluster.state !== "escalated" ? (
            <form
              action={`/api/brands/${brandId}/support-ops/${primaryCluster.id}/escalate`}
              className="inline-form"
              method="post"
            >
              <input name="next" type="hidden" value={`/brands/${brandId}/support-ops`} />
              <button className="command-secondary-button" type="submit">
                Escalate
              </button>
            </form>
          ) : null}
          {primaryCluster ? (
            primaryCluster.linkedDraftHref ? (
              <Link className="command-primary-button" href={primaryCluster.linkedDraftHref}>
                Generate Response Template
              </Link>
            ) : (
              <form
                action={`/api/brands/${brandId}/support-ops/${primaryCluster.id}/generate-response-template`}
                className="inline-form"
                method="post"
              >
                <button className="command-primary-button" type="submit">
                  Generate Response Template
                </button>
              </form>
            )
          ) : null}
          {primaryCluster && primaryCluster.state !== "resolved" ? (
            <form
              action={`/api/brands/${brandId}/support-ops/${primaryCluster.id}/resolve`}
              className="inline-form"
              method="post"
            >
              <input name="next" type="hidden" value={`/brands/${brandId}/support-ops`} />
              <button className="command-secondary-button" type="submit">
                Mark Resolved
              </button>
            </form>
          ) : null}
        </div>
      </header>

      <div className="ops-intelligence-kpis">
        <article className="ops-intelligence-kpi">
          <span>Active clusters</span>
          <strong>{activeClusters}</strong>
          <p>Recurring support patterns currently being tracked across the workspace.</p>
        </article>
        <article className="ops-intelligence-kpi">
          <span>Escalated</span>
          <strong>{escalatedClusters}</strong>
          <p>Clusters already pushed into higher-urgency cross-functional handling.</p>
        </article>
        <article className="ops-intelligence-kpi">
          <span>Response templates</span>
          <strong>{templateCount}</strong>
          <p>Clusters already turned into reusable support messaging assets.</p>
        </article>
        <article className="ops-intelligence-kpi" data-tone="warning">
          <span>Resolved</span>
          <strong>{clusters.filter((item) => item.state === "resolved").length}</strong>
          <p>Issue clusters already closed after routing, escalation, or macro creation.</p>
        </article>
      </div>

      <div className="ops-intelligence-grid">
        <section className="ops-intelligence-table-shell">
          <div className="ops-intelligence-table-head ops-intelligence-table-head-support">
            <span>Cluster</span>
            <span>Volume</span>
            <span>Severity</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="ops-intelligence-body">
            {clusters.map((item, index) => (
              <article
                key={item.id}
                className="ops-intelligence-row ops-intelligence-row-support"
                data-active={index === 0}
              >
                <div className="ops-intelligence-cell-primary">
                  <strong>{item.title}</strong>
                  <p>
                    {item.category}. {item.evidence}
                  </p>
                </div>
                <div className="ops-intelligence-cell-metric">
                  <strong>{item.ticketVolume}</strong>
                  <span>Current load</span>
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
                <div className="ops-intelligence-actions">
                  <Link className="button-link-secondary" href={item.productHref}>
                    View Product
                  </Link>
                  {item.linkedDraftHref ? (
                    <Link className="button-link" href={item.linkedDraftHref}>
                      Open Template
                    </Link>
                  ) : (
                    <form
                      action={`/api/brands/${brandId}/support-ops/${item.id}/generate-response-template`}
                      className="inline-form"
                      method="post"
                    >
                      <button className="button-link" type="submit">
                        Generate Response Template
                      </button>
                    </form>
                  )}
                  {item.state !== "assigned" ? (
                    <form
                      action={`/api/brands/${brandId}/support-ops/${item.id}/assign`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/support-ops`} />
                      <button className="button-link-secondary" type="submit">
                        Assign Issue Cluster
                      </button>
                    </form>
                  ) : null}
                  {item.state !== "escalated" ? (
                    <form
                      action={`/api/brands/${brandId}/support-ops/${item.id}/escalate`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/support-ops`} />
                      <button className="button-link-secondary" type="submit">
                        Escalate
                      </button>
                    </form>
                  ) : null}
                  {item.state !== "resolved" ? (
                    <form
                      action={`/api/brands/${brandId}/support-ops/${item.id}/resolve`}
                      className="inline-form"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/support-ops`} />
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
          {primaryCluster ? (
            <article className="ops-intelligence-card">
              <p className="command-mini-kicker">Selected cluster</p>
              <h2>{primaryCluster.title}</h2>
              <div className="ops-intelligence-block">
                <span>Evidence</span>
                <p>{primaryCluster.evidence}</p>
              </div>
              <div className="ops-intelligence-block">
                <span>Impact</span>
                <p>{primaryCluster.implication}</p>
              </div>
              <div className="ops-intelligence-block">
                <span>Response angle</span>
                <p>{primaryCluster.responseTemplateAngle}</p>
              </div>
              <div className="record-meta">
                <span className="status-chip" data-tone={severityTone(primaryCluster.severity)}>
                  {primaryCluster.severity}
                </span>
                <span className="status-chip" data-tone={stateTone(primaryCluster.state)}>
                  {primaryCluster.state}
                </span>
              </div>
            </article>
          ) : null}

          <article className="ops-intelligence-card" data-tone="warm">
            <p className="command-mini-kicker">Support posture</p>
            <h2>How support intelligence should be used</h2>
            <div className="ops-intelligence-notes">
              <article>
                <strong>Cluster first.</strong>
                <p>When several tickets tell the same story, solve the pattern instead of just clearing cases faster.</p>
              </article>
              <article>
                <strong>Escalate only when ownership widens.</strong>
                <p>Escalation should mean the issue now touches product, ops, lifecycle, or CX strongly enough to need broader attention.</p>
              </article>
              <article>
                <strong>Leave with a better template.</strong>
                <p>If the same question keeps appearing, the team should leave the week with better reusable messaging than it had before.</p>
              </article>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
