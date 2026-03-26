import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import { listWorkspaceBriefsAsync } from "../../../../lib/operating-data";

type BriefsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function briefTone(status: string): PresentationTone {
  if (status === "reviewed") {
    return "positive";
  }

  if (status === "sent") {
    return "info";
  }

  return "warning";
}

export default async function BriefsPage({ params }: BriefsPageProps) {
  const { brandId } = await params;
  const briefs = await listWorkspaceBriefsAsync(brandId);
  const sentCount = briefs.filter((brief) => brief.status === "sent").length;
  const reviewedCount = briefs.filter((brief) => brief.status === "reviewed").length;

  return (
    <WorkspacePage
      model={{
        kicker: "Weekly Briefs",
        title: "Founder-ready operating summaries",
        description:
          "Weekly briefs capture what changed, why it changed, and what should happen next across the workspace.",
        actions: [
          {
            label: "Open Latest Brief",
            href: `/brands/${brandId}/briefs/latest`
          },
          {
            label: "Generate New Brief",
            href: `/brands/${brandId}/overview`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Briefs available",
            value: `${briefs.length}`,
            note: "Historical and current summaries for the active workspace."
          },
          {
            label: "Delivered",
            value: `${sentCount}`,
            note: "Briefs that were generated and sent to stakeholders."
          },
          {
            label: "Reviewed",
            value: `${reviewedCount}`,
            note: "Briefs that have already been acknowledged by the team."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Archive"
            title="Recent weekly briefs"
            description="Use the archive to revisit decisions, risks, wins, and the weekly operating narrative."
            items={briefs.map((brief) => ({
              eyebrow: brief.weekLabel,
              title: brief.title,
              description: `${brief.summary} Audience: ${brief.audience}. ${brief.highlightsCount} highlights and ${brief.actionsCount} next actions captured.`,
              value: brief.status,
              note: brief.audience,
              tags: [
                { label: brief.status, tone: briefTone(brief.status) },
                { label: brief.audience, tone: "neutral" }
              ],
              actions: [
                {
                  label: "Open brief",
                  href: `/brands/${brandId}/briefs/${brief.id}`,
                  tone: "secondary"
                }
              ]
            }))}
            tone="warm"
          />
        </div>

        <aside className="editorial-rail">
          <EditorialListPanel
            label="Brief Rhythm"
            title="What a strong brief should contain"
            description="The brief is the leadership-facing operating artifact for the week."
            items={[
              {
                eyebrow: "Signal",
                title: "Explain what changed",
                description:
                  "Show the most important movement in revenue, conversion, retention, or workflow health.",
                tags: [{ label: "Signal", tone: "info" }]
              },
              {
                eyebrow: "Root cause",
                title: "Explain why it changed",
                description:
                  "Bridge numbers to the likely product, channel, creative, or CX root cause.",
                tags: [{ label: "Root cause", tone: "neutral" }]
              },
              {
                eyebrow: "Action",
                title: "Point to what happens next",
                description:
                  "Every brief should feed the opportunity, content, or operations queue with a clear owner.",
                tags: [{ label: "Action", tone: "positive" }]
              }
            ]}
            tone="ink"
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}
