# Portal module map

[Blueprint](EXPRESSO-SYSTEM-BLUEPRINT.html) · [Executive summary](README.md) · Baseline `58b8f86c`.

## Scope and meaning of “module”

There are **26 portal feature-area folders**, backed by **21 API domain folders**, 44 mounted routers and 45 registered Mongoose models. These are code counts, not live database record counts. Authentication pages/layouts sit outside the feature folders and are included under IAM. Dashboard, delivery and reporting are views over other modules, not additional databases.

“Active” means a mounted route and source-backed implementation exist. It does **not** certify production acceptance, live credentials, every workflow transition, or every role's experience. This audit did not sign in, create records or run business transactions. Incomplete and conflicting paths are called out rather than invented.

All paths below are relative to the React portal, not separate applications. API → handler → model evidence is indexed in [API map](API-MAP.md) and [source inventory](source-inventory.json). Files/notifications descriptions distinguish actual storage/email from UI toasts.

## Identity & access

**Purpose:** Accounts, roles, teams, invitations, access requests, login/reset/Google sign-in.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/users; /portal/users/:id; /portal/users/invites; /portal/users/access-requests; /portal/roles; /portal/teams; /portal/login; /portal/forgot-password; /portal/reset-password; /portal/request-access; /portal/accept-invite |
| API groups | /api/auth; /api/users; /api/roles; /api/teams; /api/invites; /api/access-requests; /api/permissions/catalog |
| Models | User; Role; Team; Invite; AccessRequest; Audit |
| Authorization | iam.* plus controller role hierarchy; self-service uses requireAuth |
| States / workflow | Invite pending → accepted/cancelled/expired; access request pending → approved/rejected/invited; user active flag. |
| Other modules | User.role is a Role key; clientId links Customer; User.team is a key/string; HRStaff.teamId is an ObjectId. |
| Files / notifications | Avatars reference public Media. SMTP sends invite/reset emails; IAM actions log Audit. |
| Assessment | Active; permission editor/catalog drift and hard-coded admin hierarchy need review. |

Source: [client/src/portal/features/iam](../../client/src/portal/features/iam).

## Clients / customers

**Purpose:** Operational companies and their linked portal logins, distinct from prospect CRM accounts.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/customers; /portal/customers/:id |
| API groups | /api/customers and /:id/users, /:id/create-login |
| Models | Customer; User; CRMAccount; CRMContact |
| Authorization | customers.read/write/delete plus tenant checks |
| States / workflow | Active/inactive companies; create linked client login; company department digital_agency/procurement/both. |
| Other modules | Hub for projects, enrollments, billing, procurement, files, messages, brand assets and metrics; CRM conversion can create/link a Customer. |
| Files / notifications | Company logo uses Media; login creation returns credentials to the operator; no automatic welcome-email workflow is established here. |
| Assessment | Active CRUD and login surfaces; two login creation endpoints overlap and require review. |

Source: [client/src/portal/features/customers](../../client/src/portal/features/customers).

## CRM / sales

**Purpose:** Prospect leads, accounts, contacts, deals and polymorphic activities.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/crm; /portal/crm/leads; /portal/crm/leads/:id; /portal/crm/accounts; /portal/crm/accounts/:id; /portal/crm/contacts; /portal/crm/contacts/:id; /portal/crm/deals; /portal/crm/deals/:id |
| API groups | /api/crm/{leads,accounts,contacts,deals,activities} |
| Models | CRMLead; CRMAccount; CRMContact; CRMDeal; CRMActivity; Customer; Enrollment |
| Authorization | crm.read/write/delete; external users lose crm.* in roleRegistry |
| States / workflow | Lead new/contacted/qualified/unqualified/converted; deal open/won/lost/archived with pipeline/stage constants; activity pending/done/cancelled. |
| Other modules | Plan submission creates lead/contact. Lead conversion links account/deal/contact; deal conversion creates/links an operational Customer. No automatic paid contract is implied. |
| Files / notifications | No domain upload pipeline; activities record calls/emails/tasks but do not themselves send email. |
| Assessment | Active; multi-record conversion is not transactional and overlapping conversion link fields need consolidation. |

Source: [client/src/portal/features/crm](../../client/src/portal/features/crm).

## Service catalog / templates

