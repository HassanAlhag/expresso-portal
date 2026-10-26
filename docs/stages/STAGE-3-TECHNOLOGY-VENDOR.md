# Stage 3: Technology Solutions and vendor journey

Branch: `website/stage-3-technology-vendor`

Base: approved `website/stage-1-brand-nav` at `97eddb73c4bd99fe6b77dcdc5ddab57cbcd8c3b9`.
Implemented in an isolated worktree so the concurrent Stage 2 checkout stays intact.
No merge or deployment was performed.

## Implementation

The existing Solutions collection, API, CMS editor, card component and detail routes
are reused. The listing and desktop/mobile navigation consume group metadata from
the API and show the four approved groups:

| Group | Existing solutions |
| --- | --- |
| Business Software | ERP Solution, CRM Solution, Queue Management, Software Licensing |
| Cloud & Hosting | Cloud Services, Web Hosting & Domains |
| Infrastructure | Data Center, Data Center Hardware, Networking Hardware |
| Connectivity & Advisory | IoT Solutions, VAS Solutions, IT Consultation |

Existing CMS ordering is retained within each group. Existing titles, descriptions,
blocks, images and slugs are retained. The page has group jump links, grouped
headings, loading/error/empty states, and a supplier panel using Stage 1 tokens.
One lotus signature identifies the vendor panel; solution cards keep their existing
functional icons.

“Become an Expresso Vendor” describes company and solution/product category
registration for procurement/RFQs. Its CTA opens `/vendor-registration`.
Approved vendors can use the existing shared `/portal/login` route. The existing
vendor approval code creates users with the vendor role; no authentication or
registration behavior was changed.

Stage 1 already supplies the requested Work With Us journeys. Its data was kept:

- As a client: `/build-your-plan`, `/contact-us`.
- As a vendor: `/vendor-registration`.
- As talent: `/careers`.

## CMS and API

- Added optional `Solution.group`, validated against four approved group IDs.
- `GET /api/web-content/solutions` retains `ok` and `items` and adds `groups`
  (`id`, `label`, `description`). Each returned solution has its effective group.
- Existing detail, create and update endpoints return the effective group too.
- Existing POST/PATCH endpoints accept `group`; invalid values return HTTP 400.
- Legacy records with no group resolve by their existing slug. This happens on
  reads, without migrations or database writes. Explicit CMS assignments win.
- Unknown legacy records stay visible under “More Technology Solutions” until
  assigned, so restructuring cannot silently remove existing content.
- The existing CMS form at `/portal/website/solutions` has a required group
  selector using API metadata, and its list shows each solution’s group.
- Group membership and item ordering are CMS-managed. The four approved group
  IDs, labels and descriptions are centralized server-side in `technologyGroups.js`.
  No separate taxonomy collection, CMS, registration flow or API route was added.

## Routes

- Updated `/it-solutions`, adding anchors `#business-software`, `#cloud-hosting`,
  `#infrastructure`, `#connectivity-advisory`.
- Existing `/it-solutions/:slug` URLs and content remain compatible.
- Existing `/vendor-registration` and `/portal/login` are linked, not modified.
- Existing `/portal/website/solutions` has the small group selector addition.
- Navigation changes are site-wide; Work With Us destinations are unchanged.

## Files changed

- `portal-api/src/modules/web-content/solution.model.js`
- `portal-api/src/modules/web-content/technologyGroups.js` (new)
- `portal-api/src/modules/web-content/webContent.controller.js`
- `portal-api/test/technology-groups.test.js` (new)
- `client/src/portal/features/website/pages/TechSolutionsPage.jsx`
- `client/src/pages/ITSolutions/ITSolutionsPage.jsx`
- `client/src/components/TechnologyVendorPanel/TechnologyVendorPanel.jsx` (new)
- `client/src/utils/technologyGroups.js` (new)
- `client/src/utils/technologyGroups.test.js` (new)
- `client/src/components/MainHeader/navData.js`
- `client/src/components/MainHeader/navData.test.js` (new)
- `client/src/components/MainHeader/MegaPanel.jsx`
- `STAGE-3-TECHNOLOGY-VENDOR.md` (new)

## Merge notes for the separate Stage 2 work

Likely shared files:

| File | Stage 3 change to preserve |
| --- | --- |
| `client/src/components/MainHeader/navData.js` | API group metadata cache; technology menu grouping and vendor copy only. Retain Stage 2’s Digital Solutions menu and classification/filtering. |
| `client/src/components/MainHeader/MegaPanel.jsx` | One layout expression: four or more groups use two columns. This avoids squeezing technology links into four narrow columns. |
| `client/src/portal/features/website/pages/TechSolutionsPage.jsx` | Group selector, metadata loading and group label. When combining with Stage 2’s product editor, apply the required selector only to technology entries. |
| `portal-api/src/modules/web-content/solution.model.js` | Keep `group` alongside Stage 2’s fields; do not replace its classification fields. |
| `portal-api/src/modules/web-content/webContent.controller.js` | Keep group validation/hydration/metadata alongside Stage 2’s existing classification queries and product fields. |

