# Expresso Blueprint — final closure

**CODE COMPLETE: YES.** Code closure is **CLOSED**, subject to review of this uncommitted pass. **Deployment acceptance: BLOCKED-EXTERNAL** until the applicable release gates below are signed off. No production/staging deployment or access was performed. This is the authoritative delivery status; older audit findings, planning sequences and dated implementation notes are historical context.

Baseline: `622086b89d90b3c1fff1663cf8cbeab0110e100a`, `website/integrated-solutions`, level with origin. No stage, commit or push in this pass. The two Operating Manuals remain untouched and untracked. Final verification scope is the baseline plus this closure pass and the finished Services/seed and Work Items changes that the user explicitly approved including. An earlier isolated checkout proved the original closure fixes independently; final results below cover the combined workspace. Review finalized 29 October 2026.

## Delivered and closed

The Blueprint delivered the public website/CMS and portal foundation, consistent server access boundaries, client permission-aware navigation/actions, transactional CRM conversions, current delivery/Jobs workspaces, reviewed repository cleanup, deterministic architecture/reference/endpoint/asset evidence and guarded local/disposable recovery tooling. It does not implement the future business Operating Model.

| Delivered stage | Final classification | Evidence / boundary |
|---|---|---|
| R1 Security | CLOSED | Current-user authentication, tenant/publication boundaries, token-log redaction, self/last-super-admin and hierarchy guards; R1/R3 closure tests |
| R2 Access Model / Vendor Journey | CLOSED | One permission catalog, effective permissions, external-role restrictions, vendor category/quotation ownership, invitation approval/retry/acceptance; real deployed-session acceptance below |
| R3 Housekeeping | CLOSED | Counter-based numbering, project archive, insert-only bootstrap account, QC/source corrections; RFQ index deferred |
| W4 Website | CLOSED | Public catalogues, CAS/Business Suite, API outage/error/empty states, homepage slide semantics; approved CMS slide entry remains an external content action |
| R4-A/B/C/D Consistency | CLOSED | Access refresh/action alignment, read-without-write settings, CRM transactions, shared normalization/storage resolution and status checks; production acceptance below |
| Design Study | CLOSED | Approved portal design foundation retained |
| Portal Implementation / PI closure | CLOSED | Current dashboard, CRM, customers/projects, services/enrollments, finance, HR, procurement, CMS and IAM journeys covered by existing suites |
| Jobs PI | CLOSED | Jobs-driven delivery, permissions, owner/reference validation and explicit public publishing; Productions still uses Jobs |
| R5-A | CLOSED | Approved source/dependency cleanup retained; no speculative deletion |
| R5-B2 | CLOSED | Offline reference-integrity foundation; no real persisted-data audit claimed |
| R5-B3 | CLOSED | Offline asset reconciliation/capture design; no persisted/storage/external-use evidence or deletion approval |
| R5-C1 | CLOSED | Endpoint/caller register; no production usage evidence or endpoint retirement |
| R5-D1 | CLOSED | Declared target identity, manifest/inventory/catalog and append-only evidence foundation |
| R5-D2 | CLOSED | Guarded backup creation for local/disposable targets, including authenticated views |
| R5-D3 | CLOSED | Restore into a distinct empty disposable replica set and compare the exact D2 artifact |
| This closure's verified runtime fixes | CLOSED | Historical team-image fallback, posterless reels, Productions board/status tracker; regression proof below |

There is **no remaining FIX NOW code blocker** identified by this review. Remaining items are classified below as DEFERRED or BLOCKED-EXTERNAL; they do not reopen these delivered foundations.

## Final architecture, security and integrity

The repository has **290 API registrations, 76 unique permission keys and 46 models**. `reports.export` is absent. The approved Work Items feature adds seven `/api/work` registrations, `work.read/write/delete` and the `WorkItem` model; the baseline was 283 / 73 / 45. Existing permission keys and legacy Production relationships remain intact. Work Items is classified as CMS with public-storage references in D1 and an optional case-study relationship in the existing B2 catalog. D2/D3 behavior is unchanged. No dependency/lockfile or asset bytes changed. The 758-file application/test source set, including new modules, is checked before and after final validation for additions, removals and content changes.

Authentication verifies the signed JWT, reloads the active user, rejects sessions older than `passwordChangedAt`, and resolves current stored-role permissions plus grants/revokes. A token's role claim cannot promote a stored staff user. `super_admin` remains the sole permission bypass; role hierarchy, self-management and last-super-admin guards remain enforced. Force logout requires `iam.users.write` plus hierarchy, invalidates the target's old session, and system status remains super-admin-only with status flags rather than secrets.