**Purpose:** Reusable commercial scope groups, deliverables, prices, execution modes, SLA and file definitions.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/services; /portal/services/new; /portal/services/:id; /portal/services/:id/edit |
| API groups | /api/service and /:id/files, /:id/files/:fileId/url |
| Models | ServiceTemplate; Media |
| Authorization | services.read/write/delete; internal permission prefixes |
| States / workflow | draft/active/archived; recurring/phased_project/one_time execution; monthly/quarterly/yearly/one_time billing. |
| Other modules | Enrollments copy/override template scope into finalScope; the catalog is not the public DigitalService CMS collection. |
| Files / notifications | Template attachments use privateStorage via shared upload middleware; cover imagery uses Media. No automated notifications. |
| Assessment | Active builder; sample presets and overlapping quick-create/builder controls need business review. |

Source: [client/src/portal/features/services](../../client/src/portal/features/services).

## Client service enrollments

**Purpose:** A client-specific service subscription/engagement with pricing, scope overrides and responsibility assignments.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/enrollments; /portal/enrollments/:id |
| API groups | /api/enrollments |
| Models | Enrollment; Customer; ServiceTemplate; User |
| Authorization | enrollments.read/write/delete; internal-only permission prefix |
| States / workflow | String status (default active), dates, execution/pricing snapshots; schema does not enforce a single universal lifecycle enum. |
| Other modules | References Customer/template and optional Project. Jobs can be explicitly generated from finalScope; creation alone is not automatic project/invoice creation. |
| Files / notifications | Scope may include file/approval metadata; no dedicated upload endpoint or external notification on enrollment creation. |
| Assessment | Active; scope normalization is one shared module since R4-D (`services/scopeNormalization.js`); linking/generation is a partly manual lifecycle. |

Source: [client/src/portal/features/enrollments](../../client/src/portal/features/enrollments).

## Projects

**Purpose:** Delivery containers for customer work, enrollment-linked work and internal projects.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/projects; /portal/projects/:id |
| API groups | /api/projects and /stats |
| Models | Project; Customer; Enrollment; User |
| Authorization | projects.read/write/delete; list and detail reads check the company, but create, update (including customerId reassignment) and delete do not — see RBAC map and remediation P0-2 |
| States / workflow | draft/planned/active/on_hold/in_review/completed/archived/cancelled are UI/code conventions, stored as strings. Archiving is PATCH status=archived. Since R3, DELETE (controller archiveProject) also archives (status=archived, archivedAt) and never deletes; linked jobs, invoices, files and tickets are kept. Lists hide archived projects unless `status=archived` or `includeArchived=true` (remediation P2-4). Before R3, DELETE permanently deleted the project and orphaned linked records. |
| Other modules | Jobs, files, invoices and enrollment links share projectId; pre_contract/contracted/custom/internal modes. |
| Files / notifications | Project files use File/privateStorage; no automated project update email found. |
| Assessment | Active; create/update/delete lack company checks for externally granted projects.write/delete (P0-2) and DELETE is a hard delete (P2-4). |

Source: [client/src/portal/features/projects](../../client/src/portal/features/projects).

## Delivery jobs / approvals

**Purpose:** Tasks and content deliverables, assignments, media, approval history, publication and post metrics.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/jobs; /portal/jobs/:id |
| API groups | /api/jobs; /generate/from-enrollment/:enrollmentId; /:id/approval; /:id/attach-media; /:id/publish; /:id/post-metrics |
| Models | Job; Project; Enrollment; Media; User |
| Authorization | jobs.read/write/delete; external permission prefix denied |
| States / workflow | brief → script/pre_production → designing/shooting/editing → internal_review/client_review → approved/scheduled → published/delivered; on_hold/archived; separate publishStatus. |
| Other modules | Generated from enrollment scopes; also drives Productions, content calendar, customer/project tabs and public website reels. |
| Files / notifications | draft/final/poster Media references, approval subdocuments; approval entries are stored history, not guaranteed email messages. |
| Assessment | Active; the Jobs board stages come from `jobs/pipeline.js` (checked against the API statuses since R4-D); the dashboard summary is a deliberate roll-up; the Productions pages keep their own stage lists (drift recorded for the Jobs/Productions migration); state transitions are not one central workflow engine. |

Source: [client/src/portal/features/jobs](../../client/src/portal/features/jobs).

## Service delivery overview

