import "./setup-env.js";
import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupAuth, restoreAll, stopApp } from "./helpers.js";
import {
  resolveRoleContext,
  stripExternalDenied,
  SYSTEM_CLIENT_ROLES,
} from "../src/utils/roleRegistry.js";
import { DEFAULT_ROLE_PERMISSIONS } from "../src/config/permissions.js";

afterEach(restoreAll);
after(stopApp);

test("system internal roles resolve as internal", async () => {
  setupAuth();
  for (const role of ["admin", "staff", "finance", "hr_management", "project_manager"]) {
    const ctx = await resolveRoleContext(role);
    assert.equal(ctx.isInternal, true, role);
  }
});

test("client and vendor roles resolve as external", async () => {
  setupAuth();
  for (const role of [...SYSTEM_CLIENT_ROLES, "vendor"]) {
    const ctx = await resolveRoleContext(role);
    assert.equal(ctx.isInternal, false, role);
  }
});

test("default external role permissions are unchanged by the denylist", () => {
  for (const role of [...SYSTEM_CLIENT_ROLES, "vendor"]) {
    const defaults = DEFAULT_ROLE_PERMISSIONS[role];
    assert.deepEqual(stripExternalDenied(defaults), defaults, role);
  }
});

test("custom role flagged internal is internal (audit B8)", async () => {
  setupAuth({ roles: { designer: { permissions: ["projects.read"], isInternal: true } } });
  const ctx = await resolveRoleContext("designer");
  assert.equal(ctx.isInternal, true);
  assert.deepEqual(ctx.permissions, ["projects.read"]);
});

test("custom role without a flag is treated as external (fail safe)", async () => {
  setupAuth({ roles: { mystery: { permissions: ["projects.read"] } } });
  const ctx = await resolveRoleContext("mystery");
  assert.equal(ctx.isInternal, false);
});

test("external users never receive internal-only permissions (audit S6)", async () => {
  setupAuth({
    roles: { client: { permissions: ["projects.read", "crm.read", "hr.staff.read", "iam.users.read"] } },
  });
  const ctx = await resolveRoleContext("client", ["activity.read", "website.write"]);
  assert.deepEqual(ctx.permissions.sort(), ["projects.read"]);
});
