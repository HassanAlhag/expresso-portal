# Code cleanup audit — candidates only

[Blueprint](EXPRESSO-SYSTEM-BLUEPRINT.html) · [Executive summary](README.md) · Baseline `58b8f86c`.

**Nothing has been removed, refactored or fixed.** This is a decision list for a later, separately approved cleanup stage. Every item has an ID so it can be approved, deferred or rejected individually.

| Label | Meaning |
|---|---|
| **KEEP** | Real, used or intentionally retained. Do not remove |
| **FIX** | Real functionality with a defect or contract mismatch. Repair rather than delete |
| **CONSOLIDATE** | Two or more sources of truth for one thing. Choose one and migrate |
| **REMOVE CANDIDATE** | Evidence says unused. Remove only after the listed check |
| **NEEDS REVIEW** | Purpose unclear or depends on live data or business intent |

## How candidates were found

- **Import graph:** every `.js`/`.jsx` file under `client/src`, starting from `client/src/index.js`, following static and lazy imports (`generate-inventory.cjs`). **79 client files are not reachable.** Tests are excluded, so a file used only by a test also shows as unreachable.
- **Empty files:** **24 zero-byte source files** (20 client, 4 API).
- **API usage:** every literal frontend `fetch`/Axios call matched against the 282 mounted routes. Requests built dynamically, or from wrappers called with a variable, can be missed, so "no consumer found" means **needs review**, not "dead".
- **Backend imports:** middleware/utility files with no importer in `portal-api/src`.
- **Dependencies:** packages in `package.json` with no import in source (build tooling excluded).
- **Repository files:** stale planning or QC artefacts and untracked local folders.

Before removing anything, re-run `node docs/architecture/generate-inventory.cjs`, the client build, and the API and client test suites. Then search for the file name once more, including CSS and JSON.

---

## A. FIX — defects and contract mismatches (highest value)

| ID | Item | Evidence | Why it matters |
|---|---|---|---|
| F1 | Vendor RFQ access | `rfq.routes.js` puts `requireInternalUser` on list, detail and quotation reads; `rfq.controller.js` has unreachable vendor filtering; `ProtectedRoute` denies RFQ pages to externals | Approved vendors cannot see or answer RFQs. Decide the vendor policy, then align route, controller and UI together |
| F2 | Public publication boundary | `GET /api/portfolio` and `/api/productions` accept any `status`; `/web-content/*` lists accept `includeInactive`; slug details ignore `isActive` | Drafts and inactive CMS records can be read by anyone who knows the URL or parameter |
| F3 | Project and ticket writes ignore the company | `project.controller.js`: `createProject`, `updateProject`, `archiveProject` (a hard delete); `ticket.controller.js:deleteTicket`; none of these keys is stripped for external users | A custom external role granted `projects.write`/`projects.delete`/`tickets.delete` could create, edit, move or delete another company's records (remediation P0-2, P2-4) |
| F4 | User deletion bugs | `user.controller.js:552` compares `req.user._id` (middleware sets `req.user.id`); line 560 imports `../../customers/customers.model.js`, but the file is `customer.model.js` | The self-delete guard never fires. Deletion can fail after part of it has been written |
| F5 | Orphaned frontend calls | `iam/users/api.js` exports `getUserNotes`/`saveUserNotes` → `GET/PATCH /api/users/:id/notes`, which does not exist. The comment says "Backend should expose…" | Nothing calls these today; implement user notes or delete the wrappers |
| F6 | Vendor approval and CRM conversions are not atomic | `approveVendorApplication`, `convertLeadToDeal`, `convertDealToCustomer` write several collections in sequence | A failure part-way leaves orphan users, vendors, accounts or customers |
| F7 | Invoice / RFQ numbering | `billing.controller.js:nextInvoiceNumber` takes the last `INV-<year>-` number + 1 on a **unique** field; `rfq.controller.js:genRfqNumber` uses `countDocuments() + 1` with no unique index and no year reset | Invoices: simultaneous creation fails with an error (no duplicate). RFQs: duplicates after deletions or concurrent creation (remediation P2-3) |
| F15 | Invite tokens in request logs | `middleware/requestLogger.js` (morgan `combined` in production) logs `/api/invites/verify?token=…` | Anyone who can read logs could accept a pending invite (remediation P0-4) |
| F8 | KPI route gate | `ProtectedRoute` maps `/portal/hr` (including KPI) to `hr.staff.read`; the API uses `hr.kpi.*` | A KPI-only user is blocked from the page, or admitted but refused data |
| F9 | Productions page permission | UI gate `productions.read`; the page actually calls `/api/jobs` (`jobs.*`) | A least-privilege role can open a page it cannot use |
| F10 | Empty role = default role | `resolveRoleContext` falls back to code defaults when a Role document's permission list is empty | A built-in role cannot be disabled by clearing its permissions |
| F11 | Duplicate index | `AccessRequest.status` has `index: true` **and** `AccessRequestSchema.index({ status: 1 })` | Mongoose duplicate-index warning; one definition is redundant |
| F12 | `seedUser.js` writes a legacy field and overwrites passwords | Sets `permissions: [...]` (not in the User schema) and upserts the password for an existing email | Running it against an existing admin silently resets that password |
| F13 | Missing UI permission checks on mutations | Many pages show write/delete buttons without checking permission; the shared `Can.jsx` is unreachable | Read-only users see actions that fail with 403. API enforcement is still correct |
| F14 | Ticket author role enum | `Ticket.comments[].authorRole` is limited to `client`/`admin` | Every comment author is recorded as either `client` or `admin`, which is narrower than the 14-role registry |

