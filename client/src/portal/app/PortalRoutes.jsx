import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Loader from "../shared/ui/Loader";
import { ToastProvider } from "../shared/ui/Toast";
import { CommandBarProvider } from "../shared/ui/CommandBar";

// Layout + Login
const PortalLayout = lazy(() => import("../layouts/PortalLayout"));
const PortalLogin = lazy(() => import("../pages/PortalLogin"));

// Core
const DashboardPage = lazy(() =>
  import("../features/dashboard/pages/DashboardPage")
);
const CustomersPage = lazy(() =>
  import("../features/customers/pages/CustomersPage")
);
const CustomerDetailsPage = lazy(() =>
  import("../features/customers/pages/CustomerDetailsPage")
);

// IAM
const UsersListPage = lazy(() =>
  import("../features/iam/users/pages/UsersListPage")
);
const UserDetailsPage = lazy(() =>
  import("../features/iam/users/pages/UserDetailsPage")
);
const InvitesPage = lazy(() =>
  import("../features/iam/invites/pages/InvitesPage")
);
const RolesPage = lazy(() => import("../features/iam/roles/pages/RolesPage"));
const TeamsPage = lazy(() => import("../features/iam/teams/pages/TeamsPage"));

// Content
const MediaLibraryPage = lazy(() =>
  import("../features/media-library/pages/MediaLibraryPage")
);
const ProductionsPage = lazy(() =>
  import("../features/productions/pages/ProductionsPage")
);
const ProductionDetailsPage = lazy(() =>
  import("../features/productions/pages/ProductionDetailsPage")
);
const JobsPage = lazy(() => import("../features/jobs/pages/JobsPage"));
const JobDetailsPage = lazy(() =>
  import("../features/jobs/pages/JobDetailsPage")
);

// Commercial
const ServicesPage = lazy(() =>
  import("../features/services/pages/ServicesPage")
);
const ServiceDetailsPage = lazy(() =>
  import("../features/services/pages/ServiceDetailsPage")
);
const ServiceBuilderPage = lazy(() =>
  import("../features/services/pages/ServiceBuilderPage")
);
const EnrollmentsPage = lazy(() =>
  import("../features/enrollments/pages/EnrollmentsPage")
);
const EnrollmentDetailsPage = lazy(() =>
  import("../features/enrollments/pages/EnrollmentDetailsPage")
);
const BillingPage = lazy(() => import("../features/billing/pages/BillingPage"));
const InvoiceDetailsPage = lazy(() =>
  import("../features/billing/pages/InvoiceDetailsPage")
);

// Delivery / Other
const ProjectsPage = lazy(() =>
  import("../features/projects/pages/ProjectsPage")
);
const ProjectDetailsPage = lazy(() =>
  import("../features/projects/pages/ProjectDetailsPage")
);
const TicketsPage = lazy(() => import("../features/tickets/pages/TicketsPage"));
const TicketDetailsPage = lazy(() =>
  import("../features/tickets/pages/TicketDetailsPage")
);
const FilesPage = lazy(() => import("../features/files/pages/FilesPage"));

// Reporting
const ReportsPage = lazy(() => import("../features/reports/pages/ReportsPage"));
const ActivityPage = lazy(() =>
  import("../features/activity/pages/ActivityPage")
);

// Website
const CareersAdminPage = lazy(() =>
  import("../features/careers/pages/CareersAdminPage")
);
const HomepageSlidersPage = lazy(() =>
  import("../features/website/pages/HomepageSlidersPage")
);

// Personal
const ProfilePage = lazy(() => import("../features/profile/pages/ProfilePage"));
const SettingsPage = lazy(() =>
  import("../features/settings/pages/SettingsPage")
);

// CRM
const CRMDashboardPage = lazy(() =>
  import("../features/crm/pages/CRMDashboardPage")
);
const LeadsPage = lazy(() => import("../features/crm/pages/LeadsPage"));
const LeadDetailsPage = lazy(() =>
  import("../features/crm/pages/LeadDetailsPage")
);
const DealsPage = lazy(() => import("../features/crm/pages/DealsPage"));
const DealDetailsPage = lazy(() =>
  import("../features/crm/pages/DealDetailsPage")
);
const AccountsPage = lazy(() => import("../features/crm/pages/AccountsPage"));
const AccountDetailsPage = lazy(() =>
  import("../features/crm/pages/AccountDetailsPage")
);
const ContactsPage = lazy(() => import("../features/crm/pages/ContactsPage"));
const ContactDetailsPage = lazy(() =>
  import("../features/crm/pages/ContactDetailsPage")
);

// Portfolio
const PortfolioPage = lazy(() =>
  import("../features/portfolio/pages/PortfolioPage")
);
const PortfolioDetailsPage = lazy(() =>
  import("../features/portfolio/pages/PortfolioDetailsPage")
);

