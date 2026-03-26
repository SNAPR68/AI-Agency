# Implementation Map
## Agency
### How the docs translate into code, modules, and milestones

## 1. Purpose
This document is the bridge between planning and implementation.

It answers:
- which Markdown files are the source of truth
- how we are building the app
- which repo areas each document drives
- what gets built in each phase
- what is already done
- what comes next

## 2. How we are building
We are building `agency` in this order:

1. research and strategy define the pain points and market position
2. product docs define the full app scope and user workflows
3. architecture docs define the runtime, data, schema, and API contracts
4. implementation follows those contracts in vertical slices
5. docs are updated only when the code changes the plan

The implementation rule is:
- do not build 27 disconnected pages one by one
- do not build UI without data contracts
- do not build automation before trust and approvals exist
- do build usable vertical slices from data through UI

## 3. Source-of-truth document stack
### Strategy and research
- `docs/strategy/kickoff-prompt.md`
- `docs/strategy/strategy.md`
- `docs/strategy/competitor-map.md`
- `docs/research/market-research.md`
- `docs/research/market-gaps-and-pain-points.md`

These define:
- why this product exists
- which D2C pain points it must solve
- which market gaps we are targeting

### Product
- `docs/product/PRD.md`
- `docs/product/full-app-ia.md`
- `docs/product/user-flows.md`
- `docs/product/build-plan.md`
- `docs/product/roadmap.md`
- `docs/product/mvp-blueprint.md`

These define:
- what the app includes
- which pages exist
- how users move through the app
- what order we should build in

### Architecture and engineering
- `docs/architecture/structural-architecture.md`
- `docs/architecture/data-architecture.md`
- `docs/architecture/schema-spec.md`
- `docs/api/api-contracts.md`
- `docs/engineering/requirements-matrix.md`

These define:
- service boundaries
- canonical entities
- database tables
- API surface
- domain requirements and implementation checklist

## 4. Repo map
### `apps/web`
Owns:
- `app/*`: pages, layouts, route handlers
- `components/*`: reusable UI shells and page components
- `lib/*`: navigation, session, workspace, and page-model helpers

This is where the product UI and server route logic are being built.

### `packages/database`
Owns:
- `migrations/0001_initial.sql`
- `migrations/0002_full_domain_extensions.sql`
- `schema/README.md`

This is where the Postgres schema and migration path live.

### `packages/types`
Owns:
- shared app-level domain types

### `packages/prompts`
Owns:
- prompt package direction for AI workflows
- later structured prompt contracts for briefs, hooks, scripts, and recommendations

## 5. Doc-to-code mapping
| Source doc | What it defines | Primary code areas it drives |
|---|---|---|
| `docs/product/PRD.md` | full feature scope and functional requirements | `apps/web/app`, `packages/database`, future workers/services |
| `docs/product/full-app-ia.md` | route map and page structure | `apps/web/app`, `apps/web/components`, `apps/web/lib/navigation.ts` |
| `docs/product/user-flows.md` | end-to-end user journeys | route transitions, approval states, inbox and publishing flows |
| `docs/architecture/structural-architecture.md` | runtime layers and service boundaries | `apps/web/app/api`, future queue workers, integration jobs |
| `docs/architecture/data-architecture.md` | domain model and canonical entities | `packages/database`, API payload composition, derived metrics |
| `docs/architecture/schema-spec.md` | exact table inventory | SQL migrations and DB access layer |
| `docs/api/api-contracts.md` | route groups and response shapes | `apps/web/app/api/*`, UI data loaders, client contracts |
| `docs/engineering/requirements-matrix.md` | implementation checklist by domain | sprint planning and verification |
| `docs/product/build-plan.md` | phase order and exit criteria | roadmap sequencing and milestone reviews |
| `docs/product/roadmap.md` | immediate execution strategy | current implementation priorities |

## 6. Build method by layer
Every major slice should be built through the same stack:

1. Schema
   Add or confirm the tables needed in `packages/database/migrations`.
2. Domain helpers
   Add or update typed data access and business rules in `apps/web/lib` or future service modules.
3. API routes
   Implement the matching endpoints from `docs/api/api-contracts.md`.
4. UI routes
   Implement or wire the pages in `apps/web/app`.
5. Workflow state
   Add approval, inbox, audit, or publish transitions where needed.
6. Verification
   Run `npm run typecheck` and `npm run build`.

## 7. Phase-by-phase execution map
### Phase 1: Platform foundation
Driven by:
- `docs/product/full-app-ia.md`
- `docs/architecture/structural-architecture.md`
- `docs/architecture/schema-spec.md`
- `docs/api/api-contracts.md`

Code areas:
- `apps/web/app/*`
- `apps/web/components/*`
- `apps/web/lib/navigation.ts`
- `apps/web/lib/session.ts`
- `apps/web/lib/workspace.ts`
- `apps/web/app/api/me/route.ts`
- `apps/web/app/api/brands/*`

Goal:
- full route shell exists
- users can sign in
- brand workspace access is protected
- users can switch workspaces

Status:
- in progress
- route shell done
- demo auth and workspace flow done
- next step is real persistence

### Phase 2: Data backbone
Driven by:
- `docs/architecture/data-architecture.md`
- `docs/architecture/schema-spec.md`
- `docs/api/api-contracts.md`

Code areas:
- `packages/database/migrations/*`
- future DB client layer in `apps/web/lib` or `packages/*`
- `apps/web/app/api/brands/[brandId]/integrations/*`
- future sync/job modules

