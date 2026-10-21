# Expresso Portal — design study

**Status:** visual prototype for review. Not production code, not imported by the client app, no backend.
**Entry file:** [`index.html`](index.html). Open it directly in a browser. It works offline and makes no network requests (a Content-Security-Policy in the file blocks any that slip in).
**Baseline:** `26a2cca6` (R1 and R2 access model). All data is fictional.

## 1. Concept: Expresso's digital operating system

The portal is one workspace seen through three lenses: **staff** run the business, **clients** follow their own work, **vendors** respond to RFQs. Each lens has the same structure (dark sidebar, quiet top bar, light canvas) but its own navigation, home page and actions. Persona colour is used only to orient (the workspace strip, the active nav marker, the home briefing). It never changes the meaning of status colours or buttons.

From the architecture blueprint we kept: calm off-white canvas, white panels with hairline borders and a light shadow, one status system, clear typographic hierarchy, colour that carries meaning, and a drawer for detail.

## 2. Visual hierarchy

1. **Briefing** (home pages only): one sentence that answers "what needs me today?", with jump links to the exact filtered list. This replaces a wall of KPI cards.
2. **Metrics strip**: at most four numbers in one joined bar, each with its comparison or reason.
3. **Attention list**: actionable items sorted by impact, each with one clear action.
4. **Panels and tables** for everything else.

