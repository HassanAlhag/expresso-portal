# R5-B3 — asset reconciliation evidence

Status: **CLOSED — offline evidence foundation**. [Blueprint closure](BLUEPRINT-CLOSURE.md) is authoritative. Asset cleanup, legacy Production retirement, evidence-dependent endpoint retirement and persisted cleanup are DEFERRED; no such operation is authorized. No asset is authorized for deletion. This B3 report uses repository evidence only; no real database/CMS/storage/deployed API/log evidence was collected.

Generated offline by `node docs/architecture/generate-asset-evidence.cjs`; freshness: `node docs/architecture/generate-asset-evidence.cjs --check`. Sources: [asset register](asset-evidence.json), [complete field inventory/capture plan](asset-reference-plan.json), [reviewed policy](asset-evidence-policy.json), [evidence procedure](ASSET-EVIDENCE-PLAN.md).

## Scope and totals

Public/source asset roots and supported media/font/document extensions are explicit in policy. Ordinary source/configuration, dependencies and ignored builds are not cleanup candidates. The 17 tracked files with supported asset extensions excluded by policy are operational text or reference documentation/design files outside deployable roots; their exact paths and exclusion reasons are recorded in the JSON. Entry HTML/PWA configuration is reference evidence, not a removable asset. The Barlow font license is a separately protected companion. No in-scope tracked video/audio/downloadable binary documents currently exist.

| Measure | Assets | Bytes | MiB |
|---|---:|---:|---:|
| B3 total | 326 | 140887425 | 134.36 |
| Historical media/font scope | 325 | 140883047 | 134.36 |
| Historical basename/text comparison | 186 | — | — |
| Historical without basename/text match | 139 | 41431690 | 39.51 |
| Resolved runtime-module/public-config references | 184 | 99384801 | 94.78 |
| Resolved code incl. unreachable/operator | 184 | 99384801 | 94.78 |
| Protected | 11 | 939362 | 0.90 |
| Candidate pending evidence (no runtime reference/protection) | 137 | 40708174 | 38.82 |

The prior 325/180/145 count is not reproduced by its coarse filename-substring comparison. The four W4 homepage assets are still protected independently of that detector; subtracting them leaves 135 historical candidates, with no deletion authority. B3's extra font license and stricter path/provenance rules explain its different totals. Coarse substring-only matches without resolved runtime evidence: client/public/3.png, client/public/4.png. These are not silently counted as references. A declaration in a reachable module is static evidence, not proof of current rendered/deployed use.

## Classifications and candidate bytes

Classifications overlap; byte columns must not be summed across rows. Primary classifications are mutually exclusive and available in the JSON summary. Every record has deletionAuthorized=false and complete=false. Dynamic surface sets denote possible binding, never an observed database relationship.

| Classification | All assets | All bytes | Candidate assets | Candidate bytes |
|---|---:|---:|---:|---:|
| STATICALLY_REFERENCED | 184 | 99384801 | 0 | 0 |
| PROTECTED | 11 | 939362 | 0 | 0 |
| DYNAMIC_REFERENCE_POSSIBLE | 326 | 140887425 | 137 | 40708174 |
| DATABASE_EVIDENCE_REQUIRED | 326 | 140887425 | 137 | 40708174 |
| CMS_EVIDENCE_REQUIRED | 307 | 139032283 | 124 | 39366198 |
| STORAGE_EVIDENCE_REQUIRED | 326 | 140887425 | 137 | 40708174 |
| EXTERNAL_CONSUMER_POSSIBLE | 326 | 140887425 | 137 | 40708174 |
| UNRESOLVED | 137 | 40708174 | 137 | 40708174 |

## Protected paths

