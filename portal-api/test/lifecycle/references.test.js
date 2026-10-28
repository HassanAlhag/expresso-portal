// R5-B2 — offline reference-integrity reporting. Synthetic fixtures only:
// no database, storage, network, environment or captured data is used.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  buildReferenceCatalog, catalogDrift, evaluateReferences, validateReferenceSnapshot, STATES, EXCLUDED,
} from "../../src/scripts/lifecycle/references.js";
import { main } from "../../src/scripts/lifecycle/refcheck.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, "../../src/scripts/lifecycle");
const INVENTORY = JSON.parse(readFileSync(path.resolve(here, "../../../docs/architecture/source-inventory.json"), "utf8"));
const catalog = buildReferenceCatalog(INVENTORY);

/* ----------------------------------------------------------- fixtures */
const oid = (tag) => tag.padStart(24, "0"); // synthetic ids, e.g. oid("c1")
const C1 = oid("c1"), C2 = oid("c2"), C9 = oid("c9");
const P1 = oid("a1"), E1 = oid("e1"), J1 = oid("b1"), M1 = oid("d1"), M2 = oid("d2"), M9 = oid("d9"), PR1 = oid("f1"), PR9 = oid("f9");
const U1 = oid("11"), U2 = oid("12"), U9 = oid("19");

/** Build a snapshot. Every listed collection is declared complete with all catalog fields unless overridden. */
function snap(collections, { complete = true, capture = {} } = {}) {
  const meta = {};
  for (const c of Object.keys(collections)) {
    meta[c] = { complete: true, fields: [...catalog.allowedFields.get(c)].filter((f) => f !== "_id").sort(), ...(capture[c] || {}) };
  }
  for (const [c, m] of Object.entries(capture)) if (!meta[c]) meta[c] = m;
  return {
    schemaVersion: "expresso.lifecycle.reference-snapshot/1",
    source: { kind: "synthetic", targetFingerprint: "a".repeat(64), capturedAt: "2026-10-28T06:00:00Z", applicationCommit: "0".repeat(40) },
    capture: { complete, collections: meta },
    collections,
  };
}
const run = (s) => evaluateReferences(s, catalog);
const find = (rep, rel) => rep.findings.filter((f) => f.relationship === rel);
const one = (rep, rel) => {
  const f = find(rep, rel);
  assert.equal(f.length, 1, `${rel}: ${JSON.stringify(f)}`);
  return f[0];
};
const base = (extra = {}) => ({ customers: [{ _id: C1 }, { _id: C2 }], projects: [{ _id: P1, customerId: C1 }], enrollments: [{ _id: E1, customerId: C1 }], ...extra });

/* ----------------------------------------------------------- reference states */
test("1. a valid scalar reference produces no finding and counts as VALID", () => {
  const r = run(snap(base({ jobs: [{ _id: J1, customerId: C1 }] })));
  assert.deepEqual(find(r, "job.customer"), []);
  assert.ok(r.summary.valid > 0);
});

test("2. an allowed null is NULL_ALLOWED, not an error", () => {
  const r = run(snap(base({ jobs: [{ _id: J1, customerId: C1, projectId: null, enrollmentId: null }] })));
  assert.deepEqual(find(r, "job.project"), []);
  assert.ok(r.summary.nullAllowed >= 2);
});

test("3. a missing required reference is MISSING_REQUIRED_REFERENCE (CRITICAL for a customer)", () => {
  const f = one(run(snap(base({ jobs: [{ _id: J1 }] }))), "job.customer");
  assert.equal(f.state, "MISSING_REQUIRED_REFERENCE");
  assert.equal(f.severity, "CRITICAL");
});

test("4. a non-null reference to an absent record is MISSING_TARGET", () => {
  const f = one(run(snap(base({ jobs: [{ _id: J1, customerId: C9 }] }))), "job.customer");
  assert.equal(f.state, "MISSING_TARGET");
  assert.equal(f.targetId, C9);
  assert.equal(f.targetCollection, "customers");
});

