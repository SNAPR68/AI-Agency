import "server-only";

import {
  createDraftFromProductAsync,
  createDraftFromProduct,
  getBrandDraftAsync,
  getBrandDraft,
  type WorkflowDraftView
} from "./growth-workflow-data";
import {
  getCxOverride,
  getRetentionOverride,
  getSupportOverride,
  updateCxOverride,
  updateRetentionOverride,
  updateSupportOverride
} from "./local-persistence";
import {
  listSupabaseEntityOverrides,
  setSupabaseEntityOverride
} from "./supabase-workflow-data";
import { shouldEnforceSupabaseHostedAccess } from "./supabase-env";
import { getWorkspaceBrand } from "./workspace-data";

type RetentionSeed = {
  id: string;
  title: string;
  segment: string;
  productId: string;
  repeatPurchaseRate: string;
  churnRisk: "low" | "medium" | "high";
  evidence: string;
  implication: string;
  recommendation: string;
};

type CxSeed = {
  id: string;
  title: string;
  category: "returns" | "delivery" | "messaging";
  severity: "low" | "medium" | "high";
  productId: string;
  evidence: string;
  implication: string;
  recommendation: string;
};

type SupportSeed = {
  id: string;
  title: string;
  category: "delivery" | "quality" | "expectation";
  severity: "medium" | "high";
  productId: string;
  ticketVolume: string;
  evidence: string;
  implication: string;
  responseTemplateAngle: string;
};

type CustomerOpsSeed = {
  narrative: string;
  retention: RetentionSeed[];
  cx: CxSeed[];
  support: SupportSeed[];
};

export type RetentionSignalView = RetentionSeed & {
  state: "new" | "flagged" | "planned" | "acted";
  productHref: string;
  linkedDraftId?: string;
  linkedDraftHref?: string;
};

export type CxIssueView = CxSeed & {
  state: "open" | "assigned" | "resolved";
  productHref: string;
  linkedDraftId?: string;
  linkedDraftHref?: string;
};

export type SupportClusterView = SupportSeed & {
  state: "open" | "assigned" | "escalated" | "resolved";
  productHref: string;
  linkedDraftId?: string;
  linkedDraftHref?: string;
};

function buildBrandPath(brandId: string, path: string) {
  return `/brands/${brandId}${path}`;
}

