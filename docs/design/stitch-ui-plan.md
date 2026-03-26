# Stitch UI Plan
## Agency
### Complete UI handoff plan for Stitch by Google

## 1. Purpose
Use this document as the complete UI generation brief for Stitch.

It is designed to help Stitch create:
- the shared design system
- the app shell
- the core screen families
- all 27 UI pages with consistent patterns

This plan is intentionally structured for generation in batches, not as one giant unstructured prompt.

## 2. Product context
`agency` is a revenue-linked growth operating system for Shopify and D2C brands.

It combines:
- analytics
- weekly business briefs
- opportunities
- content generation
- approvals
- publishing
- retention insights
- CX and support operations
- reporting
- automation controls

Primary users:
- Founder / CEO
- Growth Marketer
- Content / Social Lead
- E-commerce Manager
- Agency Operator

Core pain points the UI must solve:
- too many disconnected tools
- no time for dashboards
- weak connection between content and revenue
- too much content demand
- slow trend response
- retention and repeat purchase blindness
- margin pressure
- poor returns and delivery visibility
- slow support response
- low trust in AI automation

## 3. Design direction
### Product feel
The UI should feel like:
- premium
- editorial
- commerce-native
- operational
- high-trust
- dense but readable

The UI should not feel like:
- a generic AI toy
- a colorful consumer app
- a crypto dashboard
- a dribbble-style concept with no operational depth

### Visual direction
- desktop-first web app
- responsive down to tablet and mobile
- strong information hierarchy
- refined neutral palette with one warm accent
- elegant serif or characterful headline treatment paired with highly readable interface text
- glassy or softly layered surfaces are fine, but the product should remain serious and highly legible
- avoid purple-heavy styling
- avoid exaggerated dark-mode aesthetics unless offered as a secondary mode later

### UX direction
- every page should support decisions, not just data viewing
- AI should feel explainable and assistive
- evidence panels should be visible where recommendations appear
- approval and workflow states must be obvious
- users should always know what to do next

## 4. Global app shell
The authenticated app uses one shared shell.

Shell requirements:
- left sidebar navigation
- top bar with brand switcher, date range, inbox/notifications, active user, logout
- page header with title, summary, and primary CTA
- content area with cards, tables, drawers, filters, editors, and planners

Sidebar groups:
- Main
- Commerce
- Content
- Market
- Workflow
- Growth Ops
- Settings

## 5. Screen family system
There are 27 pages, but only 10 reusable screen families.

### Family 1: Public marketing
Used by:
- `/`

Needs:
- hero
- proof/value cards
- CTA section

### Family 2: Auth / persona access
Used by:
- `/login`

Needs:
- role/persona cards
- sign-in options
- trust copy

### Family 3: Command center dashboard
Used by:
- `/brands/[brandId]/overview`
- `/brands/[brandId]/retention`
- `/brands/[brandId]/cx`
- `/brands/[brandId]/support-ops`
- `/brands/[brandId]/reports`

Needs:
- KPI strip
- summary cards
- recommended actions
- quick links
- operational highlights

### Family 4: Queue / feed / operations list
Used by:
- `/brands/[brandId]/alerts`
- `/brands/[brandId]/opportunities`
- `/brands/[brandId]/inbox`
- `/brands/[brandId]/approvals`
- `/brands/[brandId]/publishing`

Needs:
- filters
- status chips
- list or table
- side detail drawer
- row-level actions

### Family 5: Archive / list / table view
Used by:
- `/brands/[brandId]/briefs`
- `/brands/[brandId]/products`
- `/brands/[brandId]/channels`
- `/brands/[brandId]/campaigns`
- `/brands/[brandId]/trends`
- `/brands/[brandId]/competitors`

Needs:
- search
- filters
- segmented controls
- sortable table or card list
- summary header

### Family 6: Narrative detail
Used by:
- `/brands/[brandId]/briefs/[briefId]`

Needs:
- executive summary
- wins / risks / why it changed
- next actions
- share/export actions

### Family 7: Entity analytics detail
Used by:
- `/brands/[brandId]/products/[productId]`

Needs:
- trend charts
- product summary
- evidence panels
- recommended actions
- linked content hooks

### Family 8: Content studio / editor
Used by:
- `/brands/[brandId]/content`
- `/brands/[brandId]/content/drafts/[draftId]`

Needs:
- context sidebar
- AI generation controls
- editor surface
- version blocks
- approval CTA

### Family 9: Calendar / planning
Used by:
- `/brands/[brandId]/content/calendar`

Needs:
- weekly/monthly planner
- draggable cards
- channel filters
- publishing readiness indicators

### Family 10: Settings / admin
Used by:
- `/brands/[brandId]/settings/integrations`
- `/brands/[brandId]/settings/brand-memory`
- `/brands/[brandId]/settings/users`
- `/brands/[brandId]/settings/automations`

