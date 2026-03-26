# PRD
## Agency
### Full product requirements document for the D2C growth operating system

## 1. Document purpose
This PRD defines the full product scope for `agency`.

It consolidates the strategy, research, and information architecture into one build-facing document for product, design, and engineering.

Related documents:
- `full-app-ia.md`: page inventory and navigation structure
- `mvp-blueprint.md`: narrower implementation blueprint for the first app slice
- `../architecture/structural-architecture.md`: system structure and service boundaries
- `../architecture/data-architecture.md`: data model and integration design
- `user-flows.md`: persona and workflow definitions
- `build-plan.md`: execution phases and milestones

## 2. Product overview
`Agency` is a revenue-linked growth operating system for Shopify-first D2C brands.

It connects:
- Shopify store data
- marketing and analytics data
- trend and competitor signals
- content operations
- approval workflows
- publishing workflows
- retention and CX signals

It turns those inputs into:
- business clarity
- ranked opportunities
- content recommendations
- reviewable drafts
- operational alerts
- execution workflows
- founder and team reporting

This product is not:
- just an analytics dashboard
- just a social scheduler
- just an AI writer
- just a retention tool
- just a trend monitor

The value is the operating layer that connects all of those jobs.

## 3. Problem statement
D2C brands operate across too many disconnected tools for analytics, attribution, content, trend monitoring, retention, publishing, and reporting.

As a result:
- teams waste time moving between systems
- insights arrive without actions
- content output is constant but hard to sustain
- content is often disconnected from revenue outcomes
- trend signals are hard to translate into brand-safe execution
- founders still need humans to summarize what matters
- retention, CX, and support gaps remain disconnected from growth planning

The market does not need another point solution.
It needs a trusted operating layer that turns fragmented signals into coordinated action.

## 4. Product vision
Build the day-to-day operating system for lean Shopify brands.

The system should answer:
- What changed?
- Why did it change?
- Which products matter right now?
- Which channels and campaigns need attention?
- What should we publish next?
- Which trend should we act on?
- What is hurting retention, margin, or CX?
- What should the founder or team do next?

## 5. Positioning
### Category framing
**Revenue-linked content and growth OS for Shopify brands**

### Sharp wedge
**Turn store performance into weekly hooks, content, and growth actions automatically.**

### Full-product promise
Give lean D2C teams one system for:
- insight
- prioritization
- content generation
- approvals
- publishing
- retention and CX visibility
- reporting

## 6. Target users
### Primary ICP
Shopify brands in roughly the `$1M-$20M` GMV range with lean teams in:
- beauty and skincare
- apparel and fashion
- supplements
- home and lifestyle

### Core personas
#### Founder / CEO
Needs:
- quick business clarity
- concise risks and wins
- low dashboard fatigue
- approval visibility

#### Growth marketer
Needs:
- fast prioritization
- clearer channel and campaign actions
- performance-linked content recommendations
- trend and competitor context

#### Content / social lead
Needs:
- a steady flow of high-quality hooks, captions, scripts, and briefs
- approval-safe workflows
- clear connection between content and business priorities

#### E-commerce manager
Needs:
- visibility into product movement, PDP issues, returns, retention, and margin pressure
- clear signals on what needs operational attention

#### Internal agency operator
Needs:
- multi-brand coordination
- concise updates
- assignment, accountability, and reporting

## 7. Jobs to be done
When a lean D2C team is trying to grow a Shopify brand, they want to:
- understand what changed without manually pulling reports
- identify which products and campaigns deserve attention
- turn insights into content and execution quickly
- react to trends without losing brand integrity
- route work through approvals before anything risky goes live
- monitor retention, delivery, and support pain that affects growth
- keep founders informed without manual reporting overhead

## 8. Pain points to solve
### Brand and operator pain points
- rising CAC
- weak retention and repeat purchase
- too much content demand
- too many disconnected tools
- weak attribution confidence
- no time for dashboards
- slow trend response
- weak connection between content and revenue
- reporting fatigue
- margin pressure

### End-customer pain points the product should help operators address
- poor returns and delivery communication
- slow support response
- generic content
- low trust in inauthentic brands
- unclear value communication

## 9. Product goals
### Business goals
- create a differentiated software product in the D2C tooling market
- reduce manual strategist and reporting workload
- support a hybrid productized-service and SaaS motion
- deliver clear value to pilot brands quickly

### Product goals
- unify core growth operations in one workspace
- turn analytics into actions, not just reports
- generate performance-linked content outputs
- support approval-first automation
- improve trust in AI through explainability and control
- give teams visibility into retention, CX, and support issues that affect growth

## 10. Product principles
- action over reporting
- commerce-native before channel-generic
- approval-first before full autonomy
- explainable AI over black-box AI
- modular services instead of one giant agent
- brand specificity over generic generation
- founder clarity without sacrificing operator depth
- one workspace for cross-functional coordination

## 11. Full product scope
### 11.1 Command center
The product must provide:
- a unified overview page
- alerts and exception handling
- weekly founder and team briefs
- cross-workspace notifications and inbox

### 11.2 Commerce and analytics intelligence
The product must provide:
- store performance monitoring
- product intelligence and ranking
- channel and campaign performance views
- opportunity detection across products, channels, and campaigns
- profitability and margin-aware signals where data allows

### 11.3 Content intelligence
The product must provide:
- hook generation
- caption generation
- script generation
- creator brief generation
- draft editing and versioning
- content calendar planning
- product and trend-linked content recommendations

