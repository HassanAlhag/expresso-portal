# Stage 3.5 public website functional cleanup

Branch: `website/integrated-solutions`, based on `454f9981`.

## Functional changes

- Home's Services, gallery and final “Build Your Plan” buttons use the existing
  `/build-your-plan` route. “Request reels like these” uses the existing contact
  form at `/contact-us?interest=reels`.
- Corrected every literal public `/contact` destination, including shared CTA
  defaults and the legacy sidebar. Portal routes are unchanged. The remaining
  `#lead-form` links belong to the marketing landing page, which contains that form.
- `/services#clients` targets the existing clients introduction and logo section.
  The page scrolls after lazy mounting, with clearance for the fixed navigation.
- Footer Instagram uses the company URL already present in ContactInfoSection.
  Removed placeholder social links and unavailable legal links rather than
  linking to Home/404 or inventing content.
- Sitemap contains 34 existing canonical public routes. Corrected Home and
  portfolio URLs, retained Digital Solutions/CAS, added Technology and its 12
  active details plus other public navigation destinations. Redirects, thank-you,
  portal/auth and vendor workflow routes are excluded. This remains a static
  sitemap; future published CMS slugs require a corresponding sitemap update.
- Digital Solutions distinguishes loading, successful empty CMS results and
  HTTP/network/invalid-response errors, with retry and existing contact links.
- Shared Technology/Digital details reserve “Not Found” for HTTP 404. Other
  failures show “Solution Unavailable” with retry and the appropriate list link.
  Effect cleanup still ignores stale results; no shared request is aborted.
- CAS's 390px overflow came from the showcase text's offscreen `x: 24` entrance
  animation. Horizontal clipping on the existing showcase section contains the
  animation without changing its layout or hiding vertical content/shadows.

## Content actions requiring approval — no data written

- Digital/CAS publication is still missing: the public digital listing returns
  zero records, and the CMS CAS lookup returns 404. The existing custom CAS page
  and `/products/cas` redirect continue to work. No record was seeded.
- Review/publish or replace the homepage slide titled `This is a test title`.
- Approved Privacy Policy and Terms copy or authoritative existing destinations
  are required. None was found in repository content, public site settings or
  the existing CMS schemas/routes. Footer links can return once content exists.
- Authoritative company Facebook, LinkedIn and Twitter/X URLs are required if
  those accounts should appear. Personal team LinkedIn profiles and example
  video URLs were not treated as company accounts. Instagram was reused from
  the existing contact page: https://www.instagram.com/expresso.digitalagency/.
- Additional existing placeholders observed, left outside this confirmed-defect
  cleanup: the Services banner's `NEW!` badge targets `https://www.yourportfolio.com`;
  the plan-builder hero repeats About-page copy. One published reel's approval
  metadata contains the note `Test`; this is not rendered homepage copy.

## Validation

- Client tests: 41 passed in 6 suites, including Digital loading/empty/error,
  retry, malformed responses, Strict Mode cleanup/unmount/remount and shared
  solution 404/error/retry cases.
- API tests: 70 passed; no API code changed.
- Client ESLint: zero errors; one pre-existing unused `Input` warning in the
  untouched portal AttachmentPicker. Production build compiled successfully.
- Real frontend `localhost:3000`, real API `localhost:5050`: rendered all 34
  sitemap paths; checked homepage CTA navigation, contact form destinations,
  Clients deep links/menu navigation, Digital empty state, genuine Technology
  and Digital 404s, CAS/legacy redirect, four Technology groups and vendor entry.
- Desktop 1440px and mobile 390px checked. CAS document scroll width is now equal
  to its client width at 390px, including before offscreen animations run.
- A temporary read-only proxy served the actual production build and injected
  HTTP 503s for listing/detail requests. Rendered errors were distinct from empty
  and 404 states, and retry recovered using the real API. The real API was never
  interrupted. The proxy was stopped after validation.
- No forms submitted, CMS writes, authentication changes, infrastructure changes
  or Stage 4 visual work.

## Files

- `client/public/sitemap.xml`
- `client/src/pages/Home/home.jsx`
- `client/src/pages/ServiceMain/serviceMain.jsx`
- `client/src/pages/DigitalSolutions/DigitalSolutionsPage.jsx`
- `client/src/pages/DigitalSolutions/DigitalSolutionsPage.test.jsx`
- `client/src/pages/ITSolutions/ITSolutionDetailsPage.jsx`
- `client/src/pages/ITSolutions/ITSolutionDetailsPage.test.jsx`
- `client/src/components/Footer/footer.jsx`
- `client/src/components/FinalCTASection/FinalCTASection.jsx`
- `client/src/components/ReelsShowcase/ReelsShowcase.jsx`
- `client/src/components/ServicesSection/ServicesSection.jsx`
- `client/src/components/SideBar/sideBar.jsx`
- `client/src/components/SolutionImageShowcaseBlock/SolutionImageShowcaseBlock.jsx`
- `STAGE-3.5-FUNCTIONAL-CLEANUP.md`