test("5. a malformed id is MALFORMED_REFERENCE, never collapsed into MISSING_TARGET", () => {
  const f = one(run(snap(base({ jobs: [{ _id: J1, customerId: "not-an-object-id" }] }))), "job.customer");
  assert.equal(f.state, "MALFORMED_REFERENCE");
  assert.equal(f.targetId, null);
});

test("6/22. Job → Project customer mismatch is OWNERSHIP_MISMATCH, separate from target existence", () => {
  const r = run(snap(base({ projects: [{ _id: P1, customerId: C2 }], jobs: [{ _id: J1, customerId: C1, projectId: P1 }] })));
  assert.deepEqual(find(r, "job.project"), []); // the project exists
  const f = one(r, "job.project-customer");
  assert.equal(f.state, "OWNERSHIP_MISMATCH");
  assert.equal(f.severity, "CRITICAL");
});

test("7. matching ownership produces no finding", () => {
  const r = run(snap(base({ jobs: [{ _id: J1, customerId: C1, projectId: P1, enrollmentId: E1 }] })));
  assert.deepEqual(find(r, "job.project-customer"), []);
  assert.deepEqual(find(r, "job.enrollment-customer"), []);
});

test("23. Job → Enrollment customer mismatch is OWNERSHIP_MISMATCH", () => {
  const r = run(snap(base({ enrollments: [{ _id: E1, customerId: C2 }], jobs: [{ _id: J1, customerId: C1, enrollmentId: E1 }] })));
  assert.equal(one(r, "job.enrollment-customer").state, "OWNERSHIP_MISMATCH");
});

test("an ownership check against a missing target is not double-reported", () => {
  const r = run(snap(base({ jobs: [{ _id: J1, customerId: C1, projectId: oid("a9") }] })));
  assert.equal(one(r, "job.project").state, "MISSING_TARGET");
  assert.deepEqual(find(r, "job.project-customer"), []);
  assert.ok(r.summary.notComparable >= 1);
});

/* ----------------------------------------------------------- arrays */
test("8. an array of valid references produces no finding", () => {
  const r = run(snap(base({ media: [{ _id: M1 }, { _id: M2 }], jobs: [{ _id: J1, customerId: C1, media: [M1, M2] }] })));
  assert.deepEqual(find(r, "job.media"), []);
});

test("9. one missing element is reported with its index; the valid element does not hide it", () => {
  const f = one(run(snap(base({ media: [{ _id: M1 }], jobs: [{ _id: J1, customerId: C1, media: [M1, M9] }] }))), "job.media");
  assert.equal(f.state, "MISSING_TARGET");
  assert.equal(f.arrayIndex, 1);
  assert.equal(f.fieldPath, "media[1]");
});

test("10. a malformed array element is reported per element", () => {
  const f = one(run(snap(base({ media: [{ _id: M1 }], jobs: [{ _id: J1, customerId: C1, media: [M1, "bad"] }] }))), "job.media");
  assert.equal(f.state, "MALFORMED_REFERENCE");
  assert.equal(f.arrayIndex, 1);
});

/* ----------------------------------------------------------- polymorphic */
const crm = (extra) => ({ crmleads: [{ _id: oid("71") }], crmdeals: [{ _id: oid("72") }], crmaccounts: [], crmcontacts: [], customers: [{ _id: C1 }], ...extra });

test("11. a CRM Activity resolves by its entity type, never by the id alone", () => {
  const ok = run(snap(crm({ crmactivities: [{ _id: oid("70"), entityType: "deal", entityId: oid("72") }] })));
  assert.deepEqual(find(ok, "crm-activity.entity"), []);
  // The id exists as a deal, but the type says lead: that is a missing lead.
  const f = one(run(snap(crm({ crmactivities: [{ _id: oid("70"), entityType: "lead", entityId: oid("72") }] }))), "crm-activity.entity");
  assert.equal(f.state, "MISSING_TARGET");
  assert.equal(f.targetCollection, "crmleads");
});

test("12. an unknown entity type is UNKNOWN_TARGET_TYPE, not skipped", () => {
  const f = one(run(snap(crm({ crmactivities: [{ _id: oid("70"), entityType: "partner", entityId: oid("72") }] }))), "crm-activity.entity");
  assert.equal(f.state, "UNKNOWN_TARGET_TYPE");
  assert.equal(f.targetCollection, null);
});

