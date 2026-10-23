// PUI-5 boundaries on the endpoints behind the Client and Vendor portals:
// - tickets: "internal" tickets are staff-only even when linked to a client's
//   company (list, type filter, detail, creation);
// - files: an external upload may link only to the user's own company's
//   project or job, and never to a production (the list populates links);
// - billing: client users get payments without who recorded them;
// - RFQs: a vendor's "quoted" list follows the R2 detail rule (own quotes,
//   approved categories, published or later, never drafts); the default
//   vendor list is unchanged.
import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import { setupAuth, restoreAll, stopApp, startApp, stub, q, oid, call, tokenFor } from "./helpers.js";
import Ticket from "../src/modules/tickets/ticket.model.js";
import File from "../src/modules/files/file.model.js";
import Project from "../src/modules/projects/project.model.js";
import Job from "../src/modules/content/jobs/job.model.js";
import Invoice from "../src/modules/billing/invoice.model.js";
import RFQ from "../src/modules/procurement/rfq.model.js";
import Quotation from "../src/modules/procurement/quotation.model.js";
import ProcurementVendor from "../src/modules/procurement/vendor.model.js";
import { LOCAL_PRIVATE_ROOT } from "../src/utils/privateStorage.js";

delete process.env.AWS_S3_BUCKET;
delete process.env.AWS_S3_PRIVATE_BUCKET;

afterEach(restoreAll);
after(async () => {
  await stopApp();
  await fs.rm(path.join(LOCAL_PRIVATE_ROOT, "private"), { recursive: true, force: true });
});

const companyA = oid();
const companyB = oid();
const ops = { _id: oid(), role: "operations_manager" };
const clientA = { _id: oid(), role: "client", clientId: companyA };

/* ── Tickets ─────────────────────────────────────────────────────────── */

function ticketWorld(tickets) {
  const seen = {};
  const matches = (f, t) =>
    (!f.customerId || String(t.customerId) === String(f.customerId)) &&
    (!f.type || (f.type.$ne ? t.type !== f.type.$ne : t.type === f.type));
  stub(Ticket, "find", (f) => {
    seen.filter = f;
    return q(tickets.filter((t) => matches(f, t)));
  });
  stub(Ticket, "countDocuments", (f) => q(tickets.filter((t) => matches(f, t)).length));
  stub(Ticket, "findById", (id) => q(tickets.find((t) => String(t._id) === String(id)) || null));
  return seen;
}

const tickets = [
  { _id: oid(), type: "support", title: "Site is slow", customerId: companyA, clientId: clientA._id, comments: [] },
  { _id: oid(), type: "internal", title: "Chase overdue invoice", customerId: companyA, clientId: ops._id, comments: [] },
];

test("tickets: a client's list leaves out internal tickets, even when asked for that type", async () => {
  setupAuth({ users: [clientA, ops] });
  const seen = ticketWorld(tickets);
  const r = await call("GET", "/api/tickets", { user: clientA });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.items.map((t) => t.title), ["Site is slow"]);
  const forced = await call("GET", "/api/tickets?type=internal", { user: clientA });
  assert.deepEqual(forced.body.items.map((t) => t.title), ["Site is slow"]);
  assert.deepEqual(seen.filter.type, { $ne: "internal" });
});

test("tickets: a client can't open an internal ticket linked to their company; staff can", async () => {
  setupAuth({ users: [clientA, ops] });
  ticketWorld(tickets);
  assert.equal((await call("GET", `/api/tickets/${tickets[1]._id}`, { user: clientA })).status, 403);
  assert.equal((await call("POST", `/api/tickets/${tickets[1]._id}/comments`, { user: clientA, body: { body: "hi" } })).status, 403);
  assert.equal((await call("GET", `/api/tickets/${tickets[1]._id}`, { user: ops })).status, 200);
  const staffList = await call("GET", "/api/tickets", { user: ops });
  assert.equal(staffList.body.items.length, 2, "staff lists are unchanged");
});

