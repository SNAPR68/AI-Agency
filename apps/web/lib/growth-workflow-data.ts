import "server-only";

import { randomUUID } from "node:crypto";
import {
  getOpportunityOverride,
  getPersistedDraft,
  listPersistedDrafts,
  type PersistedDraft,
  updateOpportunityOverride,
  upsertPersistedDraft
} from "./local-persistence";
import {
  listDerivedCatalogProducts,
  listDerivedStoreMetrics
} from "./shopify-ingestion";
import {
  listSupabaseDerivedCatalogProducts,
  listSupabaseDerivedStoreMetrics
} from "./supabase-commerce-read-data";
import {
  createSupabaseWorkflowDraft,
  getSupabaseWorkflowDraft,
  listSupabaseWorkflowDrafts,
  markSupabaseDraftReadyForApproval,
  updateSupabaseWorkflowDraft
} from "./supabase-workflow-data";
import { shouldEnforceSupabaseHostedAccess } from "./supabase-env";
import { getWorkspaceBrand } from "./workspace-data";

type OpportunityType = "product" | "content" | "retention" | "channel";
type ProductStatus = "rising" | "watch" | "stable";

type WorkflowProductSeed = {
  id: string;
  title: string;
  collection: string;
  status: ProductStatus;
  revenueShare: string;
  revenueDelta: string;
  conversionRate: string;
  conversionDelta: string;
  marginBand: string;
  inventoryNote: string;
  summary: string;
  heroMessage: string;
  watchout: string;
  recommendedFormats: string[];
};

type WorkflowOpportunitySeed = {
  id: string;
  title: string;
  type: OpportunityType;
  priorityScore: number;
  confidenceScore: number;
  owner: string;
  status: "open" | "accepted" | "dismissed";
  evidence: string;
  impact: string;
  recommendation: string;
  productId?: string;
};

type WorkflowSeed = {
  narrative: string;
  products: WorkflowProductSeed[];
  opportunities: WorkflowOpportunitySeed[];
  drafts: PersistedDraft[];
};

export type WorkflowProductView = WorkflowProductSeed & {
  href: string;
  linkedOpportunityCount: number;
  linkedDraftCount: number;
};

export type WorkflowOpportunityView = WorkflowOpportunitySeed & {
  href: string;
  status: "open" | "accepted" | "dismissed";
  linkedDraftId?: string;
  linkedDraftHref?: string;
  productTitle?: string;
  productHref?: string;
};

export type WorkflowDraftView = PersistedDraft & {
  href: string;
  updatedAtLabel: string;
  sourceOpportunityTitle?: string;
  productHref?: string;
};

export type WorkflowProductDetailView = WorkflowProductView & {
  narrative: string;
  opportunities: WorkflowOpportunityView[];
  drafts: WorkflowDraftView[];
};

type DraftCreationOptions = {
  title?: string;
  channel?: string;
  angle?: string;
  hook?: string;
  caption?: string;
  script?: string;
};

function buildBrandPath(brandId: string, path: string) {
  return `/brands/${brandId}${path}`;
}

function extractFirstNumber(value: string) {
  const match = value.match(/-?\d+(?:\.\d+)?/);

  return match ? Number(match[0]) : 0;
}

function getOpportunityId(productId: string, kind: "scale" | "convert" | "retain") {
  const knownIds: Record<string, string> = {
    "prod-reset-serum:scale": "opp-reset-serum-ugc",
    "prod-barrier-cream:convert": "opp-barrier-pdp-refresh",
    "prod-reset-serum:retain": "opp-replenishment-sequence"
  };

  return knownIds[`${productId}:${kind}`] ?? `opp-${productId.replace(/^prod-/, "")}-${kind}`;
}

function formatTimestampLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function scoreStatus(status: WorkflowOpportunityView["status"]) {
  if (status === "open") {
    return 0;
  }

  if (status === "accepted") {
    return 1;
  }

  return 2;
}