/* ----------------------------------------------------------- reciprocal */
test("13. a missing back-link is RECIPROCAL_MISMATCH (vendor onboarding and CRM conversion)", () => {
  const A1 = oid("81"), V1 = oid("82");
  const r = run(snap({ vendorapplications: [{ _id: A1, vendorId: V1, userId: null }], procurementvendors: [{ _id: V1, applicationId: null, userId: null, isActive: true }], users: [] }));
  const f = one(r, "vendor-application.vendor-back-link");
  assert.equal(f.state, "RECIPROCAL_MISMATCH");
  assert.equal(f.code, "BACK_LINK_MISSING");
  // Intermediate onboarding (vendor without a user yet) is not an orphan.
  assert.deepEqual(find(r, "vendor.user"), []);
  const L = oid("71"), D = oid("72");
  const crmRep = run(snap(crm({ crmleads: [{ _id: L, convertedDealId: D, convertedToDealId: oid("73") }], crmdeals: [{ _id: D, leadId: null }, { _id: oid("73"), leadId: L }] })));
  assert.equal(one(crmRep, "crm-lead.deal-back-link").state, "RECIPROCAL_MISMATCH");
  assert.equal(one(crmRep, "crm-lead.canonical-legacy-agreement").code, "CANONICAL_LEGACY_DISAGREE");
});

test("procurement: a standalone RFQ (null request) is legitimate; a broken non-null link is not", () => {
  const r = run(snap({ rfqs: [{ _id: oid("91"), requestId: null }, { _id: oid("92"), requestId: oid("99") }], procurementrequests: [] }));
  const f = one(r, "rfq.request");
  assert.equal(f.sourceId, oid("92"));
  assert.equal(f.state, "MISSING_TARGET");
});

/* ----------------------------------------------------------- incomplete */
test("14. incomplete evidence is reported, never read as zero findings", () => {
  // Target collection partial: an unresolved id is INCOMPLETE_EVIDENCE, not MISSING_TARGET.
  const r = run(snap(base({ jobs: [{ _id: J1, customerId: C9 }] }), { capture: { customers: { complete: false, fields: [] } } }));
  assert.equal(one(r, "job.customer").state, "INCOMPLETE_EVIDENCE");
  assert.equal(r.evidence.complete, false);
  // Nothing captured for most relationships: zero findings, but explicitly incomplete.
  const empty = run(snap({ customers: [{ _id: C1 }] }, { complete: false }));
  assert.equal(empty.findings.length, 0);
  assert.equal(empty.evidence.complete, false);
  assert.match(empty.evidence.conclusion, /INCOMPLETE EVIDENCE/);
  assert.ok(empty.summary.relationshipsNotEvaluated > 0);
  assert.ok(empty.relationships.some((x) => x.status === "NOT_EVALUATED"));
});

test("15. an unsupported field shape is UNSUPPORTED_SHAPE", () => {
  const r = run(snap(base({ jobs: [{ _id: J1, customerId: 12345 }], tickets: [{ _id: oid("31"), clientId: U1, comments: "free text" }], users: [{ _id: U1, isInternal: true }] })));
  assert.equal(one(r, "job.customer").state, "UNSUPPORTED_SHAPE");
  assert.equal(one(r, "ticket.comment-author").state, "UNSUPPORTED_SHAPE");
});

/* ----------------------------------------------------------- historical */
test("16. a missing historical actor is INFORMATIONAL review; tenant links are not weakened", () => {
  const r = run(snap({
    customers: [{ _id: C1 }], users: [{ _id: U1, isInternal: true }], projects: [],
    tickets: [{ _id: oid("31"), clientId: U1, customerId: C9, comments: [{ authorId: U9 }] }],
  }));
  const actor = one(r, "ticket.comment-author");
  assert.equal(actor.state, "MISSING_TARGET");
  assert.equal(actor.severity, "INFORMATIONAL");
  assert.equal(actor.classification, "HISTORICAL_REVIEW");
  assert.equal(actor.cleanupBlocker, null);
  const tenant = one(r, "ticket.customer");
  assert.equal(tenant.state, "MISSING_TARGET");
  assert.equal(tenant.severity, "CRITICAL");
});

