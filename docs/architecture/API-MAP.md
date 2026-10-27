# API map

[Blueprint](EXPRESSO-SYSTEM-BLUEPRINT.html) · [Executive summary](README.md) · Baseline `58b8f86c`.

## Counting and interpretation

**283 explicit method/path registrations** (282 at the audit baseline; R2 added `GET /api/users/:id/effective-permissions`), in **44 mounted Express routers plus `/api/health`**, grouped below by business domain. The 21 backend domain folders are counted separately from the direct health route. Implicit Express HEAD/OPTIONS handling, static `/uploads`, CORS, rate-limit middleware and the catch-all 404 are not counted as business endpoints. There are **no duplicate exact method/path registrations** in this inventory, and no same-file static-path shadowing by an earlier matching parameter route was found.

Every one of the 283 routes is listed, grouped by domain with its guard and handler, in [API-ENDPOINTS.md](API-ENDPOINTS.md). Source lines are in [source-inventory.json](source-inventory.json). This is the drill-down, not the manager's reading path. Route guards are not the entire authorization policy: controllers also enforce internal status, ownership, role hierarchy, state and field restrictions. `vendor` in RFQ routes is an alias for `requireRole("vendor")`.

## Admin — 1 routes

**Frontend consumer:** No frontend consumer found; operator/system-status diagnostic.

**Mounted groups:** `/api/admin`.

**Enforcement:** requireAuth; requireRole("super_admin"). 0 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** Inline handlers in route file.

**Principal model definitions in this domain:** No dedicated domain collection. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/admin/systemStatus.routes.js](../../portal-api/src/modules/admin/systemStatus.routes.js).

## Billing — 10 routes

**Frontend consumer:** Billing pages, project billing tab, dashboards/reports.

**Mounted groups:** `/api/billing`.

**Enforcement:** requireAuth; requirePermission("billing.read"); requirePermission("billing.write"). 0 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/billing/billing.controller.js](../../portal-api/src/modules/billing/billing.controller.js).

**Principal model definitions in this domain:** Invoice. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/billing/billing.routes.js](../../portal-api/src/modules/billing/billing.routes.js).

## Brand Kit — 4 routes

**Frontend consumer:** BrandKitPage and client workspace.

**Mounted groups:** `/api/brand-kit`.

**Enforcement:** requireAuth; requirePermission("brand_kit.read"); requirePermission("brand_kit.write"). 0 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/brand-kit/brandAsset.controller.js](../../portal-api/src/modules/brand-kit/brandAsset.controller.js).

**Principal model definitions in this domain:** BrandAsset. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/brand-kit/brandAsset.routes.js](../../portal-api/src/modules/brand-kit/brandAsset.routes.js).

## Careers — 11 routes

**Frontend consumer:** Public Careers page and CareersAdminPage.

**Mounted groups:** `/api/careers`.

**Enforcement:** requireAuth; requirePermission("website.read"); requirePermission("website.write"). 3 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/careers/application.controller.js](../../portal-api/src/modules/careers/application.controller.js); [portal-api/src/modules/careers/career.controller.js](../../portal-api/src/modules/careers/career.controller.js).

**Principal model definitions in this domain:** JobApplication, Career. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/careers/career.routes.js](../../portal-api/src/modules/careers/career.routes.js).

## Content — 26 routes

**Frontend consumer:** Jobs, current Productions, media library, content calendar/social metrics and public Home reels.

**Mounted groups:** `/api/jobs`, `/api/media`, `/api/productions`, `/api/social-metrics`.

**Enforcement:** requireAuth; requirePermission("jobs.delete"); requirePermission("jobs.read"); requirePermission("jobs.write"); requirePermission("media.delete"); requirePermission("media.read"); requirePermission("media.write"); requirePermission("productions.delete"); requirePermission("productions.write"); requirePermission("social.metrics.read"); requirePermission("social.metrics.write"). 3 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/content/jobs/job.controller.js](../../portal-api/src/modules/content/jobs/job.controller.js); [portal-api/src/modules/content/media/media.controller.js](../../portal-api/src/modules/content/media/media.controller.js); [portal-api/src/modules/content/productions/production.controller.js](../../portal-api/src/modules/content/productions/production.controller.js); [portal-api/src/modules/content/social-metrics/socialMetrics.controller.js](../../portal-api/src/modules/content/social-metrics/socialMetrics.controller.js).

