export type BrandNavigationItem = {
  href: (brandId: string) => string;
  label: string;
  description: string;
  isActive: (pathname: string, brandId: string) => boolean;
};

export type BrandNavigationSection = {
  title: string;
  items: BrandNavigationItem[];
};

function matchesExact(pathname: string, brandId: string, path: string) {
  return pathname === `/brands/${brandId}${path}`;
}

function matchesPrefix(pathname: string, brandId: string, path: string) {
  return (
    pathname === `/brands/${brandId}${path}` ||
    pathname.startsWith(`/brands/${brandId}${path}/`)
  );
}

export const brandNavigationSections: BrandNavigationSection[] = [
  {
    title: "Main",
    items: [
      {
        href: (brandId) => `/brands/${brandId}/overview`,
        label: "Overview",
        description: "Weekly performance, sync health, and top priorities.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/overview")
      },
      {
        href: (brandId) => `/brands/${brandId}/alerts`,
        label: "Alerts",
        description: "Operational exceptions, ownership, and fast action.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/alerts")
      },
      {
        href: (brandId) => `/brands/${brandId}/briefs`,
        label: "Weekly Briefs",
        description: "Founder-ready reports for what changed and what matters.",
        isActive: (pathname, brandId) => matchesPrefix(pathname, brandId, "/briefs")
      }
    ]
  },
  {
    title: "Commerce",
    items: [
      {
        href: (brandId) => `/brands/${brandId}/products`,
        label: "Products",
        description: "Revenue, conversion, margin, and merchandising signals.",
        isActive: (pathname, brandId) => matchesPrefix(pathname, brandId, "/products")
      },
      {
        href: (brandId) => `/brands/${brandId}/channels`,
        label: "Channels",
        description: "Channel efficiency, spend quality, and contribution.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/channels")
      },
      {
        href: (brandId) => `/brands/${brandId}/campaigns`,
        label: "Campaigns",
        description: "Campaign health, fatigue, and linked content needs.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/campaigns")
      },
      {
        href: (brandId) => `/brands/${brandId}/opportunities`,
        label: "Opportunities",
        description: "Ranked queue of product, trend, and CX actions.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/opportunities")
      }
    ]
  },
  {
    title: "Content",
    items: [
      {
        href: (brandId) => `/brands/${brandId}/content`,
        label: "Content Studio",
        description: "Hooks, captions, scripts, and creator briefs.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/content")
      },
      {
        href: (brandId) => `/brands/${brandId}/content/calendar`,
        label: "Content Calendar",
        description: "Weekly plans, cadence, and publish readiness.",
        isActive: (pathname, brandId) =>
          matchesPrefix(pathname, brandId, "/content/calendar")
      },
      {
        href: (brandId) => `/brands/${brandId}/content/drafts/draft-priority-brief`,
        label: "Drafts",
        description: "Versioned draft review and editing workspace.",
        isActive: (pathname, brandId) =>
          matchesPrefix(pathname, brandId, "/content/drafts")
      }
    ]
  },
  {
    title: "Market",
    items: [
      {
        href: (brandId) => `/brands/${brandId}/trends`,
        label: "Trends",
        description: "Fit scoring, urgency, and suggested execution.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/trends")
      },
      {
        href: (brandId) => `/brands/${brandId}/competitors`,
        label: "Competitors",
        description: "Observation feed and response planning.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/competitors")
      }
    ]
  },
  {
    title: "Workflow",
    items: [
      {
        href: (brandId) => `/brands/${brandId}/approvals`,
        label: "Approvals",
        description: "Review queue, comments, and change requests.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/approvals")
      },
      {
        href: (brandId) => `/brands/${brandId}/publishing`,
        label: "Publishing",
        description: "Scheduling, retries, and delivery outcomes.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/publishing")
      },
      {
        href: (brandId) => `/brands/${brandId}/inbox`,
        label: "Inbox",
        description: "Unified alerts, approvals, reminders, and updates.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/inbox")
      }
    ]
  },
  {
    title: "Growth Ops",
    items: [
      {
        href: (brandId) => `/brands/${brandId}/retention`,
        label: "Retention",
        description: "Repeat purchase trends and lifecycle opportunities.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/retention")
      },
      {
        href: (brandId) => `/brands/${brandId}/cx`,
        label: "CX Ops",
        description: "Returns, delivery, and communication issue visibility.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/cx")
      },
      {
        href: (brandId) => `/brands/${brandId}/support-ops`,
        label: "Support Ops",
        description: "Response backlog, issue clusters, and escalation.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/support-ops")
      },
      {
        href: (brandId) => `/brands/${brandId}/reports`,
        label: "Reports",
        description: "Founder and team exports with share-ready summaries.",
        isActive: (pathname, brandId) => matchesExact(pathname, brandId, "/reports")
      }
    ]
  },
  {
    title: "Settings",
    items: [
      {
        href: (brandId) => `/brands/${brandId}/settings/integrations`,
        label: "Integrations",
        description: "Connection health, sync state, and reconnect flows.",
        isActive: (pathname, brandId) =>
          matchesPrefix(pathname, brandId, "/settings/integrations")
      },
      {
        href: (brandId) => `/brands/${brandId}/settings/brand-memory`,
        label: "Brand Memory",
        description: "Voice, messaging rules, personas, and hero products.",
        isActive: (pathname, brandId) =>
          matchesPrefix(pathname, brandId, "/settings/brand-memory")
      },
      {
        href: (brandId) => `/brands/${brandId}/settings/users`,
        label: "Users",
        description: "Team roles, invites, and approval permissions.",
        isActive: (pathname, brandId) =>
          matchesPrefix(pathname, brandId, "/settings/users")
      },
      {
        href: (brandId) => `/brands/${brandId}/settings/automations`,
        label: "Automations",
        description: "Guardrails, thresholds, and autopublish controls.",
        isActive: (pathname, brandId) =>
          matchesPrefix(pathname, brandId, "/settings/automations")
      }
    ]
  }
];

export const brandNavigation = brandNavigationSections.flatMap((section) => section.items);

export function getDefaultBrandPath(brandId: string) {
  return `/brands/${brandId}/overview`;
}

export function isActiveNavigationItem(
  pathname: string,
  item: BrandNavigationItem,
  brandId: string
) {
  return item.isActive(pathname, brandId);
}

export const phaseOneNavigationLabels = [
  "Overview",
  "Alerts",
  "Weekly Briefs",
  "Inbox",
  "Integrations",
  "Brand Memory",
  "Users"
];
