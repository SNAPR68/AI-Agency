import "server-only";

import { randomUUID } from "node:crypto";
import {
  getPersistedPublishJob,
  listPersistedPublishJobs,
  type PersistedDraft,
  type PersistedPublishJob,
  upsertPersistedPublishJob
} from "./local-persistence";
import {
  getBrandDraft,
  listBrandDrafts,
  updateDraftContent,
  type WorkflowDraftView
} from "./growth-workflow-data";

export type ApprovalItemView = WorkflowDraftView & {
  reviewState: "pending" | "changes_requested" | "approved" | "rejected";
};

export type PublishJobView = PersistedPublishJob & {
  draftHref: string;
  updatedAtLabel: string;
  scheduledForLabel: string;
  publishedAtLabel?: string;
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

function reviewRank(status: PersistedDraft["status"]) {
  switch (status) {
    case "ready_for_approval":
      return 0;
    case "changes_requested":
      return 1;
    case "approved":
      return 2;
    case "rejected":
      return 3;
    default:
      return 4;
  }
}

function publishRank(status: PersistedPublishJob["status"]) {
  switch (status) {
    case "failed":
      return 0;
    case "scheduled":
      return 1;
    case "published":
      return 2;
    case "cancelled":
      return 3;
    default:
      return 4;
  }
}

function mapApprovalState(status: PersistedDraft["status"]): ApprovalItemView["reviewState"] {
  if (status === "ready_for_approval") {
    return "pending";
  }

  if (status === "changes_requested") {
    return "changes_requested";
  }

  if (status === "rejected") {
    return "rejected";
  }

  return "approved";
}

function isApprovalStatus(status: PersistedDraft["status"]) {
  return (
    status === "ready_for_approval" ||
    status === "changes_requested" ||
    status === "approved" ||
    status === "rejected"
  );
}

const publishJobSeeds: Record<string, PersistedPublishJob[]> = {
  demo: [
    {
      id: "job-demo-reset-scheduled",
      draftId: "draft-reset-approved",
      draftTitle: "Reset serum paid hook set",
      channel: "Paid Social",
      status: "scheduled",
      scheduledFor: "2026-03-27T18:30:00Z",
      updatedAt: "2026-03-25T09:10:00Z"
    },
    {
      id: "job-demo-reset-failed",
      draftId: "draft-reset-approved",
      draftTitle: "Reset serum paid hook set",
      channel: "Paid Social",
      status: "failed",
      scheduledFor: "2026-03-24T18:00:00Z",
      updatedAt: "2026-03-24T18:10:00Z",
      failureReason: "Meta publish token expired before delivery."
    }
  ],
  solstice: [
    {
      id: "job-solstice-sleep-scheduled",
      draftId: "draft-sleep-approved",
      draftTitle: "Sleep stack refresh pack",
      channel: "Instagram Reels",
      status: "scheduled",
      scheduledFor: "2026-03-27T16:00:00Z",
      updatedAt: "2026-03-25T08:40:00Z"
    },
    {
      id: "job-solstice-sleep-published",
      draftId: "draft-sleep-approved",
      draftTitle: "Sleep stack refresh pack",
      channel: "Instagram Reels",
      status: "published",
      scheduledFor: "2026-03-24T15:00:00Z",
      updatedAt: "2026-03-24T15:05:00Z",
      publishedAt: "2026-03-24T15:04:00Z"
    }
  ]
};

function getSeedPublishJobs(brandId: string) {
  return publishJobSeeds[brandId] ?? [];
}

function toPublishJobMap(brandId: string) {
  const seedMap = new Map(
    getSeedPublishJobs(brandId).map((job) => [job.id, job] as const)
  );

  for (const job of listPersistedPublishJobs(brandId)) {
    seedMap.set(job.id, job);
  }

  return seedMap;
}

export function formatDraftStatusLabel(status: PersistedDraft["status"]) {
  return status.replaceAll("_", " ");
}

export function listApprovalItems(brandId: string): ApprovalItemView[] {
  return listBrandDrafts(brandId)
    .filter((draft) => isApprovalStatus(draft.status))
    .sort((left, right) => {
      const rankDelta = reviewRank(left.status) - reviewRank(right.status);

      if (rankDelta !== 0) {
        return rankDelta;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    })
    .map((draft) => ({
      ...draft,
      reviewState: mapApprovalState(draft.status)
    }));
}

export function approveDraft(brandId: string, draftId: string) {
  return updateDraftContent(brandId, draftId, {
    status: "approved"
  });
}

export function requestDraftChanges(brandId: string, draftId: string) {
  return updateDraftContent(brandId, draftId, {
    status: "changes_requested"
  });
}

export function rejectDraft(brandId: string, draftId: string) {
  return updateDraftContent(brandId, draftId, {
    status: "rejected"
  });
}

export function listReadyToPublishDrafts(brandId: string): WorkflowDraftView[] {
  const jobs = listPublishJobs(brandId);
  const activeDraftIds = new Set(
    jobs
      .filter((job) => job.status === "scheduled" || job.status === "published")
      .map((job) => job.draftId)
  );

  return listBrandDrafts(brandId).filter(
    (draft) => draft.status === "approved" && !activeDraftIds.has(draft.id)
  );
}

export function listPublishJobs(brandId: string): PublishJobView[] {
  return Array.from(toPublishJobMap(brandId).values())
    .sort((left, right) => {
      const rankDelta = publishRank(left.status) - publishRank(right.status);

      if (rankDelta !== 0) {
        return rankDelta;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    })
    .map((job) => ({
      ...job,
      draftHref: buildBrandPath(brandId, `/content/drafts/${job.draftId}`),
      updatedAtLabel: formatTimestampLabel(job.updatedAt),
      scheduledForLabel: formatTimestampLabel(job.scheduledFor),
      publishedAtLabel: job.publishedAt
        ? formatTimestampLabel(job.publishedAt)
        : undefined
    }));
}

function buildPublishJob(
  draft: WorkflowDraftView,
  status: PersistedPublishJob["status"]
): PersistedPublishJob {
  const now = new Date();
  const scheduledFor =
    status === "published"
      ? now.toISOString()
      : new Date(now.getTime() + 60 * 60 * 1000).toISOString();

  return {
    id: `job-${randomUUID().slice(0, 8)}`,
    draftId: draft.id,
    draftTitle: draft.title,
    channel: draft.channel,
    status,
    scheduledFor,
    updatedAt: now.toISOString(),
    publishedAt: status === "published" ? now.toISOString() : undefined
  };
}

export function scheduleDraftForPublishing(
  brandId: string,
  draftId: string
): PublishJobView | null {
  const draft = getBrandDraft(brandId, draftId);

  if (!draft) {
    return null;
  }

  const job = buildPublishJob(draft, "scheduled");
  upsertPersistedPublishJob(brandId, job);
  updateDraftContent(brandId, draftId, {
    status: "scheduled"
  });

  return listPublishJobs(brandId).find((item) => item.id === job.id) ?? null;
}

export function publishDraftNow(
  brandId: string,
  draftId: string
): PublishJobView | null {
  const draft = getBrandDraft(brandId, draftId);

  if (!draft) {
    return null;
  }

  const job = buildPublishJob(draft, "published");
  upsertPersistedPublishJob(brandId, job);
  updateDraftContent(brandId, draftId, {
    status: "published"
  });

  return listPublishJobs(brandId).find((item) => item.id === job.id) ?? null;
}

export function retryPublishJob(brandId: string, jobId: string): PublishJobView | null {
  const existing = getPersistedPublishJob(brandId, jobId) ?? toPublishJobMap(brandId).get(jobId);

  if (!existing) {
    return null;
  }

  const nextScheduledFor = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const nextJob: PersistedPublishJob = {
    ...existing,
    status: "scheduled",
    scheduledFor: nextScheduledFor,
    updatedAt: new Date().toISOString(),
    publishedAt: undefined,
    failureReason: undefined
  };

  upsertPersistedPublishJob(brandId, nextJob);
  updateDraftContent(brandId, existing.draftId, {
    status: "scheduled"
  });

  return listPublishJobs(brandId).find((item) => item.id === jobId) ?? null;
}

export function cancelPublishJob(brandId: string, jobId: string): PublishJobView | null {
  const existing = getPersistedPublishJob(brandId, jobId) ?? toPublishJobMap(brandId).get(jobId);

  if (!existing) {
    return null;
  }

  const nextJob: PersistedPublishJob = {
    ...existing,
    status: "cancelled",
    updatedAt: new Date().toISOString()
  };

  upsertPersistedPublishJob(brandId, nextJob);
  updateDraftContent(brandId, existing.draftId, {
    status: "approved"
  });

  return listPublishJobs(brandId).find((item) => item.id === jobId) ?? null;
}
