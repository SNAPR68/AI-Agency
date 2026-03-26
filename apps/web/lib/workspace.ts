export type WorkspaceRole =
  | "owner"
  | "founder"
  | "growth_marketer"
  | "content_lead"
  | "ecommerce_manager"
  | "operator";

export type WorkspaceUser = {
  id: string;
  name: string;
  email: string;
  title: string;
};

export type WorkspaceBrand = {
  id: string;
  name: string;
  vertical: string;
  timezone: string;
  gmvBand: string;
};

export type WorkspaceMembership = {
  brandId: string;
  userId: string;
  role: WorkspaceRole;
};

export type WorkspaceIntegration = {
  provider: string;
  status: "connected" | "degraded" | "pending";
  lastSyncedAt: string;
};

export type WorkspaceMember = WorkspaceUser & {
  role: WorkspaceRole;
};

export type AccessibleWorkspace = WorkspaceBrand & {
  role: WorkspaceRole;
};

export type WorkspaceLoginOption = {
  userId: string;
  name: string;
  email: string;
  title: string;
  primaryRole: WorkspaceRole;
  primaryBrandId: string;
  accessibleBrands: AccessibleWorkspace[];
};

export type WorkspaceContext = WorkspaceBrand & {
  activeUser: WorkspaceMember;
  users: WorkspaceMember[];
  integrations: WorkspaceIntegration[];
};

export function formatWorkspaceRole(role: WorkspaceRole) {
  return role.replaceAll("_", " ");
}