CAS, Digital Solutions routes/content/classification, vendor registration, portal
layout, authentication, AWS, MongoDB, SMTP and production configuration were not
changed. No database or seed script was executed.

## Validation

- Full API suite: `npm test` — 56 tests passed. Model calls are stubbed by the
  existing test harness; no database connection is made.
- Final grouping API checks: `node --test test/technology-groups.test.js` — 6 passed.
- Full client suite: `CI=true npm test -- --watchAll=false --runInBand` — 5 passed.
- Client lint: `eslint src --ext .js,.jsx` — no errors; one pre-existing unused
  `Input` warning in `portal/shared/ui/AttachmentPicker.jsx`. Changed files lint clean.
- Production build: `npm run build` — compiled successfully.
- Node syntax checks and `git diff --check` passed.
- Chromium production-build checks at 1440, 1024, 768, 390 and 320 pixels verified
  all 12 cards, the four groups, jump links clearing the fixed header, no horizontal
  overflow, and no page runtime errors. Desktop technology and Work With Us menus
  were checked at 1440 and 1024 pixels.
- Mobile expanded menus, existing solution details, registration and shared sign-in
  destinations were checked at 390 and 320 pixels (journeys also checked at 1440).
- Visual screenshots of desktop/laptop menus, group sections and mobile vendor
  panels were reviewed. Existing scroll-triggered animations were revealed before
  group screenshots.

Browserslist reported an existing outdated `caniuse-lite` database. API tests also
reported an existing duplicate `status` index warning. Dependencies/configuration
were not changed to address unrelated warnings.

## Local visual review

A read-only preview of the production build is running on port 3003 using the
repository’s existing technology seed content as fixtures. It does not connect to
MongoDB, AWS, SMTP or live services, and rejects writes. Form rendering and links
can be reviewed; registration submission and authenticated CMS persistence are
not available in this fixture preview.

- <http://localhost:3003/it-solutions>
- <http://localhost:3003/it-solutions#business-software>
- <http://localhost:3003/it-solutions#connectivity-advisory>
- <http://localhost:3003/it-solutions/erp-solution>
- <http://localhost:3003/vendor-registration>
- <http://localhost:3003/portal/login>

Local preview scripts, screenshots and browser results are ignored in
`.codex-artifacts/stage3/`. The CMS selector and API persistence were validated
without a live database; an authenticated database-backed editor session was not
exercised.

## Integrated real-API verification — 2026-10-20

The old 3003 fixture process is stopped. Review the integrated site at
<http://localhost:3000/it-solutions>, backed by the real local API at
<http://localhost:5050/api/web-content/solutions>.

The original Stage 3 build and the integrated technology menu were compared in
the browser. With the current real API, their menu DOM and links are identical:
1140px panel, outer columns 240px / 620px / 280px, and two 278px group columns.
The technology layout, CSS and vendor panel were not lost during integration.
The current API returns the same four group definitions and twelve title/slug/
subtitle/group combinations as the old fixture. Existing CMS item order is kept.

The fixture always synthesized `group` and `groups`; it therefore concealed a
client compatibility gap. Before this fix, omitting that metadata collapsed all
legacy items under “More Technology Solutions.” That failure was reproduced in
the browser using actual local API items with only group metadata stripped.
Separately, failed HTTP navigation requests were cached as an empty success for
the session. These confirmed defects explain how an old/failed response could
leave a different menu; the earlier response in the user's session is unavailable,
and a fresh real-API load already rendered correctly at inspection time.

The integrated client now uses approved read-only taxonomy/slug defaults only
when API metadata or legacy assignments are absent. API labels and explicit CMS
assignments win. No cards are invented, unknown records remain available, inactive
records stay hidden, and digital records never enter technology groups. Failed
or invalid navigation responses are not cached; returning focus retries uncached
reads. The shared request and lifecycle guards remain intact.

Verified on the real frontend/API: desktop and mobile groups (4 / 2 / 3 / 3 items),
the grouped landing page, vendor registration links and existing form, ERP detail,
Digital Solutions menu, and direct CAS route. The local API currently returns no
published digital records, so its existing Digital Solutions landing-page fallback
remains correct; CAS was not inserted or hard-coded into either menu.

Validation: 27 client tests passed; lint had no errors and one existing warning;
production build passed. The new build also reproduced the original Stage 3 menu
DOM when consuming real API items stripped of group metadata. No database writes,
seeds, API/configuration changes or Stage 4 visual work were performed.