Type: Barlow (the project's local fallback for FF Dax), at 3 weights (regular, medium, semibold). Scale 13 / 14 / 15 body / 16.5 panel / 28 page / 34 briefing. Figures use tabular numbers. Sentence case everywhere; no all-caps labels.

| Token | Value | Use |
|---|---|---|
| Night | `#15121F` | Sidebar, primary text |
| Mist | `#F7F7FA` | Canvas |
| Lotus | `#8390C8` | Accents on dark, staff lens |
| Lotus 600 | `#5562A8` | Buttons, links, focus, selected state on light (4.5:1+) |
| Espresso | `#562D0F` / `#7A4A27` | Client lens |
| Sand | `#F8F4EF` | Client briefing surface |
| Teal | `#1F7A80` | Vendor lens (from the blueprint's CMS colour) |
| Status | ok `#2F7D5B`, warn `#9A5300`, bad `#B2383B`, info = Lotus 600 | The only status colours |

The lotus mark appears once in the sidebar and once as a faint watermark in each home briefing. Nowhere else.

## 3. Navigation model

- **Sidebar**: grouped modules (Workspace, Business, Team, Administration for staff). Counts show work waiting, not totals. Collapsible to an icon rail on desktop; becomes an off-canvas drawer below tablet width.
- **Permission-aware**: items the role can't use are not shown. Direct links to them show a "You don't have access" state. Pages that belong to another company or fall outside a vendor's categories show "not found", never "forbidden", so nothing leaks.
- **Top bar**: breadcrumbs, a search entry point (visual only; global search is a later stage), notifications (preview only; the notification centre is a later stage), a persona-specific quick action (staff "Create", client "Get help"), and the account menu.
- **Page frame**: optional status line, title, one-line description, primary action on the right, then filters, then content.

## 4. Staff experience

Two staff personas show permission differences: **Manager** (everything) and **Coordinator** (projects, read-only clients, support, people without KPI reviews).

- **Overview**: briefing, four business metrics, attention list, projects to watch, cash against plan, pipeline, recent activity. The coordinator gets a personal version (own projects, tasks, tickets) and a note explaining what isn't in their role.
- **Clients**: searchable, filterable list with status, owner, lifetime value and open deals. Client detail has commercial figures, opportunities, projects, invoices, contacts and history. Coordinators see a read-only notice and no edit actions.
- **Projects**: list with status, health, progress, owner and due date; sortable. Detail tabs: Overview (milestones, coming up, progress, team), Tasks, Files (marked "Client can see" where shared), Finance (managers only), Activity, and **Client view**, which previews exactly what the client sees. "Archive project" sits in the overflow menu with a confirmation. There is no delete.
- **Finance**: receivables metrics, ageing by days late, a "chase first" list, and the invoice table. Invoice detail opens in a drawer with lines, VAT and payment history.
- **People**: overview with who's out and a month view, staff directory, leave decisions, and KPI reviews. KPI reviews are visible only with HR KPI access; the coordinator sees a locked state that explains why (matches the R2 `hr.kpi.read` gate).
- **Procurement**: RFQs, vendor applications, vendors and categories. RFQ detail shows the status flow (Draft, Published, Evaluating, Awarded), a side-by-side **quotation comparison** with a recommended column, and staff-only internal details. Approving an application confirms that it creates the vendor profile and emails a single-use, 7-day invitation, with no password (R2).

## 5. Client experience (Acme Company)

Designed for someone outside Expresso who wants to know "where is my project and what do you need from me?"

- **Home**: warm sand briefing, one card per active project (progress, current milestone, what's next for the client, contact), "Needs your input" (approve a deliverable, answer a question, invoice due), invoices, updates and the client's Expresso team.
- **Projects**: only Acme's projects. Detail shows milestones, a plain-language status note, files shared with the client, updates and invoices. Client actions are "Approve", "Request changes", "Message the team" and "Request a change". There is no create, edit, archive or delete.
- **Invoices and Documents**: their own only, with how-to-pay information.
- **Support**: create a request (with validation), reply, mark resolved and reopen. Requests are never deleted, which the page states plainly.

## 6. Vendor experience (Falcon Tech Supplies)

- **Home**: briefing about the nearest deadline, four vendor metrics, actions (quote, renew trade licence), recent quotations, profile with approved categories.
- **RFQs**: only published RFQs in the vendor's approved categories, plus closed or awarded RFQs they quoted on. A notice names the categories in use.
- **RFQ detail**: request, items, documents and the vendor's own quotation status. It never shows the internal request, creator, budget, other vendors, scores or evaluation notes.
- **Quotation**: drawer with unit prices per line, a live total, delivery, validity, notes, documents and a confirmation, with inline validation. Submitted, accepted and not-selected states each have their own message.
- **Company profile**: details, documents with expiry, approved categories, and how to request a new category.

## 7. Responsive strategy

Layouts respond to the width of the app, not the browser (CSS container queries), so the prototype bar's width switcher shows real Laptop, Tablet and Mobile layouts.

| Width | Behaviour |
|---|---|
| Over 1440 px | As below, but side gutters grow gradually from 32 to 64 px and the content cap rises to 1600 px. At 1800 px the content is about 1,420 px wide with 64 px gutters; very wide screens centre it rather than stretch it |
| 1181–1440 px | Full sidebar, two-column detail pages, all table columns, 32 px gutters |
| 961–1180 px | Detail side columns stack below; low-priority table columns hide |
| 641–960 px | Sidebar becomes a drawer behind a menu button; metrics go 2×2; search collapses to an icon |
| 640 px and under | **Tables become stacked records**: the primary cell spans the row, 2–4 key facts sit in a labelled two-column grid, low-priority columns are dropped, and the whole record stays tappable. Header actions go full-width; status flows become vertical |

Wide comparison grids (quotations) keep their columns and scroll sideways with the row labels pinned, because comparing across vendors is the point.

## 8. Component system

One set of tokens and one vocabulary for every module: page header, briefing, metrics strip, panel, attention list, table (sortable headers, row hover, stacked mobile mode), pagination, toolbar (search, select, status chips with counts), tabs with counts, status badges and health dots, key-value lists, file rows with visibility tags, timeline, status flow, comparison grid, alerts (info, success, warning, error, persona), empty, loading (skeleton) and error states, forms (labels, hints, inline errors, affixed inputs, drop zone, checkbox), drawer, confirmation modal, menus, notifications preview and toasts. The **Components** page in the prototype shows them together; the **Data** control forces loading, empty and error states into the real lists.

## 9. Accessibility

- Text and status colours meet WCAG AA contrast on their backgrounds. An automated axe-core check of 13 representative screens reported no violations.
- Visible focus ring on every interactive element; keyboard access to rows (Enter or Space), tabs, menus (arrow keys), drawers and modals (focus moves in, Tab is trapped, Esc closes, focus returns to the trigger).
- Landmarks, breadcrumbs with `aria-current`, `aria-sort` on sortable headers, `aria-pressed` on filter chips, live regions for toasts and loading.
- Status is never colour alone: badges have text, health has a label, overdue shows the number of days.
- `prefers-reduced-motion` turns off transitions and the loading shimmer.

## 10. What should become production components

In order of value:

1. App shell (sidebar with permission-filtered groups and counts, top bar, page header) and the persona lens tokens.
2. `DataTable` with toolbar, status chips, sorting, pagination, the stacked mobile mode and built-in loading, empty and error states.
3. `StatusBadge`, `Health`, `Progress` and one shared status-to-tone map.
4. `Drawer`, `ConfirmDialog`, `Menu` and `Toast` with the focus handling above.
5. `Panel`, `MetricsStrip`, `AttentionList`, `Timeline`, `FileList` (with visibility), `KeyValue`, `StatusFlow`.
6. Form primitives: field with label, hint and error; affixed input; drop zone.
7. Domain pieces: `QuotationComparison`, `ClientProjectSummary`, `RfqVendorView`, `LockedState` and `NotFoundState`.

Out of scope here and still to design: global search, notification centre, administration screens, dark mode and real data loading.
