// R1/R3 closure regression tests: P1-2 (deleting a client-linked user) and
// P3-1 (reports.export removed from the catalogue). Real Express app; model
// calls are stubbed (no database).
import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call } from "./helpers.js";
import User from "../src/modules/iam/users/user.model.js";
import Audit from "../src/modules/iam/audit/audit.model.js";
import Customer from "../src/modules/customers/customer.model.js";
import Role from "../src/modules/iam/roles/role.model.js";
import { resolveRoleContext } from "../src/utils/roleRegistry.js";
import {
  ALL_PERMISSION_KEYS,
  VALID_PERMISSION_KEYS,
  DEFAULT_ROLE_PERMISSIONS,
} from "../src/config/permissions.js";

afterEach(restoreAll);
after(stopApp);

const mustNotWrite = (what) => () => assert.fail(`${what} must not be called when the request is rejected`);

// ═══ P1-2 DELETE A CLIENT-LINKED USER ═════════════════════════════════════════
const companyA = oid();
const sa1 = { _id: oid(), role: "super_admin", isActive: true };
const sa2 = { _id: oid(), role: "super_admin", isActive: true };
const admin = { _id: oid(), role: "admin", isActive: true };
const clientUser = { _id: oid(), role: "client", isActive: true, clientId: companyA, email: "owner@acme.test" };
const staffUser = { _id: oid(), role: "staff", isActive: true };
const roles = { admin: { permissions: ["iam.users.read", "iam.users.write", "iam.users.delete"], isInternal: true } };

function world(users, { activeSuperAdmins = [] } = {}) {
  setupAuth({ users, roles });
  stub(User, "countDocuments", (filter) => {
    assert.equal(filter.role, "super_admin");
    const excluded = String(filter._id?.$ne || "");
    return q(activeSuperAdmins.filter((u) => String(u._id) !== excluded).length);
  });
  const audits = [];
  stub(Audit, "create", async (doc) => {
    audits.push(doc);
    return doc;
  });
  const deleted = [];
  stub(User, "findByIdAndDelete", async (id) => {
    deleted.push(String(id));
    return {};
  });
  return { audits, deleted };
}

test("P1-2 deleting a client-linked user succeeds, unlinks the company owner and writes the audit entry", async () => {
  const { audits, deleted } = world([admin, clientUser]);
  const unlinks = [];
  stub(Customer, "updateOne", async (filter, update) => {
    unlinks.push({ filter, update });
    return { acknowledged: true, modifiedCount: 1 };
  });

  const r = await call("DELETE", `/api/users/${clientUser._id}`, { user: admin });

  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
  assert.deepEqual(deleted, [String(clientUser._id)]);
  assert.equal(unlinks.length, 1);
  assert.equal(String(unlinks[0].filter.ownerUserId), String(clientUser._id));
  assert.deepEqual(unlinks[0].update, { $unset: { ownerUserId: "" } });
  const entry = audits.find((a) => a.action === "user.deleted");
  assert.ok(entry, "user.deleted audit entry is written");
  assert.equal(String(entry.targetUserId), String(clientUser._id));
  assert.equal(entry.meta.email, "owner@acme.test");
  assert.equal(entry.meta.customerUnlinkFailed, undefined);
});

test("P1-2 deleting a user without a company does not touch customers and is audited", async () => {
  const { audits, deleted } = world([admin, staffUser]);
  stub(Customer, "updateOne", () => assert.fail("Customer.updateOne must not run for a user without clientId"));
  const r = await call("DELETE", `/api/users/${staffUser._id}`, { user: admin });
  assert.equal(r.status, 200);
  assert.deepEqual(deleted, [String(staffUser._id)]);
  assert.ok(audits.some((a) => a.action === "user.deleted" && String(a.targetUserId) === String(staffUser._id)));
});

test("P1-2 if the owner unlink fails after the delete, the response is still success and the audit records the failure", async () => {
  const { audits, deleted } = world([admin, clientUser]);
  stub(Customer, "updateOne", async () => {
    throw new Error("simulated customer write failure");
  });
  const r = await call("DELETE", `/api/users/${clientUser._id}`, { user: admin });
  assert.equal(r.status, 200, "a completed delete is not reported as a server error");
  assert.deepEqual(deleted, [String(clientUser._id)]);
  const entry = audits.find((a) => a.action === "user.deleted");
  assert.ok(entry);
  assert.equal(entry.meta.customerUnlinkFailed, true);
});

