// Stage R2 — access model and vendor journey regression tests.
// Requests go through the real Express app, middleware and controllers; only
// model calls are stubbed (no database), as in R1.
import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call } from "./helpers.js";
import { resolveRoleContext, EXTERNAL_DENIED_PREFIXES } from "../src/utils/roleRegistry.js";
import { ALL_PERMISSION_KEYS, DEFAULT_ROLE_PERMISSIONS } from "../src/config/permissions.js";
import Role from "../src/modules/iam/roles/role.model.js";
import User from "../src/modules/iam/users/user.model.js";
import Invite from "../src/modules/iam/invites/invite.model.js";
import Project from "../src/modules/projects/project.model.js";
import RFQ from "../src/modules/procurement/rfq.model.js";
import Quotation from "../src/modules/procurement/quotation.model.js";
import ProcurementVendor from "../src/modules/procurement/vendor.model.js";
import VendorApplication from "../src/modules/procurement/vendor-application.model.js";

afterEach(restoreAll);
after(stopApp);

const mustNotWrite = (what) => () => assert.fail(`${what} must not be called`);
const POLICY_KEYS = ["projects.write", "projects.delete", "tickets.delete"];

// ═══ EXTERNAL-ROLE POLICY ════════════════════════════════════════════════════
test("policy: client/vendor roles can never hold project write/delete or ticket delete", async () => {
  for (const k of POLICY_KEYS) assert.ok(EXTERNAL_DENIED_PREFIXES.includes(k), `${k} must be external-denied`);
  // A stored client role that (wrongly) lists them: stripped at resolution.
  stub(Role, "findOne", () => q({ key: "client", permissions: ["projects.read", ...POLICY_KEYS, "tickets.write"], isInternal: false }));
  const ctx = await resolveRoleContext("client");
  assert.deepEqual(ctx.permissions.sort(), ["projects.read", "tickets.write"]);
  assert.equal(ctx.isInternal, false);
});

test("policy: an internal custom role keeps project write/delete and ticket delete", async () => {
  stub(Role, "findOne", () => q({ key: "delivery_lead", permissions: ["projects.read", ...POLICY_KEYS], isInternal: true }));
  const ctx = await resolveRoleContext("delivery_lead");
  for (const k of POLICY_KEYS) assert.ok(ctx.permissions.includes(k));
});

test("policy: no built-in client or vendor default includes the prohibited keys", () => {
  for (const role of ["client", "staff_client", "procurement_client", "client_admin", "vendor"]) {
    for (const k of POLICY_KEYS) assert.ok(!DEFAULT_ROLE_PERMISSIONS[role].includes(k), `${role} default holds ${k}`);
  }
});

const superAdmin = { _id: oid(), role: "super_admin" };

test("role admin: creating an external role with a prohibited permission is refused (even by super admin)", async () => {
  setupAuth({ users: [superAdmin] });
  stub(Role, "create", mustNotWrite("Role.create"));
  const r = await call("POST", "/api/roles", {
    user: superAdmin,
    body: { key: "client_editor", label: "Client editor", isInternal: false, permissions: ["projects.read", "projects.write"] },
  });
  assert.equal(r.status, 400);
  assert.deepEqual(r.body.denied, ["projects.write"]);
});

test("role admin: creating an internal custom role with the same permissions is allowed", async () => {
  setupAuth({ users: [superAdmin] });
  let created = null;
  stub(Role, "create", async (doc) => (created = { _id: oid(), ...doc }));
  const r = await call("POST", "/api/roles", {
    user: superAdmin,
    body: { key: "delivery_lead", label: "Delivery lead", isInternal: true, permissions: ["projects.read", ...POLICY_KEYS] },
  });
  assert.equal(r.status, 201);
  assert.deepEqual(created.permissions, ["projects.read", ...POLICY_KEYS]);
});

function storedRole(doc) {
  const role = { _id: oid(), label: doc.key, ...doc };
  stub(Role, "findById", () => q(role));
  return role;
}