const workflowSeeds: Record<string, WorkflowSeed> = {
  demo: {
    narrative:
      "Luna Skin should lean into the reset serum, patch the barrier cream PDP, and keep creator output tightly linked to real conversion signals.",
    products: [
      {
        id: "prod-reset-serum",
        title: "Overnight Reset Serum",
        collection: "Night Repair",
        status: "rising",
        revenueShare: "34%",
        revenueDelta: "+19.2%",
        conversionRate: "4.6%",
        conversionDelta: "+0.7pp",
        marginBand: "74% gross margin",
        inventoryNote: "24 days of cover",
        summary:
          "This is the hero SKU driving most of the current weekly lift across paid and owned channels.",
        heroMessage:
          "Recovery proof and overnight simplicity are the strongest hooks right now.",
        watchout:
          "Keep urgency high without sounding over-claimy or drifting into generic skincare language.",
        recommendedFormats: ["UGC testimonial", "Founder routine", "Three-beat Reel"]
      },
      {
        id: "prod-barrier-cream",
        title: "Daily Barrier Cream",
        collection: "Barrier Support",
        status: "watch",
        revenueShare: "18%",
        revenueDelta: "+6.1%",
        conversionRate: "2.1%",
        conversionDelta: "-0.5pp",
        marginBand: "69% gross margin",
        inventoryNote: "31 days of cover",
        summary:
          "Traffic is healthy, but the PDP is not converting enough of the current acquisition momentum.",
        heroMessage:
          "Sensitive-skin trust and faster reassurance need to be clearer above the fold.",
        watchout:
          "The product is attracting intent, so messaging friction matters more than traffic volume here.",
        recommendedFormats: ["Objection-handling carousel", "Comparison graphic", "PDP refresh brief"]
      },
      {
        id: "prod-cleanse-oil",
        title: "Melt Cleanse Oil",
        collection: "Core Routine",
        status: "stable",
        revenueShare: "11%",
        revenueDelta: "+2.4%",
        conversionRate: "3.3%",
        conversionDelta: "+0.1pp",
        marginBand: "72% gross margin",
        inventoryNote: "18 days of cover",
        summary:
          "Steady performer that can support bundle storytelling but is not the main growth lever this week.",
        heroMessage:
          "Use it as the routine-opening step in bundles and regimen-based content.",
        watchout:
          "Avoid over-weighting content capacity here while the serum and barrier cream need more attention.",
        recommendedFormats: ["Routine stack graphic", "Bundle explainer", "Step-one hook"]
      }
    ],
    opportunities: [
      {
        id: "opp-reset-serum-ugc",
        title: "Scale creator hooks for the reset serum",
        type: "content",
        priorityScore: 92,
        confidenceScore: 0.84,
        owner: "Aly Khan",
        status: "open",
        evidence:
          "The reset serum is driving the majority of weekly lift, and paid creative tied to overnight recovery is still efficient.",
        impact:
          "Three fresh hooks could extend the current revenue surge and keep paid efficiency healthy through the weekend push.",
        recommendation:
          "Generate a creator brief and short-form script centered on before-bed proof, ease, and visible next-morning change.",
        productId: "prod-reset-serum"
      },
      {
        id: "opp-barrier-pdp-refresh",
        title: "Patch the barrier cream conversion leak",
        type: "product",
        priorityScore: 88,
        confidenceScore: 0.81,
        owner: "Jon Park",
        status: "open",
        evidence:
          "Sessions are up sharply while conversion slipped, which points to messaging and trust friction on the PDP.",
        impact:
          "Closing even part of the gap could recover meaningful weekly revenue without new traffic spend.",
        recommendation:
          "Tighten above-the-fold proof, clarify who the product is for, and spin the same updated framing into supporting content.",
        productId: "prod-barrier-cream"
      },
      {
        id: "opp-replenishment-sequence",
        title: "Turn serum buyers into a replenishment sequence",
        type: "retention",
        priorityScore: 76,
        confidenceScore: 0.73,
        owner: "Jon Park",
        status: "accepted",
        evidence:
          "Repeat purchase is improving, and the serum has enough buyer density to support a stronger replenishment narrative.",
        impact:
          "A tighter post-purchase loop should lift second-order behavior without new acquisition cost.",
        recommendation:
          "Draft a lifecycle content angle that reinforces routine consistency and the visible payoff of staying with the serum.",
        productId: "prod-reset-serum"
      }
    ],
    drafts: [
      {
        id: "draft-priority-brief",
        title: "Reset serum creator brief",
        channel: "Instagram Reels",
        angle: "Night reset proof",
        status: "ready_for_approval",
        sourceOpportunityId: "opp-reset-serum-ugc",
        sourceProductId: "prod-reset-serum",
        productId: "prod-reset-serum",
        productTitle: "Overnight Reset Serum",
        hook: "Three nights in, my skin stopped looking tired by morning.",
        caption:
          "Show the serum as the easiest recovery step in the routine and lean into overnight proof without drifting into vague skincare claims.",
        script:
          "Open on the tired-skin tension, move through the before-bed routine in three beats, then land on the next-morning glow with a low-friction CTA.",
        createdAt: "2026-03-24T15:20:00Z",
        updatedAt: "2026-03-25T09:05:00Z"
      },
      {
        id: "draft-reset-approved",
        title: "Reset serum paid hook set",
        channel: "Paid Social",
        angle: "Morning-after proof",
        status: "approved",
        sourceOpportunityId: "opp-reset-serum-ugc",
        sourceProductId: "prod-reset-serum",
        productId: "prod-reset-serum",
        productTitle: "Overnight Reset Serum",
        hook: "If your skin looks tired in the morning, your night routine is doing too much or too little.",
        caption:
          "Use crisp before-and-after framing, keep the visual proof tight, and let the serum carry the story instead of over-explaining the science.",
        script:
          "Open on the tired-morning tension, show the serum as the low-friction answer before bed, and end with visible next-morning payoff plus a simple CTA.",
        createdAt: "2026-03-23T18:10:00Z",
        updatedAt: "2026-03-25T07:45:00Z"
      }
    ]
  },
  solstice: {
    narrative:
      "Solstice Well should protect paid efficiency by refreshing sleep-bundle creative, keep retention messaging high, and tie CX signals back into content priorities.",
    products: [
      {
        id: "prod-sleep-stack",
        title: "Sleep Stack Bundle",
        collection: "Bundles",
        status: "rising",
        revenueShare: "29%",
        revenueDelta: "+14.8%",
        conversionRate: "3.9%",
        conversionDelta: "+0.4pp",
        marginBand: "77% gross margin",
        inventoryNote: "22 days of cover",
        summary:
          "The subscription-friendly sleep bundle is carrying both AOV and repeat purchase momentum.",
        heroMessage:
          "Frame it as the easiest nightly stack for consistency, not just a discount bundle.",
        watchout:
          "Creative fatigue is the bigger risk than product-market fit right now.",
        recommendedFormats: ["Routine UGC", "Benefits stack carousel", "Creator brief"]
      },
      {
        id: "prod-magnesium-gummies",
        title: "Magnesium Gummies",
        collection: "Core Supplements",
        status: "watch",
        revenueShare: "17%",
        revenueDelta: "+4.2%",
        conversionRate: "2.6%",
        conversionDelta: "-0.2pp",
        marginBand: "71% gross margin",
        inventoryNote: "28 days of cover",
        summary:
          "Healthy attach behavior, but the paid story feels less differentiated than the sleep stack right now.",
        heroMessage:
          "Ease, taste, and consistency are the positioning pillars to sharpen.",
        watchout:
          "Avoid generic wellness language that could blur with competitor claims.",
        recommendedFormats: ["Objection FAQ", "Taste-first creative", "Routine combo post"]
      },
      {
        id: "prod-focus-drops",
        title: "Focus Drops",
        collection: "Daytime Support",
        status: "stable",
        revenueShare: "9%",
        revenueDelta: "+1.7%",
        conversionRate: "2.9%",
        conversionDelta: "+0.1pp",
        marginBand: "73% gross margin",
        inventoryNote: "35 days of cover",
        summary:
          "Stable enough to stay in rotation, but not the top growth conversation this week.",
        heroMessage:
          "Use it to round out routines rather than lead the weekly plan.",
        watchout:
          "Protect attention for higher-leverage bundle and retention work first.",
        recommendedFormats: ["Morning routine clip", "Pairing post", "Routine add-on copy"]
      }
    ],
    opportunities: [
      {
        id: "opp-sleep-stack-refresh",
        title: "Refresh paid creative for the sleep stack",
        type: "content",
        priorityScore: 90,
        confidenceScore: 0.82,
        owner: "Priya Rao",
        status: "open",
        evidence:
          "Meta quality softened even though the sleep stack still converts well once the right audience lands on-site.",
        impact:
          "A stronger creative refresh should help protect contribution margin before the next budget increase.",
        recommendation:
          "Generate a fresh creator brief and script around routine consistency, bundle simplicity, and better sleep rituals.",
        productId: "prod-sleep-stack"
      },
      {
        id: "opp-delivery-issue-brief",
        title: "Address recurring delivery timing complaints",
        type: "channel",
        priorityScore: 78,
        confidenceScore: 0.69,
        owner: "Diego Chen",
        status: "accepted",
        evidence:
          "Support issues now cluster around delivery timing enough to affect CX trust and post-purchase sentiment.",
        impact:
          "Clearer communication can reduce support load and protect repeat intent.",
        recommendation:
          "Write a founder-facing CX brief plus customer-facing copy to reset delivery expectations.",
        productId: "prod-sleep-stack"
      },
      {
        id: "opp-lifecycle-top-up",
        title: "Extend lifecycle content around replenishment",
        type: "retention",
        priorityScore: 73,
        confidenceScore: 0.75,
        owner: "Jon Park",
        status: "open",
        evidence:
          "Repeat purchase is trending up and lifecycle campaigns are beginning to compound bundle behavior.",
        impact:
          "A tighter replenishment content angle should help convert improving retention into steadier second orders.",
        recommendation:
          "Draft lifecycle-friendly educational content around nightly consistency and reorder timing.",
        productId: "prod-magnesium-gummies"
      }
    ],
    drafts: [
      {
        id: "draft-priority-brief",
        title: "Sleep stack creator brief",
        channel: "Paid Social",
        angle: "Night routine consistency",
        status: "draft",
        sourceOpportunityId: "opp-sleep-stack-refresh",
        sourceProductId: "prod-sleep-stack",
        productId: "prod-sleep-stack",
        productTitle: "Sleep Stack Bundle",
        hook: "The easiest way to make your night routine stick is to stop building it product by product.",
        caption:
          "Lead with routine simplicity and the habit-building value of the bundle, then support it with proof and relief language.",
        script:
          "Open on night-routine friction, show the bundle replacing complexity, then land on consistency and better sleep as the emotional payoff.",
        createdAt: "2026-03-24T13:40:00Z",
        updatedAt: "2026-03-25T08:15:00Z"
      },
      {
        id: "draft-sleep-approved",
        title: "Sleep stack refresh pack",
        channel: "Instagram Reels",
        angle: "Routine consistency",
        status: "approved",
        sourceOpportunityId: "opp-sleep-stack-refresh",
        sourceProductId: "prod-sleep-stack",
        productId: "prod-sleep-stack",
        productTitle: "Sleep Stack Bundle",
        hook: "The best night routine is the one you actually repeat.",
        caption:
          "Frame the sleep stack as a consistency tool first, then bring in bundle value and habit support as the supporting proof.",
        script:
          "Start with the friction of piecing together a night routine, show the bundle collapsing that complexity, and finish with consistency as the emotional win.",
        createdAt: "2026-03-23T17:00:00Z",
        updatedAt: "2026-03-25T06:50:00Z"
      }
    ]
  }
};

