// PUI-2 decision (21 Oct 2026): client users never receive a project's
// internal notes or internal budget. Excluded at the query; staff keep them;
// company isolation is unchanged.
import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { setupAuth, restoreAll, startApp, stopApp, stub, q, oid, call } from "./helpers.js";
import Project from "../src/modules/projects/project.model.js";
import Enrollment from "../src/modules/enrollments/enrollment.model.js";
import Invoice from "../src/modules/billing/invoice.model.js";
import { CLIENT_HIDDEN_PROJECT_FIELDS, CLIENT_PROJECT_PROJECTION } from "../src/modules/projects/project.controller.js";

before(startApp);
afterEach(restoreAll);
after(stopApp);

const companyA = oid();
const companyB = oid();
const pm = { _id: oid(), role: "project_manager" };
const clientA = { _id: oid(), role: "client", clientId: companyA };
const roles = {
  project_manager: { permissions: ["projects.read", "projects.write"], isInternal: true },
  client: { permissions: ["projects.read"] },
};

function projectDoc(over = {}) {
  return {
    _id: oid(),
    name: "E-commerce relaunch",
    code: "P-1042",
    status: "active",
    customerId: { _id: companyA, companyName: "Acme Company" },
    description: "Rebuild of the online store.",
    startDate: "2026-07-01",
    endDate: "2026-12-18",
    currency: "AED",
    budget: 180000,
    notes: "Payment terms 40/40/20. Internal only.",
    agreementRevisions: [{ price: 9999, reference: "Private agreement" }],
    operatingEvents: [{ reason: "Internal review" }],
    adoptionMappings: [{ jobId: oid() }],
    ...over,
  };
}

// A query fake that behaves like Mongoose for projections: it records every
// select() and applies exclusions ("-field") to what it returns.
function projectingQuery(result, seen) {
  const excluded = new Set();
  const c = {};
  for (const m of ["lean", "populate", "sort", "skip", "limit", "collation"]) c[m] = () => c;
  c.select = (arg) => {
    seen.selects.push(arg);
    for (const [k, v] of Object.entries(arg || {})) if (v === 0) excluded.add(k);
    return c;
  };
  const strip = (doc) => (doc ? Object.fromEntries(Object.entries(doc).filter(([k]) => !excluded.has(k))) : doc);
  const value = () => (Array.isArray(result) ? result.map(strip) : strip(result));
  c.then = (res, rej) => Promise.resolve().then(value).then(res, rej);
  c.exec = () => Promise.resolve().then(value);
  return c;
}

function stubProjects(docs) {
  const seen = { selects: [], filter: null };
  stub(Project, "findById", () => projectingQuery(docs[0], seen));
  stub(Project, "find", (f) => {
    seen.filter = f;
    return projectingQuery(docs, seen);
  });
  stub(Project, "countDocuments", (f) => {
    seen.filter = f;
    return q(docs.length);
  });
  stub(Enrollment, "countDocuments", () => q(0));
  return seen;
}

test("commercial and Operating Model internals form a valid Mongoose exclusion", () => {
  assert.deepEqual(CLIENT_HIDDEN_PROJECT_FIELDS, ["notes", "budget", "agreementRevisions", "operatingEvents", "adoptionMappings", "linkedAgreementRevisionId", "cutoverDate", "phases"]);
  // Built on a real Mongoose query (not executed): what Mongoose will send to
  // MongoDB is an exclusion of exactly these two fields.
  const real = Project.findById(new mongoose.Types.ObjectId()).select({ ...CLIENT_PROJECT_PROJECTION });
  assert.deepEqual(real._fieldsForExec(), CLIENT_PROJECT_PROJECTION);
  const realList = Project.find({}).select({ ...CLIENT_PROJECT_PROJECTION }).sort("-createdAt").populate("customerId", "companyName");
  assert.deepEqual(realList._fieldsForExec(), CLIENT_PROJECT_PROJECTION);
});

