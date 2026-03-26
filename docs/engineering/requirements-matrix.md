# Requirements Matrix
## Agency
### Product, engineering, and quality checklist

## 1. Purpose
This matrix translates the PRD into implementation-facing requirement buckets with priority and acceptance notes.

Priority key:
- `P0`: required for core product viability
- `P1`: important for breadth and workflow completeness
- `P2`: important for maturity and scale

## 2. Matrix
| Domain | Requirement | Priority | Acceptance note |
|---|---|---|---|
| Workspace | Brand workspaces exist with tenant isolation | P0 | Each brand has isolated data and settings |
| Workspace | Users, roles, and invites are supported | P0 | Role-aware access and approvals work |
| Integrations | Shopify sync is supported | P0 | Product and order data land in canonical tables |
| Integrations | Meta sync is supported | P0 | Channel metrics can be shown in app |
| Integrations | GA4 sync is supported | P0 | Session and site metrics support analysis |
| Integrations | Klaviyo support exists | P1 | Retention workflows can use CRM data |
| Analytics | Overview KPIs are available | P0 | Revenue, AOV, conversion, repeat purchase render |
| Analytics | Product scoring exists | P0 | Products can be ranked by signal strength |
| Analytics | Channel summaries exist | P0 | Users can inspect channel performance |
| Analytics | Campaign visibility exists | P1 | Campaign rows link to analysis and actions |
| Intelligence | Opportunity objects are generated | P0 | Opportunities have evidence and status |
| Intelligence | Trend scoring exists | P1 | Trends show fit and urgency |
| Intelligence | Competitor observation exists | P1 | Competitor changes are captured and reviewable |
| Content | Hooks can be generated | P0 | Product-aware hook generation works |
| Content | Captions and scripts can be generated | P0 | Draft output is editable and saved |
| Content | Creator briefs can be generated | P1 | Brief output is tied to product and campaign context |
| Content | Calendar planning exists | P1 | Drafts can be organized into a plan |
| Workflow | Approval queue exists | P0 | Drafts and briefs can be reviewed |
| Workflow | Change request state exists | P0 | Reviewers can request edits |
| Workflow | Audit trail exists | P0 | High-risk actions are logged |
| Publishing | Approved drafts can be scheduled | P0 | Publish jobs are created and tracked |
| Publishing | Delivery failures are visible | P0 | Failed jobs can be retried |
| Retention | Repeat purchase view exists | P1 | Retention page surfaces meaningful trends |
| Retention | Lifecycle recommendations exist | P1 | Users can act on retention suggestions |
| CX | Returns and delivery issue summaries exist | P1 | CX page shows grouped problems |
| Support | Response backlog and issue clusters exist | P1 | Support page supports ownership and escalation |
| Reports | Weekly founder brief exists | P0 | Founder can export or review concise summary |
| Reports | Team exports exist | P1 | Role-specific reports can be produced |
| Inbox | Alerts, approvals, and reminders converge in one inbox | P1 | Users can act from the inbox |
| Brand memory | Voice and messaging rules exist | P0 | Generation uses saved brand context |
| Admin | Automation guardrails exist | P1 | High-risk automations remain controlled |
| Quality | Background jobs are observable | P0 | Sync and worker failures can be diagnosed |
| Quality | Integration degradation is surfaced | P0 | UI shows stale or degraded states |
| Quality | AI outputs are explainable | P0 | Recommendations show rationale and evidence |
| Quality | Secrets and tokens are secured | P0 | Sensitive credentials are not exposed |
| Quality | App is desktop-first and mobile-readable | P1 | Core workflows remain usable on smaller screens |