function getDefaultWorkflowSeed(brandId: string): WorkflowSeed {
  const brandName = getWorkspaceBrand(brandId)?.name ?? "This brand";

  return {
    narrative:
      `${brandName} is ready for workflow data, but the catalog and opportunity layer still need brand-specific seeding.`,
    products: [
      {
        id: "prod-priority-item",
        title: `${brandName} Hero Product`,
        collection: "Priority",
        status: "watch",
        revenueShare: "0%",
        revenueDelta: "0.0%",
        conversionRate: "0.0%",
        conversionDelta: "0.0pp",
        marginBand: "Pending margin data",
        inventoryNote: "Waiting for sync",
        summary:
          "Seed a first product once Shopify data is connected to unlock the next layer of merchandising and content decisions.",
        heroMessage:
          "Define the product story you want the content system to reinforce.",
        watchout:
          "Until real data is flowing, the product surface is more of a scaffolding layer than a true priority engine.",
        recommendedFormats: ["Product brief", "Hook list", "Routine explainer"]
      }
    ],
    opportunities: [
      {
        id: "opp-connect-shopify",
        title: "Connect Shopify and seed the first product layer",
        type: "product",
        priorityScore: 85,
        confidenceScore: 0.9,
        owner: "Workspace owner",
        status: "open",
        evidence:
          "The app has structure and permissions in place, but the product ranking layer needs live commerce data to become useful.",
        impact:
          "Connecting Shopify unlocks products, opportunities, and content generation tied to real store performance.",
        recommendation:
          "Connect Shopify, verify sync health, then generate the first workflow draft from the top product.",
        productId: "prod-priority-item"
      }
    ],
    drafts: [
      {
        id: "draft-priority-brief",
        title: `${brandName} priority creator brief`,
        channel: "Short-form video",
        angle: "Hero product setup",
        status: "draft",
        sourceOpportunityId: "opp-connect-shopify",
        sourceProductId: "prod-priority-item",
        productId: "prod-priority-item",
        productTitle: `${brandName} Hero Product`,
        hook: "Start with the clearest product story this brand wants to own.",
        caption:
          "Use this starter draft to define the hero product narrative until real store data starts shaping the content system.",
        script:
          "Open on the main customer problem, show the product as the simplest answer, and finish with the desired action you want the first content sprint to support.",
        createdAt: "2026-03-25T12:00:00Z",
        updatedAt: "2026-03-25T12:00:00Z"
      }
    ]
  };
}

function getWorkflowSeed(brandId: string) {
  return workflowSeeds[brandId] ?? getDefaultWorkflowSeed(brandId);
}

