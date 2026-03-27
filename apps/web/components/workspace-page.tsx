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
    <div className="page-stack">
      <section className="surface-card page-header-card">
        <div className="page-header-meta">
          <p className="kicker">{model.kicker}</p>
          <h1 className="page-title">{model.title}</h1>
          <p className="page-copy">{model.description}</p>
          {model.notice ? <div className="message-banner">{model.notice}</div> : null}
        </div>

        {model.actions && model.actions.length > 0 ? (
          <div className="page-actions">
            {model.actions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                className={
                  action.tone === "secondary" ? "button-link-secondary" : "button-link"
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
        <section className="stats-grid">
          {model.stats.map((stat) => (
            <article key={stat.label} className="stat-card">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value">{stat.value}</p>
              <p className="stat-note">{stat.note}</p>
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
