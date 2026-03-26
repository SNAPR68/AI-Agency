# MVP Blueprint
## Agency
### Architecture, scope, schema, and scaffold plan

## 1. Purpose
This document turns the strategy and PRD into an implementation-ready MVP definition for `agency`.

The goal is to ship the first approval-first version of a revenue-linked growth OS for Shopify brands that:
- ingests store and channel data
- detects growth opportunities
- generates hooks and content plans
- routes outputs through approvals
- publishes to one social workflow

## 2. MVP promise
For a Shopify brand, `agency` should answer every week:
- what changed
- why it changed
- which products deserve attention
- which hooks to test
- what content to publish next

## 3. Product scope
### Core in-scope jobs
- connect Shopify, Meta, and GA4 for a single brand
- normalize core commerce and marketing metrics daily
- generate a weekly growth brief in plain language
- identify product-level opportunities and risks
- generate product-aware hooks, captions, and short scripts
- generate a lightweight weekly content plan
- support draft review and approval
- publish or schedule approved content to one social workflow
- log decisions, approvals, and publish outcomes

### Primary users
- founder or CEO
- growth marketer
- content or social lead
- internal agency operator or strategist

### Explicit MVP exclusions
- autonomous posting without approval by default
- ad buying automation
- influencer CRM
- customer support automation
- full multi-channel publishing
- enterprise-grade attribution or MMM

## 4. System architecture
### Architectural principles
- approval-first before autonomy
- Shopify-first domain model
- modular services around a shared data model
- async pipelines for ingestion, analysis, and generation
- every recommendation should be explainable and traceable to source data

### High-level components
1. Web app
Used by internal operators and brand users to review briefs, opportunities, drafts, approvals, and publishing status.

2. API layer
Handles auth, brand setup, CRUD workflows, agent requests, approvals, and UI-facing queries.

3. Ingestion pipelines
Scheduled jobs that pull Shopify, Meta, and GA4 data and map it into normalized tables.

4. Intelligence services
Domain services that score performance changes, generate recommendations, rank trends, and compose weekly briefs.

5. Content services
Prompt-driven generation for hooks, captions, scripts, and weekly content plans using brand voice plus product and trend context.

6. Approval and publishing services
Workflow engine for draft states, approvals, rejections, scheduling, and delivery to one publishing destination.

7. Shared data platform
Postgres as system of record, object storage for exports or assets, and a queue for long-running or scheduled jobs.

### Suggested stack
- frontend: `Next.js`
- backend: `Next.js` route handlers or a small `Node.js` API service
- database: `Postgres`
- auth and storage: `Supabase`
- jobs and orchestration: `BullMQ` first, with a path to `Temporal` later
- AI layer: OpenAI API
- hosting: `Vercel` for app plus managed Postgres/Redis

### Why this shape
This keeps the MVP fast to build while preserving clean boundaries:
- UI and API can ship quickly in one app
- data ingestion and agent workflows run asynchronously
- domain logic stays reusable even if orchestration changes later

## 5. Logical service map
### Brand workspace service
Owns brands, stores, users, permissions, brand profile, and brand voice.

### Integration service
Owns OAuth or credential setup, connection health, sync cursors, and ingestion jobs.

### Analytics service
Owns normalized metrics, anomaly detection, product scoring, and weekly brief inputs.

### Trend service
Owns trend signals, competitor observations, scoring, and trend-to-brand-fit recommendations.

### Content service
Owns content drafts, hooks, captions, scripts, content plans, and prompt templates.

### Approval service
Owns routing, approvers, statuses, comments, and audit history.

### Publishing service
Owns schedules, publish jobs, delivery outcomes, and retries.

### Notification service
Owns weekly brief delivery, approval notifications, and operational alerts.

## 6. Core workflows
### Weekly growth brief
1. Nightly ingestion updates Shopify, Meta, and GA4 data.
2. Analytics service computes week-over-week changes and product opportunity scores.
3. Trend service adds relevant category or competitor signals.
4. Content service generates recommended hooks and content angles for top opportunities.
5. Brief composer produces a founder-ready summary with evidence and next actions.
6. Users review the brief in app or via notification.

### Content planning
1. User selects a brand, product focus, and campaign goal.
2. Content service generates hooks, captions, scripts, and calendar suggestions.
3. Drafts enter `pending_approval`.
4. Approver accepts, requests changes, or rejects.
5. Approved drafts can be scheduled through the publishing service.

### Opportunity alert
1. Analytics service detects an abnormal change such as high traffic and weak conversion.
2. Recommendation is created with severity and evidence.
3. Content service proposes response content.
4. Notification service alerts the workspace.