function getWorkflowProducts(brandId: string): WorkflowProductSeed[] {
  const importedProducts = listDerivedCatalogProducts(brandId);

  if (importedProducts.length > 0) {
    return importedProducts;
  }

  return getWorkflowSeed(brandId).products;
}

function getDerivedWorkflowOpportunities(brandId: string): WorkflowOpportunitySeed[] {
  const importedProducts = [...listDerivedCatalogProducts(brandId)];

  if (importedProducts.length === 0) {
    return [];
  }

  const storeMetrics = listDerivedStoreMetrics(brandId);
  const latestMetric = storeMetrics[0];
  const previousMetric = storeMetrics[1];
  const rankedProducts = importedProducts.sort(
    (left, right) => extractFirstNumber(right.revenueShare) - extractFirstNumber(left.revenueShare)
  );
  const heroProduct =
    rankedProducts.find((product) => product.status === "rising") ?? rankedProducts[0];
  const watchProducts = rankedProducts.filter((product) => product.status === "watch");
  const opportunities: WorkflowOpportunitySeed[] = [];

  if (heroProduct) {
    opportunities.push({
      id: getOpportunityId(heroProduct.id, "scale"),
      title: `Scale ${heroProduct.title} as the weekly hero`,
      type: "content",
      priorityScore: Math.min(97, 78 + extractFirstNumber(heroProduct.revenueShare)),
      confidenceScore: 0.82,
      owner: "Growth lead",
      status: "open",
      evidence: `${heroProduct.title} is holding ${heroProduct.revenueShare} of synced revenue and ${heroProduct.revenueDelta} week-over-week movement.`,
      impact:
        "Doubling down here should keep the strongest commerce momentum attached to the clearest story instead of diffusing creative effort across the catalog.",
      recommendation: `Generate creator hooks and a short-form script around ${heroProduct.heroMessage.toLowerCase()} and make this SKU the main character of the next content sprint.`,
      productId: heroProduct.id
    });
  }

  for (const watchProduct of watchProducts.slice(0, 2)) {
    opportunities.push({
      id: getOpportunityId(watchProduct.id, "convert"),
      title: `Fix conversion friction on ${watchProduct.title}`,
      type: "product",
      priorityScore: 84 + Math.max(0, Math.abs(extractFirstNumber(watchProduct.conversionDelta))),
      confidenceScore: 0.79,
      owner: "Operator",
      status: "open",
      evidence: `${watchProduct.summary} Conversion is ${watchProduct.conversionRate} (${watchProduct.conversionDelta}), and the watch status suggests the PDP or message is still leaking intent.`,
      impact:
        "Even a modest lift here would recover revenue without paying for more traffic, while giving the content team a sharper proof angle to work from.",
      recommendation: `Refresh the PDP framing, tighten the trust language, and mirror the new message in supporting content built around ${watchProduct.heroMessage.toLowerCase()}.`,
      productId: watchProduct.id
    });
  }

  if (heroProduct && latestMetric && previousMetric) {
    const repeatRateDelta = latestMetric.repeatPurchaseRate - previousMetric.repeatPurchaseRate;

    opportunities.push({
      id: getOpportunityId(heroProduct.id, "retain"),
      title: `Build a replenishment loop around ${heroProduct.title}`,
      type: "retention",
      priorityScore: repeatRateDelta >= 0 ? 74 : 80,
      confidenceScore: 0.72,
      owner: "Lifecycle owner",
      status: "open",
      evidence:
        repeatRateDelta >= 0
          ? `Repeat purchase moved from ${(previousMetric.repeatPurchaseRate * 100).toFixed(1)}% to ${(latestMetric.repeatPurchaseRate * 100).toFixed(1)}%, and ${heroProduct.title} is the clearest product to reinforce that behavior around.`
          : `Repeat purchase slipped from ${(previousMetric.repeatPurchaseRate * 100).toFixed(1)}% to ${(latestMetric.repeatPurchaseRate * 100).toFixed(1)}%, which puts more pressure on post-purchase messaging and replenishment timing.`,
      impact:
        "A better replenishment story should improve second-order revenue quality without adding acquisition cost.",
      recommendation: `Create a lifecycle angle that reinforces consistency, visible payoff, and the reasons customers should stay with ${heroProduct.title} instead of treating it like a one-off purchase.`,
      productId: heroProduct.id
    });
  }

  return opportunities;
}

function toDraftMap(brandId: string) {
  const seedMap = new Map(
    getWorkflowSeed(brandId).drafts.map((draft) => [draft.id, draft] as const)
  );

  for (const draft of listPersistedDrafts(brandId)) {
    seedMap.set(draft.id, draft);
  }

  return seedMap;
}

export function listBrandDrafts(brandId: string): WorkflowDraftView[] {
  const opportunityMap = new Map(
    listBrandOpportunities(brandId).map((opportunity) => [opportunity.id, opportunity] as const)
  );

  return Array.from(toDraftMap(brandId).values())
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((draft) => ({
      ...draft,
      href: buildBrandPath(brandId, `/content/drafts/${draft.id}`),
      updatedAtLabel: formatTimestampLabel(draft.updatedAt),
      sourceOpportunityTitle: draft.sourceOpportunityId
        ? opportunityMap.get(draft.sourceOpportunityId)?.title
        : undefined,
      productHref: draft.productId
        ? buildBrandPath(brandId, `/products/${draft.productId}`)
        : undefined
    }));
}

export function getBrandDraft(brandId: string, draftId: string): WorkflowDraftView | null {
  const draft = getPersistedDraft(brandId, draftId) ?? toDraftMap(brandId).get(draftId);

  if (!draft) {
    return null;
  }

  const opportunityTitle = draft.sourceOpportunityId
    ? getBrandOpportunity(brandId, draft.sourceOpportunityId)?.title
    : undefined;

  return {
    ...draft,
    href: buildBrandPath(brandId, `/content/drafts/${draft.id}`),
    updatedAtLabel: formatTimestampLabel(draft.updatedAt),
    sourceOpportunityTitle: opportunityTitle,
    productHref: draft.productId
      ? buildBrandPath(brandId, `/products/${draft.productId}`)
      : undefined
  };
}

