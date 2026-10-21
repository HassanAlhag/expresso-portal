// Stage R3 — reliability and data consistency (P2-3, P2-4, P2-7 seedUser).
// Requests go through the real Express app; model calls are stubbed with
// small in-memory stores whose writes apply at call time, like single-document
// MongoDB operations, so concurrent requests interleave realistically.
import "./setup-env.js";
import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import mongoose from "mongoose";
import { setupAuth, restoreAll, startApp, stopApp, stub, q, oid, call } from "./helpers.js";
import Counter from "../src/modules/admin/counter.model.js";
import Invoice from "../src/modules/billing/invoice.model.js";
import RFQ from "../src/modules/procurement/rfq.model.js";
import ProcurementRequest from "../src/modules/procurement/request.model.js";
import Project from "../src/modules/projects/project.model.js";
import User from "../src/modules/iam/users/user.model.js";
import { nextInvoiceNumber } from "../src/modules/billing/billing.controller.js";
import { genRfqNumber } from "../src/modules/procurement/rfq.controller.js";
import { seedSuperAdmin } from "../src/scripts/seedUser.js";

before(startApp); // start once, so concurrent first requests share one server
afterEach(restoreAll);
after(stopApp);

const YEAR = new Date().getFullYear();
const admin = { _id: oid(), role: "super_admin" };
const mustNotWrite = (what) => () => assert.fail(`${what} must not be called`);
const tick = () => new Promise((r) => setTimeout(r, Math.random() * 4));
const dupError = (field, value) => Object.assign(new Error(`E11000 duplicate key error dup key: { ${field}: "${value}" }`), { code: 11000, keyPattern: { [field]: 1 }, keyValue: { [field]: value } });

/* In-memory counters collection: $inc, insert and $max behave like MongoDB
   single-document operations (atomic; insert refused on an existing _id;
   updateOne without upsert never creates). Nothing here models a JS lock. */
function fakeCounters(initial = {}) {
  const store = new Map(Object.entries(initial));
  store.inserts = { ok: 0, refused: 0 };
  stub(Counter, "findOneAndUpdate", (filter, update, opts) => {
    if (opts?.upsert) assert.fail("counter $inc must not upsert");
    if (!store.has(filter._id)) return q(null);
    store.set(filter._id, store.get(filter._id) + update.$inc.seq);
    return q({ _id: filter._id, seq: store.get(filter._id) });
  });
  stub(Counter, "create", async (doc) => {
    await tick();
    if (store.has(doc._id)) { store.inserts.refused += 1; throw dupError("_id", doc._id); }
    store.inserts.ok += 1;
    store.set(doc._id, doc.seq);
    return doc;
  });
  stub(Counter, "updateOne", (filter, update, opts) => {
    if (opts?.upsert) assert.fail("raiseCounter must not upsert");
    if (store.has(filter._id)) store.set(filter._id, Math.max(store.get(filter._id), update.$max.seq));
    return q({ acknowledged: true, matchedCount: store.has(filter._id) ? 1 : 0 });
  });
  return store;
}

/* Collection with a unique (or non-unique) string field and $regex queries. */
function fakeNumbered(Model, field, { unique, rows = [], slowReads = false }) {
  const docs = rows.map((v) => ({ _id: new mongoose.Types.ObjectId(), [field]: v }));
  const match = (f) => (d) => {
    const c = f?.[field];
    if (!c) return true;
    if (c.$regex) return new RegExp(c.$regex).test(d[field]);
    return d[field] === c;
  };
  stub(Model, "find", (f) => q(async () => { if (slowReads) await new Promise((r) => setTimeout(r, 25)); return docs.filter(match(f)).map((d) => ({ ...d })); }));
  stub(Model, "findOne", (f) => q(() => [...docs].filter(match(f)).sort((a, b) => (a[field] < b[field] ? 1 : -1))[0] || null));
  stub(Model, "countDocuments", (f) => q(() => docs.filter(match(f)).length));
  stub(Model, "findById", (id) => q(() => docs.find((d) => String(d._id) === String(id)) || null));
  let creates = 0;
  Object.defineProperty(docs, "creates", { get: () => creates });
  stub(Model, "create", async (doc) => {
    creates += 1;
    await tick();
    if (unique && docs.some((d) => d[field] === doc[field])) throw dupError(field, doc[field]);
    const d = { _id: new mongoose.Types.ObjectId(), ...doc };
    docs.push(d);
    return d;
  });
  return docs;
}
const createInvoice = (body = {}) => call("POST", "/api/billing/invoices", { user: admin, body: { customerId: oid(), ...body } });