| Path | Evidence / reason |
|---|---|
| client/public/Barlow/OFL.txt | Font license shipped with retained Barlow fonts; retain the license with the font package. |
| client/public/brand/apple-touch-icon.png | Current public entry HTML/PWA icon configuration |
| client/public/brand/favicon-32.png | Current public entry HTML/PWA icon configuration |
| client/public/brand/maskable-512.png | Current public entry HTML/PWA icon configuration |
| client/public/favicon.ico | Current public entry HTML/PWA icon configuration; Current public entry HTML/PWA icon configuration |
| client/public/images/homepage/expresso-hero-01-one-digital-partner.webp | Approved W4 homepage slide; CMS entry still an evidence requirement, not permission to delete. |
| client/public/images/homepage/expresso-hero-02-digital-services.webp | Approved W4 homepage slide; CMS entry still an evidence requirement, not permission to delete. |
| client/public/images/homepage/expresso-hero-03-digital-solutions.webp | Approved W4 homepage slide; CMS entry still an evidence requirement, not permission to delete. |
| client/public/images/homepage/expresso-hero-04-technology-solutions.webp | Approved W4 homepage slide; CMS entry still an evidence requirement, not permission to delete. |
| client/public/logo192.png | Current public entry HTML/PWA icon configuration |
| client/public/logo512.png | Current public entry HTML/PWA icon configuration |

The four homepage paths and exact bytes were confirmed against W4 commit 3d0fd785 and its roadmap content-entry instruction. Public entry HTML/PWA icon references protect only existing configured assets; missing configured assets are integrity findings. The font license remains with the retained font package. Protection is not expanded to every static declaration.

## Reference method and gaps

Assets remain Git-tracked. Reference inputs include tracked text plus current application source below client/src and portal-api/src, including review-before-commit modules; ignored builds, dependencies, hidden files and symlinks are excluded from that source walk. This keeps offline evidence consistent with source-inventory.json without staging files.

JS/JSX/TS/TSX are parsed without execution; lexical constants, concatenations and resolvable templates, imports/require, JSX/HTML attributes, CSS URLs, JSON values and Markdown links are normalized. Bare names resolve only to an exact public-root path under a documented convention; nested assets are never matched by basename. Tests, comments, documentation, unreachable modules and operator sources have separate provenance. Stable source/context anchors avoid unrelated line-number churn. Public URLs can be used by bookmarks, search, emails, social links, external websites or CDNs even with no repository reference. External origins never become local paths without an approved alias map. No ignored build is counted as independent evidence; tracked entry configuration/imports describe expected build behavior only.

There are 205 dynamic source sites and 0 unresolved source parses. Finite computed paths, cross-module values, generated content and opaque runtime values can exceed this bounded static analysis. No absence conclusion is permitted.

## Integrity (separate from unused candidates)

Findings describe repository resolution, not a proven deployed 404. Runtime upload namespaces and unmapped external URLs are separately retained in JSON. No repair was made.

