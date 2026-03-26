import "server-only";

import { cache } from "react";
import { createSupabaseAdminClient, canUseSupabaseAdmin } from "./supabase-admin";
import type {
  AccessibleWorkspace,
  WorkspaceBrand,
  WorkspaceContext,
  WorkspaceMembership,
  WorkspaceRole,
  WorkspaceUser
} from "./workspace";

type BrandRow = {
  id: string;
  name: string;
  slug: string;
  vertical: string | null;
  timezone: string | null;
  gmv_band: string | null;
  status: string;
};

type BrandUserRow = {
  id: string;
  brand_id: string;
  email: string;
  full_name: string | null;
  job_title: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type PendingInviteSummary = {
  email: string;
  invitedBrands: Array<{
    brandId: string;
    brandName: string;
    role: WorkspaceRole;
  }>;
};

type WorkspaceAuthDataset = {
  users: WorkspaceUser[];
  brands: WorkspaceBrand[];
  memberships: WorkspaceMembership[];
  workspaceByUserId: Map<string, AccessibleWorkspace[]>;
  workspaceContextByBrandId: Map<string, WorkspaceContext>;
  pendingInviteByEmail: Map<string, PendingInviteSummary>;
};

function prettifyFromEmail(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isWorkspaceRole(value: string): value is WorkspaceRole {
  return [
    "owner",
    "founder",
    "growth_marketer",
    "content_lead",
    "ecommerce_manager",
    "operator"
  ].includes(value);
}

function normalizeUser(row: BrandUserRow): WorkspaceUser {
  return {
    id: row.email.trim().toLowerCase(),
    name: row.full_name?.trim() || prettifyFromEmail(row.email),
    email: row.email.trim().toLowerCase(),
    title:
      row.job_title?.trim() ||
      row.role.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())
  };
}

function normalizeBrand(row: BrandRow): WorkspaceBrand {
  return {
    id: row.slug,
    name: row.name,
    vertical: row.vertical ?? "Unknown vertical",
    timezone: row.timezone ?? "UTC",
    gmvBand: row.gmv_band ?? "Unknown GMV"
  };
}

const loadSupabaseWorkspaceDataset = cache(async (): Promise<WorkspaceAuthDataset | null> => {
  if (!canUseSupabaseAdmin()) {
    return null;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const [{ data: brandRows, error: brandError }, { data: memberRows, error: memberError }] =
      await Promise.all([
        supabase
          .from("brands")
          .select("id, name, slug, vertical, timezone, gmv_band, status")
          .eq("status", "active")
          .order("name", { ascending: true }),
        supabase
          .from("brand_users")
          .select(
            "id, brand_id, email, full_name, job_title, role, status, created_at, updated_at"
          )
          .order("updated_at", { ascending: false })
      ]);

    if (brandError || memberError || !brandRows || !memberRows) {
      return null;
    }

    const normalizedBrandRows = brandRows as BrandRow[];
    const normalizedMemberRows = memberRows as BrandUserRow[];
    const brands = normalizedBrandRows.map(normalizeBrand);
    const brandByInternalId = new Map(
      normalizedBrandRows.map((row) => [row.id, normalizeBrand(row)] as const)
    );
    const activeMembers = normalizedMemberRows.filter(
      (row) => row.status === "active" && isWorkspaceRole(row.role)
    );
    const invitedMembers = normalizedMemberRows.filter(
      (row) => row.status === "invited" && isWorkspaceRole(row.role)
    );
    const users = Array.from(
      new Map(activeMembers.map((row) => [row.email.trim().toLowerCase(), normalizeUser(row)])).values()
    ).sort((left, right) => left.email.localeCompare(right.email));
    const memberships: WorkspaceMembership[] = activeMembers
      .map((row) => {
        const brand = brandByInternalId.get(row.brand_id);

        if (!brand) {
          return null;
        }

        return {
          brandId: brand.id,
          userId: row.email.trim().toLowerCase(),
          role: row.role as WorkspaceRole
        } satisfies WorkspaceMembership;
      })
      .filter((membership): membership is WorkspaceMembership => membership !== null);
    const workspaceByUserId = new Map<string, AccessibleWorkspace[]>();

    for (const membership of memberships) {
      const brand = brands.find((item) => item.id === membership.brandId);

      if (!brand) {
        continue;
      }

      const items = workspaceByUserId.get(membership.userId) ?? [];
      items.push({
        ...brand,
        role: membership.role
      });
      workspaceByUserId.set(
        membership.userId,
        items.sort((left, right) => left.name.localeCompare(right.name))
      );
    }

    const workspaceContextByBrandId = new Map<string, WorkspaceContext>();

    for (const brand of brands) {
      const brandMemberships = memberships.filter((membership) => membership.brandId === brand.id);
      const brandUsers = brandMemberships
        .map((membership) => {
          const user = users.find((item) => item.id === membership.userId);

          if (!user) {
            return null;
          }

          return {
            ...user,
            role: membership.role
          };
        })
        .filter(
          (
            member
          ): member is WorkspaceContext["users"][number] => member !== null
        );

      if (brandUsers.length === 0) {
        continue;
      }

      workspaceContextByBrandId.set(brand.id, {
        ...brand,
        activeUser: brandUsers[0],
        users: brandUsers,
        integrations: []
      });
    }

    const pendingInviteByEmail = new Map<string, PendingInviteSummary>();

    for (const row of invitedMembers) {
      const brand = brandByInternalId.get(row.brand_id);

      if (!brand) {
        continue;
      }

      const email = row.email.trim().toLowerCase();
      const summary = pendingInviteByEmail.get(email) ?? {
        email,
        invitedBrands: []
      };

      summary.invitedBrands.push({
        brandId: brand.id,
        brandName: brand.name,
        role: row.role as WorkspaceRole
      });
      pendingInviteByEmail.set(email, summary);
    }

    return {
      users,
      brands,
      memberships,
      workspaceByUserId,
      workspaceContextByBrandId,
      pendingInviteByEmail
    };
  } catch {
    return null;
  }
});

export async function getSupabaseWorkspaceUserByEmail(email: string) {
  const dataset = await loadSupabaseWorkspaceDataset();
  const normalized = email.trim().toLowerCase();

  return dataset?.users.find((user) => user.email === normalized) ?? null;
}

export async function getSupabaseWorkspaceUserById(userId: string) {
  const dataset = await loadSupabaseWorkspaceDataset();
  const normalized = userId.trim().toLowerCase();

  return dataset?.users.find((user) => user.id === normalized) ?? null;
}

export async function getSupabaseAccessibleBrandsForUser(
  userIdOrEmail: string
): Promise<AccessibleWorkspace[]> {
  const dataset = await loadSupabaseWorkspaceDataset();

  if (!dataset) {
    return [];
  }

  return dataset.workspaceByUserId.get(userIdOrEmail.trim().toLowerCase()) ?? [];
}

export async function getSupabaseDefaultBrandIdForUser(userIdOrEmail: string) {
  return (await getSupabaseAccessibleBrandsForUser(userIdOrEmail))[0]?.id ?? null;
}

export async function isSupabaseUserInBrand(userIdOrEmail: string, brandId: string) {
  const brands = await getSupabaseAccessibleBrandsForUser(userIdOrEmail);

  return brands.some((brand) => brand.id === brandId);
}

export async function getSupabaseWorkspaceContext(
  brandId: string,
  userIdOrEmail?: string
): Promise<WorkspaceContext | null> {
  const dataset = await loadSupabaseWorkspaceDataset();

  if (!dataset) {
    return null;
  }

  const context = dataset.workspaceContextByBrandId.get(brandId);

  if (!context) {
    return null;
  }

  if (!userIdOrEmail) {
    return context;
  }

  const normalized = userIdOrEmail.trim().toLowerCase();
  const activeUser =
    context.users.find((member) => member.email === normalized || member.id === normalized) ??
    context.activeUser;

  return {
    ...context,
    activeUser
  };
}

export async function findSupabasePendingWorkspaceInviteByEmail(email: string) {
  const dataset = await loadSupabaseWorkspaceDataset();

  if (!dataset) {
    return null;
  }

  return dataset.pendingInviteByEmail.get(email.trim().toLowerCase()) ?? null;
}