Vendor and client ownership/classification boundaries, private File/CV storage and signed access, public publication filtering, Jobs publication allowlists, CMS write permissions and CRM conversion authorization remain covered by API/client tests. Legacy Productions pages still expose some mutation controls to read-only users; the API refuses unauthorized mutations. That presentation debt is explicitly deferred below, not represented as a server access-control gap.

Lead → Deal and Deal → Client use one transaction/session, conditional source claims, retry-safe callbacks and idempotent existing-result responses. Standalone MongoDB is refused before conversion writes. Six real disposable replica-set tests prove commit, repeat, last-write rollback and concurrent same-source conversion. This is not a claim of global CRM deduplication or historical production integrity.

Jobs validate Customer, Project/Enrollment ownership, internal assignees, dates and Media references; external File links stay company-scoped. Project DELETE archives and preserves linked records. Enrollment scope normalization and enforced reference boundaries remain covered; Mongoose references are not universal database foreign keys. Invoice/RFQ counters retain concurrency/bootstrap behavior; the RFQ unique index remains deferred. User-delete guards and audit/unlink behavior remain intact. Legacy `Production.coverMedia/gallery`, `Job.productionId` and `File.productionId` are retained.

## Missing public-path decisions and runtime corrections

| B3 finding | Current runtime / consequence | Decision and evidence |
|---|---|---|
| `client/public/gal2.webp` | About/team component and CMS registry key; without an override the portrait requested an absent file | CLOSED: history `74018def` changed the original `gal2.png` reference to a nonexistent WebP. The central image resolver now uses the existing PNG only when no override is present. Existing registry-key and About-field CMS overrides keep their precedence; no asset changed |
| `client/public/placeholder-reel.jpg` | Reachable homepage reel card fallback when poster/cover Media is absent | CLOSED: remove the nonexistent fallback URL and omit the image element when absent. The existing neutral card/play control/title and playable video remain; actual poster/cover media is unchanged. No replacement imagery invented |
| `client/public/82.jpg` | Reachable social-media pricing banner plus registry metadata; configurable through the image registry. The black banner, heading, pricing and contact CTA work without the decorative background | DEFERRED: no historically proven replacement exists in the repository. Preserve the CMS key; content owner can supply an approved override in the deployed editor. This cosmetic image gap does not break the supported pricing/contact journey |
| `client/public/creatives/posts/post1.jpg` | Registry/legacy metadata only; its CreativePostsShowcase renderer was removed in approved R5-A cleanup and is not imported by the current Portfolio page | CLOSED as a current-runtime finding: no active renderer. Keep legacy selector metadata; any later metadata/persisted-value cleanup is DEFERRED |

The included Services pages apply the approved reference layout to `web-dev` and `seo-marketing`, retain CMS copy/links and the existing renderer for other slugs, and reuse existing repository content. Seven tests cover content, layout, FAQs, publication showcase and loading. The existing web-content seed has a heading emoji removal plus formatting; no seed was run.

The included Work Items feature separates visual `/portfolio` work from `/case-studies`, retains existing case-study APIs/keys and redirects old portal admin URLs. Public reads filter drafts/archived records and unpublished linked stories; `work.*` permissions govern management and remain denied to external roles. A verified publish/delete race is fixed with a conditional database delete; the new regression fails before the fix. Work Items media IDs/URLs are references, not universal foreign keys or object-existence guarantees. The final feature also includes gallery lightbox navigation, up to 12 sanitized video sources with legacy single-video compatibility, media editor controls and the existing Case Studies settings key under a corrected label. Its optional insert-only draft-seed source is included for review but never executed; this is not D4 general seed separation.

The Jobs-backed Productions board now reuses the existing Jobs pipeline, so delivered/on-hold/archived jobs no longer fall into Brief or the wrong terminal group. Its detail tracker uses the existing full Jobs status vocabulary and identifies the current step. No new workflow, transition policy or legacy Production migration was introduced.

B3's accepted baseline remains **326 assets / 140,887,425 bytes (134.36 MiB), 178 with runtime/public-config static evidence, 11 protected, 143 candidates / 45,765,971 bytes (43.65 MiB), zero deletion-authorized**. The approved current source introduces six additional static image references (`alpha1.png`, `alpha2.png`, `ayur2.png`, `floraison2.png`, `mih2.png`, `smile2.png`). Current evidence is **326 assets / 140,887,425 bytes, 184 with static runtime evidence, 11 protected, 137 candidates / 40,708,174 bytes (38.82 MiB), zero deletion-authorized**. All original 143 candidates remain on disk. The existing B3 generator now inspects new application source before commit while retaining the Git-tracked asset set; this fixes its conflict with the required no-staging review. No persisted capture or new evidence framework was added. Current schema coverage is 46 models / 994 leaf fields / 267 selected surfaces. Static declarations of retained CMS selectors can still appear as missing-path findings; they do not establish an actual image request or deployed failure. See the [current register](asset-evidence.json) and [generated report](ASSET-RECONCILIATION-B3.md). No static absence or duplicate-content result proves non-use.