Goal:
- real brands, users, memberships, and integrations exist in the database
- real integration connections and sync health are stored
- overview payloads stop depending on hardcoded demo data

### Phase 3: Command center and weekly operating loop
Driven by:
- `docs/product/user-flows.md`
- `docs/api/api-contracts.md`
- `docs/product/build-plan.md`

Code areas:
- `apps/web/app/brands/[brandId]/overview/page.tsx`
- `apps/web/app/brands/[brandId]/alerts/page.tsx`
- `apps/web/app/brands/[brandId]/briefs/*`
- `apps/web/app/brands/[brandId]/inbox/page.tsx`
- matching `app/api/brands/[brandId]/*` routes

Goal:
- a founder can open the app and understand what changed
- a marketer/operator can see next actions and evidence

### Phase 4: Product, channel, campaign, opportunity intelligence
Driven by:
- `docs/product/PRD.md`
- `docs/product/full-app-ia.md`
- `docs/api/api-contracts.md`

Code areas:
- `apps/web/app/brands/[brandId]/products/*`
- `apps/web/app/brands/[brandId]/channels/page.tsx`
- `apps/web/app/brands/[brandId]/campaigns/page.tsx`
- `apps/web/app/brands/[brandId]/opportunities/page.tsx`
- supporting API routes and scoring logic

Goal:
- rank products and channels
- surface evidence-backed opportunities
- allow accept and dismiss workflows

### Phase 5: Content operating system
Driven by:
- `docs/product/user-flows.md`
- `docs/api/api-contracts.md`
- `docs/architecture/schema-spec.md`

Code areas:
- `apps/web/app/brands/[brandId]/content/*`
- `apps/web/app/brands/[brandId]/settings/brand-memory/page.tsx`
- future prompt contracts in `packages/prompts`
- draft and content-plan APIs

Goal:
- generate, edit, and organize revenue-linked content
- persist drafts, plans, and context links

### Phase 6: Workflow, approvals, and publishing
Driven by:
- `docs/architecture/structural-architecture.md`
- `docs/api/api-contracts.md`
- `docs/architecture/schema-spec.md`

Code areas:
- `apps/web/app/brands/[brandId]/approvals/page.tsx`
- `apps/web/app/brands/[brandId]/publishing/page.tsx`
- approval and publish APIs
- later queue/job runtime

Goal:
- controlled review flow
- scheduling and publish-job visibility
- audit trail for high-risk actions

### Phase 7: Trends and competitors
Driven by:
- `docs/product/PRD.md`
- `docs/product/full-app-ia.md`
- `docs/api/api-contracts.md`

Code areas:
- `apps/web/app/brands/[brandId]/trends/page.tsx`
- `apps/web/app/brands/[brandId]/competitors/page.tsx`
- related APIs and scoring logic

Goal:
- detect market signals
- score fit and urgency
- route signals into action

### Phase 8: Retention, CX, and support ops
Driven by:
- `docs/research/market-gaps-and-pain-points.md`
- `docs/product/PRD.md`
- `docs/api/api-contracts.md`
- `docs/architecture/schema-spec.md`

Code areas:
- `apps/web/app/brands/[brandId]/retention/page.tsx`
- `apps/web/app/brands/[brandId]/cx/page.tsx`
- `apps/web/app/brands/[brandId]/support-ops/page.tsx`
- supporting APIs and derived models

Goal:
- expand from top-of-funnel into downstream business health
- make retention, CX, and support visible in one operating system

### Phase 9: Reports, automations, and hardening
Driven by:
- `docs/product/build-plan.md`
- `docs/product/roadmap.md`
- `docs/engineering/requirements-matrix.md`

Code areas:
- `apps/web/app/brands/[brandId]/reports/page.tsx`
- `apps/web/app/brands/[brandId]/settings/automations/page.tsx`
- inbox maturity, notification delivery, permission hardening

Goal:
- repeatable weekly operating rhythm
- reliable scheduled delivery
- safe, explainable automation

## 8. Current implementation state
Already built:
- full authenticated route shell for the app
- grouped sidebar navigation
- reusable workspace page renderer
- demo multi-brand workspace model
- demo session cookie flow
- protected brand routes
- workspace switching
- session-aware API stubs for core workspace endpoints

Current foundation files:
- `apps/web/lib/navigation.ts`
- `apps/web/lib/session.ts`
- `apps/web/lib/workspace.ts`
- `apps/web/components/brand-shell.tsx`
- `apps/web/components/workspace-page.tsx`
- `apps/web/lib/page-models.ts`

Verified:
- `npm run typecheck`
- `npm run build`

## 9. Immediate next build moves
### Move 1
Create the real database-backed workspace layer.

Files and areas:
- `packages/database/migrations/*`
- new DB access layer
- replace hardcoded data in `apps/web/lib/workspace.ts`

### Move 2
Wire integration settings to stored integration connections and sync state.

Files and areas:
- `apps/web/app/brands/[brandId]/settings/integrations/page.tsx`
- `apps/web/app/api/brands/[brandId]/integrations/*`

### Move 3
Make the first real operating slice data-backed:
- Overview
- Alerts
- Weekly Briefs
- Inbox

## 10. Practical rule for the team
When deciding what to build next:

1. check the PRD for the requirement
2. check the IA for the page or surface
3. check the schema spec for the data shape
4. check the API contracts for the route
5. implement the smallest complete vertical slice
6. update docs only if implementation changes the agreed design
