# Reference integrity — R5-B2 offline reporting (runbook)

Status: **R5-B2 complete / committed.** R5-B is in progress. Production retirement (R5-B4) and asset deletion are **blocked**.

## Read this first

- **B2 is offline reporting only.** It evaluates a snapshot file you name explicitly. It never connects to MongoDB or storage, never reads `.env` or `MONGO_URI`, never imports the application, and never looks for dump files.
- **B2 does not inspect production data.** No capture tool exists. Capturing a real snapshot needs separate authorisation and is not part of B2.
- **B2 does not prove production integrity.** A report describes only the snapshot it was given. With incomplete evidence, findings are a lower bound and the absence of a finding means nothing.
- **B2 does not authorise cleanup.** Nothing is ever marked safe to modify or delete, and no repair instruction or command is produced. Any persisted cleanup or Production retirement still needs D2/D3 backup and restore-verification evidence where applicable, plus owner approval.

## Command

```
node src/scripts/lifecycle/refcheck.js --snapshot <explicit-file>
```

Output is a JSON report on stdout; nothing is written. There is no package script and no capture, repair, fix, delete, migrate, reset, restore or backup command.

| Exit | Meaning |
|---|---|
| 0 | Complete evidence and no findings |
| 2 | Invalid arguments |
| 4 | Invalid snapshot (including fields it does not need) or catalog drift |
| 5 | Unsupported snapshot version |
| 10 | Report produced with findings or incomplete evidence |

## Files

| File | Role |
|---|---|
| `src/scripts/lifecycle/references.js` | Relationship catalog, drift check, snapshot validation, evaluation |
| `src/scripts/lifecycle/refcheck.js` | The offline CLI |
| `test/lifecycle/references.test.js` | Synthetic-fixture tests |

It reuses the R5-D1 helpers (canonical digests, secret detection, timestamps, exit codes) and the D1 path to the source inventory. The D1 static safety tests scan these files too.

## Relationship catalog

Lifecycle metadata over the models recorded in `docs/architecture/source-inventory.json`; not a second data model. 73 relationships are listed explicitly; every other Media reference in the inventory is added automatically as asset-cleanup evidence. `catalogDrift()` checks that every catalog field still exists with the same target and shape, that the CRM Activity entity types still match the model enum, and that every inventory reference field is either covered or excluded with a written reason. The CLI refuses to run on drift.

| Group | Relationships |
|---|---|
| Jobs | customer (required), project, enrollment, assignees[], cover/draft/final/poster media, media[], approval actor (historical); project and enrollment customer ownership |
| Files | customer, project, job; project and job customer ownership |
| Legacy Production | Job.productionId, File.productionId, Production.coverMedia, Production.gallery[]: every existing link is listed as retirement evidence |
| Invoices | customer (required), project, enrollment, payment actor (historical); project and enrollment customer ownership |
| Procurement | RFQ → request (null is a legitimate standalone RFQ), RFQ → subcategories[], quotation → RFQ and vendor (required), request → customer and category |
| Vendor onboarding | application ↔ vendor (both directions), application → user, vendor → user (null until the invitation is accepted), invite → vendor and customer, vendor/application user agreement. VendorApplication has no Invite field in the model, so no such link is checked |
| HR | KPI goal → indicator (required) and staff, check-in → goal (required), staff → linked user |
| CRM | Activity entity (polymorphic: lead, deal, account, contact, customer), canonical and legacy lead → deal, lead → account, deal → lead/account/contact/customer, account/contact → customer, customer → CRM account/deal; lead ↔ deal and customer ↔ account/deal back-links; canonical and legacy conversion links must agree |
| External users | user → customer; an external user (captured `isInternal === false`) needs a company unless an active vendor profile links them. No role-name list is used |
| CMS / Media | All model-defined Media references (asset-cleanup evidence). Object reconciliation is B3 |
| Support | ticket → customer (tenant), project, assignee; requester, watchers and comment authors (historical); project customer ownership |

## Snapshot format (`expresso.lifecycle.reference-snapshot/1`)

```json
{
  "schemaVersion": "expresso.lifecycle.reference-snapshot/1",
  "source": { "kind": "synthetic", "targetFingerprint": "<sha256>", "capturedAt": "2026-10-28T06:00:00Z", "applicationCommit": "<40-hex or null>", "profileAlias": "<optional>" },
  "capture": { "complete": true, "collections": { "jobs": { "complete": true, "fields": ["customerId", "projectId"] } } },
  "collections": { "jobs": [ { "_id": "<24-hex>", "customerId": "<24-hex>", "projectId": null } ] }
}
```

- Records hold `_id` and only the reference, owner and classification fields the catalog needs. Any other field (names, emails, text) makes the snapshot invalid, so personal data cannot pass through. Secret-like content is refused.
- Ids are 24-hex strings or `{ "$oid": "…" }`.
- Each collection declares whether it is complete and which fields were captured. Undeclared fields are refused.

## Report

Deterministic JSON (no timestamps; findings sorted by relationship, collection, record, field, index):

- `source`, `snapshotDigest`, `catalogVersion`;
- `evidence`: `complete`, incomplete collections, relationships not evaluated or partial, and a conclusion;
- `summary`: relationships checked, records examined, references examined, and counts for every state, severity, retirement evidence and cleanup blocker;
- `relationships`: per relationship, EVALUATED / PARTIAL / NOT_EVALUATED;
- `findings`: relationship, collection, record id, field path, array index, target collection and id, state, severity, classification, cleanup blocker and code. No document content.

## States

`VALID`, `NULL_ALLOWED`, `MISSING_REQUIRED_REFERENCE`, `MISSING_TARGET`, `MALFORMED_REFERENCE`, `OWNERSHIP_MISMATCH`, `RECIPROCAL_MISMATCH`, `UNKNOWN_TARGET_TYPE`, `UNSUPPORTED_SHAPE`, `INCOMPLETE_EVIDENCE`, plus `NOT_COMPARABLE` (an ownership or back-link check that cannot be made because the target is missing or an owner value is absent; counted, not listed). VALID and NULL_ALLOWED are counted, not listed, except legacy Production links, which are listed as `RETIREMENT_EVIDENCE`.

- A malformed id is never reported as a missing target; a wrong shape is UNSUPPORTED_SHAPE.
- Arrays are checked per element, with the index in the field path.
- An unresolved id in a partly captured target collection is INCOMPLETE_EVIDENCE, not MISSING_TARGET.

## Severity and cleanup blockers

- **CRITICAL**: tenant ownership mismatch; a required customer missing or unresolved; financial customer or ownership problems; an active external user without a company.
- **IMPORTANT**: an optional non-null link to a missing target; Production references; HR/KPI links; malformed values; incomplete evidence.
- **INFORMATIONAL**: a missing historical actor (requester, comment author, approver, payment recorder), classified `HISTORICAL_REVIEW` with no cleanup blocker. Tenant and ownership links are never downgraded for this reason.

`cleanupBlocker` names the cleanup a finding must be resolved before (for example `production-retirement`, `asset-cleanup`, `financial-data-cleanup`). It never says the opposite: an unblocked record is not safe.

## Phase status

| Item | Status |
|---|---|
| R5-B | In progress |
| R5-B2 offline reference-integrity reporting | Complete / committed |
| Real snapshot capture | Not implemented; needs separate authorisation |
| R5-B3 asset/object reconciliation | Not started |
| R5-B4 Production retirement | Blocked |
| Asset deletion | Blocked |