| Code | Provenance | Source | Candidate / context |
|---|---|---|---|
| PATH_REQUIRES_URL_ENCODING | TRACKED_ASSET | tracked asset | client/public/HomePage Slider - 1.jpg |
| PATH_REQUIRES_URL_ENCODING | TRACKED_ASSET | tracked asset | client/public/HomePage Slider - 1.webp |
| NOT_IN_TRACKED_ASSETS | RUNTIME_SOURCE | client/src/components/CaseStudySection/caseStudySection.jsx | client/public/gal2.webp |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/data/coreDigitalProducts.test.js | client/public/approved-cas.webp |
| NOT_IN_TRACKED_ASSETS | RUNTIME_SOURCE | client/src/data/websiteImageRegistry.js | client/public/82.jpg |
| NOT_IN_TRACKED_ASSETS | RUNTIME_SOURCE | client/src/data/websiteImageRegistry.js | client/public/creatives/posts/post1.jpg |
| NOT_IN_TRACKED_ASSETS | RUNTIME_SOURCE | client/src/data/websiteImageRegistry.js | client/public/gal2.webp |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/hooks/portfolioPages.test.jsx | client/public/gal2.webp |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/hooks/portfolioPages.test.jsx | client/public/gal2.webp |
| NOT_IN_TRACKED_ASSETS | RUNTIME_SOURCE | client/src/pages/AboutUs/aboutUs.jsx | client/public/gal2.webp |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/DigitalSolutions/DigitalSolutionsPage.test.jsx | client/public/approved-cas.webp |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/DigitalSolutions/DigitalSolutionsPage.test.jsx | client/public/approved-suite.webp |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/PortfolioGallery/portfolioWork.test.jsx | client/public/legacy.mp4 |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/PortfolioGallery/portfolioWork.test.jsx | client/public/reel-1.mp4 |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/PortfolioGallery/portfolioWork.test.jsx | client/public/legacy.mp4 |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/PortfolioGallery/portfolioWork.test.jsx | client/public/reel-1.mp4 |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/PortfolioGallery/portfolioWork.test.jsx | client/public/s.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Products/BusinessSuitePage.test.jsx | client/public/approved-suite.webp |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Services/ServiceDetailPage.test.jsx | client/public/p1.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Services/ServiceDetailPage.test.jsx | client/public/p2.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Services/ServiceDetailPage.test.jsx | client/public/p5.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Services/ServiceDetailPage.test.jsx | client/public/p.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Services/ServiceDetailPage.test.jsx | client/public/s1.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Services/ServiceDetailPage.test.jsx | client/public/p1.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Services/ServiceDetailPage.test.jsx | client/public/p2.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Services/ServiceDetailPage.test.jsx | client/public/p5.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Services/ServiceDetailPage.test.jsx | client/public/s1.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Services/ServiceDetailPage.test.jsx | client/public/s5.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Services/ServiceDetailPage.test.jsx | client/public/b.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Services/ServiceDetailPage.test.jsx | client/public/p.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/pages/Services/ServiceDetailPage.test.jsx | client/public/s.png |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/portal/app/r4aAccess.test.jsx | client/public/brief.pdf |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/portal/app/r4aAccess.test.jsx | client/public/brief.pdf |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/portal/features/dashboard/client/clientPortal.test.js | client/public/brief.pdf |
| UNSUPPORTED_SCHEME | TEST | client/src/portal/features/hr/hr.test.js | property:receiptUrl |
| NOT_IN_TRACKED_ASSETS | TEST | client/src/portal/features/jobs/jobs.test.js | client/public/a.png |
| UNSUPPORTED_SCHEME | TEST | client/src/portal/features/procurement/procurement.test.js | property:url |
| UNSUPPORTED_SCHEME | TEST | client/src/portal/features/procurement/vendor/vendorPortal.test.js | property:url |
| MALFORMED_URL | UI_PLACEHOLDER | client/src/portal/features/website/pages/WebsiteSettingsPage.jsx | property:placeholder |
| NOT_IN_TRACKED_ASSETS | RUNTIME_SOURCE | client/src/utils/websiteImages.js | client/public/gal2.webp |
| NOT_IN_TRACKED_ASSETS | OPERATOR_SOURCE | portal-api/src/scripts/checkPrivateStorage.js | client/public/check.txt |
| NOT_IN_TRACKED_ASSETS | OPERATOR_SOURCE | portal-api/src/scripts/checkPrivateStorage.js | client/public/check.txt |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/files.test.js | client/public/contract.pdf |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/files.test.js | client/public/jane.pdf |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/files.test.js | client/public/report.pdf |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/files.test.js | client/public/private/files/someone-elses.pdf |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/lifecycle/fixtures.js | client/public/media/2026/a.jpg |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/lifecycle/restoreverify.test.js | client/public/notes.txt |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/pi-jobs.test.js | client/public/draft.mp4 |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/pui5-external-boundaries.test.js | client/public/brief.pdf |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/r4d-single-sources.test.js | client/public/a.pdf |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/r4d-single-sources.test.js | client/public/a.png |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/r4d-single-sources.test.js | client/public/media/a.png |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/r4d-single-sources.test.js | client/public/media/old.pdf |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/work-items.test.js | client/public/clip.mp4 |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/work-items.test.js | client/public/poster.jpg |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/work-items.test.js | client/public/sudatel-thumb.png |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/work-items.test.js | client/public/poster.jpg |
| NOT_IN_TRACKED_ASSETS | TEST | portal-api/test/work-items.test.js | client/public/clip.mp4 |