// Procurement
const ProcurementDashboardPage = lazy(() =>
  import("../features/procurement/pages/ProcurementDashboardPage")
);
const ProcurementRequestsPage = lazy(() =>
  import("../features/procurement/pages/ProcurementRequestsPage")
);
const ProcurementRequestDetailsPage = lazy(() =>
  import("../features/procurement/pages/ProcurementRequestDetailsPage")
);
const ProcurementVendorsPage = lazy(() =>
  import("../features/procurement/pages/ProcurementVendorsPage")
);
const ProcurementCategoriesPage = lazy(() =>
  import("../features/procurement/pages/ProcurementCategoriesPage")
);
const VendorApplicationsPage = lazy(() =>
  import("../features/procurement/pages/VendorApplicationsPage")
);
const RFQsPage = lazy(() => import("../features/procurement/pages/RFQsPage"));
const RFQFormPage = lazy(() =>
  import("../features/procurement/pages/RFQFormPage")
);
const RFQDetailsPage = lazy(() =>
  import("../features/procurement/pages/RFQDetailsPage")
);

// HR
const HRDashboardPage = lazy(() =>
  import("../features/hr/pages/HRDashboardPage")
);
const StaffPage = lazy(() => import("../features/hr/pages/StaffPage"));
// eslint-disable-next-line no-unused-vars
const StaffDetailsPage = lazy(() =>
  import("../features/hr/pages/StaffDetailsPage")
);
const ExpenseClaimsPage = lazy(() =>
  import("../features/hr/pages/ExpenseClaimsPage")
);
const ExpenseClaimDetailsPage = lazy(() =>
  import("../features/hr/pages/ExpenseClaimDetailsPage")
);
const MonthlyExpensesPage = lazy(() =>
  import("../features/hr/pages/MonthlyExpensesPage")
);
const LeaveRequestsPage = lazy(() =>
  import("../features/hr/pages/LeaveRequestsPage")
);