Needs:
- settings cards
- forms
- member tables
- connection states
- save / reconnect / invite / pause actions

## 6. Complete page inventory
### Public pages
1. `/`
Purpose:
Landing page for the product.

Core modules:
- headline and value proposition
- explanation of the growth operating system
- key product pillars
- CTA row

Buttons:
- `Request Demo`
- `View Sample Workspace`
- `Sign In`

2. `/login`
Purpose:
Sign-in screen with demo personas and workspace access.

Core modules:
- intro copy
- persona cards
- access labels
- sign-in actions

Buttons:
- `Sign In`
- `Accept Invite`
- `Continue to Workspace`

### Authenticated pages
3. `/brands/[brandId]/overview`
Purpose:
Main command center.

Core modules:
- KPI strip
- current business state
- top wins
- top risks
- next actions
- sync health

Buttons:
- `Generate Weekly Brief`
- `Sync Data`
- `View Opportunities`
- `Open Alerts`

4. `/brands/[brandId]/alerts`
Purpose:
Operational exceptions and issue triage.

Core modules:
- severity filters
- alert list
- evidence drawer
- assignment status

Buttons:
- `Dismiss Alert`
- `Assign Owner`
- `Create Opportunity`
- `View Source`

5. `/brands/[brandId]/briefs`
Purpose:
Brief archive and generation hub.

Core modules:
- date filters
- brief history list
- delivery status
- export shortcuts

Buttons:
- `Generate New Brief`
- `Filter by Date`
- `Export Brief`
- `Open Brief`

6. `/brands/[brandId]/briefs/[briefId]`
Purpose:
Detailed weekly brief.

Core modules:
- executive summary
- wins
- risks
- why it changed
- recommended next actions

Buttons:
- `Export PDF`
- `Share Brief`
- `Create Content Plan`
- `Mark Reviewed`

7. `/brands/[brandId]/products`
Purpose:
Ranked product intelligence view.

Core modules:
- product table
- filters
- performance columns
- opportunity indicators

Buttons:
- `View Product`
- `Compare Periods`
- `Generate Hooks`
- `Flag Opportunity`

8. `/brands/[brandId]/products/[productId]`
Purpose:
Product-specific analytics and messaging actions.

Core modules:
- product summary
- trend charts
- PDP health
- opportunity block
- content recommendations

Buttons:
- `Generate Hooks`
- `Create Brief`
- `Add to Content Plan`
- `Mark Priority`

9. `/brands/[brandId]/channels`
Purpose:
Channel performance overview.

Core modules:
- channel table
- spend and efficiency metrics
- traffic quality summary
- contribution analysis

Buttons:
- `Sync Channel Data`
- `View Campaigns`
- `Export Channel Report`
- `Investigate Drop`

10. `/brands/[brandId]/campaigns`
Purpose:
Campaign performance and creative need tracking.

Core modules:
- campaign list
- performance columns
- fatigue indicators
- linked opportunities

Buttons:
- `View Campaign`
- `Generate Content`
- `Flag Issue`
- `Export Campaign Data`

11. `/brands/[brandId]/opportunities`
Purpose:
Ranked queue of growth opportunities.

Core modules:
- priority filters
- ranked list
- evidence panel
- owner/status fields

Buttons:
- `Accept Opportunity`
- `Dismiss`
- `Generate Content`
- `Assign Owner`

12. `/brands/[brandId]/trends`
Purpose:
Trend discovery and fit scoring.

Core modules:
- trend list
- urgency and saturation score
- brand fit panel
- recommended response

Buttons:
- `Act on Trend`
- `Save Trend`
- `Generate Angle`
- `Link Product`

13. `/brands/[brandId]/competitors`
Purpose:
Competitor observation and response planning.

Core modules:
- competitor list
- observation feed
- messaging or offer changes
- response suggestions

Buttons:
- `Add Competitor`
- `Save Observation`
- `Create Response Plan`
- `Generate Counter Content`

14. `/brands/[brandId]/content`
Purpose:
Main content studio.

Core modules:
- product or opportunity context
- trend context
- generation controls
- editor blocks
- draft outputs

Buttons:
- `Generate Hooks`
- `Generate Captions`
- `Generate Script`
- `Create Creator Brief`
- `Save Draft`
- `Send for Approval`

15. `/brands/[brandId]/content/calendar`
Purpose:
Content planning calendar.

Core modules:
- week/month view
- content cards
- channel filters
- readiness state

Buttons:
- `New Content Plan`
- `Add Draft to Calendar`
- `Move Item`
- `Filter by Channel`

16. `/brands/[brandId]/content/drafts/[draftId]`
Purpose:
Draft editing and review.

Core modules:
- editor
- context column
- version history
- comments or feedback area

