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
  const toneTags = profile.tone
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return (
    <form
      action={`/api/brands/${brandId}/settings/brand-memory/save`}
      className="control-suite"
      method="post"
    >
      <input name="next" type="hidden" value={`/brands/${brandId}/settings/brand-memory`} />

      <header className="command-header">
        <div className="command-header-copy">
          <p className="command-kicker">Settings / Brand Memory</p>
          <h1 className="command-title">Brand Memory</h1>
          <p className="command-description">
            Define the soul of the brand. This ledger stores the narrative archetypes, tone constraints, and hero
            products that steer every recommendation, draft, and approval.
          </p>
        </div>

        <div className="command-actions">
          <button className="command-primary-button" type="submit">
            Save Brand Voice
          </button>
          <a className="command-secondary-button" href="#messaging-rules">
            Add Messaging Rule
          </a>
          <a className="command-secondary-button" href="#hero-products">
            Add Hero Product
          </a>
          <a className="command-secondary-button" href="#personas">
            Update Persona
          </a>
        </div>
      </header>

      <div className="control-memory-grid">
        <div className="control-memory-main">
          <section className="control-card">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Brand profile</p>
                <h2>Mission statement and core narrative</h2>
                <p>Keep the memory concise and sharp enough that operators can use it as a creative decision filter.</p>
              </div>
            </div>
            <div className="control-form-grid control-form-grid-double">
              <label className="field-stack">
                <span className="field-label">Positioning</span>
                <textarea className="text-area text-area-compact" defaultValue={profile.positioning} name="positioning" />
              </label>
              <label className="field-stack">
                <span className="field-label">Target customer</span>
                <textarea
                  className="text-area text-area-compact"
                  defaultValue={profile.targetCustomer}
                  name="targetCustomer"
                />
              </label>
            </div>
          </section>

          <section className="control-card">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Tone &amp; voice</p>
                <h2>Alignment and phrasing</h2>
                <p>These attributes define how the system should sound before it writes a single line of content.</p>
              </div>
            </div>

            <div className="control-voice-grid">
              <label className="field-stack">
                <span className="field-label">Tone</span>
                <input className="text-input" defaultValue={profile.tone} name="tone" />
              </label>
              <article className="control-tone-card">
                <span>Current voice posture</span>
                <div className="control-tone-tags">
                  {toneTags.map((tag) => (
                    <strong key={tag}>{tag}</strong>
                  ))}
                </div>
                <p>Current settings give the workspace a concrete baseline for what should sound like {profile.brandName}.</p>
              </article>
            </div>

            <div className="control-form-grid control-form-grid-double">
              <label className="field-stack">
                <span className="field-label">Do say</span>
                <textarea className="text-area text-area-compact" defaultValue={profile.doSay.join(", ")} name="doSay" />
              </label>
              <label className="field-stack">
                <span className="field-label">Don&apos;t say</span>
                <textarea
                  className="text-area text-area-compact"
                  defaultValue={profile.dontSay.join(", ")}
                  name="dontSay"
                />
              </label>
            </div>
          </section>

          <section className="control-card" id="messaging-rules">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Messaging rules</p>
                <h2>Rule table</h2>
                <p>Treat this as the editorial decision table the rest of the product must obey.</p>
              </div>
            </div>

            <div className="control-rule-grid">
              {messagingRows.map((row) => (
                <article key={row.context} className="control-rule-row">
                  <div>
                    <strong>{row.context}</strong>
                    <p>Use the positive phrasing and actively remove the negative substitute when drafting.</p>
                  </div>
                  <span className="status-chip" data-tone="positive">
                    {row.doSay}
                  </span>
                  <span className="status-chip" data-tone="danger">
                    {row.dontSay}
                  </span>
                  <a className="button-link-secondary" href="#hero-products">
                    Link
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="control-card" id="hero-products">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Hero products</p>
                <h2>Priority product set</h2>
                <p>These are the products the workspace should keep visible in briefs, recommendations, and planning.</p>
              </div>
            </div>

            <div className="control-product-grid">
              {profile.heroProducts.map((product, index) => (
                <article key={product} className="control-product-card">
                  <div className="control-product-swatch" style={{ background: productGradient(index) }}>
                    Hero product
                  </div>
                  <div>
                    <strong>{product}</strong>
                    <p>Keep this product visible in recommendations, briefs, and calendars.</p>
                  </div>
                </article>
              ))}
            </div>

            <label className="field-stack">
              <span className="field-label">Hero products</span>
              <input className="text-input" defaultValue={profile.heroProducts.join(", ")} name="heroProducts" />
            </label>
          </section>

          <section className="control-card" id="personas">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Customer personas</p>
                <h2>Who the brand is actually trying to move</h2>
                <p>Personas should be sharp enough to help the team choose language, proof, and product emphasis quickly.</p>
              </div>
            </div>

            <div className="control-persona-grid">
              {profile.customerPersonas.map((persona, index) => (
                <article key={persona} className="control-persona-card">
                  <div className="control-persona-avatar">
                    {persona
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <span>Persona {index + 1}</span>
                  <strong>{persona}</strong>
                  <p>Update this whenever a different buyer or usage story should anchor the workspace.</p>
                </article>
              ))}
            </div>

            <label className="field-stack">
              <span className="field-label">Customer personas</span>
              <textarea
                className="text-area text-area-compact"
                defaultValue={profile.customerPersonas.join(", ")}
                name="customerPersonas"
              />
            </label>
          </section>
        </div>

        <aside className="control-rail">
          <article className="control-score-card">
            <span>Brand score</span>
            <strong>{completenessScore}%</strong>
            <p>Completeness based on positioning, customer, tone, hero products, phrasing rules, and personas.</p>
          </article>

          <article className="control-card">
            <div className="control-card-head">
              <div>
                <p className="command-mini-kicker">Consistency guide</p>
                <h2>How to keep memory useful</h2>
                <p>Keep the layer opinionated, brief, and close enough to the actual brand that the team can trust it in review.</p>
              </div>
            </div>
            <div className="control-note-stack">
              <article>
                <strong>Avoid generic vibes.</strong>
                <p>Replace abstract adjectives with proof, ingredients, origin, or the specific outcome the brand owns.</p>
              </article>
              <article>
                <strong>Use the brand’s actual language.</strong>
                <p>The memory should sound like a sharp creative brief, not like a taxonomy dump for a model.</p>
              </article>
              <article>
                <strong>Refresh when launches change.</strong>
                <p>Hero products, personas, and approved phrasing should evolve as the brand changes focus.</p>
              </article>
            </div>
          </article>
        </aside>
      </div>
    </form>
  );
}
