# API Contracts
## Agency
### REST-style endpoint contracts for the full product

## 1. Purpose
This document defines the initial API surface for the full app.

It covers:
- route groups
- resource shapes
- key request and response contracts
- action endpoints for workflow transitions

## 2. API principles
- brand-scoped routes by default
- role-aware authorization
- predictable REST-style resource paths
- async actions return job ids when work is long-running
- responses expose status and data freshness where relevant

## 3. Conventions
### Auth
- authenticated routes require a valid user session
- user access is constrained by `brandId`

### Response envelope
Recommended shape:
```json
{
  "data": {},
  "meta": {
    "requestId": "req_123",
    "generatedAt": "2026-03-25T12:00:00Z"
  },
  "errors": []
}
```

### List pagination
Recommended query params:
- `page`
- `pageSize`
- `sort`
- `order`
- `status`
- `dateFrom`
- `dateTo`

## 4. Route groups
### Auth and workspace
- `GET /api/me`
- `GET /api/brands`
- `GET /api/brands/:brandId`
- `PATCH /api/brands/:brandId`
- `POST /api/brands/:brandId/invitations`
- `GET /api/brands/:brandId/users`
- `PATCH /api/brands/:brandId/users/:userId`

### Integrations
- `GET /api/brands/:brandId/integrations`
- `POST /api/brands/:brandId/integrations/:provider/connect`
- `POST /api/brands/:brandId/integrations/:provider/disconnect`
- `POST /api/brands/:brandId/integrations/:provider/sync`
- `GET /api/brands/:brandId/integrations/:provider/sync-runs`

### Overview and alerts
- `GET /api/brands/:brandId/overview`
- `GET /api/brands/:brandId/alerts`
- `POST /api/brands/:brandId/alerts/:alertId/dismiss`
- `POST /api/brands/:brandId/alerts/:alertId/assign`

### Briefs and reports
- `GET /api/brands/:brandId/briefs`
- `POST /api/brands/:brandId/briefs/generate`
- `GET /api/brands/:brandId/briefs/:briefId`
- `POST /api/brands/:brandId/briefs/:briefId/export`
- `GET /api/brands/:brandId/reports`
- `POST /api/brands/:brandId/reports/generate`

### Products, channels, campaigns
- `GET /api/brands/:brandId/products`
- `GET /api/brands/:brandId/products/:productId`
- `GET /api/brands/:brandId/channels`
- `GET /api/brands/:brandId/campaigns`
- `GET /api/brands/:brandId/campaigns/:campaignId`

### Opportunities, trends, competitors
- `GET /api/brands/:brandId/opportunities`
- `POST /api/brands/:brandId/opportunities/:opportunityId/accept`
- `POST /api/brands/:brandId/opportunities/:opportunityId/dismiss`
- `GET /api/brands/:brandId/trends`
- `POST /api/brands/:brandId/trends/:trendId/act`
- `GET /api/brands/:brandId/competitors`
- `POST /api/brands/:brandId/competitors`

### Content
- `POST /api/brands/:brandId/content/hooks/generate`
- `POST /api/brands/:brandId/content/captions/generate`
- `POST /api/brands/:brandId/content/scripts/generate`
- `POST /api/brands/:brandId/content/creator-briefs/generate`
- `GET /api/brands/:brandId/content/plans`
- `POST /api/brands/:brandId/content/plans`
- `GET /api/brands/:brandId/content/drafts`
- `POST /api/brands/:brandId/content/drafts`
- `GET /api/brands/:brandId/content/drafts/:draftId`
- `PATCH /api/brands/:brandId/content/drafts/:draftId`

### Approvals and publishing
- `GET /api/brands/:brandId/approvals`
- `POST /api/brands/:brandId/approvals`
- `POST /api/brands/:brandId/approvals/:approvalId/approve`
- `POST /api/brands/:brandId/approvals/:approvalId/request-changes`
- `POST /api/brands/:brandId/approvals/:approvalId/reject`
- `GET /api/brands/:brandId/publishing/jobs`
- `POST /api/brands/:brandId/publishing/jobs`
- `POST /api/brands/:brandId/publishing/jobs/:jobId/retry`
- `POST /api/brands/:brandId/publishing/jobs/:jobId/cancel`

### Retention, CX, support
- `GET /api/brands/:brandId/retention`
- `GET /api/brands/:brandId/lifecycle-opportunities`
- `POST /api/brands/:brandId/lifecycle-opportunities/:id/accept`
- `GET /api/brands/:brandId/cx/incidents`
- `POST /api/brands/:brandId/cx/incidents/:id/assign`
- `POST /api/brands/:brandId/cx/incidents/:id/resolve`
- `GET /api/brands/:brandId/support/clusters`
- `POST /api/brands/:brandId/support/clusters/:id/escalate`
- `GET /api/brands/:brandId/support/templates`

### Inbox and automations
- `GET /api/brands/:brandId/inbox`
- `POST /api/brands/:brandId/inbox/:itemId/read`
- `POST /api/brands/:brandId/inbox/:itemId/snooze`
- `GET /api/brands/:brandId/automations`
- `POST /api/brands/:brandId/automations`
- `PATCH /api/brands/:brandId/automations/:automationId`
- `POST /api/brands/:brandId/automations/:automationId/pause`