**Principal model definitions in this domain:** Job, Media, Production, SocialMetrics. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/content/jobs/job.routes.js](../../portal-api/src/modules/content/jobs/job.routes.js), [portal-api/src/modules/content/media/media.routes.js](../../portal-api/src/modules/content/media/media.routes.js), [portal-api/src/modules/content/productions/production.routes.js](../../portal-api/src/modules/content/productions/production.routes.js), [portal-api/src/modules/content/social-metrics/socialMetrics.routes.js](../../portal-api/src/modules/content/social-metrics/socialMetrics.routes.js).

## Crm — 28 routes

**Frontend consumer:** CRM pages; plan builder indirectly through public controller.

**Mounted groups:** `/api/crm/accounts`, `/api/crm/activities`, `/api/crm/contacts`, `/api/crm/deals`, `/api/crm/leads`.

**Enforcement:** requireAuth; requirePermission("crm.delete"); requirePermission("crm.read"); requirePermission("crm.write"). 0 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/crm/accounts/account.controller.js](../../portal-api/src/modules/crm/accounts/account.controller.js); [portal-api/src/modules/crm/activities/activity.controller.js](../../portal-api/src/modules/crm/activities/activity.controller.js); [portal-api/src/modules/crm/contacts/contact.controller.js](../../portal-api/src/modules/crm/contacts/contact.controller.js); [portal-api/src/modules/crm/deals/deal.controller.js](../../portal-api/src/modules/crm/deals/deal.controller.js); [portal-api/src/modules/crm/leads/lead.controller.js](../../portal-api/src/modules/crm/leads/lead.controller.js).

**Principal model definitions in this domain:** CRMAccount, CRMActivity, CRMContact, CRMDeal, CRMLead. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/crm/accounts/account.routes.js](../../portal-api/src/modules/crm/accounts/account.routes.js), [portal-api/src/modules/crm/activities/activity.routes.js](../../portal-api/src/modules/crm/activities/activity.routes.js), [portal-api/src/modules/crm/contacts/contact.routes.js](../../portal-api/src/modules/crm/contacts/contact.routes.js), [portal-api/src/modules/crm/deals/deal.routes.js](../../portal-api/src/modules/crm/deals/deal.routes.js), [portal-api/src/modules/crm/leads/lead.routes.js](../../portal-api/src/modules/crm/leads/lead.routes.js).

## Customers — 8 routes

**Frontend consumer:** Client pages, selectors, dashboards, login creation.

**Mounted groups:** `/api/customers`.

**Enforcement:** requireAuth; requirePermission("customers.delete"); requirePermission("customers.read"); requirePermission("customers.write"). 0 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/customers/customers.controller.js](../../portal-api/src/modules/customers/customers.controller.js).

**Principal model definitions in this domain:** Customer. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/customers/customers.routes.js](../../portal-api/src/modules/customers/customers.routes.js).

## Enrollments — 5 routes

**Frontend consumer:** Enrollment pages, customer/project tabs and job generation.

**Mounted groups:** `/api/enrollments`.

**Enforcement:** requireAuth; requirePermission("enrollments.delete"); requirePermission("enrollments.read"); requirePermission("enrollments.write"). 0 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/enrollments/enrollment.controller.js](../../portal-api/src/modules/enrollments/enrollment.controller.js).

**Principal model definitions in this domain:** Enrollment. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/enrollments/enrollment.routes.js](../../portal-api/src/modules/enrollments/enrollment.routes.js).

## Files — 7 routes

**Frontend consumer:** FilesPage and project/customer attachments.

**Mounted groups:** `/api/files`.

**Enforcement:** requireAuth; requirePermission("files.delete"); requirePermission("files.read"); requirePermission("files.write"). 0 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/files/files.controller.js](../../portal-api/src/modules/files/files.controller.js).

