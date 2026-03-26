import "server-only";

import {
  createDraftFromProduct,
  getBrandDraft,
  type WorkflowDraftView
} from "./growth-workflow-data";
import {
  getCampaignOverride,
  getChannelOverride,
  updateCampaignOverride,
  updateChannelOverride
} from "./local-persistence";
import { getWorkspaceBrand } from "./workspace-data";

type ChannelHealth = "scaling" | "watch" | "fragile";
type CampaignHealth = "scaling" | "watch" | "needs_attention";

type ChannelSeed = {
  id: string;
  label: string;
  provider: "meta" | "ga4" | "klaviyo";
  health: ChannelHealth;
  spendShare: string;
  efficiency: string;
  trafficQuality: string;
  summary: string;
  nextMove: string;
};

type CampaignSeed = {
  id: string;
  channelId: string;
  name: string;
  objective: string;
  health: CampaignHealth;
  productId: string;
  owner: string;
  spend: string;
  revenue: string;
  efficiency: string;
  summary: string;
  creativeAngle: string;
  recommendation: string;
  outputChannel: string;
};

type AcquisitionSeed = {
  narrative: string;
  channels: ChannelSeed[];
  campaigns: CampaignSeed[];
};

export type ChannelView = ChannelSeed & {
  state: "tracking" | "investigating";
  campaignsHref: string;
  syncHref: string;
  campaignCount: number;
};

export type CampaignView = CampaignSeed & {
  state: "new" | "flagged" | "draft_linked";
  channelLabel: string;
  channelHref: string;
  productHref: string;
  linkedDraftId?: string;
  linkedDraftHref?: string;
};

function buildBrandPath(brandId: string, path: string) {
  return `/brands/${brandId}${path}`;
}

function channelRank(channel: ChannelView) {
  if (channel.state === "investigating") {
    return 0;
  }

  if (channel.health === "fragile") {
    return 1;
  }

  if (channel.health === "watch") {
    return 2;
  }

  return 3;
}

function campaignRank(campaign: CampaignView) {
  if (campaign.state === "flagged") {
    return 0;
  }

  if (campaign.health === "needs_attention") {
    return 1;
  }

  if (campaign.state === "draft_linked") {
    return 2;
  }

  if (campaign.health === "watch") {
    return 3;
  }

  return 4;
}

