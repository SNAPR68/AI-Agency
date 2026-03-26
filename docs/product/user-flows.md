# User Flows
## Agency
### Core persona journeys and workflow maps

## 1. Purpose
This document captures the key user journeys that the full product must support.

It covers:
- workspace onboarding
- weekly review workflows
- opportunity-to-content workflows
- trend response
- retention and CX workflows
- approval and publishing workflows

## 2. Core personas
- founder / CEO
- growth marketer
- content / social lead
- e-commerce manager
- internal operator

## 3. Foundational flows
### 3.1 Workspace onboarding
Primary user:
- internal operator or brand admin

Steps:
1. User logs in.
2. User creates or enters a brand workspace.
3. User connects Shopify.
4. User connects Meta and GA4.
5. User adds brand profile and brand voice context.
6. User invites teammates and sets permissions.
7. System runs initial syncs and shows readiness state.

Success criteria:
- workspace has core data connected
- brand context is saved
- first brief can be generated

### 3.2 Founder weekly review
Primary user:
- founder / CEO

Steps:
1. Founder opens Overview or Inbox.
2. Founder reviews the latest Weekly Brief.
3. Founder checks top wins, top risks, and urgent alerts.
4. Founder reviews recommended actions.
5. Founder approves or comments on high-priority items.

Success criteria:
- founder understands the current business picture within minutes
- founder can approve next actions without digging through multiple tools

## 4. Growth workflows
### 4.1 Opportunity review and prioritization
Primary user:
- growth marketer

Steps:
1. User opens Alerts and Opportunities.
2. User filters by product, channel, trend, or severity.
3. User opens an opportunity with evidence and rationale.
4. User accepts, dismisses, or assigns the opportunity.
5. User routes accepted opportunities into content, campaign, or operational action.

Success criteria:
- high-signal opportunities are easy to find
- each opportunity has evidence and a next step

### 4.2 Channel investigation
Primary user:
- growth marketer or e-commerce manager

Steps:
1. User opens Channels.
2. User finds a drop or spike.
3. User drills into linked Campaigns or Products.
4. User checks whether content, conversion, or CX issues are contributing.
5. User creates or updates an action plan.

Success criteria:
- channel issues are traceable to likely causes
- analysis ends in clear action, not just observation

## 5. Content workflows
### 5.1 Opportunity to content draft
Primary user:
- growth marketer or content lead

Steps:
1. User opens an accepted opportunity.
2. User chooses `Generate Content`.
3. System assembles context from product, trend, and brand voice data.
4. Content Studio generates hooks, captions, scripts, or creator briefs.
5. User edits the draft.
6. User sends the draft to approval.

Success criteria:
- content output feels product-aware and brand-specific
- draft moves into workflow without copy-paste across tools

### 5.2 Content planning
Primary user:
- content / social lead

Steps:
1. User opens Content Calendar.
2. User reviews available drafts, opportunities, trends, and campaigns.
3. User builds the weekly plan.
4. User assigns channels and timing.
5. User submits plan items for approval where needed.

Success criteria:
- content plan reflects business priorities
- calendar and draft inventory stay in sync

## 6. Trend and competitor workflows
### 6.1 Trend response
Primary user:
- growth marketer or content lead

Steps:
1. User opens Trends.
2. User reviews fit score, urgency, and saturation.
3. User links a product or campaign.
4. User generates a response angle or draft.
5. User sends it into approval and publishing.

Success criteria:
- trend response is brand-safe and fast
- actionability is higher than a generic trend feed

### 6.2 Competitor response
Primary user:
- growth marketer

Steps:
1. User opens Competitors.
2. User reviews recent competitor observations.
3. User identifies a relevant launch, message, offer, or format.
4. User creates a response plan or counter-content draft.

Success criteria:
- competitor insights turn into response actions quickly

## 7. Retention and CX workflows
### 7.1 Retention intervention
Primary user:
- e-commerce manager or growth marketer

Steps:
1. User opens Retention.
2. User reviews repeat purchase trends and cohort performance.
3. User identifies a retention risk or lifecycle opportunity.
4. User creates a retention action plan.
5. User optionally routes messaging ideas into content or CRM workflows.

Success criteria:
- retention issues are visible before they become severe
- lifecycle actions are surfaced without manual analysis

### 7.2 CX issue response
Primary user:
- e-commerce manager or operator

Steps:
1. User opens CX Ops.
2. User reviews return reasons, shipping delays, and communication gaps.
3. User assigns ownership or escalates an issue.
4. User generates recommended customer messaging if needed.

Success criteria:
- CX issues are visible as growth issues, not isolated support noise
- teams can act on patterns, not only one-off tickets

### 7.3 Support operations response
Primary user:
- operator or CX lead

Steps:
1. User opens Support Ops.
2. User reviews response backlog and recurring issue clusters.
3. User escalates critical patterns or assigns them.
4. User uses suggested response templates where useful.

Success criteria:
- recurring customer pain becomes visible and actionable

## 8. Approval and publishing workflows
### 8.1 Draft approval
Primary user:
- founder, marketer, or content approver

Steps:
1. User opens Approvals.
2. User reviews a pending brief, draft, or publish request.
3. User approves, requests changes, or rejects.
4. System writes an approval event and notifies relevant users.

Success criteria:
- approval is fast
- review context is sufficient
- audit trail is preserved

### 8.2 Publishing execution
Primary user:
- content lead or operator

Steps:
1. User opens Publishing.
2. User schedules or publishes an approved item.
3. System creates a publish job.
4. Provider returns status.
5. User monitors success, retry, or failure state.

Success criteria:
- scheduling and publishing are visible and recoverable
- approval state is honored

## 9. Inbox and reporting workflows
### 9.1 Inbox triage
Primary user:
- all authenticated users

Steps:
1. User opens Inbox.
2. User sees unread approvals, alerts, reminders, and brief deliveries.
3. User opens linked items or acts directly from the inbox.

Success criteria:
- the app can be used as an operating inbox, not just a passive dashboard

### 9.2 Reporting and export
Primary user:
- founder, operator, marketer

Steps:
1. User opens Reports.
2. User chooses founder, team, or role-specific output.
3. User exports or schedules delivery.

Success criteria:
- report creation is faster than manual deck or sheet assembly

## 10. State model highlights
### Opportunity states
- open
- accepted
- dismissed
- completed

### Draft states
- draft
- pending_approval
- changes_requested
- approved
- scheduled
- published
- failed

### Integration states
- pending
- connected
- degraded
- disconnected

## 11. Cross-flow design rules
- every important screen should end in a next action
- every AI recommendation should have evidence
- every risky action should support approval or escalation
- every draft should be editable
- every workflow should reduce tool switching

