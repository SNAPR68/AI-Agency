import "server-only";

import {
  createDraftFromProductAsync,
  createDraftFromProduct,
  getBrandDraftAsync,
  getBrandDraft,
  type WorkflowDraftView
} from "./growth-workflow-data";
import {
  getCompetitorOverride,
  getTrendOverride,
  updateCompetitorOverride,
  updateTrendOverride
} from "./local-persistence";
import {
  listSupabaseEntityOverrides,
  setSupabaseEntityOverride
} from "./supabase-workflow-data";
import { shouldEnforceSupabaseHostedAccess } from "./supabase-env";
import { getWorkspaceBrand } from "./workspace-data";

type TrendStatus = "emerging" | "hot" | "crowded";
type CompetitorUrgency = "watch" | "respond";

type TrendSeed = {
  id: string;
  title: string;
  platform: string;
  status: TrendStatus;
  fitScore: number;
  urgencyScore: number;
  saturation: "low" | "medium" | "high";
  productId: string;
  evidence: string;
  opportunity: string;
  responseAngle: string;
  recommendedFormat: string;
};

type CompetitorSeed = {
  id: string;
  competitorName: string;
  title: string;
  category: "creative" | "offer" | "positioning";
  urgency: CompetitorUrgency;
  productId: string;
  observation: string;
  implication: string;
  responseAngle: string;
  lastSeenAt: string;
};

type MarketSeed = {
  narrative: string;
  trends: TrendSeed[];
  competitors: CompetitorSeed[];
};

export type TrendSignalView = TrendSeed & {
  state: "new" | "saved" | "acted";
  productHref: string;
  linkedDraftId?: string;
  linkedDraftHref?: string;
};

export type CompetitorObservationView = CompetitorSeed & {
  state: "new" | "saved" | "acted";
  productHref: string;
  linkedDraftId?: string;
  linkedDraftHref?: string;
  lastSeenLabel: string;
};

function buildBrandPath(brandId: string, path: string) {
  return `/brands/${brandId}${path}`;
}

function formatTimestampLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