## Recovery verification and limitations

D1–D3 are CLOSED foundations. This pass reran all **172 lifecycle tests with every live opt-in enabled**, using synthetic data on three isolated loopback MongoDB processes inside an owned Docker container with networking disabled; two were replica sets, two required authentication. Database Tools **100.13.0** were used. The authenticated-view D2 artifact restored and verified on the separate D3 target, and child argv/environment, interruption/failure, source immutability and manifest protections passed. Synthetic verification artifacts were retained outside the repository; the owned container/volumes were removed. No existing application database or storage was used.

D2 is quiescent-verified, not an atomic snapshot: matching before/after metadata, counts and hashes cannot rule out an intervening change that was undone. D3 comparison covers collection set/type/options, counts, content hashes and index name/key order/uniqueness; it does not prove all index properties, application semantics, users/roles, object-storage recovery or production RTO/RPO. Sharded/cloud/staging/production targets are refused by these local/disposable tools. Verification failures preserve the disposable target/artifacts for diagnosis. Backups contain sensitive database bytes and need owner-approved encryption, retention and access controls in actual operations. See [backup](../../portal-api/docs/backup.md) and [restore verification](../../portal-api/docs/restore-verify.md).

## Final local validation

| Check | Result |
|---|---|
| Full offline API suite | 583 passed / 0 failed / 23 live opt-ins skipped (606 total); the 23 opt-ins passed separately below |
| Full client suite | 38 suites / 380 passed / 0 failed in the final combined workspace; original closure-only proof was 34 suites / 356 tests |
| Focused changed public/Productions suites | 30 passed; four actual defects reproduced before fixes |
| Authentication / force logout / IAM focused suite | 13 passed |
| Work Items / B2 / D1 / CLI focused suite | 74 passed before the final video-list extension; final full API covers all current tests; includes publish/delete race and optional case-study reference regressions |
| Full non-live lifecycle suite | 155 passed / 0 failed / 0 skipped; also covered by the 172/172 live-enabled run |
| Full live-enabled lifecycle suite | 172 passed / 0 failed / 0 skipped |
| Real CRM conversion integration | 6 passed / 0 failed / 0 skipped |
| Source inventory, endpoint CSV/C1, B3 check and architecture validator | PASS; exact source/inventory/endpoint CSV/C1/B3 check modes and architecture validator; counts 290 / 76 / 46 |
| Production client build / lint / diff check | PASS (`CI=true` production build); lint 0 errors / 1 existing unused Input warning in AttachmentPicker; diff check PASS |

Local integration exercised the 23 opt-ins skipped by the offline API command: six CRM and 17 lifecycle tests. External production/staging acceptance is not claimed by these results. A pre-existing client keyboard test was made deterministic by waiting for the dialog opening focus before sending arrow keys; runtime dialog behavior is unchanged. Two existing Linux process-observation tests now retry transient empty /proc command lines rather than marking the PID inspected as a version probe; real running-tool observations and all credential/pipe assertions remain required. Recovery runtime behavior is unchanged. Existing React test warnings and the existing AttachmentPicker lint warning remain reported. Browserslist reports an outdated local caniuse-lite database; no dependency/lockfile update was introduced. The offline HTML was rendered locally and its current/target controls, closure/deferred labels and counts were checked.

## Supported journey evidence

