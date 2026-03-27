import "server-only";

import type { PersistedDraft, PersistedPublishJob } from "./local-persistence";
import { createSupabaseAdminClient, canUseSupabaseAdmin } from "./supabase-admin";
import { getSupabaseBrandRecord } from "./supabase-platform-data";

type DraftMetadata = {
  angle?: string;
  sourceOpportunityId?: string;
  sourceProductId?: string;
  productId?: string;
  productTitle?: string;
};

type ContentDraftRow = {
  id: string;
  title: string | null;
  channel: string;
  hook: string | null;
  caption: string | null;
  script: string | null;
  body_json: Record<string, unknown> | null;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
};

type PublishJobRow = {
  id: string;
  content_draft_id: string;
  provider: string;
  scheduled_for: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

type ApprovalRow = {
  id: string;
  status: string;
};

type DraftUpdateInput = Partial<
  Pick<PersistedDraft, "title" | "channel" | "angle" | "hook" | "caption" | "script" | "status">
>;

const draftStatuses = new Set<PersistedDraft["status"]>([
  "draft",
  "ready_for_approval",
  "changes_requested",
  "approved",
  "scheduled",
  "published",
  "rejected"
]);

const publishStatuses = new Set<PersistedPublishJob["status"]>([
  "scheduled",
  "published",
  "failed",
  "cancelled"
]);

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function isDraftStatus(value: string): value is PersistedDraft["status"] {
  return draftStatuses.has(value as PersistedDraft["status"]);
}

function isPublishStatus(value: string): value is PersistedPublishJob["status"] {
  return publishStatuses.has(value as PersistedPublishJob["status"]);
}

function normalizeDraftMetadata(value: unknown): DraftMetadata {
  if (!value || typeof value !== "object") {
    return {};
  }

  const metadata = value as Record<string, unknown>;

  return {
    angle: typeof metadata.angle === "string" ? metadata.angle : undefined,
    sourceOpportunityId:
      typeof metadata.sourceOpportunityId === "string" ? metadata.sourceOpportunityId : undefined,
    sourceProductId:
      typeof metadata.sourceProductId === "string" ? metadata.sourceProductId : undefined,
    productId: typeof metadata.productId === "string" ? metadata.productId : undefined,
    productTitle: typeof metadata.productTitle === "string" ? metadata.productTitle : undefined
  };
}

function buildDraftMetadata(
  draft: Pick<
    PersistedDraft,
    "angle" | "sourceOpportunityId" | "sourceProductId" | "productId" | "productTitle"
  >,
  existing?: Record<string, unknown> | null
) {
  const metadata: Record<string, unknown> = {
    ...(existing ?? {})
  };

  if (draft.angle) {
    metadata.angle = draft.angle;
  } else {
    delete metadata.angle;
  }

  if (draft.sourceOpportunityId) {
    metadata.sourceOpportunityId = draft.sourceOpportunityId;
  } else {
    delete metadata.sourceOpportunityId;
  }

  if (draft.sourceProductId) {
    metadata.sourceProductId = draft.sourceProductId;
  } else {
    delete metadata.sourceProductId;
  }

  if (draft.productId) {
    metadata.productId = draft.productId;
  } else {
    delete metadata.productId;
  }

  if (draft.productTitle) {
    metadata.productTitle = draft.productTitle;
  } else {
    delete metadata.productTitle;
  }

  return metadata;
}

function mapDraftRow(row: ContentDraftRow): PersistedDraft {
  const metadata = normalizeDraftMetadata(row.body_json);
  const title = readString(row.title).trim() || "Untitled draft";

  return {
    id: row.id,
    title,
    channel: readString(row.channel).trim() || "Short-form video",
    angle: metadata.angle ?? title,
    status: isDraftStatus(row.status) ? row.status : "draft",
    sourceOpportunityId: metadata.sourceOpportunityId,
    sourceProductId: metadata.sourceProductId,
    productId: metadata.productId,
    productTitle: metadata.productTitle,
    hook: readString(row.hook),
    caption: readString(row.caption),
    script: readString(row.script),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPublishJobRow(
  row: PublishJobRow,
  draftMap: Map<string, PersistedDraft>
): PersistedPublishJob {
  const draft = draftMap.get(row.content_draft_id);
  const status = isPublishStatus(row.status) ? row.status : "scheduled";

  return {
    id: row.id,
    draftId: row.content_draft_id,
    draftTitle: draft?.title ?? "Workflow draft",
    channel: draft?.channel ?? "Short-form video",
    status,
    scheduledFor: row.scheduled_for ?? row.updated_at,
    updatedAt: row.updated_at,
    publishedAt: status === "published" ? row.updated_at : undefined,
    failureReason: row.error_message ?? undefined
  };
}

async function getWorkflowContext(brandId: string) {
  if (!canUseSupabaseAdmin()) {
    return null;
  }

  const brand = await getSupabaseBrandRecord(brandId);

  if (!brand) {
    return null;
  }

  return {
    brand,
    supabase: createSupabaseAdminClient()
  };
}

async function getBrandUserIdByEmail(
  brandUuid: string,
  email?: string
) {
  if (!email) {
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("brand_users")
      .select("id")
      .eq("brand_id", brandUuid)
      .eq("email", email.trim().toLowerCase())
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return String((data as { id: string }).id);
  } catch {
    return null;
  }
}

async function getDraftRow(
  brandUuid: string,
  draftId: string
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("content_drafts")
      .select("id, title, channel, hook, caption, script, body_json, status, version, created_at, updated_at")
      .eq("brand_id", brandUuid)
      .eq("id", draftId)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as ContentDraftRow;
  } catch {
    return null;
  }
}

async function getApprovalRow(
  brandUuid: string,
  draftId: string
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("approvals")
      .select("id, status")
      .eq("brand_id", brandUuid)
      .eq("target_type", "content_draft")
      .eq("target_id", draftId)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as ApprovalRow;
  } catch {
    return null;
  }
}

async function getPublishJobRow(
  brandUuid: string,
  jobId: string
) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("publish_jobs")
      .select("id, content_draft_id, provider, scheduled_for, status, error_message, created_at, updated_at")
      .eq("brand_id", brandUuid)
      .eq("id", jobId)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as PublishJobRow;
  } catch {
    return null;
  }
}

