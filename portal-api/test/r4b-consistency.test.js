// R4-B: P2-6 (site-settings reads never write) and P3-8 (one access-request
// status index; ticket comment author type includes vendors). Real Express
// app; model calls are stubbed (no database).
import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call } from "./helpers.js";
import SiteSettings from "../src/modules/homepage/settings.model.js";
import AccessRequest from "../src/modules/iam/access-requests/accessRequest.model.js";
import Ticket from "../src/modules/tickets/ticket.model.js";
import ProcurementVendor from "../src/modules/procurement/vendor.model.js";

afterEach(restoreAll);
after(stopApp);

// ═══ P2-6: site-settings reads never write ═══════════════════════════════════
const WRITES = ["create", "insertMany", "updateOne", "updateMany", "findOneAndUpdate", "findByIdAndUpdate", "replaceOne", "bulkWrite"];
function forbidWrites() {
  const attempts = [];
  for (const m of WRITES) stub(SiteSettings, m, (...args) => { attempts.push(m); throw new Error(`${m} must not run on a read`); });
  const save = SiteSettings.prototype.save;
  SiteSettings.prototype.save = function () { attempts.push("save"); throw new Error("save must not run on a read"); };
  return { attempts, restoreSave: () => { SiteSettings.prototype.save = save; } };
}
const superAdmin = { _id: oid(), role: "super_admin" };

test("P2-6 public GET with no settings document: 200, default shape, nothing written", async () => {
  setupAuth({ users: [] });
  stub(SiteSettings, "findById", () => q(null));
  const { attempts, restoreSave } = forbidWrites();
  try {
    const r = await call("GET", "/api/site-settings/public");
    assert.equal(r.status, 200);
    assert.equal(r.body.ok, true);
    assert.equal(r.body.settings._id, "site");
    assert.equal(r.body.settings.branding.logoUrl, "", "model defaults are returned");
    assert.equal(typeof r.body.settings.home, "object");
    assert.deepEqual(attempts, []);
  } finally { restoreSave(); }
});

test("P2-6 repeated public GETs still write nothing", async () => {
  setupAuth({ users: [] });
  let reads = 0;
  stub(SiteSettings, "findById", () => { reads += 1; return q(null); });
  const { attempts, restoreSave } = forbidWrites();
  try {
    for (let i = 0; i < 3; i += 1) assert.equal((await call("GET", "/api/site-settings/public")).status, 200);
    assert.equal(reads, 3);
    assert.deepEqual(attempts, []);
  } finally { restoreSave(); }
});

test("P2-6 authenticated settings GET with no document returns defaults and writes nothing", async () => {
  setupAuth({ users: [superAdmin] });
  stub(SiteSettings, "findById", () => q(null));
  const { attempts, restoreSave } = forbidWrites();
  try {
    const r = await call("GET", "/api/site-settings", { user: superAdmin });
    assert.equal(r.status, 200);
    assert.equal(r.body.settings._id, "site");
    assert.equal(r.body.settings.branding.logoUrl, "");
    assert.deepEqual(attempts, []);
  } finally { restoreSave(); }
});

test("P2-6 an existing document is returned as stored by both reads", async () => {
  setupAuth({ users: [superAdmin] });
  const stored = { _id: "site", branding: { logoUrl: "/uploads/logo.svg" }, home: { heroBannerUrl: "/uploads/hero.webp" } };
  stub(SiteSettings, "findById", () => q(stored));
  const { attempts, restoreSave } = forbidWrites();
  try {
    const pub = await call("GET", "/api/site-settings/public");
    const adm = await call("GET", "/api/site-settings", { user: superAdmin });
    assert.deepEqual(pub.body, { ok: true, settings: stored });
    assert.deepEqual(adm.body, { ok: true, settings: stored });
    assert.deepEqual(attempts, []);
  } finally { restoreSave(); }
});

test("P2-6 first and later admin PATCH upsert the same 'site' singleton with defaults on insert", async () => {
  setupAuth({ users: [superAdmin] });
  const calls = [];
  stub(SiteSettings, "findByIdAndUpdate", (id, update, options) => {
    calls.push({ id, update, options });
    return q({ _id: id, branding: { logoUrl: update.$set["branding.logoUrl"] || "" } });
  });
  const first = await call("PATCH", "/api/site-settings", { user: superAdmin, body: { section: "branding", data: { logoUrl: "/uploads/a.svg" } } });
  const later = await call("PATCH", "/api/site-settings", { user: superAdmin, body: { section: "branding", data: { logoUrl: "/uploads/b.svg" } } });
  assert.equal(first.status, 200);
  assert.equal(later.status, 200);
  assert.equal(calls.length, 2);
  for (const c of calls) {
    assert.equal(c.id, "site");
    assert.equal(c.options.upsert, true);
    assert.equal(c.options.setDefaultsOnInsert, true);
  }
  assert.deepEqual(calls[0].update, { $set: { "branding.logoUrl": "/uploads/a.svg" } });
  assert.deepEqual(calls[1].update, { $set: { "branding.logoUrl": "/uploads/b.svg" } });
});