**Principal model definitions in this domain:** File. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/files/files.routes.js](../../portal-api/src/modules/files/files.routes.js).

## Homepage — 8 routes

**Frontend consumer:** Home banner; shared settings hook; portal Website CMS.

**Mounted groups:** `/api/homepage/slides`, `/api/site-settings`.

**Enforcement:** requireAuth; requirePermission("website.read"); requirePermission("website.write"). 2 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/homepage/settings.controller.js](../../portal-api/src/modules/homepage/settings.controller.js); [portal-api/src/modules/homepage/slide.controller.js](../../portal-api/src/modules/homepage/slide.controller.js).

**Principal model definitions in this domain:** SiteSettings, HeroSlide. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/homepage/settings.routes.js](../../portal-api/src/modules/homepage/settings.routes.js), [portal-api/src/modules/homepage/slide.routes.js](../../portal-api/src/modules/homepage/slide.routes.js).

## Hr — 52 routes

**Frontend consumer:** HR staff, skills, leave, expense, monthly expense and KPI views; dashboard/reports.

**Mounted groups:** `/api/hr/expenses`, `/api/hr/kpi`, `/api/hr/leaves`, `/api/hr/scorecard-templates`, `/api/hr/staff`.

**Enforcement:** requireAuth; requirePermission("hr.expenses.approve"); requirePermission("hr.expenses.delete"); requirePermission("hr.expenses.read"); requirePermission("hr.expenses.write"); requirePermission("hr.kpi.read"); requirePermission("hr.kpi.write"); requirePermission("hr.leaves.approve"); requirePermission("hr.leaves.delete"); requirePermission("hr.leaves.read"); requirePermission("hr.leaves.write"); requirePermission("hr.scorecards.read"); requirePermission("hr.scorecards.write"); requirePermission("hr.staff.delete"); requirePermission("hr.staff.read"); requirePermission("hr.staff.write"). 0 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/hr/expenses/expense.controller.js](../../portal-api/src/modules/hr/expenses/expense.controller.js); [portal-api/src/modules/hr/kpi/kpi.controller.js](../../portal-api/src/modules/hr/kpi/kpi.controller.js); [portal-api/src/modules/hr/leaves/leave.controller.js](../../portal-api/src/modules/hr/leaves/leave.controller.js); [portal-api/src/modules/hr/scorecard-templates/template.controller.js](../../portal-api/src/modules/hr/scorecard-templates/template.controller.js); [portal-api/src/modules/hr/staff/staff.controller.js](../../portal-api/src/modules/hr/staff/staff.controller.js).

**Principal model definitions in this domain:** HRExpense, KPICheckin, KPIGoal, KPIIndicator, HRLeave, ScorecardTemplate, HRStaff. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/hr/expenses/expense.routes.js](../../portal-api/src/modules/hr/expenses/expense.routes.js), [portal-api/src/modules/hr/kpi/kpi.routes.js](../../portal-api/src/modules/hr/kpi/kpi.routes.js), [portal-api/src/modules/hr/leaves/leave.routes.js](../../portal-api/src/modules/hr/leaves/leave.routes.js), [portal-api/src/modules/hr/scorecard-templates/template.routes.js](../../portal-api/src/modules/hr/scorecard-templates/template.routes.js), [portal-api/src/modules/hr/staff/staff.routes.js](../../portal-api/src/modules/hr/staff/staff.routes.js).

## Iam — 42 routes

**Frontend consumer:** Portal login/self-service, IAM users/roles/teams/invites/access-request pages; activity view.

**Mounted groups:** `/api`, `/api/access-requests`, `/api/auth`, `/api/invites`, `/api/permissions`, `/api/roles`, `/api/teams`, `/api/users`.

