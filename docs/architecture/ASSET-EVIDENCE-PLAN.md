# R5-B3 — offline asset evidence and future capture plan

Status: **COMPLETE / COMMITTED**. R5-B remains IN PROGRESS. This document designs later read-only evidence; it authorizes no data capture, storage enumeration, reference repair, archive operation or asset deletion.

## Current deliverables and command boundary

- [Asset register](asset-evidence.json): one record per tracked asset in the declared deployable roots, sizes/SHA-256, typed static evidence/provenance, protection, incomplete dynamic evidence and cleanup blockers.
- [Exact schema-field inventory and capture plan](asset-reference-plan.json): all 45 models and all resolved schema leaf fields, including helper-created/nested/array fields; selected reference/context surfaces, expected types, normalization, parsing requirements and per-collection future projections.
- [Generated reconciliation report](ASSET-RECONCILIATION-B3.md): totals, historical comparison, classifications/bytes, protected paths, integrity findings, duplicate groups and exact selected fields by model/collection.
- [Reviewed policy](asset-evidence-policy.json): explicit roots, homepage approval/content hashes, operational protection sources, rich-text fields and storage/reference implementation sources.

Run from the repository root:

```sh
node docs/architecture/generate-asset-evidence.cjs
node docs/architecture/generate-asset-evidence.cjs --check
node --test portal-api/test/asset-evidence.test.js
```

The first command reads repository files and Git metadata, then writes exactly the three generated evidence documents. `--check` reads only and fails if any is stale. Neither command imports application models, executes schema methods, reads `.env`, opens MongoDB/S3/CMS, calls deployed APIs/logs, changes runtime behavior, or removes/moves/renames assets. The only child command is `git ls-files -z`, with an explicit PATH-only environment. No generic mutation/output-path option or package dependency is added.

## Scope and independent evidence

The policy includes tracked media, fonts, icons and downloadable documents (including text) below `client/public/`, `client/src/assets/` and `portal-api/public/`, plus the Barlow font-license companion. Ordinary JS/CSS/HTML/configuration sources are reference inputs, not cleanup candidates. `index.html`, `manifest.json`, `robots.txt` and `sitemap.xml` are operational/configuration sources. Tracked design screenshots outside deployable roots are recorded as excluded; dependency files and ignored build output are never candidates. No tracked in-scope video/audio/downloadable binary document is present today; future additions of the declared types enter the register automatically.

The historical media/font set is 325 files / 140,883,047 bytes (134.36 MiB). The old coarse comparison is reproducible: basename substring anywhere in tracked client text (including public HTML/manifest) or API source gives 180 matches and 145 non-matches / 46,489,487 bytes (44.34 MiB). It includes comments, test fixtures, unused declarations and substring collisions. Searching client/API **src only** gives 174 rather than 180; omitting public entry/PWA files explains those six. Neither comparison proves current runtime use. The historical substring-only matches `client/public/3.png` and `client/public/4.png` occur inside longer names such as gallery/avatar filenames; strict resolution does not count them. This adds two unresolved candidates to the historical protected-adjusted 141, yielding 143 under the current bounded detector. Four W4 homepage files are explicitly protected; the historical 145 minus those four is 141, without deletion approval. B3 adds the separately protected font license and uses exact paths plus provenance; see the generated totals for that different measure.

Static evidence records source file, stable context/form, resolved asset path, confidence and provenance. Locations use semantic anchors instead of line numbers to avoid failures from unrelated line shifts. A path declaration in a reachable module is not proof that its enclosing function or page executes in deployment. Module reachability comes from the existing source inventory; this study does not replace C1's caller analysis. Unreachable/operator source, tests, documentation, comments and UI placeholders are separate evidence. Their synthetic/missing paths do not become runtime broken-link claims.

The analyzer handles JS/JSX/TS/TSX imports/require, literals/object values, lexical constants, static concatenations/templates and JSX attributes; JSON values and manifest-relative icons; HTML attributes/srcset, CSS url(), Markdown links, and bounded YAML/XML scalar references. Dynamic JSX/computed paths/interpolations are recorded as possible references. Cross-module computation, aliases/macros, finite runtime loops and generated content may exceed this bounded analysis. Parser gaps explicitly make evidence partial. There is no claim of exhaustive JavaScript evaluation.

No build was run for B3. Public copying, bundler imports, and tracked entry HTML/PWA references describe expected build inputs only. A per-machine ignored build can be stale; it is not independent proof of deployment or use.

## Normalization required for later evidence