// ═══ P2-3 INVOICE NUMBERS ═══════════════════════════════════════════════════
test("invoice numbers: 20 simultaneous creations all succeed with 20 distinct, sequential numbers", async () => {
  setupAuth({ users: [admin] });
  fakeCounters();
  const docs = fakeNumbered(Invoice, "number", { unique: true });
  const rs = await Promise.all(Array.from({ length: 20 }, () => createInvoice()));
  assert.deepEqual(rs.map((r) => r.status), Array(20).fill(201), "no request fails on the unique index");
  const numbers = docs.map((d) => d.number).sort();
  assert.equal(new Set(numbers).size, 20);
  assert.deepEqual(numbers, Array.from({ length: 20 }, (_, i) => `INV-${YEAR}-${String(i + 1).padStart(4, "0")}`));
});

test("invoice numbers: a new counter starts above the highest existing number (no renumbering)", async () => {
  setupAuth({ users: [admin] });
  fakeCounters();
  const docs = fakeNumbered(Invoice, "number", { unique: true, rows: [`INV-${YEAR}-0007`, `INV-${YEAR}-0041`, `INV-${YEAR - 1}-0300`, "CUSTOM-1"] });
  const r = await createInvoice();
  assert.equal(r.status, 201);
  assert.equal(docs.at(-1).number, `INV-${YEAR}-0042`);
  assert.deepEqual(docs.slice(0, 4).map((d) => d.number), [`INV-${YEAR}-0007`, `INV-${YEAR}-0041`, `INV-${YEAR - 1}-0300`, "CUSTOM-1"], "existing numbers unchanged");
});

test("invoice numbers: if the counter is behind a hand-entered number, creation retries past it; no partial invoices", async () => {
  setupAuth({ users: [admin] });
  const counters = fakeCounters({ [`invoice-${YEAR}`]: 2 });
  const docs = fakeNumbered(Invoice, "number", { unique: true, rows: [`INV-${YEAR}-0001`, `INV-${YEAR}-0002`, `INV-${YEAR}-0003`, `INV-${YEAR}-0004`] });
  const r = await createInvoice();
  assert.equal(r.status, 201);
  assert.equal(docs.length, 5, "exactly one invoice was created");
  assert.equal(docs.at(-1).number, `INV-${YEAR}-0005`);
  assert.equal(counters.get(`invoice-${YEAR}`), 5);
});

test("invoice numbers: a duplicate hand-entered number is a clear 409 and creates nothing", async () => {
  setupAuth({ users: [admin] });
  fakeCounters();
  const docs = fakeNumbered(Invoice, "number", { unique: true, rows: ["INV-MANUAL-1"] });
  const r = await createInvoice({ number: "INV-MANUAL-1" });
  assert.equal(r.status, 409);
  assert.match(r.body.message, /already in use/);
  assert.equal(docs.length, 1);
});

test("invoice numbers: changing an invoice to a number already in use is a 409, not a 500", async () => {
  setupAuth({ users: [admin] });
  const doc = { _id: oid(), number: "INV-A", save: async () => { throw dupError("number", "INV-B"); } };
  stub(Invoice, "findById", () => doc);
  const r = await call("PATCH", `/api/billing/invoices/${doc._id}`, { user: admin, body: { number: "INV-B" } });
  assert.equal(r.status, 409);
});

test("invoice numbers: each year has its own sequence", async () => {
  fakeCounters({ [`invoice-${YEAR}`]: 20 });
  fakeNumbered(Invoice, "number", { unique: true });
  assert.equal((await nextInvoiceNumber(YEAR + 1)).value, `INV-${YEAR + 1}-0001`);
  assert.equal((await nextInvoiceNumber(YEAR)).value, `INV-${YEAR}-0021`);
});