| Journey | Local validation and boundary |
|---|---|
| Login/authentication, portal routing and role navigation | Real password comparison/JWT and current-user API tests; route/access/session-refresh/navigation client tests; actual hosted sign-in/Google/session configuration needs acceptance |
| IAM users/roles/teams, role editor, force logout/system status | IAM, role registry, hierarchy, empty-role/override and PI IAM tests; deployed stored-role/browser round trip remains external |
| CRM Lead → Deal → Client | API transaction/session/idempotency tests, six real replica-set commit/rollback/concurrency tests, CRM client tests |
| Customers / Projects | Company projections/isolation, archive/link preservation and PUI client tests; historical orphan cleanup deferred |
| Services / Enrollments | API normalization/reference boundaries and delivery/client page/action tests; no new enrollment-driven workflow |
| Jobs / Productions workspace / Content Calendar | Jobs API reference/publication guards, Jobs/board/client tests, two new rendered Productions regressions and existing social/PI tests |
| Media / Files / Brand / Messages | Private-file/CV and tenant tests, media upload/reference checks, messaging/brand external-boundary and PI tests; live storage and delivered mail require acceptance |
| Vendor journey | Approval/concurrent retry/acceptance and RFQ/category/quotation ownership API tests plus vendor client tests; real staging invitations/mail still external |
| Public routes / Digital Services / Digital Solutions / CAS / Business Suite / Technology Solutions / Portfolio | Existing catalogue/navigation/core-product/banner/portfolio error-and-retry tests, seven Services reference-layout tests, Work Items public/detail/filter/retry and portal permission/editor tests, public API publication and delete-race tests and production build; retained decorative image limitation above |
| Careers / Contact | API private CV/upload guards, careers/CMS action tests and public route/build checks; actual inbound delivery, SMTP/EmailJS/provider configuration needs owner-controlled acceptance |

## Deployment acceptance — BLOCKED-EXTERNAL

No environment-only gate below is a Blueprint code blocker. **Do not deploy until the applicable release gates are signed off.** Cleanup-only evidence is identified separately and is not a prerequisite to deploying unchanged retained functionality. No production/staging credentials or authorization were supplied for this pass.

| Gate | Exact acceptance action / reason unavailable here | Requirement / owner |
|---|---|---|
| Staging MongoDB transactions | Authorized read-only `hello`; verify replica-set/sharded support; exercise conversions with synthetic staging records and verify idempotency/rollback | Release gate; deployment/database owner. Local replica-set proof passed; remote topology uninspected |
| Production MongoDB transactions | Authorized read-only `hello`; confirm topology/permissions before enabling conversion journeys; standalone intentionally returns 503 | Release gate; deployment/database owner |
| Role-editor real-session round trip | On staging, edit/save/reopen an approved stored role including less-visible permission keys; compare the API and browser; test revoked/empty permissions | Release gate; IAM owner/QA, requires authorized account/session |
| Public bucket variable names / storage | Inspect variable NAMES only (`AWS_S3_BUCKET`, aliases `S3_BUCKET`/`AWS_BUCKET_NAME`); verify public serving, distinct private configuration and authorized private download denial/expiry | Release gate; infrastructure/storage owner; never export values |
| Vendor staging journey / profiles | Approved synthetic vendor invitation → accept → login → category-matched published RFQ → own quotation; other vendors/clients denied. Count/resolve missing profiles before accepting affected historical accounts | Release gate for affected journey; procurement/IAM owner; requires environment/mail authorization |
| CMS drafts / selected values / W4 slides | Real editor versus anonymous draft checks; save/reopen settings/media overrides; verify Work Items draft → publish → anonymous view → archive, including gallery/video media and the separate work permissions; enter the four approved homepage slides if included in this release and confirm published selection | Release/content gate; CMS/content owner; no real CMS values read here |
| SMTP / contact / reset/invite delivery | Use authorized test inbox/provider sandbox; verify configured frontend URL, reset/invite links, contact/career delivery and visible failure with delivery unavailable | Release gate; infrastructure/content/IAM owner; no external message sent here |
| Hosted configuration and sessions | Owner verifies production secrets are configured without disclosure, correct frontend/API origins/CORS/proxy/rate-limit behavior and Google client ID if used; repeat role/customer/vendor smoke journeys | Release gate; deployment/QA owner |
| Production/staging recovery authorization | Owner approves platform backup/retention/encryption, users/roles and object coverage, and a restore rehearsal into an isolated approved target; record actual recovery acceptance/RTO/RPO | Release gate for production data; operations/database owner. Current D2/D3 tools must not be overridden to target production |
| CRM historical conversion integrity audit | Authorized read-only counts for conflicting/missing lead links, duplicate lead→deal links, missing deal customers/accounts and orphan conversion accounts/contacts | Cleanup-only unless a known affected live journey is found; CRM/data owner |
| RFQ duplicate/malformed-number aggregate | Authorized counts for duplicate, missing/null/malformed `rfqNumber`; decide exclusions/repair before any unique index | Cleanup/index-only; database/procurement owner; no safe historical assumption |
| Orphan projectId / customer owner / old RFQ budget | Authorized count-only joins for jobs/invoices/files/tickets/enrollments referencing missing Projects, missing customer owners, and old RFQ budget fields; review before cleanup | Cleanup-only; data owners; no production snapshot supplied |
| Persisted image / Media/File / opaque CMS evidence | Separately authorized minimized projections and local joins/token extraction under the existing B2/B3 design; storage/origin aliases and owner review | Cleanup-only; CMS/storage/data owners; no capture implementation added |
| Access logs / retention / coverage / external consumers | Owner confirms historic token-log retention/access restrictions, redaction and endpoint/public URL coverage; obtain adequate usage window (90 days if required by retirement policy) and consumer decisions | Required log-security operational sign-off; usage window is cleanup-only, not a code-closure prerequisite; operations/security owner |

