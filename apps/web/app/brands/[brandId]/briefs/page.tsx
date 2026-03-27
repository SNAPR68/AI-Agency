import Link from "next/link";
import { listWorkspaceBriefsAsync } from "../../../../lib/operating-data";

type BriefsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function briefTone(status: string) {
  if (status === "reviewed") {
    return "positive";
  }

  if (status === "sent") {
    return "info";
  }

  return "warning";
}

function briefAuthor(brief: Awaited<ReturnType<typeof listWorkspaceBriefsAsync>>[number]) {
  return brief.nextActions[0]?.owner ?? "Agency";
}

export default async function BriefsPage({ params }: BriefsPageProps) {
  const { brandId } = await params;
  const briefs = await listWorkspaceBriefsAsync(brandId);

  return (
    <div className="archive-page">
      <section className="command-header">
        <div className="command-header-copy">
          <p className="command-kicker">The archive</p>
          <h1 className="command-title">Business Briefs</h1>
          <p className="command-description">
            Weekly strategic summaries and historical ledgers of growth operations.
            A permanent record of the workspace trajectory.
          </p>
        </div>

        <div className="command-actions">
          <Link className="command-secondary-button" href={`/brands/${brandId}/briefs/latest`}>
            Export PDF
          </Link>
          <Link className="command-primary-button" href={`/brands/${brandId}/overview`}>
            Generate New Brief
          </Link>
        </div>
      </section>

      <section className="archive-toolbar">
        <div className="archive-tabs">
          <button className="archive-tab" data-active="true" type="button">
            All Briefs
          </button>
          <button className="archive-tab" type="button">
            Weekly Focus
          </button>
          <button className="archive-tab" type="button">
            Performance
          </button>
          <button className="archive-tab" type="button">
            Strategic
          </button>
        </div>

        <div className="archive-controls">
          <div className="archive-select-wrap">
            <span className="material-symbols-outlined">filter_list</span>
            <select className="archive-select" defaultValue="Last 90 Days">
              <option>Last 90 Days</option>
              <option>Last Quarter</option>
              <option>Full Year</option>
            </select>
          </div>
        </div>
      </section>

      <section className="archive-table">
        <div className="archive-table-head">
          <span>Status</span>
          <span>Brief Narrative</span>
          <span>Scope</span>
          <span>Author</span>
          <span className="archive-table-date">Date</span>
        </div>

        <div className="archive-table-body">
          {briefs.map((brief) => (
            <article key={brief.id} className="archive-row">
              <div className="archive-row-status">
                <span className="status-chip" data-tone={briefTone(brief.status)}>
                  {brief.status}
                </span>
              </div>

              <div className="archive-row-story">
                <Link className="archive-row-title" href={`/brands/${brandId}/briefs/${brief.id}`}>
                  {brief.title}
                </Link>
                <p className="archive-row-copy">{brief.summary}</p>
              </div>

              <div className="archive-row-scope">
                <div className="record-meta">
                  {brief.audience.split(" and ").slice(0, 2).map((scope) => (
                    <span key={scope} className="status-chip" data-tone="neutral">
                      {scope}
                    </span>
                  ))}
                </div>
              </div>

              <div className="archive-row-author">
                <div className="archive-avatar">{briefAuthor(brief).slice(0, 2).toUpperCase()}</div>
                <span>{briefAuthor(brief)}</span>
              </div>

              <div className="archive-row-date">
                <p>{brief.weekLabel}</p>
                <Link className="command-inline-link" href={`/brands/${brandId}/briefs/${brief.id}`}>
                  Open Brief
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