// ═══ P2-3 RFQ NUMBERS ═══════════════════════════════════════════════════════
const createRfq = () => call("POST", "/api/procurement/rfqs", { user: admin, body: { title: "Laptops" } });

test("RFQ numbers: 20 simultaneous creations get 20 distinct numbers", async () => {
  setupAuth({ users: [admin] });
  fakeCounters();
  const docs = fakeNumbered(RFQ, "rfqNumber", { unique: false });
  const rs = await Promise.all(Array.from({ length: 20 }, () => createRfq()));
  assert.deepEqual(rs.map((r) => r.status), Array(20).fill(201));
  assert.equal(new Set(docs.map((d) => d.rfqNumber)).size, 20, "no duplicate RFQ numbers");
});

test("RFQ numbers: deleting an RFQ does not cause its number (or another) to be reused", async () => {
  setupAuth({ users: [admin] });
  fakeCounters();
  const docs = fakeNumbered(RFQ, "rfqNumber", { unique: false, rows: [`RFQ-${YEAR}-0001`, `RFQ-${YEAR}-0002`, `RFQ-${YEAR}-0003`] });
  docs.splice(1, 1); // RFQ-…-0002 deleted
  const r = await createRfq();
  assert.equal(r.status, 201);
  assert.equal(docs.at(-1).rfqNumber, `RFQ-${YEAR}-0004`);
  assert.equal(docs.filter((d) => d.rfqNumber === `RFQ-${YEAR}-0003`).length, 1);
});

test("RFQ numbers: continue above numbers issued by the old count-based scheme and reset per year", async () => {
  fakeCounters();
  fakeNumbered(RFQ, "rfqNumber", { unique: false, rows: [`RFQ-${YEAR - 1}-0007`, `RFQ-${YEAR}-0012`, `RFQ-${YEAR}-0012`] });
  assert.equal(await genRfqNumber(YEAR), `RFQ-${YEAR}-0013`, "existing duplicates are left as they are; new numbers go above them");
  assert.equal(await genRfqNumber(YEAR + 1), `RFQ-${YEAR + 1}-0001`);
});

test("RFQ numbers: RFQs created from a procurement request use the same sequence", async () => {
  setupAuth({ users: [admin] });
  fakeCounters({ [`rfq-${YEAR}`]: 9 });
  const docs = fakeNumbered(RFQ, "rfqNumber", { unique: false });
  const reqId = oid();
  stub(ProcurementRequest, "findById", () => q({ _id: reqId, title: "Cameras", description: "", categoryId: { _id: oid(), name: "Camera rental", level: 3 } }));
  stub(ProcurementRequest, "updateOne", () => q({ modifiedCount: 1 }));
  stub(ProcurementRequest, "findByIdAndUpdate", () => q({}));
  const r = await call("POST", `/api/procurement/requests/${reqId}/create-rfq`, { user: admin });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(docs.at(-1).rfqNumber, `RFQ-${YEAR}-0010`);
});

// ═══ P2-4 PROJECT DELETE → ARCHIVE ══════════════════════════════════════════
function projectWorld(status = "active") {
  const p = { _id: oid(), name: "Relaunch", customerId: oid(), status, archivedAt: null };
  stub(Project, "findById", () => q(() => ({ ...p })));
  stub(Project, "findByIdAndDelete", mustNotWrite("Project.findByIdAndDelete"));
  stub(Project, "deleteOne", mustNotWrite("Project.deleteOne"));
  stub(Project, "deleteMany", mustNotWrite("Project.deleteMany"));
  const writes = [];
  stub(Project, "updateOne", (filter, update) => {
    writes.push({ filter, update });
    Object.assign(p, update.$set);
    return q({ modifiedCount: 1 });
  });
  return { p, writes };
}

test("project DELETE archives the project instead of deleting it", async () => {
  setupAuth({ users: [admin] });
  const { p, writes } = projectWorld();
  const r = await call("DELETE", `/api/projects/${p._id}`, { user: admin });
  assert.equal(r.status, 200);
  assert.equal(r.body.archived, true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].update.$set.status, "archived");
  assert.ok(writes[0].update.$set.archivedAt instanceof Date || typeof writes[0].update.$set.archivedAt === "string");
  assert.equal(p.status, "archived");
});

