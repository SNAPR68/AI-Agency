import { type PresentationTone } from "../../../../../components/data-presentation";
import { WorkspacePage } from "../../../../../components/workspace-page";
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

function integrationTone(status: string): PresentationTone {
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
    <WorkspacePage
      model={{
        kicker: "Integrations",
        title: "Integrations and sync health",
        description:
          "Manage provider trust, see when the data spine last refreshed, and keep the workspace honest about what is live, degraded, or still staged.",
        actions: [
          {
            label: "Sync Now",
            href: `/brands/${brandId}/settings/integrations`
          },
          {
            label: "Open Overview",
            href: `/brands/${brandId}/overview`,
            tone: "secondary"
          }
        ],
        stats: [
          {
            label: "Connected",
            value: `${connectedCount}`,
            note: "Providers currently healthy enough to trust in weekly operations."
          },
          {
            label: "Degraded",
            value: `${degradedCount}`,
            note: "Connections that need a reconnect or diagnostic pass before they are fully trustworthy."
          },
          {
            label: "Pending",
            value: `${pendingCount}`,
            note: "Sources still staged for setup or waiting on the first real sync."
          }
        ]
      }}
    >
      {integrationMessage ? <div className="message-banner">{integrationMessage}</div> : null}

      <section className="settings-admin-layout">
        <div className="settings-admin-main">
          <article className="settings-card" data-tone="warm">
            <div className="settings-card-head">
              <div>
                <span className="pill">System configuration</span>
                <h2 className="settings-card-title">Shopify commerce backbone</h2>
                <p className="settings-card-copy">
                  This is the first real entry point into the operating system. Once
                  the store is connected, sync runs can populate products, orders,
                  customers, and daily metrics into the workspace.
                </p>
              </div>
            </div>

            <div className="settings-mini-metrics">
              <article className="settings-mini-metric">
                <p className="settings-mini-label">Trust score</p>
                <p className="settings-mini-value">{trustScore}</p>
                <p className="settings-mini-note">Provider health across the workspace.</p>
              </article>
              <article className="settings-mini-metric">
                <p className="settings-mini-label">Sync mode</p>
                <p className="settings-mini-value">
                  {shopifySyncStatus.liveSyncReady ? "Live" : "Fallback"}
                </p>
                <p className="settings-mini-note">{shopifySyncStatus.modeLabel}</p>
              </article>
              <article className="settings-mini-metric">
                <p className="settings-mini-label">Last ingest</p>
                <p className="settings-mini-value">
                  {latestRun?.finishedAtLabel ?? "Awaiting first run"}
                </p>
                <p className="settings-mini-note">
                  {latestRun
                    ? `${latestRun.recordsProcessed} records processed`
                    : "No Shopify sync history yet."}
                </p>
              </article>
            </div>

            <form
              action={`/api/brands/${brandId}/integrations/shopify/connect`}
              className="editor-form"
              method="post"
            >
              <input
                name="next"
                type="hidden"
                value={`/brands/${brandId}/settings/integrations`}
              />

              <div className="form-grid">
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
              </div>

              <div className="settings-card-actions">
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

          <article className="settings-card">
            <div className="settings-card-head">
              <div>
                <span className="pill">Provider connectivity</span>
                <h2 className="settings-card-title">Connection health</h2>
                <p className="settings-card-copy">
                  Each source should make freshness, coverage, and the next operator
                  action explicit.
                </p>
              </div>
            </div>

            <div className="settings-provider-list">
              {integrations.map((integration) => {
                const primaryAction =
                  integration.status === "pending"
                    ? `/api/brands/${brandId}/integrations/${integration.provider}/connect`
                    : `/api/brands/${brandId}/integrations/${integration.provider}/sync`;

                return (
                  <article
                    key={integration.provider}
                    className="settings-provider-card"
                  >
                    <div className="settings-provider-head">
                      <div>
                        <p className="settings-item-eyebrow">{integration.provider}</p>
                        <h3 className="settings-item-title">{integration.label}</h3>
                        <p className="settings-item-note">{integration.accountLabel}</p>
                      </div>

                      <div className="record-meta">
                        <span
                          className="status-chip"
                          data-tone={integrationTone(integration.status)}
                        >
                          {integration.status}
                        </span>
                        <span className="status-chip" data-tone="info">
                          {integration.lastSyncedLabel}
                        </span>
                      </div>
                    </div>

                    <p className="settings-item-copy">
                      {integration.coverage}. {integration.note}
                    </p>

                    <div className="settings-inline-actions">
                      <form action={primaryAction} className="inline-form" method="post">
                        <input
                          name="next"
                          type="hidden"
                          value={`/brands/${brandId}/settings/integrations`}
                        />
                        <button className="button-link" type="submit">
                          {resolveProviderActionLabel(integration.label, integration.status)}
                        </button>
                      </form>
                      <a className="button-link-secondary" href="#sync-history">
                        View source
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="settings-card" id="sync-history">
            <div className="settings-card-head">
              <div>
                <span className="pill">Sync history</span>
                <h2 className="settings-card-title">Recent Shopify ingest history</h2>
                <p className="settings-card-copy">
                  Operators should be able to see when the commerce backbone last ran,
                  what happened, and how much data moved.
                </p>
              </div>
            </div>

            <div className="settings-log-list">
              {shopifySyncRuns.length > 0 ? (
                shopifySyncRuns.map((run) => (
                  <article
                    key={`${run.provider}-${run.startedAt ?? run.updatedAt}`}
                    className="settings-log-item"
                  >
                    <div className="settings-log-head">
                      <div>
                        <p className="settings-log-label">{run.provider.toUpperCase()}</p>
                        <h3 className="settings-item-title">{run.triggerLabel}</h3>
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
                    <p className="settings-item-copy">
                      {run.status === "failed"
                        ? `${run.errorMessage ?? "Sync failed."} ${run.sourceDescription}`
                        : `${run.recordsProcessed} records processed. ${run.sourceDescription}`}
                    </p>
                    <p className="settings-item-note">
                      Started {run.startedAtLabel ?? "recently"} and finished{" "}
                      {run.finishedAtLabel ?? "recently"}.
                    </p>
                  </article>
                ))
              ) : (
                <p className="empty-note">
                  No Shopify sync runs yet. Connect the store and run the first ingest.
                </p>
              )}
            </div>
          </article>
        </div>

        <aside className="settings-admin-rail">
          <article className="settings-score-card">
            <p className="settings-mini-label">Connection score</p>
            <p className="settings-score-value">{trustScore}</p>
            <p className="settings-score-note">
              The current workspace can trust {connectedCount} of {integrations.length} live
              sources without qualification.
            </p>
          </article>

          <article className="settings-card">
            <div className="settings-card-head">
              <div>
                <span className="pill">Sync confidence</span>
                <h2 className="settings-card-title">Live mode diagnostics</h2>
                <p className="settings-card-copy">{shopifySyncStatus.detail}</p>
              </div>
            </div>

            <div className="settings-guidance-list">
              <article className="settings-guidance-item">
                <p className="settings-item-eyebrow">Store record</p>
                <h3 className="settings-item-title">
                  {shopifyStore ? shopifyStore.shopDomain : "No Shopify store saved yet"}
                </h3>
                <p className="settings-item-copy">
                  {shopifyStore
                    ? `Currency ${shopifyStore.currency}. Connected ${shopifyStore.connectedAtLabel ?? "recently"} and updated ${shopifyStore.updatedAtLabel}.`
                    : "Add a store domain before triggering live commerce syncs."}
                </p>
              </article>

              <article className="settings-guidance-item">
                <p className="settings-item-eyebrow">Fallback behavior</p>
                <h3 className="settings-item-title">
                  {shopifySyncStatus.liveSyncReady ? "Live Admin API mode" : "Seeded fallback mode"}
                </h3>
                <p className="settings-item-copy">
                  {latestRun?.fallbackReason
                    ? `Latest fallback reason: ${latestRun.fallbackReason.replaceAll("_", " ")}.`
                    : "When live credentials are unavailable or a request fails, the workspace can still refresh from the seeded snapshot."}
                </p>
              </article>
            </div>
          </article>

          <article className="settings-card">
            <div className="settings-card-head">
              <div>
                <span className="pill">Operating notes</span>
                <h2 className="settings-card-title">What good looks like</h2>
                <p className="settings-card-copy">
                  The control layer should keep confidence and next actions visible,
                  not hide uncertainty behind a generic “connected” state.
                </p>
              </div>
            </div>

            <div className="settings-guidance-list">
              <article className="settings-guidance-item">
                <h3 className="settings-item-title">Make freshness visible</h3>
                <p className="settings-item-copy">
                  If a source is stale, the workspace should show it directly instead
                  of quietly lowering trust behind the scenes.
                </p>
              </article>
              <article className="settings-guidance-item">
                <h3 className="settings-item-title">Start with the commerce backbone</h3>
                <p className="settings-item-copy">
                  Shopify is the base layer. Meta and GA4 add performance context, and
                  Klaviyo extends retention visibility.
                </p>
              </article>
              <article className="settings-guidance-item">
                <h3 className="settings-item-title">Tie state to action</h3>
                <p className="settings-item-copy">
                  Every degraded or pending integration should carry an obvious reconnect
                  or sync action so operators are never guessing.
                </p>
              </article>
            </div>
          </article>
        </aside>
      </section>
    </WorkspacePage>
  );
}
