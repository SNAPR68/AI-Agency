import "server-only";

export type SupabaseConfigStatus = {
  projectUrl: string;
  projectRef: string | null;
  projectHost: string | null;
  hostedRuntime: boolean;
  hostedSupabaseAccessEnforced: boolean;
  urlConfigured: boolean;
  anonKeyConfigured: boolean;
  serviceRoleConfigured: boolean;
  clientAuthReady: boolean;
  serverAdminReady: boolean;
  missing: string[];
};

function readFirstConfiguredEnv(names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return "";
}

function getSupabaseProjectUrl() {
  return readFirstConfiguredEnv(["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]);
}

function getSupabaseAnonKey() {
  return readFirstConfiguredEnv(["SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]);
}

function getSupabaseServiceRoleKey() {
  return readFirstConfiguredEnv(["SUPABASE_SERVICE_ROLE_KEY"]);
}

function isLegacyLocalAuthFallbackRequested() {
  const raw = process.env.ALLOW_LEGACY_LOCAL_AUTH_FALLBACK?.trim().toLowerCase();

  if (raw === "false") {
    return false;
  }

  return true;
}

function getProjectMetadata(projectUrl: string) {
  if (!projectUrl) {
    return {
      projectRef: null,
      projectHost: null
    };
  }

  try {
    const parsed = new URL(projectUrl);
    const projectRef = parsed.hostname.split(".")[0] ?? null;

    return {
      projectRef,
      projectHost: parsed.hostname
    };
  } catch {
    return {
      projectRef: null,
      projectHost: null
    };
  }
}

export function isHostedRuntime() {
  return Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.VERCEL_URL);
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const projectUrl = getSupabaseProjectUrl();
  const anonKey = getSupabaseAnonKey();
  const serviceRoleKey = getSupabaseServiceRoleKey();
  const { projectRef, projectHost } = getProjectMetadata(projectUrl);
  const hostedRuntime = isHostedRuntime();
  const clientAuthReady = Boolean(projectUrl && anonKey);
  const serverAdminReady = Boolean(projectUrl && serviceRoleKey);
  const missing: string[] = [];

  if (!projectUrl) {
    missing.push("project URL");
  }

  if (!anonKey) {
    missing.push("anon key");
  }

  if (!serviceRoleKey) {
    missing.push("service role key");
  }

  return {
    projectUrl,
    projectRef,
    projectHost,
    hostedRuntime,
    hostedSupabaseAccessEnforced:
      hostedRuntime && clientAuthReady && !isLegacyLocalAuthFallbackRequested(),
    urlConfigured: Boolean(projectUrl),
    anonKeyConfigured: Boolean(anonKey),
    serviceRoleConfigured: Boolean(serviceRoleKey),
    clientAuthReady,
    serverAdminReady,
    missing
  };
}

export function shouldEnforceSupabaseHostedAccess() {
  return getSupabaseConfigStatus().hostedSupabaseAccessEnforced;
}
