import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import {
  getAcquisitionNarrative,
  listChannelViews
} from "../../../../lib/acquisition-data";

type ChannelsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export default async function ChannelsPage({ params }: ChannelsPageProps) {
  const { brandId } = await params;
  const channels = listChannelViews(brandId);

  return (
    <WorkspacePage
      model={{
        kicker: "Channels",
        title: "Acquisition and lifecycle channel health",
        description: getAcquisitionNarrative(brandId),
        actions: [
          {
            label: "View Campaigns",
            href: `/brands/${brandId}/campaigns`
          },
          {
            label: "Open Reports",
            href: `/brands/${brandId}/reports`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Tracked channels",
            value: `${channels.length}`,
            note: "Acquisition and lifecycle surfaces currently represented in the workspace."
          },
          {
            label: "Investigating",
            value: `${channels.filter((channel) => channel.state === "investigating").length}`,
            note: "Channels with an active follow-up because performance or quality needs a closer look."
          },
          {
            label: "Fragile surfaces",
            value: `${channels.filter((channel) => channel.health === "fragile").length}`,
            note: "Sources where the team should expect a shorter response window."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Channel Board"
            title="Where the team should spend acquisition attention"
            description="These channel surfaces are useful only if they help the team decide where to investigate, refresh, or protect momentum."
            items={channels.map((channel) => ({
              eyebrow: `${channel.provider} · ${channel.state}`,
              title: channel.label,
              description: `${channel.summary} ${channel.nextMove}`,
              value: channel.efficiency,
              note: channel.spendShare,
              tags: [
                { label: channel.health, tone: channelTone(channel.health) },
                { label: channel.state, tone: stateTone(channel.state) },
                { label: channel.spendShare, tone: "info" }
              ],
              actions: [
                {
                  label: "View campaigns",
                  href: channel.campaignsHref,
                  tone: "secondary"
                },
                {
                  label: "Sync source",
                  href: channel.syncHref,
                  method: "post",
                  tone: "secondary",
                  fields: [
                    {
                      name: "next",
                      value: `/brands/${brandId}/channels`
                    }
                  ]
                },
                ...(channel.state !== "investigating"
                  ? [
                      {
                        label: "Investigate drop",
                        href: `/api/brands/${brandId}/channels/${channel.id}/investigate`,
                        method: "post" as const,
                        tone: "primary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/channels`
                          }
                        ]
                      }
                    ]
                  : [])
              ]
            }))}
            tone="warm"
          />
        </div>

        <aside className="editorial-rail">
          <section className="editorial-section" data-tone="ink">
            <p className="editorial-section-label">Efficiency Breakdown</p>
            <h2 className="editorial-section-title">Current channel pressure</h2>
            <div className="editorial-timeline">
              {channels.map((channel) => (
                <article key={channel.id} className="editorial-timeline-item">
                  <p className="editorial-timeline-label">{channel.label}</p>
                  <h3 className="editorial-timeline-title">{channel.efficiency}</h3>
                  <p className="editorial-timeline-copy">{channel.trafficQuality}</p>
                </article>
              ))}
            </div>
          </section>

          <EditorialListPanel
            label="Playbook"
            title="How to use channel diagnostics"
            description="The channel layer should help the team act, not just admire performance charts."
            items={[
              {
                eyebrow: "Prevention",
                title: "Protect the winner before it weakens",
                description:
                  "Healthy channels still need fresh creative or sharper landing-page support before fatigue and conversion softness appear.",
                tags: [{ label: "Prevention", tone: "positive" }]
              },
              {
                eyebrow: "Escalate quickly",
                title: "Treat fragile channels as workflow triggers",
                description:
                  "When a source is marked fragile, the next move should point to campaigns, products, or content immediately.",
                tags: [{ label: "Escalate quickly", tone: "danger" }]
              },
              {
                eyebrow: "Retention discipline",
                title: "Let lifecycle act like a revenue channel",
                description:
                  "Lifecycle should be reviewed with the same seriousness as paid channels because weak repeat-purchase messaging creates avoidable CAC pressure.",
                tags: [{ label: "Retention discipline", tone: "info" }]
              }
            ]}
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}

function channelTone(health: string): PresentationTone {
  if (health === "scaling") {
    return "positive";
  }

  if (health === "fragile") {
    return "danger";
  }

  return "warning";
}

function stateTone(state: string): PresentationTone {
  return state === "investigating" ? "warning" : "neutral";
}