Buttons:
- `Save Draft`
- `Send for Approval`
- `Duplicate Draft`
- `Archive Draft`

17. `/brands/[brandId]/approvals`
Purpose:
Approval queue for content, briefs, and publish actions.

Core modules:
- approval list
- preview panel
- reviewer notes
- state controls

Buttons:
- `Approve`
- `Request Changes`
- `Reject`
- `Bulk Approve`

18. `/brands/[brandId]/publishing`
Purpose:
Scheduling and publish job tracking.

Core modules:
- scheduled list
- job status table
- failure states
- audit timeline

Buttons:
- `Schedule Post`
- `Publish Now`
- `Retry Failed Job`
- `Cancel Schedule`

19. `/brands/[brandId]/inbox`
Purpose:
Unified alerts, approvals, reminders, and updates.

Core modules:
- inbox feed
- filter tabs
- item preview
- quick action controls

Buttons:
- `Mark as Read`
- `Approve from Inbox`
- `Open Linked Item`
- `Snooze`

20. `/brands/[brandId]/retention`
Purpose:
Retention and lifecycle dashboard.

Core modules:
- cohort metrics
- repeat purchase summary
- lifecycle opportunities
- segment highlights

Buttons:
- `Create Lifecycle Plan`
- `Flag Segment`
- `Export Cohort`
- `Generate Retention Ideas`

21. `/brands/[brandId]/cx`
Purpose:
Returns, delivery, and CX monitoring.

Core modules:
- incident summary
- issue clusters
- communication gap indicators
- suggested messaging

Buttons:
- `Create CX Alert`
- `Recommend Messaging`
- `Assign Owner`
- `Export Issues`

22. `/brands/[brandId]/support-ops`
Purpose:
Support issue clustering and response operations.

Core modules:
- issue clusters
- response backlog
- escalation states
- template suggestions

Buttons:
- `Assign Issue Cluster`
- `Escalate`
- `Generate Response Template`
- `Mark Resolved`

23. `/brands/[brandId]/reports`
Purpose:
Shareable reporting center.

Core modules:
- report cards
- export history
- role-based summary templates
- scheduled delivery block

Buttons:
- `Export Founder Report`
- `Export Team Report`
- `Schedule Report`
- `Share Report`

24. `/brands/[brandId]/settings/integrations`
Purpose:
Connection and sync settings.

Core modules:
- provider cards
- connection state
- sync timestamps
- health indicators

Buttons:
- `Connect Shopify`
- `Connect Meta`
- `Connect GA4`
- `Connect Klaviyo`
- `Sync Now`
- `Reconnect`

25. `/brands/[brandId]/settings/brand-memory`
Purpose:
Brand profile and voice controls.

Core modules:
- brand profile form
- voice guardrails
- personas
- hero products

Buttons:
- `Save Brand Voice`
- `Add Messaging Rule`
- `Add Hero Product`
- `Update Persona`

26. `/brands/[brandId]/settings/users`
Purpose:
User and role management.

Core modules:
- user table
- roles
- invite state
- approval permissions

Buttons:
- `Invite User`
- `Change Role`
- `Resend Invite`
- `Remove Access`

27. `/brands/[brandId]/settings/automations`
Purpose:
Automation guardrails and controls.

Core modules:
- automation policy cards
- threshold settings
- pause/resume state
- rule summaries

Buttons:
- `Create Automation`
- `Edit Rule`
- `Pause Automation`
- `Save Thresholds`

## 7. Shared component inventory
Stitch should create a reusable component library for:
- app shell
- sidebar navigation
- top bar
- page header
- KPI card
- summary card
- metric tile
- status chip
- data table
- filter bar
- search input
- segmented control
- tab group
- detail drawer
- evidence block
- AI recommendation card
- audit timeline
- empty state
- error state
- approval action bar
- editor toolbar
- rich text editor area
- calendar card
- settings card
- integration connection card
- user/member table row
- notification or inbox item

## 8. States Stitch should design
Each important pattern should support:
- default state
- loading state
- empty state
- error state
- success state
- degraded or warning state where relevant

Important examples:
- no alerts
- no opportunities
- no drafts yet
- disconnected integration
- degraded sync health
- approval pending
- publish failed

## 9. Data visualization guidance
Charts and tables should feel business-first.

Preferred patterns:
- line charts for trends
- bar charts for comparisons
- compact spark lines inside KPI cards
- dense tables for products, campaigns, and opportunities
- evidence callouts next to AI suggestions

Avoid:
- decorative charts with no operational value
- oversized visualizations that hide the decision

## 10. Responsive behavior
Desktop is primary.

Desktop:
- full sidebar visible
- multi-column content
- right-side drawers and contextual panels

Tablet:
- collapsible sidebar
- stacked sections where needed

Mobile:
- simplified hierarchy
- essential actions pinned
- drawers become full-screen panels

