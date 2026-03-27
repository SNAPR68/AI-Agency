import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getDefaultBrandPath } from "./navigation";
import {
  getSupabaseConfigStatus,
  isHostedRuntime,
  shouldEnforceSupabaseHostedAccess
} from "./supabase-env";
import {
  getSupabaseAccessibleBrandsForUser,
  getSupabaseDefaultBrandIdForUser,
  getSupabaseWorkspaceContext,
  getSupabaseWorkspaceUserByEmail,
  getSupabaseWorkspaceUserById,
  isSupabaseUserInBrand
} from "./supabase-workspace-auth";
import {
  getUserByEmail,
  getAccessibleBrandsForUser,
  getDefaultBrandIdForUser,
  getUserById,
  getWorkspaceContext,
  isUserInBrand
} from "./workspace-data";

export const sessionCookieName = "agency_session";
export const legacySessionCookieName = "agency_demo_session";
export const sessionCookieMaxAgeSeconds = 60 * 60 * 24 * 30;

export type SessionConfigStatus = {
  signedCookiesReady: boolean;
  secretSource: "session_secret" | "supabase_service_role" | "dev_default" | "missing";
  legacyLocalAuthFallbackEnabled: boolean;
  hostedRuntime: boolean;
  supabaseHostedAccessEnforced: boolean;
};

export type AppSession = {
  userId: string;
  brandId: string;
  userEmail?: string;
};

type SessionPayload = AppSession & {
  issuedAt?: string;
  version?: number;
};

export type AuthState = {
  session: AppSession;
  user: NonNullable<ReturnType<typeof getUserById>>;
  accessibleBrands: ReturnType<typeof getAccessibleBrandsForUser>;
  defaultBrandId: string;
};

export type AuthorizedBrandState = AuthState & {
  workspace: ReturnType<typeof getWorkspaceContext>;
};

export function authHasBrandAccess(auth: AuthState, brandId: string) {
  return auth.accessibleBrands.some((brand) => brand.id === brandId);
}

function normalizeSessionPayload(parsed: unknown): AppSession | null {
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).userId !== "string" ||
    typeof (parsed as Record<string, unknown>).brandId !== "string"
  ) {
    return null;
  }

  const payload = parsed as SessionPayload;

  return {
    userId: payload.userId,
    brandId: payload.brandId,
    userEmail:
      typeof payload.userEmail === "string" ? payload.userEmail.toLowerCase() : undefined
  };
}

function getSessionSecret() {
  const explicitSecret = process.env.SESSION_SECRET?.trim();

  if (explicitSecret) {
    return explicitSecret;
  }

  const derivedSecret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (derivedSecret) {
    return derivedSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "agency-local-dev-session-secret";
  }

  return "";
}

function getSessionSecretSource(): SessionConfigStatus["secretSource"] {
  if (process.env.SESSION_SECRET?.trim()) {
    return "session_secret";
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return "supabase_service_role";
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev_default";
  }

  return "missing";
}

function signSessionPayload(payload: string) {
  const secret = getSessionSecret();

  if (!secret) {
    return "";
  }

  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isLegacyLocalAuthFallbackEnabled() {
  if (shouldEnforceSupabaseHostedAccess()) {
    return false;
  }

  const raw = process.env.ALLOW_LEGACY_LOCAL_AUTH_FALLBACK?.trim().toLowerCase();

  if (raw === "true") {
    return true;
  }

  if (raw === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}

export function getSessionConfigStatus(): SessionConfigStatus {
  const secretSource = getSessionSecretSource();
  const hostedRuntime = isHostedRuntime();
  const supabaseHostedAccessEnforced = shouldEnforceSupabaseHostedAccess();

  return {
    signedCookiesReady: secretSource !== "missing",
    secretSource,
    legacyLocalAuthFallbackEnabled: isLegacyLocalAuthFallbackEnabled(),
    hostedRuntime,
    supabaseHostedAccessEnforced
  };
}

export function serializeSession(session: AppSession) {
  const payload = Buffer.from(
    JSON.stringify({
      ...session,
      issuedAt: new Date().toISOString(),
      version: 1
    } satisfies SessionPayload)
  ).toString("base64url");
  const signature = signSessionPayload(payload);

  if (!signature) {
    return payload;
  }

  return `v1.${payload}.${signature}`;
}

export function deserializeSession(value: string): AppSession | null {
  try {
    if (value.startsWith("v1.")) {
      const [, encodedPayload, signature] = value.split(".");

      if (!encodedPayload || !signature) {
        return null;
      }

      const expectedSignature = signSessionPayload(encodedPayload);

      if (!expectedSignature || !safeCompare(signature, expectedSignature)) {
        return null;
      }

      const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

      return normalizeSessionPayload(parsed);
    }

    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));

    return normalizeSessionPayload(parsed);
  } catch {
    return null;
  }
}

export function setAppSessionCookie(response: NextResponse, session: AppSession) {
  response.cookies.set({
    name: sessionCookieName,
    value: serializeSession(session),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: sessionCookieMaxAgeSeconds,
    secure: process.env.NODE_ENV === "production"
  });
}

