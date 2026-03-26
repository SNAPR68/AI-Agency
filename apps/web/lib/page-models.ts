import type { WorkspacePageModel } from "../components/workspace-page";

function baseActions(brandId: string) {
  return {
    overview: `/brands/${brandId}/overview`,
    alerts: `/brands/${brandId}/alerts`,
    briefs: `/brands/${brandId}/briefs`,
    opportunities: `/brands/${brandId}/opportunities`,
    content: `/brands/${brandId}/content`,
    approvals: `/brands/${brandId}/approvals`,
    publishing: `/brands/${brandId}/publishing`,
    integrations: `/brands/${brandId}/settings/integrations`,
    inbox: `/brands/${brandId}/inbox`
  };
}

export function getOverviewPageModel(brandId: string): WorkspacePageModel {
  const actions = baseActions(brandId);

  return {
    kicker: "Overview",
    title: "Weekly command center for a Shopify brand.",
    description:
      "This page anchors the workspace with current KPIs, sync confidence, top risks, and the next actions the team should take.",
    actions: [
      { label: "Generate Weekly Brief", href: actions.briefs },
      { label: "Open Alerts", href: actions.alerts, tone: "secondary" }
    ],
    stats: [
      {
        label: "Revenue trend",
        value: "+12.4%",
        note: "Healthy week-over-week lift from a small hero-SKU cluster."
      },
      {
        label: "Pending approvals",
        value: "4",
        note: "Two briefs and two content items are waiting on review."
      },
      {
        label: "Integration state",
        value: "2 / 3 green",
        note: "GA4 is degraded, so some traffic views may be stale."
      }
    ],
    cards: [
      {
        label: "Signals",
        title: "Business state",
        description:
          "Revenue, conversion, repeat purchase, and channel efficiency are surfaced in one operating view.",
        items: [
          "Top wins and top risks",
          "Data freshness visibility",
          "Live link to the current brief"
        ]
      },
      {
        label: "Actions",
        title: "Next decisions",
        description:
          "The command center should always point the team toward concrete next actions instead of passive reporting.",
        items: [
          "Promote winning products",
          "Investigate weak PDPs",
          "Route urgent issues into content or ops"
        ]
      }
    ]
  };
}

export function getAlertsPageModel(brandId: string): WorkspacePageModel {
  const actions = baseActions(brandId);

  return {
    kicker: "Alerts",
    title: "Exception handling for the brand workspace.",
    description:
      "Alerts collect unusual shifts in product performance, channel efficiency, CX health, and workflow blockers that need a fast owner.",
    actions: [
      { label: "View Opportunities", href: actions.opportunities },
      { label: "Open Inbox", href: actions.inbox, tone: "secondary" }
    ],
    cards: [
      {
        label: "Urgent",
        title: "Performance alerts",
        description: "High-severity issues should surface with enough evidence to act immediately.",
        items: [
          "High-traffic PDP underperforming",
          "Spend efficiency deterioration",
          "Unexpected return spike"
        ]
      },
      {
        label: "Workflow",
        title: "Operational ownership",
        description: "Alerts need assignment, dismissal, and escalation paths built into the page.",
        items: ["Assign owner", "Create linked opportunity", "Resolve or snooze"]
      }
    ]
  };
}

export function getBriefsPageModel(brandId: string): WorkspacePageModel {
  const actions = baseActions(brandId);

  return {
    kicker: "Weekly Briefs",
    title: "Historical and current founder-ready summaries.",
    description:
      "Briefs should be browsable by week, exportable, and clearly tied to wins, risks, and next-step recommendations.",
    actions: [
      { label: "Open Latest Brief", href: `${actions.briefs}/latest` },
      { label: "Generate New Brief", href: actions.briefs, tone: "secondary" }
    ],
    cards: [
      {
        label: "History",
        title: "Brief archive",
        description: "Users should scan recent weekly summaries without digging through external decks.",
        items: ["Date range filters", "Delivery status", "Summary snippets"]
      },
      {
        label: "Exports",
        title: "Share-ready output",
        description: "Briefs should be easy to export for founders and operators.",
        items: ["PDF export", "Team share links", "Inbox delivery history"]
      }
    ]
  };
}

