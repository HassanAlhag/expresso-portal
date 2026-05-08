/**
 * Central permission catalog for Expresso Portal.
 * Each permission follows the pattern: domain.resource.action
 *
 * Domains: customers, projects, productions, jobs, media, files, portfolio,
 *          services, enrollments, billing, tickets, crm, procurement,
 *          hr.staff, hr.expenses, hr.leaves, hr.scorecards,
 *          reports, activity, iam, website
 */

export const PERMISSION_CATALOG = [
  {
    domain: "customers",
    label: "Customers",
    permissions: [
      { key: "customers.read",   label: "View",   description: "View customers and contacts" },
      { key: "customers.write",  label: "Edit",   description: "Create and update customers" },
      { key: "customers.delete", label: "Delete", description: "Permanently delete customer records" },
    ],
  },
  {
    domain: "projects",
    label: "Projects",
    permissions: [
      { key: "projects.read",   label: "View",   description: "View projects and milestones" },
      { key: "projects.write",  label: "Edit",   description: "Create and update projects" },
      { key: "projects.delete", label: "Delete", description: "Permanently delete projects" },
    ],
  },
  {
    domain: "productions",
    label: "Production",
    permissions: [
      { key: "productions.read",   label: "View",   description: "View production jobs and reels" },
      { key: "productions.write",  label: "Edit",   description: "Create and update productions" },
      { key: "productions.delete", label: "Delete", description: "Permanently delete productions" },
    ],
  },
  {
    domain: "jobs",
    label: "Jobs",
    permissions: [
      { key: "jobs.read",   label: "View",   description: "View delivery tasks and outputs" },
      { key: "jobs.write",  label: "Edit",   description: "Create and update jobs" },
      { key: "jobs.delete", label: "Delete", description: "Permanently delete jobs" },
    ],
  },
  {
    domain: "media",
    label: "Media Library",
    permissions: [
      { key: "media.read",   label: "View",   description: "Browse and view media assets" },
      { key: "media.write",  label: "Upload", description: "Upload and manage media assets" },
      { key: "media.delete", label: "Delete", description: "Permanently delete media assets" },
    ],
  },
  {
    domain: "files",
    label: "Files",
    permissions: [
      { key: "files.read",   label: "View",   description: "View and download files" },
      { key: "files.write",  label: "Upload", description: "Upload and manage files" },
      { key: "files.delete", label: "Delete", description: "Permanently delete files" },
    ],
  },
  {
    domain: "portfolio",
    label: "Portfolio",
    permissions: [
      { key: "portfolio.read",   label: "View",   description: "View portfolio case studies" },
      { key: "portfolio.write",  label: "Edit",   description: "Create and update portfolio entries" },
      { key: "portfolio.delete", label: "Delete", description: "Permanently delete portfolio entries" },
    ],
  },
  {
    domain: "services",
    label: "Services",
    permissions: [
      { key: "services.read",   label: "View",   description: "View service catalog and templates" },
      { key: "services.write",  label: "Edit",   description: "Create and update services" },
      { key: "services.delete", label: "Delete", description: "Permanently delete services" },
    ],
  },
  {
    domain: "enrollments",
    label: "Enrollments",
    permissions: [
      { key: "enrollments.read",   label: "View",   description: "View client enrollments and plans" },
      { key: "enrollments.write",  label: "Edit",   description: "Create and update enrollments" },
      { key: "enrollments.delete", label: "Delete", description: "Permanently delete enrollments" },
    ],
  },
  {
    domain: "billing",
    label: "Billing",
    permissions: [
      { key: "billing.read",   label: "View",   description: "View invoices and payment records" },
      { key: "billing.write",  label: "Edit",   description: "Create and manage invoices" },
      { key: "billing.delete", label: "Delete", description: "Permanently delete billing records" },
    ],
  },
  {
    domain: "tickets",
    label: "Tickets",
    permissions: [
      { key: "tickets.read",   label: "View",   description: "View support and change-request tickets" },
      { key: "tickets.write",  label: "Reply",  description: "Create and reply to tickets" },
      { key: "tickets.delete", label: "Delete", description: "Permanently delete tickets" },
    ],
  },
  {
    domain: "crm",
    label: "CRM",
    permissions: [
      { key: "crm.read",   label: "View",   description: "View leads, deals, accounts, and contacts" },
      { key: "crm.write",  label: "Edit",   description: "Create and update CRM records" },
      { key: "crm.delete", label: "Delete", description: "Permanently delete CRM records" },
    ],
  },
  {
    domain: "procurement",
    label: "Procurement",
    permissions: [
      { key: "procurement.read",    label: "View",    description: "View vendors, RFQs, and procurement requests" },
      { key: "procurement.write",   label: "Edit",    description: "Create and update procurement records" },
      { key: "procurement.delete",  label: "Delete",  description: "Permanently delete procurement records" },
      { key: "procurement.approve", label: "Approve", description: "Approve vendor applications and RFQs" },
    ],
  },
  {
    domain: "hr.staff",
    label: "HR — Staff",
    permissions: [
      { key: "hr.staff.read",   label: "View",   description: "View staff profiles, skills, and scorecards" },
      { key: "hr.staff.write",  label: "Edit",   description: "Create and update staff records, skills, and goals" },
      { key: "hr.staff.delete", label: "Delete", description: "Permanently delete staff records" },
    ],
  },
  {
    domain: "hr.expenses",
    label: "HR — Expense Claims",
    permissions: [
      { key: "hr.expenses.read",    label: "View",    description: "View all expense claims" },
      { key: "hr.expenses.write",   label: "Submit",  description: "Submit and edit expense claims" },
      { key: "hr.expenses.approve", label: "Approve", description: "Approve, reject, register, and mark expenses paid" },
      { key: "hr.expenses.delete",  label: "Delete",  description: "Permanently delete expense records" },
    ],
  },
  {
    domain: "hr.leaves",
    label: "HR — Leave Requests",
    permissions: [
      { key: "hr.leaves.read",    label: "View",    description: "View all leave requests" },
      { key: "hr.leaves.write",   label: "Submit",  description: "Submit and edit leave requests" },
      { key: "hr.leaves.approve", label: "Approve", description: "Approve, reject, and manage leave requests" },
      { key: "hr.leaves.delete",  label: "Delete",  description: "Permanently delete leave records" },
    ],
  },
  {
    domain: "hr.scorecards",
    label: "HR — Scorecards & Skills",
    permissions: [
      { key: "hr.scorecards.read",  label: "View", description: "View staff scorecards, skill matrix, and benchmarks" },
      { key: "hr.scorecards.write", label: "Edit", description: "Add and manage scorecards, skills, and review templates" },
    ],
  },
  {
    domain: "reports",
    label: "Reports",
    permissions: [
      { key: "reports.read",   label: "View",   description: "View reports and analytics dashboards" },
      { key: "reports.export", label: "Export", description: "Export report data to files" },
    ],
  },
  {
    domain: "activity",
    label: "Activity & Audit",
    permissions: [
      { key: "activity.read", label: "View", description: "View system audit trail and activity logs" },
    ],
  },
  {
    domain: "iam",
    label: "IAM — Identity & Access",
    permissions: [
      { key: "iam.users.read",   label: "View Users",   description: "View portal user accounts and profiles" },
      { key: "iam.users.write",  label: "Manage Users", description: "Create, edit, deactivate, and reset user passwords" },
      { key: "iam.users.delete", label: "Delete Users", description: "Permanently delete user accounts" },
      { key: "iam.roles.read",   label: "View Roles",   description: "View role definitions and permission assignments" },
      { key: "iam.roles.write",  label: "Manage Roles", description: "Create, edit, and assign permissions to roles" },
      { key: "iam.teams.read",   label: "View Teams",   description: "View team and department definitions" },
      { key: "iam.teams.write",  label: "Manage Teams", description: "Create and edit teams and departments" },
      { key: "iam.invites.send", label: "Send Invites", description: "Invite new users to the portal" },
    ],
  },
  {
    domain: "website",
    label: "Website Content",
    permissions: [
      { key: "website.read",  label: "View",   description: "View website content (careers, homepage slides)" },
      { key: "website.write", label: "Manage", description: "Create, edit, and publish website content" },
    ],
  },
];