## Deferred register — post-Blueprint, no new implementation phase

| Item | Classification | Reason / risk | Prerequisite | Later owner |
|---|---|---|---|---|
| Legacy Production retirement | DEFERRED | No complete persisted/consumer/log evidence; premature removal could orphan Jobs/Files/Media or external users | B2/B3 real-data linkage plus complete usage/consumer/owner decision and recovery evidence | Data/API owners |
| Original 143 asset candidates (137 current) / exact duplicates | DEFERRED | 38.82 MiB current static candidates are not proven unused; direct/public/external URLs and copies may matter | Minimized persisted/CMS joins, storage/origin reconciliation and external/archive decision; separate deletion approval | Content/storage owners |
| Evidence-dependent endpoint retirement / C2 | DEFERRED | C1 has 290 records, 19 review-required, 0 unresolved, usage NOT_COLLECTED; absence of tracked callers cannot establish non-use | Authorized usage/log coverage and consumer/owner sign-off | API/operations owners |
| D4 seed separation | DEFERRED | Not required by the current release; broad seeds could overwrite configuration/content | Separately approved reference/content baseline and operational need | Operations/application owner |
| D5 reset | DEFERRED | No reset authorized/required; destructive data loss risk | Explicit bounded non-production policy, retention/backup/restore proof and approval | Operations/data owner |
| Historical orphan / stale-role / legacy-field cleanup | DEFERRED | Production state unknown; live references may be intentional | Authorized counts, affected-record policy/owner review and recovery evidence | Relevant data/IAM owners |
| RFQ unique index | DEFERRED | Atomic allocation is tested; historic duplicate/null/malformed values could make index creation fail | BLOCKED-EXTERNAL data aggregate above and explicit index/repair plan | Database/procurement owner |
| Object-storage cleanup / CDN aliases / archive decisions | DEFERRED | DB references alone do not prove object non-use; private files/keys and external links need care | Complete reference and object identity/alias evidence, retention/ownership and separate approval | Storage/security/content owners |
| 90-day usage evidence / access-log collection | DEFERRED | Not collected; cannot retire consumers from source evidence | BLOCKED-EXTERNAL provider access, coverage/retention agreement and consumer review | Operations/API owners |
| Social pricing decorative image / legacy image-registry metadata | DEFERRED | No proven replacement for `82.jpg`; retained dead selectors may have stored values. Pricing/contact remains usable | Content-approved CMS override; separately reviewed metadata/persisted-value cleanup | Content owner |
| Productions action-control presentation parity | DEFERRED | Some legacy controls remain visible to read-only users and can return 403; API authorization remains intact | Bounded UI review using existing `jobs.write/delete` checks; no RBAC redesign | Portal owner |
| Deprecated bucket aliases / local ignored Strapi / remaining optional cleanup | DEFERRED | Compatibility and ownership evidence incomplete; no current supported-runtime dependency shown | Environment/owner decision and explicit removal approval | Infrastructure/repository owner |

## Known limits, deployment prerequisites and next action

This is tested code closure, not a live penetration test, production data-integrity certificate, storage inventory, mail delivery proof or recovery-time guarantee. Automated client journeys mock API boundaries; the six CRM and 172 recovery tests use real isolated synthetic MongoDB. Vendor onboarding retains its documented resumable compensation/crash window; no new vendor transaction framework was introduced. Database references are not universal foreign keys. Public assets/external origins can fail independently of repository code; the remaining cosmetic background requires a content decision. No asset, endpoint or legacy Production deletion is authorized.

The next action is **review this uncommitted closure pass and its regression evidence**, then authorize the listed staging/release acceptance actions for explicitly identified environments and test accounts. No new R5 project, capture command, seed/reset or cleanup operation is implied. Production deployment requires the applicable transaction/session/storage/mail/configuration/recovery gates above; production historical/usage cleanup evidence is required only before the corresponding later change or if an actual affected live journey is discovered.

The parked **Expresso Operating Model remains future work**: Lead → Deal → Proposal/Contract → Won → Client; service enrollment, recurring Jobs/deliverables and phase delivery; Content Calendar/client approvals; Team Lead and approval matrix; delegation/account ownership; contract amendments and carry-forward obligations. None was implemented to close the Blueprint.