export function clearAppSessionCookies(response: NextResponse) {
  response.cookies.set({
    name: sessionCookieName,
    value: "",
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  response.cookies.set({
    name: legacySessionCookieName,
    value: "",
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
}

export function isSafeRedirectPath(path: string | null) {
  return Boolean(path && path.startsWith("/") && !path.startsWith("//"));
}

export function buildLoginPath(nextPath?: string) {
  if (nextPath && isSafeRedirectPath(nextPath)) {
    return `/login?next=${encodeURIComponent(nextPath)}`;
  }

  return "/login";
}

export async function getSession() {
  const cookieStore = await cookies();
  const rawValue =
    cookieStore.get(sessionCookieName)?.value ??
    cookieStore.get(legacySessionCookieName)?.value;

  if (!rawValue) {
    return null;
  }

  return deserializeSession(rawValue);
}

export async function getAuthenticatedAppState(): Promise<AuthState | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const supabaseStatus = getSupabaseConfigStatus();
  const allowLegacyLocalFallback = isLegacyLocalAuthFallbackEnabled();
  const supabaseHostedAccessEnforced = shouldEnforceSupabaseHostedAccess();

  if (supabaseHostedAccessEnforced && !session.userEmail) {
    return null;
  }

  const supabaseLookupId = session.userEmail ?? session.userId;
  const supabaseUser =
    (session.userEmail
      ? await getSupabaseWorkspaceUserByEmail(session.userEmail)
      : null) ?? (await getSupabaseWorkspaceUserById(supabaseLookupId));

  if (supabaseUser) {
    const localUser = getUserByEmail(supabaseUser.email);
    const accessibleBrands = await getSupabaseAccessibleBrandsForUser(supabaseUser.email);
    const defaultBrandId = await getSupabaseDefaultBrandIdForUser(supabaseUser.email);

    if (defaultBrandId && accessibleBrands.length > 0) {
      const activeBrandId = accessibleBrands.some((brand) => brand.id === session.brandId)
        ? session.brandId
        : defaultBrandId;

      return {
        session: {
          userId: localUser?.id ?? supabaseUser.id,
          brandId: activeBrandId,
          userEmail: supabaseUser.email
        },
        user: localUser ?? supabaseUser,
        accessibleBrands,
        defaultBrandId
      };
    }

    if (supabaseStatus.clientAuthReady && !allowLegacyLocalFallback) {
      return null;
    }
  } else if (session.userEmail && supabaseStatus.clientAuthReady && !allowLegacyLocalFallback) {
    return null;
  }

  if (supabaseHostedAccessEnforced) {
    return null;
  }

  const user = getUserById(session.userId);

  if (!user) {
    return null;
  }

  const accessibleBrands = getAccessibleBrandsForUser(user.id);
  const defaultBrandId = getDefaultBrandIdForUser(user.id);

  if (!defaultBrandId || accessibleBrands.length === 0) {
    return null;
  }

  const activeBrandId = isUserInBrand(user.id, session.brandId)
    ? session.brandId
    : defaultBrandId;

  return {
    session: {
      userId: user.id,
      brandId: activeBrandId,
      userEmail: user.email
    },
    user,
    accessibleBrands,
    defaultBrandId
  };
}

export async function requireAuthenticatedAppState(nextPath?: string) {
  const auth = await getAuthenticatedAppState();

  if (!auth) {
    redirect(buildLoginPath(nextPath));
  }

  return auth;
}

export async function getAuthorizedBrandState(
  brandId: string
): Promise<AuthorizedBrandState | null> {
  const auth = await getAuthenticatedAppState();
  const supabaseHostedAccessEnforced = shouldEnforceSupabaseHostedAccess();

  const hasSupabaseAccess = auth?.user.email
    ? await isSupabaseUserInBrand(auth.user.email, brandId)
    : false;
  const hasLocalAccess =
    auth && !supabaseHostedAccessEnforced ? isUserInBrand(auth.user.id, brandId) : false;

  if (!auth || (!hasSupabaseAccess && !hasLocalAccess)) {
    return null;
  }

  const supabaseWorkspace = auth.user.email
    ? await getSupabaseWorkspaceContext(brandId, auth.user.email)
    : null;
  const localWorkspace =
    !supabaseHostedAccessEnforced && auth ? getWorkspaceContext(brandId, auth.user.id) : null;

  if (!supabaseWorkspace && !localWorkspace) {
    return null;
  }

  return {
    ...auth,
    session: {
      ...auth.session,
      brandId
    },
    workspace: supabaseWorkspace ?? localWorkspace!
  };
}

export async function requireAuthorizedBrandState(
  brandId: string,
  nextPath?: string
) {
  const auth = await requireAuthenticatedAppState(nextPath);
  const supabaseHostedAccessEnforced = shouldEnforceSupabaseHostedAccess();

  const hasSupabaseAccess = auth.user.email
    ? await isSupabaseUserInBrand(auth.user.email, brandId)
    : false;
  const hasLocalAccess = !supabaseHostedAccessEnforced && isUserInBrand(auth.user.id, brandId);

  if (!hasSupabaseAccess && !hasLocalAccess) {
    redirect(getDefaultBrandPath(auth.defaultBrandId));
  }

  const supabaseWorkspace = auth.user.email
    ? await getSupabaseWorkspaceContext(brandId, auth.user.email)
    : null;
  const localWorkspace = !supabaseHostedAccessEnforced
    ? getWorkspaceContext(brandId, auth.user.id)
    : null;

  if (!supabaseWorkspace && !localWorkspace) {
    redirect(getDefaultBrandPath(auth.defaultBrandId));
  }

  return {
    ...auth,
    session: {
      ...auth.session,
      brandId
    },
    workspace: supabaseWorkspace ?? localWorkspace!
  };
}