test("role admin: adding ticket delete to an existing external role is refused", async () => {
  setupAuth({ users: [superAdmin] });
  const role = storedRole({ key: "client_plus", permissions: ["tickets.read"], isInternal: false });
  stub(Role, "findByIdAndUpdate", mustNotWrite("Role.findByIdAndUpdate"));
  const r = await call("PATCH", `/api/roles/${role._id}`, { user: superAdmin, body: { permissions: ["tickets.read", "tickets.delete"] } });
  assert.equal(r.status, 400);
  assert.deepEqual(r.body.denied, ["tickets.delete"]);
});

test("role admin: switching an internal role that holds project delete to external is refused", async () => {
  setupAuth({ users: [superAdmin] });
  const role = storedRole({ key: "ops_custom", permissions: ["projects.read", "projects.delete"], isInternal: true });
  stub(Role, "findByIdAndUpdate", mustNotWrite("Role.findByIdAndUpdate"));
  const r = await call("PATCH", `/api/roles/${role._id}`, { user: superAdmin, body: { isInternal: false } });
  assert.equal(r.status, 400);
  assert.deepEqual(r.body.denied, ["projects.delete"]);
});

test("role admin: editing an internal role to add these permissions still works", async () => {
  setupAuth({ users: [superAdmin] });
  const role = storedRole({ key: "ops_custom", permissions: ["projects.read"], isInternal: true });
  let patched = null;
  stub(Role, "findByIdAndUpdate", (_id, patch) => {
    patched = patch;
    return q({ ...role, ...patch });
  });
  const r = await call("PATCH", `/api/roles/${role._id}`, { user: superAdmin, body: { permissions: ["projects.read", ...POLICY_KEYS] } });
  assert.equal(r.status, 200);
  assert.deepEqual(patched.permissions, ["projects.read", ...POLICY_KEYS]);
});

const iamAdmin = { _id: oid(), role: "admin" };
const clientUser = { _id: oid(), role: "client", clientId: oid() };
const staffUser = { _id: oid(), role: "staff" };

test("user overrides: granting a client user project delete individually is refused", async () => {
  setupAuth({ users: [superAdmin, clientUser] });
  stub(User, "findByIdAndUpdate", mustNotWrite("User.findByIdAndUpdate"));
  const r = await call("PATCH", `/api/users/${clientUser._id}/permissions`, {
    user: superAdmin,
    body: { extraPermissions: ["projects.delete"], revokedPermissions: [] },
  });
  assert.equal(r.status, 400);
  assert.deepEqual(r.body.denied, ["projects.delete"]);
});

test("user overrides: granting a staff user project delete individually still works", async () => {
  setupAuth({ users: [superAdmin, staffUser] });
  let patched = null;
  stub(User, "findByIdAndUpdate", (_id, patch) => {
    patched = patch;
    return q({ ...staffUser, ...patch });
  });
  const r = await call("PATCH", `/api/users/${staffUser._id}/permissions`, {
    user: superAdmin,
    body: { extraPermissions: ["projects.delete"], revokedPermissions: [] },
  });
  assert.equal(r.status, 200);
  assert.deepEqual(patched.extraPermissions, ["projects.delete"]);
});

test("R1 boundary preserved: a client cannot reach project writes or ticket delete over the API", async () => {
  setupAuth({ users: [clientUser], roles: { client: { permissions: ["projects.read", ...POLICY_KEYS], isInternal: false } } });
  stub(Project, "create", mustNotWrite("Project.create"));
  const r = await call("POST", "/api/projects", { user: clientUser, body: { name: "x", customerId: clientUser.clientId } });
  assert.equal(r.status, 403);
  assert.deepEqual(r.body.missing, ["projects.write"]);
});

// ═══ EMPTY PERMISSION LIST = NO ACCESS ═══════════════════════════════════════
test("empty permissions: a stored built-in role with an explicit empty list grants nothing", async () => {
  stub(Role, "findOne", () => q({ key: "staff", permissions: [], isInternal: true }));
  const ctx = await resolveRoleContext("staff");
  assert.deepEqual(ctx.permissions, []);
  assert.equal(ctx.roleSource, "stored");
});