export function listBrandOpportunities(brandId: string): WorkflowOpportunityView[] {
  const derivedOpportunities = getDerivedWorkflowOpportunities(brandId);
  const opportunitySeed =
    derivedOpportunities.length > 0
      ? derivedOpportunities
      : getWorkflowSeed(brandId).opportunities;
  const productMap = new Map(getWorkflowProducts(brandId).map((product) => [product.id, product] as const));

  return opportunitySeed
    .map((opportunity) => {
      const override = getOpportunityOverride(brandId, opportunity.id);
      const product = opportunity.productId
        ? productMap.get(opportunity.productId)
        : undefined;

      return {
        ...opportunity,
        status: override?.status ?? opportunity.status,
        href: opportunity.productId
          ? buildBrandPath(brandId, `/products/${opportunity.productId}`)
          : buildBrandPath(brandId, "/content"),
        linkedDraftId: override?.linkedDraftId,
        linkedDraftHref: override?.linkedDraftId
          ? buildBrandPath(brandId, `/content/drafts/${override.linkedDraftId}`)
          : undefined,
        productTitle: product?.title,
        productHref: product
          ? buildBrandPath(brandId, `/products/${product.id}`)
          : undefined
      } satisfies WorkflowOpportunityView;
    })
    .sort((left, right) => {
      const statusDelta = scoreStatus(left.status) - scoreStatus(right.status);

      if (statusDelta !== 0) {
        return statusDelta;
      }

      return right.priorityScore - left.priorityScore;
    });
}

export function getBrandOpportunity(
  brandId: string,
  opportunityId: string
): WorkflowOpportunityView | null {
  return (
    listBrandOpportunities(brandId).find((opportunity) => opportunity.id === opportunityId) ??
    null
  );
}

export function listBrandProducts(brandId: string): WorkflowProductView[] {
  const opportunities = listBrandOpportunities(brandId);
  const drafts = listBrandDrafts(brandId);

  return getWorkflowProducts(brandId).map((product) => ({
    ...product,
    href: buildBrandPath(brandId, `/products/${product.id}`),
    linkedOpportunityCount: opportunities.filter(
      (opportunity) => opportunity.productId === product.id
    ).length,
    linkedDraftCount: drafts.filter((draft) => draft.productId === product.id).length
  }));
}

export function getBrandProductDetail(
  brandId: string,
  productId: string
): WorkflowProductDetailView | null {
  const product = listBrandProducts(brandId).find((item) => item.id === productId);

  if (!product) {
    return null;
  }

  return {
    ...product,
    narrative: getWorkflowNarrative(brandId),
    opportunities: listBrandOpportunities(brandId).filter(
      (opportunity) => opportunity.productId === productId
    ),
    drafts: listBrandDrafts(brandId).filter((draft) => draft.productId === productId)
  };
}

export function getWorkflowNarrative(brandId: string) {
  const importedProducts = listDerivedCatalogProducts(brandId);
  const storeMetrics = listDerivedStoreMetrics(brandId);

  if (importedProducts.length > 0) {
    const topProduct = importedProducts[0];
    const latestMetric = storeMetrics[0];
    const previousMetric = storeMetrics[1];
    const revenueDelta =
      latestMetric && previousMetric
        ? (((latestMetric.revenue - previousMetric.revenue) / previousMetric.revenue) * 100).toFixed(
            1
          )
        : null;

    return `${getWorkspaceBrand(brandId)?.name ?? "This brand"} now has live Shopify-derived product data. ${topProduct.title} is currently leading the board${revenueDelta ? `, revenue is ${Number(revenueDelta) >= 0 ? "+" : ""}${revenueDelta}% versus the prior synced day,` : ""} and the opportunity queue should now follow the imported commerce signals instead of placeholder scaffolding.`;
  }

  return getWorkflowSeed(brandId).narrative;
}

export function setOpportunityStatus(
  brandId: string,
  opportunityId: string,
  status: "open" | "accepted" | "dismissed"
) {
  const current = getOpportunityOverride(brandId, opportunityId);

  updateOpportunityOverride(brandId, opportunityId, {
    status,
    updatedAt: new Date().toISOString(),
    linkedDraftId: current?.linkedDraftId
  });
}

function buildDraftId() {
  return `draft-${randomUUID().slice(0, 8)}`;
}

function buildDraftFromProduct(
  product: WorkflowProductSeed,
  angle: string,
  options?: DraftCreationOptions
): PersistedDraft {
  const now = new Date().toISOString();

  return {
    id: buildDraftId(),
    title: options?.title ?? `${product.title} content draft`,
    channel: options?.channel ?? "Short-form video",
    angle: options?.angle ?? angle,
    status: "draft",
    sourceProductId: product.id,
    productId: product.id,
    productTitle: product.title,
    hook:
      options?.hook ??
      `Why ${product.title.toLowerCase()} is the easiest product to talk about this week.`,
    caption:
      options?.caption ??
      `${product.heroMessage} Keep the message anchored in proof and use the product as the main character of the story.`,
    script:
      options?.script ??
      `Open on the main customer tension, show ${product.title} solving it in a simple routine, then land on the clearest proof point the team wants to reinforce.`,
    createdAt: now,
    updatedAt: now
  };
}

export function createDraftFromProduct(
  brandId: string,
  productId: string,
  options?: DraftCreationOptions
): WorkflowDraftView | null {
  const product = getWorkflowProducts(brandId).find((item) => item.id === productId);

  if (!product) {
    return null;
  }

  const draft = buildDraftFromProduct(product, product.heroMessage, options);
  upsertPersistedDraft(brandId, draft);

  return getBrandDraft(brandId, draft.id);
}

