import { test, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { setupAuth, restoreAll, stopApp, stub, q, oid, call } from "./helpers.js";
import Project from "../src/modules/projects/project.model.js";

afterEach(restoreAll);
after(stopApp);

const clientA = oid();
const designer = { _id: oid(), role: "designer" };
const clientUser = { _id: oid(), role: "client", clientId: clientA };
const roles = { designer: { permissions: ["projects.read"], isInternal: true } };

function captureProjects() {
  const seen = {};
  stub(Project, "countDocuments", (f) => {
    seen.filter = f;
    return q(0);
  });
  stub(Project, "find", () => q([]));
  return seen;
}

test("custom internal role sees all clients' projects (audit B8)", async () => {
  setupAuth({ users: [designer, clientUser], roles });
  const seen = captureProjects();
  const r = await call("GET", "/api/projects", { user: designer });
  assert.equal(r.status, 200);
  assert.equal(seen.filter.customerId, undefined);
});

test("client user is limited to their own company's projects", async () => {
  setupAuth({ users: [designer, clientUser], roles });
  const seen = captureProjects();
  const r = await call("GET", "/api/projects", { user: clientUser });
  assert.equal(r.status, 200);
  assert.equal(String(seen.filter.customerId), clientA);
});

test("client role granted crm.read by an admin still cannot read CRM", async () => {
  setupAuth({
    users: [clientUser],
    roles: { client: { permissions: ["projects.read", "crm.read"] } },
  });
  const r = await call("GET", "/api/crm/leads", { user: clientUser });
  assert.equal(r.status, 403);
});