const acquisitionSeeds: Record<string, AcquisitionSeed> = {
  demo: {
    narrative:
      "Luna Skin should keep Meta efficient around the reset serum, use GA4 to pressure-test barrier cream drop-off, and let Klaviyo reinforce repeat-purchase behavior instead of operating as a disconnected retention layer.",
    channels: [
      {
        id: "channel-meta",
        label: "Meta Paid Social",
        provider: "meta",
        health: "scaling",
        spendShare: "58% of spend",
        efficiency: "3.4x blended ROAS",
        trafficQuality: "High-intent clicks holding",
        summary:
          "Meta is still the main volume driver, and reset-serum creative is carrying most of the efficiency.",
        nextMove:
          "Refresh creative before fatigue lands, but do not broaden targeting until the next hook set is live."
      },
      {
        id: "channel-ga4",
        label: "Site Traffic / GA4",
        provider: "ga4",
        health: "fragile",
        spendShare: "41k weekly sessions",
        efficiency: "2.9% site conversion",
        trafficQuality: "Barrier cream PDP is leaking intent",
        summary:
          "Traffic quality is good enough, but the barrier cream path is under-converting relative to current paid interest.",
        nextMove:
          "Investigate the PDP drop quickly and align the next campaign brief around trust and objection handling."
      },
      {
        id: "channel-klaviyo",
        label: "Klaviyo Lifecycle",
        provider: "klaviyo",
        health: "watch",
        spendShare: "18% of attributed revenue",
        efficiency: "24% repeat-purchase click share",
        trafficQuality: "Healthy post-purchase engagement",
        summary:
          "Lifecycle is supporting serum repeat behavior, but the replenishment narrative is still underdeveloped.",
        nextMove:
          "Tie the replenishment sequence more tightly to routine consistency and visible payoff."
      }
    ],
    campaigns: [
      {
        id: "camp-reset-serum-scale",
        channelId: "channel-meta",
        name: "Reset Serum UGC Scale Pack",
        objective: "Scale efficient creator-led acquisition",
        health: "scaling",
        productId: "prod-reset-serum",
        owner: "Aly Khan",
        spend: "$8.2k",
        revenue: "$28.1k",
        efficiency: "3.4x ROAS",
        summary:
          "The campaign is still efficient, but the best-performing overnight-recovery hooks are starting to narrow.",
        creativeAngle: "Overnight recovery proof",
        recommendation:
          "Generate two to three fresh creator angles before fatigue flattens the current paid climb.",
        outputChannel: "Paid Social"
      },
      {
        id: "camp-barrier-pdp-recovery",
        channelId: "channel-ga4",
        name: "Barrier Cream PDP Recovery",
        objective: "Recover conversion on high-intent traffic",
        health: "needs_attention",
        productId: "prod-barrier-cream",
        owner: "Jon Park",
        spend: "$3.9k assisted",
        revenue: "$7.6k assisted",
        efficiency: "2.1% PDP conversion",
        summary:
          "Traffic is there, but the story is not landing fast enough for sensitive-skin buyers.",
        creativeAngle: "Sensitive-skin trust proof",
        recommendation:
          "Flag this as a live issue and generate content that mirrors the messaging repair the PDP needs.",
        outputChannel: "Landing page support"
      },
      {
        id: "camp-serum-replenishment",
        channelId: "channel-klaviyo",
        name: "Serum Replenishment Flow",
        objective: "Lift second-order behavior",
        health: "watch",
        productId: "prod-reset-serum",
        owner: "Jon Park",
        spend: "$0 media",
        revenue: "$6.4k influenced",
        efficiency: "12.8% click-to-order",
        summary:
          "The flow is contributing, but the messaging still feels operational rather than habit-forming.",
        creativeAngle: "Routine consistency reminder",
        recommendation:
          "Turn the serum into a routine-consistency story instead of a plain replenishment nudge.",
        outputChannel: "Lifecycle creative"
      }
    ]
  },
  solstice: {
    narrative:
      "Solstice Well should protect Meta efficiency around the sleep stack, use GA4 to catch product-page softness early, and let lifecycle content reinforce repeat night-routine behavior before discounting becomes the default lever.",
    channels: [
      {
        id: "channel-meta",
        label: "Meta Paid Social",
        provider: "meta",
        health: "watch",
        spendShare: "63% of spend",
        efficiency: "2.8x blended ROAS",
        trafficQuality: "Sleep stack is carrying quality",
        summary:
          "Meta is still the primary acquisition engine, but the team needs fresher bundle stories to keep efficiency from softening.",
        nextMove:
          "Refresh routine-simplicity creative before leaning harder on offers."
      },
      {
        id: "channel-ga4",
        label: "Site Traffic / GA4",
        provider: "ga4",
        health: "scaling",
        spendShare: "34k weekly sessions",
        efficiency: "3.3% site conversion",
        trafficQuality: "Healthy bundle engagement",
        summary:
          "Traffic quality is strong around the sleep stack, and the bundle story is holding across product pages.",
        nextMove:
          "Use this stability to pressure-test new magnesium-gummies hooks without disrupting the hero bundle."
      },
      {
        id: "channel-klaviyo",
        label: "Klaviyo Lifecycle",
        provider: "klaviyo",
        health: "fragile",
        spendShare: "14% of attributed revenue",
        efficiency: "8.1% click-to-order",
        trafficQuality: "Repeat-purchase pacing is inconsistent",
        summary:
          "Lifecycle is present, but the repeat-purchase story is not yet strong enough to support healthy retention momentum.",
        nextMove:
          "Investigate the weak segment pacing and bring lifecycle content closer to the best-performing routine language."
      }
    ],
    campaigns: [
      {
        id: "camp-sleep-stack-scale",
        channelId: "channel-meta",
        name: "Sleep Stack Routine Scale",
        objective: "Scale the hero bundle efficiently",
        health: "watch",
        productId: "prod-sleep-stack",
        owner: "Priya Rao",
        spend: "$7.6k",
        revenue: "$21.4k",
        efficiency: "2.8x ROAS",
        summary:
          "The campaign is still working, but the current routine-consistency angle needs new executions.",
        creativeAngle: "Routine simplicity",
        recommendation:
          "Generate a fresh creator package before the team has to lean on discounts for the same volume.",
        outputChannel: "Instagram Reels"
      },
      {
        id: "camp-magnesium-hook-test",
        channelId: "channel-ga4",
        name: "Magnesium Gummies Hook Test",
        objective: "Expand differentiated top-of-funnel hooks",
        health: "scaling",
        productId: "prod-magnesium-gummies",
        owner: "Priya Rao",
        spend: "$2.4k",
        revenue: "$7.9k",
        efficiency: "3.1x ROAS",
        summary:
          "Taste-first hooks are giving the gummies a more distinct entry point than the rest of the category.",
        creativeAngle: "Taste-first routine payoff",
        recommendation:
          "Create a stronger draft pack so the hook can be repeated without turning gimmicky.",
        outputChannel: "Short-form video"
      },
      {
        id: "camp-lifecycle-recovery",
        channelId: "channel-klaviyo",
        name: "Night Routine Lifecycle Recovery",
        objective: "Stabilize repeat-purchase pacing",
        health: "needs_attention",
        productId: "prod-sleep-stack",
        owner: "Diego Chen",
        spend: "$0 media",
        revenue: "$4.1k influenced",
        efficiency: "8.1% click-to-order",
        summary:
          "The flow is too functional and is not reinforcing the emotional payoff of keeping the routine going.",
        creativeAngle: "Habit-building retention story",
        recommendation:
          "Flag the issue and spin up a more persuasive lifecycle content angle tied to consistency.",
        outputChannel: "Lifecycle creative"
      }
    ]
  }
};

