# Roadmap
## Agency
### Full-product strategy and execution roadmap

## 1. Current strategy
We should start building now.

The core product documents are already sufficient to begin implementation:
- `PRD.md`
- `full-app-ia.md`
- `structural-architecture.md`
- `data-architecture.md`
- `schema-spec.md`
- `api-contracts.md`
- `user-flows.md`
- `build-plan.md`
- `requirements-matrix.md`

We do not need to pause for more core planning docs before starting the app build.

## 2. What documentation is still optional
These documents are helpful, but they should happen in parallel with implementation, not block it:
- design handoff or design system export from Stitch
- component inventory once the UI library is chosen
- ADRs for major technical decisions as they come up
- QA test plan once the first vertical slice is working
- analytics instrumentation plan before beta rollout

## 3. Roadmap principle
Do not build 27 disconnected pages one by one.

Build the app in vertical slices so each phase includes:
- data model
- API contracts
- UI routes
- background jobs
- AI logic
- workflow states

Each slice should become usable by a real team before the next slice expands scope.

## 4. Delivery roadmap
### Phase 1: Core platform and workspace
Goal:
Create the real application foundation.

Includes:
- expand the current app shell to the full IA route structure
- auth and session model
- brand workspace model
- users, roles, and permissions
- settings shell
- navigation shell
- database migration application strategy

Outputs:
- users can log in
- users can enter a brand workspace
- route structure exists for the full app
- role-aware access is in place

### Phase 2: Integration and data backbone
Goal:
Make the app data-real, not just UI-real.

Includes:
- Shopify integration
- Meta integration
- GA4 integration
- sync orchestration
- sync health states
- canonical data persistence
- overview-level data freshness indicators

Outputs:
- one brand can connect real sources
- store, product, and channel data flow into canonical tables
- integration health is visible in the UI

### Phase 3: Command center and weekly operating loop
Goal:
Deliver the first complete operating workflow for founders and marketers.

Includes:
- Overview page
- Alerts page
- Weekly Briefs list and detail
- inbox foundation
- first report export
- top wins, top risks, and next actions logic

Outputs:
- founder can review the business in one place
- operator can understand what changed and what to do next

### Phase 4: Products, channels, campaigns, opportunities
Goal:
Turn metrics into clear business prioritization.

Includes:
- Products page and product detail
- Channels page
- Campaigns page
- opportunities engine
- evidence-backed recommendations
- assignment and status handling for opportunities

Outputs:
- the app can rank products and surface growth issues
- teams can move from signal to clear action

### Phase 5: Content operating system
Goal:
Turn prioritization into content production.

Includes:
- Brand Memory
- Content Studio
- hooks, captions, scripts, creator briefs
- draft editor
- content plans
- Content Calendar

Outputs:
- teams can generate, edit, and organize content tied to product and trend context

### Phase 6: Approvals and publishing
Goal:
Make the system operationally trustworthy.

Includes:
- Approvals queue
- comments and change requests
- audit trail
- publishing queue
- one publishing integration
- schedule, publish, retry, and cancel flows

Outputs:
- teams can move drafts into controlled execution
- every high-risk action is reviewable and traceable

### Phase 7: Trends and competitors
Goal:
Help teams react quickly without acting generically.

Includes:
- Trends page
- brand-fit scoring
- urgency and saturation logic
- Competitors page
- competitor observation model
- response recommendation workflows

Outputs:
- users can convert trend and competitor signals into approved action

### Phase 8: Retention, CX, and support ops
Goal:
Expand the app from top-of-funnel growth into downstream growth health.

Includes:
- Retention page
- lifecycle opportunity logic
- CX Ops page
- Support Ops page
- returns, delivery, and support issue models
- assignment and escalation workflows

Outputs:
- the app covers the pain points beyond analytics and content
- operators can see what is hurting trust, retention, and margin

### Phase 9: Reports, automations, and hardening
Goal:
Make the system repeatable, scalable, and production-ready.

Includes:
- Reports page
- automation settings
- inbox maturity
- notification delivery
- permission hardening
- AI evaluation loops
- performance and reliability hardening

Outputs:
- teams can run weekly operations from the app reliably
- automation remains controlled and explainable

## 5. Immediate roadmap
### Right now
Start building.

### Next three implementation moves
1. Expand the route scaffold to match the full app IA.
2. Apply the schema expansion path from `0002_full_domain_extensions.sql`.
3. Implement auth, workspace, roles, and integration settings as the first real foundation slice.

### First complete vertical slice
The first slice should be:
- auth
- workspace
- integrations
- overview
- alerts
- weekly brief
- inbox foundation

That gives us the first real operating loop instead of isolated pages.

## 6. Recommended execution order by team
### Frontend track
- navigation shell
- top bar
- reusable table, drawer, card, editor, and calendar primitives
- route scaffolds for the full app
- first live pages: overview, alerts, brief, integrations

### Backend track
- auth and role model
- workspace APIs
- integration APIs
- overview and brief APIs
- approvals and publishing state machines later in sequence

### Data track
- canonical schema rollout
- sync runners
- derived metric jobs
- opportunity scoring
- retention and CX data models later

### AI track
- brief generation
- hook generation
- recommendation rationale formatting
- evaluation framework

## 7. Roadmap checkpoints
### Checkpoint A
Question:
Can a brand log in, connect sources, and trust what the app is showing?

### Checkpoint B
Question:
Can a founder or marketer use the app weekly without another reporting stack?

### Checkpoint C
Question:
Can a content lead go from opportunity to approved content to publishing in one system?

### Checkpoint D
Question:
Can the app surface retention, CX, and support issues as part of growth operations?

## 8. Recommendation
The strategy going forward is:
- stop creating core planning docs
- begin implementation immediately
- only add design-system or ADR documentation when implementation creates a real need

The only non-blocking document worth adding soon is the actual Stitch design handoff once design exports are finalized.