**Enforcement:** requireAuth; requirePermission("activity.read"); requirePermission("iam.invites.send"); requirePermission("iam.roles.read"); requirePermission("iam.roles.write"); requirePermission("iam.teams.read"); requirePermission("iam.teams.write"); requirePermission("iam.users.delete"); requirePermission("iam.users.read"); requirePermission("iam.users.write"). 7 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/iam/access-requests/accessRequest.controller.js](../../portal-api/src/modules/iam/access-requests/accessRequest.controller.js); [portal-api/src/modules/iam/auth/auth.controller.js](../../portal-api/src/modules/iam/auth/auth.controller.js); [portal-api/src/modules/iam/invites/invite.controller.js](../../portal-api/src/modules/iam/invites/invite.controller.js); [portal-api/src/modules/iam/roles/role.controller.js](../../portal-api/src/modules/iam/roles/role.controller.js); [portal-api/src/modules/iam/teams/team.controller.js](../../portal-api/src/modules/iam/teams/team.controller.js); [portal-api/src/modules/iam/users/user.controller.js](../../portal-api/src/modules/iam/users/user.controller.js).

**Principal model definitions in this domain:** AccessRequest, Audit, Invite, Role, Team, User. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/iam/access-requests/accessRequest.routes.js](../../portal-api/src/modules/iam/access-requests/accessRequest.routes.js), [portal-api/src/modules/iam/audit/audit.routes.js](../../portal-api/src/modules/iam/audit/audit.routes.js), [portal-api/src/modules/iam/auth/auth.routes.js](../../portal-api/src/modules/iam/auth/auth.routes.js), [portal-api/src/modules/iam/invites/invite.routes.js](../../portal-api/src/modules/iam/invites/invite.routes.js), [portal-api/src/modules/iam/permissions/permissions.routes.js](../../portal-api/src/modules/iam/permissions/permissions.routes.js), [portal-api/src/modules/iam/roles/role.routes.js](../../portal-api/src/modules/iam/roles/role.routes.js), [portal-api/src/modules/iam/teams/team.routes.js](../../portal-api/src/modules/iam/teams/team.routes.js), [portal-api/src/modules/iam/users/user.routes.js](../../portal-api/src/modules/iam/users/user.routes.js).

## Messaging — 5 routes

**Frontend consumer:** MessagesPage and Topbar unread polling.

**Mounted groups:** `/api/messaging`.

**Enforcement:** requireAuth; requirePermission("messaging.read"); requirePermission("messaging.write"). 0 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/messaging/message.controller.js](../../portal-api/src/modules/messaging/message.controller.js).

**Principal model definitions in this domain:** Message. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/messaging/message.routes.js](../../portal-api/src/modules/messaging/message.routes.js).

## Portfolio — 5 routes

**Frontend consumer:** Public gallery/case-study pages and portal Portfolio CMS.

**Mounted groups:** `/api/portfolio`.

**Enforcement:** requireAuth; requirePermission("portfolio.delete"); requirePermission("portfolio.write"). 2 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/portfolio/portfolio.controller.js](../../portal-api/src/modules/portfolio/portfolio.controller.js).

**Principal model definitions in this domain:** Portfolio. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/portfolio/portfolio.routes.js](../../portal-api/src/modules/portfolio/portfolio.routes.js).

## Private Files — 1 routes

**Frontend consumer:** Authorized signed-link consumers; token-gated local development download.

**Mounted groups:** `/api/private-files`.

**Enforcement:** Public entry points / inline handler validation. 1 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** Inline handlers in route file.

**Principal model definitions in this domain:** No dedicated domain collection. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/private-files/privateFiles.routes.js](../../portal-api/src/modules/private-files/privateFiles.routes.js).

## Procurement — 33 routes

**Frontend consumer:** Procurement portal, VendorDashboard, public vendor registration and categories.

**Mounted groups:** `/api/procurement/categories`, `/api/procurement/requests`, `/api/procurement/rfqs`, `/api/procurement/vendors`, `/api/vendor-applications`.

**Enforcement:** requireAuth; requireInternalUser; requirePermission("procurement.approve"); requirePermission("procurement.delete"); requirePermission("procurement.read"); requirePermission("procurement.write"); vendor. 3 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/procurement/category.controller.js](../../portal-api/src/modules/procurement/category.controller.js); [portal-api/src/modules/procurement/request.controller.js](../../portal-api/src/modules/procurement/request.controller.js); [portal-api/src/modules/procurement/rfq.controller.js](../../portal-api/src/modules/procurement/rfq.controller.js); [portal-api/src/modules/procurement/vendor-application.controller.js](../../portal-api/src/modules/procurement/vendor-application.controller.js); [portal-api/src/modules/procurement/vendor.controller.js](../../portal-api/src/modules/procurement/vendor.controller.js).

