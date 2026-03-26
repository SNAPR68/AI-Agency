import Link from "next/link";
import { getDefaultBrandPath } from "../lib/navigation";
import { getAuthenticatedAppState } from "../lib/session";
import { getRuntimeHealthStatus } from "../lib/runtime-health";
import { formatWorkspaceRole } from "../lib/workspace";

export default async function HomePage() {
  const auth = await getAuthenticatedAppState();
  const runtime = getRuntimeHealthStatus();
  const primaryBrandPath = auth ? getDefaultBrandPath(auth.session.brandId) : "/login";
  const workflowSteps = [
    {
      title: "Signal",
      copy: "Sync commerce and channel data into one operating picture."
    },
    {
      title: "Decide",
      copy: "See what changed, why it matters, and what deserves attention."
    },
    {
      title: "Create",
      copy: "Turn opportunities into hooks, briefs, drafts, and plans."
    },
    {
      title: "Execute",
      copy: "Push work through approvals, publishing, and reports."
    }
  ];

  return (
    <main className="app-frame">
      <div className="marketing-shell">
        <section className="surface-card marketing-nav">
          <div className="marketing-brand">
            <p className="marketing-brand-name">Agency</p>
            <p className="marketing-brand-meta">Shopify Brand OS</p>
          </div>
          <div className="marketing-nav-actions">
            <Link className="button-link-secondary" href="/login">
              Sign In
            </Link>
            <Link className="button-link" href={primaryBrandPath}>
              {auth ? "Continue to Workspace" : "View Sample Workspace"}
            </Link>
          </div>
        </section>

        <section className="hero-grid">
          <article className="hero-card hero-panel">
            <div>
              <span className="eyebrow">Revenue-Linked Growth OS</span>
              <h1 className="hero-title">
                The permanent operating ledger for modern D2C growth.
              </h1>
              <p className="hero-copy">
                Agency combines analytics, weekly business briefs, opportunities,
                content operations, approvals, publishing, retention, CX, and
                reporting into one approval-first workspace for Shopify-led teams.
              </p>
            </div>

            <div className="hero-actions">
              <Link className="button-link" href={primaryBrandPath}>
                {auth ? "Continue to Workspace" : "Request Demo"}
              </Link>
              <Link className="button-link-secondary" href="/login">
                {auth ? "Switch Workspace" : "Sign In"}
              </Link>
            </div>

            {auth ? (
              <div className="message-banner">
                Signed in as {auth.user.name} (
                {formatWorkspaceRole(auth.accessibleBrands[0].role)}) with access to{" "}
                {auth.accessibleBrands.length} workspace
                {auth.accessibleBrands.length === 1 ? "" : "s"}.
              </div>
            ) : null}

            <div className="hero-metric-grid">
              <article className="stat-card">
                <p className="stat-label">Authenticated surfaces</p>
                <p className="stat-value">25</p>
                <p className="stat-note">
                  One workspace spanning analytics, content, workflow, and growth ops.
                </p>
              </article>
              <article className="stat-card">
                <p className="stat-label">Primary loop</p>
                <p className="stat-value">Signal to action</p>
                <p className="stat-note">
                  Briefs, opportunities, content, approvals, publishing, and reporting.
                </p>
              </article>
            </div>
          </article>

          <article className="surface-card hero-panel">
            <span className="pill">Operating posture</span>
            <h2 className="section-title">Trust-first, approval-first, commerce-native.</h2>
            <p className="body-copy">
              The workspace should always tell the team what changed, why it changed,
              and what should happen next without forcing them through five tools.
            </p>
            <div className="hero-proof-grid">
              <div className="hero-proof-card">
                <p className="stat-label">Weekly clarity</p>
                <p className="stat-note">
                  Founder-ready brief, alert feed, inbox, and exportable reports.
                </p>
              </div>
              <div className="hero-proof-card">
                <p className="stat-label">Execution loop</p>
                <p className="stat-note">
                  Opportunities connect directly to drafts, approvals, and publish state.
                </p>
              </div>
              <div className="hero-proof-card">
                <p className="stat-label">Commerce backbone</p>
                <p className="stat-note">
                  Shopify syncs, Supabase-backed tenancy, and runtime readiness built in.
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="surface-card">
          <span className="pill">Workflow loop</span>
          <h2 className="section-title">How the operating system should feel</h2>
          <div className="workflow-strip">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="workflow-step">
                <span className="workflow-step-index">Step {index + 1}</span>
                <h3 className="workflow-step-title">{step.title}</h3>
                <p className="workflow-step-copy">{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-card">
          <span className="pill">Runtime readiness</span>
          <h2 className="section-title">
            {runtime.overallStatus.replaceAll("_", " ")} operating state
          </h2>
          <p className="body-copy">{runtime.summary}</p>
          <div className="runtime-grid">
            {runtime.areas.map((area) => (
              <article className="stat-card" key={area.name}>
                <p className="stat-label">{area.name}</p>
                <p className="stat-value">{area.status.replaceAll("_", " ")}</p>
                <p className="stat-note">{area.summary}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