## B. CONSOLIDATE — multiple sources of truth

| ID | Topic | Copies today | Suggested single source |
|---|---|---|---|
| C1 | Permission catalog and role defaults | API `config/permissions.js` (74 keys) and client `portal/config/permissions.js` (66 keys). `GET /api/permissions/catalog` exists but nothing calls it | Serve the API catalog to `RoleEditor` and `AccessTab`; delete the client copy |
| C2 | Technology groups | API `technologyGroups.js`, client `utils/technologyGroups.js`, `data/technologyGroupsFallback.json` | API as owner; keep the client fallback only for API outages, generated from it |
| C3 | Job pipeline stages | `jobs/pipeline.js`, `DashboardPage.jsx` `STAGES`, production views | `pipeline.js` (and an API-side transition table) |
| C4 | Productions | Current workspace uses Job (`productions/jobs.api.js`); the older `/api/productions` + Production model are still mounted; `Job.productionId` and media-library exports point at Production | Decide whether any Production records matter, migrate to Job, then retire the API/model (see N2) |
| C5 | Client login creation | `POST /customers/:id/create-login` and `POST /customers/:id/users` | One endpoint with one credential-delivery policy |
| C6 | Lead → deal link fields | `CRMLead.convertedDealId` and `convertedToDealId` both written | Keep one field; migrate data |
| C7 | Role hierarchy | `user`/`invite` controllers hard-code `super_admin`/`admin`; roles controller uses beyond-actor checks | One `canManageRole` helper based on permissions |
| C8 | S3 bucket configuration names | `AWS_S3_BUCKET`, `S3_BUCKET`, `AWS_BUCKET_NAME` all accepted by `utils/s3.js` | One documented name per bucket; keep aliases only during migration |
| C9 | Unused API wrappers vs inline calls | `activity/api.js`, `reports/api.js`, `profile/api.js`, `settings/api.js`, `dashboard/api.js` (empty) are unreachable; pages call Axios inline | Either use the wrappers everywhere or delete them |
| C10 | Duplicate selectors | `jobs/components/{Customer,Enrollment,Project}Select.jsx` (unreachable) vs `projects/components/CustomerSelect.jsx` (used) | One shared selector set |
| C11 | Service scope normalisation | ServiceTemplate builder and Enrollment each normalise scope | One shared module (API side) |
| C12 | Endpoint and QC inventories | Root `API_ENDPOINT_COVERAGE_COMPLETE.csv` lists **220** endpoints; the code has **282**. `USE_CASES_QC*.csv`/`.xlsx` are separate copies | Regenerate QC from `source-inventory.json`, or mark the CSVs as historical |
| C13 | Settings and data caching | SiteSettings in-memory + storage cache, navigation cache, portfolio hook cache, each with its own error convention | One small data layer for public reads |

## C. REMOVE CANDIDATES — client files not reachable from the app (79)

Grouped by origin. "Empty" means a zero-byte file.

### C-1. Empty client files (20) — REMOVE CANDIDATE, lowest risk

`components/SolutionCTA/SolutionCTA.jsx` · `features/productions/components/ProductionCard.jsx` · `features/productions/components/ProductionGallery.jsx` · `portal/features/crm/components/CRMStatCard.jsx` · `portal/features/crm/components/DealStageBoard.jsx` · `portal/features/dashboard/api.js` · `portal/features/iam/invites/components/InviteModal.jsx` · `portal/features/media-library/constants.js` · `portal/features/productions/components/{ProductionCalendarPanel, ProductionJobsTable, ProductionPublishedPanel, ProductionReviewsPanel, ProductionShowcasePanel, ProductionStats}.jsx` · `portal/features/services/components/ScopeGroupEditorCard.jsx` · `portal/shared/hooks/{useDebounce, usePortalData, usePortalMutations}.js` · `portal/shared/utils/{errors, format}.js`

