# API endpoint index

[API map](API-MAP.md) · [Blueprint](EXPRESSO-SYSTEM-BLUEPRINT.html) · Baseline `58b8f86c` plus Stage R1 and R2 changes.

All **300** explicit method/path registrations, grouped by business domain. Generated from [source-inventory.json](source-inventory.json); regenerate rather than edit by hand.

- **Guard** = middleware on the route: `auth` (valid session), a permission key, `internal-only` (staff), `super_admin`, **staff or approved vendor** / **approved vendor only** (an active vendor profile; R2). **public** means no session is required; **public, optional sign-in** means anonymous callers get published/active records only, while signed-in CMS users with the right permission also see drafts (R1, P0-1). Controllers add tenant, ownership and state checks that are not shown here.
- **Frontend consumer** = reachable client files with a literal call to this path (best effort; calls built from variables can be missed). `—` means none was found.

## Admin diagnostics — 1 route

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/admin/system-status` | auth · super_admin | `inline handler (see source)` (systemStatus.routes.js) | — |

## CRM — 28 routes

Models: CRMAccount, CRMActivity, CRMContact, CRMDeal, CRMLead.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/crm/accounts` | auth · `crm.read` | `listAccounts` (account.controller.js) | portal/features/crm/api.js |
| POST | `/api/crm/accounts` | auth · `crm.write` | `createAccount` (account.controller.js) | portal/features/crm/api.js |
| DELETE | `/api/crm/accounts/:id` | auth · `crm.delete` | `deleteAccount` (account.controller.js) | portal/features/crm/api.js |
| GET | `/api/crm/accounts/:id` | auth · `crm.read` | `getAccount` (account.controller.js) | portal/features/crm/api.js |
| PATCH | `/api/crm/accounts/:id` | auth · `crm.write` | `updateAccount` (account.controller.js) | portal/features/crm/api.js |
| GET | `/api/crm/activities` | auth · `crm.read` | `listActivities` (activity.controller.js) | portal/features/crm/api.js |
| POST | `/api/crm/activities` | auth · `crm.write` | `createActivity` (activity.controller.js) | portal/features/crm/api.js |
| DELETE | `/api/crm/activities/:id` | auth · `crm.delete` | `deleteActivity` (activity.controller.js) | portal/features/crm/api.js |
| GET | `/api/crm/activities/:id` | auth · `crm.read` | `getActivity` (activity.controller.js) | — |
| PATCH | `/api/crm/activities/:id` | auth · `crm.write` | `updateActivity` (activity.controller.js) | portal/features/crm/api.js |
| GET | `/api/crm/contacts` | auth · `crm.read` | `listContacts` (contact.controller.js) | portal/features/crm/api.js |
| POST | `/api/crm/contacts` | auth · `crm.write` | `createContact` (contact.controller.js) | portal/features/crm/api.js |
| DELETE | `/api/crm/contacts/:id` | auth · `crm.delete` | `deleteContact` (contact.controller.js) | portal/features/crm/api.js |
| GET | `/api/crm/contacts/:id` | auth · `crm.read` | `getContact` (contact.controller.js) | portal/features/crm/api.js |
| PATCH | `/api/crm/contacts/:id` | auth · `crm.write` | `updateContact` (contact.controller.js) | portal/features/crm/api.js |
| GET | `/api/crm/deals` | auth · `crm.read` | `listDeals` (deal.controller.js) | portal/features/crm/api.js |
| POST | `/api/crm/deals` | auth · `crm.write` | `createDeal` (deal.controller.js) | portal/features/crm/api.js |
| DELETE | `/api/crm/deals/:id` | auth · `crm.delete` | `deleteDeal` (deal.controller.js) | portal/features/crm/api.js |
| GET | `/api/crm/deals/:id` | auth · `crm.read` | `getDeal` (deal.controller.js) | portal/features/crm/api.js |
| PATCH | `/api/crm/deals/:id` | auth · `crm.write` | `updateDeal` (deal.controller.js) | portal/features/crm/api.js |
| POST | `/api/crm/deals/:id/convert-to-customer` | auth · `crm.write` | `convertDealToCustomer` (deal.controller.js) | portal/features/crm/api.js |
| GET | `/api/crm/leads` | auth · `crm.read` | `listLeads` (lead.controller.js) | portal/features/crm/api.js |
| POST | `/api/crm/leads` | auth · `crm.write` | `createLead` (lead.controller.js) | portal/features/crm/api.js |
| DELETE | `/api/crm/leads/:id` | auth · `crm.delete` | `deleteLead` (lead.controller.js) | portal/features/crm/api.js |
| GET | `/api/crm/leads/:id` | auth · `crm.read` | `getLeadById` (lead.controller.js) | portal/features/crm/api.js |
| PATCH | `/api/crm/leads/:id` | auth · `crm.write` | `updateLead` (lead.controller.js) | portal/features/crm/api.js |
| POST | `/api/crm/leads/:id/convert` | auth · `crm.write` | `convertLeadToDeal` (lead.controller.js) | portal/features/crm/api.js |
| GET | `/api/crm/leads/assignees` | auth · `crm.read` | `listLeadAssignees` (lead.controller.js) | portal/features/crm/api.js |

## Careers — 11 routes