### 11.4 Market intelligence
The product must provide:
- trend monitoring
- trend-to-brand-fit scoring
- urgency and saturation signals
- competitor tracking
- response recommendations

### 11.5 Workflow and execution
The product must provide:
- approval routing
- change requests
- publish queue and scheduling
- audit trail
- controlled automation settings

### 11.6 Retention and lifecycle intelligence
The product must provide:
- repeat purchase tracking
- retention opportunity detection
- lifecycle recommendations
- segment- or cohort-level insights

### 11.7 CX and support operations
The product must provide:
- delivery and returns issue visibility
- CX communication recommendations
- support-response monitoring
- recurring complaint clustering
- escalation tracking

### 11.8 Reporting and collaboration
The product must provide:
- founder-ready reports
- team reports
- account-manager style updates
- notifications and reminders
- shared review and audit history

### 11.9 Settings and admin
The product must provide:
- integrations management
- brand memory and voice settings
- user and permissions management
- automation guardrails

## 12. Core modules
### Analytics Agent
Produces summaries, alerts, product intelligence, and action recommendations from commerce and channel data.

### Content Agent
Creates hooks, captions, scripts, creator briefs, and content plans using performance and brand context.

### Trend Agent
Monitors trends and competitors, scores relevance, and proposes actions.

### Publishing Agent
Schedules publishing, tracks job state, and supports controlled execution.

### Retention Agent
Surfaces repeat-purchase risks, lifecycle opportunities, and retention recommendations.

### CX Ops Agent
Summarizes returns, delivery, and support issues and turns them into operator actions.

### Account Manager Agent
Delivers briefs, alerts, approvals, reminders, and role-specific updates.

## 13. Functional requirements
### 13.1 Integrations
Must support:
- Shopify
- Meta
- GA4
- one social publishing workflow

Should support:
- Klaviyo
- additional social and paid sources
- support desk connectors
- shipping and CX systems where useful

### 13.2 Workspace and identity
Must:
- support brand workspaces
- support multiple users per brand
- support role-based permissions
- support invite and approval ownership flows

### 13.3 Analytics and opportunities
Must:
- track revenue
- track AOV
- track conversion
- track repeat purchase
- identify top and weak products
- identify meaningful changes over time
- generate machine-readable opportunities
- attach evidence to recommendations

### 13.4 Content generation
Must:
- generate product-aware hooks
- generate captions and scripts
- use brand voice inputs
- support multiple content formats
- version drafts
- support editing before approval

### 13.5 Trends and competitors
Must:
- monitor category and content signals
- score brand fit
- score urgency
- recommend actions
- avoid generic trend spam
- persist competitor observations

### 13.6 Workflow and approvals
Must:
- maintain draft states
- allow approvals before publishing
- support comments and change requests
- track publishing state
- log actions in an audit trail

### 13.7 Retention and lifecycle
Must:
- monitor repeat purchase signals
- identify retention risks or opportunities
- produce lifecycle recommendations

### 13.8 CX and support
Must:
- surface returns and delivery issue summaries
- surface support-response gaps
- recommend communication improvements
- support ownership and escalation

### 13.9 Reporting
Must:
- generate weekly summaries
- explain insights in plain language
- include recommended actions
- support founder and team export formats

## 14. AI behavior requirements
The AI layer must:
- show evidence and rationale for recommendations
- use brand memory and brand voice
- generate editable drafts, not lock users into output
- support approval-first execution
- maintain auditability across decisions and actions
- allow safe operation even when some integrations are degraded

## 15. Permissions and roles
### Minimum roles
- owner
- founder / executive reviewer
- growth marketer
- content lead
- e-commerce manager
- analyst / operator

### Role expectations
- only permitted roles can approve or publish
- sensitive integrations and automations require elevated permissions
- reporting and exports can be role-specific

## 16. Non-functional requirements
- reliable scheduled ingestion and jobs
- explainable recommendations
- secure handling of client data
- brand-safe generation
- modular architecture
- API-first design
- multi-tenant data isolation
- observable background jobs and sync runs
- resilient behavior under integration outages
- mobile-readable, desktop-first UI

## 17. Success metrics
### Product-level success
- weekly active usage by pilot brands
- percent of brands reviewing weekly briefs
- percent of opportunities acted on
- percent of generated drafts approved
- time saved on reporting and content planning
- user trust and satisfaction with recommendations

### Outcome-level success
- faster content planning cycle time
- improved relevance of content output
- better prioritization of products and trends
- higher retention of pilot brands using the workflow weekly

## 18. Non-goals
The product should not start by trying to become:
- a full ad buying platform
- a full customer support suite
- a full warehouse or ERP system
- a generic all-industry AI workspace
- a full marketplace operations platform beyond Shopify-first focus

## 19. Major risks
### Risk: generic output
Mitigation:
Make brand memory, product context, and evidence mandatory inputs to generation.

### Risk: low trust in automation
Mitigation:
Use approval-first workflows, audit trails, and editable drafts.

### Risk: integration complexity
Mitigation:
Define canonical data models and isolate ingestion concerns behind integration services.

### Risk: noisy recommendations
Mitigation:
Prefer fewer high-confidence opportunities over large low-signal feeds.

### Risk: scope sprawl
Mitigation:
Build the full system in vertical slices with shared primitives instead of isolated point features.

## 20. Linked source of truth
This PRD is intentionally broad.

Use the following companion docs during implementation:
- `full-app-ia.md` for pages and navigation
- `../architecture/structural-architecture.md` for service boundaries
- `../architecture/data-architecture.md` for canonical entities and data flow
- `user-flows.md` for journey design
- `build-plan.md` for execution order
