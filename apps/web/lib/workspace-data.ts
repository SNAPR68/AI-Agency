import "server-only";

import { getAppRepository } from "./app-repository";
import { shouldEnforceSupabaseHostedAccess } from "./supabase-env";
import { getSupabaseWorkspaceContext } from "./supabase-workspace-auth";
import type {
  AccessibleWorkspace,
  WorkspaceBrand,
  WorkspaceContext,
  WorkspaceLoginOption,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceUser
} from "./workspace";

function prettifyBrandId(brandId: string) {
  return brandId
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getRepository() {
  return getAppRepository();
}

export function listWorkspaceUsers() {
  return getRepository().listUsers();
}

export function listWorkspaceBrands() {
  return getRepository().listBrands();
}

export function getWorkspaceBrand(brandId: string) {
  return listWorkspaceBrands().find((brand) => brand.id === brandId) ?? null;
}

export function getUserById(userId: string) {
  return listWorkspaceUsers().find((user) => user.id === userId) ?? null;
}

export function getUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return (
    listWorkspaceUsers().find((user) => user.email.toLowerCase() === normalizedEmail) ??
    null
  );
}

export function getWorkspaceMembers(brandId: string): WorkspaceMember[] {
  return getRepository()
    .listMemberships()
    .filter((membership) => membership.brandId === brandId)
    .map((membership) => {
      const user = getUserById(membership.userId);

      if (!user) {
        throw new Error(`Missing workspace user for membership ${membership.userId}`);
      }

      return {
        ...user,
        role: membership.role
      };
    });
}

export function getAccessibleBrandsForUser(userId: string): AccessibleWorkspace[] {
  return getRepository()
    .listMemberships()
    .filter((membership) => membership.userId === userId)
    .map((membership) => {
      const brand = getWorkspaceBrand(membership.brandId);

      if (!brand) {
        throw new Error(`Missing brand ${membership.brandId}`);
      }

      return {
        ...brand,
        role: membership.role
      };
    });
}

export function getDefaultBrandIdForUser(userId: string) {
  return getAccessibleBrandsForUser(userId)[0]?.id ?? null;
}

export function isUserInBrand(userId: string, brandId: string) {
  return getRepository()
    .listMemberships()
    .some((membership) => membership.userId === userId && membership.brandId === brandId);
}

export function getRoleForUserInBrand(userId: string, brandId: string): WorkspaceRole | null {
  return (
    getRepository().listMemberships().find(
      (membership) => membership.userId === userId && membership.brandId === brandId
    )?.role ?? null
  );
}

function getWorkspaceIntegrations(brandId: string) {
  return getRepository().listIntegrations(brandId);
}

export function getWorkspaceContext(
  brandId: string,
  activeUserId?: string
): WorkspaceContext {
  const brand =
    getWorkspaceBrand(brandId) ??
    ({
      id: brandId,
      name: prettifyBrandId(brandId) || "Brand Workspace",
      vertical: "Unknown vertical",
      timezone: "UTC",
      gmvBand: "Unknown GMV"
    } satisfies WorkspaceBrand);
  const users = getWorkspaceMembers(brand.id);
  const activeUser =
    (activeUserId ? users.find((user) => user.id === activeUserId) : undefined) ?? users[0];

  if (!activeUser) {
    throw new Error(`Workspace ${brandId} has no active members`);
  }

  return {
    ...brand,
    activeUser,
    users,
    integrations: getWorkspaceIntegrations(brand.id)
  };
}

export async function getWorkspaceContextAsync(
  brandId: string,
  activeUserIdOrEmail?: string
): Promise<WorkspaceContext> {
  const supabaseContext = await getSupabaseWorkspaceContext(brandId, activeUserIdOrEmail);

  if (supabaseContext) {
    return {
      ...supabaseContext,
      integrations:
        supabaseContext.integrations.length > 0
          ? supabaseContext.integrations
          : getWorkspaceIntegrations(brandId)
    };
  }

  if (shouldEnforceSupabaseHostedAccess()) {
    throw new Error(
      `Hosted workspace context for brand "${brandId}" is unavailable from Supabase.`
    );
  }

  return getWorkspaceContext(brandId, activeUserIdOrEmail);
}

export function getWorkspaceSummary(brandId: string, activeUserId?: string) {
  const context = getWorkspaceContext(brandId, activeUserId);

  return {
    brandId: context.id,
    brandName: context.name,
    activeUserName: context.activeUser.name,
    activeUserRole: context.activeUser.role,
    vertical: context.vertical,
    gmvBand: context.gmvBand,
    timezone: context.timezone,
    accessibleBrands: getAccessibleBrandsForUser(context.activeUser.id)
  };
}

export function getLoginWorkspaceOptions(): WorkspaceLoginOption[] {
  if (shouldEnforceSupabaseHostedAccess()) {
    return [];
  }

  return listWorkspaceUsers()
    .map((user) => {
      const accessibleBrands = getAccessibleBrandsForUser(user.id);

      if (accessibleBrands.length === 0) {
        return null;
      }

      return {
        userId: user.id,
        name: user.name,
        email: user.email,
        title: user.title,
        primaryRole: accessibleBrands[0].role,
        primaryBrandId: accessibleBrands[0].id,
        accessibleBrands
      };
    })
    .filter((option): option is WorkspaceLoginOption => option !== null);
}

export function findPendingWorkspaceInviteByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const invitedBrands = listWorkspaceBrands().flatMap((brand) =>
    getRepository()
      .listTeamSeedMembers(brand.id)
      .filter(
        (member) =>
          member.status === "invited" &&
          member.email.trim().toLowerCase() === normalizedEmail
      )
      .map((member) => ({
        brandId: brand.id,
        brandName: brand.name,
        role: member.role
      }))
  );

  return invitedBrands.length > 0
    ? {
        email: normalizedEmail,
        invitedBrands
      }
    : null;
}