**Purpose:** Cross-project overview of scopes and delivery jobs.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/service-delivery |
| API groups | /api/projects; /api/jobs; /api/enrollments |
| Models | Project; Job; Enrollment |
| Authorization | UI projects.read; underlying requests require their own permissions |
| States / workflow | Aggregates job and project states; no separate delivery collection. |
| Other modules | A view over existing operational records, not another project or job system. |
| Files / notifications | Uses linked job/file metadata; no separate notifications. |
| Assessment | Active aggregate; access can differ from underlying API requirements. |

Source: [client/src/portal/features/delivery](../../client/src/portal/features/delivery).

## Production workspace

**Purpose:** Creative/video workflow presented as a specialized view of delivery jobs.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/productions; /portal/productions/:id |
| API groups | Current workspace: /api/jobs via productions/jobs.api.js; older /api/productions API still mounted |
| Models | Job; Media; Production |
| Authorization | UI productions.read; actual workspace requires jobs.read/write/delete |
| States / workflow | Current Job stages; old Production uses draft/published/archived, a different concept. |
| Other modules | Public reels now come from Job. Legacy Production is still referenced by Job.productionId and media-library API exports. |
| Files / notifications | Uses Media attachments and shared creative review history; no separate production email worker. |
| Assessment | Partial consolidation: UI uses Job while an older Production stack and unused panels remain. |

Source: [client/src/portal/features/productions](../../client/src/portal/features/productions).

## Media library

**Purpose:** Shared public website and creative-work assets with image/video processing and metadata.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/media-library |
| API groups | /api/media; unused legacy production functions share this API module |
| Models | Media; User |
| Authorization | media.read/write/delete; internal-only permission prefix |
| States / workflow | draft/published/archived asset metadata; image/video/file types. |
| Other modules | Referenced by CMS, jobs, portfolios, logos, brand assets and older business fields. |
| Files / notifications | Multer memory upload → Sharp variants for images → public S3 or development uploads directory. No external notification. |
| Assessment | Active; public media must not be treated as confidential File/CV storage. |

Source: [client/src/portal/features/media-library](../../client/src/portal/features/media-library).

## Client/project files

**Purpose:** Private attachments, access visibility, approvals and signed downloads.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/files |
| API groups | /api/files; /:id/download-url; /download-urls |
| Models | File; Customer; Project; Job; Production; User |
| Authorization | files.read/write/delete plus internal/client visibility and tenant ownership checks |
| States / workflow | visibility internal/client; approved boolean; independent of Media publish status. |
| Other modules | Links operational records and retains legacy public URL metadata alongside current private keys. |
| Files / notifications | Private S3 prefix/bucket or private-uploads in development; signed links; legacy public objects require explicit migration review. |
| Assessment | Active mixed-era storage model; do not delete legacy metadata before object reconciliation. |

Source: [client/src/portal/features/files](../../client/src/portal/features/files).

## Finance / invoices & payments

**Purpose:** Invoice items, totals, manual payments, paid/void/overdue actions and aggregates.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/billing; /portal/billing/:id |
| API groups | /api/billing/invoices; /:id/payments; /:id/mark-paid; /:id/void; /invoices/mark-overdue; /api/billing/stats |
| Models | Invoice; Customer; Project; Enrollment; User |
| Authorization | billing.read/write; external users cannot hold billing.write/delete; tenant-scoped reads |
| States / workflow | draft/sent/paid/overdue/void; payments recompute amountPaid/balance via model save hook. |
| Other modules | Connects to customer/project/enrollment; no Payment collection or accounting ledger integration. Expenses are a separate HR workflow. |
| Files / notifications | Invoice uploads are URL descriptors; no payment gateway, invoice-send email service or automatic overdue scheduler found. |
| Assessment | Active manual finance workflow; billing.delete is catalog-only. Invoice numbers are last-number + 1 on a unique field, so simultaneous creation fails with an error rather than duplicating (P2-3). |

Source: [client/src/portal/features/billing](../../client/src/portal/features/billing).

## Procurement / vendor operations

