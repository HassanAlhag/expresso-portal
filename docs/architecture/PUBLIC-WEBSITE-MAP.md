# Public website map

[Blueprint](EXPRESSO-SYSTEM-BLUEPRINT.html) · [Executive summary](README.md) · Baseline `58b8f86c`.

**Website Stage 4 (W4):** code complete and committed; homepage CMS content (four new slides) pending manual entry. See [REMEDIATION-PLAN.md](REMEDIATION-PLAN.md#website-stage-4-w4-code-complete-and-committed-cms-content-pending). Rows below reflect the W4 code.

Public routes below come from [App.js](../../client/src/App.js), not inferred from menu labels. Shared header/footer/settings and image overrides can add reads to many pages. No route or CMS data was changed during this audit.

## Page → source → API → model → editability

| Public section / route | React entry and data source | API / controller | Model/settings | CMS editable? |
|---|---|---|---|---|
| Home `/` | `pages/Home/home.jsx`; Banner, static statistics/services/showcase/testimonials/gallery copy, settings image overrides, published reels | `/homepage/slides/public` → listPublicSlides; `/jobs/public/website` → listPublicWebsiteJobs (published, website-visible jobs; an allowlist of reel fields only since the PI tail); `/site-settings/public` → getPublicSettings | HeroSlide, Job/Media, SiteSettings | Slides, reels publication and media/settings yes; much copy and homepage service-card definitions are code. Slide eyebrows are optional: a blank eyebrow stays blank (W4) |
| About `/about-us` | `pages/AboutUs/aboutUs.jsx`; static team/story, settings imagery | `/site-settings/public` | SiteSettings/Media | Mainly assets; public team is not IAM Team/User or HRStaff |
| Services `/services` | `ServiceMain/serviceMain.jsx`; live service cards with loading, error/retry and empty states (W4), static process/proof/testimonials with image/copy fallbacks; `#clients` anchor wraps existing proof section | `/web-content/services` → listServices; settings | DigitalService, SiteSettings/Media | Service records yes; page copy/settings support varies by actual schema, not every pageCopy property is a declared editable field |
| Service detail `/service/:slug` | Generic `Services/ServiceDetailPage.jsx`; older hard-coded service pages are not routed | `/web-content/services/:slug` → getServiceBySlug | DigitalService blocks/hero | Yes for stored record fields; renderer types are code |
| Digital Solutions `/digital-solutions` | `DigitalSolutionsPage.jsx` catalogue (CAS and Expresso Business Suite); `useDigitalProducts` + `mergeDigitalProducts` combine core discovery with published CMS data | `/web-content/solutions?kind=digital` → listSolutions | Solution + code registry | CMS enriches core marketing metadata/adds products; cannot remove core CAS by emptying CMS |
| Digital detail `/digital-solutions/:slug` | `DigitalSolutionDetailPage` custom-page registry, else shared ITSolutionDetailsPage | Generic records use `/web-content/solutions/:slug` → getSolutionBySlug | Solution; custom pages in code | Generic blocks yes; custom CAS long page remains code |
| CAS `/digital-solutions/cas` | `Products/CASPage.jsx`, `data/casProduct.js`, real bundled product screenshots | No CAS CMS lookup required for custom page | Core/static product configuration | Discovery overrides yes; full page is not editable through Solution blocks |
| Business Suite `/digital-solutions/business-suite` | `Products/BusinessSuitePage.jsx`, `data/businessSuiteProduct.js`, sanitised SVG product views in `public/images/products/business-suite/` | No CMS record required; a published `business-suite` Solution can override presentation and blocks | Core/static product configuration | Discovery overrides and existing Solution blocks yes; page layout is code |
| Legacy CAS `/products/cas` | React Navigate replace | No dedicated API | None | Canonical redirect to `/digital-solutions/cas` |
| Technology `/it-solutions` | Grouped ITSolutionsPage; approved group metadata/fallback helper; vendor panel | `/web-content/solutions` → listSolutions; settings | Solution (non-digital), SiteSettings; code fallback taxonomy | Solution/group/image data yes; four approved fallback groups remain code-supported |
| Technology detail `/it-solutions/:slug` | Shared ITSolutionDetailsPage, block renderer and CTA | `/web-content/solutions/:slug` → getSolutionBySlug | Solution | Yes; wrong-section records redirect to their canonical section |
| Visual portfolio `/portfolio` | PortfolioGalleryPage + usePortfolioItems (loading, error/retry and empty states, W4) | `/portfolio?status=published&limit=50&sort=sortOrder` → listPortfolio | Portfolio/Media | Yes; client requests published-only but server does not force that boundary |
| Case studies `/case-studies` | Portfolio page + PortfolioGrid + same published-items hook (same states) | Same Portfolio list controller | Portfolio/Media | Yes, same collection rather than a second case-study CMS |
| Case detail `/case-studies/:id` | SingleViewPortfolio + usePortfolioItem (not found only for HTTP 404; other failures show error/retry) | `/portfolio/:slug` accepts slug or ObjectId → getPortfolioBySlug | Portfolio/Media | Yes; public detail does not independently restrict publication status |
| Contact `/contact-us` | Contact page, ContactInfo/Map, ContactForm | Browser → EmailJS; settings read for imagery | No API CRM write in the contact-form path | Contact text/map/social destination largely code; images/settings limited |
| Build Your Plan `/build-your-plan` | PlanBuilder component; service/pricing presets in code | POST `/public/plan-submissions` → submitPlanBuilder → ensureContactForLead | CRMLead + CRMContact | Not a CMS lead system; creates operational data. It does not automatically create an invoice/project |
| Vendor `/vendor-registration` | Existing three-step company/category/review form; public header hidden | `/procurement/categories/tree` → getCategoryTree; POST `/vendor-applications` → registerVendorApplication | ProcurementCategory, VendorApplication | Categories managed in portal; registration is business intake, not CMS |
| Careers `/careers` | CareerPage vacancy list and application dialog | `/careers/public` → listPublicCareers; POST `/careers/cv-upload` → uploadCV; POST `/careers/:id/apply` → applyForJob | Career, JobApplication, private CV key | Vacancies yes; candidate records are business data |
| Work With Us | Navigation grouping; no standalone `/work-with-us` route | Links to plan, contact, vendor registration and careers | None separate | Navigation structure is code |
| Pricing `/pricing/web-dev`, `/pricing/seo`, `/pricing/google-ads`, `/pricing/social-media` | Existing Pricing pages and code-defined offers/contact components | Contact flows may use EmailJS; not internal ServiceTemplate catalog | Static copy/presets, shared image settings where used | Mostly no |
| Campaign landing `/marketing-solutions` | WebMarketing + LandingHero and its valid `#lead-form` | EmailJS directly; settings/assets | No CRM write in that form path | Mostly code/settings imagery |
| Thank-you `/greetings` | ThankYouPage | None dedicated | None | Static workflow result, intentionally excluded from sitemap |
| Unknown routes | NotFoundPage | None dedicated | None | `/contact`, `/privacy`, `/terms`, `/our-portfolio`, `/portfolio/detail`, `/productions` are not current public React routes |

API prefixes in this table are relative to `/api`. Controller files: [web-content](../../portal-api/src/modules/web-content/webContent.controller.js), [homepage slides](../../portal-api/src/modules/homepage/slide.controller.js), [settings](../../portal-api/src/modules/homepage/settings.controller.js), [jobs](../../portal-api/src/modules/content/jobs/job.controller.js), [portfolio](../../portal-api/src/modules/portfolio/portfolio.controller.js), [public intake](../../portal-api/src/modules/public/public.controller.js), [careers](../../portal-api/src/modules/careers/application.controller.js), [vendor applications](../../portal-api/src/modules/procurement/vendor-application.controller.js).

## Core/static definitions that survive empty CMS

- [coreDigitalProducts.js](../../client/src/data/coreDigitalProducts.js): discovery registry, merge by stable slug, whitelist of nonblank presentation overrides, canonical identity/ownership, ordering, deduplication.
- [businessSuiteProduct.js](../../client/src/data/businessSuiteProduct.js): Expresso Business Suite discovery metadata, default module/workflow blocks (existing Solution block shapes) and illustrative product views; registered as a core product beside CAS.
- [casProduct.js](../../client/src/data/casProduct.js): existing CAS name/routes/discovery metadata, long copy and screenshot metadata reused by the registry/home/custom page. No duplicate full product page.
- `DigitalSolutions/customPages.js`: lazy custom page mapping and slug fallback; generic products use shared Solution detail rendering.
- `technologyGroupsFallback.json`, `technologyGroups.js` and API `technologyGroups.js`: approved legacy group assignments. They group existing records; they do not fabricate missing Technology cards.
- Brand module, local assets, page copy/pricing presets and renderer block types remain application definitions. `websiteImageRegistry.js` maps image slots/legacy source locations; a string mentioning an old route does not make that route active.

## Loading, publication and reset behaviour

| Surface | Empty / failed data result at this baseline |
|---|---|
| Digital discovery | Core CAS and Business Suite remain once each while metadata loads, after zero CMS results and during API errors. Error/retry stays visible without removing core products. Published CMS CAS enriches one card; future digital records add cards. |
| Solution detail | HTTP 404 shows Not Found; other HTTP/network/invalid responses show Unavailable with retry. Stale/unmounted requests are ignored. CAS custom route does not depend on this lookup. |
| Technology landing | Explicit loading/error/genuine empty state; groups and cards only for actual Technology records; CAS remains excluded. |
| Services | Loading, HTTP/network/invalid-response error with retry, genuine empty and success are distinct (W4). Service detail handling is unchanged. |
| Portfolio | Published-items helper rejects HTTP/network/invalid responses (never cached); `/portfolio` and `/case-studies` show error with retry, distinct from empty; case detail shows Not Found only for HTTP 404 (W4). |
| Site settings | Cached/default UI can render on failure; If the singleton is missing, both reads return the model defaults without writing; the first admin save creates it (R4-B, P2-6). Multiple caches can delay visible edits. |
| Homepage slides | Published HeroSlide records in `order`, then newest first; one code fallback slide when none load. Blank eyebrows stay blank on the website, in the portal form and preview, and when a slide is created through the API; records without eyebrow fields keep the old defaults (W4). |
| Navigation | Successful CMS reads are session-cached; uncached failures retry on focus; core Digital discovery always remains available. |

The static sitemap now lists 35 canonical public paths (W4 added `/digital-solutions/business-suite`) and excludes portal/auth/vendor/thank-you workflows. It is not generated from live CMS publication: future slugs require an update, and a database wipe can leave indexed detail URLs without content. Missing approved legal/social content is a content decision, not a reason to invent routes or seed data.

CMS editing is not proof of server publication safety. Confirmed: public Portfolio and Production reads accept `status=draft`, Services/Solutions lists accept `includeInactive`, and their slug details ignore status ([remediation P0-1](REMEDIATION-PLAN.md)). Homepage slides, careers, homepage reels and procurement categories already filter server-side. See also [API map](API-MAP.md). The blueprint describes current code, not a verified set of currently published records.
