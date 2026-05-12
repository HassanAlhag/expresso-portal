/**
 * Frontend mirror of the backend permission catalog.
 * Kept in sync with portal-api/src/config/permissions.js.
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
      { key: "jobs.read",   label: "View",   description: "View delivery tasks" },
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
      { key: "services.read",   label: "View",   description: "View service catalog" },
      { key: "services.write",  label: "Edit",   description: "Create and update services" },
      { key: "services.delete", label: "Delete", description: "Permanently delete services" },
    ],
  },
  {
    domain: "enrollments",
    label: "Enrollments",
    permissions: [
      { key: "enrollments.read",   label: "View",   description: "View client enrollments" },
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
      { key: "tickets.read",   label: "View",   description: "View support tickets" },
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
      { key: "procurement.read",    label: "View",    description: "View vendors, RFQs, and requests" },
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
      { key: "hr.scorecards.write", label: "Edit", description: "Add and manage scorecards, skills, and templates" },
    ],
  },
  {
    domain: "reports",
    label: "Reports",
    permissions: [
      { key: "reports.read",   label: "View",   description: "View reports and analytics" },
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
      { key: "iam.users.read",   label: "View Users",   description: "View portal user accounts" },
      { key: "iam.users.write",  label: "Manage Users", description: "Create, edit, deactivate, and reset passwords" },
      { key: "iam.users.delete", label: "Delete Users", description: "Permanently delete user accounts" },
      { key: "iam.roles.read",   label: "View Roles",   description: "View role definitions" },
      { key: "iam.roles.write",  label: "Manage Roles", description: "Create and edit roles and permission assignments" },
      { key: "iam.teams.read",   label: "View Teams",   description: "View teams and departments" },
      { key: "iam.teams.write",  label: "Manage Teams", description: "Create and edit teams" },
      { key: "iam.invites.send", label: "Send Invites", description: "Invite new users to the portal" },
    ],
  },
  {
    domain: "website",
    label: "Website Content",
    permissions: [
      { key: "website.read",  label: "View",   description: "View website content" },
      { key: "website.write", label: "Manage", description: "Create and publish website content" },
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_CATALOG.flatMap(
  (d) => d.permissions.map((p) => p.key)
);

export const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: ALL_PERMISSION_KEYS,
  admin: ALL_PERMISSION_KEYS.filter((k) => k !== "iam.users.delete"),
  operations_manager: [
    "customers.read", "customers.write",
    "projects.read", "projects.write",
    "productions.read", "productions.write",
    "jobs.read", "jobs.write",
    "media.read", "media.write",
    "files.read", "files.write",
    "portfolio.read", "portfolio.write",
    "services.read", "services.write",
    "enrollments.read", "enrollments.write",
    "billing.read",
    "tickets.read", "tickets.write",
    "crm.read", "crm.write",
    "procurement.read",
    "reports.read",
    "activity.read",
    "iam.users.read", "iam.teams.read",
    "website.read",
  ],
  finance: [
    "customers.read",
    "projects.read",
    "files.read",
    "billing.read", "billing.write",
    "hr.expenses.read", "hr.expenses.write", "hr.expenses.approve",
    "procurement.read",
    "reports.read", "reports.export",
    "activity.read",
  ],
  procurement_manager: [
    "customers.read",
    "files.read", "files.write",
    "tickets.read", "tickets.write",
    "procurement.read", "procurement.write", "procurement.approve",
    "billing.read",
    "reports.read",
    "activity.read",
  ],
  procurement_officer: [
    "customers.read",
    "files.read", "files.write",
    "tickets.read", "tickets.write",
    "procurement.read", "procurement.write",
    "reports.read",
  ],
  project_manager: [
    "customers.read",
    "projects.read", "projects.write",
    "productions.read", "productions.write",
    "jobs.read", "jobs.write",
    "media.read", "media.write",
    "files.read", "files.write",
    "portfolio.read", "portfolio.write",
    "services.read",
    "enrollments.read",
    "billing.read",
    "tickets.read", "tickets.write",
    "crm.read",
    "reports.read",
    "activity.read",
  ],
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
  hr_management: [
    "customers.read",
    "projects.read",
    "files.read",
    "hr.staff.read", "hr.staff.write",
    "hr.expenses.read", "hr.expenses.write", "hr.expenses.approve",
    "hr.leaves.read", "hr.leaves.write", "hr.leaves.approve",
    "hr.scorecards.read", "hr.scorecards.write",
    "reports.read",
    "activity.read",
    "iam.users.read", "iam.teams.read",
  ],
  staff_client: ["projects.read", "files.read", "files.write", "billing.read", "tickets.read", "tickets.write", "reports.read"],
  procurement_client: ["procurement.read", "procurement.write", "files.read", "files.write", "billing.read", "tickets.read", "tickets.write", "reports.read"],
  client_admin: ["customers.read", "projects.read", "procurement.read", "procurement.write", "files.read", "files.write", "billing.read", "tickets.read", "tickets.write", "reports.read"],
  client: ["projects.read", "files.read", "files.write", "billing.read", "tickets.read", "tickets.write"],
  vendor: ["procurement.read", "tickets.read", "tickets.write"],
};