**Purpose:** Categories, vendor onboarding, client requests, RFQs, supplier matching and quotations.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/procurement; /portal/procurement/requests; /portal/procurement/requests/:id; /portal/procurement/vendors; /portal/procurement/categories; /portal/procurement/vendor-applications; /portal/procurement/rfqs; /portal/procurement/rfqs/new; /portal/procurement/rfqs/:id; /portal/procurement/rfqs/:id/edit |
| API groups | /api/procurement/{categories,vendors,requests,rfqs}; /api/vendor-applications |
| Models | ProcurementCategory; ProcurementVendor; VendorApplication; ProcurementRequest; RFQ; Quotation; User; Customer |
| Authorization | procurement.read/write/approve/delete; internal gates on vendor/category/RFQ reads; quotation submit has vendor role alias |
| States / workflow | Request new/assessing/quoted/approved/ordered/delivered/cancelled; RFQ draft/published/closed/awarded; quotation submitted/under_review/accepted/rejected; application pending/approved/rejected. |
| Other modules | Application approval creates vendor User/profile; request → RFQ; matching uses category ObjectIds; quotations link RFQ/vendor. No separate purchase-order or inventory model. |
| Files / notifications | RFQ/quotation attachments are URL descriptors; optional SMTP on RFQ publish; approval returns temporary credentials, without an enforced first-login-change flow. |
| Assessment | Partial vendor journey: vendor-specific controller/UI branches exist but RFQ read routes and frontend denylist block vendor access. |

Source: [client/src/portal/features/procurement](../../client/src/portal/features/procurement).

## People / HR

**Purpose:** Staff profiles, skills, scorecards, learning goals, leave, expenses and KPI indicators/goals/check-ins.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/hr; /portal/hr/staff; /portal/hr/staff/:id; /portal/hr/expenses; /portal/hr/expenses/:id; /portal/hr/monthly-expenses; /portal/hr/leaves; /portal/hr/skills; /portal/hr/kpi; /portal/hr/kpi/indicators; /portal/hr/kpi/goals |
| API groups | /api/hr/{staff,expenses,leaves,scorecard-templates,kpi} |
| Models | HRStaff; HRExpense; HRLeave; ScorecardTemplate; KPIIndicator; KPIGoal; KPICheckin; Team; User |
| Authorization | hr.staff.*, hr.expenses.*, hr.leaves.*, hr.scorecards.*, hr.kpi.*; owner-scoped self-service; no self-approval |
| States / workflow | Expense submitted→approved→registered→paid or rejected; leave submitted→approved/rejected/cancelled; staff active/on_leave/probation/inactive/terminated; KPI active/completed/at_risk/missed/cancelled. |
| Other modules | Staff linkedUserId differs from actor/staffUserId on claims; KPI autoSource can derive from leave, expense, scorecard and learning data. |
| Files / notifications | Receipts are URL/legacy Media fields, not a proven private receipt-upload flow. No automated HR emails found. |
| Assessment | Active workflows; KPI UI gate/catalog drift, arbitrary receipt URLs and linkage consistency need review. |

Source: [client/src/portal/features/hr](../../client/src/portal/features/hr).

## Content calendar / metrics

**Purpose:** Scheduled/published content calendar and manually recorded social performance.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/content-calendar |
| API groups | /api/jobs; /api/social-metrics |
| Models | Job; SocialMetrics; Customer |
| Authorization | Route gate jobs.read; metric endpoints social.metrics.read/write |
| States / workflow | Job schedule/publication states; metric period/platform dimensions. |
| Other modules | Calendar joins delivery jobs to customer social metrics; not a live social-network publishing connector. |
| Files / notifications | Uses job media and optional externalPostUrl. No social platform OAuth/API publishing integration found. |
| Assessment | Active manual tracking; social permission keys are missing from static frontend catalog. |

Source: [client/src/portal/features/social](../../client/src/portal/features/social).

## Messaging / unread notifications

**Purpose:** Company-thread messages, read markers and inbox counts.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/messages |
| API groups | /api/messaging; /read/:customerId; /unread/:customerId; /notifications/counts |
| Models | Message; Customer; User |
| Authorization | messaging.read/write plus customer-scoped authorization |
| States / workflow | Persisted messages and readBy user IDs; internal/client sender distinction. |
| Other modules | Topbar polls unread counts every 60 seconds; no standalone Notification model, websocket or queue. |
| Files / notifications | Attachments are URL strings, not automatic secure file ownership checks on arbitrary links; no message email delivery found. |
| Assessment | Active polling implementation; most notification preferences are stored settings, not shipped notification automations. |

Source: [client/src/portal/features/messaging](../../client/src/portal/features/messaging).

## Client brand kit

