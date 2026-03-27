import Link from "next/link";
import { type PresentationTone } from "../../../../../components/data-presentation";
import { WorkspacePage } from "../../../../../components/workspace-page";
import {
  getContentCalendarNarrative,
  listCalendarBacklogGroups,
  listCalendarDays
} from "../../../../../lib/content-calendar-data";
import { formatDraftStatusLabel } from "../../../../../lib/workflow-execution-data";

type ContentCalendarPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export default async function ContentCalendarPage({
  params
}: ContentCalendarPageProps) {
  const { brandId } = await params;
  const [days, backlogGroups, narrative] = await Promise.all([
    listCalendarDays(brandId),
    listCalendarBacklogGroups(brandId),
    getContentCalendarNarrative(brandId)
  ]);
  const scheduledCount = days.flatMap((day) => day.items).filter((item) => item.status === "scheduled").length;
  const publishedCount = days.flatMap((day) => day.items).filter((item) => item.status === "published").length;
  const readyCount = backlogGroups.find((group) => group.id === "ready")?.items.length ?? 0;

  return (
    <WorkspacePage
      model={{
        kicker: "Content Calendar",
        title: "Weekly schedule and backlog planning",
        description: narrative,
        actions: [
          {
            label: "Open Content Studio",
            href: `/brands/${brandId}/content`
          },
          {
            label: "Open Publishing",
            href: `/brands/${brandId}/publishing`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Scheduled this week",
            value: `${scheduledCount}`,
            note: "Assets already committed to the calendar."
          },
          {
            label: "Published this week",
            value: `${publishedCount}`,
            note: "Work that has already gone live during the current planning week."
          },
          {
            label: "Ready to schedule",
            value: `${readyCount}`,
            note: "Approved assets that still need a slot on the calendar."
          }
        ]
      }}
    >
      <section className="planner-layout">
        <div className="planner-main">
          <section className="planner-card" data-tone="warm">
            <p className="editorial-section-label">Week view</p>
            <h2 className="planner-card-title">Publishing calendar</h2>
            <p className="planner-card-copy">
              This view keeps committed work visible so the team can see what is already going live and what still needs a placement decision.
            </p>

            <div className="planner-toolbar">
              <span className="planner-filter-chip" data-active="true">Weekly</span>
              <span className="planner-filter-chip">Monthly</span>
              <span className="planner-filter-chip" data-active="true">All channels</span>
              <span className="planner-filter-chip">Status: mixed</span>
            </div>

            <div className="planner-board">
              {days.map((day) => (
                <article key={day.id} className="planner-day">
                  <div className="planner-day-head">
                    <p className="planner-day-label">{day.label}</p>
                    <p className="planner-day-copy">{day.fullLabel}</p>
                  </div>

                  {day.items.length > 0 ? (
                    <div className="planner-slot">
                      <div className="planner-slot-list">
                        {day.items.map((item) => (
                          <article key={item.id} className="planner-slot-item">
                            <div className="record-head">
                              <p className="planner-slot-title">{item.title}</p>
                              <span
                                className="status-chip"
                                data-tone={item.status === "published" ? "positive" : "warning"}
                              >
                                {item.status}
                              </span>
                            </div>
                            <p className="planner-slot-copy">{item.summary}</p>
                            <div className="record-meta">
                              <span className="status-chip" data-tone="info">
                                {item.channel}
                              </span>
                              <span className="status-chip" data-tone="neutral">
                                {item.timeLabel}
                              </span>
                            </div>
                            <div className="record-actions">
                              <Link className="button-link-secondary" href={item.draftHref}>
                                Open draft
                              </Link>
                              {item.cancelHref ? (
                                <form action={item.cancelHref} className="inline-form" method="post">
                                  <input name="next" type="hidden" value={`/brands/${brandId}/content/calendar`} />
                                  <button className="button-link-secondary" type="submit">
                                    Cancel slot
                                  </button>
                                </form>
                              ) : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="planner-empty-slot">No scheduled work</div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="planner-sidebar">
          {backlogGroups.map((group) => (
            <section key={group.id} className="planner-card">
              <p className="editorial-section-label">Backlog</p>
              <h2 className="planner-card-title">{group.title}</h2>
              <p className="planner-card-copy">{group.description}</p>

              <div className="planner-backlog-list">
                {group.items.length > 0 ? (
                  group.items.map((draft) => (
                    <article key={draft.id} className="planner-backlog-item">
                      <p className="planner-backlog-title">{draft.title}</p>
                      <p className="planner-backlog-copy">{draft.hook}</p>
                      <div className="record-meta">
                        <span className="status-chip" data-tone={draftTone(draft.status)}>
                          {formatDraftStatusLabel(draft.status)}
                        </span>
                        <span className="status-chip" data-tone="info">
                          {draft.channel}
                        </span>
                      </div>
                      <div className="record-actions">
                        <Link className="button-link-secondary" href={draft.href}>
                          Open draft
                        </Link>
                        {group.id === "ready" ? (
                          <form
                            action={`/api/brands/${brandId}/publishing/${draft.id}/schedule`}
                            className="inline-form"
                            method="post"
                          >
                            <input name="next" type="hidden" value={`/brands/${brandId}/content/calendar`} />
                            <button className="button-link" type="submit">
                              Schedule post
                            </button>
                          </form>
                        ) : null}
                        {group.id === "approval" ? (
                          <Link className="button-link" href={`/brands/${brandId}/approvals`}>
                            Open approvals
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty-note">Nothing in this planning lane right now.</p>
                )}
              </div>
            </section>
          ))}
        </aside>
      </section>
    </WorkspacePage>
  );
}

function draftTone(status: string): PresentationTone {
  if (status === "approved" || status === "published") {
    return "positive";
  }

  if (status === "ready_for_approval") {
    return "warning";
  }

  if (status === "changes_requested" || status === "rejected") {
    return "danger";
  }

  return "neutral";
}