## 11. Recommended Stitch generation order
Do not generate all 27 screens at once.

### Batch 1: Design system and shell
Generate:
- shared app shell
- landing page
- login page
- dashboard pattern

### Batch 2: Operations patterns
Generate:
- alerts
- opportunities
- inbox
- approvals
- publishing

### Batch 3: Analytics patterns
Generate:
- briefs list
- brief detail
- products list
- product detail
- channels
- campaigns
- trends
- competitors

### Batch 4: Content patterns
Generate:
- content studio
- draft detail
- content calendar

### Batch 5: Settings and ops expansion
Generate:
- integrations
- brand memory
- users
- automations
- retention
- CX Ops
- support ops
- reports

## 12. Master prompt for Stitch
Use this as the main project brief:

```md
Create a desktop-first web app called `Agency`, a revenue-linked growth operating system for Shopify and D2C brands.

This is a premium, editorial, commerce-native B2B SaaS product. It should feel serious, operational, and high-trust rather than playful or generic. The interface should be dense but readable, with strong information hierarchy, evidence-backed AI recommendations, approval states, audit visibility, and clear next actions.

Primary users:
- Founder / CEO
- Growth Marketer
- Content / Social Lead
- E-commerce Manager
- Agency Operator

Core product job:
Unify analytics, weekly business briefs, opportunities, content generation, approvals, publishing, retention insights, CX monitoring, support visibility, and reporting into one operating system.

Core pain points:
- too many disconnected tools
- no time for dashboards
- weak connection between content and revenue
- too much content demand
- slow trend response
- weak retention visibility
- margin pressure
- poor returns and delivery visibility
- slow support response
- low trust in AI automation

DESIGN SYSTEM:
- Platform: Web, desktop-first, responsive to tablet and mobile
- Palette: refined neutral base with one warm accent
- Mood: premium, editorial, operational, high-trust
- Typography: elegant, characterful headlines with highly readable interface text
- Layout: shared app shell with left sidebar and top bar

APP SHELL:
- left sidebar navigation
- top bar with brand switcher, date range, inbox, active user, logout
- page header with title, short explanation, and primary CTA

There are 27 UI pages total:
- 2 public pages
- 25 authenticated app pages

Screen families:
1. Public marketing
2. Auth / persona access
3. Command center dashboard
4. Queue / feed / operations list
5. Archive / list / table view
6. Narrative detail
7. Entity analytics detail
8. Content studio / editor
9. Calendar / planning
10. Settings / admin

Core reusable components:
- KPI cards
- tables
- status chips
- detail drawers
- evidence blocks
- AI recommendation cards
- audit timelines
- editor surfaces
- calendar items
- integration cards
- member tables
- inbox items

UI principles:
- every page supports decisions, not just reporting
- AI recommendations must show evidence
- approval and workflow states must be explicit
- the product should feel like a real operating system for a commerce team
- avoid generic AI aesthetics and avoid purple-heavy styling
```

## 13. Batch prompts for Stitch
### Batch 1 prompt
```md
Using the Agency design system and app shell, design these screens:
- Landing page
- Login page
- Shared authenticated app shell
- Overview dashboard

Make the shell reusable for all later authenticated screens.

The overview page should include:
- KPI strip
- top wins
- top risks
- next actions
- sync health
- approval-first operating feel
```

### Batch 2 prompt
```md
Using the established Agency shell and design system, design the queue and operations screens:
- Alerts
- Opportunities
- Inbox
- Approvals
- Publishing

These should share a common pattern:
- filter bar
- status chips
- dense list or table
- detail drawer or preview panel
- strong row-level actions
- visible workflow states
```

### Batch 3 prompt
```md
Using the established Agency shell and design system, design the analytics and intelligence screens:
- Weekly Briefs list
- Weekly Brief detail
- Products list
- Product detail
- Channels
- Campaigns
- Trends
- Competitors

These screens should feel business-first, evidence-driven, and operational. Use rich tables, insight cards, charts, and recommendation blocks.
```

### Batch 4 prompt
```md
Using the established Agency shell and design system, design the content workflow screens:
- Content Studio
- Draft Detail
- Content Calendar

These should support:
- product and opportunity context
- AI generation controls
- editable draft content
- version awareness
- send-for-approval flow
- calendar planning with clear status and channel visibility
```

### Batch 5 prompt
```md
Using the established Agency shell and design system, design the settings and growth operations screens:
- Integrations
- Brand Memory
- Users
- Automations
- Retention
- CX Ops
- Support Ops
- Reports

Settings pages should feel structured and administrative.
Growth operations pages should feel like command dashboards with actionable insights and issue visibility.
```

## 14. Final instruction
If Stitch needs simplification, tell it to design by reusable patterns first, then expand those patterns across all 27 routes.