const customerOpsSeeds: Record<string, CustomerOpsSeed> = {
  demo: {
    narrative:
      "Luna Skin needs to protect repeat behavior around the reset serum, tighten customer expectation-setting around travel and barrier products, and reduce support friction before it leaks into retention.",
    retention: [
      {
        id: "retention-serum-repeat-window",
        title: "Reset serum repeat window is slipping",
        segment: "First-time serum buyers",
        productId: "prod-reset-serum",
        repeatPurchaseRate: "18.7%",
        churnRisk: "high",
        evidence:
          "Customers who bought the reset serum in the last 45 days are returning more slowly than the previous cohort, despite strong first-order performance.",
        implication:
          "If the brand does not reinforce routine value after purchase, the top-performing SKU may not compound into stronger LTV.",
        recommendation:
          "Create a lifecycle plan that reinforces visible next-morning proof and why the routine matters beyond the first bottle."
      },
      {
        id: "retention-barrier-cross-sell",
        title: "Barrier cream buyers are under-indexing on second product adoption",
        segment: "Barrier cream single-SKU buyers",
        productId: "prod-barrier-cream",
        repeatPurchaseRate: "11.2%",
        churnRisk: "medium",
        evidence:
          "Barrier cream customers are converting into repeat buyers less often when they purchase the product without a routine companion SKU.",
        implication:
          "The brand has room to improve bundle and regimen framing for this audience before they disappear after the first order.",
        recommendation:
          "Flag this segment for a regimen-led retention push that makes the barrier cream feel like part of a routine, not a one-off fix."
      }
    ],
    cx: [
      {
        id: "cx-travel-kit-sizing",
        title: "Travel kit size expectations are driving returns",
        category: "returns",
        severity: "medium",
        productId: "prod-cleanse-oil",
        evidence:
          "Return comments are increasingly mentioning product size surprise after the recent landing page refresh.",
        implication:
          "This is not just a returns issue. It can quietly damage trust and repeat intent if the messaging gap stays open.",
        recommendation:
          "Assign an owner to update delivery and packaging expectations, then create a customer-facing message that clarifies what is actually included."
      },
      {
        id: "cx-barrier-delivery-message",
        title: "Barrier cream customers need clearer delivery communication",
        category: "delivery",
        severity: "high",
        productId: "prod-barrier-cream",
        evidence:
          "Support threads show a recurring pattern of delivery anxiety tied to replenishment timing on the barrier cream.",
        implication:
          "If customers are unsure when the product arrives, trust drops and the brand takes on preventable support load.",
        recommendation:
          "Create a CX alert and generate updated messaging for order-confirmation and delay scenarios."
      }
    ],
    support: [
      {
        id: "support-barrier-anxiety",
        title: "Sensitive-skin reassurance requests are clustering",
        category: "expectation",
        severity: "high",
        productId: "prod-barrier-cream",
        ticketVolume: "28 tickets / week",
        evidence:
          "Customers keep asking whether the barrier cream is safe during active flare-ups and how quickly it should feel calming.",
        implication:
          "This cluster signals a messaging gap across PDP, lifecycle copy, and support macros.",
        responseTemplateAngle:
          "Respond with reassurance, expected timeline, and where to start if the customer is highly reactive."
      },
      {
        id: "support-travel-shipping",
        title: "Travel kit shipping expectation questions are increasing",
        category: "delivery",
        severity: "medium",
        productId: "prod-cleanse-oil",
        ticketVolume: "16 tickets / week",
        evidence:
          "Shipping and included-item questions are taking up a growing share of support volume for travel-size orders.",
        implication:
          "Without clearer proactive messaging, the team will keep answering the same question manually.",
        responseTemplateAngle:
          "Create a short, low-friction response that clarifies what ships, when it arrives, and how to check the order state."
      }
    ]
  },
  solstice: {
    narrative:
      "Solstice Well should reinforce replenishment around the sleep stack, tighten delivery communication before support issues pile up, and convert recurring customer questions into cleaner lifecycle and support messaging.",
    retention: [
      {
        id: "retention-sleep-stack-repeat",
        title: "Sleep stack repeat momentum can be amplified",
        segment: "Sleep stack first-order buyers",
        productId: "prod-sleep-stack",
        repeatPurchaseRate: "24.9%",
        churnRisk: "medium",
        evidence:
          "Repeat behavior is improving, but the post-purchase sequence is still under-explaining why the bundle earns a second order.",
        implication:
          "There is a near-term opportunity to turn rising retention into a more predictable replenishment loop.",
        recommendation:
          "Create a lifecycle plan around routine consistency, better nights, and reorder timing."
      },
      {
        id: "retention-gummies-second-order",
        title: "Magnesium gummies need stronger second-order framing",
        segment: "Gummies one-time buyers",
        productId: "prod-magnesium-gummies",
        repeatPurchaseRate: "13.8%",
        churnRisk: "high",
        evidence:
          "Gummies customers convert the first order but are not seeing enough follow-up framing around habit formation and re-use.",
        implication:
          "A weak second-order story could keep a good top-of-funnel product from turning into a healthier retention contributor.",
        recommendation:
          "Flag the segment and generate retention messaging that pivots from taste to repeatable nightly use."
      }
    ],
    cx: [
      {
        id: "cx-delivery-delay-cluster",
        title: "Delivery timing complaints need proactive messaging",
        category: "delivery",
        severity: "high",
        productId: "prod-sleep-stack",
        evidence:
          "Delivery complaints now cluster enough to affect CX confidence and potentially drag on repeat purchase.",
        implication:
          "The brand needs a clearer expectation-setting message before support threads become the main delivery experience.",
        recommendation:
          "Assign an owner and generate updated post-purchase messaging for delay, shipping, and status-check scenarios."
      },
      {
        id: "cx-gummies-taste-surprise",
        title: "Taste expectations on gummies need a clearer cue",
        category: "messaging",
        severity: "medium",
        productId: "prod-magnesium-gummies",
        evidence:
          "A small but consistent set of customer comments shows that taste expectations are not fully aligned before purchase.",
        implication:
          "This is still manageable, but it is easier to fix in messaging now than let it spread into refund or support behavior.",
        recommendation:
          "Recommend a lighter pre-purchase message that sets taste expectations without scaring off intent."
      }
    ],
    support: [
      {
        id: "support-delivery-delay-macro",
        title: "Delivery-delay macro needs escalation logic",
        category: "delivery",
        severity: "high",
        productId: "prod-sleep-stack",
        ticketVolume: "34 tickets / week",
        evidence:
          "Agents are manually rewriting delivery reassurance responses instead of using a consistent escalation path.",
        implication:
          "The support team is taking unnecessary load and customers are getting inconsistent experiences.",
        responseTemplateAngle:
          "Use a clear macro that acknowledges the delay, gives the status path, and escalates only when the order passes a specific threshold."
      },
      {
        id: "support-gummies-question-cluster",
        title: "Gummies usage questions are repeating",
        category: "quality",
        severity: "medium",
        productId: "prod-magnesium-gummies",
        ticketVolume: "19 tickets / week",
        evidence:
          "Customers are repeatedly asking the same usage and timing questions after ordering the gummies.",
        implication:
          "This is a signal that the brand can reduce support volume with clearer education and a reusable response template.",
        responseTemplateAngle:
          "Answer with dosage timing, what to expect, and when consistency matters most."
      }
    ]
  }
};