## Duplicate evidence

Exact duplicate groups: **12**; repeated bytes after one copy per group: **1375870**. Same-basename groups: **0**. Same-stem/different-format-or-bytes groups: **92** (not proof of visual equivalence). Neither duplication nor a smaller representation authorizes consolidation/deletion. All exact groups, hashes and paths are in the JSON.

| Exact duplicate paths | Bytes per copy |
|---|---:|
| client/public/business.webp ; client/public/it-solutions/software-licensing.webp | 55160 |
| client/public/creative.webp ; client/public/it-solutions/networking-hardware.webp | 42948 |
| client/public/it-solutions/web-hosting-domains.webp ; client/public/web-banner.webp | 69058 |
| client/public/developing.webp ; client/public/it-solutions/crm-solution.webp | 37020 |
| client/public/it-solutions/iot-solutions.webp ; client/public/some.webp | 95600 |
| client/public/ideas.webp ; client/public/it-solutions/it-consultation.webp | 252794 |
| client/public/52.webp ; client/public/it-solutions/data-center-hardware.webp | 119090 |
| client/public/it-solutions/queue-management.webp ; client/public/sample.webp | 36648 |
| client/public/it-solutions/erp-solution.webp ; client/public/professional.webp | 28988 |
| client/public/it-solutions/cloud-services.webp ; client/public/web-plan.webp | 155216 |
| client/public/image3.webp ; client/public/it-solutions/data-center.webp | 452000 |
| client/public/it-solutions/vas-solutions.webp ; client/public/landinghero.webp | 31348 |

## Persisted field inventory and future capture

All **47 models**, **1061 schema leaf fields** and **270 selected reference/context surfaces** are inventoried in asset-reference-plan.json. SiteSettings helper-returned image URL/Media fields are expanded. Generic Mixed/Object/Map values, arrays, rich text/HTML/Markdown and unknown legacy fields require bounded local token extraction; never export complete documents or raw blobs. Each selected surface defines its expected type, normalization, target kind, nesting, rich-text requirement, context and sanitized unresolved reporting. No future capture command is implemented or authorized by B3.

