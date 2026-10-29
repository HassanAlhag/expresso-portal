// PUI-3 boundaries on the customer endpoints behind the Clients screens:
// - a client user never receives the company record's internal notes or its
//   CRM account/deal links (CRM is internal);
// - a client user can list portal users of their own company only.
// Staff responses are unchanged; company isolation is unchanged.
import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { setupAuth, restoreAll, startApp, stopApp, stub, q, oid, call } from "./helpers.js";
import Customer from "../src/modules/customers/customer.model.js";
import User from "../src/modules/iam/users/user.model.js";
import { CLIENT_HIDDEN_CUSTOMER_FIELDS } from "../src/modules/customers/customers.controller.js";

before(startApp);
afterEach(restoreAll);
after(stopApp);

const companyA = oid();
const companyB = oid();
const pm = { _id: oid(), role: "project_manager" };
const clientAdminA = { _id: oid(), role: "client_admin", clientId: companyA };
const roles = {
  project_manager: { permissions: ["customers.read"], isInternal: true },
  client_admin: { permissions: ["customers.read"] },
};

function customerDoc(over = {}) {
  return {
    _id: companyA,
    companyName: "Acme Company",
    contactName: "Omar Saleh",
    primaryEmail: "omar@acme.example",
    isActive: true,
    department: "digital_agency",
    notes: "Internal: slow payer, escalate to finance.",
    crmAccountId: { _id: oid(), name: "Acme (CRM)" },
    crmDealId: { _id: oid(), title: "Store locator", stage: "proposal", value: 145000 },
    ...over,
  };
}

// Behaves like a Mongoose query for select()/populate(): records them and
// applies an inclusion field list to what it returns.
function selectingQuery(result, seen) {
  let keep = null;
  const c = {};
  for (const m of ["lean", "sort", "skip", "limit", "collation"]) c[m] = () => c;
  c.select = (arg) => {
    seen.selects.push(arg);
    keep = new Set(["_id", ...String(arg).split(/\s+/).filter(Boolean)]);
    return c;
  };
  c.populate = (path) => {
    seen.populated.push(path);
    return c;
  };
  const shape = (d) => (d && keep ? Object.fromEntries(Object.entries(d).filter(([k]) => keep.has(k))) : d);
  const value = () => (Array.isArray(result) ? result.map(shape) : shape(result));
  c.then = (res, rej) => Promise.resolve().then(value).then(res, rej);
  c.exec = () => Promise.resolve().then(value);
  return c;
}

function stubCustomers(docs) {
  const seen = { selects: [], populated: [], filter: null };
  stub(Customer, "findById", () => selectingQuery(docs[0], seen));
  stub(Customer, "find", (f) => {
    seen.filter = f;
    return selectingQuery(docs, seen);
  });
  stub(Customer, "countDocuments", () => q(docs.length));
  return seen;
}

test("the hidden fields are internal notes and the CRM links; the client field list is a valid inclusion", () => {
  assert.deepEqual(CLIENT_HIDDEN_CUSTOMER_FIELDS, ["notes", "crmAccountId", "crmDealId", "accountManagerId"]);
  const real = Customer.findById(new mongoose.Types.ObjectId()).select("companyName contactName isActive department");
  assert.deepEqual(real._fieldsForExec(), { companyName: 1, contactName: 1, isActive: 1, department: 1 });
});

test("client user's own company record has no internal notes or CRM links; contact details remain", async () => {
  setupAuth({ users: [clientAdminA], roles });
  const seen = stubCustomers([customerDoc()]);
  const r = await call("GET", `/api/customers/${companyA}`, { user: clientAdminA });
  assert.equal(r.status, 200);
  for (const f of CLIENT_HIDDEN_CUSTOMER_FIELDS) {
    assert.equal(seen.selects[0].split(" ").includes(f), false, `${f} must not be selected for clients`);
    assert.equal(f in r.body.item, false, `${f} must not be returned to clients`);
  }
  assert.deepEqual(seen.populated, []); // CRM documents are not even loaded
  assert.doesNotMatch(JSON.stringify(r.body), /slow payer|Store locator|145000|Acme \(CRM\)/);
  assert.equal(r.body.item.companyName, "Acme Company");
  assert.equal(r.body.item.primaryEmail, "omar@acme.example");
});

test("client user's company list has no internal notes and stays limited to their company", async () => {
  setupAuth({ users: [clientAdminA], roles });
  const seen = stubCustomers([customerDoc()]);
  const r = await call("GET", "/api/customers", { user: clientAdminA });
  assert.equal(r.status, 200);
  assert.equal(String(seen.filter._id), companyA);
  assert.equal(seen.selects[0].split(" ").includes("notes"), false);
  assert.equal("notes" in r.body.items[0], false);
});

test("staff still receive notes and the CRM links", async () => {
  setupAuth({ users: [pm], roles });
  const seen = stubCustomers([customerDoc()]);
  const r = await call("GET", `/api/customers/${companyA}`, { user: pm });
  assert.equal(r.status, 200);
  assert.match(r.body.item.notes, /slow payer/);
  assert.equal(r.body.item.crmDealId.title, "Store locator");
  assert.deepEqual(seen.populated, ["crmAccountId", "crmDealId"]);
  const list = await call("GET", "/api/customers", { user: pm });
  assert.match(list.body.items[0].notes, /slow payer/);
});

test("a client user cannot open another company's record", async () => {
  setupAuth({ users: [clientAdminA], roles });
  stubCustomers([customerDoc({ _id: companyB, companyName: "Other Co" })]);
  const r = await call("GET", `/api/customers/${companyB}`, { user: clientAdminA });
  assert.equal(r.status, 403);
  assert.doesNotMatch(JSON.stringify(r.body || {}), /Other Co|slow payer/);
});

test("a client user cannot list another company's portal users", async () => {
  setupAuth({ users: [clientAdminA], roles });
  let queried = false;
  stub(User, "find", () => {
    queried = true;
    return q([{ fullName: "Someone Else", email: "x@other.example" }]);
  });
  const r = await call("GET", `/api/customers/${companyB}/users`, { user: clientAdminA });
  assert.equal(r.status, 403);
  assert.equal(queried, false);
  assert.doesNotMatch(JSON.stringify(r.body || {}), /Someone Else|other\.example/);
});

test("a client user can list their own company's users; staff can list any company's", async () => {
  setupAuth({ users: [clientAdminA, pm], roles });
  const seen = [];
  stub(User, "find", (f) => {
    seen.push(String(f.clientId));
    return q([{ fullName: "Omar Saleh", email: "omar@acme.example" }]);
  });
  const own = await call("GET", `/api/customers/${companyA}/users`, { user: clientAdminA });
  assert.equal(own.status, 200);
  assert.equal(own.body.users.length, 1);
  const staff = await call("GET", `/api/customers/${companyB}/users`, { user: pm });
  assert.equal(staff.status, 200);
  assert.deepEqual(seen, [companyA, companyB]);
});