### C-2. Old public website pages and components (31) — REMOVE CANDIDATE

| Files | Replaced by | Check before removal |
|---|---|---|
| `pages/Services/{content-creation, google-ads, seo-marketing, social-media-marketing, videography, webiste-dev}.jsx` (6) | Generic `/service/:slug` from DigitalService CMS | Copy any wording still wanted into the CMS records |
| `components/MainHeader/DropDowns/{careerContent, ourSolution, pricingDropdown}.jsx`, `PrimaryHeader/primaryHeader.jsx`, `SideBar/sideBar.jsx`, `SolutionMegaPanel/SolutionMegaPanel.jsx` (6) | `MainHeader` + `MegaPanel` + `navData.js` | None found |
| `components/PortfolioComponents/*` (9) + `pages/SingleViewPortfolio/portfolioData.js` | Portfolio CMS (`PortfolioGalleryPage`, `SingleViewPortfolio` + hooks) | Static case-study text may be worth importing into Portfolio records first |
| `features/productions/{api.js, pages/ProductionsPage.jsx, pages/ProductionDetailsPage.jsx}`, `features/portfolio/api.js` (4) | Homepage reels from Job; portfolio hooks | Tied to C4: the API still serves `/api/productions` |
| `components/{CreativePostsShowcase, ExpertsCard, HeroSection}/*`, `ServicesComponents/webPortfolio.jsx`, `icons/socialMedia.jsx` (5) | Current home and services sections | Confirm no design wants them back |

### C-3. Portal leftovers (28) — mixed

| Files | Label | Note |
|---|---|---|
| `portal/features/productions/components/{ProductionTabs, ProductionToolbar, VideoReviewPanel}.jsx` | REMOVE CANDIDATE | Earlier production UI; the current page does not import them |
| `portal/features/media-library/components/{MediaFilters, ProductionForm}.jsx` | REMOVE CANDIDATE | Old filters and Production editor (tied to C4) |
| `portal/features/iam/users/{components/UserDrawer.jsx, constants.js, schemas.js}` | REMOVE CANDIDATE | Superseded by the current user pages |
| `portal/features/services/{components/QuantityCounter.jsx, tabs/ServiceTemplateTabs.jsx}` | REMOVE CANDIDATE | Builder now uses other tabs |
| `portal/features/projects/components/ProjectFilters.jsx`, `hr/components/MonthlyExpenseSummary.jsx` | REMOVE CANDIDATE | Filters and summary now live inline in pages |
| `portal/features/jobs/components/{CustomerSelect, EnrollmentSelect, ProjectSelect}.jsx` | CONSOLIDATE | See C10 |
| `portal/features/{activity, profile, reports, settings}/api.js` | CONSOLIDATE | See C9 |
| `portal/shared/ui/Can.jsx` | CONSOLIDATE | Good candidate for the UI capability check missing in F13 — reuse rather than delete |
| `portal/shared/ui/{Table, ListShell, AttachmentPicker}.jsx`, `portal/shared/hooks/usePortalProfile.js`, `portal/shared/utils/cn.js` | NEEDS REVIEW | Generic building blocks; keep if a design-system stage will adopt them |
| `portal/shared/utils/constants.js` (`AUTH_KEY = "expresso_portal_demo_auth"`), `portal/config/portal.constants.js`, `portal/theme/portalTheme.js` | REMOVE CANDIDATE | Demo-era constants; the CSS theme (`portalTheme.css`) **is** used and must stay |

## D. Backend candidates

