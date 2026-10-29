import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { signToken } from "../src/utils/jwt.js";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call, startApp } from "./helpers.js";
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

test("persisting a default system role keeps its fixed classification", async () => {
  setupAuth({ users: [admin] });
  stub(Role, "create", async (doc) => ({ _id: oid(), ...doc }));
  const r = await call("POST", "/api/roles", {
    user: admin,
    body: { key: "client", label: "Client", permissions: ["projects.read"], isInternal: true },
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.item.isInternal, false);
  assert.equal(r.body.item.isSystem, true);
});

test("admin cannot persist the admin role", async () => {
  setupAuth({ users: [admin] });
  stub(Role, "create", async (doc) => ({ _id: oid(), ...doc }));
  const r = await call("POST", "/api/roles", {
    user: admin,
    body: { key: "admin", label: "Admin", permissions: ["projects.read"] },
  });
  assert.equal(r.status, 403);
});

test("system status is super-admin only and reveals no secret values", async () => {
  setupAuth({ users: [admin, superAdmin] });
  assert.equal((await call("GET", "/api/admin/system-status")).status, 401);
  const denied = await call("GET", "/api/admin/system-status", { user: admin });
  assert.equal(denied.status, 403);
  const ok = await call("GET", "/api/admin/system-status", { user: superAdmin });
  assert.equal(ok.status, 200);
  // Only booleans plus environment names — no hosts, names, keys or URLs.
  const { environment, dbEnvironment, databaseConnected, configured } = ok.body;
  assert.deepEqual(Object.keys(ok.body).sort(), ["configured", "databaseConnected", "dbEnvironment", "environment", "ok"]);
  assert.equal(typeof environment, "string");
  assert.equal(typeof dbEnvironment, "string");
  assert.equal(typeof databaseConnected, "boolean");
  for (const [k, v] of Object.entries(configured)) assert.equal(typeof v, "boolean", k);
  assert.doesNotMatch(JSON.stringify(ok.body), /test-secret|mongodb|amazonaws|smtp\.|@/);
});


test("login authenticates the password, returns a safe current session, and rejects inactive or invalidated sessions", async () => {
  const account = { _id: oid(), fullName: "Login Example", email: "login@example.test", role: "staff", isActive: true, extraPermissions: [], revokedPermissions: [], passwordChangedAt: null, passwordHash: await bcrypt.hash("Local-test-password-42", 10) };
  account.comparePassword = User.prototype.comparePassword.bind(account);
  account.save = async () => account;
  setupAuth({ users: [account] });
  stub(User, "findOne", ({ email }) => q(email === account.email ? account : null));
  assert.equal((await call("POST", "/api/auth/login", { body: {} })).status, 400);
  assert.equal((await call("POST", "/api/auth/login", { body: { email: account.email, password: "incorrect" } })).status, 401);
  assert.equal((await call("POST", "/api/auth/login", { body: { email: "unknown@example.test", password: "Local-test-password-42" } })).status, 401);
  const result = await call("POST", "/api/auth/login", { body: { email: " LOGIN@EXAMPLE.TEST ", password: "Local-test-password-42" } });
  assert.equal(result.status, 200);
  assert.equal(result.body.user.role, "staff");
  assert.ok(Array.isArray(result.body.user.permissions));
  assert.equal(result.body.user.passwordHash, undefined);
  assert.ok(account.lastLoginAt instanceof Date);
  const base = await startApp();
  const current = () => fetch(`${base}/api/auth/me`, { headers: { authorization: `Bearer ${result.body.token}` } });
  assert.equal((await current()).status, 200);
  account.isActive = false;
  assert.equal((await current()).status, 401);
  assert.equal((await call("POST", "/api/auth/login", { body: { email: account.email, password: "Local-test-password-42" } })).status, 403);
  account.isActive = true;
  account.passwordChangedAt = new Date(Date.now() + 1000);
  assert.equal((await current()).status, 401);
});

test("force logout enforces permission and role hierarchy, then invalidates the target's previously signed session", async () => {
  const target = { _id: oid(), role: "staff", passwordChangedAt: null };
  setupAuth({ users: [admin, superAdmin, userManager, target], roles: { user_manager: { permissions: ["iam.users.write"], isInternal: true } } });
  let writes = 0;
  stub(User, "findByIdAndUpdate", (id, patch) => {
    assert.equal(String(id), target._id);
    writes++;
    Object.assign(target, patch);
    return q(target);
  });
  const endpoint = `/api/users/${target._id}/force-logout`;
  assert.equal((await call("POST", endpoint)).status, 401);
  assert.equal((await call("POST", endpoint, { user: target })).status, 403);
  assert.equal((await call("POST", endpoint, { user: userManager })).status, 403);
  assert.equal((await call("POST", `/api/users/${superAdmin._id}/force-logout`, { user: admin })).status, 403);
  assert.equal(writes, 0);
  const token = signToken({ id: target._id, role: "super_admin", iat: Math.floor(Date.now() / 1000) - 60 });
  const base = await startApp();
  const current = () => fetch(`${base}/api/auth/me`, { headers: { authorization: `Bearer ${token}` } });
  const before = await current();
  assert.equal(before.status, 200);
  assert.equal((await before.json()).user.role, "staff", "stored role overrides token claims");
  assert.equal((await call("POST", endpoint, { user: superAdmin })).status, 200);
  assert.equal(writes, 1);
  assert.ok(target.passwordChangedAt instanceof Date);
  assert.equal((await current()).status, 401);
});