test("P1-2 a failed delete returns an error and writes no audit entry or unlink", async () => {
  const { audits } = world([admin, clientUser]);
  stub(User, "findByIdAndDelete", async () => {
    throw new Error("simulated delete failure");
  });
  stub(Customer, "updateOne", mustNotWrite("Customer.updateOne"));
  const r = await call("DELETE", `/api/users/${clientUser._id}`, { user: admin });
  assert.equal(r.status, 500);
  assert.equal(r.body.ok, false);
  assert.equal(audits.filter((a) => a.action === "user.deleted").length, 0);
});

test("P1-2 self-delete protection still applies", async () => {
  const { deleted, audits } = world([sa1, sa2], { activeSuperAdmins: [sa1, sa2] });
  stub(User, "findByIdAndDelete", mustNotWrite("User.findByIdAndDelete"));
  const r = await call("DELETE", `/api/users/${sa1._id}`, { user: sa1 });
  assert.equal(r.status, 400);
  assert.equal(deleted.length, 0);
  assert.equal(audits.filter((a) => a.action === "user.deleted").length, 0);
});

test("P1-2 last-super-admin protection still applies", async () => {
  world([sa1, sa2], { activeSuperAdmins: [sa2] });
  stub(User, "findByIdAndDelete", mustNotWrite("User.findByIdAndDelete"));
  const r = await call("DELETE", `/api/users/${sa2._id}`, { user: sa1 });
  assert.equal(r.status, 409);
});

test("P1-2 role hierarchy still applies: an admin cannot delete a super admin", async () => {
  world([admin, sa1, sa2], { activeSuperAdmins: [sa1, sa2] });
  stub(User, "findByIdAndDelete", mustNotWrite("User.findByIdAndDelete"));
  const r = await call("DELETE", `/api/users/${sa1._id}`, { user: admin });
  assert.equal(r.status, 403);
});

// ═══ P3-1 reports.export ═════════════════════════════════════════════════════
test("P3-1 reports.export is no longer an offered or valid permission, and no default role holds it", () => {
  assert.ok(!ALL_PERMISSION_KEYS.includes("reports.export"));
  assert.ok(!VALID_PERMISSION_KEYS.has?.("reports.export") && !(Array.isArray(VALID_PERMISSION_KEYS) && VALID_PERMISSION_KEYS.includes("reports.export")));
  for (const [role, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    assert.ok(!keys.includes("reports.export"), `${role} default must not include reports.export`);
  }
  assert.ok(ALL_PERMISSION_KEYS.includes("reports.read"), "reports.read is kept");
});

test("P3-1 the catalogue endpoint no longer lists reports.export", async () => {
  setupAuth({ users: [sa1] });
  const r = await call("GET", "/api/permissions/catalog", { user: sa1 });
  assert.equal(r.status, 200);
  assert.ok(!JSON.stringify(r.body).includes("reports.export"));
  assert.ok(JSON.stringify(r.body).includes("reports.read"));
});

test("P3-1 a stored role or user still holding reports.export resolves safely: the stale key is ignored, the rest is kept", async () => {
  stub(Role, "findOne", () => q({ key: "finance", permissions: ["billing.read", "reports.read", "reports.export"], isInternal: true }));
  const ctx = await resolveRoleContext("finance", ["reports.export"], []);
  assert.ok(ctx.permissions.includes("billing.read"));
  assert.ok(ctx.permissions.includes("reports.read"));
  assert.ok(!ctx.permissions.includes("reports.export"));
  assert.ok(!ctx.rolePermissions.includes("reports.export"));
});

test("P3-1 without a stored Role document, the finance default no longer includes reports.export", async () => {
  stub(Role, "findOne", () => q(null));
  const ctx = await resolveRoleContext("finance", [], []);
  assert.ok(ctx.permissions.includes("reports.read"));
  assert.ok(!ctx.permissions.includes("reports.export"));
});