// ═══ P3-8: one access-request status index ═══════════════════════════════════
test("P3-8 the access-request schema declares status, workEmail and createdAt indexes exactly once each", () => {
  const keys = AccessRequest.schema.indexes().map(([fields]) => JSON.stringify(fields));
  assert.equal(keys.filter((k) => k === '{"status":1}').length, 1);
  assert.equal(keys.filter((k) => k === '{"workEmail":1}').length, 1);
  assert.equal(keys.filter((k) => k === '{"createdAt":-1}').length, 1);
});

test("P3-8 loading the model in a fresh process gives no duplicate-index warning", () => {
  // Mongoose writes the warning to stderr, so check both streams.
  const run = spawnSync(process.execPath, [
    "--input-type=module",
    "-e",
    'await import("./src/modules/iam/access-requests/accessRequest.model.js"); console.log("loaded");',
  ], { cwd: new URL("..", import.meta.url), encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /loaded/);
  assert.doesNotMatch(`${run.stdout}${run.stderr}`, /Duplicate schema index/);
});

// ═══ P3-8: ticket comment author type ════════════════════════════════════════
const companyA = oid();
const companyB = oid();
const commenters = {
  superAdmin: { _id: oid(), role: "super_admin" },
  admin: { _id: oid(), role: "admin" },
  staff: { _id: oid(), role: "staff" },
  customInternal: { _id: oid(), role: "delivery_custom" },
  client: { _id: oid(), role: "client", clientId: companyA },
  otherClient: { _id: oid(), role: "client", clientId: companyB },
  vendor: { _id: oid(), role: "vendor" },
};
const ticketRoles = { delivery_custom: { permissions: ["tickets.read", "tickets.write"], isInternal: true } };

function ticketWorld({ type = "support", clientId = commenters.vendor._id } = {}) {
  setupAuth({ users: Object.values(commenters), roles: ticketRoles });
  const ticket = { _id: oid(), type, status: "open", customerId: companyA, clientId, comments: [], save: async () => ticket };
  ticket.toObject = () => ({ ...ticket });
  stub(Ticket, "findById", () => ticket);
  stub(ProcurementVendor, "findOne", (f) =>
    q(String(f.userId) === String(commenters.vendor._id) && f.isActive ? { _id: oid(), userId: commenters.vendor._id, isActive: true } : null));
  return ticket;
}
const comment = (who, ticket) => call("POST", `/api/tickets/${ticket._id}/comments`, { user: commenters[who], body: { body: "Hello" } });

test("P3-8 every internal user, including a custom internal role, is stored as admin", async () => {
  for (const who of ["superAdmin", "admin", "staff", "customInternal"]) {
    const ticket = ticketWorld();
    const r = await comment(who, ticket);
    assert.equal(r.status, 201, who);
    assert.equal(ticket.comments[0].authorRole, "admin", who);
  }
});

test("P3-8 a client user is stored as client", async () => {
  const ticket = ticketWorld({ clientId: commenters.client._id });
  assert.equal((await comment("client", ticket)).status, 201);
  assert.equal(ticket.comments[0].authorRole, "client");
  assert.equal(ticket.comments[0].visibility, "client");
});

test("P3-8 an approved vendor is stored as vendor (by active vendor profile)", async () => {
  const ticket = ticketWorld({ clientId: commenters.vendor._id });
  assert.equal((await comment("vendor", ticket)).status, 201);
  assert.equal(ticket.comments[0].authorRole, "vendor");
  assert.equal(ticket.comments[0].visibility, "client", "external comments stay client-visible");
});

test("P3-8 the comment schema accepts admin, client and vendor and rejects anything else", () => {
  const build = (authorRole) => new Ticket({
    title: "Sample", type: "support", clientId: oid(),
    comments: [{ body: "x", authorId: oid(), authorRole }],
  }).validateSync();
  for (const ok of ["admin", "client", "vendor"]) assert.equal(build(ok)?.errors?.["comments.0.authorRole"], undefined, ok);
  for (const bad of ["staff", "super_admin", "delivery_custom"]) assert.ok(build(bad)?.errors?.["comments.0.authorRole"], bad);
});

test("P3-8 status-change and approval entries are still recorded as admin", async () => {
  const ticket = ticketWorld();
  const s = await call("PATCH", `/api/tickets/${ticket._id}/status`, { user: commenters.staff, body: { status: "in_progress" } });
  assert.equal(s.status, 200);
  assert.ok(ticket.comments.length >= 1);
  assert.ok(ticket.comments.every((c) => c.authorRole === "admin"));
  const cr = ticketWorld({ type: "change_request" });
  const a = await call("PATCH", `/api/tickets/${cr._id}/approve`, { user: commenters.admin, body: { decision: "approved" } });
  assert.equal(a.status, 200);
  assert.ok(cr.comments.length >= 1 && cr.comments.every((c) => c.authorRole === "admin"));
});

test("P3-8 boundaries unchanged: another company's client and any external user on an internal ticket are refused", async () => {
  const ticket = ticketWorld({ clientId: commenters.client._id });
  assert.equal((await comment("otherClient", ticket)).status, 403);
  assert.equal(ticket.comments.length, 0);
  const internal = ticketWorld({ type: "internal", clientId: commenters.vendor._id });
  assert.equal((await comment("vendor", internal)).status, 403);
  assert.equal((await comment("client", internal)).status, 403);
  assert.equal(internal.comments.length, 0);
});