Models: Career, JobApplication.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/careers` | auth · `website.read` | `listCareers` (career.controller.js) | portal/features/careers/api.js |
| POST | `/api/careers` | auth · `website.write` | `createCareer` (career.controller.js) | portal/features/careers/api.js |
| DELETE | `/api/careers/:id` | auth · `website.write` | `deleteCareer` (career.controller.js) | portal/features/careers/api.js |
| PATCH | `/api/careers/:id` | auth · `website.write` | `updateCareer` (career.controller.js) | portal/features/careers/api.js |
| GET | `/api/careers/:id/applications` | auth · `website.read` | `listApplications` (application.controller.js) | portal/features/careers/api.js |
| POST | `/api/careers/:id/apply` | public | `applyForJob` (application.controller.js) | api/careers.js |
| GET | `/api/careers/applications` | auth · `website.read` | `listAllApplications` (application.controller.js) | portal/features/careers/api.js |
| GET | `/api/careers/applications/:id/cv-url` | auth · `website.read` | `getApplicationCvUrl` (application.controller.js) | portal/features/careers/api.js |
| PATCH | `/api/careers/applications/:id/status` | auth · `website.write` | `updateApplicationStatus` (application.controller.js) | portal/features/careers/api.js |
| POST | `/api/careers/cv-upload` | cvUpload.single("cv") | `uploadCV` (application.controller.js) | api/careers.js |
| GET | `/api/careers/public` | public | `listPublicCareers` (career.controller.js) | api/careers.js |

## Client brand kit — 4 routes

Models: BrandAsset.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/brand-kit` | auth · `brand_kit.read` | `listBrandAssets` (brandAsset.controller.js) | portal/features/brand-kit/api.js |
| POST | `/api/brand-kit` | auth · `brand_kit.write` | `createBrandAsset` (brandAsset.controller.js) | portal/features/brand-kit/api.js |
| DELETE | `/api/brand-kit/:id` | auth · `brand_kit.write` | `deleteBrandAsset` (brandAsset.controller.js) | portal/features/brand-kit/api.js |
| PATCH | `/api/brand-kit/:id` | auth · `brand_kit.write` | `updateBrandAsset` (brandAsset.controller.js) | portal/features/brand-kit/api.js |

## Content — jobs, media, productions, social metrics — 28 routes

Models: Job, Media, Production, SocialMetrics.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/jobs` | auth · `jobs.read` | `listJobs` (job.controller.js) | portal/features/jobs/api.js<br>portal/features/productions/jobs.api.js |
| POST | `/api/jobs` | auth · `jobs.write` | `createJob` (job.controller.js) | portal/features/jobs/api.js<br>portal/features/productions/jobs.api.js |
| DELETE | `/api/jobs/:id` | auth · `jobs.delete` | `deleteJob` (job.controller.js) | portal/features/jobs/api.js<br>portal/features/productions/jobs.api.js |
| GET | `/api/jobs/:id` | auth · `jobs.read` | `getJob` (job.controller.js) | portal/features/jobs/api.js<br>portal/features/productions/jobs.api.js |
| PATCH | `/api/jobs/:id` | auth · `jobs.write` | `updateJob` (job.controller.js) | portal/features/jobs/api.js<br>portal/features/productions/jobs.api.js |
| POST | `/api/jobs/:id/approval` | auth · `jobs.write` | `addApproval` (job.controller.js) | portal/features/jobs/api.js |
| POST | `/api/jobs/:id/attach-media` | auth · `jobs.write` | `attachMedia` (job.controller.js) | portal/features/jobs/api.js<br>portal/features/productions/jobs.api.js |
| PATCH | `/api/jobs/:id/post-metrics` | auth · `jobs.write` | `updatePostMetrics` (job.controller.js) | portal/features/jobs/api.js |
| POST | `/api/jobs/:id/publish` | auth · `jobs.write` | `publishToWebsite` (job.controller.js) | portal/features/jobs/api.js<br>portal/features/productions/jobs.api.js |
| DELETE | `/api/jobs/bulk` | auth · `jobs.delete` | `bulkDeleteJobs` (job.controller.js) | portal/features/jobs/api.js |
| PATCH | `/api/jobs/bulk/assign` | auth · `jobs.write` | `bulkAssignJobs` (job.controller.js) | portal/features/jobs/api.js |
| POST | `/api/jobs/generate/from-enrollment/:enrollmentId` | auth · `jobs.write` | `generateJobsForEnrollment` (job.controller.js) | portal/features/enrollments/api.js<br>portal/features/jobs/api.js |
| GET | `/api/jobs/public/website` | public | `listPublicWebsiteJobs` (job.controller.js) | api/websiteProductions.js |
| GET | `/api/media` | auth · `media.read` | `listMedia` (media.controller.js) | portal/features/media-library/api.js |
| POST | `/api/media` | auth · `media.write` · upload.single("file") | `uploadMedia` (media.controller.js) | portal/features/media-library/api.js |
| DELETE | `/api/media/:id` | auth · `media.delete` | `deleteMedia` (media.controller.js) | portal/features/media-library/api.js |
| PATCH | `/api/media/:id` | auth · `media.write` | `updateMedia` (media.controller.js) | portal/features/media-library/api.js |
| GET | `/api/productions` | public, optional sign-in | `listProductions` (production.controller.js) | portal/features/media-library/api.js |
| POST | `/api/productions` | auth · `productions.write` | `createProduction` (production.controller.js) | portal/features/media-library/api.js |
| DELETE | `/api/productions/:id` | auth · `productions.delete` | `deleteProduction` (production.controller.js) | portal/features/media-library/api.js |
| PATCH | `/api/productions/:id` | auth · `productions.write` | `updateProduction` (production.controller.js) | portal/features/media-library/api.js |
| PATCH | `/api/productions/:id/status` | auth · `productions.write` | `inline` (production.routes.js) | — |
| GET | `/api/productions/:slug` | public, optional sign-in | `getProductionBySlug` (production.controller.js) | — |
| GET | `/api/social-metrics` | auth · `social.metrics.read` | `listMetrics` (socialMetrics.controller.js) | portal/features/social/api.js |
| POST | `/api/social-metrics` | auth · `social.metrics.write` | `upsertMetrics` (socialMetrics.controller.js) | portal/features/social/api.js |
| DELETE | `/api/social-metrics/:id` | auth · `social.metrics.write` | `deleteMetrics` (socialMetrics.controller.js) | portal/features/social/api.js |
| POST | `/api/jobs/:id/operating/:command` | auth · internal-only · `jobs.read` | `jobAction` (operating.controller.js) | portal/shared/operating/api.js |
| GET | `/api/jobs/:id/operating/options` | auth · internal-only · `jobs.write` | `operatingOptions` (operating.controller.js) | portal/shared/operating/api.js |


## Customers — 9 routes

Models: Customer.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/customers` | auth · `customers.read` | `listCustomers` (customers.controller.js) | portal/features/customers/api.js<br>portal/features/procurement/api.js<br>portal/features/reports/pages/ReportsPage.jsx |
| POST | `/api/customers` | auth · `customers.write` | `createCustomer` (customers.controller.js) | portal/features/customers/api.js |
| DELETE | `/api/customers/:id` | auth · `customers.delete` | `deleteCustomer` (customers.controller.js) | portal/features/customers/api.js |
| GET | `/api/customers/:id` | auth · `customers.read` | `getCustomerById` (customers.controller.js) | portal/features/customers/api.js |
| PATCH | `/api/customers/:id` | auth · `customers.write` | `updateCustomer` (customers.controller.js) | portal/features/customers/api.js |
| POST | `/api/customers/:id/create-login` | auth · `customers.write` | `createCustomerLogin` (customers.controller.js) | portal/features/customers/api.js |
| GET | `/api/customers/:id/users` | auth · `customers.read` | `listCustomerUsers` (customers.controller.js) | portal/features/customers/api.js |
| POST | `/api/customers/:id/users` | auth · `customers.write` | `createCustomerUser` (customers.controller.js) | portal/features/customers/api.js |
| GET | `/api/customers/:id/operating/options` | auth · internal-only · `customers.write` | `operatingOptions` (operating.controller.js) | portal/shared/operating/api.js |