function getDefaultCustomerOpsSeed(brandId: string): CustomerOpsSeed {
  const brandName = getWorkspaceBrand(brandId)?.name ?? "This brand";

  return {
    narrative:
      `${brandName} is ready for retention and CX workflows, but the customer-ops layer still needs brand-specific seeding.`,
    retention: [
      {
        id: "retention-default",
        title: "Seed the first retention segment",
        segment: "Priority customer segment",
        productId: "prod-priority-item",
        repeatPurchaseRate: "0.0%",
        churnRisk: "medium",
        evidence:
          "No real cohort data is connected yet, so this segment is a placeholder for the first lifecycle opportunity.",
        implication:
          "Once real retention data is wired up, this page should become a genuine operating surface instead of scaffolding.",
        recommendation:
          "Start by defining the first lifecycle plan you want the brand to own."
      }
    ],
    cx: [
      {
        id: "cx-default",
        title: "Seed the first CX issue cluster",
        category: "delivery",
        severity: "medium",
        productId: "prod-priority-item",
        evidence:
          "Customer-experience signals are not connected yet, but the workflow surface is ready.",
        implication:
          "Once shipping, returns, or CX tools are connected, this view should turn into a real operating queue.",
        recommendation:
          "Start by defining the core customer message the brand wants to make more proactive."
      }
    ],
    support: [
      {
        id: "support-default",
        title: "Seed the first support issue cluster",
        category: "delivery",
        severity: "medium",
        productId: "prod-priority-item",
        ticketVolume: "0 tickets / week",
        evidence:
          "Support tools are not connected yet, but the queue is ready for the first repeated issue pattern.",
        implication:
          "When real support data lands, the team will be able to route repeated questions into reusable answers and clearer messaging.",
        responseTemplateAngle:
          "Use this as a starter template for the first real issue cluster."
      }
    ]
  };
}

function getCustomerOpsSeed(brandId: string) {
  return customerOpsSeeds[brandId] ?? getDefaultCustomerOpsSeed(brandId);
}

const retentionOverrideType = "override_retention";
const cxOverrideType = "override_cx";
const supportOverrideType = "override_support";