| ID | Item | Label | Evidence |
|---|---|---|---|
| B1 | Empty files: `middleware/requireAuth.js`, `utils/constants.js`, `utils/pick.js`, `modules/content/media/media.service.js` | REMOVE CANDIDATE | Zero bytes, no importer |
| B2 | `middleware/rbac.js`, `middleware/requirePerm.js` (CommonJS), `middleware/roles.js` | REMOVE CANDIDATE | No importer; obsolete `superadmin` rules. Live auth is `middleware/auth.js` |
| B3 | `utils/apiFeatures.js`, `utils/apiResponse.js`, `utils/resolvePermissions.js` | REMOVE CANDIDATE | No importer; `resolvePermissions` is a backward-compatibility wrapper over `roleRegistry` |
| B4 | `GET /api/procurement/categories/public` | NEEDS REVIEW | No frontend consumer; registration uses `/categories/tree` |
| B5 | `GET /api/productions/:slug`, `PATCH /api/productions/:id/status` and the rest of `/api/productions` | NEEDS REVIEW | Only unreachable pages or unused media-library exports call them (C4) |
| B6 | `GET /api/crm/activities/:id`, `GET /api/procurement/vendors/:id`, `DELETE /api/roles/:id` | KEEP (API-only) | No UI caller; harmless, permission-gated, useful for future UI |
| B7 | `GET /api/permissions/catalog` | KEEP → CONSOLIDATE | The intended single permission source (C1) |
| B8 | `GET /api/admin/system-status`, `GET /api/health` | KEEP | Operator endpoints; status-only output |
| B9 | `GET /api/private-files/:token` | KEEP | Signed local-development download path used by private storage links |
| B10 | `scripts/debugUser.js`, `resetUserPassword.js`, `sendTestEmail.js`, `checkPrivateStorage.js`, `listUnclassifiedRoles.js`, `migrateConfidentialFiles.js` | KEEP | Operator tools, guarded by `_guard.js`; do not run against production without approval |
| B11 | `scripts/seedHRKPI.js` | NEEDS REVIEW | Creates **demo** HR staff, KPI goals and check-ins ("Expert HR KPI demo profile"). It belongs in a future `db:seed-demo`, never in system setup |
| B12 | `scripts/seedPortfolio.js`, `seedWebContent.js` | NEEDS REVIEW | Initial website content. Decide whether it is approved CMS baseline or sample copy |
| B13 | `scripts/seedRoles.js`, `seedProcurementCategories.js`, `seedDigitalSolutions.js` | KEEP | System and configuration baselines (see the reset plan) |

## E. Dependencies

| Package | Area | Label | Evidence |
|---|---|---|---|
| `three`, `@react-three/fiber`, `@react-three/drei` | client | REMOVE CANDIDATE | No import anywhere in `client/src` |
| `tailwind-clip-path`, `tailwind-merge` | client | REMOVE CANDIDATE | No import, and not in `tailwind.config.js` plugins |
| `@testing-library/*` | client | KEEP (move) | Used by tests; belongs in `devDependencies` |
| `react-scripts` | client | KEEP | Build tool |
| `cookie-parser`, `@aws-sdk/lib-storage` | API | REMOVE CANDIDATE | No import in `portal-api/src` |

## F. Repository and assets

| ID | Item | Label | Note |
|---|---|---|---|
| R1 | Root `API_ENDPOINT_COVERAGE_COMPLETE.csv`, `USE_CASES_QC.csv`, `USE_CASES_QC_COMPLETE.csv/.xlsx`, `EXPRESSO_ERP_FUTURE_ENHANCEMENT_PLAN.docx` | NEEDS REVIEW | Planning/QC artefacts; the endpoint CSV is stale (220 vs 282). Move to `docs/` or archive |
| R2 | Root `STAGE-3-TECHNOLOGY-VENDOR.md`, `STAGE-3.5-FUNCTIONAL-CLEANUP.md` | CONSOLIDATE | Stage notes; move under `docs/` with this architecture set |
| R3 | `server/` folder (local, git-ignored) | NEEDS REVIEW | An old **Strapi** project on the development machine only. Not part of the deployed system. Its own `.env` was **not** opened. Archive or delete locally if no longer needed |
| R4 | `client/public`: 305 tracked assets, 140 MB. **145 files (45.8 MB)** are not referenced by file name anywhere in client or API source | NEEDS REVIEW | Database records (SiteSettings, Solution, Portfolio, Media) may still point at some of these paths. Check against a database export before removal. The 14 `public/Barlow` font files may be loaded from CSS |
| R5 | No TODO/FIXME markers in source | KEEP | The only "Backend should expose" note is F5 |

## G. Things that look removable but must be kept

| Item | Why it stays |
|---|---|
| `Production` model and `/api/productions` | Still mounted, referenced by `Job.productionId` and `File.productionId`; live records not inspected (C4) |
| `File` legacy public-URL fields | Needed until `migrateConfidentialFiles.js` has been run and objects reconciled |
| `Customer` vs `CRMAccount`; `ServiceTemplate` vs `DigitalService`; `Project` vs `Portfolio` | Similar names, **different** business concepts |
| `coreDigitalProducts.js`, `casProduct.js`, `technologyGroupsFallback.json` | Guarantee CAS and Technology navigation survive an empty CMS or API outage |
| `_guard.js` | Protects every seed and script from remote and production databases |
| `portal/theme/portalTheme.css` | Imported by `index.js` (only the `.js` sibling is unused) |

## Suggested order for a future cleanup stage

1. **F1–F4** (security and correctness) with targeted tests first; no deletions in the same change.
2. **C1** permission single source, then **F8/F9/F13** UI gates.
3. **C-1 and B1** empty files, then **B2/B3**, then **E** dependencies: low-risk, separate commits.
4. **C-2** public leftovers after content owners confirm nothing is wanted.
5. **C4/B5** Productions retirement only after a database export shows how many Production records exist.
6. **R4** asset pruning only against a database export of stored image paths.