test("client project detail has no internal notes or budget; permitted information remains", async () => {
  setupAuth({ users: [clientA], roles });
  const seen = stubProjects([projectDoc()]);
  const r = await call("GET", `/api/projects/${oid()}`, { user: clientA });
  assert.equal(r.status, 200);
  assert.deepEqual(seen.selects, [CLIENT_PROJECT_PROJECTION]);
  for (const key of CLIENT_HIDDEN_PROJECT_FIELDS) assert.equal(key in r.body.item, false, `${key} must not reach the client`);
  assert.equal("notes" in r.body.item, false);
  assert.equal("budget" in r.body.item, false);
  assert.doesNotMatch(JSON.stringify(r.body), /Internal only|180000/);
  assert.equal(r.body.item.name, "E-commerce relaunch");
  assert.equal(r.body.item.description, "Rebuild of the online store.");
  assert.equal(r.body.item.endDate, "2026-12-18");
  assert.equal(r.body.item.status, "active");
});

test("client project list has no internal notes or budget, and stays limited to the client's company", async () => {
  setupAuth({ users: [clientA], roles });
  const seen = stubProjects([projectDoc(), projectDoc({ name: "Loyalty app" })]);
  const r = await call("GET", "/api/projects", { user: clientA });
  assert.equal(r.status, 200);
  assert.equal(String(seen.filter.customerId), companyA);
  assert.equal(r.body.items.length, 2);
  for (const item of r.body.items) {
    assert.equal("notes" in item, false);
    assert.equal("budget" in item, false);
  }
});

test("a client's search does not look inside internal notes", async () => {
  setupAuth({ users: [clientA, pm], roles });
  const seen = stubProjects([]);
  await call("GET", "/api/projects?q=payment", { user: clientA });
  const clientFields = seen.filter.$or.map((c) => Object.keys(c)[0]);
  assert.equal(clientFields.includes("notes"), false);
  assert.ok(clientFields.includes("name"));
  await call("GET", "/api/projects?q=payment", { user: pm });
  assert.ok(seen.filter.$or.map((c) => Object.keys(c)[0]).includes("notes"));
});

test("staff with project access still receive notes and budget", async () => {
  setupAuth({ users: [pm], roles });
  const seen = stubProjects([projectDoc()]);
  const detail = await call("GET", `/api/projects/${oid()}`, { user: pm });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.item.budget, 180000);
  assert.match(detail.body.item.notes, /Internal only/);
  const list = await call("GET", "/api/projects", { user: pm });
  assert.equal(list.body.items[0].budget, 180000);
  assert.equal(seen.selects.length, 0); // no projection for staff
});

test("tenant isolation is unchanged: another company's project is refused", async () => {
  setupAuth({ users: [clientA], roles });
  stubProjects([projectDoc({ customerId: { _id: companyB, companyName: "Other Co" } })]);
  const r = await call("GET", `/api/projects/${oid()}`, { user: clientA });
  assert.equal(r.status, 403);
  assert.doesNotMatch(JSON.stringify(r.body || {}), /Other Co|Internal only|180000/);
});

// Confirmation for the project Billing tab (PUI-2 review item 5): the client
// invoice API keeps clients inside their own company. It ignores projectId
// for clients (recorded as a later API-consistency item), but never returns
// another company's invoices.
test("client invoice list is always scoped to the client's company, even if another company is requested", async () => {
  setupAuth({ users: [clientA], roles: { ...roles, client: { permissions: ["projects.read", "billing.read"] } } });
  const seen = {};
  stub(Invoice, "countDocuments", (f) => {
    seen.filter = f;
    return q(0);
  });
  stub(Invoice, "find", () => q([]));
  const r = await call("GET", `/api/billing/invoices?customerId=${companyB}&projectId=${oid()}`, { user: clientA });
  assert.equal(r.status, 200);
  assert.equal(String(seen.filter.customerId), companyA);
  assert.equal("projectId" in seen.filter, false); // known gap: projectId ignored for clients
});

test("client cannot open another company's invoice", async () => {
  setupAuth({ users: [clientA], roles: { ...roles, client: { permissions: ["projects.read", "billing.read"] } } });
  stub(Invoice, "findById", () => q({ _id: oid(), number: "INV-2026-0001", customerId: { _id: companyB, companyName: "Other Co" }, total: 999 }));
  const r = await call("GET", `/api/billing/invoices/${oid()}`, { user: clientA });
  assert.equal(r.status, 403);
  assert.doesNotMatch(JSON.stringify(r.body || {}), /Other Co|INV-2026-0001/);
});
