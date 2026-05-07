import {
  LayoutDashboard,
  FolderKanban,
  Files,
  Settings,
  Users,
  Building2,
  Shield,
  MailPlus,
  Images,
  Clapperboard,
  BarChart3,
  Activity,
  User,
  BriefcaseBusiness,
  ReceiptText,
  Wallet,
  Target,
  Ticket,
  Briefcase,
  Layers,
  UserRound,
  Globe,
  ShoppingCart,
  ClipboardList,
  Truck,
  Tag,
  UserCheck,
  FileText,
  SlidersHorizontal,
  HeartHandshake,
  CalendarDays,
} from "lucide-react";

export const BRAND = "#6F7FD9";
export const BRAND_BROWN = "#5B3A1E";
export const LOGO_SRC = "/logo.png";

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  STAFF: "staff",
  CLIENT: "client",
};

export const ROUTES = {
  DASHBOARD: "/portal",

  CLIENTS: "/portal/customers",
  PROJECTS: "/portal/projects",

  PRODUCTIONS: "/portal/productions",
  JOBS: "/portal/jobs",
  MEDIA: "/portal/media-library",
  FILES: "/portal/files",
  PORTFOLIO: "/portal/portfolio",

  SERVICES: "/portal/services",
  ENROLLMENTS: "/portal/enrollments",
  BILLING: "/portal/billing",

  REPORTS: "/portal/reports",
  ACTIVITY: "/portal/activity",

  USERS: "/portal/users",
  INVITES: "/portal/users/invites",
  ROLES: "/portal/roles",
  TEAMS: "/portal/teams",

  CAREERS: "/portal/careers",
  HOMEPAGE_SLIDES: "/portal/website/slides",

  PROFILE: "/portal/profile",
  SETTINGS: "/portal/settings",

  TICKETS: "/portal/tickets",

  CRM_DASHBOARD: "/portal/crm",
  CRM_LEADS: "/portal/crm/leads",
  CRM_DEALS: "/portal/crm/deals",
  CRM_ACCOUNTS: "/portal/crm/accounts",
  CRM_CONTACTS: "/portal/crm/contacts",

  PROCUREMENT: "/portal/procurement",
  PROCUREMENT_REQUESTS: "/portal/procurement/requests",
  PROCUREMENT_VENDORS: "/portal/procurement/vendors",
  PROCUREMENT_CATEGORIES: "/portal/procurement/categories",
  PROCUREMENT_VENDOR_APPLICATIONS: "/portal/procurement/vendor-applications",
  PROCUREMENT_RFQS: "/portal/procurement/rfqs",

  HR: "/portal/hr",
  HR_STAFF: "/portal/hr/staff",
  HR_EXPENSES: "/portal/hr/expenses",
  HR_MONTHLY_EXPENSES: "/portal/hr/monthly-expenses",
  HR_LEAVES: "/portal/hr/leaves",
};

const ACCENTS = {
  brand: "rgba(111,127,217,0.14)",
  sand: "rgba(91,58,30,0.10)",
  mint: "rgba(16,185,129,0.12)",
  sky: "rgba(59,130,246,0.12)",
  rose: "rgba(244,63,94,0.10)",
  amber: "rgba(245,158,11,0.14)",
  violet: "rgba(139,92,246,0.12)",
};