export default function PortalRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="login" element={<PortalLogin />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ToastProvider>
                <CommandBarProvider
                  getItems={() => [
                    {
                      id: "go-clients",
                      label: "Go to Clients",
                      to: "/portal/customers",
                      hint: "Accounts",
                      keywords: "clients customers accounts",
                    },
                    {
                      id: "go-projects",
                      label: "Go to Projects",
                      to: "/portal/projects",
                      hint: "Delivery",
                      keywords: "projects delivery milestones",
                    },
                    {
                      id: "go-production",
                      label: "Go to Production",
                      to: "/portal/productions",
                      hint: "Jobs, reviews, publishing",
                      keywords:
                        "production jobs reels posts reviews showcase published",
                    },
                    {
                      id: "go-media",
                      label: "Go to Media Library",
                      to: "/portal/media-library",
                      hint: "Assets",
                      keywords: "media uploads assets",
                    },
                    {
                      id: "go-files",
                      label: "Go to Files",
                      to: "/portal/files",
                      hint: "Documents",
                      keywords: "files documents uploads",
                    },
                    {
                      id: "go-services",
                      label: "Go to Services",
                      to: "/portal/services",
                      hint: "Catalog",
                      keywords: "services templates catalog",
                    },
                    {
                      id: "go-enrollments",
                      label: "Go to Enrollments",
                      to: "/portal/enrollments",
                      hint: "Commercial",
                      keywords: "enrollments subscriptions plans scope",
                    },
                    {
                      id: "go-billing",
                      label: "Go to Billing",
                      to: "/portal/billing",
                      hint: "Finance",
                      keywords: "billing invoices payment finance",
                    },
                    {
                      id: "go-users",
                      label: "Go to Users",
                      to: "/portal/users",
                      hint: "IAM",
                      keywords: "users team access",
                    },
                    {
                      id: "go-roles",
                      label: "Go to Roles",
                      to: "/portal/roles",
                      hint: "IAM",
                      keywords: "roles permissions rbac",
                    },
                    {
                      id: "go-teams",
                      label: "Go to Teams",
                      to: "/portal/teams",
                      hint: "IAM",
                      keywords: "teams departments groups",
                    },
                    {
                      id: "go-invites",
                      label: "Go to Invites",
                      to: "/portal/users/invites",
                      hint: "IAM",
                      keywords: "invites portal users",
                    },
                    {
                      id: "go-contacts",
                      label: "Go to Contacts",
                      to: "/portal/crm/contacts",
                      hint: "CRM",
                      keywords: "contacts people crm",
                    },
                    {
                      id: "go-portfolio",
                      label: "Go to Portfolio",
                      to: "/portal/portfolio",
                      hint: "Content",
                      keywords: "portfolio case studies work samples website",
                    },
                    {
                      id: "go-procurement",
                      label: "Go to Procurement",
                      to: "/portal/procurement",
                      hint: "Procurement",
                      keywords: "procurement vendors rfq requests",
                    },
                    {
                      id: "go-hr",
                      label: "Go to HR",
                      to: "/portal/hr",
                      hint: "Staff, expenses, leaves",
                      keywords: "hr staff expenses leaves payroll",
                    },
                    {
                      id: "go-hr-staff",
                      label: "Go to Staff",
                      to: "/portal/hr/staff",
                      hint: "HR",
                      keywords: "staff employees team hr",
                    },
                    {
                      id: "go-hr-expenses",
                      label: "Go to Expenses",
                      to: "/portal/hr/expenses",
                      hint: "HR",
                      keywords: "expenses claims reimbursements hr",
                    },
                    {
                      id: "go-hr-leaves",
                      label: "Go to Leaves",
                      to: "/portal/hr/leaves",
                      hint: "HR",
                      keywords: "leave annual sick vacation hr",
                    },
                    {
                      id: "go-reports",
                      label: "Go to Reports",
                      to: "/portal/reports",
                      hint: "Reporting",
                      keywords: "reports performance snapshot",
                    },
                    {
                      id: "go-activity",
                      label: "Go to Activity",
                      to: "/portal/activity",
                      hint: "Reporting",
                      keywords: "activity audit timeline",
                    },
                  ]}
                >
                  <Suspense fallback={<Loader />}>
                    <PortalLayout />
                  </Suspense>
                </CommandBarProvider>
              </ToastProvider>
            </ProtectedRoute>
          }
        >
          {/* Main */}
          <Route index element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailsPage />} />

          {/* CRM */}
          <Route path="crm" element={<CRMDashboardPage />} />
          <Route path="crm/leads" element={<LeadsPage />} />
          <Route path="crm/leads/:id" element={<LeadDetailsPage />} />
          <Route path="crm/deals" element={<DealsPage />} />
          <Route path="crm/deals/:id" element={<DealDetailsPage />} />
          <Route path="crm/accounts" element={<AccountsPage />} />
          <Route path="crm/accounts/:id" element={<AccountDetailsPage />} />
          <Route path="crm/contacts" element={<ContactsPage />} />
          <Route path="crm/contacts/:id" element={<ContactDetailsPage />} />

          {/* Delivery */}
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/:id" element={<JobDetailsPage />} />
          <Route path="productions" element={<ProductionsPage />} />
          <Route path="productions/:id" element={<ProductionDetailsPage />} />
          <Route path="media-library" element={<MediaLibraryPage />} />
          <Route path="files" element={<FilesPage />} />

          {/* Commercial */}
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/new" element={<ServiceBuilderPage />} />
          <Route path="services/:id/edit" element={<ServiceBuilderPage />} />
          <Route path="services/:id" element={<ServiceDetailsPage />} />
          <Route path="enrollments" element={<EnrollmentsPage />} />
          <Route path="enrollments/:id" element={<EnrollmentDetailsPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="portfolio/:id" element={<PortfolioDetailsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="billing/:id" element={<InvoiceDetailsPage />} />

          {/* Procurement */}
          <Route path="procurement" element={<ProcurementDashboardPage />} />
          <Route
            path="procurement/requests"
            element={<ProcurementRequestsPage />}
          />
          <Route
            path="procurement/requests/:id"
            element={<ProcurementRequestDetailsPage />}
          />
          <Route
            path="procurement/vendors"
            element={<ProcurementVendorsPage />}
          />
          <Route
            path="procurement/categories"
            element={<ProcurementCategoriesPage />}
          />
          <Route
            path="procurement/vendor-applications"
            element={<VendorApplicationsPage />}
          />
          <Route path="procurement/rfqs" element={<RFQsPage />} />
          <Route path="procurement/rfqs/new" element={<RFQFormPage />} />
          <Route path="procurement/rfqs/:id/edit" element={<RFQFormPage />} />
          <Route path="procurement/rfqs/:id" element={<RFQDetailsPage />} />

          {/* HR */}
          <Route path="hr" element={<HRDashboardPage />} />
          <Route path="hr/staff" element={<StaffPage />} />
          <Route path="hr/staff/:id" element={<StaffDetailsPage />} />
          <Route path="hr/expenses" element={<ExpenseClaimsPage />} />
          <Route path="hr/expenses/:id" element={<ExpenseClaimDetailsPage />} />
          <Route path="hr/monthly-expenses" element={<MonthlyExpensesPage />} />
          <Route path="hr/leaves" element={<LeaveRequestsPage />} />

          {/* Reporting */}
          <Route path="reports" element={<ReportsPage />} />
          <Route path="activity" element={<ActivityPage />} />

          {/* IAM */}
          <Route path="users" element={<UsersListPage />} />
          <Route path="users/invites" element={<InvitesPage />} />
          <Route path="users/:id" element={<UserDetailsPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="teams" element={<TeamsPage />} />

          {/* Website content */}
          <Route path="careers" element={<CareersAdminPage />} />
          <Route path="website/slides" element={<HomepageSlidersPage />} />

          {/* Personal */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Optional legacy/support routes */}
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/:id" element={<TicketDetailsPage />} />

          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Routes>
    </Suspense>
  );
}