## 5. Key contract examples
### `GET /api/brands/:brandId/overview`
Purpose:
Provide the command-center payload for the Overview page.

Response shape:
```json
{
  "data": {
    "brand": {
      "id": "brand_123",
      "name": "Luna Skin"
    },
    "kpis": {
      "revenue": 182340.22,
      "aov": 64.11,
      "conversionRate": 0.032,
      "repeatPurchaseRate": 0.214
    },
    "topWins": [],
    "topRisks": [],
    "alerts": [],
    "pendingApprovals": 4,
    "syncHealth": {
      "shopify": "connected",
      "meta": "connected",
      "ga4": "degraded"
    }
  },
  "meta": {
    "generatedAt": "2026-03-25T12:00:00Z"
  },
  "errors": []
}
```

### `GET /api/brands/:brandId/opportunities`
Purpose:
Return ranked opportunities with filters.

Query params:
- `status`
- `type`
- `sort`
- `page`
- `pageSize`

Response shape:
```json
{
  "data": {
    "items": [
      {
        "id": "opp_001",
        "type": "product_conversion",
        "title": "High-traffic PDP underperforming",
        "priorityScore": 91,
        "confidenceScore": 0.82,
        "status": "open",
        "entityType": "product",
        "entityId": "prod_123",
        "evidence": {
          "sessionsDelta": 0.32,
          "conversionDelta": -0.18
        }
      }
    ],
    "total": 1
  },
  "meta": {
    "page": 1,
    "pageSize": 20
  },
  "errors": []
}
```

### `POST /api/brands/:brandId/content/hooks/generate`
Purpose:
Generate hook candidates from structured business context.

Request shape:
```json
{
  "productId": "prod_123",
  "opportunityId": "opp_001",
  "trendId": "trend_002",
  "goal": "increase conversion",
  "channel": "instagram_reels",
  "count": 5
}
```

Response shape:
```json
{
  "data": {
    "draftId": "draft_123",
    "hooks": [
      {
        "text": "Why customers are finally switching from harsh acids to this nightly reset serum",
        "confidence": 0.81
      }
    ]
  },
  "meta": {
    "generatedAt": "2026-03-25T12:00:00Z"
  },
  "errors": []
}
```

### `POST /api/brands/:brandId/approvals/:approvalId/approve`
Purpose:
Advance an approval target into the approved state.

Request shape:
```json
{
  "notes": "Ready to schedule for Friday."
}
```

Response shape:
```json
{
  "data": {
    "approvalId": "appr_123",
    "status": "approved",
    "decidedAt": "2026-03-25T12:00:00Z"
  },
  "meta": {},
  "errors": []
}
```

### `POST /api/brands/:brandId/publishing/jobs`
Purpose:
Create a publish or schedule request for an approved draft.

Request shape:
```json
{
  "contentDraftId": "draft_123",
  "provider": "social_provider",
  "scheduledFor": "2026-03-26T09:30:00Z"
}
```

Response shape:
```json
{
  "data": {
    "jobId": "pub_123",
    "status": "queued"
  },
  "meta": {},
  "errors": []
}
```

### `GET /api/brands/:brandId/retention`
Purpose:
Return retention health and lifecycle opportunities.

Response shape:
```json
{
  "data": {
    "summary": {
      "repeatPurchaseRate": 0.214,
      "customerLtv": 128.40,
      "churnRiskScore": 0.41
    },
    "segments": [],
    "opportunities": []
  },
  "meta": {
    "snapshotDate": "2026-03-24"
  },
  "errors": []
}
```

### `GET /api/brands/:brandId/inbox`
Purpose:
Return a unified operational inbox.

Response shape:
```json
{
  "data": {
    "items": [
      {
        "id": "inbox_123",
        "itemType": "approval_request",
        "title": "3 content drafts need review",
        "summary": "Two reels and one story caption are pending approval.",
        "linkedEntityType": "approval",
        "linkedEntityId": "appr_123",
        "status": "unread"
      }
    ]
  },
  "meta": {},
  "errors": []
}
```

## 6. Async job endpoints
Long-running endpoints should return:
- a job id
- initial status
- polling path if needed

Recommended polling endpoint:
- `GET /api/brands/:brandId/jobs/:jobId`

Use async jobs for:
- sync runs
- brief generation
- large report exports
- AI generation batches

## 7. Error model
Recommended error object:
```json
{
  "code": "integration_degraded",
  "message": "GA4 connection is degraded and the overview may be incomplete.",
  "field": null
}
```

Common error categories:
- `unauthorized`
- `forbidden`
- `not_found`
- `validation_error`
- `integration_degraded`
- `job_failed`
- `approval_required`

## 8. Webhook expectations
The app will likely need webhook handlers for:
- Shopify events
- publishing status callbacks
- support or CX provider events

Recommended path pattern:
- `POST /api/webhooks/:provider`

## 9. Relationship to current scaffold
The current app only implements placeholder endpoints for:
- health
- latest weekly brief
- opportunities

This document defines the fuller contract surface the app should grow into.