/* ----------------------------------------------------------- legacy Production */
const prod = (extra) => base({ productions: [{ _id: PR1, coverMedia: M1, gallery: [M1] }], media: [{ _id: M1 }], ...extra });

test("17. Job → Production valid link is reported as retirement evidence", () => {
  const f = one(run(snap(prod({ jobs: [{ _id: J1, customerId: C1, productionId: PR1 }] }))), "job.production");
  assert.equal(f.state, "VALID");
  assert.equal(f.classification, "RETIREMENT_EVIDENCE");
  assert.deepEqual(f.cleanupBlocker, ["production-retirement"]);
});

test("18. Job → Production missing target blocks Production retirement", () => {
  const f = one(run(snap(prod({ jobs: [{ _id: J1, customerId: C1, productionId: PR9 }] }))), "job.production");
  assert.equal(f.state, "MISSING_TARGET");
  assert.ok(f.cleanupBlocker.includes("production-retirement"));
});

test("19. File → Production valid link is retirement evidence", () => {
  const f = one(run(snap(prod({ files: [{ _id: oid("41"), customerId: C1, productionId: PR1 }], jobs: [] }))), "file.production");
  assert.equal(f.classification, "RETIREMENT_EVIDENCE");
});

test("20/21. Production cover is evidence; a gallery with a missing Media reports that element", () => {
  const r = run(snap(prod({ productions: [{ _id: PR1, coverMedia: M1, gallery: [M1, M9] }] })));
  assert.equal(one(r, "production.cover-media").classification, "RETIREMENT_EVIDENCE");
  const g = find(r, "production.gallery");
  assert.deepEqual(g.map((f) => [f.arrayIndex, f.state]), [[0, "VALID"], [1, "MISSING_TARGET"]]);
  assert.ok(r.summary.productionRetirementEvidence >= 2);
  assert.ok(r.summary.cleanupBlockers["production-retirement"] >= 1);
});

/* ----------------------------------------------------------- financial */
test("24. invoice links: broken customer and cross-customer project are CRITICAL financial findings", () => {
  const r = run(snap(base({
    projects: [{ _id: P1, customerId: C2 }],
    invoices: [{ _id: oid("51"), customerId: C9 }, { _id: oid("52"), customerId: C1, projectId: P1 }],
  })));
  const cust = one(r, "invoice.customer");
  assert.equal(cust.state, "MISSING_TARGET");
  assert.equal(cust.severity, "CRITICAL");
  assert.ok(cust.cleanupBlocker.includes("financial-data-cleanup"));
  assert.equal(one(r, "invoice.project-customer").state, "OWNERSHIP_MISMATCH");
});

/* ----------------------------------------------------------- external users */
test("25. an active external user without a company is CRITICAL; vendors and internal users are exempt", () => {
  const V = oid("82");
  const r = run(snap({
    customers: [{ _id: C1 }],
    procurementvendors: [{ _id: V, userId: U2, isActive: true, applicationId: null }],
    vendorapplications: [],
    users: [
      { _id: U1, isInternal: false, isActive: true, clientId: null }, // external, no company
      { _id: U2, isInternal: false, isActive: true, clientId: null }, // approved vendor
      { _id: oid("13"), isInternal: true, isActive: true, clientId: null }, // staff (any role name)
      { _id: oid("14"), isInternal: false, isActive: true, clientId: C9 }, // company missing
      { _id: oid("15"), isActive: true, clientId: null }, // classification not captured
    ],
  }));
  const ext = find(r, "user.external-company");
  assert.deepEqual(ext.map((f) => [f.sourceId, f.state, f.code]), [
    [U1, "MISSING_REQUIRED_REFERENCE", "ACTIVE_EXTERNAL_USER_WITHOUT_COMPANY"],
    [oid("15"), "INCOMPLETE_EVIDENCE", "ACCESS_CLASSIFICATION_NOT_CAPTURED"],
  ]);
  assert.equal(ext[0].severity, "CRITICAL");
  assert.equal(one(r, "user.customer").state, "MISSING_TARGET");
});

