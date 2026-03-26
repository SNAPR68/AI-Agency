import Link from "next/link";

export type PresentationTone =
  | "neutral"
  | "positive"
  | "warning"
  | "danger"
  | "info";

export type PresentationTag = {
  label: string;
  tone?: PresentationTone;
};

export type PresentationAction = {
  label: string;
  href: string;
  tone?: "primary" | "secondary";
  method?: "get" | "post";
  fields?: Array<{
    name: string;
    value: string;
  }>;
};

export type PresentationItem = {
  title: string;
  description: string;
  tags?: PresentationTag[];
  actions?: PresentationAction[];
};

export type EditorialItem = {
  eyebrow?: string;
  title: string;
  description: string;
  value?: string;
  note?: string;
  tags?: PresentationTag[];
  actions?: PresentationAction[];
};

type RecordPanelProps = {
  label?: string;
  title: string;
  description?: string;
  items: PresentationItem[];
  emptyMessage?: string;
};

type EditorialListPanelProps = {
  label?: string;
  title: string;
  description?: string;
  items: EditorialItem[];
  tone?: "default" | "ink" | "warm";
  emptyMessage?: string;
};

function renderPresentationAction(
  itemKey: string,
  action: PresentationAction
) {
  if (action.method === "post") {
    return (
      <form
        key={`${itemKey}-${action.label}-${action.href}`}
        action={action.href}
        className="inline-form"
        method="post"
      >
        {action.fields?.map((field) => (
          <input
            key={`${action.href}-${field.name}`}
            name={field.name}
            type="hidden"
            value={field.value}
          />
        ))}
        <button
          className={
            action.tone === "primary" ? "button-link" : "button-link-secondary"
          }
          type="submit"
        >
          {action.label}
        </button>
      </form>
    );
  }

  return (
    <Link
      key={`${itemKey}-${action.label}-${action.href}`}
      className={action.tone === "primary" ? "button-link" : "button-link-secondary"}
      href={action.href}
    >
      {action.label}
    </Link>
  );
}

export function RecordPanel({
  label,
  title,
  description,
  items,
  emptyMessage = "No items yet."
}: RecordPanelProps) {
  return (
    <article className="surface-card">
      {label ? <span className="pill">{label}</span> : null}
      <h2 className="section-title">{title}</h2>
      {description ? <p className="body-copy">{description}</p> : null}

      {items.length > 0 ? (
        <div className="record-list">
          {items.map((item) => (
            <div key={`${item.title}-${item.description}`} className="record-item">
              <div className="record-head">
                <p className="record-title">{item.title}</p>
                {item.tags && item.tags.length > 0 ? (
                  <div className="record-meta">
                    {item.tags.map((tag) => (
                      <span
                        key={`${item.title}-${tag.label}`}
                        className="status-chip"
                        data-tone={tag.tone ?? "neutral"}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <p className="record-copy">{item.description}</p>

              {item.actions && item.actions.length > 0 ? (
                <div className="record-actions">
                  {item.actions.map((action) =>
                    renderPresentationAction(item.title, action)
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-note">{emptyMessage}</p>
      )}
    </article>
  );
}

export function EditorialListPanel({
  label,
  title,
  description,
  items,
  tone = "default",
  emptyMessage = "No items yet."
}: EditorialListPanelProps) {
  return (
    <article className="editorial-section" data-tone={tone}>
      {label ? <p className="editorial-section-label">{label}</p> : null}
      <div className="editorial-section-head">
        <div>
          <h2 className="editorial-section-title">{title}</h2>
          {description ? (
            <p className="editorial-section-description">{description}</p>
          ) : null}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="editorial-list">
          {items.map((item) => (
            <div
              key={`${item.eyebrow ?? item.title}-${item.description}`}
              className="editorial-row"
            >
              <div className="editorial-row-head">
                <div className="editorial-row-copy-stack">
                  {item.eyebrow ? (
                    <p className="editorial-row-eyebrow">{item.eyebrow}</p>
                  ) : null}
                  <h3 className="editorial-row-title">{item.title}</h3>
                </div>

                {item.value || item.note ? (
                  <div className="editorial-row-side">
                    {item.value ? (
                      <p className="editorial-row-value">{item.value}</p>
                    ) : null}
                    {item.note ? <p className="editorial-row-note">{item.note}</p> : null}
                  </div>
                ) : null}
              </div>

              <p className="editorial-row-description">{item.description}</p>

              {(item.tags && item.tags.length > 0) || (item.actions && item.actions.length > 0) ? (
                <div className="editorial-row-footer">
                  <div className="record-meta">
                    {item.tags?.map((tag) => (
                      <span
                        key={`${item.title}-${tag.label}`}
                        className="status-chip"
                        data-tone={tag.tone ?? "neutral"}
                      >
                        {tag.label}
                      </span>
                    ))}
                  </div>

                  {item.actions && item.actions.length > 0 ? (
                    <div className="record-actions">
                      {item.actions.map((action) =>
                        renderPresentationAction(item.title, action)
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-note">{emptyMessage}</p>
      )}
    </article>
  );
}