const marketSeeds: Record<string, MarketSeed> = {
  demo: {
    narrative:
      "Luna Skin should move fast on routine-led proof content, react to barrier-first creative in the category, and avoid crowded aesthetic trends that are no longer differentiated enough to matter.",
    trends: [
      {
        id: "trend-night-reset-diaries",
        title: "Night-reset routine diaries",
        platform: "TikTok",
        status: "hot",
        fitScore: 92,
        urgencyScore: 88,
        saturation: "medium",
        productId: "prod-reset-serum",
        evidence:
          "Creators showing a three-night progression arc are outperforming polished one-shot testimonials across skincare feeds.",
        opportunity:
          "Luna Skin can adapt this without chasing trend aesthetics by anchoring the format in simple before-bed proof.",
        responseAngle:
          "Show the serum as the quiet routine step that changes the next morning, using diary pacing instead of hard-sell scripting.",
        recommendedFormat: "UGC diary Reel"
      },
      {
        id: "trend-barrier-proof-cards",
        title: "Barrier-proof comparison cards",
        platform: "Instagram",
        status: "emerging",
        fitScore: 84,
        urgencyScore: 72,
        saturation: "low",
        productId: "prod-barrier-cream",
        evidence:
          "Sensitive-skin accounts are leaning into clean side-by-side proof cards and simple ingredient restraint messaging.",
        opportunity:
          "This is a strong fit for the barrier cream because the PDP already needs clearer trust and objection handling.",
        responseAngle:
          "Translate barrier support into an easy compare-and-explain carousel that feels educational instead of clinical.",
        recommendedFormat: "Comparison carousel"
      },
      {
        id: "trend-shelfie-overload",
        title: "Shelfie aesthetic montages",
        platform: "TikTok",
        status: "crowded",
        fitScore: 46,
        urgencyScore: 31,
        saturation: "high",
        productId: "prod-cleanse-oil",
        evidence:
          "The format is still high-volume, but it is crowded and feels less differentiated for commerce-focused skincare brands right now.",
        opportunity:
          "Treat this as a watch signal, not a rush signal, unless the brand has a stronger product story to attach.",
        responseAngle:
          "If used at all, pair it with regimen utility instead of aesthetic-only shots.",
        recommendedFormat: "Routine montage"
      }
    ],
    competitors: [
      {
        id: "comp-glow-theory-barrier",
        competitorName: "Glow Theory",
        title: "Barrier-first comparison carousel is scaling",
        category: "creative",
        urgency: "respond",
        productId: "prod-barrier-cream",
        observation:
          "Glow Theory is winning attention with clean comparison slides that simplify who their barrier product is for and what it replaces.",
        implication:
          "This overlaps directly with Luna Skin's barrier cream problem, which means the category already has a proven creative frame.",
        responseAngle:
          "Answer with clearer sensitive-skin trust language and a stronger educational comparison before the next paid push.",
        lastSeenAt: "2026-03-25T06:35:00Z"
      },
      {
        id: "comp-nitelab-serum",
        competitorName: "NiteLab",
        title: "Founder-led serum ritual is landing",
        category: "positioning",
        urgency: "watch",
        productId: "prod-reset-serum",
        observation:
          "NiteLab is using founder-led bedtime rituals to make its hero serum feel more like a habit than a product claim.",
        implication:
          "This validates the appetite for ritual framing but does not require direct imitation because Luna already has product momentum.",
        responseAngle:
          "Keep the angle, but make Luna's version more recovery-proof and less founder-centric.",
        lastSeenAt: "2026-03-24T18:20:00Z"
      }
    ]
  },
  solstice: {
    narrative:
      "Solstice Well should jump on routine-consistency creative, borrow what is working from category sleep bundles without sounding interchangeable, and stay alert to offer-heavy competitor pressure.",
    trends: [
      {
        id: "trend-night-routine-stacks",
        title: "Night-routine stack explainers",
        platform: "Instagram",
        status: "hot",
        fitScore: 91,
        urgencyScore: 86,
        saturation: "medium",
        productId: "prod-sleep-stack",
        evidence:
          "Routine explainers that reduce supplement overwhelm are earning strong saves and comments in wellness content right now.",
        opportunity:
          "The sleep stack can use this format to defend paid quality by making the bundle feel simple instead of like a discount pack.",
        responseAngle:
          "Frame the bundle as the easiest routine to repeat, not the cheapest way to buy multiple products.",
        recommendedFormat: "Routine explainer Reel"
      },
      {
        id: "trend-taste-first-gummies",
        title: "Taste-first supplement reactions",
        platform: "TikTok",
        status: "emerging",
        fitScore: 79,
        urgencyScore: 67,
        saturation: "medium",
        productId: "prod-magnesium-gummies",
        evidence:
          "Short taste-reaction clips are helping gummies stand out in a category that is often too clinical.",
        opportunity:
          "This is a useful supporting angle for magnesium gummies, especially if Solstice wants more differentiated top-of-funnel hooks.",
        responseAngle:
          "Keep the taste hook, then pivot quickly into routine consistency and why the product earns a repeat place.",
        recommendedFormat: "Taste reaction clip"
      }
    ],
    competitors: [
      {
        id: "comp-restwell-bundle",
        competitorName: "RestWell",
        title: "Sleep bundle is leaning on simplicity over discounting",
        category: "positioning",
        urgency: "respond",
        productId: "prod-sleep-stack",
        observation:
          "RestWell is reframing its bundle as a routine simplifier and using that to justify premium pricing without constant promo pressure.",
        implication:
          "That matches where Solstice needs to go if it wants to protect paid efficiency and margin at the same time.",
        responseAngle:
          "Answer by reinforcing the repeatable-routine story with clearer habit-building language.",
        lastSeenAt: "2026-03-25T07:05:00Z"
      },
      {
        id: "comp-calmcore-offer",
        competitorName: "CalmCore",
        title: "Aggressive discount stack is pulling attention",
        category: "offer",
        urgency: "watch",
        productId: "prod-magnesium-gummies",
        observation:
          "CalmCore is using heavier discount language to drive quick clicks, but the creative feels less premium and more tactical.",
        implication:
          "This matters if Solstice sees paid softness, but it should not respond by racing to the bottom on offers.",
        responseAngle:
          "Answer with better value framing and routine utility rather than matching the discount posture.",
        lastSeenAt: "2026-03-24T17:10:00Z"
      }
    ]
  }
};