async function writeApprovalState(
  brandUuid: string,
  draftId: string,
  status: "pending_approval" | "changes_requested" | "approved" | "rejected",
  actorEmail?: string
) {
  const actorId = await getBrandUserIdByEmail(brandUuid, actorEmail);
  const now = new Date().toISOString();
  const existing = await getApprovalRow(brandUuid, draftId);
  const supabase = createSupabaseAdminClient();

  const payload = {
    brand_id: brandUuid,
    target_type: "content_draft",
    target_id: draftId,
    requested_by: actorId,
    assigned_to: null,
    status,
    decision_notes: null,
    requested_at: status === "pending_approval" ? now : undefined,
    decided_at: status === "pending_approval" ? null : now
  };

  let approvalId = existing?.id ?? null;

  if (existing) {
    const { error } = await supabase
      .from("approvals")
      .update(payload)
      .eq("id", existing.id)
      .eq("brand_id", brandUuid);

    if (error) {
      return null;
    }
  } else {
    const { data, error } = await supabase
      .from("approvals")
      .insert(payload)
      .select("id")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    approvalId = String((data as { id: string }).id);
  }

  if (!approvalId) {
    return null;
  }

  const eventType =
    status === "pending_approval"
      ? "requested"
      : status === "approved"
        ? "approved"
        : status === "changes_requested"
          ? "changes_requested"
          : "rejected";

  await supabase.from("approval_events").insert({
    approval_id: approvalId,
    actor_id: actorId,
    event_type: eventType,
    notes: null
  });

  return approvalId;
}

async function writePublishEvent(
  publishJobId: string,
  eventType: string,
  payload: Record<string, unknown> | null = null
) {
  try {
    const supabase = createSupabaseAdminClient();

    await supabase.from("publish_events").insert({
      publish_job_id: publishJobId,
      event_type: eventType,
      payload_json: payload ?? {}
    });
  } catch {
    // Best-effort audit trail only.
  }
}

export async function listSupabaseWorkflowDrafts(
  brandId: string
): Promise<PersistedDraft[] | null> {
  const context = await getWorkflowContext(brandId);

  if (!context) {
    return null;
  }

  try {
    const { data, error } = await context.supabase
      .from("content_drafts")
      .select("id, title, channel, hook, caption, script, body_json, status, version, created_at, updated_at")
      .eq("brand_id", context.brand.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return null;
    }

    return ((data ?? []) as ContentDraftRow[]).map(mapDraftRow);
  } catch {
    return null;
  }
}

export async function getSupabaseWorkflowDraft(
  brandId: string,
  draftId: string
): Promise<PersistedDraft | null> {
  const context = await getWorkflowContext(brandId);

  if (!context) {
    return null;
  }

  const row = await getDraftRow(context.brand.id, draftId);

  return row ? mapDraftRow(row) : null;
}