test("project DELETE leaves linked jobs, invoices, files, tickets and enrollments untouched", async () => {
  setupAuth({ users: [admin] });
  const { p } = projectWorld();
  const linked = ["../src/modules/content/jobs/job.model.js", "../src/modules/billing/invoice.model.js", "../src/modules/files/file.model.js", "../src/modules/tickets/ticket.model.js", "../src/modules/enrollments/enrollment.model.js"];
  for (const path of linked) {
    const M = (await import(path)).default;
    for (const m of ["deleteOne", "deleteMany", "updateMany", "findByIdAndDelete"]) stub(M, m, mustNotWrite(`${M.modelName}.${m}`));
  }
  assert.equal((await call("DELETE", `/api/projects/${p._id}`, { user: admin })).status, 200);
});

test("project DELETE on an already archived project is harmless (no second write)", async () => {
  setupAuth({ users: [admin] });
  const { p, writes } = projectWorld("archived");
  const r = await call("DELETE", `/api/projects/${p._id}`, { user: admin });
  assert.equal(r.status, 200);
  assert.equal(writes.length, 0);
});

test("project list hides archived projects by default; status=archived and includeArchived show them", async () => {
  setupAuth({ users: [admin] });
  const filters = [];
  stub(Project, "find", (f) => { filters.push(f); return q([]); });
  stub(Project, "countDocuments", () => q(0));
  await call("GET", "/api/projects", { user: admin });
  assert.deepEqual(filters.at(-1).status, { $ne: "archived" });
  await call("GET", "/api/projects?status=archived", { user: admin });
  assert.equal(filters.at(-1).status, "archived");
  await call("GET", "/api/projects?includeArchived=true", { user: admin });
  assert.equal(filters.at(-1).status, undefined);
  await call("GET", "/api/projects?status=active", { user: admin });
  assert.equal(filters.at(-1).status, "active");
});

test("project list keeps the company boundary for client users, including archived views", async () => {
  const clientId = oid();
  const clientUser = { _id: oid(), role: "client", clientId };
  setupAuth({ users: [clientUser] });
  const filters = [];
  stub(Project, "find", (f) => { filters.push(f); return q([]); });
  stub(Project, "countDocuments", () => q(0));
  const r = await call("GET", "/api/projects?status=archived", { user: clientUser });
  assert.equal(r.status, 200);
  assert.equal(String(filters.at(-1).customerId), String(clientId));
  assert.equal(filters.at(-1).status, "archived");
});

test("project DELETE stays refused for client users (R2), before any write", async () => {
  const clientUser = { _id: oid(), role: "client", clientId: oid() };
  setupAuth({ users: [clientUser], roles: { client: { permissions: ["projects.read", "projects.delete"], isInternal: false } } });
  const { p, writes } = projectWorld();
  assert.equal((await call("DELETE", `/api/projects/${p._id}`, { user: clientUser })).status, 403);
  assert.equal(writes.length, 0);
});

// ═══ P2-7 seedUser.js INSERT-ONLY ═══════════════════════════════════════════
function userWorld(existing = null) {
  const calls = { created: [], updated: [] };
  stub(User, "findOne", () => q(existing));
  stub(User, "findOneAndUpdate", mustNotWrite("User.findOneAndUpdate (upsert)"));
  stub(User, "create", async (doc) => { calls.created.push(doc); return { _id: oid(), ...doc }; });
  stub(User, "updateOne", (f, u) => { calls.updated.push({ f, u }); return q({ modifiedCount: 1 }); });
  stub(User, "hashPassword", async (p) => `hash:${p}`);
  return calls;
}

test("seedUser: creates the super_admin when the email is new, without the legacy permissions field", async () => {
  const calls = userWorld(null);
  const r = await seedSuperAdmin({ email: " Admin@Expresso.Example ", password: "pw-123456", fullName: "Admin" });
  assert.equal(r.outcome, "created");
  assert.equal(calls.created.length, 1);
  assert.equal(calls.created[0].email, "admin@expresso.example");
  assert.equal(calls.created[0].role, "super_admin");
  assert.equal("permissions" in calls.created[0], false);
});

