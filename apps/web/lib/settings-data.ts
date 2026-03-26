import "server-only";

import { randomUUID } from "node:crypto";
import {
  getAppRepository,
  type RepositoryAutomationSeed,
  type RepositoryAutomationSettingsSeed,
  type RepositoryBrandMemorySeed,
  type RepositoryTeamMemberSeed
} from "./app-repository";
import {
  formatWorkspaceRole,
  type WorkspaceRole
} from "./workspace";
import { getWorkspaceBrand, getWorkspaceMembers } from "./workspace-data";

export type BrandMemoryView = RepositoryBrandMemorySeed & {
  brandName: string;
  updatedAtLabel: string;
};

export type TeamMemberView = RepositoryTeamMemberSeed & {
  roleLabel: string;
  statusLabel: string;
};

export type AutomationView = RepositoryAutomationSeed & {
  lastRunLabel?: string;
  nextRunLabel?: string;
};

export type AutomationSettingsView = RepositoryAutomationSettingsSeed & {
  updatedAtLabel: string;
};

type InviteTeamMemberInput = {
  name: string;
  email: string;
  title: string;
  role: WorkspaceRole;
};

type EditAutomationInput = {
  name: string;
  scope: string;
  summary: string;
  triggerLabel: string;
};

function formatTimestampLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function buildNow() {
  return new Date().toISOString();
}

const validRoles: WorkspaceRole[] = [
  "owner",
  "founder",
  "growth_marketer",
  "content_lead",
  "ecommerce_manager",
  "operator"
];

function getDefaultBrandMemory(brandId: string): RepositoryBrandMemorySeed {
  const brandName = getWorkspaceBrand(brandId)?.name ?? "This brand";

  return {
    positioning: `${brandName} needs a sharper positioning layer once real brand strategy inputs are connected.`,
    targetCustomer: "Define the buyer this workspace is supposed to prioritize first.",
    tone: "Calm, clear, trustworthy.",
    heroProducts: ["Hero product"],
    doSay: ["real proof", "clear value"],
    dontSay: ["generic hype", "category clichés"],
    customerPersonas: ["Primary buyer"],
    updatedAt: "2026-03-25T12:00:00Z"
  };
}

function getBaseBrandMemory(brandId: string) {
  return getAppRepository().getBrandMemorySeed(brandId) ?? getDefaultBrandMemory(brandId);
}

function getSeedInvites(brandId: string) {
  return getAppRepository().listTeamSeedMembers(brandId);
}

function getSeedAutomations(brandId: string) {
  return getAppRepository().listAutomationSeeds(brandId);
}

function getSeedAutomationSettings(brandId: string) {
  return (
    getAppRepository().getAutomationSettingsSeed(brandId) ?? {
      approvalMode: "always_review",
      autoPublishMode: "never",
      alertSensitivity: "normal",
      weeklyBriefCadence: "monday_am",
      updatedAt: "2026-03-25T12:00:00Z"
    }
  );
}

function toTeamMemberView(member: RepositoryTeamMemberSeed): TeamMemberView {
  return {
    ...member,
    roleLabel: formatWorkspaceRole(member.role),
    statusLabel: member.status.replaceAll("_", " ")
  };
}

export function isWorkspaceRole(value: string): value is WorkspaceRole {
  return validRoles.includes(value as WorkspaceRole);
}

export function getBrandMemoryProfile(brandId: string): BrandMemoryView {
  const brand = getWorkspaceBrand(brandId);
  const profile = getBaseBrandMemory(brandId);

  return {
    ...profile,
    brandName: brand?.name ?? "Brand Workspace",
    updatedAtLabel: formatTimestampLabel(profile.updatedAt)
  };
}

export function saveBrandMemoryProfile(
  brandId: string,
  input: Omit<RepositoryBrandMemorySeed, "updatedAt">
): BrandMemoryView {
  const next: RepositoryBrandMemorySeed = {
    ...input,
    updatedAt: buildNow()
  };

  const saved = getAppRepository().saveBrandMemory(brandId, next) ?? next;

  return {
    ...saved,
    brandName: getWorkspaceBrand(brandId)?.name ?? "Brand Workspace",
    updatedAtLabel: formatTimestampLabel(saved.updatedAt)
  };
}

export function listSettingsTeamMembers(brandId: string): TeamMemberView[] {
  const baseMembers = new Map<string, RepositoryTeamMemberSeed>(
    getWorkspaceMembers(brandId).map((member) => [
      member.id,
      {
        id: member.id,
        name: member.name,
        email: member.email,
        title: member.title,
        role: member.role,
        status: "active" as const,
        updatedAt: "2026-03-25T09:00:00Z"
      } satisfies RepositoryTeamMemberSeed
    ])
  );

  for (const member of getSeedInvites(brandId)) {
    baseMembers.set(member.id, member);
  }

  return Array.from(baseMembers.values())
    .sort((left, right) => {
      if (left.status !== right.status) {
        return String(left.status).localeCompare(String(right.status));
      }

      return left.name.localeCompare(right.name);
    })
    .map(toTeamMemberView);
}

export function inviteTeamMember(
  brandId: string,
  input: InviteTeamMemberInput
): TeamMemberView {
  const now = buildNow();
  const member: RepositoryTeamMemberSeed = {
    id: randomUUID(),
    name: input.name,
    email: input.email.toLowerCase(),
    title: input.title,
    role: input.role,
    status: "invited",
    updatedAt: now,
    invitedAt: now,
    lastNotifiedAt: now
  };

  const saved = getAppRepository().upsertTeamMember(brandId, member) ?? member;

  return toTeamMemberView(saved);
}