function getDefaultMarketSeed(brandId: string): MarketSeed {
  const brandName = getWorkspaceBrand(brandId)?.name ?? "This brand";

  return {
    narrative:
      `${brandName} has room for market-intelligence workflows, but trend and competitor signals still need brand-specific seeding.`,
    trends: [
      {
        id: "trend-default-signal",
        title: "Category format worth testing",
        platform: "Instagram",
        status: "emerging",
        fitScore: 72,
        urgencyScore: 60,
        saturation: "medium",
        productId: "prod-priority-item",
        evidence:
          "The category is producing repeatable short-form formats that could be adapted into brand-safe content.",
        opportunity:
          "Use this as a placeholder signal until real trend ingestion is wired up.",
        responseAngle:
          "Translate the format into a product-led story that stays tied to the brand's core commercial priority.",
        recommendedFormat: "Short-form video"
      }
    ],
    competitors: [
      {
        id: "comp-default-watch",
        competitorName: "Category Competitor",
        title: "Competitor message worth tracking",
        category: "positioning",
        urgency: "watch",
        productId: "prod-priority-item",
        observation:
          "A competitor message pattern exists here, but it still needs brand-specific context.",
        implication:
          "Once real market data is connected, this page should become a stronger source of response planning.",
        responseAngle:
          "Use the observation to create a sharper counter-position tied to the brand's hero product.",
        lastSeenAt: "2026-03-25T10:00:00Z"
      }
    ]
  };
}

function getMarketSeed(brandId: string) {
  return marketSeeds[brandId] ?? getDefaultMarketSeed(brandId);
}

const trendOverrideType = "override_trend";
const competitorOverrideType = "override_competitor";

export function getMarketNarrative(brandId: string) {
  return getMarketSeed(brandId).narrative;
}

export function listTrendSignals(brandId: string): TrendSignalView[] {
  return getMarketSeed(brandId).trends.map((trend) => {
    const override = getTrendOverride(brandId, trend.id);

    return {
      ...trend,
      state: override?.state ?? "new",
      productHref: buildBrandPath(brandId, `/products/${trend.productId}`),
      linkedDraftId: override?.linkedDraftId,
      linkedDraftHref: override?.linkedDraftId
        ? buildBrandPath(brandId, `/content/drafts/${override.linkedDraftId}`)
        : undefined
    };
  });
}

export async function listTrendSignalsAsync(brandId: string): Promise<TrendSignalView[]> {
  const hostedOverrides = shouldEnforceSupabaseHostedAccess()
    ? await listSupabaseEntityOverrides(brandId, trendOverrideType)
    : null;

  return getMarketSeed(brandId).trends.map((trend) => {
    const override = shouldEnforceSupabaseHostedAccess()
      ? hostedOverrides?.[trend.id]
      : getTrendOverride(brandId, trend.id);

    return {
      ...trend,
      state:
        override?.state === "saved" || override?.state === "acted"
          ? override.state
          : "new",
      productHref: buildBrandPath(brandId, `/products/${trend.productId}`),
      linkedDraftId: override?.linkedDraftId,
      linkedDraftHref: override?.linkedDraftId
        ? buildBrandPath(brandId, `/content/drafts/${override.linkedDraftId}`)
        : undefined
    };
  });
}

export function listCompetitorObservations(brandId: string): CompetitorObservationView[] {
  return getMarketSeed(brandId).competitors.map((observation) => {
    const override = getCompetitorOverride(brandId, observation.id);

    return {
      ...observation,
      state: override?.state ?? "new",
      productHref: buildBrandPath(brandId, `/products/${observation.productId}`),
      linkedDraftId: override?.linkedDraftId,
      linkedDraftHref: override?.linkedDraftId
        ? buildBrandPath(brandId, `/content/drafts/${override.linkedDraftId}`)
        : undefined,
      lastSeenLabel: formatTimestampLabel(observation.lastSeenAt)
    };
  });
}