| Representation | Required rule | Unresolved behavior |
|---|---|---|
| Repository/public path | Exact case-sensitive root-relative or source-relative resolution; retain actual path case | Never match an arbitrary nested asset by basename |
| Encoded public URL path | Remove query/fragment for path comparison; percent-decode once; validate control bytes, encoded separators, traversal and root boundaries | Keep malformed, escaping, double-encoded/ambiguous and case-mismatched paths as findings; never silently repair |
| Absolute/CDN URL | First obtain an approved mapping of exact origins and path prefixes to this site's public root or storage namespace | A matching suffix or filename alone never proves a repository match; no HTTP request is needed or made by B3 |
| `/uploads` or legacy upload URL | Classify as API/storage namespace; client helpers may remap it to API origin | Not automatically a missing `client/public` asset; requires Media/storage evidence |
| Object-storage key | Preserve exact key case/bytes and bucket/prefix namespace identity locally; a key is not a URL, so do not URL-decode or strip characters from it | Unknown bucket/prefix aliases remain unresolved; do not infer key from a basename |
| Media ObjectId | Validate shape locally; join to the complete allowlisted Media projection; consider original, thumbnail and medium URL/key variants | Distinguish missing target from target collection/field not captured; never interpret a 24-character ID as an asset filename |
| File ObjectId / private filename | Join locally to File; interpret `filename` as storage key when `isPrivate` is true, not the human original name | No user/customer profile lookup; no filename-only repository match |
| Signed private URL | Never preserve credentials, signed query, JWT path token or expiring URL as evidence identity | Derive a locator only inside the authorized process if supported; output a capture-local HMAC or sanitized error |
| Nested media/file object | Follow allowlisted typed nested fields; handle ID, key and URL variants separately | Unsupported/legacy object shapes remain unresolved; no generic `String(object)` conversion |
| Rich text / HTML / Markdown / CSS | Parse locally for src/srcset/href/poster, CSS URL and Markdown-link reference tokens; do not render HTML | Output matched known repository paths or HMAC handles only, never raw text |
| Symbolic icon/font/color value | Use field/type context (e.g. BrandAsset.type); icon tokens and colors are not file paths | No false missing-file finding from a symbolic token; family-to-font mapping needs separate evidence |

B3 records exact duplicate SHA-256 groups and different-format/same-stem variants separately. Equal bytes do not prove equivalent URLs/ownership; different bytes do not establish visual equivalence. No duplicate is a consolidation/deletion authorization. File-extension changes, aliases, cache behavior and external consumers all require owner review.

## Exact future collection and field requirements

The machine-readable plan is authoritative for exact collection names and paths. Every selected surface has `referenceKind`, `expectedValueType`, `target`, `normalization`, `nested`, `htmlOrRichTextParsing`, `contextFields`, and sanitized unresolved/exposure rules. Each model also has a complete leaf-field inventory and `futureProjection`; this is a design, not an executable database query. Array `[]` and Map `.*` notation denotes traversal, not a literal database field name.

- Media: original/thumbnail/medium URLs and corresponding S3 keys; filename is metadata only, never a sufficient locator; type is local discriminator context. Join `_id` only inside the authorized capture using a capture-local HMAC.
- File: `url`, `filename`, `isPrivate`, and HMAC-only customer/project/job/Production ownership context. Do not export `originalName`, notes, staff identities or full documents.
- SiteSettings: all helper-expanded image URL/Media pairs, branding/home/about/services/portfolio/careers/contact/technology sections, `websiteImages.images[].key/defaultUrl/url/mediaId`, gallery and marquee. A registry fallback or override key does not establish the current CMS-resolved value.
- HeroSlide: image/thumbnail URL and Media pairs plus CTA URL fields, which may be navigation links or downloadable assets.
- Solution and DigitalService: image/hero Media and URL fields, CTA links, descriptions and opaque `blocks`. Shapes such as image cards/showcase/background/media inside blocks require bounded recursive extraction.
- Portfolio: cover/gallery Media, banner/thumbnail/solution images, `imageUrls[].src` and content fields. Gallery alt text is not needed for reference capture.
- Careers/applications: Career text lists can contain links; JobApplication includes legacy `cvUrl`, private `cvKey` (`select: false`), optional `cvMediaId`, and locally scanned cover-letter/notes references. Never export applicant names, emails, phones or raw CV text/private paths.
- ServiceTemplate: cover Media, nested scope job URLs/instructions, private `files.uploads[]` Mixed objects and `files.mediaRefs[]`. Known upload entries use keys; old entries can have URL values. Typed extraction alone is insufficient.
- BrandAsset: `url`, `mediaId`, type-dependent `value`, and locally scanned notes. Read `type` as context; color values and font-family names must not become path matches.
- Job: cover/draft/final/poster/gallery Media, external execution/post/analytics/goal URLs and content/instruction text; `productionId` is legacy ownership context.
- Production: `coverMedia`, `gallery[]` and content text. Together with `File.productionId` and `Job.productionId`, these remain B4/real-data evidence requirements. Nothing authorizes retirement or permission/model/route removal.
- Customer/User: logo/avatar URLs and Media IDs; local text scanning is allowed only for explicitly selected fields in the plan. Identity/login/credential fields are excluded.
- HRExpense: receipt URL/Media plus locally extracted references from description/notes; no financial/staff profile dump.
- Message: `attachmentUrls[]` and locally extracted body references; no message text export.
- Invoice: `uploads[].url` and locally extracted notes/payment notes. Do not export amounts, payment references or customer identities.
- RFQ/Quotation: `attachments[].url` and selected descriptions/notes; attachment names and vendor/contact/price details are not required.
- ProcurementCategory: hero image URL/Media, icon/symbol and description.
- Additional current surfaces: Enrollment's nested scope URLs/instructions, Ticket description/comments/body and Mixed `comments[].eventMeta`, Audit's generic `meta`, CRM website/notes/text fields, and selected descriptive text in Project, HR/KPI, Team, Role, procurement/vendor entities. Exact fields and fields excluded from capture are recorded for all 45 models.