export function getCustomerOpsNarrative(brandId: string) {
  return getCustomerOpsSeed(brandId).narrative;
}

export function listRetentionSignals(brandId: string): RetentionSignalView[] {
  return getCustomerOpsSeed(brandId).retention.map((item) => {
    const override = getRetentionOverride(brandId, item.id);

    return {
      ...item,
      state: override?.state ?? "new",
      productHref: buildBrandPath(brandId, `/products/${item.productId}`),
      linkedDraftId: override?.linkedDraftId,
      linkedDraftHref: override?.linkedDraftId
        ? buildBrandPath(brandId, `/content/drafts/${override.linkedDraftId}`)
        : undefined
    };
  });
}

export async function listRetentionSignalsAsync(
  brandId: string
): Promise<RetentionSignalView[]> {
  const hostedOverrides = shouldEnforceSupabaseHostedAccess()
    ? await listSupabaseEntityOverrides(brandId, retentionOverrideType)
    : null;

  return getCustomerOpsSeed(brandId).retention.map((item) => {
    const override = shouldEnforceSupabaseHostedAccess()
      ? hostedOverrides?.[item.id]
      : getRetentionOverride(brandId, item.id);

    return {
      ...item,
      state:
        override?.state === "flagged" || override?.state === "planned" || override?.state === "acted"
          ? override.state
          : "new",
      productHref: buildBrandPath(brandId, `/products/${item.productId}`),
      linkedDraftId: override?.linkedDraftId,
      linkedDraftHref: override?.linkedDraftId
        ? buildBrandPath(brandId, `/content/drafts/${override.linkedDraftId}`)
        : undefined
    };
  });
}

export function listCxIssues(brandId: string): CxIssueView[] {
  return getCustomerOpsSeed(brandId).cx.map((item) => {
    const override = getCxOverride(brandId, item.id);

    return {
      ...item,
      state: override?.state ?? "open",
      productHref: buildBrandPath(brandId, `/products/${item.productId}`),
      linkedDraftId: override?.linkedDraftId,
      linkedDraftHref: override?.linkedDraftId
        ? buildBrandPath(brandId, `/content/drafts/${override.linkedDraftId}`)
        : undefined
    };
  });
}

export async function listCxIssuesAsync(brandId: string): Promise<CxIssueView[]> {
  const hostedOverrides = shouldEnforceSupabaseHostedAccess()
    ? await listSupabaseEntityOverrides(brandId, cxOverrideType)
    : null;

  return getCustomerOpsSeed(brandId).cx.map((item) => {
    const override = shouldEnforceSupabaseHostedAccess()
      ? hostedOverrides?.[item.id]
      : getCxOverride(brandId, item.id);

    return {
      ...item,
      state:
        override?.state === "assigned" || override?.state === "resolved"
          ? override.state
          : "open",
      productHref: buildBrandPath(brandId, `/products/${item.productId}`),
      linkedDraftId: override?.linkedDraftId,
      linkedDraftHref: override?.linkedDraftId
        ? buildBrandPath(brandId, `/content/drafts/${override.linkedDraftId}`)
        : undefined
    };
  });
}

export function listSupportClusters(brandId: string): SupportClusterView[] {
  return getCustomerOpsSeed(brandId).support.map((item) => {
    const override = getSupportOverride(brandId, item.id);

    return {
      ...item,
      state: override?.state ?? "open",
      productHref: buildBrandPath(brandId, `/products/${item.productId}`),
      linkedDraftId: override?.linkedDraftId,
      linkedDraftHref: override?.linkedDraftId
        ? buildBrandPath(brandId, `/content/drafts/${override.linkedDraftId}`)
        : undefined
    };
  });
}

