# Code cleanup audit — candidates only

[Blueprint](EXPRESSO-SYSTEM-BLUEPRINT.html) · [Executive summary](README.md) · Baseline `58b8f86c`.

## R5-A — complete / committed (27 Oct 2026)

Implementation baseline: `64a444a35865a746732f6162bce6e6119178b735` on `website/integrated-solutions`. This bounded, approved repository-only pass is complete / committed. The original audit below remains historical evidence, not a claim about the current implementation.

- **P4-2:** deleted exactly the 39 approved unreachable files listed below after rechecking runtime, lazy/dynamic imports, re-exports, routes, tests, scripts/configuration and CSS/HTML references. No candidate was rejected or restored. All seven deferred Production-related files and fourteen manual-review files remain.
- **P4-4:** removed only client `three`, `@react-three/fiber`, `@react-three/drei`, `tailwind-clip-path`, `tailwind-merge`, `@carbon/icons-react` and API `cookie-parser`, `@aws-sdk/lib-storage`. Moved the three Testing Library packages to client devDependencies without changing their ranges or installed versions. Normal npm operations updated both lockfiles; no surviving package version, resolved source or integrity changed.
- **Inventory:** non-test client JS/JSX files 489 → 450; runtime-reachable files 429 → 429; unreachable candidates 60 → 21; client tests 29 → 29; API source JS files 179 → 179. Static frontend request sites 302 → 294. Permissions remain 73, API registrations 283, models 45 and frontend route records 106; `reports.export` remains absent. Client runtime dependencies 23 → 14 and devDependencies 2 → 5; API runtime dependencies 16 → 14.
- **Retained descriptive references:** the live website image registry still displays source-path labels for `CreativePostsShowcase.jsx` and `portfolioSolutionSection.jsx`. These are metadata strings, not imports or file reads; changing that registry is outside this pass.
- **Pre-existing finding, not changed:** retained, unreachable `portal/shared/hooks/usePortalProfile.js` imports missing `../../api/profile.api`. That path was already missing at the baseline and is unrelated to the approved deletions. No live import was broken. The inventory's `unresolvedLocalJs` check only reports explicit `.js`/`.jsx` imports, so its empty result does not cover this extensionless legacy import.
- **Verification:** focused checks passed for manifest/lock agreement, unchanged routes and dependency versions. Full results and the cached-run focus-test caveat are recorded below.
- **Still blocked/deferred:** P3-2 Production retirement, P4-5 assets, P4-6 endpoints, P4-7 Strapi and the P2-7 lifecycle remainder. No database, schema, endpoint, asset, permission, Production runtime, PI reconciliation or Operating Manual change.

### Verification results (27 Oct 2026)

| Check | Result |
|---|---|
| API `npm test` | 357 passed, 0 failed, 6 skipped (363 total); the six opt-in local replica-set integration tests were not enabled. Tests used the stubbed/local harness; no application database was accessed |
| Client full suite | `CI=true npm test -- --watchAll=false --runInBand --no-cache`: 29 suites / 308 tests passed |
| Client test caveat | Two earlier cached full runs each passed 307/308 and failed the unchanged Clients radio-group focus assertion (`clients.test.js:279`). The Clients suite passed 14/14 in isolation. A temporary copy of baseline source, using the same retained dependency tree and no environment files, passed 308/308. Modal initial focus is scheduled with a zero-delay timer; this timing-sensitive assertion was reported, not changed or suppressed |
| Lint | `eslint src --ext .js,.jsx --format json`: 0 errors, 1 pre-existing unused `Input` import warning in retained/protected `AttachmentPicker.jsx:3` |
| Production build | `CI=false npm run build`: compiled successfully. Browserslist reported an outdated data warning; no unrelated update was performed |
| Architecture | `node docs/architecture/validate.cjs`: passed (15 documents, 283 routes, 45 models; Blueprint offline) |
| Route/import sanity | All 106 frontend route records and 283 API registrations unchanged. No unresolved runtime/test import or remaining source import of the eight removed packages. The retained unreachable hook exception is documented above |
| Dependency/lock checks | Both `npm ls --depth=0` checks passed; root manifest/lock metadata agree; only the exact approved direct dependency changes and transitive pruning/dev flags. Client lock entries removed: 71; API: 21; no retained version/resolved/integrity changes or added package entries |
| Scope/whitespace | Exactly 39 approved source deletions and 7 approved file updates; `git diff --check` passed |

Static route/import checks covered Home, About, Digital Services, Digital Solutions, Technology, Portfolio/case studies, Careers/Work With Us, Contact and Plan Builder; portal authentication, dashboard, Projects, Jobs, live Productions, Clients, CRM, Finance, HR, Procurement, Client and Vendor workspaces. No screenshot/browser verification was requested or performed.

### Exact approved source deletions (39)

Paths are relative to the repository root; no other source deletion is included.

```text
client/src/components/CreativePostsShowcase/CreativePostsShowcase.jsx
client/src/components/ExpertsCard/expertsCard.jsx
client/src/components/HeroSection/heroSection.jsx
client/src/components/MainHeader/DropDowns/careerContent.jsx
client/src/components/MainHeader/DropDowns/ourSolution.jsx
client/src/components/MainHeader/DropDowns/pricingDropdown.jsx
client/src/components/PortfolioComponents/PortfolioCaseStudy.jsx
client/src/components/PortfolioComponents/PortfolioGallerySection.jsx
client/src/components/PortfolioComponents/categoryTabs.jsx
client/src/components/PortfolioComponents/portfolio.js
client/src/components/PortfolioComponents/portfolioDetailCard.jsx
client/src/components/PortfolioComponents/portfolioIntroDesc.jsx
client/src/components/PortfolioComponents/portfolioProblemSection.jsx
client/src/components/PortfolioComponents/portfolioResultSection.jsx
client/src/components/PortfolioComponents/portfolioSolutionSection.jsx
client/src/components/PrimaryHeader/primaryHeader.jsx
client/src/components/ServicesComponents/webPortfolio.jsx
client/src/components/SideBar/sideBar.jsx
client/src/components/SolutionMegaPanel/SolutionMegaPanel.jsx
client/src/features/portfolio/api.js
client/src/icons/socialMedia.jsx
client/src/pages/Services/content-creation.jsx
client/src/pages/Services/google-ads.jsx
client/src/pages/Services/seo-marketing.jsx
client/src/pages/Services/social-media-marketing.jsx
client/src/pages/Services/videography.jsx
client/src/pages/Services/webiste-dev.jsx
client/src/pages/SingleViewPortfolio/portfolioData.js
client/src/portal/config/portal.constants.js
client/src/portal/features/activity/api.js
client/src/portal/features/hr/components/MonthlyExpenseSummary.jsx
client/src/portal/features/jobs/components/CustomerSelect.jsx
client/src/portal/features/jobs/components/EnrollmentSelect.jsx
client/src/portal/features/jobs/components/ProjectSelect.jsx
client/src/portal/features/media-library/components/MediaFilters.jsx
client/src/portal/features/profile/api.js
client/src/portal/features/projects/components/ProjectFilters.jsx
client/src/portal/features/reports/api.js
client/src/portal/features/settings/api.js
```

## Original audit (`58b8f86c`)

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
