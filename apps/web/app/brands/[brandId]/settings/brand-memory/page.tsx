import { WorkspacePage } from "../../../../../components/workspace-page";
import { getPlatformBrandMemoryProfile } from "../../../../../lib/supabase-platform-data";

type BrandMemoryPageProps = {
  params: Promise<{
    brandId: string;
  }>;
};

function buildCompletenessScore(profile: Awaited<ReturnType<typeof getPlatformBrandMemoryProfile>>) {
  const checks = [
    profile.positioning.trim().length > 0,
    profile.targetCustomer.trim().length > 0,
    profile.tone.trim().length > 0,
    profile.heroProducts.filter(Boolean).length > 0,
    profile.doSay.filter(Boolean).length > 0,
    profile.dontSay.filter(Boolean).length > 0,
    profile.customerPersonas.filter(Boolean).length > 0
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function buildMessagingRows(profile: Awaited<ReturnType<typeof getPlatformBrandMemoryProfile>>) {
  const rows = Math.max(profile.doSay.length, profile.dontSay.length, 2);

  return Array.from({ length: rows }, (_, index) => ({
    context: `Rule ${index + 1}`,
    doSay: profile.doSay[index] ?? "Add a phrase the brand should lean on.",
    dontSay: profile.dontSay[index] ?? "Add a phrase the brand should avoid."
  }));
}

function productGradient(index: number) {
  const swatches = [
    "linear-gradient(160deg, #8b8f94, #4f555d)",
    "linear-gradient(160deg, #f3a35b, #c35645)",
    "linear-gradient(160deg, #f09d9a, #d9415c)",
    "linear-gradient(160deg, #8a765d, #5b4637)"
  ];

  return swatches[index % swatches.length];
}

export default async function BrandMemoryPage({ params }: BrandMemoryPageProps) {
  const { brandId } = await params;
  const profile = await getPlatformBrandMemoryProfile(brandId);
  const completenessScore = buildCompletenessScore(profile);
  const messagingRows = buildMessagingRows(profile);

  return (
    <WorkspacePage
      model={{
        kicker: "Brand Memory",
        title: "Brand and memory context",
        description:
          "Define the brand, tone, customer, and message boundaries that keep content, briefs, and recommendations specific instead of generic.",
        actions: [
          {
            label: "Open Content Studio",
            href: `/brands/${brandId}/content`
          },
          {
            label: "Open Users",
            href: `/brands/${brandId}/settings/users`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Hero products",
            value: `${profile.heroProducts.length}`,
            note: "Priority products the system should keep in view during recommendations."
          },
          {
            label: "Voice rules",
            value: `${profile.doSay.length + profile.dontSay.length}`,
            note: "Explicit phrases and boundaries already captured in memory."
          },
          {
            label: "Last updated",
            value: profile.updatedAtLabel,
            note: "Most recent brand-memory save."
          }
        ]
      }}
    >
      <form
        action={`/api/brands/${brandId}/settings/brand-memory/save`}
        className="settings-admin-layout"
        method="post"
      >
        <input
          name="next"
          type="hidden"
          value={`/brands/${brandId}/settings/brand-memory`}
        />

        <div className="settings-admin-main">
          <article className="settings-card" data-tone="warm">
            <div className="settings-card-head">
              <div>
                <span className="pill">Brand</span>
                <h2 className="settings-card-title">Define the memory layer</h2>
                <p className="settings-card-copy">
                  This layer becomes the narrative and messaging guardrail for every
                  brief, draft, and recommendation the workspace generates.
                </p>
              </div>

              <div className="settings-card-actions">
                <button className="button-link" type="submit">
                  Save Brand Voice
                </button>
                <a className="button-link-secondary" href="#messaging-rules">
                  Add Messaging Rule
                </a>
                <a className="button-link-secondary" href="#hero-products">
                  Add Hero Product
                </a>
                <a className="button-link-secondary" href="#personas">
                  Update Persona
                </a>
              </div>
            </div>

            <div className="settings-split-grid">
              <article className="settings-field-panel">
                <p className="settings-mini-label">Mission statement</p>
                <label className="field-stack">
                  <span className="field-label">Positioning</span>
                  <textarea
                    className="text-area text-area-compact"
                    defaultValue={profile.positioning}
                    name="positioning"
                  />
                </label>
              </article>

              <article className="settings-field-panel">
                <p className="settings-mini-label">Core narrative</p>
                <label className="field-stack">
                  <span className="field-label">Target customer</span>
                  <textarea
                    className="text-area text-area-compact"
                    defaultValue={profile.targetCustomer}
                    name="targetCustomer"
                  />
                </label>
              </article>
            </div>
          </article>

          <article className="settings-card">
            <div className="settings-card-head">
              <div>
                <span className="pill">Tone &amp; voice</span>
                <h2 className="settings-card-title">Alignment and phrasing</h2>
                <p className="settings-card-copy">
                  Set the emotional tone, the phrases the brand should repeat, and the
                  shortcuts the system should avoid.
                </p>
              </div>
            </div>

            <div className="settings-split-grid">
              <article className="settings-field-panel">
                <label className="field-stack">
                  <span className="field-label">Tone</span>
                  <input className="text-input" defaultValue={profile.tone} name="tone" />
                </label>

                <div className="settings-mini-metrics">
                  <article className="settings-mini-metric">
                    <p className="settings-mini-label">Current tone</p>
                    <p className="settings-mini-value">{profile.tone.split(",")[0]}</p>
                    <p className="settings-mini-note">
                      Keep the tone short enough that operators can use it as a
                      decision filter.
                    </p>
                  </article>
                </div>
              </article>

              <article className="settings-field-panel" data-tone="warm">
                <p className="settings-mini-label">Personal alignment</p>
                <p className="settings-card-copy">
                  Current voice rules give the model a clear baseline for what should
                  sound like {profile.brandName}.
                </p>

                <div className="settings-score-grid">
                  <article className="settings-mini-metric">
                    <p className="settings-mini-label">Use</p>
                    <p className="settings-mini-value">{profile.doSay.length}</p>
                    <p className="settings-mini-note">Priority phrases in memory.</p>
                  </article>
                  <article className="settings-mini-metric">
                    <p className="settings-mini-label">Avoid</p>
                    <p className="settings-mini-value">{profile.dontSay.length}</p>
                    <p className="settings-mini-note">Phrases blocked from output.</p>
                  </article>
                </div>
              </article>
            </div>

            <div className="settings-split-grid">
              <article className="settings-field-panel">
                <label className="field-stack">
                  <span className="field-label">Say this</span>
                  <textarea
                    className="text-area text-area-compact"
                    defaultValue={profile.doSay.join(", ")}
                    name="doSay"
                  />
                </label>
              </article>

              <article className="settings-field-panel">
                <label className="field-stack">
                  <span className="field-label">Do not say this</span>
                  <textarea
                    className="text-area text-area-compact"
                    defaultValue={profile.dontSay.join(", ")}
                    name="dontSay"
                  />
                </label>
              </article>
            </div>
          </article>

          <article className="settings-card" id="messaging-rules">
            <div className="settings-card-head">
              <div>
                <span className="pill">Messaging rules</span>
                <h2 className="settings-card-title">What should be repeated, avoided, or reframed</h2>
                <p className="settings-card-copy">
                  Treat this as the editorial decision table the rest of the product
                  must obey.
                </p>
              </div>
            </div>

            <div className="settings-table-header">
              <p className="settings-table-head">Rule context</p>
              <p className="settings-table-head">Do say</p>
              <p className="settings-table-head">Don&apos;t say</p>
              <p className="settings-table-head">Action</p>
            </div>

            <div className="settings-messaging-table">
              {messagingRows.map((row) => (
                <article key={row.context} className="settings-table-row">
                  <div className="settings-table-cell">
                    <p className="settings-table-title">{row.context}</p>
                    <p className="settings-table-subcopy">
                      Use the positive phrasing and actively remove the negative
                      substitute when drafting.
                    </p>
                  </div>
                  <div className="settings-table-cell">
                    <span className="status-chip" data-tone="positive">
                      {row.doSay}
                    </span>
                  </div>
                  <div className="settings-table-cell">
                    <span className="status-chip" data-tone="danger">
                      {row.dontSay}
                    </span>
                  </div>
                  <div className="settings-table-cell">
                    <a className="button-link-secondary" href="#hero-products">
                      Link
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="settings-card" id="hero-products">
            <div className="settings-card-head">
              <div>
                <span className="pill">Hero products</span>
                <h2 className="settings-card-title">What the brand should push most clearly</h2>
                <p className="settings-card-copy">
                  Hero products help the operating system decide where content,
                  merchandising, and reporting attention should concentrate.
                </p>
              </div>
            </div>

            <div className="settings-hero-grid">
              {profile.heroProducts.map((product, index) => (
                <article key={product} className="settings-hero-card">
                  <div
                    className="settings-hero-swatch"
                    style={{ background: productGradient(index) }}
                  >
                    Hero product
                  </div>
                  <div className="settings-hero-head">
                    <div>
                      <h3 className="settings-hero-title">{product}</h3>
                      <p className="settings-item-note">
                        Keep this product visible in recommendations, briefs, and
                        calendars.
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="settings-divider" />

            <label className="field-stack">
              <span className="field-label">Hero products</span>
              <input
                className="text-input"
                defaultValue={profile.heroProducts.join(", ")}
                name="heroProducts"
              />
            </label>
          </article>

          <article className="settings-card" id="personas">
            <div className="settings-card-head">
              <div>
                <span className="pill">Customer personas</span>
                <h2 className="settings-card-title">Who the brand is actually trying to move</h2>
                <p className="settings-card-copy">
                  Personas should stay sharp enough to help the team choose language,
                  proof, and product emphasis quickly.
                </p>
              </div>
            </div>

            <div className="settings-persona-grid">
              {profile.customerPersonas.map((persona, index) => (
                <article key={persona} className="settings-persona-card">
                  <div className="settings-persona-avatar">
                    {persona
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <p className="settings-persona-tag">Persona {index + 1}</p>
                  <h3 className="settings-persona-name">{persona}</h3>
                  <p className="settings-persona-meta">
                    Update this when a different buyer or usage story should anchor the
                    workspace.
                  </p>
                </article>
              ))}
            </div>

            <div className="settings-divider" />

            <label className="field-stack">
              <span className="field-label">Customer personas</span>
              <textarea
                className="text-area text-area-compact"
                defaultValue={profile.customerPersonas.join(", ")}
                name="customerPersonas"
              />
            </label>

            <div className="settings-card-actions">
              <button className="button-link" type="submit">
                Save Brand Voice
              </button>
            </div>
          </article>
        </div>

        <aside className="settings-admin-rail">
          <article className="settings-card">
            <div className="settings-card-head">
              <div>
                <span className="pill">Consistency guide</span>
                <h2 className="settings-card-title">How to keep the memory useful</h2>
                <p className="settings-card-copy">
                  Keep the layer opinionated, brief, and close enough to the actual
                  brand that the team can trust it in review.
                </p>
              </div>
            </div>

            <div className="settings-guidance-list">
              <article className="settings-guidance-item">
                <h3 className="settings-item-title">Avoid generic vibes</h3>
                <p className="settings-item-copy">
                  Replace abstract adjectives with proof, ingredients, origin, or the
                  specific customer outcome the brand owns.
                </p>
              </article>
              <article className="settings-guidance-item">
                <h3 className="settings-item-title">Use the brand’s actual language</h3>
                <p className="settings-item-copy">
                  The memory should sound like a sharp creative brief, not like a
                  taxonomy dump for a model.
                </p>
              </article>
              <article className="settings-guidance-item">
                <h3 className="settings-item-title">Refresh when launches change</h3>
                <p className="settings-item-copy">
                  Hero products, personas, and approved phrasing should evolve as the
                  brand changes focus.
                </p>
              </article>
            </div>
          </article>

          <article className="settings-score-card">
            <p className="settings-mini-label">Brand score</p>
            <p className="settings-score-value">{completenessScore}%</p>
            <p className="settings-score-note">
              Memory completeness based on positioning, target customer, tone,
              hero products, phrasing rules, and personas.
            </p>
          </article>
        </aside>
      </form>
    </WorkspacePage>
  );
}
