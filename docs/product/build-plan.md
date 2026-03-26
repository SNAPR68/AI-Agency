# Build Plan
## Agency
### Full-product execution plan

## 1. Purpose
This document translates the product vision into a practical build sequence.

The build strategy is:
- shared foundations first
- vertical slices over isolated feature islands
- trust and data quality before aggressive automation

## 2. Build approach
Build the product in full-system slices, where each phase adds value across:
- UI
- backend
- data
- AI
- workflows

This avoids ending up with a pile of disconnected partial modules.

## 3. Phase 0: Foundations
### Deliverables
- repo structure and app shell
- auth and multi-brand workspace model
- role and permissions baseline
- Postgres schema baseline
- queue infrastructure
- observability foundation
- environment and secrets management

### Exit criteria
- app runs locally and in preview
- users can log in and enter a brand workspace
- core infrastructure is stable enough for integrations

## 4. Phase 1: Data backbone
### Deliverables
- Shopify integration
- Meta integration
- GA4 integration
- sync runs and cursors
- canonical commerce and marketing tables
- integration status UI

### Exit criteria
- one connected brand can ingest usable metrics end to end
- UI shows sync health and data freshness

## 5. Phase 2: Command center and briefs
### Deliverables
- Overview page with KPI and alert surfaces
- alerts system
- weekly brief generation
- inbox foundation
- first report export flow

### Exit criteria
- founder can review a weekly brief with meaningful evidence
- operators can see alerts and route next actions

## 6. Phase 3: Product, channel, and opportunity intelligence
### Deliverables
- Products page and product detail
- Channels page
- Campaigns page
- opportunities engine
- evidence-backed recommendations

### Exit criteria
- system can rank products and highlight channel issues
- users can accept or dismiss opportunities with confidence

## 7. Phase 4: Content operating system
### Deliverables
- brand memory and voice settings
- Content Studio
- draft model and versioning
- Content Calendar
- creator briefs and content plans

### Exit criteria
- users can generate, edit, organize, and review revenue-linked content drafts

## 8. Phase 5: Workflow, approvals, and publishing
### Deliverables
- approval queue
- review comments and change requests
- one publishing integration
- scheduling flow
- publish job tracking
- audit trail

### Exit criteria
- approved drafts can be scheduled or published safely
- workflow history is visible and trustworthy

## 9. Phase 6: Trend and competitor intelligence
### Deliverables
- Trends page
- competitor monitoring
- trend fit scoring
- urgency and saturation scoring
- response recommendation workflows

### Exit criteria
- users can move from trend detection to approved action inside the app

## 10. Phase 7: Retention, CX, and support operations
### Deliverables
- Retention page
- CX Ops page
- Support Ops page
- retention and CX opportunity models
- issue assignment and escalation patterns

### Exit criteria
- the product no longer stops at top-of-funnel and content
- operators can see downstream issues affecting growth and trust

## 11. Phase 8: Reporting, automation, and hardening
### Deliverables
- Reports page
- automation settings and policies
- inbox maturity
- scheduled delivery and notifications
- performance hardening
- permission hardening
- evaluation loops for AI quality

### Exit criteria
- app supports repeatable weekly operating rhythms for real brands
- automation remains controlled and explainable

## 12. Workstream breakdown
### Frontend
- app shell
- tables, drawers, editors, calendars
- workflow UI
- reports and settings surfaces

### Backend and platform
- auth
- API and domain services
- queues and workers
- publishing and notification runtime

### Data and integrations
- provider sync logic
- canonical mapping
- metric derivation
- freshness and health tracking

### AI and intelligence
- scoring logic
- prompt contracts
- structured generation
- evaluation and guardrails

## 13. Dependencies and ordering rules
- do not build content generation before brand memory exists
- do not build advanced reports before canonical metrics are stable
- do not build automations before approvals and audit trails are mature
- do not build retention and CX views without clear data contracts

## 14. Suggested milestone reviews
Review after each phase:
- product usefulness
- data trustworthiness
- AI quality
- workflow friction
- missing permissions or audit controls

## 15. Immediate next implementation steps
1. Align the app scaffold to the full page inventory in `full-app-ia.md`.
2. Extend the schema for the full domain model described in `data-architecture.md`.
3. Implement auth, workspace, and integrations before deep page logic.
4. Build the command center and brief generation flow as the first complete vertical slice.