test("empty permissions: with no stored role document, built-in defaults apply", async () => {
  stub(Role, "findOne", () => q(null));
  const ctx = await resolveRoleContext("staff");
  assert.deepEqual(ctx.permissions.sort(), [...DEFAULT_ROLE_PERMISSIONS.staff].sort());
  assert.equal(ctx.roleSource, "default");
});

test("empty permissions: a stored list is authoritative (not merged with defaults)", async () => {
  stub(Role, "findOne", () => q({ key: "staff", permissions: ["projects.read"], isInternal: true }));
  const ctx = await resolveRoleContext("staff");
  assert.deepEqual(ctx.permissions, ["projects.read"]);
});

test("empty permissions: per-user extras still apply on top of an empty role", async () => {
  stub(Role, "findOne", () => q({ key: "staff", permissions: [], isInternal: true }));
  const ctx = await resolveRoleContext("staff", ["jobs.read"], []);
  assert.deepEqual(ctx.permissions, ["jobs.read"]);
});

test("empty permissions: a user on an emptied role is refused at the API", async () => {
  const u = { _id: oid(), role: "staff" };
  setupAuth({ users: [u], roles: { staff: { permissions: [], isInternal: true } } });
  stub(Project, "find", mustNotWrite("Project.find"));
  const r = await call("GET", "/api/projects", { user: u });
  assert.equal(r.status, 403);
});

test("empty permissions: the roles list shows a stored empty role as empty, not as defaults", async () => {
  setupAuth({ users: [superAdmin] });
  stub(Role, "countDocuments", () => q(1));
  stub(Role, "find", () => q([{ _id: oid(), key: "staff", label: "Staff", permissions: [], isSystem: true, isInternal: true }]));
  const r = await call("GET", "/api/roles", { user: superAdmin });
  assert.equal(r.status, 200);
  const staff = r.body.items.find((i) => i.key === "staff");
  assert.deepEqual(staff.permissions, []);
});

// ═══ PERMISSION CATALOGUE (single source) ════════════════════════════════════
test("catalogue: the API serves all 78 keys (76 baseline plus 2 Operating Model keys), including the 8 the portal copy was missing", async () => {
  const u = { _id: oid(), role: "staff" };
  setupAuth({ users: [u] });
  const r = await call("GET", "/api/permissions/catalog", { user: u });
  assert.equal(r.status, 200);
  const keys = r.body.catalog.flatMap((d) => d.permissions.map((p) => p.key));
  assert.equal(keys.length, 78);
  assert.ok(keys.includes("jobs.approve"));
  assert.ok(keys.includes("delivery.override"));
  assert.equal(new Set(keys).size, 78);
  assert.deepEqual(r.body.allKeys, ALL_PERMISSION_KEYS);
  for (const k of ["messaging.read", "messaging.write", "brand_kit.read", "brand_kit.write", "social.metrics.read", "social.metrics.write", "hr.kpi.read", "hr.kpi.write"]) {
    assert.ok(keys.includes(k), `${k} missing from catalogue`);
  }
  assert.deepEqual(r.body.externalDeniedPrefixes, EXTERNAL_DENIED_PREFIXES);
});

test("catalogue: every default-role key exists in the catalogue; project_manager and staff include iam.users.read", async () => {
  const u = { _id: oid(), role: "staff" };
  setupAuth({ users: [u] });
  const r = await call("GET", "/api/permissions/catalog", { user: u });
  const keys = new Set(r.body.allKeys);
  for (const [role, perms] of Object.entries(r.body.defaults)) {
    for (const p of perms) assert.ok(keys.has(p), `${role} default ${p} not in catalogue`);
  }
  assert.ok(r.body.defaults.project_manager.includes("iam.users.read"));
  assert.ok(r.body.defaults.staff.includes("iam.users.read"));
});

