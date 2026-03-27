import {
  EditorialListPanel,
  type PresentationTone
} from "../../../../components/data-presentation";
import { WorkspacePage } from "../../../../components/workspace-page";
import {
  getAcquisitionNarrative,
  listCampaignViewsAsync
} from "../../../../lib/acquisition-data";

type CampaignsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

export default async function CampaignsPage({ params }: CampaignsPageProps) {
  const { brandId } = await params;
  const campaigns = await listCampaignViewsAsync(brandId);

  return (
    <WorkspacePage
      model={{
        kicker: "Campaigns",
        title: "Campaign performance tied to content actions",
        description: getAcquisitionNarrative(brandId),
        actions: [
          {
            label: "Open Channels",
            href: `/brands/${brandId}/channels`
          },
          {
            label: "Open Content Studio",
            href: `/brands/${brandId}/content`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Tracked campaigns",
            value: `${campaigns.length}`,
            note: "Current campaigns mapped into the operating workflow."
          },
          {
            label: "Flagged issues",
            value: `${campaigns.filter((campaign) => campaign.state === "flagged").length}`,
            note: "Campaigns that need an operator or marketer to step in."
          },
          {
            label: "Content linked",
            value: `${campaigns.filter((campaign) => campaign.linkedDraftId).length}`,
            note: "Campaigns already translated into working creative assets."
          }
        ]
      }}
    >
      <section className="editorial-layout">
        <div className="editorial-main">
          <EditorialListPanel
            label="Campaign Queue"
            title="Where campaign performance should trigger execution"
            description="Campaigns should either validate that the team is pushing the right message or trigger the next content move when they are slipping."
            items={campaigns.map((campaign) => ({
              eyebrow: `${campaign.channelLabel} · ${campaign.owner}`,
              title: campaign.name,
              description: `${campaign.summary} ${campaign.recommendation}`,
              value: campaign.efficiency,
              note: campaign.outputChannel,
              tags: [
                { label: campaign.health, tone: healthTone(campaign.health) },
                { label: campaign.state, tone: campaignStateTone(campaign.state) },
                { label: campaign.outputChannel, tone: "neutral" }
              ],
              actions: [
                {
                  label: "View product",
                  href: campaign.productHref,
                  tone: "secondary"
                },
                ...(campaign.linkedDraftHref
                  ? [
                      {
                        label: "Open linked draft",
                        href: campaign.linkedDraftHref,
                        tone: "primary" as const
                      }
                    ]
                  : [
                      {
                        label: "Generate content",
                        href: `/api/brands/${brandId}/campaigns/${campaign.id}/generate-draft`,
                        method: "post" as const,
                        tone: "primary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/campaigns`
                          }
                        ]
                      }
                    ]),
                ...(campaign.state !== "flagged"
                  ? [
                      {
                        label: "Flag issue",
                        href: `/api/brands/${brandId}/campaigns/${campaign.id}/flag`,
                        method: "post" as const,
                        tone: "secondary" as const,
                        fields: [
                          {
                            name: "next",
                            value: `/brands/${brandId}/campaigns`
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
            <p className="editorial-section-label">Active Monitoring</p>
            <h2 className="editorial-section-title">Current campaign pressure</h2>
            <div className="editorial-timeline">
              {campaigns.slice(0, 4).map((campaign) => (
                <article key={campaign.id} className="editorial-timeline-item">
                  <p className="editorial-timeline-label">{campaign.channelLabel}</p>
                  <h3 className="editorial-timeline-title">{campaign.name}</h3>
                  <p className="editorial-timeline-copy">
                    {campaign.health} • {campaign.efficiency}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <EditorialListPanel
            label="Discipline"
            title="How campaigns should drive the operating loop"
            description="The point of campaign monitoring is to shorten the distance between signal and action."
            items={[
              {
                eyebrow: "Protect momentum",
                title: "Scale what is working before it gets thin",
                description:
                  "A scaling campaign should trigger fresh assets while efficiency is still healthy, not only after creative has already flattened.",
                tags: [{ label: "Protect momentum", tone: "positive" }]
              },
              {
                eyebrow: "Fast escalation",
                title: "Flag weak campaigns early",
                description:
                  "A needs-attention campaign should create an obvious path into content, product messaging, or landing-page work.",
                tags: [{ label: "Fast escalation", tone: "danger" }]
              },
              {
                eyebrow: "Clear ownership",
                title: "Tie every campaign to a product and an output",
                description:
                  "If the team cannot tell which product a campaign supports and what asset should be created next, the workflow is still too fuzzy.",
                tags: [{ label: "Clear ownership", tone: "info" }]
              }
            ]}
          />
        </aside>
      </section>
    </WorkspacePage>
  );
}

function healthTone(health: string): PresentationTone {
  if (health === "scaling") {
    return "positive";
  }

  if (health === "needs_attention") {
    return "danger";
  }

  return "warning";
}

function campaignStateTone(state: string): PresentationTone {
  if (state === "draft_linked") {
    return "positive";
  }

  if (state === "flagged") {
    return "danger";
  }

  return "neutral";
}
