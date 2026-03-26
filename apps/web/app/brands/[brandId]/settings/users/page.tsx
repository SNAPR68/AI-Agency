import { WorkspacePage } from "../../../../../components/workspace-page";
import { getSupabaseConfigStatus } from "../../../../../lib/supabase-env";
import { listPlatformTeamMembers } from "../../../../../lib/supabase-platform-data";

type UsersPageProps = {
  params: Promise<{
    brandId: string;
  }>;
  searchParams: Promise<{
    invite?: string;
  }>;
};

function formatActivity(timestamp?: string) {
  if (!timestamp) {
    return "Awaiting activity";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function rolePermissions(role: string) {
  switch (role) {
    case "owner":
      return [
        { label: "Manage Integrations", enabled: true },
        { label: "Financial Reporting", enabled: true },
        { label: "Modify Workflows", enabled: true }
      ];
    case "founder":
      return [
        { label: "Manage Integrations", enabled: true },
        { label: "Financial Reporting", enabled: true },
        { label: "Modify Workflows", enabled: false }
      ];
    case "content_lead":
      return [
        { label: "Manage Integrations", enabled: false },
        { label: "Financial Reporting", enabled: false },
        { label: "Modify Workflows", enabled: true }
      ];
    case "ecommerce_manager":
      return [
        { label: "Manage Integrations", enabled: true },
        { label: "Financial Reporting", enabled: true },
        { label: "Modify Workflows", enabled: false }
      ];
    default:
      return [
        { label: "Manage Integrations", enabled: false },
        { label: "Financial Reporting", enabled: false },
        { label: "Modify Workflows", enabled: true }
      ];
  }
}

function statusTone(status: string) {
  if (status === "active") {
    return "positive";
  }

  if (status === "invited") {
    return "warning";
  }

  return "danger";
}

export default async function UsersPage({ params, searchParams }: UsersPageProps) {
  const { brandId } = await params;
  const { invite } = await searchParams;

  const members = await listPlatformTeamMembers(brandId);
  const activeMembers = members.filter((member) => member.status === "active");
  const invitedMembers = members.filter((member) => member.status === "invited");
  const removedMembers = members.filter((member) => member.status === "removed");
  const supabaseStatus = getSupabaseConfigStatus();
  const spotlightMember = activeMembers[0] ?? invitedMembers[0] ?? members[0] ?? null;

  const inviteMessage =
    invite === "sent"
      ? "Invite saved and Supabase email delivery was triggered."
      : invite === "resent"
        ? "Invite was re-sent through Supabase."
        : invite === "queued"
          ? "Invite saved in the workspace. External email delivery is still waiting on Supabase admin config."
          : invite === "failed"
            ? "The workspace invite was saved, but Supabase could not send the email. Check Auth redirect URLs and provider settings."
            : null;

  return (
    <WorkspacePage
      model={{
        kicker: "Users & Permissions",
        title: "Users and permissions",
        description:
          "Orchestrate the editorial team, define role coverage, and keep access decisions visible enough that ownership and approvals never feel ambiguous.",
        actions: [
          {
            label: "Open Brand Memory",
            href: `/brands/${brandId}/settings/brand-memory`
          },
          {
            label: "Open Automations",
            href: `/brands/${brandId}/settings/automations`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Active seats",
            value: `${activeMembers.length}`,
            note: "People currently participating in the workspace."
          },
          {
            label: "Pending invites",
            value: `${invitedMembers.length}`,
            note: "Users who have been invited but have not become active yet."
          },
          {
            label: "Removed access",
            value: `${removedMembers.length}`,
            note: "Historical removals kept visible for operational context."
          }
        ]
      }}
    >
      {inviteMessage ? <div className="message-banner">{inviteMessage}</div> : null}

      <section className="settings-admin-layout">
        <div className="settings-admin-main">
          <article className="settings-card" data-tone="warm">
            <div className="settings-card-head">
              <div>
                <span className="pill">Invite user</span>
                <h2 className="settings-card-title">Add a teammate</h2>
                <p className="settings-card-copy">
                  Role state lives in the product, while Supabase-backed invite
                  delivery handles the real auth path when admin access is configured.
                </p>
              </div>
            </div>

            <div className="message-banner">
              {supabaseStatus.serverAdminReady
                ? `Supabase admin delivery is active for project ${supabaseStatus.projectRef ?? "this workspace"}.`
                : "Supabase admin delivery is not configured yet, so invites stay local-only."}
            </div>

            <form
              action={`/api/brands/${brandId}/users/invite`}
              className="editor-form"
              method="post"
            >
              <input name="next" type="hidden" value={`/brands/${brandId}/settings/users`} />

              <div className="form-grid">
                <label className="field-stack">
                  <span className="field-label">Name</span>
                  <input className="text-input" name="name" />
                </label>

                <label className="field-stack">
                  <span className="field-label">Email</span>
                  <input className="text-input" name="email" type="email" />
                </label>

                <label className="field-stack">
                  <span className="field-label">Title</span>
                  <input className="text-input" name="title" />
                </label>

                <label className="field-stack">
                  <span className="field-label">Role</span>
                  <select className="text-input" defaultValue="operator" name="role">
                    <option value="owner">Owner</option>
                    <option value="founder">Founder</option>
                    <option value="growth_marketer">Growth Marketer</option>
                    <option value="content_lead">Content Lead</option>
                    <option value="ecommerce_manager">E-commerce Manager</option>
                    <option value="operator">Operator</option>
                  </select>
                </label>
              </div>

              <div className="settings-card-actions">
                <button className="button-link" type="submit">
                  Invite User
                </button>
              </div>
            </form>
          </article>

          <article className="settings-card">
            <div className="settings-card-head">
              <div>
                <span className="pill">Workspace members</span>
                <h2 className="settings-card-title">Current roster</h2>
                <p className="settings-card-copy">
                  Keep the team map visible so approvals, alerts, and accountability
                  always have a clear owner.
                </p>
              </div>
            </div>

            <div className="settings-directory">
              <div className="settings-directory-head">
                <p className="settings-table-head">Name &amp; contact</p>
                <p className="settings-table-head">Role</p>
                <p className="settings-table-head">Status</p>
                <p className="settings-table-head">Last activity</p>
              </div>

              {members.map((member) => (
                <article key={member.id} className="settings-directory-card">
                  <div className="settings-directory-row">
                    <div className="settings-member-primary">
                      <p className="settings-member-name">{member.name}</p>
                      <p className="settings-member-email">
                        {member.email} · {member.title}
                      </p>
                    </div>
                    <div className="record-meta">
                      <span className="status-chip" data-tone="info">
                        {member.roleLabel}
                      </span>
                    </div>
                    <div className="record-meta">
                      <span className="status-chip" data-tone={statusTone(member.status)}>
                        {member.statusLabel}
                      </span>
                    </div>
                    <p className="settings-member-last">
                      {member.lastNotifiedAt
                        ? formatActivity(member.lastNotifiedAt)
                        : formatActivity(member.updatedAt)}
                    </p>
                  </div>

                  {member.status !== "removed" ? (
                    <form
                      action={`/api/brands/${brandId}/users/${member.id}/change-role`}
                      className="settings-inline-form"
                      method="post"
                    >
                      <input
                        name="next"
                        type="hidden"
                        value={`/brands/${brandId}/settings/users`}
                      />

                      <div className="form-grid">
                        <label className="field-stack">
                          <span className="field-label">Role</span>
                          <select className="text-input" defaultValue={member.role} name="role">
                            <option value="owner">Owner</option>
                            <option value="founder">Founder</option>
                            <option value="growth_marketer">Growth Marketer</option>
                            <option value="content_lead">Content Lead</option>
                            <option value="ecommerce_manager">E-commerce Manager</option>
                            <option value="operator">Operator</option>
                          </select>
                        </label>
                      </div>

                      <div className="settings-member-row-actions">
                        <button className="button-link-secondary" type="submit">
                          Change Role
                        </button>

                        {member.status === "invited" ? (
                          <button
                            className="button-link-secondary"
                            formAction={`/api/brands/${brandId}/users/${member.id}/resend-invite`}
                            type="submit"
                          >
                            Resend Invite
                          </button>
                        ) : null}

                        <button
                          className="button-link"
                          formAction={`/api/brands/${brandId}/users/${member.id}/remove`}
                          type="submit"
                        >
                          Remove Access
                        </button>
                      </div>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          </article>
        </div>

        <aside className="settings-admin-rail">
          {spotlightMember ? (
            <article className="settings-card">
              <div className="settings-card-head">
                <div>
                  <span className="pill">Member detail</span>
                  <h2 className="settings-card-title">{spotlightMember.name}</h2>
                  <p className="settings-card-copy">
                    {spotlightMember.email} · {spotlightMember.title}
                  </p>
                </div>

                <div className="record-meta">
                  <span className="status-chip" data-tone="info">
                    {spotlightMember.roleLabel}
                  </span>
                  <span
                    className="status-chip"
                    data-tone={statusTone(spotlightMember.status)}
                  >
                    {spotlightMember.statusLabel}
                  </span>
                </div>
              </div>

              <div className="settings-permission-list">
                {rolePermissions(spotlightMember.role).map((permission) => (
                  <article key={permission.label} className="settings-permission-item">
                    <div className="settings-provider-head">
                      <div>
                        <p className="settings-item-title">{permission.label}</p>
                        <p className="settings-permission-copy">
                          Access depth currently inherited from the user’s workspace
                          role.
                        </p>
                      </div>
                      <span
                        className="status-chip"
                        data-tone={permission.enabled ? "positive" : "warning"}
                      >
                        {permission.enabled ? "enabled" : "restricted"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              <div className="settings-divider" />

              <div className="settings-activity-list">
                <article className="settings-activity-item">
                  <div className="settings-activity-head">
                    <div>
                      <p className="settings-item-title">Role state updated</p>
                      <p className="settings-item-note">
                        Workspace permissions last changed {formatActivity(spotlightMember.updatedAt)}.
                      </p>
                    </div>
                  </div>
                </article>

                {spotlightMember.lastNotifiedAt ? (
                  <article className="settings-activity-item">
                    <div className="settings-activity-head">
                      <div>
                        <p className="settings-item-title">Invite activity</p>
                        <p className="settings-item-note">
                          Last invite sent {formatActivity(spotlightMember.lastNotifiedAt)}.
                        </p>
                      </div>
                    </div>
                  </article>
                ) : null}
              </div>
            </article>
          ) : null}

          <article className="settings-card">
            <div className="settings-card-head">
              <div>
                <span className="pill">Permission notes</span>
                <h2 className="settings-card-title">How roles should be used</h2>
                <p className="settings-card-copy">
                  Roles matter because approvals, alerts, and workflow control will
                  eventually respect these assignments directly.
                </p>
              </div>
            </div>

            <div className="settings-guidance-list">
              <article className="settings-guidance-item">
                <h3 className="settings-item-title">Founders and owners</h3>
                <p className="settings-item-copy">
                  Use these roles for high-trust oversight, weekly brief visibility,
                  and final approvals on higher-risk content.
                </p>
              </article>
              <article className="settings-guidance-item">
                <h3 className="settings-item-title">Operators and marketers</h3>
                <p className="settings-item-copy">
                  These roles should own the daily operating loop across alerts,
                  opportunities, content, and publishing.
                </p>
              </article>
              <article className="settings-guidance-item">
                <h3 className="settings-item-title">Content and e-commerce leads</h3>
                <p className="settings-item-copy">
                  Give execution enough room to move without expanding approval
                  authority too broadly.
                </p>
              </article>
            </div>
          </article>
        </aside>
      </section>
    </WorkspacePage>
  );
}
