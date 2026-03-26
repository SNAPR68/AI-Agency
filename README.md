# AI Agency

This folder contains the initial strategy, research, and product planning documents for `agency`, an AI growth OS for Shopify / D2C brands.

It now also includes the first code scaffold for the new product:
- `apps/web`: `Next.js` app shell for the MVP routes
- `packages/database`: baseline Postgres migration and schema notes
- `packages/types`: shared domain types for the first services
- `packages/prompts`: prompt package placeholder for agent workflows

## Start here
- `docs/strategy/kickoff-prompt.md`
- `docs/product/PRD.md`
- `docs/product/full-app-ia.md`
- `docs/architecture/structural-architecture.md`
- `docs/product/user-flows.md`
- `docs/product/build-plan.md`
- `docs/design/stitch-ui-plan.md`
- `docs/engineering/implementation-map.md`
- `docs/product/mvp-blueprint.md`
- `docs/strategy/strategy.md`

## Folder structure
### `apps/web`
- app shell for overview, weekly brief, opportunities, content, approvals, publishing, and integrations
- starter API routes for health, latest brief, and opportunity listing

### `docs/strategy`
- `strategy.md`: core positioning, thesis, modules, ICP, and market angle
- `competitor-map.md`: market map and positioning whitespace
- `kickoff-prompt.md`: starter prompt for the new build thread

### `docs/research`
- `market-research.md`: compiled market research and opportunity framing
- `market-gaps-and-pain-points.md`: focused breakdown of gaps and customer pain points

### `docs/product`
- `PRD.md`: full product requirements document for the entire app
- `full-app-ia.md`: full product information architecture derived from the research pain points
- `user-flows.md`: persona journeys and major workflow definitions
- `build-plan.md`: full-product execution phases and delivery order
- `mvp-blueprint.md`: implementation-ready architecture, scope, schema, and scaffold plan
- `roadmap.md`: strategy-first roadmap for when to stop documenting and start building

### `docs/architecture`
- `structural-architecture.md`: service boundaries, runtime layers, and core data flows
- `data-architecture.md`: canonical entities, integration model, and derived data design
- `schema-spec.md`: table-by-table schema inventory for the full product

### `docs/api`
- `api-contracts.md`: route groups, resource contracts, and action endpoint definitions

### `docs/design`
- `stitch-ui-plan.md`: complete Stitch handoff for the UI system, page inventory, screen families, and batch prompts

### `docs/engineering`
- `requirements-matrix.md`: implementation-facing requirement checklist by domain
- `implementation-map.md`: doc-to-code build map, repo responsibilities, and current execution path

### `packages/database`
- `migrations/0001_initial.sql`: first-pass Postgres schema aligned to the MVP blueprint
- `migrations/0002_full_domain_extensions.sql`: schema expansion for retention, CX, support, reports, inbox, and automations
- `schema/README.md`: schema intent and scope

### `packages/types`
- `src/index.ts`: shared domain types for brands, briefs, opportunities, and drafts

### `packages/prompts`
- `README.md`: prompt package direction for weekly brief and content generation workflows

## Running the scaffold
1. Install dependencies with `npm install`
2. Copy `.env.example` to `.env`
3. Start the app with `npm run dev`

## Recommended order
1. Read `docs/strategy/kickoff-prompt.md`
2. Read `docs/product/PRD.md`
3. Read `docs/product/full-app-ia.md`
4. Read `docs/architecture/structural-architecture.md`
5. Read `docs/architecture/data-architecture.md`
6. Read `docs/architecture/schema-spec.md`
7. Read `docs/api/api-contracts.md`
8. Read `docs/product/user-flows.md`
9. Read `docs/product/build-plan.md`
10. Read `docs/design/stitch-ui-plan.md`
11. Read `docs/engineering/implementation-map.md`
12. Read `docs/engineering/requirements-matrix.md`
13. Read `docs/product/mvp-blueprint.md`
14. Review `docs/strategy/strategy.md`
15. Use `docs/research/*` for deeper context
16. Use `docs/product/roadmap.md` for the current execution strategy and sequence

## Product summary
`agency` is intended to be a revenue-linked content and growth operating system for Shopify brands.

The full product spans analytics, opportunities, content, trends, approvals, publishing, retention, CX, support ops, and reporting.

The current code scaffold still starts with the initial wedge:

**Weekly growth brief + hook generation + content planning tied to store performance**