## Enrollments — 9 routes

Models: Enrollment.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/enrollments` | auth · `enrollments.read` | `listEnrollmentsGlobal` (enrollment.controller.js) | — |
| POST | `/api/enrollments` | auth · `enrollments.write` | `createEnrollmentGlobal` (enrollment.controller.js) | — |
| DELETE | `/api/enrollments/:id` | auth · `enrollments.delete` | `deleteEnrollmentGlobal` (enrollment.controller.js) | portal/features/enrollments/api.js |
| GET | `/api/enrollments/:id` | auth · `enrollments.read` | `getEnrollmentGlobal` (enrollment.controller.js) | portal/features/enrollments/api.js |
| PATCH | `/api/enrollments/:id` | auth · `enrollments.write` | `updateEnrollmentGlobal` (enrollment.controller.js) | portal/features/enrollments/api.js |
| GET | `/api/enrollments/:id/operating` | auth · internal-only · `enrollments.read` · `jobs.read` | `enrollmentOverview` (operating.controller.js) | portal/shared/operating/api.js |
| POST | `/api/enrollments/:id/operating/:command` | auth · internal-only · `enrollments.write` | `enrollmentAction` (operating.controller.js) | portal/shared/operating/api.js |
| GET | `/api/enrollments/:id/operating/options` | auth · internal-only · `enrollments.write` | `operatingOptions` (operating.controller.js) | portal/shared/operating/api.js |
| POST | `/api/enrollments/:id/operating/periods/:periodId/:command` | auth · internal-only · `enrollments.write` · `jobs.write` | `periodAction` (operating.controller.js) | portal/shared/operating/api.js |


## Files — 7 routes

Models: File.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/files` | auth · `files.read` | `listFiles` (files.controller.js) | portal/features/files/api.js |
| POST | `/api/files` | auth · `files.write` · upload.array("files", 20) | `uploadFiles` (files.controller.js) | portal/features/files/api.js |
| DELETE | `/api/files/:id` | auth · `files.delete` | `deleteFile` (files.controller.js) | portal/features/files/api.js |
| GET | `/api/files/:id` | auth · `files.read` | `getFile` (files.controller.js) | portal/features/files/api.js |
| PATCH | `/api/files/:id` | auth · `files.write` | `updateFile` (files.controller.js) | portal/features/files/api.js |
| GET | `/api/files/:id/download-url` | auth · `files.read` | `getFileDownloadUrl` (files.controller.js) | portal/features/files/api.js |
| GET | `/api/files/download-urls` | auth · `files.read` | `getFileDownloadUrls` (files.controller.js) | portal/features/files/api.js |

## Finance — billing — 10 routes