function getDefaultAcquisitionSeed(brandId: string): AcquisitionSeed {
  const brandName = getWorkspaceBrand(brandId)?.name ?? "This brand";

  return {
    narrative:
      `${brandName} has room for channel and campaign intelligence, but the acquisition layer still needs brand-specific seeding.`,
    channels: [
      {
        id: "channel-primary",
        label: "Primary acquisition channel",
        provider: "meta",
        health: "watch",
        spendShare: "Waiting for spend data",
        efficiency: "Waiting for performance data",
        trafficQuality: "Waiting for traffic-quality data",
        summary:
          "Seed the first acquisition channel once the marketing integrations are connected.",
        nextMove:
          "Connect Meta, GA4, or Klaviyo so the team can start tracking channel-specific decisions."
      }
    ],
    campaigns: [
      {
        id: "camp-first-priority",
        channelId: "channel-primary",
        name: `${brandName} first campaign`,
        objective: "Define the first acquisition operating loop",
        health: "watch",
        productId: "prod-priority-item",
        owner: "Workspace owner",
        spend: "Waiting for campaign data",
        revenue: "Waiting for campaign data",
        efficiency: "Waiting for campaign data",
        summary:
          "This starter campaign exists so the page has structure before real campaign sync is wired up.",
        creativeAngle: "Hero product clarity",
        recommendation:
          "Use the first real campaign to connect products, channels, and content generation into one workflow.",
        outputChannel: "Short-form video"
      }
    ]
  };
}

function getAcquisitionSeed(brandId: string) {
  return acquisitionSeeds[brandId] ?? getDefaultAcquisitionSeed(brandId);
}

export function getAcquisitionNarrative(brandId: string) {
  return getAcquisitionSeed(brandId).narrative;
}

export function listChannelViews(brandId: string): ChannelView[] {
  const seed = getAcquisitionSeed(brandId);

  return seed.channels
    .map((channel) => {
      const override = getChannelOverride(brandId, channel.id);

      return {
        ...channel,
        state: override?.state ?? "tracking",
        campaignsHref: buildBrandPath(brandId, "/campaigns"),
        syncHref: `/api/brands/${brandId}/integrations/${channel.provider}/sync`,
        campaignCount: seed.campaigns.filter((campaign) => campaign.channelId === channel.id)
          .length
      } satisfies ChannelView;
    })
    .sort((left, right) => channelRank(left) - channelRank(right));
}

export function listCampaignViews(brandId: string): CampaignView[] {
  const seed = getAcquisitionSeed(brandId);
  const channelMap = new Map(seed.channels.map((channel) => [channel.id, channel] as const));

  return seed.campaigns
    .map((campaign) => {
      const override = getCampaignOverride(brandId, campaign.id);
      const channel = channelMap.get(campaign.channelId);

      return {
        ...campaign,
        state: override?.state ?? "new",
        channelLabel: channel?.label ?? "Acquisition channel",
        channelHref: buildBrandPath(brandId, "/channels"),
        productHref: buildBrandPath(brandId, `/products/${campaign.productId}`),
        linkedDraftId: override?.linkedDraftId,
        linkedDraftHref: override?.linkedDraftId
          ? buildBrandPath(brandId, `/content/drafts/${override.linkedDraftId}`)
          : undefined
      } satisfies CampaignView;
    })
    .sort((left, right) => campaignRank(left) - campaignRank(right));
}

export function setChannelState(
  brandId: string,
  channelId: string,
  state: "tracking" | "investigating"
) {
  updateChannelOverride(brandId, channelId, {
    state,
    updatedAt: new Date().toISOString()
  });
}

export function setCampaignState(
  brandId: string,
  campaignId: string,
  state: "new" | "flagged" | "draft_linked"
) {
  const current = getCampaignOverride(brandId, campaignId);

  updateCampaignOverride(brandId, campaignId, {
    state,
    updatedAt: new Date().toISOString(),
    linkedDraftId: current?.linkedDraftId
  });
}

export function createDraftFromCampaign(
  brandId: string,
  campaignId: string
): WorkflowDraftView | null {
  const campaign = listCampaignViews(brandId).find((item) => item.id === campaignId);

  if (!campaign) {
    return null;
  }

  if (campaign.linkedDraftId) {
    const existing = getBrandDraft(brandId, campaign.linkedDraftId);

    if (existing) {
      return existing;
    }
  }

  const draft = createDraftFromProduct(brandId, campaign.productId, {
    title: `${campaign.name} content pack`,
    channel: campaign.outputChannel,
    angle: campaign.creativeAngle,
    hook: `${campaign.creativeAngle}: give the team a sharper opening line before this campaign softens.`,
    caption: `${campaign.recommendation} Keep the message anchored in ${campaign.summary.toLowerCase()}`,
    script:
      `${campaign.summary} Build the draft around ${campaign.creativeAngle.toLowerCase()}, then land on the operating move: ${campaign.recommendation}`
  });

  if (!draft) {
    return null;
  }

  updateCampaignOverride(brandId, campaignId, {
    state: "draft_linked",
    updatedAt: new Date().toISOString(),
    linkedDraftId: draft.id
  });

  return getBrandDraft(brandId, draft.id);
}
