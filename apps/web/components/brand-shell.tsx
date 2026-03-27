"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  brandNavigationSections,
  isActiveNavigationItem
} from "../lib/navigation";
import {
  type AccessibleWorkspace,
  type WorkspaceRole,
  formatWorkspaceRole
} from "../lib/workspace";

const sectionIcons: Record<string, string> = {
  Main: "dashboard",
  Commerce: "shopping_cart",
  Content: "article",
  Market: "campaign",
  Workflow: "account_tree",
  "Growth Ops": "trending_up",
  Settings: "settings"
};

const itemIcons: Record<string, string> = {
  Overview: "dashboard",
  Alerts: "notifications",
  "Weekly Briefs": "article",
  Products: "inventory_2",
  Channels: "insert_chart",
  Campaigns: "ads_click",
  Opportunities: "bolt",
  "Content Studio": "edit_square",
  "Content Calendar": "calendar_month",
  Drafts: "draft",
  Trends: "local_fire_department",
  Competitors: "storefront",
  Approvals: "fact_check",
  Publishing: "send",
  Inbox: "inbox",
  Retention: "favorite",
  "CX Ops": "local_shipping",
  "Support Ops": "support_agent",
  Reports: "description",
  Integrations: "hub",
  "Brand Memory": "bookmark",
  Users: "group",
  Automations: "automation"
};

type BrandShellProps = {
  brandId: string;
  brandName: string;
  activeUserName: string;
  activeUserRole: WorkspaceRole;
  vertical: string;
  gmvBand: string;
  accessibleBrands: AccessibleWorkspace[];
  children: React.ReactNode;
};

export function BrandShell({
  brandId,
  brandName,
  activeUserName,
  activeUserRole,
  vertical,
  gmvBand,
  accessibleBrands,
  children
}: BrandShellProps) {
  const pathname = usePathname();
  const activeSection =
    brandNavigationSections.find((section) =>
      section.items.some((item) => isActiveNavigationItem(pathname, item, brandId))
    )?.title ?? "Main";
  const isInboxSection = pathname.includes("/inbox");
  const isSettingsSection = pathname.includes("/settings");

  return (
    <div className="app-shell-root">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <div className="app-sidebar-logo">
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <div>
            <h1 className="app-sidebar-title">Agency</h1>
            <p className="app-sidebar-meta">Shopify Brand OS</p>
          </div>
        </div>

        <div className="app-sidebar-workspaces">
          {accessibleBrands.map((workspace) => (
            <Link
              key={workspace.id}
              className="app-workspace-chip"
              data-active={workspace.id === brandId}
              href={`/switch-workspace?brandId=${workspace.id}`}
            >
              <span>{workspace.name}</span>
              <span className="app-workspace-chip-meta">
                {formatWorkspaceRole(workspace.role)}
              </span>
            </Link>
          ))}
        </div>

        <nav aria-label="Brand navigation" className="app-sidebar-nav">
          {brandNavigationSections.map((section) => (
            <div key={section.title} className="app-sidebar-section">
              <p className="app-sidebar-section-label">
                <span className="material-symbols-outlined">
                  {sectionIcons[section.title] ?? "dashboard"}
                </span>
                {section.title}
              </p>
              <div className="app-sidebar-section-links">
                {section.items.map((item) => {
                  const isActive = isActiveNavigationItem(pathname, item, brandId);

                  return (
                    <Link
                      key={item.label}
                      className="app-sidebar-link"
                      data-active={isActive}
                      href={item.href(brandId)}
                    >
                      <span className="material-symbols-outlined">
                        {itemIcons[item.label] ?? sectionIcons[section.title] ?? "circle"}
                      </span>
                      <span className="app-sidebar-link-copy">
                        <span className="app-sidebar-link-label">{item.label}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <Link className="app-sidebar-footer-link" href={`/brands/${brandId}/briefs/latest`}>
            <span className="material-symbols-outlined">auto_awesome</span>
            Generate Brief
          </Link>
          <Link className="app-sidebar-footer-link" href="/logout">
            <span className="material-symbols-outlined">logout</span>
            Log Out
          </Link>
        </div>
      </aside>

      <div className="app-shell-main">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <div className="app-topbar-workspace">
              <div>
                <span className="app-topbar-workspace-name">{brandName}</span>
                <p className="app-topbar-workspace-meta">
                  {vertical} · {gmvBand}
                </p>
              </div>
              <span className="material-symbols-outlined">expand_more</span>
            </div>
            <div className="app-topbar-divider" />
            <nav className="app-topbar-nav">
              <Link
                className="app-topbar-nav-link"
                data-active={!isInboxSection && !isSettingsSection}
                href={`/brands/${brandId}/overview`}
              >
                Analytics
              </Link>
              <Link
                className="app-topbar-nav-link"
                data-active={isInboxSection}
                href={`/brands/${brandId}/inbox`}
              >
                Inbox
              </Link>
              <Link
                className="app-topbar-nav-link"
                data-active={isSettingsSection}
                href={`/brands/${brandId}/settings/integrations`}
              >
                Settings
              </Link>
            </nav>
          </div>

          <div className="app-topbar-right">
            <div className="app-topbar-search">
              <span className="material-symbols-outlined">search</span>
              <span>Search parameters...</span>
            </div>
            <Link className="app-icon-button" href={`/brands/${brandId}/inbox`}>
              <span className="material-symbols-outlined">notifications</span>
            </Link>
            <Link
              className="app-icon-button"
              href={`/brands/${brandId}/settings/integrations`}
            >
              <span className="material-symbols-outlined">settings</span>
            </Link>
            <Link className="app-topbar-export" href={`/brands/${brandId}/reports`}>
              Reports
            </Link>
            <div className="app-topbar-user">
              <div>
                <p className="app-topbar-user-name">{activeUserName}</p>
                <p className="app-topbar-user-role">{formatWorkspaceRole(activeUserRole)}</p>
              </div>
              <div className="app-topbar-user-avatar">
                {activeUserName
                  .split(" ")
                  .map((part) => part[0] ?? "")
                  .join("")
                  .slice(0, 2)}
              </div>
            </div>
          </div>
        </header>

        <div className="app-shell-canvas">{children}</div>
      </div>
    </div>
  );
}
