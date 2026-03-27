import Link from "next/link";
import { listWorkspaceBriefsAsync } from "../../../../lib/operating-data";

type BriefsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function briefTone(status: string) {
  if (status === "reviewed") return "positive";
  if (status === "sent") return "info";
  return "warning";
}

function briefAuthor(brief: Awaited<ReturnType<typeof listWorkspaceBriefsAsync>>[number]) {
  return brief.nextActions[0]?.owner ?? "Agency";
}

export default async function BriefsPage({ params }: BriefsPageProps) {
  const { brandId } = await params;
  const briefs = await listWorkspaceBriefsAsync(brandId);

  return (
    <section className="archive-suite">
      <header className="archive-hero">
        <div>
          <p className="command-kicker">The Archive</p>
          <h1>Business Briefs</h1>
          <p className="archive-hero-copy">
            Weekly strategic summaries and historical ledgers of growth operations. A permanent record of the
            workspace trajectory.
          </p>
        </div>

        <div className="command-header-actions">
          <Link className="button-link-secondary" href={`/brands/${brandId}/briefs/latest`}>
            Export PDF
          </Link>
          <Link className="button-link" href={`/brands/${brandId}/overview`}>
            Generate New Brief
          </Link>
        </div>
      </header>

      <div className="archive-filter-bar">
        <div className="archive-filter-tabs">
          <button className="archive-filter-tab" data-active="true" type="button">
            All Briefs
          </button>
          <button className="archive-filter-tab" type="button">
            Weekly Focus
          </button>
          <button className="archive-filter-tab" type="button">
            Performance
          </button>
          <button className="archive-filter-tab" type="button">
            Strategic
          </button>
        </div>

        <div className="archive-filter-select">
          <span className="material-symbols-outlined">filter_list</span>
          <select defaultValue="Last 90 Days">
            <option>Last 90 Days</option>
            <option>Last Quarter</option>
            <option>Full Year</option>
          </select>
        </div>
      </div>

      <section className="archive-ledger">
        <div className="archive-ledger-head">
          <span>Status</span>
          <span>Brief Narrative</span>
          <span>Scope</span>
          <span>Author</span>
          <span>Date</span>
        </div>

        <div className="archive-ledger-body">
          {briefs.map((brief) => (
            <article key={brief.id} className="archive-ledger-row">
              <div>
                <span className="status-chip" data-tone={briefTone(brief.status)}>
                  {brief.status}
                </span>
              </div>

              <div className="archive-ledger-story">
                <Link className="archive-ledger-title" href={`/brands/${brandId}/briefs/${brief.id}`}>
                  {brief.title}
                </Link>
                <p>{brief.summary}</p>
              </div>

              <div className="archive-ledger-scope">
                <div className="record-meta">
                  {brief.audience.split(" and ").slice(0, 2).map((scope) => (
                    <span key={scope} className="status-chip" data-tone="neutral">
                      {scope}
                    </span>
                  ))}
                </div>
              </div>

              <div className="archive-ledger-author">
                <span className="archive-ledger-avatar">{briefAuthor(brief).slice(0, 2).toUpperCase()}</span>
                <span>{briefAuthor(brief)}</span>
              </div>

              <div className="archive-ledger-date">
                <p>{brief.weekLabel}</p>
                <Link className="workflow-inline-action" href={`/brands/${brandId}/briefs/${brief.id}`}>
                  Open Brief
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
