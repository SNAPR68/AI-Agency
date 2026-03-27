import Link from "next/link";

export type WorkspaceAction = {
  label: string;
  href: string;
  tone?: "primary" | "secondary";
};

export type WorkspaceStat = {
  label: string;
  value: string;
  note: string;
};

export type WorkspaceCard = {
  label?: string;
  title: string;
  description: string;
  items?: string[];
};

export type WorkspacePageModel = {
  kicker: string;
  title: string;
  description: string;
  notice?: string;
  actions?: WorkspaceAction[];
  stats?: WorkspaceStat[];
  cards?: WorkspaceCard[];
};

type WorkspacePageProps = {
  model: WorkspacePageModel;
  children?: React.ReactNode;
};

export function WorkspacePage({ model, children }: WorkspacePageProps) {
  return (
    <div className="workspace-page">
      <section className="workspace-page-header">
        <div className="workspace-page-header-copy">
          <p className="workspace-page-kicker">{model.kicker}</p>
          <h1 className="workspace-page-title">{model.title}</h1>
          <p className="workspace-page-description">{model.description}</p>
          {model.notice ? <div className="message-banner">{model.notice}</div> : null}
        </div>

        {model.actions && model.actions.length > 0 ? (
          <div className="workspace-page-actions">
            {model.actions.map((action, index) => (
              <Link
                key={`${action.href}-${action.label}`}
                className={
                  action.tone === "secondary"
                    ? "workspace-page-button-secondary"
                    : index === 0
                      ? "workspace-page-button-primary"
                      : "workspace-page-button-secondary"
                }
                href={action.href}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {model.stats && model.stats.length > 0 ? (
        <section className="workspace-kpi-strip">
          {model.stats.map((stat) => (
            <article key={stat.label} className="workspace-kpi-card">
              <p className="workspace-kpi-label">{stat.label}</p>
              <p className="workspace-kpi-value">{stat.value}</p>
              <p className="workspace-kpi-note">{stat.note}</p>
            </article>
          ))}
        </section>
      ) : null}

      {children}

      {model.cards && model.cards.length > 0 ? (
        <section className="cards-grid">
          {model.cards.map((card) => (
            <article key={card.title} className="surface-card">
              {card.label ? <span className="pill">{card.label}</span> : null}
              <h2 className="section-title">{card.title}</h2>
              <p className="body-copy">{card.description}</p>
              {card.items && card.items.length > 0 ? (
                <ul className="list">
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
