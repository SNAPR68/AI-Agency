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
    <section className="control-suite">
      <header className="command-header">
        <div className="command-header-copy">
          <p className="command-kicker">Settings / Users</p>
          <h1 className="command-title">Workspace Members</h1>
          <p className="command-description">
            Manage access, roles, and permissions for the growth team. Keep the right collaborators on the right
            surfaces without letting approval authority drift.
          </p>
        </div>

        <div className="command-actions">
          <a className="command-primary-button" href="#invite-user">
            Invite User
          </a>
        </div>
      </header>

      {inviteMessage ? <div className="message-banner">{inviteMessage}</div> : null}

      <div className="control-users-grid">
        <div className="control-users-main">
          <section className="control-card" id="invite-user">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Invite teammate</p>
                <h2>Add a new operator</h2>
                <p>Role state lives in the product while Supabase-backed invite delivery handles the real auth path.</p>
              </div>
            </div>

            <div className="message-banner">
              {supabaseStatus.serverAdminReady
                ? `Supabase admin delivery is active for project ${supabaseStatus.projectRef ?? "this workspace"}.`
                : "Supabase admin delivery is not configured yet, so invites stay local-only."}
            </div>

            <form
              action={`/api/brands/${brandId}/users/invite`}
              className="control-form-grid control-form-grid-quad"
              method="post"
            >
              <input name="next" type="hidden" value={`/brands/${brandId}/settings/users`} />
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
              <div className="control-form-actions control-form-actions-full">
                <button className="button-link" type="submit">
                  Invite User
                </button>
              </div>
            </form>
          </section>

          <section className="control-card">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Active personnel</p>
                <h2>Current roster</h2>
                <p>Keep role coverage and invite state visible enough that ownership never feels ambiguous.</p>
              </div>
            </div>

            <div className="control-users-table">
              <div className="control-users-head">
                <span>Name &amp; contact</span>
                <span>Role</span>
                <span>Status</span>
                <span>Last active</span>
                <span>Actions</span>
              </div>
              <div className="control-users-body">
                {members.map((member) =>
                  member.status !== "removed" ? (
                    <form
                      key={member.id}
                      action={`/api/brands/${brandId}/users/${member.id}/change-role`}
                      className="control-member-row"
                      method="post"
                    >
                      <input name="next" type="hidden" value={`/brands/${brandId}/settings/users`} />
                      <div className="control-member-primary">
                        <strong>{member.name}</strong>
                        <p>
                          {member.email} · {member.title}
                        </p>
                      </div>
                      <label className="field-stack control-inline-field">
                        <span className="sr-only">Role</span>
                        <select className="text-input" defaultValue={member.role} name="role">
                          <option value="owner">Owner</option>
                          <option value="founder">Founder</option>
                          <option value="growth_marketer">Growth Marketer</option>
                          <option value="content_lead">Content Lead</option>
                          <option value="ecommerce_manager">E-commerce Manager</option>
                          <option value="operator">Operator</option>
                        </select>
                      </label>
                      <div className="record-meta">
                        <span className="status-chip" data-tone={statusTone(member.status)}>
                          {member.statusLabel}
                        </span>
                      </div>
                      <p className="control-member-last">
                        {member.lastNotifiedAt
                          ? formatActivity(member.lastNotifiedAt)
                          : formatActivity(member.updatedAt)}
                      </p>
                      <div className="control-member-actions">
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
                  ) : (
                    <article key={member.id} className="control-member-row control-member-row-muted">
                      <div className="control-member-primary">
                        <strong>{member.name}</strong>
                        <p>
                          {member.email} · {member.title}
                        </p>
                      </div>
                      <div className="record-meta">
                        <span className="status-chip" data-tone="danger">
                          removed
                        </span>
                      </div>
                      <p className="control-member-last">{formatActivity(member.updatedAt)}</p>
                    </article>
                  )
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="control-rail">
          <article className="control-score-card">
            <span>Seat mix</span>
            <strong>{activeMembers.length}</strong>
            <p>
              {invitedMembers.length} invited · {removedMembers.length} removed
            </p>
          </article>

          {spotlightMember ? (
            <article className="control-card">
              <div className="control-card-head">
                <div>
                  <p className="command-mini-kicker">Member detail</p>
                  <h2>{spotlightMember.name}</h2>
                  <p>
                    {spotlightMember.email} · {spotlightMember.title}
                  </p>
                </div>
                <div className="record-meta">
                  <span className="status-chip" data-tone="info">
                    {spotlightMember.roleLabel}
                  </span>
                  <span className="status-chip" data-tone={statusTone(spotlightMember.status)}>
                    {spotlightMember.statusLabel}
                  </span>
                </div>
              </div>

              <div className="control-note-stack">
                {rolePermissions(spotlightMember.role).map((permission) => (
                  <article key={permission.label}>
                    <strong>{permission.label}</strong>
                    <p>{permission.enabled ? "Enabled for this role." : "Restricted for this role."}</p>
                  </article>
                ))}
              </div>
            </article>
          ) : null}

          <article className="control-card">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Permission notes</p>
                <h2>How roles should be used</h2>
                <p>Roles matter because approvals, alerts, and workflow control respect these assignments directly.</p>
              </div>
            </div>
            <div className="control-note-stack">
              <article>
                <strong>Founders and owners.</strong>
                <p>Use these roles for high-trust oversight, weekly brief visibility, and final approvals on higher-risk content.</p>
              </article>
              <article>
                <strong>Operators and marketers.</strong>
                <p>These roles should own the daily operating loop across alerts, opportunities, content, and publishing.</p>
              </article>
              <article>
                <strong>Content and commerce leads.</strong>
                <p>Give execution enough room to move without expanding approval authority too broadly.</p>
              </article>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