test("effective permissions: preview uses the stored role, extras and revokes, and strips external-denied keys", async () => {
  const target = { _id: oid(), role: "client", clientId: oid(), extraPermissions: ["projects.delete", "brand_kit.write"], revokedPermissions: ["billing.read"] };
  setupAuth({ users: [superAdmin, target], roles: { client: { permissions: ["projects.read", "billing.read", "messaging.read"], isInternal: false } } });
  const r = await call("GET", `/api/users/${target._id}/effective-permissions`, { user: superAdmin });
  assert.equal(r.status, 200);
  assert.equal(r.body.roleSource, "stored");
  assert.equal(r.body.isInternal, false);
  assert.deepEqual(r.body.effective, ["brand_kit.write", "messaging.read", "projects.read"]);
});

test("effective permissions: built-in role without a stored document previews the defaults", async () => {
  const target = { _id: oid(), role: "project_manager" };
  setupAuth({ users: [superAdmin, target] });
  const r = await call("GET", `/api/users/${target._id}/effective-permissions`, { user: superAdmin });
  assert.equal(r.body.roleSource, "default");
  assert.ok(r.body.effective.includes("iam.users.read"));
  assert.ok(r.body.effective.includes("messaging.read"));
});

test("effective permissions: needs iam.users.read", async () => {
  const target = { _id: oid(), role: "staff" };
  const viewer = { _id: oid(), role: "viewer" };
  setupAuth({ users: [viewer, target], roles: { viewer: { permissions: ["projects.read"], isInternal: true } } });
  const r = await call("GET", `/api/users/${target._id}/effective-permissions`, { user: viewer });
  assert.equal(r.status, 403);
});

// ═══ VENDOR RFQ ACCESS ═══════════════════════════════════════════════════════
const catA = oid();
const catB = oid();
const vendorUser = { _id: oid(), role: "vendor" };
const otherVendorUser = { _id: oid(), role: "vendor" };
const unapprovedVendor = { _id: oid(), role: "vendor" };
const procurementClient = { _id: oid(), role: "procurement_client", clientId: oid() };
const buyer = { _id: oid(), role: "procurement_manager" };
const vendorProfile = { _id: oid(), userId: vendorUser._id, categories: [catA], isActive: true };
const otherVendorProfile = { _id: oid(), userId: otherVendorUser._id, categories: [catA], isActive: true };

const rfqs = {
  published: { _id: oid(), title: "Published A", status: "published", subcategoryIds: [catA], requestId: oid(), createdBy: oid() },
  otherCategory: { _id: oid(), title: "Published B", status: "published", subcategoryIds: [catB] },
  draft: { _id: oid(), title: "Draft A", status: "draft", subcategoryIds: [catA] },
  closed: { _id: oid(), title: "Closed A", status: "closed", subcategoryIds: [catA] },
};
const quotes = [
  { _id: oid(), rfqId: rfqs.published._id, vendorId: vendorProfile._id, price: 100, status: "submitted" },
  { _id: oid(), rfqId: rfqs.published._id, vendorId: otherVendorProfile._id, price: 90, status: "submitted" },
];