**Principal model definitions in this domain:** ProcurementCategory, Quotation, ProcurementRequest, RFQ, VendorApplication, ProcurementVendor. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/procurement/category.routes.js](../../portal-api/src/modules/procurement/category.routes.js), [portal-api/src/modules/procurement/request.routes.js](../../portal-api/src/modules/procurement/request.routes.js), [portal-api/src/modules/procurement/rfq.routes.js](../../portal-api/src/modules/procurement/rfq.routes.js), [portal-api/src/modules/procurement/vendor-application.routes.js](../../portal-api/src/modules/procurement/vendor-application.routes.js), [portal-api/src/modules/procurement/vendor.routes.js](../../portal-api/src/modules/procurement/vendor.routes.js).

## Projects — 6 routes

**Frontend consumer:** Projects, service delivery, client dashboard/tabs and reports.

**Mounted groups:** `/api/projects`.

**Enforcement:** requireAuth; requirePermission("projects.delete"); requirePermission("projects.read"); requirePermission("projects.write"). 0 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/projects/project.controller.js](../../portal-api/src/modules/projects/project.controller.js).

**Principal model definitions in this domain:** Project. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/projects/project.routes.js](../../portal-api/src/modules/projects/project.routes.js).

## Public — 1 routes

**Frontend consumer:** Public Build Your Plan submission.

**Mounted groups:** `/api/public`.

**Enforcement:** Public entry points / inline handler validation. 1 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/public/public.controller.js](../../portal-api/src/modules/public/public.controller.js).

**Principal model definitions in this domain:** CRMLead, CRMContact (via lead.service.js). Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/public/public.routes.js](../../portal-api/src/modules/public/public.routes.js).

## Services — 7 routes

**Frontend consumer:** Internal service catalog/builder and enrollment selectors.

**Mounted groups:** `/api/service`.

**Enforcement:** requireAuth; requirePermission("services.delete"); requirePermission("services.read"); requirePermission("services.write"). 0 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/services/serviceTemplate.controller.js](../../portal-api/src/modules/services/serviceTemplate.controller.js).

**Principal model definitions in this domain:** ServiceTemplate. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/services/serviceTemplate.routes.js](../../portal-api/src/modules/services/serviceTemplate.routes.js).

## System — 1 routes

**Frontend consumer:** Health check/operator.

**Mounted groups:** `/api/health`.

**Enforcement:** Public entry points / inline handler validation. 1 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** Inline handlers in route file.

**Principal model definitions in this domain:** No dedicated domain collection. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/app.js](../../portal-api/src/app.js).

## Tickets — 9 routes

**Frontend consumer:** Tickets, dashboard, client workspace, project support.

**Mounted groups:** `/api/tickets`.

**Enforcement:** requireAuth; requirePermission("tickets.delete"); requirePermission("tickets.read"); requirePermission("tickets.write"). 0 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/tickets/ticket.controller.js](../../portal-api/src/modules/tickets/ticket.controller.js).

**Principal model definitions in this domain:** Ticket. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/tickets/ticket.routes.js](../../portal-api/src/modules/tickets/ticket.routes.js).

## Web Content — 12 routes

**Frontend consumer:** Public services/Digital/Technology pages/navigation; portal Website CMS.

**Mounted groups:** `/api/web-content`.

**Enforcement:** requireAuth; requirePermission("website.write"). 4 routes have no session-auth middleware; token/field rules may still apply.

**Controllers:** [portal-api/src/modules/web-content/webContent.controller.js](../../portal-api/src/modules/web-content/webContent.controller.js).

**Principal model definitions in this domain:** DigitalService, Solution. Shared User/Role resolution and related model refs are detailed in the other maps.