export function changeTeamMemberRole(
  brandId: string,
  memberId: string,
  role: WorkspaceRole
): TeamMemberView | null {
  const existing = listSettingsTeamMembers(brandId).find((member) => member.id === memberId);

  if (!existing) {
    return null;
  }

  const next: RepositoryTeamMemberSeed = {
    id: existing.id,
    name: existing.name,
    email: existing.email,
    title: existing.title,
    role,
    status: existing.status,
    updatedAt: buildNow(),
    invitedAt: existing.invitedAt,
    lastNotifiedAt: existing.lastNotifiedAt
  };

  const saved = getAppRepository().upsertTeamMember(brandId, next);

  return saved ? toTeamMemberView(saved) : null;
}

export function resendTeamInvite(
  brandId: string,
  memberId: string
): TeamMemberView | null {
  const existing = listSettingsTeamMembers(brandId).find((member) => member.id === memberId);

  if (!existing) {
    return null;
  }

  const now = buildNow();
  const next: RepositoryTeamMemberSeed = {
    id: existing.id,
    name: existing.name,
    email: existing.email,
    title: existing.title,
    role: existing.role,
    status: "invited",
    updatedAt: now,
    invitedAt: existing.invitedAt ?? now,
    lastNotifiedAt: now
  };

  const saved = getAppRepository().upsertTeamMember(brandId, next);

  return saved ? toTeamMemberView(saved) : null;
}

export function removeTeamMember(
  brandId: string,
  memberId: string
): TeamMemberView | null {
  const existing = listSettingsTeamMembers(brandId).find((member) => member.id === memberId);

  if (!existing) {
    return null;
  }

  const next: RepositoryTeamMemberSeed = {
    id: existing.id,
    name: existing.name,
    email: existing.email,
    title: existing.title,
    role: existing.role,
    status: "removed",
    updatedAt: buildNow(),
    invitedAt: existing.invitedAt,
    lastNotifiedAt: existing.lastNotifiedAt
  };

  const saved = getAppRepository().upsertTeamMember(brandId, next);

  return saved ? toTeamMemberView(saved) : null;
}

export function listAutomationPolicies(brandId: string): AutomationView[] {
  return getSeedAutomations(brandId)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((automation) => ({
      ...automation,
      lastRunLabel: automation.lastRunAt
        ? formatTimestampLabel(automation.lastRunAt)
        : undefined,
      nextRunLabel: automation.nextRunAt
        ? formatTimestampLabel(automation.nextRunAt)
        : undefined
    }));
}

export function createAutomationPolicy(
  brandId: string,
  input: EditAutomationInput & { policyType: string }
): AutomationView {
  const automation: RepositoryAutomationSeed = {
    id: randomUUID(),
    name: input.name,
    policyType: input.policyType,
    scope: input.scope,
    summary: input.summary,
    triggerLabel: input.triggerLabel,
    status: "active",
    updatedAt: buildNow(),
    nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };

  const saved = getAppRepository().upsertAutomation(brandId, automation) ?? automation;

  return listAutomationPolicies(brandId).find((item) => item.id === saved.id)!;
}

export function toggleAutomationPolicy(
  brandId: string,
  automationId: string
): AutomationView | null {
  const existing = listAutomationPolicies(brandId).find((item) => item.id === automationId);

  if (!existing) {
    return null;
  }

  const next: RepositoryAutomationSeed = {
    id: existing.id,
    name: existing.name,
    policyType: existing.policyType,
    scope: existing.scope,
    summary: existing.summary,
    triggerLabel: existing.triggerLabel,
    status: existing.status === "active" ? "paused" : "active",
    updatedAt: buildNow(),
    lastRunAt: existing.lastRunAt,
    nextRunAt: existing.nextRunAt
  };

  const saved = getAppRepository().upsertAutomation(brandId, next);

  return saved
    ? listAutomationPolicies(brandId).find((item) => item.id === saved.id) ?? null
    : null;
}

export function editAutomationPolicy(
  brandId: string,
  automationId: string,
  input: EditAutomationInput
): AutomationView | null {
  const existing = listAutomationPolicies(brandId).find((item) => item.id === automationId);

  if (!existing) {
    return null;
  }

  const next: RepositoryAutomationSeed = {
    id: existing.id,
    name: input.name,
    policyType: existing.policyType,
    scope: input.scope,
    summary: input.summary,
    triggerLabel: input.triggerLabel,
    status: existing.status,
    updatedAt: buildNow(),
    lastRunAt: existing.lastRunAt,
    nextRunAt: existing.nextRunAt
  };

  const saved = getAppRepository().upsertAutomation(brandId, next);

  return saved
    ? listAutomationPolicies(brandId).find((item) => item.id === saved.id) ?? null
    : null;
}

export function getAutomationSettings(brandId: string): AutomationSettingsView {
  const settings = getSeedAutomationSettings(brandId);

  return {
    ...settings,
    updatedAtLabel: formatTimestampLabel(settings.updatedAt)
  };
}

export function saveAutomationSettings(
  brandId: string,
  input: Omit<RepositoryAutomationSettingsSeed, "updatedAt">
): AutomationSettingsView {
  const next: RepositoryAutomationSettingsSeed = {
    ...input,
    updatedAt: buildNow()
  };

  const saved = getAppRepository().saveAutomationSettings(brandId, next) ?? next;

  return {
    ...saved,
    updatedAtLabel: formatTimestampLabel(saved.updatedAt)
  };
}