## 7. Domain model
### Workspace and identity
- `brands`
- `brand_users`
- `stores`
- `brand_profiles`
- `brand_voice_profiles`
- `integration_connections`

### Commerce and marketing data
- `products`
- `product_variants`
- `collections`
- `orders`
- `customers`
- `daily_store_metrics`
- `daily_product_metrics`
- `channel_accounts`
- `daily_channel_metrics`
- `campaigns`

### Intelligence layer
- `trend_signals`
- `competitors`
- `competitor_observations`
- `opportunities`
- `recommendations`
- `weekly_briefs`

### Content and workflow
- `content_plans`
- `content_drafts`
- `draft_context_items`
- `approvals`
- `approval_events`
- `publish_jobs`
- `publish_events`

### System operations
- `sync_runs`
- `job_runs`
- `notifications`
- `audit_logs`

## 8. Schema direction
### `brands`
Represents one client workspace.

Suggested fields:
- `id`
- `name`
- `slug`
- `vertical`
- `gmv_band`
- `timezone`
- `status`
- `created_at`
- `updated_at`

### `stores`
Shopify store metadata for a brand.

Suggested fields:
- `id`
- `brand_id`
- `platform`
- `shop_domain`
- `currency`
- `connected_at`
- `status`

### `integration_connections`
One row per brand and external system.

Suggested fields:
- `id`
- `brand_id`
- `provider`
- `account_label`
- `status`
- `last_synced_at`
- `sync_cursor`
- `metadata_json`

### `products`
Product catalog synced from Shopify.

Suggested fields:
- `id`
- `brand_id`
- `external_product_id`
- `title`
- `handle`
- `product_type`
- `status`
- `price_min`
- `price_max`
- `created_at`
- `updated_at`

### `daily_product_metrics`
Daily performance snapshot per product.

Suggested fields:
- `id`
- `brand_id`
- `product_id`
- `metric_date`
- `revenue`
- `units_sold`
- `sessions`
- `conversion_rate`
- `add_to_cart_rate`
- `return_rate`
- `gross_margin`

### `daily_channel_metrics`
Daily performance by marketing channel.

Suggested fields:
- `id`
- `brand_id`
- `channel`
- `metric_date`
- `spend`
- `impressions`
- `clicks`
- `sessions`
- `conversions`
- `revenue`

### `opportunities`
Machine-readable growth opportunities or risks.

Suggested fields:
- `id`
- `brand_id`
- `type`
- `title`
- `entity_type`
- `entity_id`
- `priority_score`
- `confidence_score`
- `status`
- `evidence_json`
- `created_at`

### `recommendations`
Recommended actions linked to an opportunity.

Suggested fields:
- `id`
- `brand_id`
- `opportunity_id`
- `category`
- `headline`
- `rationale`
- `action_payload_json`
- `status`
- `created_at`

### `weekly_briefs`
Persisted weekly summaries for review and history.

Suggested fields:
- `id`
- `brand_id`
- `week_start`
- `week_end`
- `summary_md`
- `top_wins_json`
- `top_risks_json`
- `next_actions_json`
- `status`
- `generated_at`

### `content_plans`
Calendar-level planning object.

Suggested fields:
- `id`
- `brand_id`
- `week_start`
- `objective`
- `channel`
- `status`
- `plan_json`
- `created_by`
- `created_at`

### `content_drafts`
Draft content output tied to products, opportunities, or trends.

Suggested fields:
- `id`
- `brand_id`
- `content_plan_id`
- `source_type`
- `source_id`
- `format`
- `channel`
- `title`
- `hook`
- `caption`
- `script`
- `status`
- `version`
- `created_by`
- `created_at`
- `updated_at`

### `approvals`
Approval routing for briefs, plans, or drafts.

Suggested fields:
- `id`
- `brand_id`
- `target_type`
- `target_id`
- `requested_by`
- `assigned_to`
- `status`
- `decision_notes`
- `requested_at`
- `decided_at`

### `publish_jobs`
Publishing or scheduling request per approved draft.

Suggested fields:
- `id`
- `brand_id`
- `content_draft_id`
- `provider`
- `scheduled_for`
- `status`
- `external_post_id`
- `error_message`
- `created_at`
- `updated_at`

## 9. Initial status model
### Content draft statuses
- `draft`
- `pending_approval`
- `changes_requested`
- `approved`
- `scheduled`
- `published`
- `failed`

### Recommendation statuses
- `open`
- `accepted`
- `dismissed`
- `completed`

### Integration statuses
- `pending`
- `connected`
- `degraded`
- `disconnected`