test("seedUser: an existing account is left exactly as it is (no password reset, no role change)", async () => {
  const calls = userWorld({ _id: oid(), role: "staff" });
  stub(User, "updateOne", mustNotWrite("User.updateOne"));
  stub(User, "create", mustNotWrite("User.create"));
  const r = await seedSuperAdmin({ email: "someone@expresso.example", password: "new-password" });
  assert.equal(r.outcome, "exists");
  assert.equal(calls.created.length, 0);
});

test("seedUser: --reset-password changes only the password of an existing super_admin", async () => {
  const id = oid();
  const calls = userWorld({ _id: id, role: "super_admin" });
  const r = await seedSuperAdmin({ email: "admin@expresso.example", password: "rotated-pw", resetPassword: true });
  assert.equal(r.outcome, "password-reset");
  assert.equal(calls.updated.length, 1);
  assert.deepEqual(Object.keys(calls.updated[0].u.$set).sort(), ["passwordChangedAt", "passwordHash"]);
  assert.equal(calls.updated[0].f.role, "super_admin");
});

test("seedUser: --reset-password never promotes or resets a non-super_admin account", async () => {
  userWorld({ _id: oid(), role: "client" });
  stub(User, "updateOne", mustNotWrite("User.updateOne"));
  const r = await seedSuperAdmin({ email: "client@acme.example", password: "x", resetPassword: true });
  assert.equal(r.outcome, "not-super-admin");
});

test("seedUser: if another process creates the account first, nothing is overwritten", async () => {
  userWorld(null);
  stub(User, "create", async () => { throw dupError("email", "admin@expresso.example"); });
  const r = await seedSuperAdmin({ email: "admin@expresso.example", password: "pw" });
  assert.equal(r.outcome, "exists");
});

test("seedUser: missing email or password touches nothing", async () => {
  stub(User, "findOne", mustNotWrite("User.findOne"));
  assert.equal((await seedSuperAdmin({ email: "", password: "x" })).outcome, "missing-config");
});

test("seedUser: the script no longer upserts and does not run when imported", () => {
  const src = fs.readFileSync(new URL("../src/scripts/seedUser.js", import.meta.url), "utf8");
  assert.doesNotMatch(src, /upsert/);
  assert.doesNotMatch(src, /findOneAndUpdate/);
  assert.match(src, /--reset-password/);
});

// ═══ R3 REVIEW — COUNTER BOOTSTRAP, MANUAL NUMBERS, YEARS, FAILURES ═════════
test("first use, invoices: 20 simultaneous creations with no counter yet all race the bootstrap and get distinct numbers above the highest", async () => {
  setupAuth({ users: [admin] });
  const counters = fakeCounters(); // no counter document
  const docs = fakeNumbered(Invoice, "number", { unique: true, slowReads: true, rows: [`INV-${YEAR}-0007`, `INV-${YEAR}-0041`, `INV-${YEAR - 1}-0300`, `INV-${YEAR}-NOTE`, "CUSTOM-9999"] });
  const rs = await Promise.all(Array.from({ length: 20 }, () => createInvoice()));
  assert.deepEqual(rs.map((r) => r.status), Array(20).fill(201), "no duplicate-key 500");
  const fresh = docs.slice(5).map((d) => d.number).sort();
  assert.deepEqual(fresh, Array.from({ length: 20 }, (_, i) => `INV-${YEAR}-${String(42 + i).padStart(4, "0")}`));
  assert.equal(counters.inserts.ok, 1, "exactly one bootstrap insert wins");
  assert.ok(counters.inserts.refused >= 1, `the others were refused by the unique _id (${counters.inserts.refused})`);
  assert.equal(docs.creates, 20, "no invoice insert had to be retried");
});

