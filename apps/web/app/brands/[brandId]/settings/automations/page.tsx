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
    <section className="control-suite">
      <header className="command-header">
        <div className="command-header-copy">
          <p className="command-kicker">Settings / Automations</p>
          <h1 className="command-title">Automation Controls</h1>
          <p className="command-description">
            Configure operational guardrails, approval thresholds, and automated growth rules so the workspace stays
            useful without becoming opaque or reckless.
          </p>
        </div>

        <div className="command-actions">
          <a className="command-primary-button" href="#create-automation">
            Create Automation
          </a>
        </div>
      </header>

      <div className="control-automation-grid">
        <div className="control-automation-main">
          <section className="control-card">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Guardrail settings</p>
                <h2>Workspace thresholds</h2>
                <p>These controls decide how aggressively the product can act before it pauses for human review.</p>
              </div>
            </div>

            <div className="control-stat-grid">
              <article className="control-stat-card">
                <span>Approval mode</span>
                <strong>{settings.approvalMode === "always_review" ? "Review" : "Confidence"}</strong>
                <p>Current human-review posture.</p>
              </article>
              <article className="control-stat-card">
                <span>Auto-publish</span>
                <strong>{settings.autoPublishMode === "never" ? "Off" : "Approved"}</strong>
                <p>Autonomy allowed after approval.</p>
              </article>
              <article className="control-stat-card">
                <span>Sensitivity</span>
                <strong>{settings.alertSensitivity === "high" ? "09" : "07"}</strong>
                <p>Operator alert tolerance.</p>
              </article>
            </div>

            <form
              action={`/api/brands/${brandId}/automations/settings/save`}
              className="control-form-grid control-form-grid-quad"
              method="post"
            >
              <input name="next" type="hidden" value={`/brands/${brandId}/settings/automations`} />
              <label className="field-stack">
                <span className="field-label">Approval mode</span>
                <select className="text-input" defaultValue={settings.approvalMode} name="approvalMode">
                  <option value="always_review">Always review</option>
                  <option value="confidence_based">Confidence based</option>
                </select>
              </label>
              <label className="field-stack">
                <span className="field-label">Auto-publish mode</span>
                <select className="text-input" defaultValue={settings.autoPublishMode} name="autoPublishMode">
                  <option value="never">Never auto-publish</option>
                  <option value="approved_only">Approved only</option>
                </select>
              </label>
              <label className="field-stack">
                <span className="field-label">Alert sensitivity</span>
                <select className="text-input" defaultValue={settings.alertSensitivity} name="alertSensitivity">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label className="field-stack">
                <span className="field-label">Weekly brief cadence</span>
                <select className="text-input" defaultValue={settings.weeklyBriefCadence} name="weeklyBriefCadence">
                  <option value="monday_am">Monday AM</option>
                  <option value="friday_pm">Friday PM</option>
                </select>
              </label>
              <div className="control-form-actions control-form-actions-full">
                <button className="button-link" type="submit">
                  Save Thresholds
                </button>
              </div>
            </form>
          </section>

          <section className="control-card" id="create-automation">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Create policy</p>
                <h2>New automation rule</h2>
                <p>Add rules only when they reduce drag without hiding risk or making the next action opaque.</p>
              </div>
            </div>

            <form
              action={`/api/brands/${brandId}/automations/create`}
              className="control-form-grid control-form-grid-double"
              method="post"
            >
              <input name="next" type="hidden" value={`/brands/${brandId}/settings/automations`} />
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
              <div className="control-form-actions control-form-actions-full">
                <button className="button-link" type="submit">
                  Create Automation
                </button>
              </div>
            </form>
          </section>

          <section className="control-card">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Policy library</p>
                <h2>Active automation rules</h2>
                <p>Policies should remain legible enough that the team can always see what the app will automate next.</p>
              </div>
            </div>

            <div className="control-policy-list">
              {automations.map((automation) => (
                <article key={automation.id} className="control-policy-card">
                  <div className="control-policy-head">
                    <div>
                      <p className="command-mini-kicker">{formatPolicyType(automation.policyType)}</p>
                      <h3>{automation.name}</h3>
                      <p>
                        {automation.scope} · {automation.summary}
                      </p>
                    </div>
                    <div className="record-meta">
                      <span className="status-chip" data-tone={automation.status === "active" ? "positive" : "warning"}>
                        {automation.status}
                      </span>
                      {automation.nextRunLabel ? (
                        <span className="status-chip" data-tone="info">
                          Next {automation.nextRunLabel}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <form
                    action={`/api/brands/${brandId}/automations/${automation.id}/edit`}
                    className="control-form-grid control-form-grid-double"
                    method="post"
                  >
                    <input name="next" type="hidden" value={`/brands/${brandId}/settings/automations`} />
                    <label className="field-stack">
                      <span className="field-label">Name</span>
                      <input className="text-input" defaultValue={automation.name} name="name" />
                    </label>
                    <label className="field-stack">
                      <span className="field-label">Scope</span>
                      <input className="text-input" defaultValue={automation.scope} name="scope" />
                    </label>
                    <label className="field-stack field-stack-wide">
                      <span className="field-label">Summary</span>
                      <textarea className="text-area text-area-compact" defaultValue={automation.summary} name="summary" />
                    </label>
                    <label className="field-stack field-stack-wide">
                      <span className="field-label">Trigger</span>
                      <input className="text-input" defaultValue={automation.triggerLabel} name="triggerLabel" />
                    </label>
                    <div className="control-form-actions control-form-actions-full">
                      <button className="button-link-secondary" type="submit">
                        Edit Rule
                      </button>
                      <button
                        className={automation.status === "active" ? "button-link" : "button-link-secondary"}
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
          </section>
        </div>

        <aside className="control-rail">
          <article className="control-score-card">
            <span>Automation health</span>
            <strong>{healthScore.toFixed(1)}</strong>
            <p>Current guardrails are keeping the operating layer explicit, reversible, and reviewable.</p>
          </article>

          <article className="control-card">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Status logs</p>
                <h2>Recent system events</h2>
                <p>Keep rule execution visible enough that the team can trust the system without guessing.</p>
              </div>
            </div>
            <div className="control-sync-list">
              {automations.slice(0, 3).map((automation) => (
                <article key={`${automation.id}-log`} className="control-sync-item">
                  <div className="control-sync-head">
                    <div>
                      <p className="command-mini-kicker">{automation.status === "active" ? "success" : "paused"}</p>
                      <h3>{automation.name}</h3>
                    </div>
                    <span className="status-chip" data-tone={automation.status === "active" ? "positive" : "warning"}>
                      {automation.status}
                    </span>
                  </div>
                  <p>{automation.summary}</p>
                  <span>{automation.lastRunLabel ? `Last run ${automation.lastRunLabel}.` : "No execution recorded yet."}</span>
                </article>
              ))}
            </div>
          </article>

          <article className="control-card">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Operating rules</p>
                <h2>Automation discipline</h2>
                <p>A trustworthy operating system should automate aggressively only where the failure modes are obvious and contained.</p>
              </div>
            </div>
            <div className="control-note-stack">
              <article>
                <strong>Automate repetitive routing first.</strong>
                <p>Alerts, retries, briefs, and inbox delivery are safer early automation targets than autonomous publishing or strategy changes.</p>
              </article>
              <article>
                <strong>Keep review thresholds explicit.</strong>
                <p>When confidence is low or impact is high, the product should surface work to a human instead of trying to be clever.</p>
              </article>
              <article>
                <strong>Make every policy easy to pause.</strong>
                <p>A paused automation is not a failure. It is a trust-preserving control that keeps the team in charge while the system matures.</p>
              </article>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