test("tickets: a client filing an 'internal' ticket gets a support ticket instead", async () => {
  setupAuth({ users: [clientA] });
  let created;
  stub(Ticket, "create", async (doc) => {
    created = doc;
    return { _id: oid(), ...doc };
  });
  const r = await call("POST", "/api/tickets", { user: clientA, body: { title: "Help", description: "Please", type: "internal" } });
  assert.equal(r.status, 201);
  assert.equal(created.type, "support");
  assert.equal(String(created.customerId), companyA);
});

/* ── Files ───────────────────────────────────────────────────────────── */

async function upload(user, fields = {}) {
  const base = await startApp();
  const form = new FormData();
  form.append("files", new Blob(["DATA"]), "brief.pdf");
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  const res = await fetch(`${base}/api/files`, { method: "POST", headers: { authorization: `Bearer ${tokenFor(user)}` }, body: form });
  return { status: res.status, body: await res.json() };
}

function fileWorld() {
  const ownProject = oid();
  const foreignProject = oid();
  const ownJob = oid();
  const inserted = [];
  const owned = (rows) => (f) => q(rows.find((r) => String(r._id) === String(f._id) && String(r.customerId) === String(f.customerId)) || null);
  stub(Project, "findOne", owned([{ _id: ownProject, customerId: companyA }, { _id: foreignProject, customerId: companyB }]));
  stub(Job, "findOne", owned([{ _id: ownJob, customerId: companyA }]));
  stub(File, "insertMany", async (docs) => {
    inserted.push(...docs);
    return docs.map((d) => ({ _id: oid(), ...d }));
  });
  return { ownProject, foreignProject, ownJob, inserted };
}

