// R4-C (P2-2) fast checks with stubbed models: every conversion read and write
// uses the transaction session, repeats write nothing, the canonical link field
// is written (the legacy one is not), failures never report success, and a
// standalone MongoDB is refused before any write. Real rollback is proven in
// r4c-crm-conversion.integration.test.js against a replica set.
import "./setup-env.js";
import { test, after, afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { setupAuth, restoreAll, stopApp, stub, oid, call } from "./helpers.js";
import Lead from "../src/modules/crm/leads/lead.model.js";
import Deal from "../src/modules/crm/deals/deal.model.js";
import Account from "../src/modules/crm/accounts/account.model.js";
import Contact from "../src/modules/crm/contacts/contact.model.js";
import Customer from "../src/modules/customers/customer.model.js";
import { resetTransactionSupportCache } from "../src/utils/transaction.js";

const SESSION = { id: "test-session" };
const admin = { _id: oid(), role: "super_admin" };
let log; // every model call: { op, session }
const originalDb = mongoose.connection.db;
const originalTransaction = mongoose.connection.transaction;

function topology({ replicaSet = true } = {}) {
  mongoose.connection.db = { admin: () => ({ command: async () => (replicaSet ? { setName: "rs0" } : { isWritablePrimary: true }) }) };
  mongoose.connection.transaction = async (fn) => {
    log.push({ op: "transaction" });
    return fn(SESSION);
  };
}
beforeEach(() => {
  log = [];
  resetTransactionSupportCache();
  topology();
  setupAuth({ users: [admin] });
});
afterEach(() => {
  restoreAll();
  mongoose.connection.db = originalDb;
  mongoose.connection.transaction = originalTransaction;
});
after(stopApp);

// A query stand-in that records the session it was given.
function qs(op, result) {
  const entry = { op, session: undefined };
  log.push(entry);
  const c = {};
  for (const m of ["select", "lean", "populate", "sort"]) c[m] = () => c;
  c.session = (s) => { entry.session = s; return c; };
  c.then = (res, rej) => Promise.resolve().then(() => (typeof result === "function" ? result() : result)).then(res, rej);
  return c;
}
const write = (op, result) => (...args) => {
  const opts = args.find((a) => a && typeof a === "object" && "session" in a);
  log.push({ op, session: opts?.session, args });
  if (result instanceof Error) throw result;
  return { lean: async () => result, then: (r, j) => Promise.resolve(result).then(r, j) };
};
const createWrite = (op, makeDoc) => async (docs, opts) => {
  const entry = { op, session: opts?.session, args: [docs] };
  log.push(entry);
  if (makeDoc instanceof Error) throw makeDoc;
  entry.created = docs.map((d) => ({ ...d, _id: d._id || oid(), toObject() { return { ...this }; } }));
  return entry.created;
};
const inTx = () => log.filter((e) => e.op !== "transaction" && !e.op.startsWith("post:"));
const assertAllInSession = () => {
  for (const e of inTx()) assert.equal(e.session, SESSION, `${e.op} must use the transaction session`);
};

// ═══ Lead → deal ═════════════════════════════════════════════════════════════
function leadWorld({ lead = { _id: oid(), fullName: "Sara", companyName: "Example", email: "s@example.test", status: "new" }, fail = null } = {}) {
  stub(Lead, "findById", () => qs("Lead.findById", lead));
  stub(Deal, "findById", (id) => qs(log.some((e) => e.op === "Deal.create") ? "post:Deal.findById" : "Deal.findById", null));
  stub(Deal, "findOne", () => qs("Deal.findOne", null));
  stub(Lead, "findOneAndUpdate", write("Lead.claim", fail === "claim" ? new Error("claim failed") : { ...lead, status: "converted" }));
  stub(Account, "findById", () => qs("Account.findById", null));
  stub(Account, "findOne", () => qs("Account.findOne", null));
  stub(Account, "create", createWrite("Account.create", fail === "account" ? new Error("account failed") : null));
  stub(Contact, "findOne", () => qs("Contact.findOne", null));
  stub(Contact, "create", createWrite("Contact.create", fail === "contact" ? new Error("contact failed") : null));
  stub(Deal, "create", createWrite("Deal.create", fail === "deal" ? new Error("deal failed") : null));
  stub(Lead, "updateOne", write("Lead.updateOne", fail === "link" ? new Error("link failed") : {}));
  return lead;
}

test("lead → deal: every read and write uses the transaction session; convertedDealId written, convertedToDealId not", async () => {
  const lead = leadWorld();
  const r = await call("POST", `/api/crm/leads/${lead._id}/convert`, { user: admin, body: {} });
  assert.equal(r.status, 201);
  assert.equal(log.filter((e) => e.op === "transaction").length, 1);
  assertAllInSession();
  const claim = log.find((e) => e.op === "Lead.claim");
  assert.deepEqual(claim.args[0], { _id: lead._id, convertedDealId: null, convertedToDealId: null });
  const claimSet = claim.args[1].$set;
  const deal = log.find((e) => e.op === "Deal.create").args[0][0];
  assert.equal(String(claimSet.convertedDealId), String(deal._id), "the claim links the deal that is created");
  for (const e of log.filter((x) => x.args)) assert.ok(!JSON.stringify(e.args).includes("convertedToDealId\":\""), "legacy field never written");
  assert.ok(!("convertedToDealId" in claimSet));
  assert.equal(String(r.body.item._id), String(deal._id));
});

test("lead → deal: an already-converted lead returns its deal and performs no business write", async () => {
  const dealId = oid();
  const lead = { _id: oid(), fullName: "Sara", convertedDealId: dealId, status: "converted" };
  stub(Lead, "findById", () => qs("Lead.findById", lead));
  stub(Deal, "findById", () => qs("Deal.findById", { _id: dealId, title: "Existing" }));
  for (const [M, m] of [[Lead, "findOneAndUpdate"], [Lead, "updateOne"], [Deal, "create"], [Account, "create"], [Contact, "create"]]) {
    stub(M, m, () => assert.fail(`${M.modelName}.${m} must not run for an already-converted lead`));
  }
  const r = await call("POST", `/api/crm/leads/${lead._id}/convert`, { user: admin, body: {} });
  assert.equal(r.status, 200);
  assert.equal(r.body.alreadyConverted, true);
  assert.equal(String(r.body.item._id), String(dealId));
});

test("lead → deal: older records linked only by the legacy field are treated as converted", async () => {
  const dealId = oid();
  const lead = { _id: oid(), fullName: "Sara", convertedToDealId: dealId, status: "converted" };
  stub(Lead, "findById", () => qs("Lead.findById", lead));
  stub(Deal, "findById", () => qs("Deal.findById", { _id: dealId }));
  stub(Lead, "findOneAndUpdate", () => assert.fail("no claim"));
  const r = await call("POST", `/api/crm/leads/${lead._id}/convert`, { user: admin, body: {} });
  assert.equal(r.status, 200);
  assert.equal(r.body.alreadyConverted, true);
});

for (const step of ["claim", "account", "contact", "deal", "link"]) {
  test(`lead → deal: a failure at the ${step} step is an error ("nothing saved"), never success`, async () => {
    const lead = leadWorld({ fail: step });
    const r = await call("POST", `/api/crm/leads/${lead._id}/convert`, { user: admin, body: {} });
    assert.equal(r.status, 500);
    assert.equal(r.body.ok, false);
    assert.match(r.body.message, /Nothing was saved/);
    assert.ok(!/part of it/i.test(r.body.message));
  });
}

test("lead → deal: a failed read-back after commit still reports the committed conversion", async () => {
  const lead = leadWorld();
  stub(Deal, "findById", () => {
    if (log.some((e) => e.op === "Deal.create")) throw new Error("read-back failed");
    return qs("Deal.findById", null);
  });
  const r = await call("POST", `/api/crm/leads/${lead._id}/convert`, { user: admin, body: {} });
  assert.equal(r.status, 201);
  assert.ok(r.body.item._id);
});

// ═══ Deal → client ═══════════════════════════════════════════════════════════
function dealWorld({ deal = { _id: oid(), title: "Example Opportunity", stage: "proposal", email: "ops@example.test" }, existingCustomer = null, fail = null } = {}) {
  stub(Deal, "findById", () => qs("Deal.findById", deal));
  stub(Customer, "findOne", (f) => qs(f?.slug ? "Customer.slugCheck" : "Customer.findOne", f?.slug ? null : existingCustomer));
  stub(Deal, "findOneAndUpdate", write("Deal.claim", fail === "claim" ? new Error("claim failed") : { ...deal }));
  stub(Account, "create", createWrite("Account.create", fail === "account" ? new Error("account failed") : null));
  stub(Deal, "updateOne", write("Deal.linkAccount", fail === "dealAccount" ? new Error("deal account failed") : {}));
  stub(Customer, "create", createWrite("Customer.create", fail === "customer" ? new Error("customer failed") : null));
  stub(Customer, "findByIdAndUpdate", write("Customer.update", { ...(existingCustomer || {}) }));
  stub(Account, "findByIdAndUpdate", write("Account.linkCustomer", fail === "accountLink" ? new Error("account link failed") : {}));
  stub(Contact, "findOne", () => qs("Contact.findOne", null));
  stub(Contact, "create", createWrite("Contact.create", fail === "contact" ? new Error("contact failed") : null));
  return deal;
}

test("deal → client: every read and write uses the session; the new account is stored on the deal; client gets the claimed id", async () => {
  const deal = dealWorld();
  const r = await call("POST", `/api/crm/deals/${deal._id}/convert-to-customer`, { user: admin });
  assert.equal(r.status, 200);
  assert.notEqual(r.body.alreadyConverted, true);
  assertAllInSession();
  const claim = log.find((e) => e.op === "Deal.claim");
  assert.deepEqual(claim.args[0], { _id: deal._id, customerId: null });
  assert.equal(claim.args[1].$set.stage, "won", "existing behaviour kept");
  const account = log.find((e) => e.op === "Account.create").created[0];
  const link = log.find((e) => e.op === "Deal.linkAccount");
  assert.ok(link, "the created account is stored on the deal");
  assert.deepEqual(link.args[0], { _id: deal._id });
  assert.equal(String(link.args[1].$set.accountId), String(account._id));
  const customer = log.find((e) => e.op === "Customer.create").args[0][0];
  assert.equal(String(customer._id), String(claim.args[1].$set.customerId));
  assert.ok(account.name);
});

test("deal → client: a deal that already has a client returns it and performs no business write", async () => {
  const customerId = oid();
  stub(Deal, "findById", () => qs("Deal.findById", { _id: oid(), customerId }));
  stub(Customer, "findById", () => qs("Customer.findById", { _id: customerId, companyName: "Example" }));
  for (const [M, m] of [[Deal, "findOneAndUpdate"], [Deal, "updateOne"], [Account, "create"], [Customer, "create"], [Customer, "findByIdAndUpdate"], [Account, "findByIdAndUpdate"], [Contact, "create"]]) {
    stub(M, m, () => assert.fail(`${M.modelName}.${m} must not run for an already-converted deal`));
  }
  const r = await call("POST", `/api/crm/deals/${oid()}/convert-to-customer`, { user: admin });
  assert.equal(r.status, 200);
  assert.equal(r.body.alreadyConverted, true);
  assert.equal(String(r.body.customer._id), String(customerId));
});

test("deal → client: a link to a client that no longer exists is a 409, not a new conversion", async () => {
  stub(Deal, "findById", () => qs("Deal.findById", { _id: oid(), customerId: oid() }));
  stub(Customer, "findById", () => qs("Customer.findById", null));
  stub(Deal, "findOneAndUpdate", () => assert.fail("no claim"));
  const r = await call("POST", `/api/crm/deals/${oid()}/convert-to-customer`, { user: admin });
  assert.equal(r.status, 409);
  assert.match(r.body.message, /Nothing was saved/);
});

for (const step of ["claim", "account", "dealAccount", "customer", "accountLink", "contact"]) {
  test(`deal → client: a failure at the ${step} step is an error ("nothing saved"), never success`, async () => {
    const deal = dealWorld({ fail: step });
    const r = await call("POST", `/api/crm/deals/${deal._id}/convert-to-customer`, { user: admin });
    assert.equal(r.status, 500);
    assert.equal(r.body.ok, false);
    assert.match(r.body.message, /Nothing was saved/);
  });
}

// ═══ Standalone MongoDB: refused before any write ════════════════════════════
test("a standalone MongoDB is refused with 503 before any conversion read or write (no fallback)", async () => {
  topology({ replicaSet: false });
  mongoose.connection.transaction = () => assert.fail("no transaction may start");
  for (const [M, m] of [[Lead, "findById"], [Lead, "findOneAndUpdate"], [Deal, "findById"], [Deal, "create"], [Deal, "findOneAndUpdate"], [Account, "create"], [Customer, "create"], [Contact, "create"]]) {
    stub(M, m, () => assert.fail(`${M.modelName}.${m} must not run without transaction support`));
  }
  const lead = await call("POST", `/api/crm/leads/${oid()}/convert`, { user: admin, body: {} });
  const deal = await call("POST", `/api/crm/deals/${oid()}/convert-to-customer`, { user: admin });
  for (const r of [lead, deal]) {
    assert.equal(r.status, 503);
    assert.equal(r.body.code, "TRANSACTIONS_UNSUPPORTED");
    assert.match(r.body.message, /Nothing was changed/);
    assert.ok(!/mongodb(\+srv)?:\/\//.test(r.body.message));
  }
});