export function createDraftFromOpportunity(
  brandId: string,
  opportunityId: string
): WorkflowDraftView | null {
  const opportunity = getBrandOpportunity(brandId, opportunityId);

  if (!opportunity) {
    return null;
  }

  if (opportunity.linkedDraftId) {
    const existingDraft = getBrandDraft(brandId, opportunity.linkedDraftId);

    if (existingDraft) {
      return existingDraft;
    }
  }

  const product = opportunity.productId
    ? getWorkflowProducts(brandId).find((item) => item.id === opportunity.productId)
    : undefined;
  const now = new Date().toISOString();
  const draft = {
    ...(product
      ? buildDraftFromProduct(product, opportunity.recommendation)
      : {
          id: buildDraftId(),
          title: `${opportunity.title} draft`,
          channel: "Short-form video",
          angle: opportunity.title,
          status: "draft" as const,
          hook: `Turn this opportunity into a sharper story: ${opportunity.title}.`,
          caption: opportunity.recommendation,
          script: `${opportunity.evidence} Then move into the action: ${opportunity.recommendation}`,
          createdAt: now,
          updatedAt: now
        }),
    title: `${opportunity.title} draft`,
    angle: opportunity.title,
    sourceOpportunityId: opportunity.id,
    sourceProductId: opportunity.productId,
    productId: product?.id,
    productTitle: product?.title
  } satisfies PersistedDraft;

  upsertPersistedDraft(brandId, draft);
  updateOpportunityOverride(brandId, opportunityId, {
    status: "accepted",
    updatedAt: now,
    linkedDraftId: draft.id
  });

  return getBrandDraft(brandId, draft.id);
}

async function getWorkflowProductsAsync(brandId: string): Promise<WorkflowProductSeed[]> {
  const importedProducts = await listSupabaseDerivedCatalogProducts(brandId);

  if (importedProducts.length > 0) {
    return importedProducts;
  }

  return getWorkflowSeed(brandId).products;
}

async function getDerivedWorkflowOpportunitiesAsync(
  brandId: string
): Promise<WorkflowOpportunitySeed[]> {
  const importedProducts = [...(await listSupabaseDerivedCatalogProducts(brandId))];

  if (importedProducts.length === 0) {
    return [];
  }

  const storeMetrics = await listSupabaseDerivedStoreMetrics(brandId);
  const latestMetric = storeMetrics[0];
  const previousMetric = storeMetrics[1];
  const rankedProducts = importedProducts.sort(
    (left, right) => extractFirstNumber(right.revenueShare) - extractFirstNumber(left.revenueShare)
  );
  const heroProduct =
    rankedProducts.find((product) => product.status === "rising") ?? rankedProducts[0];
  const watchProducts = rankedProducts.filter((product) => product.status === "watch");
  const opportunities: WorkflowOpportunitySeed[] = [];

  if (heroProduct) {
    opportunities.push({
      id: getOpportunityId(heroProduct.id, "scale"),
      title: `Scale ${heroProduct.title} as the weekly hero`,
      type: "content",
      priorityScore: Math.min(97, 78 + extractFirstNumber(heroProduct.revenueShare)),
      confidenceScore: 0.82,
      owner: "Growth lead",
      status: "open",
      evidence: `${heroProduct.title} is holding ${heroProduct.revenueShare} of synced revenue and ${heroProduct.revenueDelta} week-over-week movement.`,
      impact:
        "Doubling down here should keep the strongest commerce momentum attached to the clearest story instead of diffusing creative effort across the catalog.",
      recommendation: `Generate creator hooks and a short-form script around ${heroProduct.heroMessage.toLowerCase()} and make this SKU the main character of the next content sprint.`,
      productId: heroProduct.id
    });
  }

  for (const watchProduct of watchProducts.slice(0, 2)) {
    opportunities.push({
      id: getOpportunityId(watchProduct.id, "convert"),
      title: `Fix conversion friction on ${watchProduct.title}`,
      type: "product",
      priorityScore: 84 + Math.max(0, Math.abs(extractFirstNumber(watchProduct.conversionDelta))),
      confidenceScore: 0.79,
      owner: "Operator",
      status: "open",
      evidence: `${watchProduct.summary} Conversion is ${watchProduct.conversionRate} (${watchProduct.conversionDelta}), and the watch status suggests the PDP or message is still leaking intent.`,
      impact:
        "Even a modest lift here would recover revenue without paying for more traffic, while giving the content team a sharper proof angle to work from.",
      recommendation: `Refresh the PDP framing, tighten the trust language, and mirror the new message in supporting content built around ${watchProduct.heroMessage.toLowerCase()}.`,
      productId: watchProduct.id
    });
  }

  if (heroProduct && latestMetric && previousMetric) {
    const repeatRateDelta = latestMetric.repeatPurchaseRate - previousMetric.repeatPurchaseRate;

    opportunities.push({
      id: getOpportunityId(heroProduct.id, "retain"),
      title: `Build a replenishment loop around ${heroProduct.title}`,
      type: "retention",
      priorityScore: repeatRateDelta >= 0 ? 74 : 80,
      confidenceScore: 0.72,
      owner: "Lifecycle owner",
      status: "open",
      evidence:
        repeatRateDelta >= 0
          ? `Repeat purchase moved from ${(previousMetric.repeatPurchaseRate * 100).toFixed(1)}% to ${(latestMetric.repeatPurchaseRate * 100).toFixed(1)}%, and ${heroProduct.title} is the clearest product to reinforce that behavior around.`
          : `Repeat purchase slipped from ${(previousMetric.repeatPurchaseRate * 100).toFixed(1)}% to ${(latestMetric.repeatPurchaseRate * 100).toFixed(1)}%, which puts more pressure on post-purchase messaging and replenishment timing.`,
      impact:
        "A better replenishment story should improve second-order revenue quality without adding acquisition cost.",
      recommendation: `Create a lifecycle angle that reinforces consistency, visible payoff, and the reasons customers should stay with ${heroProduct.title} instead of treating it like a one-off purchase.`,
      productId: heroProduct.id
    });
  }

  return opportunities;
}

