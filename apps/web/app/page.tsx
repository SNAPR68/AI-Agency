import Link from "next/link";

const pillars = [
  {
    icon: "analytics",
    title: "Predictive Analytics",
    description:
      "Forecast contribution margin, LTV, inventory pressure, and campaign efficiency from a single operating surface."
  },
  {
    icon: "psychology",
    title: "Growth Intelligence",
    description:
      "Turn raw storefront movement into ranked opportunities, briefs, alerts, and next actions the team can actually execute."
  },
  {
    icon: "auto_stories",
    title: "Editorial Publishing",
    description:
      "Move from signals to drafts, approvals, publishing, and reporting without splitting the workflow across five tools."
  }
];

const workflow = [
  {
    step: "Ingest",
    title: "Capture every signal",
    copy: "Shopify, campaigns, retention, CX, and workflow state land in one ledger."
  },
  {
    step: "Synthesize",
    title: "Generate priority",
    copy: "The workspace highlights what changed, why it changed, and which record needs attention."
  },
  {
    step: "Execute",
    title: "Ship the response",
    copy: "Opportunities move directly into content, approvals, publishing, and reporting."
  }
];

const proofCards = [
  {
    title: "Operating posture",
    copy: "Trust-first, approval-first, commerce-native."
  },
  {
    title: "Weekly clarity",
    copy: "Founder-ready brief, alert feed, inbox, and exportable reports."
  },
  {
    title: "Execution loop",
    copy: "Opportunities connect directly to drafts, approvals, and publish state."
  }
];

export default function HomePage() {
  return (
    <main className="marketing-shell">
      <nav className="marketing-nav hero-card">
        <div className="marketing-brand">
          <h1 className="marketing-brand-name">Agency</h1>
          <p className="marketing-brand-meta">Shopify Brand OS</p>
        </div>

        <div className="marketing-nav-actions">
          <Link className="button-link-secondary" href="/login">
            Sign In
          </Link>
          <Link className="button-link" href="/api/auth/preview">
            View Sample Workspace
          </Link>
        </div>
      </nav>

      <section className="hero-grid">
        <article className="hero-card hero-panel">
          <span className="eyebrow">Revenue-linked growth OS</span>
          <h2 className="hero-title">The permanent ledger of modern D2C growth.</h2>
          <p className="hero-copy">
            Agency combines analytics, weekly business briefs, opportunities, content
            operations, approvals, publishing, retention, CX, and reporting into one
            approval-first workspace for Shopify-led teams.
          </p>

          <div className="hero-actions">
            <Link className="button-link" href="/login">
              Request Demo
            </Link>
            <Link className="button-link-secondary" href="/api/auth/preview">
              View Sample Workspace
            </Link>
            <Link className="button-link-secondary" href="/login">
              Sign In
            </Link>
          </div>
        </article>

        <aside className="hero-panel">
          <div className="hero-proof-grid">
            {proofCards.map((card) => (
              <article key={card.title} className="hero-proof-card">
                <p className="editorial-section-label">{card.title}</p>
                <p className="body-copy">{card.copy}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="hero-card">
        <div className="page-header-card">
          <div>
            <span className="eyebrow">Product Pillars</span>
            <h2 className="page-title">One operating system for decision, execution, and reporting.</h2>
            <p className="page-copy">
              Replace fragmented dashboards with a structured growth workspace that feels
              premium, accountable, and useful to actual operators.
            </p>
          </div>
        </div>

        <div className="cards-grid">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="workflow-card">
              <span className="material-symbols-outlined">{pillar.icon}</span>
              <h3 className="section-title">{pillar.title}</h3>
              <p className="body-copy">{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="hero-card">
        <div className="page-header-card">
          <div>
            <span className="eyebrow">Autonomous Growth Loop</span>
            <h2 className="page-title">Ingest. Synthesize. Execute.</h2>
            <p className="page-copy">
              Agency is designed to show the team what changed, why it changed, and what
              should happen next without forcing them through five tools.
            </p>
          </div>
        </div>

        <div className="workflow-strip">
          {workflow.map((item) => (
            <article key={item.step} className="workflow-step">
              <span className="workflow-step-index">{item.step}</span>
              <h3 className="workflow-step-title">{item.title}</h3>
              <p className="workflow-step-copy">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