/** Flat list of every valid permission key. */
export const ALL_PERMISSION_KEYS = PERMISSION_CATALOG.flatMap(
  (d) => d.permissions.map((p) => p.key)
);

/** Quick O(1) lookup set of valid keys. */
export const VALID_PERMISSION_KEYS = new Set(ALL_PERMISSION_KEYS);

/**
 * Default permission sets for each system role.
 * Used as a fallback when a role document has no permissions configured yet,
 * ensuring backward compatibility with existing users.
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: ALL_PERMISSION_KEYS, // always bypassed in middleware, listed here for UI

  admin: ALL_PERMISSION_KEYS.filter((k) => k !== "iam.users.delete"),

  staff: [
    "customers.read",
    "projects.read",    "projects.write",
    "productions.read", "productions.write",
    "jobs.read",        "jobs.write",
    "media.read",       "media.write",
    "files.read",       "files.write",
    "portfolio.read",   "portfolio.write",
    "services.read",
    "enrollments.read",
    "billing.read",
    "tickets.read",     "tickets.write",
    "crm.read",         "crm.write",
    "procurement.read",
    "hr.expenses.read", "hr.expenses.write",
    "hr.leaves.read",   "hr.leaves.write",
    "hr.scorecards.read",
    "reports.read",
    "activity.read",
  ],

  client: [
    "projects.read",
    "files.read",  "files.write",
    "billing.read",
    "tickets.read", "tickets.write",
  ],

  vendor: [
    "procurement.read",
    "tickets.read", "tickets.write",
  ],
};