**Route evidence:** [portal-api/src/modules/web-content/webContent.routes.js](../../portal-api/src/modules/web-content/webContent.routes.js).

## Confirmed boundaries and contract problems

| Finding | Evidence | Interpretation / future action |
|---|---|---|
| Vendor controller/UI read branches cannot be reached by a vendor through the RFQ read routes | `procurement/rfq.routes.js` requires internal users on list/detail/quotation reads; `rfq.controller.js` has vendor filtering; `ProtectedRoute.jsx` denies RFQ pages to externals | FIX the intended authorization contract in a later task; do not loosen it during this audit. |
| Current Productions UI uses `/jobs`, not `/productions` | `productions/jobs.api.js`; public old Production endpoints remain mounted | CONSOLIDATE only after checking historic records and remaining wrapper exports; not proof the model can be dropped. |
| No `/reports` backend group | ReportsPage calls domain stats directly | `reports.read` gates the view but does not authorize its data; `reports.export` has no backend or reachable UI implementation found. |
| API permission catalog is not consumed by current permission editors | `/permissions/catalog` exists; RoleEditor and AccessTab import static frontend definitions | Apparently unused endpoint, but KEEP as a consolidation target. |
| Shared public/admin reads expose more than the public UI requests | Portfolio/Production public list/detail accepts draft state; web-content public includeInactive/detail lookups. Slides, careers, reels and categories already filter | Confirmed exposure; fix planned as remediation P0-1. Client filters are not an access boundary. |
| Settings GET side effect (fixed in R4-B, P2-6) | `settings.controller.js:readSettings` returns the stored `_id: site` document, or the model defaults in memory without saving; `updateSettings` upserts it on the first admin save | Reads no longer write, so a public GET is a safe read-only probe |
| User deletion can fail after the destructive write | Dynamic import `../../customers/customers.model.js` does not exist; actual file is `customer.model.js` | Runtime implementation bug, not a missing route. No delete was exercised. |

## Unused / inconsistent endpoint candidates

- **Orphaned frontend calls:** `iam/users/api.js` exports `getUserNotes` / `saveUserNotes` for `GET/PATCH /api/users/:id/notes`. **No such route exists** and nothing calls the wrappers (cleanup F5). Every other literal frontend request matched a mounted route.
- **Endpoints with no frontend consumer** (literal-call matching; dynamic calls may be missed): `GET /api/procurement/categories/public` (registration uses `/tree`), `GET /api/crm/activities/:id`, `GET /api/procurement/vendors/:id`, `DELETE /api/roles/:id`, `GET /api/productions/:slug`, `PATCH /api/productions/:id/status`, plus the operator endpoints below.
- `/api/admin/system-status`: mounted super-admin diagnostic with no frontend call found. KEEP as an operator endpoint; no credentials are returned by its implementation.
- `/api/permissions/catalog`: no frontend call found; consolidate UI catalogs against it rather than delete it.
- `/api/productions/*`: older active API; current production workspace moved to Job, but media-library API exports and model links remain. NEEDS REVIEW.
- API `productions.read` and `portfolio.read` are not enforced on the corresponding public reads; write gates are present. This does not mean public showcase GETs should blindly become private; separate public published-only and authorized management needs.
- `billing.delete` and `reports.export` have no literal API enforcement/implementation found. Catalog presence is not a shipped feature.
- Singular `/api/service` is the internal ServiceTemplate catalog; plural `/api/web-content/services` is public marketing. The naming is inconsistent but both are real, different systems.
- No missing backend route was confirmed among reachable literal Axios method/path requests checked against the mounted inventory. Template URLs, interpolated IDs and conditional requests still need role-aware runtime contract tests before cleanup. The inventory includes 303 raw fetch/Axios call sites, not 303 distinct endpoints.
- Unreachable API wrappers (`activity`, `dashboard`, `reports`, `profile`, `settings` and older public production helpers) are code cleanup candidates; endpoint deletion cannot be inferred from an unused wrapper alone.

[User flows](USER-FLOWS.md) explain multi-endpoint workflows; [RBAC map](RBAC-MAP.md) documents controller and tenant enforcement.