export async function listBrandOpportunitiesAsync(
  brandId: string
): Promise<WorkflowOpportunityView[]> {
  const derivedOpportunities = await getDerivedWorkflowOpportunitiesAsync(brandId);
  const opportunitySeed =
    derivedOpportunities.length > 0
      ? derivedOpportunities
      : getWorkflowSeed(brandId).opportunities;
  const productMap = new Map(
    (await getWorkflowProductsAsync(brandId)).map((product) => [product.id, product] as const)
  );
  const hostedDraftMap = new Map(
    ((await listSupabaseWorkflowDrafts(brandId)) ?? [])
      .filter((draft) => draft.sourceOpportunityId)
      .map((draft) => [draft.sourceOpportunityId as string, draft] as const)
  );
  const hostedMode = shouldEnforceSupabaseHostedAccess();

  return opportunitySeed
    .map((opportunity) => {
      const override = hostedMode ? undefined : getOpportunityOverride(brandId, opportunity.id);
      const hostedDraft = hostedDraftMap.get(opportunity.id);
      const product = opportunity.productId
        ? productMap.get(opportunity.productId)
        : undefined;

      return {
        ...opportunity,
        status: override?.status ?? (hostedDraft ? "accepted" : opportunity.status),
        href: opportunity.productId
          ? buildBrandPath(brandId, `/products/${opportunity.productId}`)
          : buildBrandPath(brandId, "/content"),
        linkedDraftId: override?.linkedDraftId ?? hostedDraft?.id,
        linkedDraftHref: override?.linkedDraftId || hostedDraft?.id
          ? buildBrandPath(
              brandId,
              `/content/drafts/${override?.linkedDraftId ?? hostedDraft?.id}`
            )
          : undefined,
        productTitle: product?.title,
        productHref: product
          ? buildBrandPath(brandId, `/products/${product.id}`)
          : undefined
      } satisfies WorkflowOpportunityView;
    })
    .sort((left, right) => {
      const statusDelta = scoreStatus(left.status) - scoreStatus(right.status);

      if (statusDelta !== 0) {
        return statusDelta;
      }

      return right.priorityScore - left.priorityScore;
    });
}

export async function getBrandOpportunityAsync(
  brandId: string,
  opportunityId: string
): Promise<WorkflowOpportunityView | null> {
  return (
    (await listBrandOpportunitiesAsync(brandId)).find(
      (opportunity) => opportunity.id === opportunityId
    ) ?? null
  );
}

function buildDraftViews(
  brandId: string,
  drafts: PersistedDraft[],
  opportunityMap: Map<string, WorkflowOpportunityView>
) {
  return drafts
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map((draft) => ({
      ...draft,
      href: buildBrandPath(brandId, `/content/drafts/${draft.id}`),
      updatedAtLabel: formatTimestampLabel(draft.updatedAt),
      sourceOpportunityTitle: draft.sourceOpportunityId
        ? opportunityMap.get(draft.sourceOpportunityId)?.title
        : undefined,
      productHref: draft.productId
        ? buildBrandPath(brandId, `/products/${draft.productId}`)
        : undefined
    }));
}

export async function listBrandDraftsAsync(brandId: string): Promise<WorkflowDraftView[]> {
  const opportunityMap = new Map(
    (await listBrandOpportunitiesAsync(brandId)).map(
      (opportunity) => [opportunity.id, opportunity] as const
    )
  );
  const supabaseDrafts = await listSupabaseWorkflowDrafts(brandId);
  const draftItems =
    supabaseDrafts ?? (shouldEnforceSupabaseHostedAccess() ? [] : Array.from(toDraftMap(brandId).values()));

  return buildDraftViews(brandId, [...draftItems], opportunityMap);
}

export async function getBrandDraftAsync(
  brandId: string,
  draftId: string
): Promise<WorkflowDraftView | null> {
  const opportunityMap = new Map(
    (await listBrandOpportunitiesAsync(brandId)).map(
      (opportunity) => [opportunity.id, opportunity] as const
    )
  );
  const draft =
    (await getSupabaseWorkflowDraft(brandId, draftId)) ??
    (shouldEnforceSupabaseHostedAccess() ? null : getPersistedDraft(brandId, draftId) ?? toDraftMap(brandId).get(draftId));

  if (!draft) {
    return null;
  }

  return buildDraftViews(brandId, [draft], opportunityMap)[0] ?? null;
}

export async function listBrandProductsAsync(
  brandId: string
): Promise<WorkflowProductView[]> {
  const opportunities = await listBrandOpportunitiesAsync(brandId);
  const drafts = await listBrandDraftsAsync(brandId);

  return (await getWorkflowProductsAsync(brandId)).map((product) => ({
    ...product,
    href: buildBrandPath(brandId, `/products/${product.id}`),
    linkedOpportunityCount: opportunities.filter(
      (opportunity) => opportunity.productId === product.id
    ).length,
    linkedDraftCount: drafts.filter((draft) => draft.productId === product.id).length
  }));
}

export async function getBrandProductDetailAsync(
  brandId: string,
  productId: string
): Promise<WorkflowProductDetailView | null> {
  const product = (await listBrandProductsAsync(brandId)).find((item) => item.id === productId);

  if (!product) {
    return null;
  }

  return {
    ...product,
    narrative: await getWorkflowNarrativeAsync(brandId),
    opportunities: (await listBrandOpportunitiesAsync(brandId)).filter(
      (opportunity) => opportunity.productId === productId
    ),
    drafts: (await listBrandDraftsAsync(brandId)).filter((draft) => draft.productId === productId)
  };
}

export async function getWorkflowNarrativeAsync(brandId: string) {
  const importedProducts = await listSupabaseDerivedCatalogProducts(brandId);
  const storeMetrics = await listSupabaseDerivedStoreMetrics(brandId);

  if (importedProducts.length > 0) {
    const topProduct = importedProducts[0];
    const latestMetric = storeMetrics[0];
    const previousMetric = storeMetrics[1];
    const revenueDelta =
      latestMetric && previousMetric
        ? (((latestMetric.revenue - previousMetric.revenue) / previousMetric.revenue) * 100).toFixed(
            1
          )
        : null;

    return `${getWorkspaceBrand(brandId)?.name ?? "This brand"} now has live Shopify-derived product data. ${topProduct.title} is currently leading the board${revenueDelta ? `, revenue is ${Number(revenueDelta) >= 0 ? "+" : ""}${revenueDelta}% versus the prior synced day,` : ""} and the opportunity queue should now follow the imported commerce signals instead of placeholder scaffolding.`;
  }

  return getWorkflowSeed(brandId).narrative;
}