export async function listSupportClustersAsync(
  brandId: string
): Promise<SupportClusterView[]> {
  const hostedOverrides = shouldEnforceSupabaseHostedAccess()
    ? await listSupabaseEntityOverrides(brandId, supportOverrideType)
    : null;

  return getCustomerOpsSeed(brandId).support.map((item) => {
    const override = shouldEnforceSupabaseHostedAccess()
      ? hostedOverrides?.[item.id]
      : getSupportOverride(brandId, item.id);

    return {
      ...item,
      state:
        override?.state === "assigned" ||
        override?.state === "escalated" ||
        override?.state === "resolved"
          ? override.state
          : "open",
      productHref: buildBrandPath(brandId, `/products/${item.productId}`),
      linkedDraftId: override?.linkedDraftId,
      linkedDraftHref: override?.linkedDraftId
        ? buildBrandPath(brandId, `/content/drafts/${override.linkedDraftId}`)
        : undefined
    };
  });
}

export function setRetentionState(
  brandId: string,
  itemId: string,
  state: "new" | "flagged" | "planned" | "acted"
) {
  const current = getRetentionOverride(brandId, itemId);

  updateRetentionOverride(brandId, itemId, {
    state,
    updatedAt: new Date().toISOString(),
    linkedDraftId: current?.linkedDraftId
  });
}

export async function setRetentionStateAsync(
  brandId: string,
  itemId: string,
  state: "new" | "flagged" | "planned" | "acted"
) {
  if (shouldEnforceSupabaseHostedAccess()) {
    const item = getCustomerOpsSeed(brandId).retention.find((entry) => entry.id === itemId);
    const current = (await listSupabaseEntityOverrides(brandId, retentionOverrideType))?.[itemId];

    if (!item) {
      return null;
    }

    return setSupabaseEntityOverride(brandId, {
      overrideType: retentionOverrideType,
      appItemId: itemId,
      title: item.title,
      state,
      linkedDraftId: current?.linkedDraftId,
      metadata: {
        productId: item.productId,
        segment: item.segment
      }
    });
  }

  setRetentionState(brandId, itemId, state);
  return getRetentionOverride(brandId, itemId);
}

export function setCxState(
  brandId: string,
  itemId: string,
  state: "open" | "assigned" | "resolved"
) {
  const current = getCxOverride(brandId, itemId);

  updateCxOverride(brandId, itemId, {
    state,
    updatedAt: new Date().toISOString(),
    linkedDraftId: current?.linkedDraftId
  });
}

export async function setCxStateAsync(
  brandId: string,
  itemId: string,
  state: "open" | "assigned" | "resolved"
) {
  if (shouldEnforceSupabaseHostedAccess()) {
    const item = getCustomerOpsSeed(brandId).cx.find((entry) => entry.id === itemId);
    const current = (await listSupabaseEntityOverrides(brandId, cxOverrideType))?.[itemId];

    if (!item) {
      return null;
    }

    return setSupabaseEntityOverride(brandId, {
      overrideType: cxOverrideType,
      appItemId: itemId,
      title: item.title,
      state,
      linkedDraftId: current?.linkedDraftId,
      metadata: {
        productId: item.productId,
        category: item.category
      }
    });
  }

  setCxState(brandId, itemId, state);
  return getCxOverride(brandId, itemId);
}

export function setSupportState(
  brandId: string,
  itemId: string,
  state: "open" | "assigned" | "escalated" | "resolved"
) {
  const current = getSupportOverride(brandId, itemId);

  updateSupportOverride(brandId, itemId, {
    state,
    updatedAt: new Date().toISOString(),
    linkedDraftId: current?.linkedDraftId
  });
}

export async function setSupportStateAsync(
  brandId: string,
  itemId: string,
  state: "open" | "assigned" | "escalated" | "resolved"
) {
  if (shouldEnforceSupabaseHostedAccess()) {
    const item = getCustomerOpsSeed(brandId).support.find((entry) => entry.id === itemId);
    const current = (await listSupabaseEntityOverrides(brandId, supportOverrideType))?.[itemId];

    if (!item) {
      return null;
    }

    return setSupabaseEntityOverride(brandId, {
      overrideType: supportOverrideType,
      appItemId: itemId,
      title: item.title,
      state,
      linkedDraftId: current?.linkedDraftId,
      metadata: {
        productId: item.productId,
        category: item.category
      }
    });
  }

  setSupportState(brandId, itemId, state);
  return getSupportOverride(brandId, itemId);
}

