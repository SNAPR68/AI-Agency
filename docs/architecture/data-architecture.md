# Data Architecture
## Agency
### Canonical entities, data flow, and integration model

## 1. Purpose
This document defines the data architecture for `agency`, including:
- canonical business entities
- external integration model
- ingestion and derivation flow
- storage responsibilities
- data trust and freshness expectations

## 2. Data design goals
- one canonical commerce and growth data model
- source-aware but provider-agnostic analytics
- brand-level tenant isolation
- explainable recommendations with evidence links
- support for both raw signal capture and curated derived models

## 3. Source systems
### Core sources
- Shopify
- Meta
- GA4
- social publishing provider

### Extended sources
- Klaviyo
- support and CX systems
- shipping and returns systems
- trend and competitor data sources

## 4. Canonical domains
### Workspace domain
- brands
- brand users
- roles and permissions
- brand profiles
- brand voice profiles

### Commerce domain
- stores
- products
- variants
- collections
- orders
- customers

### Marketing domain
- channel accounts
- campaigns
- daily channel metrics
- daily store metrics
- daily product metrics

### Intelligence domain
- trend signals
- competitors
- competitor observations
- opportunities
- recommendations
- weekly briefs

### Workflow domain
- content plans
- content drafts
- draft context items
- approvals
- approval events
- publish jobs
- publish events

### Operations domain
- sync runs
- job runs
- notifications
- audit logs

### Retention and CX domain
- retention snapshots
- lifecycle opportunities
- CX incidents
- support issue clusters
- response templates

## 5. Canonical entity responsibilities
### `brands`
Tenant root for all product data.

### `brand_profiles` and `brand_voice_profiles`
Hold positioning, messaging rules, audience context, and tone constraints for AI and reporting.

### `products`
Canonical product catalog keyed to Shopify product identity.

### `daily_product_metrics`
Primary fact table for product-level opportunity scoring.

### `daily_channel_metrics`
Primary fact table for channel-level performance analysis.

### `opportunities`
Normalized action objects created by analytics, trend, retention, or CX services.

### `recommendations`
Human-readable and machine-readable action proposals linked to opportunities.

### `content_drafts`
Editable AI or human-created outputs that can move through approvals and publishing.

### `approvals`
Approval state for briefs, drafts, or publish actions.

### `publish_jobs`
Execution records for scheduled or live publishing.

## 6. Data flow model
```mermaid
flowchart LR
    A["External providers"] --> B["Integration sync jobs"]
    B --> C["Canonical tables"]
    C --> D["Derived metrics and scoring jobs"]
    D --> E["Opportunities and recommendations"]
    E --> F["Content and workflow objects"]
    F --> G["Reports, inbox, and publishing"]
```

## 7. Sync model
### Incremental sync strategy
Every integration connection should maintain:
- sync cursor
- last successful sync time
- sync status
- provider metadata

### Sync cadence
- Shopify: near-daily or more frequent where useful
- Meta: daily
- GA4: daily
- Klaviyo: daily
- publishing state: event-driven or frequent polling
- support and CX data: daily or near-real-time depending on provider

## 8. Derived data model
Derived data should be computed from canonical tables rather than fetched live at page load.

Key derived layers:
- period-over-period comparisons
- opportunity scores
- trend fit scores
- retention risk scores
- report summaries
- AI generation context packs

## 9. Recommendation evidence model
Every recommendation should reference:
- source entity type
- source entity id
- metric window
- evidence payload
- rationale text
- confidence score

This supports:
- explainability
- auditability
- reviewer trust

## 10. Content context model
Every generated draft should preserve the context used to create it:
- linked products
- linked opportunities
- linked trends
- linked campaigns
- brand voice version
- prompt and model metadata

This supports:
- repeatability
- review quality
- better post-hoc evaluation

## 11. Data freshness expectations
### Freshness tiers
- workspace configuration: real-time
- publishing state: near-real-time
- Shopify metrics: within the daily sync window
- marketing metrics: within the daily sync window
- reports and briefs: generated on demand or scheduled

### UI expectations
The UI should expose:
- last sync timestamps
- degraded integration state
- stale data warnings when needed

## 12. Data quality rules
- never overwrite source identities with generated ids only
- preserve provider ids and cursors
- normalize to canonical enums where possible
- log mapping failures per sync run
- keep audit history for destructive or high-risk operations

## 13. Privacy and sensitive data
Sensitive data classes include:
- customer email
- provider access tokens
- support and CX conversation summaries
- report exports

Requirements:
- encrypt secrets
- minimize PII in AI prompts
- keep retention and CX summaries aggregated where possible
- restrict access by role

## 14. Relationship to current schema
The current baseline migration at `packages/database/migrations/0001_initial.sql` covers:
- workspace
- integrations
- commerce metrics
- opportunities
- drafts
- approvals
- publishing
- operations

The full product will extend that schema with:
- retention-specific tables
- CX and support-specific tables
- richer notification and report entities
- automation policy entities

