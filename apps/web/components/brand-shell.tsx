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

  return (
    <main className="app-frame">
      <div className="shell-topbar surface-card">
        <div>
          <span className="eyebrow">Operational Overview</span>
          <h1 className="shell-title">{brandName}</h1>
          <p className="shell-subtitle">
            {vertical} · {gmvBand} · Approval-first growth operating system
          </p>
        </div>

        <div className="shell-toolbar">
          <div className="toolbar-cluster">
            {accessibleBrands.map((workspace) => (
              <Link
                key={workspace.id}
                className="toolbar-chip"
                data-active={workspace.id === brandId}
                href={`/switch-workspace?brandId=${workspace.id}`}
              >
                {workspace.name}
              </Link>
            ))}
          </div>
          <span className="toolbar-chip">Last 7 days</span>
          <Link className="button-link-secondary" href={`/brands/${brandId}/inbox`}>
            Open Inbox
          </Link>
          <span className="toolbar-chip toolbar-chip-strong">
            {activeUserName} · {formatWorkspaceRole(activeUserRole)}
          </span>
          <Link className="button-link-secondary" href="/logout">
            Log Out
          </Link>
        </div>
      </div>

      <div className="shell-grid shell-grid-expanded">
        <aside className="surface-card sidebar">
          <span className="eyebrow">Agency</span>
          <h2 className="sidebar-title">{brandName}</h2>
          <p className="sidebar-copy">
            Merchant editorial workspace spanning analytics, content, approvals,
            retention, CX, support, and reporting.
          </p>

          <div className="nav-section">
            <p className="nav-section-title">Workspaces</p>
            <div className="nav-list">
              {accessibleBrands.map((workspace) => (
                <Link
                  key={workspace.id}
                  className="nav-link"
                  data-active={workspace.id === brandId}
                  href={`/switch-workspace?brandId=${workspace.id}`}
                >
                  <span className="nav-label">{workspace.name}</span>
                  <span className="nav-description">
                    {workspace.vertical} · {formatWorkspaceRole(workspace.role)}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <nav aria-label="Brand navigation">
            {brandNavigationSections.map((section) => (
              <div key={section.title} className="nav-section">
                <p className="nav-section-title">{section.title}</p>
                <div className="nav-list">
                  {section.items.map((item) => (
                    <Link
                      key={item.label}
                      className="nav-link"
                      data-active={isActiveNavigationItem(pathname, item, brandId)}
                      href={item.href(brandId)}
                    >
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="workspace-pane">{children}</div>
      </div>
    </main>
  );
}
