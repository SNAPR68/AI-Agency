import {
  getPlatformPrimaryShopifyStore,
  listPlatformIntegrationViews,
  listPlatformProviderSyncRuns
} from "../../../../../lib/supabase-platform-data";
import { getShopifyAdminSyncStatus } from "../../../../../lib/shopify-admin-client";

type IntegrationsPageProps = {
  params: Promise<{
    brandId: string;
  }>;
  searchParams: Promise<{
    connected?: string;
    synced?: string;
    error?: string;
    syncSource?: string;
    syncFallback?: string;
  }>;
};

function integrationTone(status: string) {
  if (status === "connected") {
    return "positive";
  }

  if (status === "degraded") {
    return "warning";
  }

  return "info";
}

function resolveProviderActionLabel(label: string, status: string) {
  if (status === "pending") {
    return `Connect ${label}`;
  }

  if (status === "degraded") {
    return "Reconnect";
  }

  return "Sync Now";
}

export default async function IntegrationsPage({
  params,
  searchParams
}: IntegrationsPageProps) {
  const { brandId } = await params;
  const {
    connected: connectedProvider,
    synced: syncedProvider,
    error,
    syncSource,
    syncFallback
  } = await searchParams;

  const integrations = await listPlatformIntegrationViews(brandId);
  const shopifyStore = await getPlatformPrimaryShopifyStore(brandId);
  const shopifySyncStatus = getShopifyAdminSyncStatus(
    brandId,
    shopifyStore?.shopDomain ?? null
  );
  const shopifySyncRuns = (await listPlatformProviderSyncRuns(brandId, "shopify")).slice(0, 5);

  const connectedCount = integrations.filter((item) => item.status === "connected").length;
  const degradedCount = integrations.filter((item) => item.status === "degraded").length;
  const pendingCount = integrations.filter((item) => item.status === "pending").length;
  const latestRun = shopifySyncRuns[0] ?? null;
  const trustScore = Math.round(
    ((connectedCount + degradedCount * 0.35) / Math.max(integrations.length, 1)) * 100
  );

  const integrationMessage =
    error === "missing-shopify-store"
      ? "Connect the Shopify store domain before you trigger a Shopify sync."
      : syncedProvider === "shopify" && syncSource === "live"
        ? "Shopify live Admin API sync completed and the workspace refreshed from the connected store."
        : syncedProvider === "shopify" && syncSource === "seeded"
          ? syncFallback === "request_failed"
            ? "Shopify sync completed using the seeded fallback snapshot because the live Admin API request failed."
            : "Shopify sync completed using the seeded fallback snapshot because live Admin API credentials are not configured yet."
          : connectedProvider
            ? `${connectedProvider.toUpperCase()} connection updated.`
            : syncedProvider
              ? `${syncedProvider.toUpperCase()} sync completed and the workspace state has been refreshed.`
              : null;

  return (
    <section className="control-suite">
      <header className="command-header">
        <div className="command-header-copy">
          <p className="command-kicker">Settings / Integrations</p>
          <h1 className="command-title">Integrations &amp; Sync Health</h1>
          <p className="command-description">
            Manage external data connections, sync confidence, and provider health. High-fidelity refreshes keep the
            operating system honest about what is live, degraded, or still staged.
          </p>
        </div>

        <div className="command-actions">
          <a className="command-secondary-button" href="#shopify-store">
            Connect Shopify
          </a>
          <form
            action={`/api/brands/${brandId}/integrations/shopify/sync`}
            className="inline-form"
            method="post"
          >
            <input name="next" type="hidden" value={`/brands/${brandId}/settings/integrations`} />
            <button className="command-primary-button" type="submit">
              Sync Now
            </button>
          </form>
        </div>
      </header>

      {integrationMessage ? <div className="message-banner">{integrationMessage}</div> : null}

      <div className="control-hero-grid">
        <article className="control-hero-card" id="shopify-store">
          <div className="control-hero-top">
            <div>
              <p className="command-mini-kicker">Commerce backbone</p>
              <h2>Shopify Main Store</h2>
              <p>{shopifyStore?.shopDomain ?? "Add the primary Shopify store domain to begin live commerce syncs."}</p>
            </div>
            <div className="record-meta">
              <span className="status-chip" data-tone={shopifySyncStatus.liveSyncReady ? "positive" : "warning"}>
                {shopifySyncStatus.liveSyncReady ? "live mode" : "fallback mode"}
              </span>
              <span className="status-chip" data-tone="info">
                {latestRun?.finishedAtLabel ?? "awaiting first run"}
              </span>
            </div>
          </div>

          <div className="control-stat-grid">
            <article className="control-stat-card">
              <span>Trust score</span>
              <strong>{trustScore}</strong>
              <p>Confidence across all connected providers.</p>
            </article>
            <article className="control-stat-card">
              <span>Freshness</span>
              <strong>{latestRun?.recordsProcessed ?? 0}</strong>
              <p>Records moved on the latest Shopify ingest.</p>
            </article>
            <article className="control-stat-card">
              <span>Status mix</span>
              <strong>
                {connectedCount}/{integrations.length}
              </strong>
              <p>
                {degradedCount} degraded · {pendingCount} pending
              </p>
            </article>
          </div>

          <form
            action={`/api/brands/${brandId}/integrations/shopify/connect`}
            className="control-form-grid"
            method="post"
          >
            <input name="next" type="hidden" value={`/brands/${brandId}/settings/integrations`} />
            <label className="field-stack">
              <span className="field-label">Shop domain</span>
              <input
                className="text-input"
                defaultValue={shopifyStore?.shopDomain ?? ""}
                name="shopDomain"
                placeholder="brand.myshopify.com"
                required
                type="text"
              />
            </label>
            <label className="field-stack">
              <span className="field-label">Currency</span>
              <input
                className="text-input"
                defaultValue={shopifyStore?.currency ?? "USD"}
                maxLength={3}
                name="currency"
                placeholder="USD"
                required
                type="text"
              />
            </label>
            <div className="control-form-actions">
              <button className="button-link" type="submit">
                Connect Shopify
              </button>
              <button
                className="button-link-secondary"
                formAction={`/api/brands/${brandId}/integrations/shopify/sync`}
                type="submit"
              >
                Sync Now
              </button>
            </div>
          </form>
        </article>

        <article className="control-side-card">
          <p className="command-mini-kicker">Sync performance</p>
          <h2>Live mode diagnostics</h2>
          <p>{shopifySyncStatus.detail}</p>
          <div className="control-metric-list">
            <article>
              <span>Provider uptime</span>
              <strong>{connectedCount === integrations.length ? "100.0%" : "92.4%"}</strong>
            </article>
            <article>
              <span>Payload confidence</span>
              <strong>{shopifySyncStatus.liveSyncReady ? "High" : "Fallback"}</strong>
            </article>
            <article>
              <span>Last mode</span>
              <strong>{latestRun?.sourceLabel ?? shopifySyncStatus.modeLabel}</strong>
            </article>
          </div>
          <div className="control-note-card">
            <strong>Growth integrity check</strong>
            <p>
              {latestRun?.fallbackReason
                ? `Latest fallback reason: ${latestRun.fallbackReason.replaceAll("_", " ")}.`
                : "No data drift is currently being reported across the connected commerce layer."}
            </p>
          </div>
        </article>
      </div>

      <section className="control-provider-grid">
        {integrations.map((integration) => {
          const primaryAction =
            integration.status === "pending"
              ? `/api/brands/${brandId}/integrations/${integration.provider}/connect`
              : `/api/brands/${brandId}/integrations/${integration.provider}/sync`;

          return (
            <article key={integration.provider} className="control-provider-card">
              <div className="control-provider-head">
                <div>
                  <p className="command-mini-kicker">{integration.provider}</p>
                  <h2>{integration.label}</h2>
                  <p>{integration.accountLabel}</p>
                </div>
                <div className="record-meta">
                  <span className="status-chip" data-tone={integrationTone(integration.status)}>
                    {integration.status}
                  </span>
                  <span className="status-chip" data-tone="info">
                    {integration.lastSyncedLabel}
                  </span>
                </div>
              </div>

              <p className="control-provider-copy">
                {integration.coverage}. {integration.note}
              </p>

              <div className="control-provider-actions">
                <form action={primaryAction} className="inline-form" method="post">
                  <input name="next" type="hidden" value={`/brands/${brandId}/settings/integrations`} />
                  <button className="button-link" type="submit">
                    {resolveProviderActionLabel(integration.label, integration.status)}
                  </button>
                </form>
                <a className="button-link-secondary" href="#sync-history">
                  View Source
                </a>
              </div>
            </article>
          );
        })}
      </section>

      <section className="control-card" id="sync-history">
        <div className="control-card-head">
          <div>
            <p className="command-mini-kicker">Sync history</p>
            <h2>Recent Shopify ingest history</h2>
            <p>Operators should be able to see when the commerce backbone last ran and what happened during the refresh.</p>
          </div>
        </div>

        <div className="control-sync-list">
          {shopifySyncRuns.length > 0 ? (
            shopifySyncRuns.map((run) => (
              <article
                key={`${run.provider}-${run.startedAt ?? run.updatedAt}`}
                className="control-sync-item"
              >
                <div className="control-sync-head">
                  <div>
                    <p className="command-mini-kicker">{run.provider.toUpperCase()}</p>
                    <h3>{run.triggerLabel}</h3>
                  </div>
                  <div className="record-meta">
                    <span
                      className="status-chip"
                      data-tone={
                        run.status === "success"
                          ? "positive"
                          : run.status === "failed"
                            ? "danger"
                            : "info"
                      }
                    >
                      {run.status}
                    </span>
                    <span className="status-chip" data-tone={run.sourceTone}>
                      {run.sourceLabel}
                    </span>
                  </div>
                </div>
                <p>
                  {run.status === "failed"
                    ? `${run.errorMessage ?? "Sync failed."} ${run.sourceDescription}`
                    : `${run.recordsProcessed} records processed. ${run.sourceDescription}`}
                </p>
                <span>
                  Started {run.startedAtLabel ?? "recently"} and finished {run.finishedAtLabel ?? "recently"}.
                </span>
              </article>
            ))
          ) : (
            <p className="empty-note">No Shopify sync runs yet. Connect the store and run the first ingest.</p>
          )}
        </div>
      </section>
    </section>
  );
}