export async function listCompetitorObservationsAsync(
  brandId: string
): Promise<CompetitorObservationView[]> {
  const hostedOverrides = shouldEnforceSupabaseHostedAccess()
    ? await listSupabaseEntityOverrides(brandId, competitorOverrideType)
    : null;

  return getMarketSeed(brandId).competitors.map((observation) => {
    const override = shouldEnforceSupabaseHostedAccess()
      ? hostedOverrides?.[observation.id]
      : getCompetitorOverride(brandId, observation.id);

    return {
      ...observation,
      state:
        override?.state === "saved" || override?.state === "acted"
          ? override.state
          : "new",
      productHref: buildBrandPath(brandId, `/products/${observation.productId}`),
      linkedDraftId: override?.linkedDraftId,
      linkedDraftHref: override?.linkedDraftId
        ? buildBrandPath(brandId, `/content/drafts/${override.linkedDraftId}`)
        : undefined,
      lastSeenLabel: formatTimestampLabel(observation.lastSeenAt)
    };
  });
}

export function setTrendState(
  brandId: string,
  trendId: string,
  state: "new" | "saved" | "acted"
) {
  const current = getTrendOverride(brandId, trendId);

  updateTrendOverride(brandId, trendId, {
    state,
    updatedAt: new Date().toISOString(),
    linkedDraftId: current?.linkedDraftId
  });
}

export async function setTrendStateAsync(
  brandId: string,
  trendId: string,
  state: "new" | "saved" | "acted"
) {
  if (shouldEnforceSupabaseHostedAccess()) {
    const trend = getMarketSeed(brandId).trends.find((item) => item.id === trendId);
    const current = (await listSupabaseEntityOverrides(brandId, trendOverrideType))?.[trendId];

    if (!trend) {
      return null;
    }

    return setSupabaseEntityOverride(brandId, {
      overrideType: trendOverrideType,
      appItemId: trendId,
      title: trend.title,
      state,
      linkedDraftId: current?.linkedDraftId,
      metadata: {
        productId: trend.productId,
        platform: trend.platform
      }
    });
  }

  setTrendState(brandId, trendId, state);
  return getTrendOverride(brandId, trendId);
}

export function setCompetitorState(
  brandId: string,
  competitorId: string,
  state: "new" | "saved" | "acted"
) {
  const current = getCompetitorOverride(brandId, competitorId);

  updateCompetitorOverride(brandId, competitorId, {
    state,
    updatedAt: new Date().toISOString(),
    linkedDraftId: current?.linkedDraftId
  });
}

export async function setCompetitorStateAsync(
  brandId: string,
  competitorId: string,
  state: "new" | "saved" | "acted"
) {
  if (shouldEnforceSupabaseHostedAccess()) {
    const observation = getMarketSeed(brandId).competitors.find((item) => item.id === competitorId);
    const current =
      (await listSupabaseEntityOverrides(brandId, competitorOverrideType))?.[competitorId];

    if (!observation) {
      return null;
    }

    return setSupabaseEntityOverride(brandId, {
      overrideType: competitorOverrideType,
      appItemId: competitorId,
      title: observation.title,
      state,
      linkedDraftId: current?.linkedDraftId,
      metadata: {
        competitorName: observation.competitorName,
        productId: observation.productId
      }
    });
  }

  setCompetitorState(brandId, competitorId, state);
  return getCompetitorOverride(brandId, competitorId);
}

export function createDraftFromTrend(
  brandId: string,
  trendId: string
): WorkflowDraftView | null {
  const trend = listTrendSignals(brandId).find((item) => item.id === trendId);

  if (!trend) {
    return null;
  }

  if (trend.linkedDraftId) {
    const existing = getBrandDraft(brandId, trend.linkedDraftId);

    if (existing) {
      return existing;
    }
  }

  const draft = createDraftFromProduct(brandId, trend.productId, {
    title: `${trend.title} response draft`,
    channel: trend.recommendedFormat,
    angle: trend.responseAngle,
    hook: `Take the ${trend.title.toLowerCase()} signal and translate it into a stronger product story.`,
    caption: `${trend.opportunity} ${trend.evidence}`,
    script: `Open with the format or behavior that is working on ${trend.platform}, adapt it into a brand-safe execution, and land on ${trend.responseAngle}`
  });

  if (!draft) {
    return null;
  }

  updateTrendOverride(brandId, trendId, {
    state: "acted",
    updatedAt: new Date().toISOString(),
    linkedDraftId: draft.id
  });

  return draft;
}