export async function createSupabaseWorkflowDraft(
  brandId: string,
  draft: Omit<PersistedDraft, "id" | "createdAt" | "updatedAt">,
  actorEmail?: string
): Promise<PersistedDraft | null> {
  const context = await getWorkflowContext(brandId);

  if (!context) {
    return null;
  }

  const createdBy = await getBrandUserIdByEmail(context.brand.id, actorEmail);

  try {
    const { data, error } = await context.supabase
      .from("content_drafts")
      .insert({
        brand_id: context.brand.id,
        source_type: draft.sourceOpportunityId ? "opportunity" : draft.sourceProductId ? "product" : null,
        source_id: null,
        format: "short_form_video",
        channel: draft.channel,
        title: draft.title,
        hook: draft.hook,
        caption: draft.caption,
        script: draft.script,
        body_json: buildDraftMetadata(draft),
        status: draft.status,
        version: 1,
        created_by: createdBy
      })
      .select("id, title, channel, hook, caption, script, body_json, status, version, created_at, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapDraftRow(data as ContentDraftRow);
  } catch {
    return null;
  }
}

export async function updateSupabaseWorkflowDraft(
  brandId: string,
  draftId: string,
  updates: DraftUpdateInput
): Promise<PersistedDraft | null> {
  const context = await getWorkflowContext(brandId);

  if (!context) {
    return null;
  }

  const currentRow = await getDraftRow(context.brand.id, draftId);

  if (!currentRow) {
    return null;
  }

  const currentDraft = mapDraftRow(currentRow);
  const nextDraft: PersistedDraft = {
    ...currentDraft,
    title: updates.title ?? currentDraft.title,
    channel: updates.channel ?? currentDraft.channel,
    angle: updates.angle ?? currentDraft.angle,
    hook: updates.hook ?? currentDraft.hook,
    caption: updates.caption ?? currentDraft.caption,
    script: updates.script ?? currentDraft.script,
    status: updates.status ?? currentDraft.status,
    updatedAt: new Date().toISOString()
  };

  try {
    const { data, error } = await context.supabase
      .from("content_drafts")
      .update({
        channel: nextDraft.channel,
        title: nextDraft.title,
        hook: nextDraft.hook,
        caption: nextDraft.caption,
        script: nextDraft.script,
        body_json: buildDraftMetadata(nextDraft, currentRow.body_json),
        status: nextDraft.status,
        version: (currentRow.version ?? 1) + 1,
        updated_at: nextDraft.updatedAt
      })
      .eq("brand_id", context.brand.id)
      .eq("id", draftId)
      .select("id, title, channel, hook, caption, script, body_json, status, version, created_at, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapDraftRow(data as ContentDraftRow);
  } catch {
    return null;
  }
}

export async function markSupabaseDraftReadyForApproval(
  brandId: string,
  draftId: string,
  actorEmail?: string
): Promise<PersistedDraft | null> {
  const context = await getWorkflowContext(brandId);

  if (!context) {
    return null;
  }

  const draft = await updateSupabaseWorkflowDraft(brandId, draftId, {
    status: "ready_for_approval"
  });

  if (!draft) {
    return null;
  }

  await writeApprovalState(context.brand.id, draftId, "pending_approval", actorEmail);

  return draft;
}

export async function approveSupabaseDraft(
  brandId: string,
  draftId: string,
  actorEmail?: string
): Promise<PersistedDraft | null> {
  const context = await getWorkflowContext(brandId);

  if (!context) {
    return null;
  }

  const draft = await updateSupabaseWorkflowDraft(brandId, draftId, {
    status: "approved"
  });

  if (!draft) {
    return null;
  }

  await writeApprovalState(context.brand.id, draftId, "approved", actorEmail);

  return draft;
}

export async function requestSupabaseDraftChanges(
  brandId: string,
  draftId: string,
  actorEmail?: string
): Promise<PersistedDraft | null> {
  const context = await getWorkflowContext(brandId);

  if (!context) {
    return null;
  }

  const draft = await updateSupabaseWorkflowDraft(brandId, draftId, {
    status: "changes_requested"
  });

  if (!draft) {
    return null;
  }

  await writeApprovalState(context.brand.id, draftId, "changes_requested", actorEmail);

  return draft;
}

export async function rejectSupabaseDraft(
  brandId: string,
  draftId: string,
  actorEmail?: string
): Promise<PersistedDraft | null> {
  const context = await getWorkflowContext(brandId);

  if (!context) {
    return null;
  }

  const draft = await updateSupabaseWorkflowDraft(brandId, draftId, {
    status: "rejected"
  });

  if (!draft) {
    return null;
  }

  await writeApprovalState(context.brand.id, draftId, "rejected", actorEmail);

  return draft;
}

export async function listSupabaseWorkflowPublishJobs(
  brandId: string
): Promise<PersistedPublishJob[] | null> {
  const context = await getWorkflowContext(brandId);

  if (!context) {
    return null;
  }

  const drafts = await listSupabaseWorkflowDrafts(brandId);
  const draftMap = new Map((drafts ?? []).map((draft) => [draft.id, draft] as const));

  try {
    const { data, error } = await context.supabase
      .from("publish_jobs")
      .select("id, content_draft_id, provider, scheduled_for, status, error_message, created_at, updated_at")
      .eq("brand_id", context.brand.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return null;
    }

    return ((data ?? []) as PublishJobRow[]).map((row) => mapPublishJobRow(row, draftMap));
  } catch {
    return null;
  }
}

export async function scheduleSupabaseDraftForPublishing(
  brandId: string,
  draftId: string
): Promise<PersistedPublishJob | null> {
  const context = await getWorkflowContext(brandId);

  if (!context) {
    return null;
  }

  const draft = await getSupabaseWorkflowDraft(brandId, draftId);

  if (!draft) {
    return null;
  }

  const scheduledFor = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await context.supabase
      .from("publish_jobs")
      .insert({
        brand_id: context.brand.id,
        content_draft_id: draftId,
        provider: "manual",
        scheduled_for: scheduledFor,
        status: "scheduled"
      })
      .select("id, content_draft_id, provider, scheduled_for, status, error_message, created_at, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    await updateSupabaseWorkflowDraft(brandId, draftId, {
      status: "scheduled"
    });
    await writePublishEvent(String((data as PublishJobRow).id), "scheduled", {
      scheduledFor
    });

    return mapPublishJobRow(data as PublishJobRow, new Map([[draftId, draft]]));
  } catch {
    return null;
  }
}