export function getBriefDetailPageModel(
  brandId: string,
  briefId: string
): WorkspacePageModel {
  const actions = baseActions(brandId);

  return {
    kicker: "Weekly Brief",
    title: `Brief ${briefId} with evidence-backed recommendations.`,
    description:
      "This detail view combines top wins, risks, root causes, and recommended actions that can flow into opportunities or content plans.",
    actions: [
      { label: "Create Content Plan", href: actions.content },
      { label: "Open Opportunities", href: actions.opportunities, tone: "secondary" }
    ],
    cards: [
      {
        label: "What changed",
        title: "Top wins and risks",
        description: "The brief should help a founder grasp the week in minutes.",
        items: ["Winning products", "Weak spots and anomalies", "Relevant channel shifts"]
      },
      {
        label: "What next",
        title: "Actions and linked workflows",
        description:
          "Every recommendation should point to the next operating surface inside the app.",
        items: ["Create opportunity", "Generate content", "Assign an owner"]
      }
    ]
  };
}

export function getProductsPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Products",
    title: "Rank the catalog by performance and actionability.",
    description:
      "This page should help the team decide which products deserve attention, messaging support, or investigation right now.",
    actions: [
      { label: "View Product Detail", href: `/brands/${brandId}/products/prod-demo` },
      {
        label: "Open Opportunities",
        href: `/brands/${brandId}/opportunities`,
        tone: "secondary"
      }
    ],
    cards: [
      {
        label: "Catalog",
        title: "Performance list",
        description: "Products should be sortable by revenue movement, conversion, margin, and urgency.",
        items: ["Revenue delta", "Conversion delta", "Return-rate flags"]
      },
      {
        label: "Actions",
        title: "Merchandising and content hooks",
        description:
          "Products should connect directly to messaging ideas and opportunity workflows.",
        items: ["Generate hooks", "Add to content plan", "Flag merchandising issue"]
      }
    ]
  };
}

export function getProductDetailPageModel(
  brandId: string,
  productId: string
): WorkspacePageModel {
  return {
    kicker: "Product Detail",
    title: `Operating page for ${productId}.`,
    description:
      "The product detail view should combine performance data, messaging opportunities, and content actions in one place.",
    actions: [
      { label: "Generate Hooks", href: `/brands/${brandId}/content` },
      {
        label: "Add to Content Plan",
        href: `/brands/${brandId}/content/calendar`,
        tone: "secondary"
      }
    ],
    cards: [
      {
        label: "Performance",
        title: "PDP and conversion health",
        description: "This view should bring together product traffic, conversion, add-to-cart, and return signals.",
        items: ["Traffic source view", "Conversion trend", "Return trend"]
      },
      {
        label: "Messaging",
        title: "Content and positioning actions",
        description: "The page should suggest how to support the product with better storytelling or promotion.",
        items: ["Recommended hook angles", "Suggested formats", "Linked opportunities"]
      }
    ]
  };
}

export function getChannelsPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Channels",
    title: "Inspect channel efficiency and quality.",
    description:
      "Channels should show which acquisition sources are driving healthy traffic and which ones are slipping against business outcomes.",
    actions: [
      { label: "View Campaigns", href: `/brands/${brandId}/campaigns` },
      { label: "Export Channel Report", href: `/brands/${brandId}/reports`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Performance",
        title: "Spend, sessions, and conversions",
        description: "This page should make channel quality visible at a glance.",
        items: ["Spend versus revenue", "Traffic quality", "Efficiency changes"]
      },
      {
        label: "Linkage",
        title: "Cross-links to campaigns and products",
        description: "Users should move from channel signal to deeper diagnosis quickly.",
        items: ["Campaign drill-in", "Related product effects", "Linked alerts"]
      }
    ]
  };
}

export function getCampaignsPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Campaigns",
    title: "Monitor campaign health and creative needs.",
    description:
      "Campaigns should connect channel results to content demand, fatigue signals, and tactical next steps.",
    actions: [
      { label: "Generate Content", href: `/brands/${brandId}/content` },
      { label: "Open Channels", href: `/brands/${brandId}/channels`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Insights",
        title: "Campaign performance view",
        description: "Campaign rows should clearly show objective, status, and outcome quality.",
        items: ["Objective and status", "Revenue contribution", "Creative fatigue indicators"]
      },
      {
        label: "Actions",
        title: "Creative and opportunity routing",
        description: "This page should turn performance shifts into action, not just observation.",
        items: ["Generate content", "Flag issue", "Create opportunity"]
      }
    ]
  };
}