test("files: a client can link an upload to their own project or job", async () => {
  setupAuth({ users: [clientA] });
  const w = fileWorld();
  const r = await upload(clientA, { projectId: w.ownProject, jobId: w.ownJob, customerId: companyB, visibility: "internal" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(String(w.inserted[0].projectId), w.ownProject);
  assert.equal(String(w.inserted[0].customerId), companyA, "company still comes from the user");
  assert.equal(w.inserted[0].visibility, "client");
});

test("files: a client can't link an upload to another company's project, or to a production", async () => {
  setupAuth({ users: [clientA] });
  const w = fileWorld();
  assert.equal((await upload(clientA, { projectId: w.foreignProject })).status, 400);
  assert.equal((await upload(clientA, { jobId: oid() })).status, 400);
  assert.equal((await upload(clientA, { productionId: oid() })).status, 400);
  assert.equal(w.inserted.length, 0, "nothing is stored");
});

test("files: staff uploads are unchanged (any project, any company)", async () => {
  setupAuth({ users: [ops] });
  const w = fileWorld();
  const r = await upload(ops, { projectId: w.foreignProject, customerId: companyB, visibility: "client" });
  assert.equal(r.status, 201);
  assert.equal(String(w.inserted[0].projectId), w.foreignProject);
});

/* ── Billing ─────────────────────────────────────────────────────────── */

const invoice = () => ({
  _id: oid(),
  number: "INV-2026-0001",
  customerId: { _id: companyA, companyName: "Acme" },
  status: "sent",
  payments: [{ _id: oid(), amount: 100, method: "cash", recordedBy: { _id: oid(), name: "", email: "finance@expresso.example" } }],
});

test("billing: client users get payments without who recorded them; staff still do", async () => {
  setupAuth({ users: [clientA, ops] });
  const inv = invoice();
  stub(Invoice, "findById", () => q({ ...inv, payments: inv.payments.map((p) => ({ ...p })) }));
  stub(Invoice, "find", () => q([{ ...inv, payments: inv.payments.map((p) => ({ ...p })) }]));
  stub(Invoice, "countDocuments", () => q(1));
  const own = await call("GET", `/api/billing/invoices/${inv._id}`, { user: clientA });
  assert.equal(own.status, 200);
  assert.equal(own.body.item.payments[0].amount, 100);
  assert.equal("recordedBy" in own.body.item.payments[0], false);
  const list = await call("GET", "/api/billing/invoices", { user: clientA });
  assert.equal("recordedBy" in list.body.items[0].payments[0], false);
  const staff = await call("GET", `/api/billing/invoices/${inv._id}`, { user: ops });
  assert.equal(staff.body.item.payments[0].recordedBy.email, "finance@expresso.example");
});

test("billing: another company's invoice is still refused", async () => {
  setupAuth({ users: [clientA] });
  stub(Invoice, "findById", () => q({ ...invoice(), customerId: { _id: companyB } }));
  assert.equal((await call("GET", `/api/billing/invoices/${oid()}`, { user: clientA })).status, 403);
});

/* ── Vendor RFQs ─────────────────────────────────────────────────────── */

const catA = oid();
const catB = oid();
const vendorUser = { _id: oid(), role: "vendor" };
const vendor = { _id: oid(), userId: vendorUser._id, categories: [catA], isActive: true };
const otherVendor = { _id: oid() };
const rfqs = {
  open: { _id: oid(), title: "Open, not quoted", status: "published", subcategoryIds: [catA] },
  quotedOpen: { _id: oid(), title: "Open, quoted", status: "published", subcategoryIds: [catA] },
  quotedAwarded: { _id: oid(), title: "Awarded, quoted", status: "awarded", subcategoryIds: [catA] },
  quotedDraft: { _id: oid(), title: "Draft, quoted", status: "draft", subcategoryIds: [catA] },
  quotedOtherCategory: { _id: oid(), title: "Other category, quoted", status: "closed", subcategoryIds: [catB] },
  othersOnly: { _id: oid(), title: "Closed, someone else's quote", status: "closed", subcategoryIds: [catA] },
};
const quotes = [
  ...["quotedOpen", "quotedAwarded", "quotedDraft", "quotedOtherCategory"].map((k) => ({ _id: oid(), rfqId: rfqs[k]._id, vendorId: vendor._id, status: "submitted" })),
  { _id: oid(), rfqId: rfqs.othersOnly._id, vendorId: otherVendor._id, status: "accepted" },
];

function rfqWorld() {
  setupAuth({ users: [vendorUser] });
  stub(ProcurementVendor, "findOne", (f) => q(String(f.userId) === String(vendor.userId) && f.isActive ? vendor : null));
  const seen = { selects: [] };
  const inSet = (cond, v) => !cond || (cond.$in ? cond.$in.map(String).includes(String(v)) : String(cond) === String(v));
  const matches = (f, r) =>
    inSet(f._id, r._id) &&
    (!f.status || (f.status.$in ? f.status.$in.includes(r.status) : r.status === f.status)) &&
    (!f.subcategoryIds || r.subcategoryIds.some((c) => f.subcategoryIds.$in.map(String).includes(String(c))));
  stub(RFQ, "find", (f) => {
    seen.filter = f;
    const c = q(Object.values(rfqs).filter((r) => matches(f, r)));
    c.select = (s) => {
      seen.selects.push(s);
      return c;
    };
    return c;
  });
  stub(RFQ, "countDocuments", (f) => q(Object.values(rfqs).filter((r) => matches(f, r)).length));
  stub(Quotation, "find", (f) => q(quotes.filter((x) => inSet(f.vendorId, x.vendorId) && inSet(f.rfqId, x.rfqId))));
  return seen;
}

test("vendor RFQs: 'quoted' lists only the vendor's own quoted RFQs, published or later, in its categories", async () => {
  const seen = rfqWorld();
  const r = await call("GET", "/api/procurement/rfqs?quoted=true", { user: vendorUser });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.items.map((i) => i.title).sort(), ["Awarded, quoted", "Open, quoted"]);
  assert.ok(r.body.items.every((i) => i.myQuotationStatus === "submitted"));
  assert.ok(seen.selects.some((s) => /rfqNumber/.test(s) && !/requestId|createdBy/.test(s)), "vendor-safe fields only");
});

test("vendor RFQs: the default vendor list is unchanged (published in approved categories)", async () => {
  const seen = rfqWorld();
  const r = await call("GET", "/api/procurement/rfqs", { user: vendorUser });
  assert.deepEqual(r.body.items.map((i) => i.title).sort(), ["Open, not quoted", "Open, quoted"]);
  assert.equal(seen.filter.status, "published");
});