**Purpose:** Per-client logos, colors, fonts, guidelines and templates.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/brand-kit |
| API groups | /api/brand-kit |
| Models | BrandAsset; Customer; Media; User |
| Authorization | brand_kit.read/write and tenant checks |
| States / workflow | Asset type logo/color/font/guideline/template/icon; no formal publish lifecycle. |
| Other modules | Client workspace brand data differs from public site branding stored in SiteSettings/code. |
| Files / notifications | Media references and URL values; no independent mail/notification mechanism. |
| Assessment | Active; keys absent from static frontend permission catalog. |

Source: [client/src/portal/features/brand-kit](../../client/src/portal/features/brand-kit).

## Website CMS

**Purpose:** Homepage slides/settings, public Digital Services and shared Digital/Technology Solution records.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/website/slides; /portal/website/settings; /portal/website/digital-services; /portal/website/solutions |
| API groups | /api/homepage/slides; /api/site-settings; /api/web-content/{services,solutions} |
| Models | HeroSlide; SiteSettings; DigitalService; Solution; Media |
| Authorization | website.read/write; public reads are separate routes, with publication-boundary issues documented |
| States / workflow | Slides/records use isActive and order; Solution kind digital/technology with derived ownership and technology group. |
| Other modules | One Solution CMS feeds two public sections. CAS registry guarantees core discovery; CMS only enriches CAS and adds other products. |
| Files / notifications | Images use Media/SiteSettings overrides; no publish-event notification system. |
| Assessment | Active; CMS cannot edit all page copy; public includeInactive/detail reads need review. |

Source: [client/src/portal/features/website](../../client/src/portal/features/website).

## Portfolio CMS

**Purpose:** Editable public case studies and gallery projects.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/website/portfolio; /portal/website/portfolio/:id; /portal/portfolio; /portal/portfolio/:id |
| API groups | /api/portfolio |
| Models | Portfolio; Media |
| Authorization | UI portfolio.read; writes portfolio.write/delete; GET API is public |
| States / workflow | draft/published/archived, publication date and approval/system fields. |
| Other modules | Feeds public /portfolio and /case-studies; detail uses slug or ObjectId. Separate from work-delivery Project. |
| Files / notifications | Media cover/gallery refs, static fallback assets; no portfolio publication notifications. |
| Assessment | Active; public API currently does not enforce published-only access. |

Source: [client/src/portal/features/portfolio](../../client/src/portal/features/portfolio).

## Careers CMS / applications

**Purpose:** Job vacancy publishing and candidate application review.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/careers |
| API groups | /api/careers; /public; /:id/apply; /cv-upload; /applications; /applications/:id/cv-url |
| Models | Career; JobApplication; Media (legacy) |
| Authorization | website.read/write; public vacancy/application/CV-upload entry points |
| States / workflow | Career isActive; application new/reviewing/interview/rejected/hired. |
| Other modules | Public /careers form uses a separate CV upload then application creation; no automatic HRStaff/User conversion. |
| Files / notifications | Private CV keys with signed authorized download; orphan uploads possible if a candidate never submits; no automatic candidate mail found. |
| Assessment | Active review workflow; publication, retention and upload abuse controls need review. |

Source: [client/src/portal/features/careers](../../client/src/portal/features/careers).

## Support / change requests

**Purpose:** Customer/internal/procurement support threads, assignments, approvals and resolution.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/tickets; /portal/tickets/:id |
| API groups | /api/tickets; /stats; /:id/comments; /:id/status; /:id/approve |
| Models | Ticket; Customer; Project; User |
| Authorization | tickets.read/write/delete plus actor/visibility/tenant checks; DELETE has no company check (P0-2) |
| States / workflow | open/in_progress/waiting_client/waiting_vendor/in_review/escalated/resolved/closed; change request approval pending/approved/rejected. |
| Other modules | Connects customers/projects/users, with embedded comments and legacy clientId referring to User, not Customer. |
| Files / notifications | Attachments are embedded URL metadata; internal/client comment visibility; no automatic ticket email service found. |
| Assessment | Active; legacy authorRole enum client/admin is narrower than current role registry. |

Source: [client/src/portal/features/tickets](../../client/src/portal/features/tickets).

## Role dashboards