export function getOpportunitiesPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Opportunities",
    title: "Central queue of high-leverage actions.",
    description:
      "Product, channel, trend, retention, and CX opportunities should all land here in one ranked operational queue.",
    actions: [
      { label: "Generate Content", href: `/brands/${brandId}/content` },
      { label: "Assign Owner", href: `/brands/${brandId}/inbox`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Ranked",
        title: "Opportunity scoring",
        description: "Users should see priority, confidence, and evidence before taking action.",
        items: ["Impact score", "Confidence score", "Evidence drawer"]
      },
      {
        label: "Actions",
        title: "From signal to workflow",
        description: "An accepted opportunity should route directly into content, ops, or reporting workflows.",
        items: ["Accept or dismiss", "Generate content", "Escalate to owner"]
      }
    ]
  };
}

export function getTrendsPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Trends",
    title: "Translate trends into brand-relevant execution.",
    description:
      "The Trends page should score relevance, urgency, and saturation while making it obvious what action to take.",
    actions: [
      { label: "Generate Angle", href: `/brands/${brandId}/content` },
      { label: "Open Competitors", href: `/brands/${brandId}/competitors`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Fit",
        title: "Trend qualification",
        description: "Not every trend should become content. The page should help users qualify fit fast.",
        items: ["Fit score", "Urgency score", "Saturation note"]
      },
      {
        label: "Execution",
        title: "Next-step recommendations",
        description: "Each qualified trend should suggest product pairing, angle, and format.",
        items: ["Recommended product", "Suggested format", "Create draft"]
      }
    ]
  };
}

export function getCompetitorsPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Competitors",
    title: "Monitor launches, offers, messaging, and response plans.",
    description:
      "Competitor insights should become reaction plans instead of staying as passive observations.",
    actions: [
      { label: "Create Response Plan", href: `/brands/${brandId}/content` },
      { label: "Open Trends", href: `/brands/${brandId}/trends`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Observations",
        title: "Recent competitor movement",
        description: "Users should track what changed and why it matters to the brand.",
        items: ["Offer changes", "Messaging changes", "Format changes"]
      },
      {
        label: "Action",
        title: "Counter-positioning workflow",
        description: "Teams should be able to create response content directly from competitor signals.",
        items: ["Response plan", "Counter-content brief", "Assigned owner"]
      }
    ]
  };
}

export function getContentStudioPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Content Studio",
    title: "Generate revenue-linked content drafts.",
    description:
      "The studio should use product, opportunity, trend, and brand-memory context to create editable assets.",
    actions: [
      { label: "Open Content Calendar", href: `/brands/${brandId}/content/calendar` },
      {
        label: "Review Drafts",
        href: `/brands/${brandId}/content/drafts/draft-demo`,
        tone: "secondary"
      }
    ],
    cards: [
      {
        label: "Generation",
        title: "Draft creation tools",
        description: "This workspace should feel like an operating console for content, not a blank editor.",
        items: ["Hooks", "Captions", "Scripts", "Creator briefs"]
      },
      {
        label: "Context",
        title: "Inputs that keep output specific",
        description: "Every draft should be grounded in business and brand context.",
        items: ["Linked product", "Linked opportunity", "Brand voice rules"]
      }
    ]
  };
}

export function getContentCalendarPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Content Calendar",
    title: "Plan weekly output with channel and campaign context.",
    description:
      "The calendar should combine draft readiness, product priorities, and publishing cadence in one planning view.",
    actions: [
      { label: "Create Content Plan", href: `/brands/${brandId}/content` },
      { label: "Open Publishing", href: `/brands/${brandId}/publishing`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Planning",
        title: "Weekly and monthly views",
        description: "Users should place ready drafts into a realistic content rhythm.",
        items: ["Weekly slots", "Campaign overlays", "Channel filters"]
      },
      {
        label: "Readiness",
        title: "Status-aware planning",
        description: "The calendar should show draft status and publish readiness at a glance.",
        items: ["Draft states", "Approval status", "Scheduling readiness"]
      }
    ]
  };
}

export function getDraftDetailPageModel(
  brandId: string,
  draftId: string
): WorkspacePageModel {
  return {
    kicker: "Draft Detail",
    title: `Review and edit draft ${draftId}.`,
    description:
      "Draft detail should combine editor controls, linked context, version history, and approval actions.",
    actions: [
      { label: "Send for Approval", href: `/brands/${brandId}/approvals` },
      { label: "Back to Studio", href: `/brands/${brandId}/content`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Editor",
        title: "Version-aware editing",
        description: "Users need to make changes confidently before pushing drafts into workflow.",
        items: ["Version history", "Feedback thread", "Brand voice checks"]
      },
      {
        label: "Workflow",
        title: "Approval readiness",
        description: "The page should show what context supports the draft and whether it is ready for review.",
        items: ["Linked opportunity", "Linked trend", "Approval CTA"]
      }
    ]
  };
}