test("first use, RFQs: 20 simultaneous creations with no counter yet get distinct numbers above this year's highest", async () => {
  setupAuth({ users: [admin] });
  const counters = fakeCounters();
  const docs = fakeNumbered(RFQ, "rfqNumber", { unique: false, slowReads: true, rows: [`RFQ-${YEAR}-0003`, `RFQ-${YEAR}-0012`, `RFQ-${YEAR - 1}-0090`] });
  const rs = await Promise.all(Array.from({ length: 20 }, () => createRfq()));
  assert.deepEqual(rs.map((r) => r.status), Array(20).fill(201));
  const fresh = docs.slice(3).map((d) => d.rfqNumber).sort();
  assert.deepEqual(fresh, Array.from({ length: 20 }, (_, i) => `RFQ-${YEAR}-${String(13 + i).padStart(4, "0")}`));
  assert.equal(counters.inserts.ok, 1);
});

test("no process-local allocation state: sequence.js keeps nothing in memory between calls", () => {
  const src = fs.readFileSync(new URL("../src/utils/sequence.js", import.meta.url), "utf8");
  assert.doesNotMatch(src, /^(let|var)\s/m, "no module-level mutable variables");
  assert.doesNotMatch(src, /new (Map|Set)\(|mutex|lock\b/i, "no in-memory caches or locks");
  assert.match(src, /\$inc/);
  assert.doesNotMatch(src, /upsert/, "counters are only created by an insert that a unique _id can refuse");
});

test("manual invoice numbers: a larger hand-entered number moves the counter past it; later automatic numbers never collide", async () => {
  setupAuth({ users: [admin] });
  const counters = fakeCounters({ [`invoice-${YEAR}`]: 3 });
  const docs = fakeNumbered(Invoice, "number", { unique: true, rows: [`INV-${YEAR}-0001`, `INV-${YEAR}-0002`, `INV-${YEAR}-0003`] });
  assert.equal((await createInvoice({ number: `INV-${YEAR}-0050` })).status, 201);
  assert.equal(counters.get(`invoice-${YEAR}`), 50);
  const before = docs.creates;
  assert.equal((await createInvoice()).status, 201);
  assert.equal(docs.at(-1).number, `INV-${YEAR}-0051`);
  assert.equal(docs.creates - before, 1, "first attempt succeeded; no collision");
  assert.equal((await createInvoice({ number: `INV-${YEAR}-0010` })).status, 201, "a lower free number is accepted");
  assert.equal(counters.get(`invoice-${YEAR}`), 51, "and never lowers the counter");
  assert.deepEqual(docs.slice(0, 3).map((d) => d.number), [`INV-${YEAR}-0001`, `INV-${YEAR}-0002`, `INV-${YEAR}-0003`], "nothing renumbered");
});

test("manual invoice numbers: a number for another year or in another format does not create or move counters", async () => {
  setupAuth({ users: [admin] });
  const counters = fakeCounters({ [`invoice-${YEAR}`]: 3 });
  fakeNumbered(Invoice, "number", { unique: true });
  assert.equal((await createInvoice({ number: `INV-${YEAR + 1}-0005` })).status, 201);
  assert.equal((await createInvoice({ number: "PO-REF-77" })).status, 201);
  assert.equal(counters.has(`invoice-${YEAR + 1}`), false, "no counter created by a manual number");
  assert.equal(counters.get(`invoice-${YEAR}`), 3);
  assert.equal((await nextInvoiceNumber(YEAR + 1)).value, `INV-${YEAR + 1}-0006`, "that year's counter later starts above it");
});

test("manual invoice numbers: changing an invoice's number to a larger one also moves the counter", async () => {
  setupAuth({ users: [admin] });
  const counters = fakeCounters({ [`invoice-${YEAR}`]: 4 });
  const doc = { _id: oid(), number: `INV-${YEAR}-0004`, save: async () => {} };
  stub(Invoice, "findById", () => q(doc));
  assert.equal((await call("PATCH", `/api/billing/invoices/${doc._id}`, { user: admin, body: { number: `INV-${YEAR}-0070` } })).status, 200);
  assert.equal(counters.get(`invoice-${YEAR}`), 70);
});

test("year boundary: INV-2026 and INV-2027 are separate counters, each starting from its own year's records", async () => {
  const counters = fakeCounters({ "invoice-2026": 120 });
  fakeNumbered(Invoice, "number", { unique: true, rows: ["INV-2026-0120", "INV-2027-0004", "INV-2027-0002"] });
  assert.equal((await nextInvoiceNumber(2027)).value, "INV-2027-0005", "2027 starts from 2027's records, not 2026's counter");
  assert.equal((await nextInvoiceNumber(2026)).value, "INV-2026-0121");
  assert.equal((await nextInvoiceNumber(2027)).value, "INV-2027-0006");
  assert.deepEqual([...counters.keys()].sort(), ["invoice-2026", "invoice-2027"]);
});

test("year boundary: RFQ-2026 and RFQ-2027 are separate counters; a year with no records starts at 0001", async () => {
  const counters = fakeCounters({ "rfq-2026": 30 });
  fakeNumbered(RFQ, "rfqNumber", { unique: false, rows: ["RFQ-2026-0030", "RFQ-2027-0008"] });
  assert.equal(await genRfqNumber(2027), "RFQ-2027-0009");
  assert.equal(await genRfqNumber(2026), "RFQ-2026-0031");
  assert.equal(await genRfqNumber(2028), "RFQ-2028-0001");
  assert.deepEqual([...counters.keys()].sort(), ["rfq-2026", "rfq-2027", "rfq-2028"]);
});

test("allocation failure, invoices: the counter failing gives a controlled 503 and no invoice", async () => {
  setupAuth({ users: [admin] });
  stub(Counter, "findOneAndUpdate", () => { throw new Error("simulated database outage"); });
  stub(Invoice, "create", mustNotWrite("Invoice.create"));
  const r = await createInvoice();
  assert.equal(r.status, 503);
  assert.match(r.body.message, /Nothing was created/);
  assert.ok(!JSON.stringify(r.body).includes("simulated"), "internal error text is not returned");
});

test("allocation failure during bootstrap (insert fails for another reason) also gives 503 and no invoice", async () => {
  setupAuth({ users: [admin] });
  fakeCounters();
  fakeNumbered(Invoice, "number", { unique: true });
  stub(Counter, "create", async () => { throw new Error("simulated write concern failure"); });
  stub(Invoice, "create", mustNotWrite("Invoice.create"));
  assert.equal((await createInvoice()).status, 503);
});

test("allocation failure, RFQs: both creation paths give 503 and create no RFQ", async () => {
  setupAuth({ users: [admin] });
  stub(Counter, "findOneAndUpdate", () => { throw new Error("simulated database outage"); });
  stub(RFQ, "create", mustNotWrite("RFQ.create"));
  stub(RFQ, "findOne", () => q(null));
  const reqId = oid();
  stub(ProcurementRequest, "findById", () => q({ _id: reqId, title: "Cameras", categoryId: { _id: oid() } }));
  stub(ProcurementRequest, "findByIdAndUpdate", mustNotWrite("ProcurementRequest.findByIdAndUpdate"));
  assert.equal((await createRfq()).status, 503);
  assert.equal((await call("POST", `/api/procurement/requests/${reqId}/create-rfq`, { user: admin })).status, 503);
});

test("archive: an archived project can still be opened directly by an authorised user", async () => {
  setupAuth({ users: [admin] });
  const p = { _id: oid(), name: "Old site", status: "archived", archivedAt: new Date().toISOString(), customerId: oid() };
  stub(Project, "findById", () => q(p));
  const Enrollment = (await import("../src/modules/enrollments/enrollment.model.js")).default;
  stub(Enrollment, "countDocuments", () => q(0));
  const r = await call("GET", `/api/projects/${p._id}`, { user: admin });
  assert.equal(r.status, 200);
  assert.equal(r.body.item.status, "archived");
});

test("seedUser: --reset-password for an email with no account creates nothing", async () => {
  userWorld(null);
  stub(User, "create", mustNotWrite("User.create"));
  stub(User, "updateOne", mustNotWrite("User.updateOne"));
  const r = await seedSuperAdmin({ email: "nobody@expresso.example", password: "pw", resetPassword: true });
  assert.equal(r.outcome, "not-found");
});

