import "server-only";

import { listBrandDrafts, type WorkflowDraftView } from "./growth-workflow-data";
import {
  listPublishJobs,
  listReadyToPublishDrafts,
  type PublishJobView
} from "./workflow-execution-data";

export type CalendarScheduledItem = {
  id: string;
  title: string;
  channel: string;
  status: "scheduled" | "published";
  summary: string;
  timeLabel: string;
  draftHref: string;
  cancelHref?: string;
};

export type CalendarDayView = {
  id: string;
  label: string;
  fullLabel: string;
  items: CalendarScheduledItem[];
};

export type CalendarBacklogGroup = {
  id: "drafting" | "approval" | "ready";
  title: string;
  description: string;
  items: WorkflowDraftView[];
};

function formatDayLabel(value: Date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric"
  }).format(value);
}

function formatFullDayLabel(value: Date) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "numeric"
  }).format(value);
}

function formatTimeLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function startOfWeek(value: Date) {
  const next = new Date(value);
  const day = next.getDay();
  const delta = day === 0 ? -6 : 1 - day;

  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + delta);

  return next;
}

function buildWeekDays(anchor: Date) {
  const start = startOfWeek(anchor);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return current;
  });
}

function getAnchorDate(jobs: PublishJobView[]) {
  const firstScheduled = jobs[0];

  if (!firstScheduled) {
    return new Date();
  }

  return new Date(firstScheduled.scheduledFor);
}

function resolveJobTimestamp(job: PublishJobView) {
  return job.status === "published" ? job.publishedAt ?? job.scheduledFor : job.scheduledFor;
}

function isCalendarJob(
  job: PublishJobView
): job is PublishJobView & { status: "scheduled" | "published" } {
  return job.status === "scheduled" || job.status === "published";
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function getContentCalendarNarrative(brandId: string) {
  const jobs = listPublishJobs(brandId);
  const readyDrafts = listReadyToPublishDrafts(brandId);

  if (jobs.length === 0 && readyDrafts.length === 0) {
    return "The calendar is ready, but there is no scheduled or approval-cleared work yet. Use the content studio to create the next batch of assets.";
  }

  return "Use the calendar to see what is already committed to the week, what still needs review, and which approved assets are waiting for a scheduling decision.";
}

export function listCalendarDays(brandId: string): CalendarDayView[] {
  const jobs = listPublishJobs(brandId).filter(isCalendarJob);
  const days = buildWeekDays(getAnchorDate(jobs));

  return days.map((day) => {
    const items = jobs
      .filter((job) => isSameDay(new Date(resolveJobTimestamp(job)), day))
      .sort(
        (left, right) =>
          new Date(resolveJobTimestamp(left)).getTime() -
          new Date(resolveJobTimestamp(right)).getTime()
      )
      .map((job) => ({
        id: job.id,
        title: job.draftTitle,
        channel: job.channel,
        status: job.status,
        summary:
          job.status === "published"
            ? `Published ${job.publishedAtLabel ?? job.updatedAtLabel}`
            : `Scheduled for ${job.scheduledForLabel}`,
        timeLabel: formatTimeLabel(resolveJobTimestamp(job)),
        draftHref: job.draftHref,
        cancelHref:
          job.status === "scheduled"
            ? `/api/brands/${brandId}/publishing/jobs/${job.id}/cancel`
            : undefined
      }));

    return {
      id: day.toISOString(),
      label: formatDayLabel(day),
      fullLabel: formatFullDayLabel(day),
      items
    };
  });
}

export function listCalendarBacklogGroups(brandId: string): CalendarBacklogGroup[] {
  const drafts = listBrandDrafts(brandId);

  return [
    {
      id: "drafting",
      title: "Drafting",
      description: "Work still being shaped before it is ready for review.",
      items: drafts.filter(
        (draft) =>
          draft.status === "draft" ||
          draft.status === "changes_requested" ||
          draft.status === "rejected"
      )
    },
    {
      id: "approval",
      title: "Awaiting approval",
      description: "Drafts that are ready for a reviewer to approve or send back.",
      items: drafts.filter((draft) => draft.status === "ready_for_approval")
    },
    {
      id: "ready",
      title: "Ready to schedule",
      description: "Approved work that is not yet committed to the publishing calendar.",
      items: listReadyToPublishDrafts(brandId)
    }
  ];
}