const ITEMS = {
  dashboard: {
    to: ROUTES.DASHBOARD,
    label: "Dashboard",
    hint: "Overview & shortcuts",
    Icon: LayoutDashboard,
    accent: ACCENTS.brand,
  },

  clients: {
    to: ROUTES.CLIENTS,
    label: "Clients",
    hint: "Accounts & relationships",
    Icon: Building2,
    accent: ACCENTS.sand,
  },

  projects: {
    to: ROUTES.PROJECTS,
    label: "Projects",
    hint: "Milestones & delivery",
    Icon: FolderKanban,
    accent: ACCENTS.sky,
  },

  productions: {
    to: ROUTES.PRODUCTIONS,
    label: "Production",
    hint: "Jobs, review, publishing",
    Icon: Clapperboard,
    accent: ACCENTS.rose,
  },

  jobs: {
    to: ROUTES.JOBS,
    label: "Jobs",
    hint: "Individual delivery tasks",
    Icon: Briefcase,
    accent: ACCENTS.amber,
  },

  media: {
    to: ROUTES.MEDIA,
    label: "Media Library",
    hint: "Assets repository",
    Icon: Images,
    accent: ACCENTS.sky,
  },

  files: {
    to: ROUTES.FILES,
    label: "Files",
    hint: "Documents & uploads",
    Icon: Files,
    accent: ACCENTS.violet,
  },

  portfolio: {
    to: ROUTES.PORTFOLIO,
    label: "Portfolio",
    hint: "Case studies & website work",
    Icon: Layers,
    accent: ACCENTS.rose,
  },

  services: {
    to: ROUTES.SERVICES,
    label: "Services",
    hint: "Catalog & templates",
    Icon: BriefcaseBusiness,
    accent: ACCENTS.amber,
  },

  enrollments: {
    to: ROUTES.ENROLLMENTS,
    label: "Enrollments",
    hint: "Client plans & scope",
    Icon: ReceiptText,
    accent: ACCENTS.brand,
  },

  billing: {
    to: ROUTES.BILLING,
    label: "Billing",
    hint: "Invoices & payment",
    Icon: Wallet,
    accent: ACCENTS.sand,
  },

  reports: {
    to: ROUTES.REPORTS,
    label: "Reports",
    hint: "Snapshots & insights",
    Icon: BarChart3,
    accent: ACCENTS.amber,
  },

  activity: {
    to: ROUTES.ACTIVITY,
    label: "Activity",
    hint: "Audit & timeline",
    Icon: Activity,
    accent: ACCENTS.violet,
  },

  users: {
    to: ROUTES.USERS,
    label: "Users",
    hint: "Team & access",
    Icon: Users,
    accent: ACCENTS.mint,
    end: true,
  },

  roles: {
    to: ROUTES.ROLES,
    label: "Roles",
    hint: "RBAC permissions",
    Icon: Shield,
    accent: ACCENTS.violet,
  },

  teams: {
    to: ROUTES.TEAMS,
    label: "Teams",
    hint: "Departments & groups",
    Icon: Users,
    accent: ACCENTS.mint,
  },

  invites: {
    to: ROUTES.INVITES,
    label: "Invites",
    hint: "Invite to portal",
    Icon: MailPlus,
    accent: ACCENTS.brand,
  },

  profile: {
    to: ROUTES.PROFILE,
    label: "Profile",
    hint: "Your details",
    Icon: User,
    accent: ACCENTS.sand,
  },

  settings: {
    to: ROUTES.SETTINGS,
    label: "Settings",
    hint: "Preferences",
    Icon: Settings,
    accent: ACCENTS.brand,
  },

  tickets: {
    to: ROUTES.TICKETS,
    label: "Tickets",
    hint: "Support, CRs & procurement",
    Icon: Ticket,
    accent: ACCENTS.brand,
  },

  crmDashboard: {
    to: ROUTES.CRM_DASHBOARD,
    label: "CRM Dashboard",
    hint: "Pipeline & activity",
    Icon: LayoutDashboard,
    accent: ACCENTS.brand,
    end: true,
  },

  crmLeads: {
    to: ROUTES.CRM_LEADS,
    label: "Leads",
    hint: "Incoming opportunities",
    Icon: Target,
    accent: ACCENTS.amber,
  },

  crmDeals: {
    to: ROUTES.CRM_DEALS,
    label: "Deals",
    hint: "Commercial pipeline",
    Icon: Users,
    accent: ACCENTS.mint,
  },

  crmAccounts: {
    to: ROUTES.CRM_ACCOUNTS,
    label: "Accounts",
    hint: "Companies & contacts",
    Icon: Building2,
    accent: ACCENTS.sky,
  },

  crmContacts: {
    to: ROUTES.CRM_CONTACTS,
    label: "Contacts",
    hint: "People & relationships",
    Icon: UserRound,
    accent: ACCENTS.violet,
  },

  careers: {
    to: ROUTES.CAREERS,
    label: "Careers",
    hint: "Job openings on the website",
    Icon: Globe,
    accent: ACCENTS.sky,
  },

  homepageSlides: {
    to: ROUTES.HOMEPAGE_SLIDES,
    label: "Homepage Slides",
    hint: "Hero slider on the public site",
    Icon: SlidersHorizontal,
    accent: ACCENTS.brand,
  },

  procurement: {
    to: ROUTES.PROCUREMENT,
    label: "Procurement",
    hint: "Overview & pipeline",
    Icon: ShoppingCart,
    accent: ACCENTS.sky,
    end: true,
  },

  procurementRequests: {
    to: ROUTES.PROCUREMENT_REQUESTS,
    label: "Requests",
    hint: "Client procurement requests",
    Icon: ClipboardList,
    accent: ACCENTS.brand,
  },

  procurementVendors: {
    to: ROUTES.PROCUREMENT_VENDORS,
    label: "Vendors",
    hint: "Supplier directory",
    Icon: Truck,
    accent: ACCENTS.sand,
  },

  procurementCategories: {
    to: ROUTES.PROCUREMENT_CATEGORIES,
    label: "Categories",
    hint: "Solution types & catalog",
    Icon: Tag,
    accent: ACCENTS.violet,
  },

  vendorApplications: {
    to: ROUTES.PROCUREMENT_VENDOR_APPLICATIONS,
    label: "Vendor Applications",
    hint: "Review & approve vendor sign-ups",
    Icon: UserCheck,
    accent: ACCENTS.mint,
  },

  rfqs: {
    to: ROUTES.PROCUREMENT_RFQS,
    label: "RFQs",
    hint: "Requests for quotation",
    Icon: FileText,
    accent: ACCENTS.sky,
  },

  hr: {
    to: ROUTES.HR,
    label: "HR Dashboard",
    hint: "Staff, expenses & leaves",
    Icon: HeartHandshake,
    accent: ACCENTS.brand,
    end: true,
  },

  hrStaff: {
    to: ROUTES.HR_STAFF,
    label: "Staff",
    hint: "Employees & departments",
    Icon: Users,
    accent: ACCENTS.mint,
  },

  hrExpenses: {
    to: ROUTES.HR_EXPENSES,
    label: "Expense Claims",
    hint: "Staff expense approvals",
    Icon: ReceiptText,
    accent: ACCENTS.amber,
  },

  hrMonthlyExpenses: {
    to: ROUTES.HR_MONTHLY_EXPENSES,
    label: "Monthly Expenses",
    hint: "Registered company expenses",
    Icon: Wallet,
    accent: ACCENTS.sand,
  },

  hrLeaves: {
    to: ROUTES.HR_LEAVES,
    label: "Leave Requests",
    hint: "Annual, sick & emergency leave",
    Icon: CalendarDays,
    accent: ACCENTS.sky,
  },
};