export function createRetentionDraft(
  brandId: string,
  itemId: string
): WorkflowDraftView | null {
  const item = listRetentionSignals(brandId).find((entry) => entry.id === itemId);

  if (!item) {
    return null;
  }

  if (item.linkedDraftId) {
    const existing = getBrandDraft(brandId, item.linkedDraftId);

    if (existing) {
      return existing;
    }
  }

  const draft = createDraftFromProduct(brandId, item.productId, {
    title: `${item.title} lifecycle plan`,
    channel: "Lifecycle brief",
    angle: item.recommendation,
    hook: `Retention depends on making ${item.segment.toLowerCase()} feel the next step is obvious.`,
    caption: `${item.implication} ${item.recommendation}`,
    script: `Use the evidence from ${item.segment}, explain why churn risk is ${item.churnRisk}, and map the customer message to a clear lifecycle plan.`
  });

  if (!draft) {
    return null;
  }

  updateRetentionOverride(brandId, itemId, {
    state: "acted",
    updatedAt: new Date().toISOString(),
    linkedDraftId: draft.id
  });

  return draft;
}

export async function createRetentionDraftAsync(
  brandId: string,
  itemId: string
): Promise<WorkflowDraftView | null> {
  const item = (await listRetentionSignalsAsync(brandId)).find((entry) => entry.id === itemId);

  if (!item) {
    return null;
  }

  if (item.linkedDraftId) {
    const existing = await getBrandDraftAsync(brandId, item.linkedDraftId);

    if (existing) {
      return existing;
    }
  }

  const draft = await createDraftFromProductAsync(brandId, item.productId, {
    title: `${item.title} lifecycle plan`,
    channel: "Lifecycle brief",
    angle: item.recommendation,
    hook: `Retention depends on making ${item.segment.toLowerCase()} feel the next step is obvious.`,
    caption: `${item.implication} ${item.recommendation}`,
    script: `Use the evidence from ${item.segment}, explain why churn risk is ${item.churnRisk}, and map the customer message to a clear lifecycle plan.`
  });

  if (!draft) {
    return null;
  }

  if (shouldEnforceSupabaseHostedAccess()) {
    await setSupabaseEntityOverride(brandId, {
      overrideType: retentionOverrideType,
      appItemId: itemId,
      title: item.title,
      state: "acted",
      linkedDraftId: draft.id,
      metadata: {
        productId: item.productId,
        segment: item.segment
      }
    });
  } else {
    updateRetentionOverride(brandId, itemId, {
      state: "acted",
      updatedAt: new Date().toISOString(),
      linkedDraftId: draft.id
    });
  }

  return await getBrandDraftAsync(brandId, draft.id);
}

export function createCxDraft(
  brandId: string,
  itemId: string
): WorkflowDraftView | null {
  const item = listCxIssues(brandId).find((entry) => entry.id === itemId);

  if (!item) {
    return null;
  }

  if (item.linkedDraftId) {
    const existing = getBrandDraft(brandId, item.linkedDraftId);

    if (existing) {
      return existing;
    }
  }

  const draft = createDraftFromProduct(brandId, item.productId, {
    title: `${item.title} CX messaging draft`,
    channel: "CX message brief",
    angle: item.recommendation,
    hook: `Use proactive messaging to close the ${item.category} gap before it becomes a trust problem.`,
    caption: `${item.implication} ${item.recommendation}`,
    script: `Open with the recurring customer friction, explain why it matters, and write the proactive message the brand should ship next.`
  });

  if (!draft) {
    return null;
  }

  updateCxOverride(brandId, itemId, {
    state: "assigned",
    updatedAt: new Date().toISOString(),
    linkedDraftId: draft.id
  });

  return draft;
}

