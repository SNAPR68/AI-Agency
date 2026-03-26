import "server-only";

import { getAppRepositoryStatus } from "./app-repository";
import { getSessionConfigStatus } from "./session";
import {
  getGlobalShopifyAdminRuntimeStatus,
  type ShopifyAdminRuntimeStatus
} from "./shopify-admin-client";
import { getSupabaseConfigStatus } from "./supabase-env";

export type RuntimeHealthArea = {
  name: string;
  status: "healthy" | "degraded" | "setup_required";
  summary: string;
};

export type RuntimeHealthStatus = {
  service: string;
  overallStatus: "healthy" | "degraded" | "setup_required";
  summary: string;
  areas: RuntimeHealthArea[];
  repository: ReturnType<typeof getAppRepositoryStatus>;
  supabase: ReturnType<typeof getSupabaseConfigStatus>;
  session: ReturnType<typeof getSessionConfigStatus>;
  shopify: ShopifyAdminRuntimeStatus;
};

function pickOverallStatus(
  areas: RuntimeHealthArea[]
): RuntimeHealthStatus["overallStatus"] {
  if (areas.some((area) => area.status === "setup_required")) {
    return "setup_required";
  }

  if (areas.some((area) => area.status === "degraded")) {
    return "degraded";
  }

  return "healthy";
}

function buildSummary(
  overallStatus: RuntimeHealthStatus["overallStatus"],
  repository: RuntimeHealthStatus["repository"],
  supabase: RuntimeHealthStatus["supabase"],
  shopify: RuntimeHealthStatus["shopify"]
) {
  if (overallStatus === "healthy") {
    return "Core runtime dependencies are configured cleanly enough for live-auth, repository-backed operation, and Shopify live-sync capability.";
  }

  if (overallStatus === "setup_required") {
    return "Core runtime setup is incomplete. Supabase auth/admin or session signing still needs production-grade configuration before the app can be treated as launch-ready.";
  }

  if (repository.usingFallback) {
    return "The app is running with partial fallback behavior. Core flows work, but the repository is not fully on the intended live data source yet.";
  }

  if (!shopify.globalTokenConfigured) {
    return "The platform is mostly configured, but Shopify live-sync is still relying on fallback behavior unless store-specific or brand-specific tokens are provided.";
  }

  if (!supabase.serverAdminReady) {
    return "Supabase client auth is present, but server-admin behavior is not fully configured yet.";
  }

  return "The runtime is operational, but one or more services are still degraded or partially configured.";
}

export function getRuntimeHealthStatus(): RuntimeHealthStatus {
  const repository = getAppRepositoryStatus();
  const supabase = getSupabaseConfigStatus();
  const session = getSessionConfigStatus();
  const shopify = getGlobalShopifyAdminRuntimeStatus();
  const areas: RuntimeHealthArea[] = [
    {
      name: "Supabase",
      status:
        supabase.clientAuthReady && supabase.serverAdminReady
          ? "healthy"
          : supabase.urlConfigured
            ? "degraded"
            : "setup_required",
      summary:
        supabase.clientAuthReady && supabase.serverAdminReady
          ? `Project ${supabase.projectRef ?? "configured"} has both client auth and admin access ready.`
          : supabase.urlConfigured
            ? `Project ${supabase.projectRef ?? "configured"} is linked, but it is still missing ${supabase.missing.join(", ")}.`
            : "Supabase project configuration is missing."
    },
    {
      name: "Repository",
      status:
        repository.activeSource === "postgres"
          ? "healthy"
          : repository.usingFallback
            ? "degraded"
            : "degraded",
      summary:
        repository.activeSource === "postgres"
          ? `Repository is running on Postgres in ${repository.configuredMode} mode.`
          : repository.usingFallback
            ? `Repository is configured for ${repository.configuredMode} but is still falling back to dev storage because Postgres is not ready.`
            : "Repository is still running in dev mode."
    },
    {
      name: "Session",
      status: session.signedCookiesReady ? "healthy" : "setup_required",
      summary: session.signedCookiesReady
        ? `Signed app sessions are enabled using ${session.secretSource.replaceAll("_", " ")}.`
        : "Signed app sessions are not fully configured."
    },
    {
      name: "Shopify",
      status: shopify.globalTokenConfigured ? "healthy" : "degraded",
      summary: `${shopify.modeLabel}. ${shopify.detail}`
    }
  ];
  const overallStatus = pickOverallStatus(areas);

  return {
    service: "agency-web",
    overallStatus,
    summary: buildSummary(overallStatus, repository, supabase, shopify),
    areas,
    repository,
    supabase,
    session,
    shopify
  };
}