/* ----------------------------------------------------------- safety */
test("26. no full documents or personal data: extra fields are refused and findings carry ids only", () => {
  const withEmail = snap(base({ jobs: [{ _id: J1, customerId: C1 }] }));
  withEmail.collections.customers[0].companyName = "Acme Trading LLC";
  assert.throws(() => run(withEmail), /does not need \(customers\.companyName\)/);
  const withUser = snap({ users: [{ _id: U1, isInternal: true, email: "person@example.com" }] });
  assert.throws(() => run(withUser), /users\.email/);
  const secret = snap(base());
  secret.source.profileAlias = "local-dev";
  secret.collections.customers.push({ _id: C9, crmAccountId: "mongodb://u:p@db/x" });
  assert.throws(() => run(secret), /secret-like/);
  const r = run(snap(base({ jobs: [{ _id: J1, customerId: C9 }] })));
  const keys = new Set(r.findings.flatMap((f) => Object.keys(f)));
  assert.deepEqual([...keys].sort(), ["arrayIndex", "classification", "cleanupBlocker", "code", "fieldPath", "group", "kind", "relationship", "severity", "sourceCollection", "sourceId", "state", "targetCollection", "targetId"]);
});

test("27. output is deterministic, and the input is never mutated", () => {
  const s = snap(prod({ jobs: [{ _id: J1, customerId: C9, media: [M1, M9], productionId: PR1 }] }));
  const before = JSON.stringify(s);
  const a = JSON.stringify(run(s));
  const b = JSON.stringify(run(s));
  assert.equal(a, b);
  assert.equal(JSON.stringify(s), before);
});