function vendorWorld() {
  setupAuth({ users: [vendorUser, otherVendorUser, unapprovedVendor, procurementClient, buyer] });
  stub(ProcurementVendor, "findOne", (f) =>
    q([vendorProfile, otherVendorProfile].find((v) => String(v.userId) === String(f.userId) && f.isActive === true) || null)
  );
  const seen = { selects: [] };
  const chain = (result) => {
    const c = q(result);
    c.select = (fields) => {
      seen.selects.push(fields);
      return c;
    };
    return c;
  };
  const all = Object.values(rfqs);
  const matches = (f, r) =>
    (!f.status || r.status === f.status) &&
    (!f.subcategoryIds || r.subcategoryIds.some((c) => f.subcategoryIds.$in.map(String).includes(String(c))));
  stub(RFQ, "find", (f) => {
    seen.listFilter = f;
    return chain(all.filter((r) => matches(f, r)));
  });
  stub(RFQ, "countDocuments", (f) => q(all.filter((r) => matches(f, r)).length));
  stub(RFQ, "findById", (id) => chain(all.find((r) => String(r._id) === String(id)) || null));
  const qMatch = (f, x) => String(x.rfqId) === String(f.rfqId?.$in ? x.rfqId : f.rfqId) && (!f.vendorId || String(x.vendorId) === String(f.vendorId));
  stub(Quotation, "find", (f) => {
    seen.quoteFilter = f;
    const rfqIds = f.rfqId?.$in ? f.rfqId.$in.map(String) : [String(f.rfqId)];
    return q(quotes.filter((x) => rfqIds.includes(String(x.rfqId)) && (!f.vendorId || String(x.vendorId) === String(f.vendorId))));
  });
  stub(Quotation, "findOne", (f) => q(quotes.find((x) => qMatch(f, x)) || null));
  return seen;
}

test("vendor RFQ: approved vendor sees only published RFQs in their approved categories", async () => {
  const seen = vendorWorld();
  const r = await call("GET", "/api/procurement/rfqs?status=draft", { user: vendorUser });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.items.map((i) => i.title), ["Published A"]);
  assert.equal(seen.listFilter.status, "published");
  assert.ok(seen.selects.some((s) => /rfqNumber/.test(s) && !/requestId|createdBy/.test(s)), "vendor list must use the vendor-safe field list");
});

test("vendor RFQ: published RFQ in an approved category is visible, with the vendor's own quotation", async () => {
  vendorWorld();
  const r = await call("GET", `/api/procurement/rfqs/${rfqs.published._id}`, { user: vendorUser });
  assert.equal(r.status, 200);
  assert.equal(String(r.body.item.myQuotation._id), String(quotes[0]._id));
});

test("vendor RFQ: RFQ outside the vendor's approved categories is hidden", async () => {
  vendorWorld();
  assert.equal((await call("GET", `/api/procurement/rfqs/${rfqs.otherCategory._id}`, { user: vendorUser })).status, 404);
});

test("vendor RFQ: draft RFQ is not exposed, even in a matching category", async () => {
  vendorWorld();
  assert.equal((await call("GET", `/api/procurement/rfqs/${rfqs.draft._id}`, { user: vendorUser })).status, 404);
});

test("vendor RFQ: closed RFQ is hidden unless the vendor quoted on it", async () => {
  vendorWorld();
  assert.equal((await call("GET", `/api/procurement/rfqs/${rfqs.closed._id}`, { user: vendorUser })).status, 404);
  quotes.push({ _id: oid(), rfqId: rfqs.closed._id, vendorId: vendorProfile._id, price: 1, status: "submitted" });
  try {
    assert.equal((await call("GET", `/api/procurement/rfqs/${rfqs.closed._id}`, { user: vendorUser })).status, 200);
  } finally {
    quotes.pop();
  }
});

test("vendor RFQ: a vendor user without an approved, active vendor profile is denied", async () => {
  vendorWorld();
  assert.equal((await call("GET", "/api/procurement/rfqs", { user: unapprovedVendor })).status, 403);
  assert.equal((await call("GET", `/api/procurement/rfqs/${rfqs.published._id}`, { user: unapprovedVendor })).status, 403);
});

test("vendor RFQ: a client with procurement.read cannot read RFQs", async () => {
  vendorWorld();
  assert.equal((await call("GET", "/api/procurement/rfqs", { user: procurementClient })).status, 403);
});

test("vendor quotations: a vendor sees only their own quotation, never another vendor's", async () => {
  const seen = vendorWorld();
  const r = await call("GET", `/api/procurement/rfqs/${rfqs.published._id}/quotations`, { user: vendorUser });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.items.map((x) => String(x._id)), [String(quotes[0]._id)]);
  assert.equal(String(seen.quoteFilter.vendorId), String(vendorProfile._id));
  const other = await call("GET", `/api/procurement/rfqs/${rfqs.published._id}/quotations`, { user: otherVendorUser });
  assert.deepEqual(other.body.items.map((x) => String(x._id)), [String(quotes[1]._id)]);
});