export async function createCxDraftAsync(
  brandId: string,
  itemId: string
): Promise<WorkflowDraftView | null> {
  const item = (await listCxIssuesAsync(brandId)).find((entry) => entry.id === itemId);

  if (!item) {
    return null;
  }

  if (item.linkedDraftId) {
    const existing = await getBrandDraftAsync(brandId, item.linkedDraftId);

    if (existing) {
      return existing;
    }
  }

  const draft = await createDraftFromProductAsync(brandId, item.productId, {
    title: `${item.title} CX messaging draft`,
    channel: "CX message brief",
    angle: item.recommendation,
    hook: `Use proactive messaging to close the ${item.category} gap before it becomes a trust problem.`,
    caption: `${item.implication} ${item.recommendation}`,
    script: `Open with the recurring customer friction, explain why it matters, and write the proactive message the brand should ship next.`
  });

  if (!draft) {
    return null;
  }

  if (shouldEnforceSupabaseHostedAccess()) {
    await setSupabaseEntityOverride(brandId, {
      overrideType: cxOverrideType,
      appItemId: itemId,
      title: item.title,
      state: "assigned",
      linkedDraftId: draft.id,
      metadata: {
        productId: item.productId,
        category: item.category
      }
    });
  } else {
    updateCxOverride(brandId, itemId, {
      state: "assigned",
      updatedAt: new Date().toISOString(),
      linkedDraftId: draft.id
    });
  }

  return await getBrandDraftAsync(brandId, draft.id);
}

export function createSupportDraft(
  brandId: string,
  itemId: string
): WorkflowDraftView | null {
  const item = listSupportClusters(brandId).find((entry) => entry.id === itemId);

  if (!item) {
    return null;
  }

  if (item.linkedDraftId) {
    const existing = getBrandDraft(brandId, item.linkedDraftId);

    if (existing) {
      return existing;
    }
  }

  const draft = createDraftFromProduct(brandId, item.productId, {
    title: `${item.title} response template`,
    channel: "Support response template",
    angle: item.responseTemplateAngle,
    hook: `Turn this repeated support issue into a reusable, trust-preserving response.`,
    caption: `${item.implication} ${item.responseTemplateAngle}`,
    script: `Use the ticket pattern, acknowledge the customer's concern, explain the correct expectation, and add the escalation boundary if needed.`
  });

  if (!draft) {
    return null;
  }

  updateSupportOverride(brandId, itemId, {
    state: "assigned",
    updatedAt: new Date().toISOString(),
    linkedDraftId: draft.id
  });

  return draft;
}

export async function createSupportDraftAsync(
  brandId: string,
  itemId: string
): Promise<WorkflowDraftView | null> {
  const item = (await listSupportClustersAsync(brandId)).find((entry) => entry.id === itemId);

  if (!item) {
    return null;
  }

  if (item.linkedDraftId) {
    const existing = await getBrandDraftAsync(brandId, item.linkedDraftId);

    if (existing) {
      return existing;
    }
  }

  const draft = await createDraftFromProductAsync(brandId, item.productId, {
    title: `${item.title} response template`,
    channel: "Support response template",
    angle: item.responseTemplateAngle,
    hook: `Turn this repeated support issue into a reusable, trust-preserving response.`,
    caption: `${item.implication} ${item.responseTemplateAngle}`,
    script: `Use the ticket pattern, acknowledge the customer's concern, explain the correct expectation, and add the escalation boundary if needed.`
  });

  if (!draft) {
    return null;
  }

  if (shouldEnforceSupabaseHostedAccess()) {
    await setSupabaseEntityOverride(brandId, {
      overrideType: supportOverrideType,
      appItemId: itemId,
      title: item.title,
      state: "assigned",
      linkedDraftId: draft.id,
      metadata: {
        productId: item.productId,
        category: item.category
      }
    });
  } else {
    updateSupportOverride(brandId, itemId, {
      state: "assigned",
      updatedAt: new Date().toISOString(),
      linkedDraftId: draft.id
    });
  }

  return await getBrandDraftAsync(brandId, draft.id);
}