Current schema fields cannot prove absence of unknown collections, old fields or legacy mixed value shapes in actual data. A later capture needs explicit completeness and legacy-discovery metadata. Do not silently widen the allowlist or dump unknown records to fill that gap.

## Minimized evidence contract (future; not implemented)

Obtain separate approval for the environment, declared read-only target identity, collections/fields, bounds, opaque/text processing and retention. No source URI or credential goes into arguments, output or evidence. B3 implements no database/CMS/storage client or capture command.

Within that separately authorized process:

1. Read only the listed reference fields and necessary type/ownership discriminator context. Use `_id` locally for joining/deduplication only. Explicitly selected private fields such as CV keys must stay inside that process.
2. For free text or opaque content, extract reference tokens locally with limits on documents, recursion, tokens, value length and malformed input. If safe bounded extraction is unavailable, leave the field NOT_COLLECTED rather than exporting it.
3. Resolve references to the allowlisted Media/File projections. Use one capture-local HMAC namespace/key for target joins; no raw ObjectIds or full user/customer/applicant records leave the process.
4. Export only model/collection, exact field path, optional HMAC source handle, reference kind, an already-known matched repository path **or** HMAC locator, resolution status and sanitized error code. Private/unknown object keys, URL paths that may contain PII, signed queries and JWT path tokens must never be emitted raw.
5. Record per-collection/per-field completeness, scanned counts and bounds separately. Partial/empty/malformed/missing-target/unsupported/limit-exceeded/not-collected are distinct states. No raw values in errors. A report with incomplete source/target evidence cannot establish absence.

Suggested status vocabulary: MATCHED_TRACKED_PATH, RESOLVED_MEDIA_JOIN, RESOLVED_FILE_JOIN, EMPTY_ALLOWED, TARGET_EVIDENCE_INCOMPLETE, MISSING_TARGET_IN_COMPLETE_CAPTURE, UNKNOWN_ORIGIN_OR_KEY_ALIAS, PRIVATE_LOCATOR_HMAC_ONLY, MALFORMED_REFERENCE, UNSUPPORTED_SHAPE, LIMIT_EXCEEDED, NOT_COLLECTED. This does not change B2's reference-integrity classifications or conclusions.

Storage/CMS data and public serving paths can differ. A later owner-approved storage study must identify bucket/CDN/prefix aliases and complete reference projections; filename matches and opaque provider metadata are not SHA-256 proof. No bucket, object content or live configuration has been inspected here.

## External use, drift and review gates

Public URLs may survive in search indexing, social posts, external sites, email/campaign links, bookmarks and caches. Repository/DB absence cannot disprove that use. An owner-approved external-consumer/archive decision is required even if all local and persisted scans are complete. No B3 record has a deletion authorization.

`--check` compares deterministic outputs derived from asset path/size/content hashes, typed references/provenance and semantic digests of dynamic asset bindings and asset-field operations, all current model field shapes, reviewed protection policy and storage-code AST semantics. No timestamps or HEAD id are emitted. Asset additions/removals, content changes, relevant reference changes, schema reference changes and protection changes therefore cannot silently leave a fresh register. Ordinary unrelated source text, comments without asset references and line shifts do not affect reference evidence. Schema extensions the parser cannot resolve fail closed. New runtime aliases/macros and new legacy shapes require review, not silent assumptions.

The architecture validator checks B3 freshness alongside the existing inventory and C1 checks. Focused tests cover normalization, collision/case/traversal, static/dynamic forms, provenance, nested/Mixed/Map/helper fields, privacy design, duplicate evidence, drift and offline write boundaries. D1-D3/B2 implementations, model/schema/index definitions, application routes/permissions and all assets remain unchanged.

Next bounded step: review this foundation and the exact minimized capture contract. Only after separate authorization should a capture implementation or real read-only evidence run be considered. B4, C2+, D4/D5, R5-E, Operating Model and Portal Implementation remain outside this work.