test("vendor quotations: matched-vendor lists and quotation decisions stay staff-only", async () => {
  vendorWorld();
  assert.equal((await call("GET", `/api/procurement/rfqs/${rfqs.published._id}/matched-vendors`, { user: vendorUser })).status, 403);
  assert.equal((await call("PATCH", `/api/procurement/rfqs/quotations/${quotes[1]._id}/status`, { user: vendorUser, body: { status: "accepted" } })).status, 403);
});

test("vendor quotations: approved vendor can quote on a matching published RFQ; others cannot", async () => {
  vendorWorld();
  stub(RFQ, "findById", (id) => q(Object.values(rfqs).find((r) => String(r._id) === String(id)) || null));
  stub(Quotation, "findOne", () => q(null));
  let upserted = null;
  stub(Quotation, "findOneAndUpdate", (filter, doc) => {
    upserted = { filter, doc };
    return q({ _id: oid(), ...doc });
  });
  const ok = await call("POST", `/api/procurement/rfqs/${rfqs.published._id}/quotations`, { user: vendorUser, body: { price: 50 } });
  assert.equal(ok.status, 201);
  assert.equal(String(upserted.filter.vendorId), String(vendorProfile._id));
  assert.equal((await call("POST", `/api/procurement/rfqs/${rfqs.otherCategory._id}/quotations`, { user: vendorUser, body: { price: 50 } })).status, 403);
  assert.equal((await call("POST", `/api/procurement/rfqs/${rfqs.published._id}/quotations`, { user: unapprovedVendor, body: { price: 50 } })).status, 403);
  assert.equal((await call("POST", `/api/procurement/rfqs/${rfqs.published._id}/quotations`, { user: buyer, body: { price: 50 } })).status, 403);
});

test("vendor RFQ: internal procurement staff keep full access (all statuses, all quotations)", async () => {
  const seen = vendorWorld();
  const list = await call("GET", "/api/procurement/rfqs?status=draft", { user: buyer });
  assert.equal(list.status, 200);
  assert.deepEqual(list.body.items.map((i) => i.title), ["Draft A"]);
  assert.ok(!seen.selects.length, "staff list is not restricted to vendor fields");
  assert.equal((await call("GET", `/api/procurement/rfqs/${rfqs.draft._id}`, { user: buyer })).status, 200);
  const quotesRes = await call("GET", `/api/procurement/rfqs/${rfqs.published._id}/quotations`, { user: buyer });
  assert.equal(quotesRes.body.items.length, 2);
});

// ═══ VENDOR APPROVAL → INVITATION → ACCEPTANCE ═════════════════════════════
// Approval, invitation wording, acceptance, concurrency and retry are covered
// in r2-vendor-approval.test.js, r2-vendor-acceptance.test.js and
// r2-vendor-acceptance-guards.test.js.

test("vendor invitation: the token is never written to the request log", async () => {
  setupAuth({});
  stub(Invite, "findOne", () => q({ _id: oid(), status: "accepted", expiresAt: new Date(Date.now() + 86400000) }));
  stub(User, "create", mustNotWrite("User.create"));
  const written = [];
  const orig = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk, ...rest) => {
    written.push(String(chunk));
    return orig(chunk, ...rest);
  };
  try {
    await call("POST", "/api/invites/accept", { body: { token: "VENDOR-SECRET-TOKEN", password: "a-strong-password" } });
    await call("GET", "/api/invites/verify?token=VENDOR-SECRET-TOKEN");
    await new Promise((r) => setTimeout(r, 50));
  } finally {
    process.stdout.write = orig;
  }
  assert.ok(!written.join("").includes("VENDOR-SECRET-TOKEN"));
});
