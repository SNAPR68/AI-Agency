export type IntegrationProvider = "shopify" | "meta" | "ga4";

export type OpportunityStatus = "open" | "accepted" | "dismissed" | "completed";

export type ContentDraftStatus =
  | "draft"
  | "pending_approval"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "published"
  | "failed";

export type Brand = {
  id: string;
  name: string;
  slug: string;
  vertical?: string;
  gmvBand?: string;
  timezone: string;
  status: string;
};

export type Opportunity = {
  id: string;
  brandId: string;
  type: string;
  title: string;
  priorityScore?: number;
  confidenceScore?: number;
  status: OpportunityStatus;
};

export type WeeklyBrief = {
  id: string;
  brandId: string;
  weekStart: string;
  weekEnd: string;
  summaryMd: string;
  topWins: string[];
  topRisks: string[];
  nextActions: string[];
};

export type ContentDraft = {
  id: string;
  brandId: string;
  contentPlanId?: string;
  format: string;
  channel: string;
  title?: string;
  hook?: string;
  caption?: string;
  script?: string;
  status: ContentDraftStatus;
  version: number;
};