export function getApprovalsPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Approvals",
    title: "Keep trust high with a clear review queue.",
    description:
      "Approvals are the control layer between AI generation, human judgment, and external execution.",
    actions: [
      { label: "Open Inbox", href: `/brands/${brandId}/inbox` },
      { label: "Review Publishing", href: `/brands/${brandId}/publishing`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Queue",
        title: "Review workload",
        description: "Approvers should immediately understand what needs review and why.",
        items: ["Pending approvals", "Owner filters", "Status bands"]
      },
      {
        label: "Audit",
        title: "Decision history",
        description: "Every approval action should be logged for trust, learning, and compliance.",
        items: ["Approval notes", "Requested changes", "Decision timestamps"]
      }
    ]
  };
}

export function getPublishingPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Publishing",
    title: "Track schedules, publish jobs, and outcome states.",
    description:
      "Publishing stays narrow and high-trust: one workflow first, strong visibility, and explicit control over failure recovery.",
    actions: [
      { label: "Schedule Approved Draft", href: `/brands/${brandId}/content/calendar` },
      { label: "View Approvals", href: `/brands/${brandId}/approvals`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Queue",
        title: "Scheduling and delivery",
        description: "The publishing queue should show what is pending, scheduled, successful, or blocked.",
        items: ["Scheduled posts", "Provider state", "Retry visibility"]
      },
      {
        label: "Control",
        title: "Execution trust",
        description: "Every publish action should tie back to an approved draft and an audit event.",
        items: ["Approved source draft", "Job history", "Failure handling"]
      }
    ]
  };
}

export function getInboxPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Inbox",
    title: "Unified feed for alerts, approvals, reminders, and updates.",
    description:
      "Inbox should become the daily triage surface where operators and brand users catch what needs attention.",
    actions: [
      { label: "Open Alerts", href: `/brands/${brandId}/alerts` },
      { label: "View Approvals", href: `/brands/${brandId}/approvals`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Triage",
        title: "Unread work",
        description: "Approvals, alerts, brief deliveries, and reminders should converge here with clear action labels.",
        items: ["Unread items", "Snooze control", "Direct-link actions"]
      },
      {
        label: "Role-aware",
        title: "Relevant by user type",
        description: "Founders, marketers, and operators should each see the work that matters to them.",
        items: ["Founder approvals", "Operator alerts", "Brief delivery"]
      }
    ]
  };
}

export function getRetentionPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Retention",
    title: "Make repeat purchase and lifecycle health visible.",
    description:
      "Retention should surface the signals and opportunities that are usually buried inside CRM and reporting tools.",
    actions: [
      { label: "Generate Retention Ideas", href: `/brands/${brandId}/opportunities` },
      { label: "Open Reports", href: `/brands/${brandId}/reports`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Signals",
        title: "Retention snapshots",
        description: "Operators should see repeat purchase health and cohort movement clearly.",
        items: ["Repeat purchase rate", "Lifecycle segment view", "Churn-risk trend"]
      },
      {
        label: "Actions",
        title: "Lifecycle opportunities",
        description: "Retention should connect to concrete follow-up actions, not just diagnostics.",
        items: ["Win-back opportunity", "Replenishment prompt", "Cross-sell suggestion"]
      }
    ]
  };
}

export function getCxOpsPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "CX Ops",
    title: "Treat delivery and returns issues as growth issues.",
    description:
      "CX Ops should surface the patterns that damage trust, conversion, and margin, then route them into ownership and messaging improvements.",
    actions: [
      { label: "Create CX Alert", href: `/brands/${brandId}/alerts` },
      { label: "Open Support Ops", href: `/brands/${brandId}/support-ops`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Issues",
        title: "Returns and delivery visibility",
        description: "Operators should be able to see issue clusters, not only one-off customer complaints.",
        items: ["Return reasons", "Shipping delay patterns", "Communication gaps"]
      },
      {
        label: "Responses",
        title: "Action and ownership",
        description: "The page should support messaging improvements and operational follow-through.",
        items: ["Assign owner", "Recommend messaging", "Track resolution"]
      }
    ]
  };
}

