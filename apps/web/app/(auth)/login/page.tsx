import { redirect } from "next/navigation";
import { getDefaultBrandPath } from "../../../lib/navigation";
import { getAppRepositoryStatus } from "../../../lib/app-repository";
import { getAuthenticatedAppState, getSessionConfigStatus } from "../../../lib/session";
import { getSupabaseConfigStatus } from "../../../lib/supabase-env";
import { getLoginWorkspaceOptions } from "../../../lib/workspace-data";
import { formatWorkspaceRole } from "../../../lib/workspace";

const loginErrorMessages: Record<string, string> = {
  "unknown-user": "We could not find an active workspace member with that email.",
  "invite-pending": "That email has a pending invite, but access has not been activated yet.",
  "no-brand-access": "That user exists, but there is no active workspace access yet.",
  "local-login-disabled":
    "Direct local workspace login is disabled. Use the Supabase magic-link flow instead.",
  "supabase-auth-failed": "Supabase could not complete the sign-in flow. Check the project auth settings and redirect URLs."
};

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    loggedOut?: string;
    magicLink?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const auth = await getAuthenticatedAppState();

  if (auth) {
    redirect(getDefaultBrandPath(auth.session.brandId));
  }

  const { error, loggedOut, magicLink, next } = await searchParams;
  const loginOptions = getLoginWorkspaceOptions();
  const repositoryStatus = getAppRepositoryStatus();
  const supabaseStatus = getSupabaseConfigStatus();
  const sessionStatus = getSessionConfigStatus();
  const legacyLocalAuthFallbackEnabled = sessionStatus.legacyLocalAuthFallbackEnabled;
  const repositoryMessage =
    repositoryStatus.activeSource === "postgres"
      ? "Workspace access is running on the Postgres repository."
      : repositoryStatus.usingFallback
        ? "Workspace access is currently falling back to the local dev repository because the Postgres path is not ready yet."
        : "Workspace access is currently using the local dev repository.";
  const supabaseMessage = supabaseStatus.clientAuthReady
    ? `Supabase auth is ready for cutover on project ${supabaseStatus.projectRef ?? "this workspace"}.`
    : supabaseStatus.urlConfigured
      ? `Supabase project ${supabaseStatus.projectRef ?? "configured"} is linked, but auth still needs ${supabaseStatus.missing
          .filter((item) => item !== "project URL")
          .join(" and ")}.`
      : "Supabase is not configured yet.";

  return (
    <main className="app-frame">
      <section className="login-layout">
        <article className="surface-card login-story">
          <div className="login-story-copy">
            <span className="eyebrow">Editorial Operating System</span>
            <h1 className="page-title">The permanent ledger of your growth.</h1>
            <p className="page-copy">
              Agency treats commerce data like a working record, not a disposable
              dashboard. Teams enter one workspace for analytics, workflow, content,
              and approvals.
            </p>
          </div>

          <div className="trust-list">
            <div className="trust-item">
              <p className="trust-title">Trust-first access</p>
              <p className="trust-copy">
                Workspace access is brand-aware, role-aware, and tied to the active
                repository source underneath the app shell.
              </p>
            </div>
            <div className="trust-item">
              <p className="trust-title">Auth cutover status</p>
              <p className="trust-copy">{supabaseMessage}</p>
            </div>
            <div className="trust-item">
              <p className="trust-title">Repository status</p>
              <p className="trust-copy">{repositoryMessage}</p>
            </div>
            <div className="trust-item">
              <p className="trust-title">Hosted access policy</p>
              <p className="trust-copy">
                {sessionStatus.supabaseHostedAccessEnforced
                  ? "Hosted deployments are enforcing Supabase workspace access."
                  : "Local quick access remains available for development while fallback stays enabled."}
              </p>
            </div>
          </div>
        </article>

        <article className="surface-card login-panel">
          <div className="stack">
            <p className="kicker">Login</p>
            <h2 className="section-title">Sign in to a brand workspace.</h2>
            <p className="body-copy">
              Use a workspace member email to enter the app.
            </p>
          </div>

          {error ? (
            <div className="message-banner">
              {loginErrorMessages[error] ?? "We could not complete that sign-in."}
            </div>
          ) : null}

          {loggedOut ? (
            <div className="message-banner">
              Your session has been cleared. Sign back in with any active workspace member.
            </div>
          ) : null}

          <form
            action={
              supabaseStatus.clientAuthReady
                ? "/api/auth/supabase/magic-link"
                : "/api/auth/login"
            }
            className="settings-inline-form"
            method="post"
          >
            <div className="form-grid">
              <label className="field-stack field-stack-wide">
                <span className="field-label">Workspace email</span>
                <input
                  autoComplete="email"
                  className="text-input"
                  name="email"
                  placeholder="name@brand.com"
                  required
                  type="email"
                />
              </label>
            </div>
            {next ? <input name="next" type="hidden" value={next} /> : null}
            <div className="form-actions">
              <button className="button-link" type="submit">
                {supabaseStatus.clientAuthReady ? "Continue with Email" : "Sign In"}
              </button>
            </div>
          </form>

          {magicLink ? (
            <div className="message-banner">
              Magic link sent. Open the email for that workspace user and come back through the callback link.
            </div>
          ) : null}

          {legacyLocalAuthFallbackEnabled ? (
            <div className="stack">
              <p className="body-copy">
                Quick access profiles remain available while we finish the full
                Supabase tenancy cutover.
              </p>

              <div className="cards-grid persona-grid">
                {loginOptions.map((option) => (
                  <article key={option.userId} className="surface-card persona-card">
                    <p className="kicker">{formatWorkspaceRole(option.primaryRole)}</p>
                    <h3 className="section-title">{option.name}</h3>
                    <p className="body-copy">
                      {option.title} · {option.email}
                    </p>
                    <p className="persona-note">
                      Workspace access:{" "}
                      {option.accessibleBrands
                        .map((brand) => `${brand.name} (${formatWorkspaceRole(brand.role)})`)
                        .join(" · ")}
                    </p>

                    <form action="/api/auth/login" className="persona-form" method="post">
                      <input name="email" type="hidden" value={option.email} />
                      <input name="brandId" type="hidden" value={option.primaryBrandId} />
                      {next ? <input name="next" type="hidden" value={next} /> : null}
                      <button className="button-link-secondary" type="submit">
                        Open {option.name.split(" ")[0]}'s workspace
                      </button>
                    </form>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-banner">
              Local quick-access profiles are disabled, so workspace entry now goes through Supabase-authenticated email sign-in.
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