test("28/29. no mutation capability and no database, storage, network or process imports", () => {
  for (const f of ["references.js", "refcheck.js"]) {
    const code = readFileSync(path.join(SRC, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
    assert.doesNotMatch(code, /mongoose|mongodb"|MongoClient|\bconnect\(|MONGO_URI|dotenv|@aws-sdk|\bS3\b|\bfetch\(|axios|node:http|node:https|node:net|child_process|process\.env/, f);
    assert.doesNotMatch(code, /writeFile|appendFile|unlink|rmSync|rmdir|rename|createWriteStream|mkdir|openSync/, f);
    assert.doesNotMatch(code, /\.(insertOne|insertMany|updateOne|updateMany|deleteOne|deleteMany|bulkWrite|drop|save|create)\(/, f);
    const imports = [...code.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    for (const i of imports) assert.ok(i.startsWith("node:fs") || i.startsWith("node:url") || /^\.\/[a-z]+\.js$/.test(i), `${f} imports ${i}`);
  }
});

test("30. nothing is ever marked safe to delete, and no repair or destructive instruction is emitted", () => {
  const r = JSON.stringify(run(snap(prod({ jobs: [{ _id: J1, customerId: C9, productionId: PR9 }] }))));
  assert.doesNotMatch(r, /SAFE_TO_DELETE|safe to delete"|deleteMany|dropCollection|\$set|\$unset|repair:|fix:/i);
  assert.deepEqual(STATES.filter((s) => /SAFE|DELETE/.test(s)), []);
});

/* ----------------------------------------------------------- catalog drift */
const clone = () => structuredClone(INVENTORY);
const model = (inv, name) => inv.models.find((m) => m.name === name);

test("the catalog matches the current models: no drift, every reference covered or excluded", () => {
  assert.deepEqual(catalogDrift(INVENTORY, catalog), []);
  assert.ok(catalog.relationships.some((r) => r.id === "job.production"));
  assert.ok(Object.values(EXCLUDED).every((reason) => typeof reason === "string" && reason.length > 5));
});

test("drift: a removed, retargeted or new reference field forces review", () => {
  const removed = clone();
  model(removed, "Job").fields = model(removed, "Job").fields.filter((f) => f.path !== "productionId");
  assert.ok(catalogDrift(removed).some((p) => p.includes("jobs.productionId")));
  const retargeted = clone();
  model(retargeted, "File").fields.find((f) => f.path === "jobId").ref = "Project";
  assert.ok(catalogDrift(retargeted).some((p) => p.includes("now references Project")));
  const added = clone();
  model(added, "Job").fields.push({ path: "reviewerId", type: "OID", ref: "User" });
  assert.ok(catalogDrift(added).some((p) => p.includes("uncovered reference field Job.reviewerId")));
  const enumChanged = clone();
  model(enumChanged, "CRMActivity").fields.find((f) => f.path === "entityType").enum.push("vendor");
  assert.ok(catalogDrift(enumChanged).some((p) => p.includes("entityType enum")));
});

/* ----------------------------------------------------------- snapshot format & CLI */
test("snapshot format: version, provenance, capture metadata and unknown collections are enforced", () => {
  assert.throws(() => validateReferenceSnapshot({ ...snap(base()), schemaVersion: "v0" }, catalog), (e) => e.exitCode === 5);
  const noFp = snap(base());
  noFp.source.targetFingerprint = "abc";
  assert.throws(() => validateReferenceSnapshot(noFp, catalog), /targetFingerprint/);
  const unknown = snap(base());
  unknown.collections.sessions = [];
  assert.throws(() => validateReferenceSnapshot(unknown, catalog), /outside the reference catalog/);
  const undeclared = snap(base({ jobs: [{ _id: J1, customerId: C1, projectId: P1 }] }), { capture: { jobs: { complete: true, fields: ["customerId"] } } });
  assert.throws(() => validateReferenceSnapshot(undeclared, catalog), /does not declare/);
  const dup = snap(base());
  dup.collections.customers.push({ _id: C1 });
  assert.throws(() => validateReferenceSnapshot(dup, catalog), /repeats an _id/);
});

test("CLI: explicit snapshot only, deterministic output, documented exit codes", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "refcheck-test-"));
  try {
    const clean = path.join(dir, "clean.json");
    const issues = path.join(dir, "issues.json");
    const future = path.join(dir, "future.json");
    const pii = path.join(dir, "pii.json");
    writeFileSync(clean, JSON.stringify(snap(Object.fromEntries([...catalog.allowedFields.keys()].map((c) => [c, []])))));
    writeFileSync(issues, JSON.stringify(snap(base({ jobs: [{ _id: J1, customerId: C9 }] }))));
    writeFileSync(future, JSON.stringify({ ...snap(base()), schemaVersion: "expresso.lifecycle.reference-snapshot/9" }));
    const p = snap(base());
    p.collections.customers[0].primaryEmail = "someone@example.com";
    writeFileSync(pii, JSON.stringify(p));
    const call = async (argv) => {
      let out = "";
      let err = "";
      const code = await main(argv, { stdout: (s) => (out += s), stderr: (s) => (err += s) });
      return { code, out, err };
    };
    const a = await call(["--snapshot", clean]);
    assert.equal(a.code, 0, a.err);
    assert.equal(JSON.parse(a.out).evidence.complete, true);
    const b = await call(["--snapshot", clean]);
    assert.equal(a.out, b.out);
    assert.equal((await call(["--snapshot", issues])).code, 10);
    assert.equal((await call(["--snapshot", future])).code, 5);
    const leaked = await call(["--snapshot", pii]);
    assert.equal(leaked.code, 4);
    assert.doesNotMatch(leaked.out + leaked.err, /someone@example\.com/);
    for (const argv of [[], ["--help"]]) assert.equal((await call(argv)).code, 0);
    for (const argv of [["--capture"], ["--repair", clean], ["--snapshot"], ["--snapshot", clean, "--fix"], ["reset"]]) assert.equal((await call(argv)).code, 2, argv.join(" "));
    // As a real process, with a misleading MONGO_URI in the environment: still offline.
    const proc = spawnSync(process.execPath, [path.join(SRC, "refcheck.js"), "--snapshot", issues], { encoding: "utf8", env: { PATH: process.env.PATH, MONGO_URI: "mongodb://should-not-be-used.example/x" } });
    assert.equal(proc.status, 10);
    assert.doesNotMatch(proc.stdout + proc.stderr, /should-not-be-used/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