export function getSupportOpsPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Support Ops",
    title: "See recurring customer pain before it becomes brand damage.",
    description:
      "Support Ops should bring visibility to slow response, repeated issue clusters, and escalation needs.",
    actions: [
      { label: "Escalate Issue Cluster", href: `/brands/${brandId}/inbox` },
      { label: "Open CX Ops", href: `/brands/${brandId}/cx`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Backlog",
        title: "Response health",
        description: "Operators should see the response burden and where SLA-like expectations are slipping.",
        items: ["Response time summary", "Cluster severity", "Escalation queue"]
      },
      {
        label: "Templates",
        title: "Repeatable responses",
        description: "Suggested templates should help teams respond faster without sounding generic.",
        items: ["Template suggestions", "Common issue clusters", "Resolution status"]
      }
    ]
  };
}

export function getReportsPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Reports",
    title: "Exportable views for founders, teams, and operators.",
    description:
      "Reports should package the operating system into shareable formats without recreating decks every week.",
    actions: [
      { label: "Export Founder Report", href: `/brands/${brandId}/briefs` },
      { label: "Open Inbox", href: `/brands/${brandId}/inbox`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Exports",
        title: "Role-specific outputs",
        description: "Different users need concise exports for different purposes.",
        items: ["Founder view", "Team view", "CX summary"]
      },
      {
        label: "Delivery",
        title: "Operational reporting",
        description: "Reports should be schedulable and tied back to the core workflow objects in the app.",
        items: ["Scheduled delivery", "Share links", "Export history"]
      }
    ]
  };
}

export function getIntegrationsPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Integrations",
    title: "Connect the data and execution backbone.",
    description:
      "The app should make connection status, last sync time, and degraded-state messaging obvious for every provider.",
    actions: [
      { label: "Sync Now", href: `/brands/${brandId}/settings/integrations` },
      { label: "Open Overview", href: `/brands/${brandId}/overview`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Core",
        title: "Primary providers",
        description: "Shopify, Meta, and GA4 are the initial sources of truth for the operating loop.",
        items: ["Connection status", "Last sync", "Reconnect control"]
      },
      {
        label: "Expansion",
        title: "Execution and lifecycle providers",
        description: "Publishing and lifecycle systems should plug into the same health model.",
        items: ["Publishing provider", "Klaviyo-ready slot", "Future CX connectors"]
      }
    ]
  };
}

export function getBrandMemoryPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Brand Memory",
    title: "Store the context that makes output feel specific.",
    description:
      "Brand voice, customer context, hero products, and messaging rules should be editable in one place and reused across the product.",
    actions: [
      { label: "Save Brand Voice", href: `/brands/${brandId}/settings/brand-memory` },
      { label: "Open Content Studio", href: `/brands/${brandId}/content`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Context",
        title: "Brand profile",
        description: "The system should know what the brand stands for and who it is trying to reach.",
        items: ["Positioning", "Target customer", "Hero products"]
      },
      {
        label: "Guardrails",
        title: "Voice rules",
        description: "Generated content should reflect explicit language guidance and approval feedback.",
        items: ["Do say", "Do not say", "Example phrases"]
      }
    ]
  };
}

export function getUsersPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Users",
    title: "Control access, ownership, and approval rights.",
    description:
      "This page should make it clear who can view, edit, approve, and publish across the workspace.",
    actions: [
      { label: "Invite User", href: `/brands/${brandId}/settings/users` },
      { label: "Open Automations", href: `/brands/${brandId}/settings/automations`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Access",
        title: "Role management",
        description: "Role changes should be understandable and safe for multi-user workspaces.",
        items: ["Invite flow", "Role matrix", "Approval permissions"]
      },
      {
        label: "Ownership",
        title: "Operational accountability",
        description: "Ownership rules should tie directly into approvals, inbox items, and alerts.",
        items: ["Assigned approvals", "Alert ownership", "Workspace visibility"]
      }
    ]
  };
}

export function getAutomationsPageModel(brandId: string): WorkspacePageModel {
  return {
    kicker: "Automations",
    title: "Control how far the system can act without human review.",
    description:
      "Automations should feel safe, explicit, and easy to pause. This is where the product moves from assistive to more autonomous behavior.",
    actions: [
      { label: "Create Automation", href: `/brands/${brandId}/settings/automations` },
      { label: "Open Approvals", href: `/brands/${brandId}/approvals`, tone: "secondary" }
    ],
    cards: [
      {
        label: "Guardrails",
        title: "Approval thresholds",
        description: "Automation rules should map directly to review policies and risk tolerance.",
        items: ["Safe mode", "Approval requirements", "Autopublish conditions"]
      },
      {
        label: "Monitoring",
        title: "Automation history",
        description: "Users should understand what automations ran, what changed, and when they failed.",
        items: ["Run history", "Pause or resume", "Error visibility"]
      }
    ]
  };
}