export async function createDraftFromProductAsync(
  brandId: string,
  productId: string,
  options?: DraftCreationOptions
): Promise<WorkflowDraftView | null> {
  const product = (await getWorkflowProductsAsync(brandId)).find((item) => item.id === productId);

  if (!product) {
    return null;
  }

  const draft = buildDraftFromProduct(product, product.heroMessage, options);

  if (shouldEnforceSupabaseHostedAccess()) {
    const createdDraft = await createSupabaseWorkflowDraft(brandId, {
      title: draft.title,
      channel: draft.channel,
      angle: draft.angle,
      status: draft.status,
      sourceOpportunityId: draft.sourceOpportunityId,
      sourceProductId: draft.sourceProductId,
      productId: draft.productId,
      productTitle: draft.productTitle,
      hook: draft.hook,
      caption: draft.caption,
      script: draft.script
    });

    return createdDraft ? getBrandDraftAsync(brandId, createdDraft.id) : null;
  }

  upsertPersistedDraft(brandId, draft);

  return (
    (await listBrandDraftsAsync(brandId)).find((item) => item.id === draft.id) ?? null
  );
}

export async function createDraftFromOpportunityAsync(
  brandId: string,
  opportunityId: string
): Promise<WorkflowDraftView | null> {
  const opportunity = await getBrandOpportunityAsync(brandId, opportunityId);

  if (!opportunity) {
    return null;
  }

  if (opportunity.linkedDraftId) {
    const existingDraft = (await listBrandDraftsAsync(brandId)).find(
      (draft) => draft.id === opportunity.linkedDraftId
    );

    if (existingDraft) {
      return existingDraft;
    }
  }

  const product = opportunity.productId
    ? (await getWorkflowProductsAsync(brandId)).find((item) => item.id === opportunity.productId)
    : undefined;
  const now = new Date().toISOString();
  const draft = {
    ...(product
      ? buildDraftFromProduct(product, opportunity.recommendation)
      : {
          id: buildDraftId(),
          title: `${opportunity.title} draft`,
          channel: "Short-form video",
          angle: opportunity.title,
          status: "draft" as const,
          hook: `Turn this opportunity into a sharper story: ${opportunity.title}.`,
          caption: opportunity.recommendation,
          script: `${opportunity.evidence} Then move into the action: ${opportunity.recommendation}`,
          createdAt: now,
          updatedAt: now
        }),
    title: `${opportunity.title} draft`,
    angle: opportunity.title,
    sourceOpportunityId: opportunity.id,
    sourceProductId: opportunity.productId,
    productId: product?.id,
    productTitle: product?.title
  } satisfies PersistedDraft;

  if (shouldEnforceSupabaseHostedAccess()) {
    const createdDraft = await createSupabaseWorkflowDraft(brandId, {
      title: draft.title,
      channel: draft.channel,
      angle: draft.angle,
      status: draft.status,
      sourceOpportunityId: draft.sourceOpportunityId,
      sourceProductId: draft.sourceProductId,
      productId: draft.productId,
      productTitle: draft.productTitle,
      hook: draft.hook,
      caption: draft.caption,
      script: draft.script
    });

    return createdDraft ? getBrandDraftAsync(brandId, createdDraft.id) : null;
  }

  upsertPersistedDraft(brandId, draft);
  updateOpportunityOverride(brandId, opportunityId, {
    status: "accepted",
    updatedAt: now,
    linkedDraftId: draft.id
  });

  return (await listBrandDraftsAsync(brandId)).find((item) => item.id === draft.id) ?? null;
}

export function updateDraftContent(
  brandId: string,
  draftId: string,
  updates: Partial<
    Pick<PersistedDraft, "title" | "channel" | "angle" | "hook" | "caption" | "script" | "status">
  >
): WorkflowDraftView | null {
  const existing = getBrandDraft(brandId, draftId);

  if (!existing) {
    return null;
  }

  const nextDraft: PersistedDraft = {
    id: existing.id,
    title: updates.title ?? existing.title,
    channel: updates.channel ?? existing.channel,
    angle: updates.angle ?? existing.angle,
    status: updates.status ?? existing.status,
    sourceOpportunityId: existing.sourceOpportunityId,
    sourceProductId: existing.sourceProductId,
    productId: existing.productId,
    productTitle: existing.productTitle,
    hook: updates.hook ?? existing.hook,
    caption: updates.caption ?? existing.caption,
    script: updates.script ?? existing.script,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };

  upsertPersistedDraft(brandId, nextDraft);

  if (existing.sourceOpportunityId) {
    const opportunityOverride = getOpportunityOverride(brandId, existing.sourceOpportunityId);

    updateOpportunityOverride(brandId, existing.sourceOpportunityId, {
      status: opportunityOverride?.status ?? "accepted",
      updatedAt: nextDraft.updatedAt,
      linkedDraftId: existing.id
    });
  }

  return getBrandDraft(brandId, draftId);
}

export function markDraftReadyForApproval(brandId: string, draftId: string) {
  return updateDraftContent(brandId, draftId, {
    status: "ready_for_approval"
  });
}

export async function updateDraftContentAsync(
  brandId: string,
  draftId: string,
  updates: Partial<
    Pick<PersistedDraft, "title" | "channel" | "angle" | "hook" | "caption" | "script" | "status">
  >
): Promise<WorkflowDraftView | null> {
  if (shouldEnforceSupabaseHostedAccess()) {
    const updatedDraft = await updateSupabaseWorkflowDraft(brandId, draftId, updates);

    return updatedDraft ? getBrandDraftAsync(brandId, updatedDraft.id) : null;
  }

  return updateDraftContent(brandId, draftId, updates);
}

export async function markDraftReadyForApprovalAsync(
  brandId: string,
  draftId: string
): Promise<WorkflowDraftView | null> {
  if (shouldEnforceSupabaseHostedAccess()) {
    const updatedDraft = await markSupabaseDraftReadyForApproval(brandId, draftId);

    return updatedDraft ? getBrandDraftAsync(brandId, updatedDraft.id) : null;
  }

  return markDraftReadyForApproval(brandId, draftId);
}
