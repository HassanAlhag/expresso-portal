// R4-C (P2-2) REAL transaction tests against a replica-set MongoDB.
//
// Runs only when MONGO_TEST_URI is set, and only against a disposable local
// test database (localhost / 127.0.0.1, database name containing "test").
// It never reads MONGO_URI and drops only its own test database. Example:
//   mongod --replSet rs0 --bind_ip 127.0.0.1 --port 27999 --dbpath <tmp>
//   (then rs.initiate()), and
//   MONGO_TEST_URI="mongodb://127.0.0.1:27999/expresso_r4c_test?replicaSet=rs0" \
//     node --test test/r4c-crm-conversion.integration.test.js
import "./setup-env.js";
import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { setupAuth, restoreAll, stopApp, stub, oid, call } from "./helpers.js";
import Lead from "../src/modules/crm/leads/lead.model.js";
import Deal from "../src/modules/crm/deals/deal.model.js";
import Account from "../src/modules/crm/accounts/account.model.js";
import Contact from "../src/modules/crm/contacts/contact.model.js";
import Customer from "../src/modules/customers/customer.model.js";
import { resetTransactionSupportCache } from "../src/utils/transaction.js";

const URI = process.env.MONGO_TEST_URI || "";

function assertDisposableTestDatabase(uri) {
  const u = new URL(uri.replace(/^mongodb(\+srv)?:/, "http:"));
  const host = u.hostname;
  const db = decodeURIComponent(u.pathname.replace(/^\//, ""));
  if (!["127.0.0.1", "localhost", "::1"].includes(host)) throw new Error(`Refusing MONGO_TEST_URI on non-local host ${host}`);
  if (!/test/i.test(db)) throw new Error(`Refusing MONGO_TEST_URI database "${db}": its name must contain "test"`);
  return db;
}

const skip = URI ? false : "MONGO_TEST_URI not set (needs a local replica-set test database)";
const admin = { _id: oid(), role: "super_admin" };
const counts = async () => ({
  leads: await Lead.countDocuments(),
  deals: await Deal.countDocuments(),
  accounts: await Account.countDocuments(),
  contacts: await Contact.countDocuments(),
  customers: await Customer.countDocuments(),
});

before(async () => {
  if (skip) return;
  assertDisposableTestDatabase(URI);
  await mongoose.connect(URI, { autoIndex: true });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  assert.ok(hello.setName, "MONGO_TEST_URI must point at a replica set");
  await mongoose.connection.dropDatabase();
  for (const M of [Lead, Deal, Account, Contact, Customer]) await M.createCollection();
  await Customer.syncIndexes();
  resetTransactionSupportCache();
});
afterEach(async () => {
  restoreAll();
  if (skip) return;
  for (const M of [Lead, Deal, Account, Contact, Customer]) await M.deleteMany({});
});
after(async () => {
  await stopApp();
  if (skip) return;
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

const convertLead = (id) => call("POST", `/api/crm/leads/${id}/convert`, { user: admin, body: {} });
const convertDeal = (id) => call("POST", `/api/crm/deals/${id}/convert-to-customer`, { user: admin });
const newLead = () => Lead.create({ fullName: "Sara Example", companyName: "Example Trading", email: "sara@example.test", phone: "+971500000000", status: "new" });
const newDeal = () => Deal.create({ title: "Example Trading Opportunity", stage: "proposal", status: "open", email: "ops@example.test" });

// ═══ Lead → deal ═════════════════════════════════════════════════════════════
test("lead → deal: commits once; a retry returns the same deal and writes nothing; legacy field not written", { skip }, async () => {
  setupAuth({ users: [admin] });
  const lead = await newLead();
  const first = await convertLead(lead._id);
  assert.equal(first.status, 201);
  const dealId = String(first.body.item._id);
  const stored = await Lead.findById(lead._id).lean();
  assert.equal(stored.status, "converted");
  assert.equal(String(stored.convertedDealId), dealId);
  assert.equal(stored.convertedToDealId, null, "legacy link field is no longer written");
  assert.ok(stored.convertedToAccountId);
  const after1 = await counts();
  assert.deepEqual(after1, { leads: 1, deals: 1, accounts: 1, contacts: 1, customers: 0 });

  const again = await convertLead(lead._id);
  assert.equal(again.status, 200);
  assert.equal(again.body.alreadyConverted, true);
  assert.equal(String(again.body.item._id), dealId);
  assert.deepEqual(await counts(), after1, "retry writes nothing");
});

test("lead → deal ROLLBACK: a failure after the claim, account, contact and deal writes leaves nothing behind", { skip }, async () => {
  setupAuth({ users: [admin] });
  const lead = await newLead();
  const before = await counts();
  // Fail the last write of the transaction (after every create has run).
  stub(Lead, "updateOne", async () => { throw new Error("injected failure after deal creation"); });

  const r = await convertLead(lead._id);
  assert.equal(r.status, 500);
  assert.equal(r.body.ok, false);
  assert.match(r.body.message, /Nothing was saved/);

  assert.deepEqual(await counts(), before, "no deal, account or contact remains");
  const stored = await Lead.findById(lead._id).lean();
  assert.equal(stored.status, "new");
  assert.equal(stored.convertedDealId, null);
  assert.equal(stored.convertedAt, null);
  assert.equal(stored.convertedToAccountId, null);
});

test("lead → deal CONCURRENCY: two simultaneous conversions produce one deal", { skip }, async () => {
  setupAuth({ users: [admin] });
  const lead = await newLead();
  const [a, b] = await Promise.all([convertLead(lead._id), convertLead(lead._id)]);
  assert.deepEqual([a.status, b.status].sort(), [200, 201]);
  assert.equal(String(a.body.item._id), String(b.body.item._id), "both requests report the same deal");
  assert.equal(await Deal.countDocuments({ leadId: lead._id }), 1);
  assert.equal(await Account.countDocuments(), 1);
  assert.equal(await Contact.countDocuments(), 1);
});

// ═══ Deal → client ═══════════════════════════════════════════════════════════
test("deal → client: commits once, stores the created account on the deal; a retry returns the same client and writes nothing", { skip }, async () => {
  setupAuth({ users: [admin] });
  const deal = await newDeal();
  const first = await convertDeal(deal._id);
  assert.equal(first.status, 200);
  assert.notEqual(first.body.alreadyConverted, true);
  const customerId = String(first.body.customer._id);
  const stored = await Deal.findById(deal._id).lean();
  assert.equal(String(stored.customerId), customerId);
  assert.equal(stored.stage, "won", "existing behaviour kept");
  assert.ok(stored.accountId, "the account created by the conversion is stored on the deal");
  const account = await Account.findById(stored.accountId).lean();
  assert.equal(String(account.customerId), customerId);
  const after1 = await counts();
  assert.deepEqual(after1, { leads: 0, deals: 1, accounts: 1, contacts: 1, customers: 1 });

  const again = await convertDeal(deal._id);
  assert.equal(again.status, 200);
  assert.equal(again.body.alreadyConverted, true);
  assert.equal(String(again.body.customer._id), customerId);
  assert.deepEqual(await counts(), after1, "retry writes nothing");
});

test("deal → client ROLLBACK: a failure after the client and account are created leaves nothing behind", { skip }, async () => {
  setupAuth({ users: [admin] });
  const deal = await newDeal();
  const before = await counts();
  // Fail the last write (primary contact), after account and client creation.
  stub(Contact, "create", async () => { throw new Error("injected failure after client creation"); });

  const r = await convertDeal(deal._id);
  assert.equal(r.status, 500);
  assert.match(r.body.message, /Nothing was saved/);

  assert.deepEqual(await counts(), before, "no client, account or contact remains");
  const stored = await Deal.findById(deal._id).lean();
  assert.equal(stored.customerId, null);
  assert.equal(stored.accountId, null);
  assert.equal(stored.stage, "proposal");
  assert.equal(stored.convertedAt ?? null, null);
});

test("deal → client CONCURRENCY: two simultaneous conversions produce one client, one account and one contact", { skip }, async () => {
  setupAuth({ users: [admin] });
  const deal = await newDeal();
  const [a, b] = await Promise.all([convertDeal(deal._id), convertDeal(deal._id)]);
  assert.deepEqual([a.status, b.status], [200, 200]);
  assert.equal(String(a.body.customer._id), String(b.body.customer._id));
  assert.equal([a.body.alreadyConverted, b.body.alreadyConverted].filter(Boolean).length, 1);
  assert.equal(await Customer.countDocuments(), 1);
  assert.equal(await Account.countDocuments(), 1);
  assert.equal(await Contact.countDocuments(), 1);
});
