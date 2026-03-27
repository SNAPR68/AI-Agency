import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import {
  getHostedWriteDisabledMessage,
  hostedWriteDisabledErrorCode
} from "../../../../lib/session";
import { listWorkspaceInboxItemsAsync } from "../../../../lib/operating-data";

type InboxPageProps = {
  params: Promise<{
    brandId: string;
  }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

function kindTone(kind: string): PresentationTone {
  if (kind === "approval") {
    return "warning";
  }

  if (kind === "alert") {
    return "danger";
  }

  if (kind === "brief") {
    return "info";
  }

  return "neutral";
}

export default async function InboxPage({
  params,
  searchParams
}: InboxPageProps) {
  const { brandId } = await params;
  const { error } = await searchParams;
  const items = await listWorkspaceInboxItemsAsync(brandId);
  const priorityItems = items.filter(
    (item) => item.state === "needs_review" || item.state === "open"
  );
  const laterItems = items.filter(
    (item) => item.state !== "needs_review" && item.state !== "open"
  );

  return (
    <WorkspacePage
      model={{
        kicker: "Inbox",
        title: "Everything that needs a response",
        description:
          "The inbox centralizes approvals, alerts, delivered briefs, and operational reminders so the team always knows what requires attention next.",
        notice:
          error === hostedWriteDisabledErrorCode ? getHostedWriteDisabledMessage() : undefined,
        actions: [
          {
            label: "Open Approvals",
            href: `/brands/${brandId}/approvals`
          },
          {
            label: "Open Publishing",
            href: `/brands/${brandId}/publishing`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Inbox items",
            value: `${items.length}`,
            note: "Current items routed into the shared operating feed."
          },
          {
            label: "Needs review",
            value: `${items.filter((item) => item.state === "needs_review").length}`,
            note: "Items still waiting for a human review or response."
          },
          {
            label: "Open issues",
            value: `${items.filter((item) => item.state === "open").length}`,
            note: "Alerts or system issues still active in the queue."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Today"
            title="Priority action items"
            description="This is where the team should start before creating more work elsewhere in the workspace."
            items={priorityItems.map((item) => ({
              eyebrow: `${item.kind} · ${item.receivedAtLabel}`,
              title: item.title,
              description: item.summary,
              value: item.state,
              note: "State",
              tags: [
                { label: item.kind, tone: kindTone(item.kind) },
                { label: item.state, tone: "neutral" }
              ],
              actions: [
                {
                  label: item.actionLabel,
                  href: item.href,
                  tone: "secondary"
                },
                ...(item.state !== "resolved"
                  ? [
                      {
                        label: "Mark as read",
                        href: `/api/brands/${brandId}/inbox/${item.id}/read`,
                        method: "post" as const,
                        tone: "primary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/inbox`
                          }
                        ]
                      },
                      {
                        label: "Snooze",
                        href: `/api/brands/${brandId}/inbox/${item.id}/snooze`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/inbox`
                          }
                        ]
                      }
                    ]
                  : [])
              ]
            }))}
            tone="warm"
          />

          <EditorialListPanel
            label="Earlier"
            title="Scheduled and resolved workflow notes"
            description="Keep the backlog visible without letting it overpower the current operating day."
            items={laterItems.map((item) => ({
              eyebrow: `${item.kind} · ${item.receivedAtLabel}`,
              title: item.title,
              description: item.summary,
              value: item.state,
              note: "State",
              tags: [
                { label: item.kind, tone: kindTone(item.kind) },
                { label: item.state, tone: "neutral" }
              ],
              actions: [
                {
                  label: item.actionLabel,
                  href: item.href,
                  tone: "secondary"
                }
              ]
            }))}
          />
        </div>

        <aside className="editorial-rail">
          <EditorialListPanel
            label="Usage"
            title="How to use the inbox"
            description="The inbox should reduce tab-switching and keep the week moving."
            items={[
              {
                eyebrow: "Priority",
                title: "Handle reviews before creating new work",
                description:
                  "Approvals and urgent alerts should be cleared before the team expands the queue.",
                tags: [{ label: "Priority", tone: "warning" }]
              },
              {
                eyebrow: "Shared visibility",
                title: "Use it as the cross-functional starting point",
                description:
                  "Founders, operators, and marketers should all be able to see the same action queue.",
                tags: [{ label: "Shared visibility", tone: "info" }]
              },
              {
                eyebrow: "Workflow handoff",
                title: "Route items into deeper workflows",
                description:
                  "The inbox is not the end destination. Each item should open the right screen for the next decision.",
                tags: [{ label: "Workflow handoff", tone: "positive" }]
              }
            ]}
            tone="ink"
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
