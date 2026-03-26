import { WorkspacePage } from "../../../../../components/workspace-page";
import {
  getPlatformAutomationSettings,
  listPlatformAutomationPolicies
} from "../../../../../lib/supabase-platform-data";

type AutomationsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function formatPolicyType(value: string) {
  return value.replaceAll("_", " ");
}

function buildHealthScore(
  activeCount: number,
  pausedCount: number,
  settings: Awaited<ReturnType<typeof getPlatformAutomationSettings>>
) {
  const raw =
    72 +
    activeCount * 5 -
    pausedCount * 4 +
    (settings.approvalMode === "always_review" ? 8 : 4) +
    (settings.autoPublishMode === "never" ? 7 : 3) +
    (settings.alertSensitivity === "normal" ? 5 : 2);

  return Math.max(55, Math.min(98.4, raw));
}

export default async function AutomationsPage({ params }: AutomationsPageProps) {
  const { brandId } = await params;
  const automations = await listPlatformAutomationPolicies(brandId);
  const settings = await getPlatformAutomationSettings(brandId);
  const activeAutomations = automations.filter((automation) => automation.status === "active");
  const pausedAutomations = automations.filter((automation) => automation.status === "paused");
  const healthScore = buildHealthScore(
    activeAutomations.length,
    pausedAutomations.length,
    settings
  );

  return (
    <WorkspacePage
      model={{
        kicker: "Automations",
        title: "Automations and guardrails",
        description:
          "Configure structural safety nets and algorithmic rules so the operating system stays useful without becoming opaque or reckless.",
        actions: [
          {
            label: "Open Publishing",
            href: `/brands/${brandId}/publishing`
          },
          {
            label: "Open Inbox",
            href: `/brands/${brandId}/inbox`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Active policies",
            value: `${activeAutomations.length}`,
            note: "Automation rules currently shaping product behavior."
          },
          {
            label: "Paused policies",
            value: `${pausedAutomations.length}`,
            note: "Rules intentionally held back until the team regains confidence."
          },
          {
            label: "Thresholds updated",
            value: settings.updatedAtLabel,
            note: "Most recent guardrail save."
          }
        ]
      }}
    >
      <section className="settings-admin-layout">
        <div className="settings-admin-main">
          <article className="settings-card" data-tone="warm">
            <div className="settings-card-head">
              <div>
                <span className="pill">Guardrail settings</span>
                <h2 className="settings-card-title">Workspace thresholds</h2>
                <p className="settings-card-copy">
                  These controls decide how aggressively the product can act before it
                  pauses for human review.
                </p>
              </div>
            </div>

            <div className="settings-mini-metrics">
              <article className="settings-mini-metric">
                <p className="settings-mini-label">Approval mode</p>
                <p className="settings-mini-value">
                  {settings.approvalMode === "always_review" ? "Review" : "Confidence"}
                </p>
                <p className="settings-mini-note">Current human-review posture.</p>
              </article>
              <article className="settings-mini-metric">
                <p className="settings-mini-label">Auto-publish</p>
                <p className="settings-mini-value">
                  {settings.autoPublishMode === "never" ? "Off" : "Approved"}
                </p>
                <p className="settings-mini-note">Autonomy allowed after approval.</p>
              </article>
              <article className="settings-mini-metric">
                <p className="settings-mini-label">Sensitivity</p>
                <p className="settings-mini-value">
                  {settings.alertSensitivity === "high" ? "09" : "07"}
                </p>
                <p className="settings-mini-note">Operator alert tolerance.</p>
              </article>
            </div>

            <form
              action={`/api/brands/${brandId}/automations/settings/save`}
              className="editor-form"
              method="post"
            >
              <input
                name="next"
                type="hidden"
                value={`/brands/${brandId}/settings/automations`}
              />

              <div className="form-grid">
                <label className="field-stack">
                  <span className="field-label">Approval mode</span>
                  <select
                    className="text-input"
                    defaultValue={settings.approvalMode}
                    name="approvalMode"
                  >
                    <option value="always_review">Always review</option>
                    <option value="confidence_based">Confidence based</option>
                  </select>
                </label>

                <label className="field-stack">
                  <span className="field-label">Auto-publish mode</span>
                  <select
                    className="text-input"
                    defaultValue={settings.autoPublishMode}
                    name="autoPublishMode"
                  >
                    <option value="never">Never auto-publish</option>
                    <option value="approved_only">Approved only</option>
                  </select>
                </label>

                <label className="field-stack">
                  <span className="field-label">Alert sensitivity</span>
                  <select
                    className="text-input"
                    defaultValue={settings.alertSensitivity}
                    name="alertSensitivity"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <label className="field-stack">
                  <span className="field-label">Weekly brief cadence</span>
                  <select
                    className="text-input"
                    defaultValue={settings.weeklyBriefCadence}
                    name="weeklyBriefCadence"
                  >
                    <option value="monday_am">Monday AM</option>
                    <option value="friday_pm">Friday PM</option>
                  </select>
                </label>
              </div>

              <div className="settings-card-actions">
                <button className="button-link" type="submit">
                  Save Thresholds
                </button>
              </div>
            </form>
          </article>

          <article className="settings-card">
            <div className="settings-card-head">
              <div>
                <span className="pill">Create policy</span>
                <h2 className="settings-card-title">New automation rule</h2>
                <p className="settings-card-copy">
                  Add rules only when they reduce operational drag without hiding risk.
                  The team should always understand what the system will do next.
                </p>
              </div>
            </div>

            <form
              action={`/api/brands/${brandId}/automations/create`}
              className="editor-form"
              method="post"
            >
              <input
                name="next"
                type="hidden"
                value={`/brands/${brandId}/settings/automations`}
              />

              <div className="form-grid">
                <label className="field-stack">
                  <span className="field-label">Name</span>
                  <input className="text-input" name="name" />
                </label>

                <label className="field-stack">
                  <span className="field-label">Policy type</span>
                  <input className="text-input" defaultValue="workflow_alert" name="policyType" />
                </label>

                <label className="field-stack field-stack-wide">
                  <span className="field-label">Scope</span>
                  <input className="text-input" name="scope" />
                </label>

                <label className="field-stack field-stack-wide">
                  <span className="field-label">Summary</span>
                  <textarea className="text-area text-area-compact" name="summary" />
                </label>

                <label className="field-stack field-stack-wide">
                  <span className="field-label">Trigger</span>
                  <input className="text-input" name="triggerLabel" />
                </label>
              </div>

              <div className="settings-card-actions">
                <button className="button-link" type="submit">
                  Create Automation
                </button>
              </div>
            </form>
          </article>

          <article className="settings-card">
            <div className="settings-card-head">
              <div>
                <span className="pill">Active automation rules</span>
                <h2 className="settings-card-title">Policy library</h2>
                <p className="settings-card-copy">
                  Policies should remain legible enough that the team can always see
                  what the app will automate and when it will stop for approval.
                </p>
              </div>
            </div>

            <div className="settings-rule-list">
              {automations.map((automation) => (
                <article key={automation.id} className="settings-rule-item">
                  <div className="settings-rule-head">
                    <div>
                      <p className="settings-item-eyebrow">
                        {formatPolicyType(automation.policyType)}
                      </p>
                      <h3 className="settings-item-title">{automation.name}</h3>
                      <p className="settings-item-note">
                        {automation.scope} · {automation.summary}
                      </p>
                    </div>

                    <div className="record-meta">
                      <span
                        className="status-chip"
                        data-tone={
                          automation.status === "active" ? "positive" : "warning"
                        }
                      >
                        {automation.status}
                      </span>
                      {automation.nextRunLabel ? (
                        <span className="status-chip" data-tone="info">
                          Next {automation.nextRunLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="settings-item-copy">
                    Trigger: {automation.triggerLabel}.
                    {automation.lastRunLabel ? ` Last run ${automation.lastRunLabel}.` : ""}
                  </p>

                  <form
                    action={`/api/brands/${brandId}/automations/${automation.id}/edit`}
                    className="settings-inline-form"
                    method="post"
                  >
                    <input
                      name="next"
                      type="hidden"
                      value={`/brands/${brandId}/settings/automations`}
                    />

                    <div className="form-grid">
                      <label className="field-stack">
                        <span className="field-label">Name</span>
                        <input className="text-input" defaultValue={automation.name} name="name" />
                      </label>

                      <label className="field-stack">
                        <span className="field-label">Scope</span>
                        <input
                          className="text-input"
                          defaultValue={automation.scope}
                          name="scope"
                        />
                      </label>

                      <label className="field-stack field-stack-wide">
                        <span className="field-label">Summary</span>
                        <textarea
                          className="text-area text-area-compact"
                          defaultValue={automation.summary}
                          name="summary"
                        />
                      </label>

                      <label className="field-stack field-stack-wide">
                        <span className="field-label">Trigger</span>
                        <input
                          className="text-input"
                          defaultValue={automation.triggerLabel}
                          name="triggerLabel"
                        />
                      </label>
                    </div>

                    <div className="settings-rule-actions">
                      <button className="button-link-secondary" type="submit">
                        Edit Rule
                      </button>
                      <button
                        className={
                          automation.status === "active"
                            ? "button-link"
                            : "button-link-secondary"
                        }
                        formAction={`/api/brands/${brandId}/automations/${automation.id}/toggle`}
                        type="submit"
                      >
                        {automation.status === "active" ? "Pause Automation" : "Resume Automation"}
                      </button>
                    </div>
                  </form>
                </article>
              ))}
            </div>
          </article>
        </div>

        <aside className="settings-admin-rail">
          <article className="settings-card">
            <div className="settings-card-head">
              <div>
                <span className="pill">Status logs</span>
                <h2 className="settings-card-title">Recent system events</h2>
                <p className="settings-card-copy">
                  Keep rule execution visible enough that the team can trust the
                  system without wondering what changed behind the scenes.
                </p>
              </div>
            </div>

            <div className="settings-log-list">
              {automations.slice(0, 3).map((automation) => (
                <article key={`${automation.id}-log`} className="settings-log-item">
                  <div className="settings-log-head">
                    <div>
                      <p className="settings-log-label">
                        {automation.status === "active" ? "success" : "paused"}
                      </p>
                      <h3 className="settings-item-title">{automation.name}</h3>
                    </div>
                    <span
                      className="status-chip"
                      data-tone={automation.status === "active" ? "positive" : "warning"}
                    >
                      {automation.status}
                    </span>
                  </div>
                  <p className="settings-item-copy">{automation.summary}</p>
                  <p className="settings-item-note">
                    {automation.lastRunLabel
                      ? `Last run ${automation.lastRunLabel}.`
                      : "No execution recorded yet."}
                  </p>
                </article>
              ))}
            </div>
          </article>

          <article className="settings-score-card">
            <p className="settings-mini-label">Automation health score</p>
            <p className="settings-score-value">{healthScore.toFixed(1)}</p>
            <p className="settings-score-note">
              Current guardrail settings are keeping the operating layer explicit,
              reversible, and reviewable.
            </p>
          </article>

          <article className="settings-card">
            <div className="settings-card-head">
              <div>
                <span className="pill">Operating rules</span>
                <h2 className="settings-card-title">Automation discipline</h2>
                <p className="settings-card-copy">
                  A trustworthy operating system should automate aggressively only
                  where the failure modes are obvious and contained.
                </p>
              </div>
            </div>

            <div className="settings-guidance-list">
              <article className="settings-guidance-item">
                <h3 className="settings-item-title">Automate repetitive routing first</h3>
                <p className="settings-item-copy">
                  Alerts, retries, briefs, and inbox delivery are safer early
                  automation targets than autonomous publishing or strategy changes.
                </p>
              </article>
              <article className="settings-guidance-item">
                <h3 className="settings-item-title">Keep review thresholds explicit</h3>
                <p className="settings-item-copy">
                  When confidence is low or business impact is high, the product
                  should surface work to a human instead of trying to be clever.
                </p>
              </article>
              <article className="settings-guidance-item">
                <h3 className="settings-item-title">Make every policy easy to pause</h3>
                <p className="settings-item-copy">
                  A paused automation is not a failure. It is a trust-preserving
                  control that keeps the team in charge while the system matures.
                </p>
              </article>
            </div>
          </article>
        </aside>
      </section>
    </WorkspacePage>
  );
}