**Purpose:** Role-specific internal, client and vendor summaries over operational modules.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal |
| API groups | Module list/stats endpoints: jobs, tickets, customers, projects, CRM, procurement, billing, HR, enrollments |
| Models | No dedicated collection; aggregates existing modules. |
| Authorization | Authenticated shell; individual APIs enforce domain permissions; some fetches use Promise.allSettled |
| States / workflow | No persisted dashboard lifecycle; vendor RFQ load is currently denied by API internal gate. |
| Other modules | Role-name branches select dashboards; custom roles are not automatically equivalent to every built-in dashboard. |
| Files / notifications | No uploads; unread notifications come from messaging. |
| Assessment | Active aggregate with role assumptions; a denied/failed metric can look empty or zero. |

Source: [client/src/portal/features/dashboard](../../client/src/portal/features/dashboard).

## Reports

**Purpose:** Browser-built operational summaries from several module statistics endpoints.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/reports |
| API groups | /api/{projects,tickets,billing}/stats; /api/procurement/requests/stats; /api/hr/{staff,expenses,leaves}/stats; /api/customers |
| Models | No dedicated collection; aggregates existing modules. |
| Authorization | UI reports.read; APIs enforce their own read/approve permissions; reports.export has no implementation found |
| States / workflow | Snapshots computed from operational data; no scheduled report lifecycle. |
| Other modules | Granting reports.read alone does not grant access to source statistics. |
| Files / notifications | No dedicated report export storage or mail scheduler found. |
| Assessment | Partial reporting surface; unused API wrapper duplicates inline requests and export permission is unused. |

Source: [client/src/portal/features/reports](../../client/src/portal/features/reports).

## Activity / audit trail

**Purpose:** Filter and inspect IAM/system audit events.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/activity; /portal/users/:id |
| API groups | /api/audit; /api/users/:id/activity |
| Models | Audit; User |
| Authorization | activity.read plus authentication |
| States / workflow | Append-only audit records; no universal business event bus. |
| Other modules | Most logAudit calls are IAM operations; CRMActivity and Job approval history are separate domain histories. |
| Files / notifications | No uploads or external notifications; audit logging is not a substitute for DB/file backup. |
| Assessment | Active IAM-focused audit surface; activity/api.js wrapper is unused. |

Source: [client/src/portal/features/activity](../../client/src/portal/features/activity).

## My profile

**Purpose:** Current account identity and profile preferences.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/profile |
| API groups | /api/auth/me; /api/users/me |
| Models | User; Media |
| Authorization | requireAuth self-service field whitelist |
| States / workflow | Profile edits and avatar URL/Media metadata; no separate Profile collection. |
| Other modules | Shares the same User record as IAM, login and staff links. |
| Files / notifications | Avatar Media references/URLs; no dedicated profile notification. |
| Assessment | Active page; unused profile API/hook wrappers duplicate direct requests. |

Source: [client/src/portal/features/profile](../../client/src/portal/features/profile).

## My settings

**Purpose:** Own profile/password/notification preference settings.

| Layer | Actual implementation |
|---|---|
| Frontend routes | /portal/settings |
| API groups | /api/users/me; /api/auth/change-password; /api/users/me/notifications |
| Models | User |
| Authorization | Authenticated self-service; password change checks current password |
| States / workflow | Password change invalidates older tokens through passwordChangedAt; notification switches are persisted preferences. |
| Other modules | Not environment configuration and not SiteSettings; there is no general application-settings collection here. |
| Files / notifications | No uploads; preference toggles do not prove downstream project/ticket/billing email delivery. |
| Assessment | Active self-service; unused settings API wrapper duplicates direct calls. |

Source: [client/src/portal/features/settings](../../client/src/portal/features/settings).

## Important separations

- **Customer** is an operating client company; **CRMAccount** is a prospect/account relationship. They can be linked but are not interchangeable IDs.
- **ServiceTemplate** is an internal commercial template; **DigitalService** is public marketing content.
- **Project** is delivery work; **Portfolio** is a public case study.
- **Job** now drives current production/delivery views and homepage reels; **Production** is an older, still mounted showcase model.
- **Media** is public asset metadata; **File/CV private keys** are confidential storage paths. A draft Media record does not make its object private.
- **Audit**, **CRMActivity**, **Message**, Job approvals and Ticket comments are different histories, not one notification system.
- **User.team** is a string/key; **HRStaff.teamId** is a reference; public About team biographies are static marketing data.