## 10. API surface for the first scaffold
### Auth and workspace
- `POST /api/auth/invite`
- `GET /api/brands/:brandId`
- `PATCH /api/brands/:brandId`

### Integrations
- `POST /api/brands/:brandId/integrations/shopify/connect`
- `POST /api/brands/:brandId/integrations/meta/connect`
- `POST /api/brands/:brandId/integrations/ga4/connect`
- `POST /api/brands/:brandId/integrations/:provider/sync`
- `GET /api/brands/:brandId/integrations`

### Intelligence
- `GET /api/brands/:brandId/weekly-briefs/latest`
- `POST /api/brands/:brandId/weekly-briefs/generate`
- `GET /api/brands/:brandId/opportunities`
- `GET /api/brands/:brandId/recommendations`

### Content
- `POST /api/brands/:brandId/content-plans/generate`
- `GET /api/brands/:brandId/content-plans`
- `POST /api/brands/:brandId/content-drafts/generate`
- `PATCH /api/content-drafts/:draftId`
- `GET /api/content-drafts/:draftId`

### Workflow
- `POST /api/approvals`
- `POST /api/approvals/:approvalId/approve`
- `POST /api/approvals/:approvalId/request-changes`
- `POST /api/publish-jobs`
- `GET /api/publish-jobs/:jobId`

## 11. UI scaffold
### App sections
- overview dashboard
- weekly brief
- opportunities
- content planner
- drafts and approvals
- publishing
- integrations
- brand settings

### First pages to scaffold
- `/login`
- `/brands/[brandId]/overview`
- `/brands/[brandId]/briefs/[briefId]`
- `/brands/[brandId]/opportunities`
- `/brands/[brandId]/content`
- `/brands/[brandId]/approvals`
- `/brands/[brandId]/publishing`
- `/brands/[brandId]/settings/integrations`

## 12. Delivery plan
### Phase 0: foundation
- create a new repo for `agency`
- scaffold `Next.js` app with `TypeScript`
- set up `Supabase`, `Postgres`, and environment management
- add UI shell, auth, and brand workspace model

### Phase 1: data backbone
- implement Shopify ingestion first
- create normalized schema and migrations
- add sync runner plus sync history
- seed one demo brand workspace

### Phase 2: intelligence MVP
- implement weekly metrics aggregation
- build opportunity scoring rules
- generate weekly brief output
- add recommendation persistence and review UI

### Phase 3: content MVP
- add brand profile and brand voice capture
- generate hooks, captions, and scripts from opportunities
- create content plan UI and draft editing
- add approval workflow

### Phase 4: publishing MVP
- integrate one publishing destination
- add scheduling and publish job tracking
- log delivery outcomes
- keep publishing approval-first

## 13. Repo scaffold plan
```text
agency/
  apps/
    web/
      app/
        (auth)/
        brands/[brandId]/
          overview/
          briefs/
          opportunities/
          content/
          approvals/
          publishing/
          settings/
      components/
      lib/
        api/
        auth/
        db/
        jobs/
        ai/
        integrations/
        analytics/
        content/
        approvals/
        publishing/
      styles/
  packages/
    config/
    database/
      migrations/
      schema/
      seeds/
    types/
    prompts/
  docs/
    product/
    architecture/
  scripts/
```

### Directory responsibilities
- `apps/web`: UI, route handlers, server actions, and app-specific composition
- `packages/database`: schema, migrations, seeds, and shared query helpers
- `packages/prompts`: prompt templates and structured output contracts
- `packages/types`: shared domain types and DTOs
- `scripts`: one-off sync, backfill, and local bootstrap scripts

## 14. MVP build order
1. Brand workspace plus auth
2. Shopify connection and daily ingestion
3. Overview dashboard with product metrics
4. Weekly brief generator
5. Opportunity and recommendation model
6. Hook and content plan generation
7. Approval workflow
8. One publishing integration

## 15. Risks and controls
### Risk: noisy recommendations
Control:
Start with narrow scoring rules and always show evidence behind a recommendation.

### Risk: generic content output
Control:
Require product context, brand voice, and recommendation source data in every generation step.

### Risk: integration complexity
Control:
Keep the MVP to Shopify, Meta, GA4, and one publishing workflow only.

### Risk: low trust in automation
Control:
Use approval-first states, audit history, and editable drafts everywhere.

## 16. Immediate next steps
1. Create the new `agency` application repo.
2. Stand up the `Postgres` schema and migration baseline from this document.
3. Scaffold the app shell, auth, and brand workspace routes.
4. Implement Shopify ingestion before adding Meta and GA4.