export async function publishSupabaseDraftNow(
  brandId: string,
  draftId: string
): Promise<PersistedPublishJob | null> {
  const context = await getWorkflowContext(brandId);

  if (!context) {
    return null;
  }

  const draft = await getSupabaseWorkflowDraft(brandId, draftId);

  if (!draft) {
    return null;
  }

  const publishedAt = new Date().toISOString();

  try {
    const { data, error } = await context.supabase
      .from("publish_jobs")
      .insert({
        brand_id: context.brand.id,
        content_draft_id: draftId,
        provider: "manual",
        scheduled_for: publishedAt,
        status: "published"
      })
      .select("id, content_draft_id, provider, scheduled_for, status, error_message, created_at, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    await updateSupabaseWorkflowDraft(brandId, draftId, {
      status: "published"
    });
    await writePublishEvent(String((data as PublishJobRow).id), "published", {
      publishedAt
    });

    return mapPublishJobRow(data as PublishJobRow, new Map([[draftId, draft]]));
  } catch {
    return null;
  }
}

export async function retrySupabasePublishJob(
  brandId: string,
  jobId: string
): Promise<PersistedPublishJob | null> {
  const context = await getWorkflowContext(brandId);

  if (!context) {
    return null;
  }

  const currentRow = await getPublishJobRow(context.brand.id, jobId);

  if (!currentRow) {
    return null;
  }

  const nextScheduledFor = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await context.supabase
      .from("publish_jobs")
      .update({
        status: "scheduled",
        scheduled_for: nextScheduledFor,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq("brand_id", context.brand.id)
      .eq("id", jobId)
      .select("id, content_draft_id, provider, scheduled_for, status, error_message, created_at, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    await updateSupabaseWorkflowDraft(brandId, currentRow.content_draft_id, {
      status: "scheduled"
    });
    await writePublishEvent(jobId, "retried", {
      scheduledFor: nextScheduledFor
    });

    const draft = await getSupabaseWorkflowDraft(brandId, currentRow.content_draft_id);

    return mapPublishJobRow(
      data as PublishJobRow,
      new Map(draft ? [[draft.id, draft]] : [])
    );
  } catch {
    return null;
  }
}

export async function cancelSupabasePublishJob(
  brandId: string,
  jobId: string
): Promise<PersistedPublishJob | null> {
  const context = await getWorkflowContext(brandId);

  if (!context) {
    return null;
  }

  const currentRow = await getPublishJobRow(context.brand.id, jobId);

  if (!currentRow) {
    return null;
  }

  try {
    const { data, error } = await context.supabase
      .from("publish_jobs")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("brand_id", context.brand.id)
      .eq("id", jobId)
      .select("id, content_draft_id, provider, scheduled_for, status, error_message, created_at, updated_at")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    await updateSupabaseWorkflowDraft(brandId, currentRow.content_draft_id, {
      status: "approved"
    });
    await writePublishEvent(jobId, "cancelled");

    const draft = await getSupabaseWorkflowDraft(brandId, currentRow.content_draft_id);

    return mapPublishJobRow(
      data as PublishJobRow,
      new Map(draft ? [[draft.id, draft]] : [])
    );
  } catch {
    return null;
  }
}