export function getNavSectionsByRole(role) {
  const r = String(role || "").toLowerCase();

  if (r === ROLES.CLIENT) {
    return [
      {
        title: "Workspace",
        Icon: FolderKanban,
        items: [
          ITEMS.dashboard,
          ITEMS.projects,
          ITEMS.files,
          ITEMS.reports,
          ITEMS.billing,
        ],
      },
      {
        title: "Support",
        Icon: Ticket,
        items: [ITEMS.tickets],
      },
      {
        title: "Account",
        Icon: User,
        items: [ITEMS.profile, ITEMS.settings],
      },
    ];
  }

  if (r === "vendor") {
    return [
      {
        title: "Procurement",
        Icon: ShoppingCart,
        items: [ITEMS.procurement, ITEMS.rfqs],
      },
      {
        title: "Account",
        Icon: User,
        items: [ITEMS.profile, ITEMS.settings],
      },
    ];
  }

  if (r === ROLES.STAFF) {
    return [
      {
        title: "Main",
        Icon: LayoutDashboard,
        items: [ITEMS.dashboard, ITEMS.clients, ITEMS.projects],
      },
      {
        title: "Support",
        Icon: Ticket,
        items: [ITEMS.tickets],
      },
      {
        title: "Delivery",
        Icon: Clapperboard,
        items: [ITEMS.productions, ITEMS.jobs],
      },
      {
        title: "Assets",
        Icon: Images,
        items: [ITEMS.media, ITEMS.files, ITEMS.portfolio],
      },
      {
        title: "Commercial",
        Icon: Wallet,
        items: [ITEMS.services, ITEMS.enrollments],
      },
      {
        title: "Procurement",
        Icon: ShoppingCart,
        items: [ITEMS.rfqs, ITEMS.vendorApplications],
      },
      {
        title: "HR",
        Icon: HeartHandshake,
        items: [ITEMS.hrExpenses, ITEMS.hrLeaves],
      },
      {
        title: "Personal",
        Icon: User,
        items: [ITEMS.profile, ITEMS.settings],
      },
    ];
  }

  return [
    {
      title: "Main",
      Icon: LayoutDashboard,
      items: [ITEMS.dashboard, ITEMS.clients, ITEMS.projects],
    },
    {
      title: "CRM",
      Icon: Building2,
      items: [
        ITEMS.crmDashboard,
        ITEMS.crmLeads,
        ITEMS.crmDeals,
        ITEMS.crmAccounts,
        ITEMS.crmContacts,
      ],
    },
    {
      title: "Support",
      Icon: Ticket,
      items: [ITEMS.tickets],
    },
    {
      title: "Delivery",
      Icon: Clapperboard,
      items: [ITEMS.productions, ITEMS.jobs],
    },
    {
      title: "Assets",
      Icon: Images,
      items: [ITEMS.media, ITEMS.files, ITEMS.portfolio],
    },
    {
      title: "Commercial",
      Icon: Wallet,
      items: [ITEMS.services, ITEMS.enrollments, ITEMS.billing],
    },
    {
      title: "HR",
      Icon: HeartHandshake,
      items: [
        ITEMS.hr,
        ITEMS.hrStaff,
        ITEMS.hrExpenses,
        ITEMS.hrMonthlyExpenses,
        ITEMS.hrLeaves,
      ],
    },
    {
      title: "Reporting",
      Icon: BarChart3,
      items: [ITEMS.reports, ITEMS.activity],
    },
    {
      title: "IAM",
      Icon: Shield,
      items: [ITEMS.users, ITEMS.roles, ITEMS.teams, ITEMS.invites],
    },
    {
      title: "Procurement",
      Icon: ShoppingCart,
      items: [
        ITEMS.procurement,
        ITEMS.rfqs,
        ITEMS.procurementRequests,
        ITEMS.procurementVendors,
        ITEMS.procurementCategories,
        ITEMS.vendorApplications,
      ],
    },
    {
      title: "Website",
      Icon: Globe,
      items: [ITEMS.careers, ITEMS.homepageSlides],
    },
    {
      title: "System",
      Icon: Settings,
      items: [ITEMS.profile, ITEMS.settings],
    },
  ];
}