| Model / collection | Exact fields requiring later evidence |
|---|---|
| AccessRequest / accessrequests | No currently identified asset-bearing field; schema inventory retained for drift detection |
| Audit / audits | meta |
| BrandAsset / brandassets | mediaId; notes; url; value |
| Career / careers | requirements[]; responsibilities[]; summary |
| Counter / counters | No currently identified asset-bearing field; schema inventory retained for drift detection |
| CRMAccount / crmaccounts | notes; website |
| CRMActivity / crmactivities | body |
| CRMContact / crmcontacts | notes |
| CRMDeal / crmdeals | notes |
| CRMLead / crmleads | notes |
| Customer / customers | logoMediaId; logoUrl; notes |
| DeliveryPeriod / deliveryperiods | adjustments[]._id |
| DigitalService / digitalservices | blocks; description; heroImageMediaId; heroImageUrl; imageMediaId; imageUrl |
| Enrollment / enrollments | adoptionMappings[]._id; finalScope.groups[].description; finalScope.groups[].jobs[].analyticsUrl; finalScope.groups[].jobs[].checklist[].text; finalScope.groups[].jobs[].contentPhase; finalScope.groups[].jobs[].description; finalScope.groups[].jobs[].executionPageUrl; finalScope.groups[].jobs[].parentGoalUrl; notes; overrides.customGroups[].description; overrides.customGroups[].jobs[].analyticsUrl; overrides.customGroups[].jobs[].checklist[].text; overrides.customGroups[].jobs[].contentPhase; overrides.customGroups[].jobs[].description; overrides.customGroups[].jobs[].executionPageUrl; overrides.customGroups[].jobs[].parentGoalUrl; overrides.notes |
| File / files | customerId; filename; jobId; notes; productionId; projectId; url |
| HeroSlide / heroslides | ctaUrl; imageMediaId; imageUrl; secondaryCtaUrl; thumbImageMediaId; thumbImageUrl |
| HRExpense / hrexpenses | description; notes; receiptMediaId; receiptUrl |
| HRLeave / hrleaves | notes |
| HRStaff / hrstaffs | learningGoals[].description; notes; scorecards[].notes |
| Invite / invites | No currently identified asset-bearing field; schema inventory retained for drift detection |
| Invoice / invoices | items[].description; notes; uploads[].url |
| Job / jobs | analyticsUrl; approvalChecklist[].text; approvalSteps[].instructions; caption; concept; contentPhase; coverMedia; draftMediaId; executionPageUrl; externalPostUrl; finalMediaId; media[]; notes; parentGoalUrl; posterMediaId; productionId; script; shotList; storyboard |
| JobApplication / jobapplications | coverLetter; cvKey; cvMediaId; cvUrl; notes |
| KPICheckin / kpicheckins | notes |
| KPIGoal / kpigoals | notes |
| KPIIndicator / kpiindicators | description |
| Media / media | filename; mediumS3Key; mediumUrl; s3Key; thumbnailS3Key; thumbnailUrl; url |
| Message / messages | attachmentUrls[]; body |
| Portfolio / portfolios | bannerDesc; bannerImage; coverMedia; description; excerpt; gallery[]; imageUrls[].src; introDescription; problems; result; solutionImage; solutions[]; thumbnailImg |
| ProcurementCategory / procurementcategories | description; heroImageMediaId; heroImageUrl; icon |
| ProcurementRequest / procurementrequests | description; notes; requirements |
| ProcurementVendor / procurementvendors | notes; website |
| Production / productions | coverMedia; description; excerpt; gallery[] |
| Project / projects | adoptionMappings[]._id; description; notes |
| Quotation / quotations | attachments[].url; notes |
| RFQ / rfqs | attachments[].url; description |
| Role / roles | description |
| ScorecardTemplate / scorecardtemplates | notes |
| ServiceTemplate / servicetemplates | approvals.checklist[].text; approvals.steps[].instructions; coverImageId; description; files.mediaRefs[]; files.uploads[]; scopeGroups[].description; scopeGroups[].jobs[].analyticsUrl; scopeGroups[].jobs[].checklist[].text; scopeGroups[].jobs[].contentPhase; scopeGroups[].jobs[].description; scopeGroups[].jobs[].executionPageUrl; scopeGroups[].jobs[].parentGoalUrl; sla.notes; summary |
| SiteSettings / sitesettings | about.blueprintCustomerImageMediaId; about.blueprintCustomerImageUrl; about.blueprintInnovationImageMediaId; about.blueprintInnovationImageUrl; about.blueprintQualityImageMediaId; about.blueprintQualityImageUrl; about.heroImageMediaId; about.heroImageUrl; about.missionDeviceImageMediaId; about.missionDeviceImageUrl; about.missionImageMediaId; about.missionImageUrl; about.teamAfridImageMediaId; about.teamAfridImageUrl; about.teamHassanImageMediaId; about.teamHassanImageUrl; about.teamMohamedImageMediaId; about.teamMohamedImageUrl; about.teamNazimImageMediaId; about.teamNazimImageUrl; about.teamPhotoMediaId; about.teamPhotoUrl; about.teamSaadImageMediaId; about.teamSaadImageUrl; about.teamSwekshyaImageMediaId; about.teamSwekshyaImageUrl; about.teamYasirImageMediaId; about.teamYasirImageUrl; branding.faviconMediaId; branding.faviconUrl; branding.logoMediaId; branding.logoUrl; branding.logoWhiteMediaId; branding.logoWhiteUrl; branding.ogImageMediaId; branding.ogImageUrl; careers.heroImageMediaId; careers.heroImageUrl; careers.officeImageMediaId; careers.officeImageUrl; contact.heroImageMediaId; contact.heroImageUrl; contact.officeImageMediaId; contact.officeImageUrl; gallery.images[].mediaId; gallery.images[].url; home.heroBannerMediaId; home.heroBannerUrl; home.heroVideoUrl; homepageSections.aboutImageMediaId; homepageSections.aboutImageUrl; homepageSections.servicesImageMediaId; homepageSections.servicesImageUrl; itSolutions.cloudServicesHeroImageMediaId; itSolutions.cloudServicesHeroImageUrl; itSolutions.crmSolutionHeroImageMediaId; itSolutions.crmSolutionHeroImageUrl; itSolutions.dataCenterHardwareHeroImageMediaId; itSolutions.dataCenterHardwareHeroImageUrl; itSolutions.dataCenterHeroImageMediaId; itSolutions.dataCenterHeroImageUrl; itSolutions.erpSolutionHeroImageMediaId; itSolutions.erpSolutionHeroImageUrl; itSolutions.heroDescription; itSolutions.heroImageMediaId; itSolutions.heroImageUrl; itSolutions.iotSolutionsHeroImageMediaId; itSolutions.iotSolutionsHeroImageUrl; itSolutions.itConsultationHeroImageMediaId; itSolutions.itConsultationHeroImageUrl; itSolutions.networkingHardwareHeroImageMediaId; itSolutions.networkingHardwareHeroImageUrl; itSolutions.queueManagementHeroImageMediaId; itSolutions.queueManagementHeroImageUrl; itSolutions.softwareLicensingHeroImageMediaId; itSolutions.softwareLicensingHeroImageUrl; itSolutions.vasSolutionsHeroImageMediaId; itSolutions.vasSolutionsHeroImageUrl; itSolutions.webHostingDomainsHeroImageMediaId; itSolutions.webHostingDomainsHeroImageUrl; marquee.brands[].imageUrl; marquee.brands[].mediaId; portfolio.heroImageMediaId; portfolio.heroImageUrl; services.clientsDescription; services.contactContent; services.heroImageMediaId; services.heroImageUrl; services.processDescription; services.sectionBgMediaId; services.sectionBgUrl; websiteImages.images[].key; websiteImages.images[].mediaId; websiteImages.images[].url |
| SocialMetrics / socialmetrics | notes |
| Solution / solutions | blocks; demoCtaHref; description; heroImageMediaId; heroImageUrl; icon |
| Team / teams | description |
| Ticket / tickets | comments[].body; comments[].eventMeta; description |
| User / users | avatarMediaId; avatarUrl; notes |
| VendorApplication / vendorapplications | notes; website |
| WorkItem / workitems | cover.media; cover.src; gallery[].media; gallery[].src; shortDescription; video.media; video.src; videos[].media; videos[].src |

Production.coverMedia/gallery, File.productionId and Job.productionId remain legacy ownership evidence requiring B4 and real-data approval. Production models/routes/permissions/assets are untouched. Additional current surfaces include Enrollment scope URLs/instructions, Ticket comments.eventMeta, Audit.meta, and CRM/content text/URLs. Private CV/application and customer/user references must be minimized locally; output matched known repository paths or HMAC handles, never names/emails, raw private keys or signed URL queries.

## Deferred follow-up

This offline foundation is closed. Only if later prioritized and separately authorized, consider a minimized read-only capture of the listed fields and Media/File joins in an explicitly approved environment. Reconcile storage/CDN aliases and obtain an external-consumer/archive decision. All asset deletion remains unauthorized until complete evidence and explicit separate approval. B4, C2+, D4/D5, R5-E, Operating Model and Portal Implementation are not started here.
