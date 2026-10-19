import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call } from "./helpers.js";
import User from "../src/modules/iam/users/user.model.js";
import Role from "../src/modules/iam/roles/role.model.js";

afterEach(restoreAll);
after(stopApp);

const admin = { _id: oid(), role: "admin" };
const otherAdmin = { _id: oid(), role: "admin" };
const staff = { _id: oid(), role: "staff" };
const superAdmin = { _id: oid(), role: "super_admin" };
const userManager = { _id: oid(), role: "user_manager" };

function stubUpdate() {
  let patch = null;
  stub(User, "findByIdAndUpdate", (_id, p) => {
    patch = p;
    return q({ _id, ...p });
  });
  return () => patch;
}

test("admin cannot change their own permissions (audit S4)", async () => {
  setupAuth({ users: [admin, staff] });
  stubUpdate();
  const r = await call("PATCH", `/api/users/${admin._id}/permissions`, {
    user: admin,
    body: { extraPermissions: ["iam.users.delete"] },
  });
  assert.equal(r.status, 403);
});

test("admin cannot edit another admin's permissions", async () => {
  setupAuth({ users: [admin, otherAdmin] });
  stubUpdate();
  const r = await call("PATCH", `/api/users/${otherAdmin._id}/permissions`, {
    user: admin,
    body: { revokedPermissions: ["billing.read"] },
  });
  assert.equal(r.status, 403);
});

test("admin cannot grant a permission they do not hold", async () => {
  setupAuth({ users: [admin, staff] });
  stubUpdate();
  const r = await call("PATCH", `/api/users/${staff._id}/permissions`, {
    user: admin,
    body: { extraPermissions: ["iam.users.delete"] },
  });
  assert.equal(r.status, 403);
  assert.deepEqual(r.body.missing, ["iam.users.delete"]);
});

test("admin can grant a permission they hold to staff", async () => {
  setupAuth({ users: [admin, staff] });
  const patch = stubUpdate();
  const r = await call("PATCH", `/api/users/${staff._id}/permissions`, {
    user: admin,
    body: { extraPermissions: ["billing.write"] },
  });
  assert.equal(r.status, 200);
  assert.deepEqual(patch().extraPermissions, ["billing.write"]);
});

test("custom role holding iam.users.write still cannot escalate", async () => {
  setupAuth({
    users: [userManager, staff],
    roles: { user_manager: { permissions: ["iam.users.read", "iam.users.write"], isInternal: true } },
  });
  stubUpdate();
  const r = await call("PATCH", `/api/users/${userManager._id}/permissions`, {
    user: userManager,
    body: { extraPermissions: ["iam.roles.write"] },
  });
  assert.equal(r.status, 403);
});

test("only super admin may edit the admin role", async () => {
  setupAuth({ users: [admin, superAdmin] });
  const roleId = oid();
  stub(Role, "findById", () => q({ _id: roleId, key: "admin", isSystem: true, permissions: [] }));
  stub(Role, "findByIdAndUpdate", (_id, p) => q({ _id, key: "admin", ...p }));
  const denied = await call("PATCH", `/api/roles/${roleId}`, {
    user: admin,
    body: { permissions: ["iam.users.delete"] },
  });
  assert.equal(denied.status, 403);
  const allowed = await call("PATCH", `/api/roles/${roleId}`, {
    user: superAdmin,
    body: { label: "Admin" },
  });
  assert.equal(allowed.status, 200);
});

test("a system client role cannot be switched to internal", async () => {
  setupAuth({ users: [superAdmin] });
  const roleId = oid();
  stub(Role, "findById", () => q({ _id: roleId, key: "client", isSystem: true, permissions: [] }));
  stub(Role, "findByIdAndUpdate", (_id, p) => q({ _id, key: "client", ...p }));
  const r = await call("PATCH", `/api/roles/${roleId}`, {
    user: superAdmin,
    body: { isInternal: true },
  });
  assert.equal(r.status, 403);
});

test("creating a role requires an explicit internal/external choice", async () => {
  setupAuth({ users: [superAdmin] });
  stub(Role, "create", async (doc) => ({ _id: oid(), ...doc }));
  const missing = await call("POST", "/api/roles", {
    user: superAdmin,
    body: { key: "designer", label: "Designer", permissions: ["projects.read"] },
  });
  assert.equal(missing.status, 400);
  const ok = await call("POST", "/api/roles", {
    user: superAdmin,
    body: { key: "designer", label: "Designer", permissions: ["projects.read"], isInternal: true },
  });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.item.isInternal, true);
});