export async function createDraftFromTrendAsync(
  brandId: string,
  trendId: string
): Promise<WorkflowDraftView | null> {
  const trend = (await listTrendSignalsAsync(brandId)).find((item) => item.id === trendId);

  if (!trend) {
    return null;
  }

  if (trend.linkedDraftId) {
    const existing = await getBrandDraftAsync(brandId, trend.linkedDraftId);

    if (existing) {
      return existing;
    }
  }

  const draft = await createDraftFromProductAsync(brandId, trend.productId, {
    title: `${trend.title} response draft`,
    channel: trend.recommendedFormat,
    angle: trend.responseAngle,
    hook: `Take the ${trend.title.toLowerCase()} signal and translate it into a stronger product story.`,
    caption: `${trend.opportunity} ${trend.evidence}`,
    script: `Open with the format or behavior that is working on ${trend.platform}, adapt it into a brand-safe execution, and land on ${trend.responseAngle}`
  });

  if (!draft) {
    return null;
  }

  if (shouldEnforceSupabaseHostedAccess()) {
    await setSupabaseEntityOverride(brandId, {
      overrideType: trendOverrideType,
      appItemId: trendId,
      title: trend.title,
      state: "acted",
      linkedDraftId: draft.id,
      metadata: {
        productId: trend.productId,
        platform: trend.platform
      }
    });
  } else {
    updateTrendOverride(brandId, trendId, {
      state: "acted",
      updatedAt: new Date().toISOString(),
      linkedDraftId: draft.id
    });
  }

  return await getBrandDraftAsync(brandId, draft.id);
}

export function createDraftFromCompetitor(
  brandId: string,
  competitorId: string
): WorkflowDraftView | null {
  const observation = listCompetitorObservations(brandId).find(
    (item) => item.id === competitorId
  );

  if (!observation) {
    return null;
  }

  if (observation.linkedDraftId) {
    const existing = getBrandDraft(brandId, observation.linkedDraftId);

    if (existing) {
      return existing;
    }
  }

  const draft = createDraftFromProduct(brandId, observation.productId, {
    title: `${observation.competitorName} counter-position draft`,
    channel: "Short-form response brief",
    angle: observation.responseAngle,
    hook: `Answer the category pressure from ${observation.competitorName} without copying the category's weakest habits.`,
    caption: `${observation.implication} ${observation.responseAngle}`,
    script: `Start with what ${observation.competitorName} is doing, explain why it matters, then pivot into a stronger brand-native answer tied to the product story.`
  });

  if (!draft) {
    return null;
  }

  updateCompetitorOverride(brandId, competitorId, {
    state: "acted",
    updatedAt: new Date().toISOString(),
    linkedDraftId: draft.id
  });

  return draft;
}

export async function createDraftFromCompetitorAsync(
  brandId: string,
  competitorId: string
): Promise<WorkflowDraftView | null> {
  const observation = (await listCompetitorObservationsAsync(brandId)).find(
    (item) => item.id === competitorId
  );

  if (!observation) {
    return null;
  }

  if (observation.linkedDraftId) {
    const existing = await getBrandDraftAsync(brandId, observation.linkedDraftId);

    if (existing) {
      return existing;
    }
  }

  const draft = await createDraftFromProductAsync(brandId, observation.productId, {
    title: `${observation.competitorName} counter-position draft`,
    channel: "Short-form response brief",
    angle: observation.responseAngle,
    hook: `Answer the category pressure from ${observation.competitorName} without copying the category's weakest habits.`,
    caption: `${observation.implication} ${observation.responseAngle}`,
    script: `Start with what ${observation.competitorName} is doing, explain why it matters, then pivot into a stronger brand-native answer tied to the product story.`
  });

  if (!draft) {
    return null;
  }

  if (shouldEnforceSupabaseHostedAccess()) {
    await setSupabaseEntityOverride(brandId, {
      overrideType: competitorOverrideType,
      appItemId: competitorId,
      title: observation.title,
      state: "acted",
      linkedDraftId: draft.id,
      metadata: {
        competitorName: observation.competitorName,
        productId: observation.productId
      }
    });
  } else {
    updateCompetitorOverride(brandId, competitorId, {
      state: "acted",
      updatedAt: new Date().toISOString(),
      linkedDraftId: draft.id
    });
  }

  return await getBrandDraftAsync(brandId, draft.id);
}