Models: Invoice.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/billing/invoices` | auth · `billing.read` | `listInvoices` (billing.controller.js) | portal/features/billing/api.js |
| POST | `/api/billing/invoices` | auth · `billing.write` | `createInvoice` (billing.controller.js) | portal/features/billing/api.js |
| GET | `/api/billing/invoices/:id` | auth · `billing.read` | `getInvoice` (billing.controller.js) | portal/features/billing/api.js |
| PATCH | `/api/billing/invoices/:id` | auth · `billing.write` | `updateInvoice` (billing.controller.js) | portal/features/billing/api.js |
| POST | `/api/billing/invoices/:id/mark-paid` | auth · `billing.write` | `markInvoicePaid` (billing.controller.js) | portal/features/billing/api.js |
| POST | `/api/billing/invoices/:id/payments` | auth · `billing.write` | `recordPayment` (billing.controller.js) | portal/features/billing/api.js |
| DELETE | `/api/billing/invoices/:id/payments/:payId` | auth · `billing.write` | `deletePayment` (billing.controller.js) | portal/features/billing/api.js |
| POST | `/api/billing/invoices/:id/void` | auth · `billing.write` | `voidInvoice` (billing.controller.js) | portal/features/billing/api.js |
| POST | `/api/billing/invoices/mark-overdue` | auth · `billing.write` | `markOverdueInvoices` (billing.controller.js) | portal/features/billing/api.js |
| GET | `/api/billing/stats` | auth · `billing.read` | `inline handler (see source)` (billing.routes.js) | portal/features/billing/api.js<br>portal/features/reports/pages/ReportsPage.jsx |

## HR — 52 routes

Models: HRExpense, HRLeave, HRStaff, KPICheckin, KPIGoal, KPIIndicator, ScorecardTemplate.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/hr/expenses` | auth · `hr.expenses.read` | `listExpenses` (expense.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/expenses` | auth · `hr.expenses.write` | `createExpense` (expense.controller.js) | portal/features/hr/api.js |
| DELETE | `/api/hr/expenses/:id` | auth · `hr.expenses.delete` | `deleteExpense` (expense.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/expenses/:id` | auth · `hr.expenses.read` | `getExpense` (expense.controller.js) | portal/features/hr/api.js<br>portal/features/reports/pages/ReportsPage.jsx |
| PATCH | `/api/hr/expenses/:id` | auth · `hr.expenses.write` | `updateExpense` (expense.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/expenses/:id/approve` | auth · `hr.expenses.approve` | `approveExpense` (expense.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/expenses/:id/paid` | auth · `hr.expenses.approve` | `markExpensePaid` (expense.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/expenses/:id/register` | auth · `hr.expenses.approve` | `registerExpense` (expense.controller.js) | — |
| POST | `/api/hr/expenses/:id/reject` | auth · `hr.expenses.approve` | `rejectExpense` (expense.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/expenses/monthly` | auth · `hr.expenses.approve` | `getMonthlyExpenses` (expense.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/expenses/monthly/:month` | auth · `hr.expenses.approve` | `getMonthlyExpenseDetails` (expense.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/expenses/stats` | auth · `hr.expenses.read` | `getExpenseStats` (expense.controller.js) | portal/features/hr/api.js<br>portal/features/reports/pages/ReportsPage.jsx |
| GET | `/api/hr/kpi/checkins` | auth · `hr.kpi.read` | `listCheckins` (kpi.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/kpi/checkins` | auth · `hr.kpi.write` | `createCheckin` (kpi.controller.js) | portal/features/hr/api.js |
| DELETE | `/api/hr/kpi/checkins/:id` | auth · `hr.kpi.write` | `deleteCheckin` (kpi.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/kpi/dashboard` | auth · `hr.kpi.read` | `getDashboard` (kpi.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/kpi/goals` | auth · `hr.kpi.read` | `listGoals` (kpi.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/kpi/goals` | auth · `hr.kpi.write` | `createGoal` (kpi.controller.js) | portal/features/hr/api.js |
| DELETE | `/api/hr/kpi/goals/:id` | auth · `hr.kpi.write` | `deleteGoal` (kpi.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/kpi/goals/:id` | auth · `hr.kpi.read` | `getGoal` (kpi.controller.js) | portal/features/hr/api.js |
| PATCH | `/api/hr/kpi/goals/:id` | auth · `hr.kpi.write` | `updateGoal` (kpi.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/kpi/goals/:id/sync` | auth · `hr.kpi.write` | `syncGoal` (kpi.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/kpi/indicators` | auth · `hr.kpi.read` | `listIndicators` (kpi.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/kpi/indicators` | auth · `hr.kpi.write` | `createIndicator` (kpi.controller.js) | portal/features/hr/api.js |
| DELETE | `/api/hr/kpi/indicators/:id` | auth · `hr.kpi.write` | `deleteIndicator` (kpi.controller.js) | portal/features/hr/api.js |
| PATCH | `/api/hr/kpi/indicators/:id` | auth · `hr.kpi.write` | `updateIndicator` (kpi.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/leaves` | auth · `hr.leaves.read` | `listLeaves` (leave.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/leaves` | auth · `hr.leaves.write` | `createLeave` (leave.controller.js) | portal/features/hr/api.js |
| DELETE | `/api/hr/leaves/:id` | auth · `hr.leaves.delete` | `deleteLeave` (leave.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/leaves/:id` | auth · `hr.leaves.read` | `getLeave` (leave.controller.js) | portal/features/hr/api.js<br>portal/features/reports/pages/ReportsPage.jsx |
| PATCH | `/api/hr/leaves/:id` | auth · `hr.leaves.write` | `updateLeave` (leave.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/leaves/:id/approve` | auth · `hr.leaves.approve` | `approveLeave` (leave.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/leaves/:id/cancel` | auth · `hr.leaves.write` | `cancelLeave` (leave.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/leaves/:id/reject` | auth · `hr.leaves.approve` | `rejectLeave` (leave.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/leaves/stats` | auth · `hr.leaves.read` | `getLeaveStats` (leave.controller.js) | portal/features/hr/api.js<br>portal/features/reports/pages/ReportsPage.jsx |
| GET | `/api/hr/scorecard-templates` | auth · `hr.scorecards.read` | `listTemplates` (template.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/scorecard-templates` | auth · `hr.scorecards.write` | `createTemplate` (template.controller.js) | portal/features/hr/api.js |
| DELETE | `/api/hr/scorecard-templates/:id` | auth · `hr.scorecards.write` | `deleteTemplate` (template.controller.js) | portal/features/hr/api.js |
| PATCH | `/api/hr/scorecard-templates/:id` | auth · `hr.scorecards.write` | `updateTemplate` (template.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/staff` | auth · `hr.staff.read` | `listStaff` (staff.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/staff` | auth · `hr.staff.write` | `createStaff` (staff.controller.js) | portal/features/hr/api.js |
| DELETE | `/api/hr/staff/:id` | auth · `hr.staff.delete` | `deleteStaff` (staff.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/staff/:id` | auth · `hr.staff.read` | `getStaff` (staff.controller.js) | portal/features/hr/api.js<br>portal/features/reports/pages/ReportsPage.jsx |
| PATCH | `/api/hr/staff/:id` | auth · `hr.staff.write` | `updateStaff` (staff.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/staff/:id/benchmark` | auth · `hr.staff.read` | `getDepartmentBenchmark` (staff.controller.js) | portal/features/hr/api.js |
| POST | `/api/hr/staff/:id/learning-goals` | auth · `hr.staff.write` | `addLearningGoal` (staff.controller.js) | portal/features/hr/api.js |
| DELETE | `/api/hr/staff/:id/learning-goals/:goalId` | auth · `hr.staff.write` | `removeLearningGoal` (staff.controller.js) | — |
| PATCH | `/api/hr/staff/:id/learning-goals/:goalId` | auth · `hr.staff.write` | `updateLearningGoal` (staff.controller.js) | — |
| POST | `/api/hr/staff/:id/scorecards` | auth · `hr.scorecards.write` | `addScorecard` (staff.controller.js) | portal/features/hr/api.js |
| DELETE | `/api/hr/staff/:id/scorecards/:scId` | auth · `hr.scorecards.write` | `removeScorecard` (staff.controller.js) | portal/features/hr/api.js |
| PUT | `/api/hr/staff/:id/skills` | auth · `hr.scorecards.write` | `updateSkills` (staff.controller.js) | portal/features/hr/api.js |
| GET | `/api/hr/staff/stats` | auth · `hr.staff.read` | `getStaffStats` (staff.controller.js) | portal/features/hr/api.js<br>portal/features/reports/pages/ReportsPage.jsx |

## Homepage CMS — slides & site settings — 8 routes

Models: HeroSlide, SiteSettings.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/homepage/slides` | auth · `website.read` | `listSlides` (slide.controller.js) | portal/features/careers/api.js<br>portal/features/website/api.js |
| POST | `/api/homepage/slides` | auth · `website.write` | `createSlide` (slide.controller.js) | portal/features/careers/api.js<br>portal/features/website/api.js |
| DELETE | `/api/homepage/slides/:id` | auth · `website.write` | `deleteSlide` (slide.controller.js) | api/homepageSlides.js<br>portal/features/careers/api.js<br>portal/features/website/api.js |
| PATCH | `/api/homepage/slides/:id` | auth · `website.write` | `updateSlide` (slide.controller.js) | api/homepageSlides.js<br>portal/features/careers/api.js<br>portal/features/website/api.js |
| GET | `/api/homepage/slides/public` | public | `listPublicSlides` (slide.controller.js) | api/homepageSlides.js |
| GET | `/api/site-settings` | auth · `website.read` | `getSettings` (settings.controller.js) | portal/features/website/api.js |
| PATCH | `/api/site-settings` | auth · `website.write` | `updateSettings` (settings.controller.js) | portal/features/website/api.js |
| GET | `/api/site-settings/public` | public | `getPublicSettings` (settings.controller.js) | api/siteSettings.js |

## Identity & access (IAM) — 43 routes

Models: AccessRequest, Audit, Invite, Role, Team, User.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/access-requests` | auth · `iam.invites.send` | `listAccessRequests` (accessRequest.controller.js) | portal/features/iam/access-requests/api.js |
| POST | `/api/access-requests/:id/approve` | auth · `iam.invites.send` | `approveAccessRequest` (accessRequest.controller.js) | portal/features/iam/access-requests/api.js |
| POST | `/api/access-requests/:id/invite` | auth · `iam.invites.send` | `inviteFromAccessRequest` (accessRequest.controller.js) | portal/features/iam/access-requests/api.js |
| POST | `/api/access-requests/:id/reject` | auth · `iam.invites.send` | `rejectAccessRequest` (accessRequest.controller.js) | portal/features/iam/access-requests/api.js |
| GET | `/api/audit` | auth · `activity.read` | `inline handler (see source)` (audit.routes.js) | portal/features/activity/pages/ActivityPage.jsx |
| PATCH | `/api/auth/change-password` | auth | `changePassword` (auth.controller.js) | portal/features/settings/pages/SettingsPage.jsx |
| POST | `/api/auth/forgot-password` | public | `forgotPassword` (auth.controller.js) | portal/shared/api/auth.api.js |
| POST | `/api/auth/google` | public | `googleLogin` (auth.controller.js) | portal/shared/api/auth.api.js |
| POST | `/api/auth/login` | public | `login` (auth.controller.js) | portal/shared/api/auth.api.js |
| GET | `/api/auth/me` | auth | `me` (auth.controller.js) | portal/shared/api/auth.api.js |
| POST | `/api/auth/request-access` | public | `createAccessRequest` (accessRequest.controller.js) | portal/shared/api/auth.api.js |
| POST | `/api/auth/reset-password` | public | `resetPassword` (auth.controller.js) | portal/shared/api/auth.api.js |
| GET | `/api/invites` | auth · `iam.invites.send` | `listInvites` (invite.controller.js) | portal/features/iam/invites/api.js |
| POST | `/api/invites` | auth · `iam.invites.send` | `createInvite` (invite.controller.js) | portal/features/iam/invites/api.js |
| POST | `/api/invites/:id/cancel` | auth · `iam.invites.send` | `cancelInvite` (invite.controller.js) | portal/features/iam/invites/api.js |
| POST | `/api/invites/:id/resend` | auth · `iam.invites.send` | `resendInvite` (invite.controller.js) | portal/features/iam/invites/api.js |
| POST | `/api/invites/accept` | public | `acceptInvite` (invite.controller.js) | portal/features/iam/invites/api.js |
| GET | `/api/invites/verify` | public | `verifyInvite` (invite.controller.js) | portal/features/iam/invites/api.js |
| GET | `/api/permissions/catalog` | auth | `inline` (permissions.routes.js) | — |
| GET | `/api/roles` | auth · `iam.roles.read` | `listRoles` (role.controller.js) | portal/features/iam/roles/api.js |
| POST | `/api/roles` | auth · `iam.roles.write` | `createRole` (role.controller.js) | portal/features/iam/roles/api.js |
| DELETE | `/api/roles/:id` | auth · `iam.roles.write` | `deleteRole` (role.controller.js) | — |
| GET | `/api/roles/:id` | auth · `iam.roles.read` | `getRole` (role.controller.js) | portal/features/iam/roles/api.js |
| PATCH | `/api/roles/:id` | auth · `iam.roles.write` | `updateRole` (role.controller.js) | portal/features/iam/roles/api.js |
| GET | `/api/teams` | auth · `iam.teams.read` | `listTeams` (team.controller.js) | portal/features/iam/teams/api.js |
| POST | `/api/teams` | auth · `iam.teams.write` | `createTeam` (team.controller.js) | portal/features/iam/teams/api.js |
| GET | `/api/teams/:id` | auth · `iam.teams.read` | `getTeam` (team.controller.js) | portal/features/iam/teams/api.js |
| PATCH | `/api/teams/:id` | auth · `iam.teams.write` | `updateTeam` (team.controller.js) | portal/features/iam/teams/api.js |
| PATCH | `/api/teams/:id/status` | auth · `iam.teams.write` | `setTeamStatus` (team.controller.js) | portal/features/iam/teams/api.js |
| GET | `/api/users` | auth · `iam.users.read` | `listUsers` (user.controller.js) | portal/features/iam/users/api.js |
| POST | `/api/users` | auth · `iam.users.write` | `createUser` (user.controller.js) | portal/features/iam/users/api.js |
| DELETE | `/api/users/:id` | auth · `iam.users.delete` | `deleteUser` (user.controller.js) | portal/features/iam/users/api.js |
| GET | `/api/users/:id` | auth · `iam.users.read` | `getUser` (user.controller.js) | portal/features/iam/users/api.js<br>portal/features/settings/pages/SettingsPage.jsx |
| PATCH | `/api/users/:id` | auth · `iam.users.write` | `updateUser` (user.controller.js) | portal/features/iam/users/api.js<br>portal/features/profile/pages/ProfilePage.jsx<br>portal/features/settings/pages/SettingsPage.jsx |
| GET | `/api/users/:id/activity` | auth · `activity.read` | `inline handler (see source)` (audit.routes.js) | portal/features/hr/pages/StaffDetailsPage.jsx<br>portal/features/iam/users/api.js |
| GET | `/api/users/:id/effective-permissions` | auth · `iam.users.read` | `getEffectivePermissions` (user.controller.js) | portal/features/iam/users/api.js |
| POST | `/api/users/:id/force-logout` | auth · `iam.users.write` | `forceLogoutUser` (user.controller.js) | portal/features/iam/users/api.js |
| PATCH | `/api/users/:id/permissions` | auth · `iam.users.write` | `updateUserPermissions` (user.controller.js) | portal/features/iam/users/api.js |
| POST | `/api/users/:id/reset-password` | auth · `iam.users.write` | `adminResetPassword` (user.controller.js) | portal/features/iam/users/api.js |
| PATCH | `/api/users/:id/status` | auth · `iam.users.write` | `setUserStatus` (user.controller.js) | portal/features/iam/users/api.js |
| GET | `/api/users/me` | auth | `inline` (user.routes.js) | portal/features/settings/pages/SettingsPage.jsx |
| PATCH | `/api/users/me` | auth | `inline` (user.routes.js) | portal/features/profile/pages/ProfilePage.jsx<br>portal/features/settings/pages/SettingsPage.jsx |
| PATCH | `/api/users/me/notifications` | auth | `inline handler (see source)` (user.routes.js) | portal/features/settings/pages/SettingsPage.jsx |

## Messaging — 5 routes

Models: Message.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/messaging` | auth · `messaging.read` | `listMessages` (message.controller.js) | portal/features/messaging/api.js |
| POST | `/api/messaging` | auth · `messaging.write` | `sendMessage` (message.controller.js) | portal/features/messaging/api.js |
| GET | `/api/messaging/notifications/counts` | auth · `messaging.read` | `getNotificationCounts` (message.controller.js) | portal/features/messaging/api.js |
| PATCH | `/api/messaging/read/:customerId` | auth · `messaging.read` | `markRead` (message.controller.js) | portal/features/messaging/api.js |
| GET | `/api/messaging/unread/:customerId` | auth · `messaging.read` | `getUnreadCount` (message.controller.js) | portal/features/messaging/api.js |

## Portfolio CMS — 12 routes

Models: Portfolio (case studies, `/case-studies`), WorkItem (Portfolio work, `/portfolio`).

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/portfolio` | public, optional sign-in | `listPortfolio` (portfolio.controller.js) | hooks/usePortfolioItems.js<br>portal/features/portfolio/api.js |
| POST | `/api/portfolio` | auth · `portfolio.write` | `createPortfolio` (portfolio.controller.js) | hooks/usePortfolioItems.js<br>portal/features/portfolio/api.js |
| DELETE | `/api/portfolio/:id` | auth · `portfolio.delete` | `deletePortfolio` (portfolio.controller.js) | hooks/usePortfolioItem.js<br>portal/features/portfolio/api.js |
| PATCH | `/api/portfolio/:id` | auth · `portfolio.write` | `updatePortfolio` (portfolio.controller.js) | hooks/usePortfolioItem.js<br>portal/features/portfolio/api.js |
| GET | `/api/portfolio/:slug` | public, optional sign-in | `getPortfolioBySlug` (portfolio.controller.js) | hooks/usePortfolioItem.js<br>portal/features/portfolio/api.js |
| GET | `/api/work` | public, optional sign-in | `listWorkItems` (workItem.controller.js) | hooks/useWorkItems.js<br>portal/features/portfolio/workApi.js |
| POST | `/api/work` | auth · `work.write` | `createWorkItem` (workItem.controller.js) | hooks/useWorkItems.js<br>portal/features/portfolio/workApi.js |
| DELETE | `/api/work/:id` | auth · `work.delete` | `deleteWorkItem` (workItem.controller.js) | hooks/useWorkItems.js<br>portal/features/portfolio/workApi.js |
| PATCH | `/api/work/:id` | auth · `work.write` | `updateWorkItem` (workItem.controller.js) | hooks/useWorkItems.js<br>portal/features/portfolio/workApi.js |
| GET | `/api/work/:slug` | public, optional sign-in | `getWorkItem` (workItem.controller.js) | hooks/useWorkItems.js<br>portal/features/portfolio/workApi.js |
| POST | `/api/work/from-case-study/:caseStudyId` | auth · `work.write` | `createWorkItemFromCaseStudy` (workItem.controller.js) | portal/features/portfolio/workApi.js |
| PATCH | `/api/work/reorder` | auth · `work.write` | `reorderWorkItems` (workItem.controller.js) | portal/features/portfolio/workApi.js |

## Private file downloads — 1 route

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/private-files/:token` | public | `inline handler (see source)` (privateFiles.routes.js) | — |

## Procurement & vendors — 33 routes

Models: ProcurementCategory, ProcurementRequest, ProcurementVendor, Quotation, RFQ, VendorApplication.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/procurement/categories` | auth · internal-only · `procurement.read` | `listCategories` (category.controller.js) | portal/features/procurement/api.js |
| POST | `/api/procurement/categories` | auth · internal-only · `procurement.write` | `createCategory` (category.controller.js) | portal/features/procurement/api.js |
| DELETE | `/api/procurement/categories/:id` | auth · internal-only · `procurement.delete` | `deleteCategory` (category.controller.js) | portal/features/procurement/api.js |
| PATCH | `/api/procurement/categories/:id` | auth · internal-only · `procurement.write` | `updateCategory` (category.controller.js) | portal/features/procurement/api.js |
| GET | `/api/procurement/categories/public` | public | `listPublicCategories` (category.controller.js) | — |
| GET | `/api/procurement/categories/tree` | public | `getCategoryTree` (category.controller.js) | api/vendorApplications.js<br>portal/features/procurement/api.js |
| GET | `/api/procurement/requests` | auth · `procurement.read` | `listRequests` (request.controller.js) | portal/features/procurement/api.js |
| POST | `/api/procurement/requests` | auth · `procurement.write` | `createRequest` (request.controller.js) | portal/features/procurement/api.js |
| DELETE | `/api/procurement/requests/:id` | auth · `procurement.delete` | `deleteRequest` (request.controller.js) | portal/features/procurement/api.js |
| GET | `/api/procurement/requests/:id` | auth · `procurement.read` | `getRequest` (request.controller.js) | portal/features/procurement/api.js<br>portal/features/reports/pages/ReportsPage.jsx |
| PATCH | `/api/procurement/requests/:id` | auth · `procurement.write` | `updateRequest` (request.controller.js) | portal/features/procurement/api.js |
| POST | `/api/procurement/requests/:id/create-rfq` | auth · `procurement.write` | `createRfqFromRequest` (rfq.controller.js) | portal/features/procurement/api.js |
| GET | `/api/procurement/requests/stats` | auth · `procurement.read` | `getDashboardStats` (request.controller.js) | portal/features/procurement/api.js<br>portal/features/reports/pages/ReportsPage.jsx |
| GET | `/api/procurement/rfqs` | auth · `procurement.read` · staff or approved vendor | `listRfqs` (rfq.controller.js) | portal/features/procurement/api.js |
| POST | `/api/procurement/rfqs` | auth · internal-only · `procurement.write` | `createRfq` (rfq.controller.js) | portal/features/procurement/api.js |
| GET | `/api/procurement/rfqs/:id` | auth · `procurement.read` · staff or approved vendor | `getRfq` (rfq.controller.js) | portal/features/procurement/api.js |
| PATCH | `/api/procurement/rfqs/:id` | auth · internal-only · `procurement.write` | `updateRfq` (rfq.controller.js) | portal/features/procurement/api.js |
| PATCH | `/api/procurement/rfqs/:id/close` | auth · internal-only · `procurement.approve` | `closeRfq` (rfq.controller.js) | portal/features/procurement/api.js |
| GET | `/api/procurement/rfqs/:id/matched-vendors` | auth · internal-only · `procurement.read` | `getMatchedVendors` (rfq.controller.js) | portal/features/procurement/api.js |
| PATCH | `/api/procurement/rfqs/:id/publish` | auth · internal-only · `procurement.approve` | `publishRfq` (rfq.controller.js) | portal/features/procurement/api.js |
| GET | `/api/procurement/rfqs/:id/quotations` | auth · `procurement.read` · staff or approved vendor | `listQuotations` (rfq.controller.js) | portal/features/procurement/api.js |
| POST | `/api/procurement/rfqs/:id/quotations` | auth · approved vendor only | `submitQuotation` (rfq.controller.js) | portal/features/procurement/api.js |
| PATCH | `/api/procurement/rfqs/quotations/:quotationId/status` | auth · internal-only · `procurement.approve` | `updateQuotationStatus` (rfq.controller.js) | portal/features/procurement/api.js |
| GET | `/api/procurement/vendors` | auth · internal-only · `procurement.read` | `listVendors` (vendor.controller.js) | portal/features/procurement/api.js |
| POST | `/api/procurement/vendors` | auth · internal-only · `procurement.write` | `createVendor` (vendor.controller.js) | portal/features/procurement/api.js |
| DELETE | `/api/procurement/vendors/:id` | auth · internal-only · `procurement.delete` | `deleteVendor` (vendor.controller.js) | portal/features/procurement/api.js |
| GET | `/api/procurement/vendors/:id` | auth · internal-only · `procurement.read` | `getVendor` (vendor.controller.js) | — |
| PATCH | `/api/procurement/vendors/:id` | auth · internal-only · `procurement.write` | `updateVendor` (vendor.controller.js) | portal/features/procurement/api.js |
| GET | `/api/vendor-applications` | auth · internal-only · `procurement.approve` | `listVendorApplications` (vendor-application.controller.js) | portal/features/procurement/api.js |
| POST | `/api/vendor-applications` | public | `registerVendorApplication` (vendor-application.controller.js) | api/vendorApplications.js |
| GET | `/api/vendor-applications/:id` | auth · internal-only · `procurement.approve` | `getVendorApplication` (vendor-application.controller.js) | portal/features/procurement/api.js |
| PATCH | `/api/vendor-applications/:id/approve` | auth · internal-only · `procurement.approve` | `approveVendorApplication` (vendor-application.controller.js) | portal/features/procurement/api.js |
| PATCH | `/api/vendor-applications/:id/reject` | auth · internal-only · `procurement.approve` | `rejectVendorApplication` (vendor-application.controller.js) | portal/features/procurement/api.js |

## Projects — 9 routes

Models: Project.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/projects` | auth · `projects.read` | `listProjects` (project.controller.js) | — |
| POST | `/api/projects` | auth · `projects.write` | `createProject` (project.controller.js) | — |
| DELETE | `/api/projects/:id` | auth · `projects.delete` | `archiveProject` (project.controller.js) | portal/features/projects/api.js |
| GET | `/api/projects/:id` | auth · `projects.read` | `getProjectById` (project.controller.js) | portal/features/projects/api.js<br>portal/features/reports/pages/ReportsPage.jsx |
| PATCH | `/api/projects/:id` | auth · `projects.write` | `updateProject` (project.controller.js) | portal/features/projects/api.js |
| GET | `/api/projects/stats` | auth · `projects.read` | `inline handler (see source)` (project.routes.js) | portal/features/reports/pages/ReportsPage.jsx |
| GET | `/api/projects/:id/operating` | auth · internal-only · `projects.read` · `jobs.read` | `projectOverview` (operating.controller.js) | portal/shared/operating/api.js |
| POST | `/api/projects/:id/operating/:command` | auth · internal-only · `projects.write` | `projectAction` (operating.controller.js) | portal/shared/operating/api.js |
| GET | `/api/projects/:id/operating/options` | auth · internal-only · `projects.write` | `operatingOptions` (operating.controller.js) | portal/shared/operating/api.js |


## Public intake — 1 route

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| POST | `/api/public/plan-submissions` | public | `submitPlanBuilder` (public.controller.js) | components/PlanBuilder/PlanBuilder.jsx |

## Service catalog (internal) — 7 routes

Models: ServiceTemplate.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/service` | auth · `services.read` | `listServiceTemplates` (serviceTemplate.controller.js) | — |
| POST | `/api/service` | auth · `services.write` | `createServiceTemplate` (serviceTemplate.controller.js) | — |
| DELETE | `/api/service/:id` | auth · `services.delete` | `deleteServiceTemplate` (serviceTemplate.controller.js) | portal/features/services/api.js |
| GET | `/api/service/:id` | auth · `services.read` | `getServiceTemplate` (serviceTemplate.controller.js) | portal/features/services/api.js |
| PATCH | `/api/service/:id` | auth · `services.write` | `updateServiceTemplate` (serviceTemplate.controller.js) | portal/features/services/api.js |
| POST | `/api/service/:id/files` | auth · `services.write` · upload.array("files", 20) | `uploadServiceTemplateFiles` (serviceTemplate.controller.js) | portal/features/services/api.js |
| GET | `/api/service/:id/files/:fileId/url` | auth · `services.read` | `getServiceTemplateFileUrl` (serviceTemplate.controller.js) | portal/features/services/api.js |

## Support tickets — 9 routes

Models: Ticket.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/tickets` | auth · `tickets.read` | `listTickets` (ticket.controller.js) | portal/features/tickets/api.js |
| POST | `/api/tickets` | auth · `tickets.write` | `createTicket` (ticket.controller.js) | portal/features/tickets/api.js |
| DELETE | `/api/tickets/:id` | auth · `tickets.delete` | `deleteTicket` (ticket.controller.js) | portal/features/tickets/api.js |
| GET | `/api/tickets/:id` | auth · `tickets.read` | `getTicket` (ticket.controller.js) | portal/features/reports/pages/ReportsPage.jsx<br>portal/features/tickets/api.js |
| PATCH | `/api/tickets/:id` | auth · `tickets.write` | `updateTicket` (ticket.controller.js) | portal/features/tickets/api.js |
| PATCH | `/api/tickets/:id/approve` | auth · `tickets.write` | `approveTicket` (ticket.controller.js) | portal/features/tickets/api.js |
| POST | `/api/tickets/:id/comments` | auth · `tickets.write` | `addComment` (ticket.controller.js) | portal/features/tickets/api.js |
| PATCH | `/api/tickets/:id/status` | auth · `tickets.write` | `updateStatus` (ticket.controller.js) | portal/features/tickets/api.js |
| GET | `/api/tickets/stats` | auth · `tickets.read` | `getTicketStats` (ticket.controller.js) | portal/features/reports/pages/ReportsPage.jsx<br>portal/features/tickets/api.js |

## System — 1 route

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/health` | public | `inline` (app.js) | — |

## Website CMS — services & solutions — 12 routes

Models: DigitalService, Solution.

| Method | Path | Guard | Handler | Frontend consumer |
|---|---|---|---|---|
| GET | `/api/web-content/services` | public, optional sign-in | `listServices` (webContent.controller.js) | pages/ServiceMain/serviceMain.jsx<br>portal/features/website/api.js |
| POST | `/api/web-content/services` | auth · `website.write` | `createService` (webContent.controller.js) | pages/ServiceMain/serviceMain.jsx<br>portal/features/website/api.js |
| DELETE | `/api/web-content/services/:id` | auth · `website.write` | `deleteService` (webContent.controller.js) | pages/Services/ServiceDetailPage.jsx<br>portal/features/website/api.js |
| PATCH | `/api/web-content/services/:id` | auth · `website.write` | `updateService` (webContent.controller.js) | pages/Services/ServiceDetailPage.jsx<br>portal/features/website/api.js |
| GET | `/api/web-content/services/:slug` | public, optional sign-in | `getServiceBySlug` (webContent.controller.js) | pages/Services/ServiceDetailPage.jsx |
| PATCH | `/api/web-content/services/reorder` | auth · `website.write` | `reorderServices` (webContent.controller.js) | portal/features/website/api.js |
| GET | `/api/web-content/solutions` | public, optional sign-in | `listSolutions` (webContent.controller.js) | pages/DigitalSolutions/DigitalSolutionsPage.jsx<br>pages/ITSolutions/ITSolutionsPage.jsx<br>portal/features/website/api.js |
| POST | `/api/web-content/solutions` | auth · `website.write` | `createSolution` (webContent.controller.js) | pages/DigitalSolutions/DigitalSolutionsPage.jsx<br>pages/ITSolutions/ITSolutionsPage.jsx<br>portal/features/website/api.js |
| DELETE | `/api/web-content/solutions/:id` | auth · `website.write` | `deleteSolution` (webContent.controller.js) | pages/ITSolutions/ITSolutionDetailsPage.jsx<br>portal/features/website/api.js |
| PATCH | `/api/web-content/solutions/:id` | auth · `website.write` | `updateSolution` (webContent.controller.js) | pages/ITSolutions/ITSolutionDetailsPage.jsx<br>portal/features/website/api.js |
| GET | `/api/web-content/solutions/:slug` | public, optional sign-in | `getSolutionBySlug` (webContent.controller.js) | pages/ITSolutions/ITSolutionDetailsPage.jsx |
| PATCH | `/api/web-content/solutions/reorder` | auth · `website.write` | `reorderSolutions` (webContent.controller.js) | portal/features/website/api.js |