export function getPageMeta(pathname) {
  const p = pathname || ROUTES.DASHBOARD;
  const starts = (x) => p === x || p.startsWith(x + "/") || p.startsWith(x);

  if (p === ROUTES.DASHBOARD) {
    return {
      label: "Dashboard",
      subtitle: "Overview & quick actions",
      Icon: LayoutDashboard,
    };
  }

  if (starts(ROUTES.CLIENTS)) {
    return {
      label: "Clients",
      subtitle: "Accounts & relationships",
      Icon: Building2,
    };
  }

  if (starts(ROUTES.PROJECTS)) {
    return {
      label: "Projects",
      subtitle: "Milestones, progress, and delivery",
      Icon: FolderKanban,
    };
  }

  if (starts(ROUTES.PRODUCTIONS)) {
    return {
      label: "Production",
      subtitle: "Jobs, reviews, publishing, and showcase",
      Icon: Clapperboard,
    };
  }

  if (starts(ROUTES.JOBS)) {
    return {
      label: "Jobs",
      subtitle: "Individual delivery tasks and outputs",
      Icon: Briefcase,
    };
  }

  if (starts(ROUTES.MEDIA)) {
    return {
      label: "Media Library",
      subtitle: "Assets and reusable media",
      Icon: Images,
    };
  }

  if (starts(ROUTES.FILES)) {
    return {
      label: "Files",
      subtitle: "Documents and uploads",
      Icon: Files,
    };
  }

  if (starts(ROUTES.PORTFOLIO)) {
    return {
      label: "Portfolio",
      subtitle: "Case studies and work samples for the website",
      Icon: Layers,
    };
  }

  if (starts(ROUTES.SERVICES)) {
    return {
      label: "Services",
      subtitle: "Reusable templates and catalog",
      Icon: BriefcaseBusiness,
    };
  }

  if (starts(ROUTES.ENROLLMENTS)) {
    return {
      label: "Enrollments",
      subtitle: "Client plans, scope, and subscriptions",
      Icon: ReceiptText,
    };
  }

  if (starts(ROUTES.BILLING)) {
    return {
      label: "Billing",
      subtitle: "Invoices, payment, and finance",
      Icon: Wallet,
    };
  }

  if (starts(ROUTES.HR_STAFF)) {
    return {
      label: "Staff",
      subtitle: "Employees, departments, and HR records",
      Icon: Users,
    };
  }

  if (starts(ROUTES.HR_MONTHLY_EXPENSES)) {
    return {
      label: "Monthly Expenses",
      subtitle: "Registered company expenses by month",
      Icon: Wallet,
    };
  }

  if (starts(ROUTES.HR_EXPENSES)) {
    return {
      label: "Expense Claims",
      subtitle: "Staff expense requests, approvals, and registration",
      Icon: ReceiptText,
    };
  }

  if (starts(ROUTES.HR_LEAVES)) {
    return {
      label: "Leave Requests",
      subtitle: "Staff leave submissions and approvals",
      Icon: CalendarDays,
    };
  }

  if (starts(ROUTES.HR)) {
    return {
      label: "HR Dashboard",
      subtitle: "Staff, expenses, approvals, and leave overview",
      Icon: HeartHandshake,
    };
  }

  if (starts(ROUTES.REPORTS)) {
    return {
      label: "Reports",
      subtitle: "Performance and client reporting",
      Icon: BarChart3,
    };
  }

  if (starts(ROUTES.ACTIVITY)) {
    return {
      label: "Activity",
      subtitle: "Audit trail and system timeline",
      Icon: Activity,
    };
  }

  if (starts(ROUTES.INVITES)) {
    return {
      label: "Invites",
      subtitle: "Invite users into the portal",
      Icon: MailPlus,
    };
  }

  if (starts(ROUTES.USERS)) {
    return {
      label: "Users",
      subtitle: "Team and access control",
      Icon: Users,
    };
  }

  if (starts(ROUTES.ROLES)) {
    return {
      label: "Roles",
      subtitle: "RBAC roles and permissions",
      Icon: Shield,
    };
  }

  if (starts(ROUTES.TEAMS)) {
    return {
      label: "Teams",
      subtitle: "Departments and functional groups",
      Icon: Users,
    };
  }

  if (starts(ROUTES.PROFILE)) {
    return {
      label: "Profile",
      subtitle: "Your account details",
      Icon: User,
    };
  }

  if (starts(ROUTES.SETTINGS)) {
    return {
      label: "Settings",
      subtitle: "Preferences and configuration",
      Icon: Settings,
    };
  }

  if (starts(ROUTES.CAREERS)) {
    return {
      label: "Careers",
      subtitle: "Job openings on the public careers page",
      Icon: Globe,
    };
  }

  if (starts(ROUTES.HOMEPAGE_SLIDES)) {
    return {
      label: "Homepage Slides",
      subtitle: "Hero slider management for the public site",
      Icon: SlidersHorizontal,
    };
  }

  if (starts(ROUTES.PROCUREMENT_REQUESTS)) {
    return {
      label: "Requests",
      subtitle: "Client procurement requests and pipeline",
      Icon: ClipboardList,
    };
  }

  if (starts(ROUTES.PROCUREMENT_VENDORS)) {
    return {
      label: "Vendors",
      subtitle: "Supplier and partner directory",
      Icon: Truck,
    };
  }

  if (starts(ROUTES.PROCUREMENT_CATEGORIES)) {
    return {
      label: "Categories",
      subtitle: "Solution types and procurement catalog",
      Icon: Tag,
    };
  }

  if (starts(ROUTES.PROCUREMENT_VENDOR_APPLICATIONS)) {
    return {
      label: "Vendor Applications",
      subtitle: "Review and approve vendor sign-up requests",
      Icon: UserCheck,
    };
  }

  if (starts(ROUTES.PROCUREMENT_RFQS)) {
    return {
      label: "RFQs",
      subtitle: "Requests for quotation and vendor responses",
      Icon: FileText,
    };
  }

  if (starts(ROUTES.PROCUREMENT)) {
    return {
      label: "Procurement",
      subtitle: "IT solutions pipeline & vendor management",
      Icon: ShoppingCart,
    };
  }

  if (starts(ROUTES.CRM_CONTACTS)) {
    return {
      label: "Contacts",
      subtitle: "People and relationships",
      Icon: UserRound,
    };
  }

  if (starts(ROUTES.CRM_LEADS)) {
    return {
      label: "Leads",
      subtitle: "Incoming opportunities and qualification",
      Icon: Target,
    };
  }

  if (starts(ROUTES.CRM_DEALS)) {
    return {
      label: "Deals",
      subtitle: "Commercial pipeline and closing",
      Icon: Users,
    };
  }

  if (starts(ROUTES.CRM_ACCOUNTS)) {
    return {
      label: "Accounts",
      subtitle: "Companies, contacts, and relationships",
      Icon: Building2,
    };
  }

  if (starts(ROUTES.CRM_DASHBOARD)) {
    return {
      label: "CRM Dashboard",
      subtitle: "Pipeline, leads, deals, and activity",
      Icon: LayoutDashboard,
    };
  }

  return {
    label: "Portal",
    subtitle: "Workspace",
    Icon: LayoutDashboard,
  };
}
